import {Renderer} from '../engine/renderer.ts';
import type {Settings} from '../engine/settings.ts';
import {loadSource} from '../media/source.ts';
import {outputSize} from '../engine/pixels.ts';
import {exportDuration} from './record.ts';
export const GIF_MAX_SIDE=480,GIF_MAX_SECONDS=5,GIF_FPS=10;
export function gifExportDuration(duration:number,kind:string,settings?:Settings){return Math.ceil(Math.min(GIF_MAX_SECONDS,exportDuration(duration,kind,settings))*GIF_FPS-1e-8)/GIF_FPS;}
const word=(v:number)=>[v&255,(v>>8)&255];
// Fixed RGB332 palette. LZW uses 9-bit codes and clears before dictionary growth.
// This trades compression and palette precision for a small, dependency-free encoder.
function compress(indices:Uint8Array){
  const bytes:number[]=[];let bits=0,n=0;const emit=(code:number)=>{bits|=code<<n;n+=9;while(n>=8){bytes.push(bits&255);bits>>>=8;n-=8;}};
  let dict=new Map<number,number>(),next=258,prefix=indices[0];emit(256);
  for(let i=1;i<indices.length;i++){const symbol=indices[i],key=prefix*256+symbol,found=dict.get(key);if(found!==undefined){prefix=found;continue;}emit(prefix);if(next<510)dict.set(key,next++);else{emit(256);dict=new Map();next=258;}prefix=symbol;}
  emit(prefix);emit(257);if(n)bytes.push(bits&255);return Uint8Array.from(bytes);
}
export class GifEncoder {
  private parts:Uint8Array[]=[];private count=0;
  private width:number;private height:number;
  constructor(width:number,height:number){this.width=width;this.height=height;if(width<1||height<1||width>GIF_MAX_SIDE||height>GIF_MAX_SIDE)throw Error('GIF output dimensions exceed limit.');
    const palette:number[]=[];for(let i=0;i<256;i++)palette.push(Math.round((i>>5)*255/7),Math.round(((i>>2)&7)*255/7),Math.round((i&3)*255/3));
    this.add([71,73,70,56,57,97,...word(width),...word(height),0xf7,0,0,...palette,0x21,0xff,11,...Array.from('NETSCAPE2.0',x=>x.charCodeAt(0)),3,1,0,0,0]);
  }
  private add(bytes:number[]){this.parts.push(Uint8Array.from(bytes));}
  frame(data:Uint8ClampedArray,delayCs=10){if(data.length!==this.width*this.height*4||this.count>=GIF_MAX_SECONDS*GIF_FPS)throw Error('GIF frame limit or size mismatch.');this.count++;
    const indices=new Uint8Array(this.width*this.height);for(let i=0;i<indices.length;i++){const p=i*4;indices[i]=(Math.round(data[p]*7/255)<<5)|(Math.round(data[p+1]*7/255)<<2)|Math.round(data[p+2]*3/255);}
    this.add([0x21,0xf9,4,4,...word(delayCs),0,0,0x2c,0,0,0,0,...word(this.width),...word(this.height),0,8]);const compressed=compress(indices);
    for(let i=0;i<compressed.length;i+=255){const part=compressed.subarray(i,i+255);this.add([part.length]);this.parts.push(part);}this.add([0]);
  }
  finish(){if(!this.count)throw Error('GIF has no frames.');this.add([0x3b]);return new Blob(this.parts.map(p=>p.slice().buffer),{type:'image/gif'});}
}
export async function exportGif(file:File,settings:Settings,signal:AbortSignal,onProgress:(p:number)=>void,side:number){
  const source=await loadSource(file,signal);try{
    const size=outputSize(source.width,source.height,Math.min(side,GIF_MAX_SIDE)),canvas=document.createElement('canvas'),renderer=new Renderer(canvas),encoder=new GifEncoder(size.width,size.height),duration=gifExportDuration(source.duration,source.kind,settings),count=Math.ceil(duration*GIF_FPS);
    for(let i=0;i<count;i++){signal.throwIfAborted();const t=i/GIF_FPS;const mediaTime=source.kind==='image'?0:t%source.duration;if(source.kind==='video')await source.seek(mediaTime,signal);
      renderer.draw(source.frame(mediaTime),source.width,source.height,settings,t,false,Math.min(side,GIF_MAX_SIDE),false,{staticSource:source.kind==='image',opaque:true});encoder.frame(canvas.getContext('2d')!.getImageData(0,0,size.width,size.height).data);onProgress((i+1)/count);await new Promise<void>(r=>setTimeout(r,0));}
    signal.throwIfAborted();return encoder.finish();
  }finally{source.dispose();}
}
