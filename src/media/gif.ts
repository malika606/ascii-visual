import {MAX_GIF_PIXELS,MAX_GIF_FRAMES,MAX_GIF_DECODED_BYTES,validateDimensions} from './validation.ts';
export interface GifFrame {rgba:Uint8ClampedArray;delay:number;end:number}
export interface DecodedGif {width:number;height:number;frames:GifFrame[];duration:number}
class Reader {
  pos=0; private data:Uint8Array; constructor(data:Uint8Array){this.data=data;}
  byte(){if(this.pos>=this.data.length)throw Error('Truncated GIF.');return this.data[this.pos++];}
  word(){return this.byte()|this.byte()<<8;}
  take(n:number){if(this.pos+n>this.data.length)throw Error('Truncated GIF.');const r=this.data.subarray(this.pos,this.pos+n);this.pos+=n;return r;}
  blocks(){const chunks:Uint8Array[]=[];let total=0;for(let n=this.byte();n;n=this.byte()){chunks.push(this.take(n));total+=n;}const r=new Uint8Array(total);let off=0;for(const c of chunks){r.set(c,off);off+=c.length;}return r;}
}
// GIF LZW: least-significant-bit first; dictionary resets on clear code.
export function decodeLzw(input:Uint8Array,min:number,expected:number):Uint8Array {
  if(min<2||min>8)throw Error('Invalid GIF LZW code size.');
  const clear=1<<min,end=clear+1, prefix=new Int16Array(4096),suffix=new Uint8Array(4096),stack=new Uint8Array(4097),out=new Uint8Array(expected);
  let size=min+1,next=end+1,old=-1,first=0,bit=0,off=0;
  while(bit+size<=input.length*8){let code=0;for(let i=0;i<size;i++,bit++)code|=((input[bit>>3]>>(bit&7))&1)<<i;
    if(code===clear){size=min+1;next=end+1;old=-1;continue;}if(code===end)break;
    if(code>next||code>=4096||(old<0&&code>=clear))throw Error('Invalid GIF LZW stream.');
    const original=code;let top=0;
    if(code===next){if(old<0)throw Error('Invalid GIF LZW reference.');stack[top++]=first;code=old;}
    while(code>=clear){if(code<=end||code>=next||top>=4096)throw Error('Invalid GIF LZW dictionary.');stack[top++]=suffix[code];code=prefix[code];}
    first=code;stack[top++]=first;
    while(top){if(off>=expected)throw Error('GIF frame has excess pixels.');out[off++]=stack[--top];}
    if(old>=0&&next<4096){prefix[next]=old;suffix[next]=first;next++;if(next===(1<<size)&&size<12)size++;}
    old=original;
  }
  if(off!==expected)throw Error('Incomplete GIF frame.');return out;
}
export function decodeGif(buffer:ArrayBuffer):DecodedGif {
  const r=new Reader(new Uint8Array(buffer)),header=String.fromCharCode(...r.take(6));if(header!=='GIF87a'&&header!=='GIF89a')throw Error('Invalid GIF signature.');
  const width=r.word(),height=r.word();validateDimensions(width,height,MAX_GIF_PIXELS);
  const flags=r.byte(),backgroundIndex=r.byte();r.byte();const global=flags&128?r.take(3*(1<<((flags&7)+1))):null;
  const background=global&&backgroundIndex*3+2<global.length?[global[backgroundIndex*3],global[backgroundIndex*3+1],global[backgroundIndex*3+2],255]:[0,0,0,0];
  let screen=new Uint8ClampedArray(width*height*4),duration=0,delay=100,disposal=0,transparent=-1;const frames:GifFrame[]=[];
  const fill=(left:number,top:number,w:number,h:number,color:number[])=>{for(let y=top;y<top+h;y++)for(let x=left;x<left+w;x++)screen.set(color,(y*width+x)*4);};
  let trailer=false;
  while(true){const marker=r.byte();if(marker===0x3b){trailer=true;break;}
    if(marker===0x21){const type=r.byte();if(type===0xf9){if(r.byte()!==4)throw Error('Invalid GIF control block.');const f=r.byte();disposal=(f>>2)&7;delay=Math.max(20,r.word()*10||100);const idx=r.byte();transparent=f&1?idx:-1;if(r.byte()!==0)throw Error('Invalid GIF control terminator.');}else{r.blocks();if(type===0x01){delay=100;disposal=0;transparent=-1;}}continue;}
    if(marker!==0x2c)throw Error('Unsupported or corrupt GIF block.');
    const left=r.word(),top=r.word(),w=r.word(),h=r.word(),f=r.byte();if(!w||!h||left+w>width||top+h>height)throw Error('Invalid GIF frame dimensions.');
    if(frames.length>=MAX_GIF_FRAMES||(frames.length+1)*screen.byteLength>MAX_GIF_DECODED_BYTES)throw Error('GIF exceeds 300 frames or 96 MB decoded-frame limit.');
    const palette=f&128?r.take(3*(1<<((f&7)+1))):global;if(!palette)throw Error('GIF has no color table.');
    if(!frames.length&&transparent<0)fill(0,0,width,height,background);
    const previous=disposal===3?screen.slice():null;const min=r.byte(),indices=decodeLzw(r.blocks(),min,w*h);
    const rows:number[]=[];if(f&64){for(const [start,step] of [[0,8],[4,8],[2,4],[1,2]])for(let y=start;y<h;y+=step)rows.push(y);}else{for(let y=0;y<h;y++)rows.push(y);}
    let i=0;for(const y of rows)for(let x=0;x<w;x++){const idx=indices[i++];if(idx===transparent)continue;const p=idx*3;if(p+2>=palette.length)throw Error('Invalid GIF palette index.');const dest=((top+y)*width+left+x)*4;screen[dest]=palette[p];screen[dest+1]=palette[p+1];screen[dest+2]=palette[p+2];screen[dest+3]=255;}
    duration+=delay;frames.push({rgba:screen.slice(),delay,end:duration});
    if(disposal===2)fill(left,top,w,h,transparent>=0?[0,0,0,0]:background);else if(previous)screen=previous;
    delay=100;disposal=0;transparent=-1;
  }
  if(!trailer||!frames.length)throw Error('GIF contains no complete frames.');return {width,height,frames,duration:duration/1000};
}
export function gifFrameIndex(gif:DecodedGif,t:number){const raw=t*1000, total=gif.duration*1000;const time=raw>=0&&raw<total?raw:((raw%total)+total)%total;let lo=0,hi=gif.frames.length-1;while(lo<hi){const m=(lo+hi)>>1;if(time<gif.frames[m].end)hi=m;else lo=m+1;}return lo;}
