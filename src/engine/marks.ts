import type {Cell} from './pixels.ts';
import type {Settings} from './settings.ts';
import {seed} from './motion.ts';

// Ordered 4×4 threshold screen, anchored in artwork coordinates.
const bayer=[0,8,2,10,12,4,14,6,3,11,1,9,15,7,13,5];
export function ditherOn(light:number,x:number,y:number){
  return light/255>(bayer[(y&3)*4+(x&3)]+.5)/16;
}
// Eight-dot Unicode Braille density ramp. Encodes local brightness, not eight separate source samples.
const dotOrder=[1,32,4,16,2,128,8,64];
export function brailleGlyph(light:number){
  const count=Math.round(Math.max(0,Math.min(255,light))/255*8);
  let bits=0;for(let i=0;i<count;i++)bits|=dotOrder[i];
  return String.fromCodePoint(0x2800+bits);
}
export function edgeStrength(map:Float32Array,cols:number,rows:number,x:number,y:number){
  const at=(a:number,b:number)=>map[Math.max(0,Math.min(rows-1,b))*cols+Math.max(0,Math.min(cols-1,a))];
  const gx=at(x+1,y)-at(x-1,y),gy=at(x,y+1)-at(x,y-1);
  return {strength:Math.min(1,Math.hypot(gx,gy)/160),angle:Math.atan2(gy,gx)+Math.PI/2};
}
export function markColor(c:Cell,s:Settings){
  if(s.monochrome||!s.palette||s.palette==='source')return `rgb(${c.red},${c.green},${c.blue})`;
  const l=c.light/255;
  if(s.palette==='amber')return `rgb(${Math.round(255*l)},${Math.round(188*l)},${Math.round(68*l)})`;
  if(s.palette==='paper')return '#e9dfc8';
  return '#f3f3f3';
}
function dot(ctx:CanvasRenderingContext2D,x:number,y:number,r:number){
  ctx.beginPath();ctx.arc(x,y,Math.max(.15,r),0,Math.PI*2);ctx.fill();
}
export function drawMark(ctx:CanvasRenderingContext2D,c:Cell,s:Settings,glyph:string,x:number,y:number,cw:number,ch:number,edge?:ReturnType<typeof edgeStrength>){
  const tone=c.light/255,unit=Math.min(cw,ch),mode=s.mode??'glyph';
  const rand=seed(c.x,c.y),other=seed(c.x+311,c.y+71);
  switch(mode){
    case 'glyph':ctx.fillText(glyph,x,y);break;
    case 'braille':ctx.fillText(brailleGlyph(c.light),x,y);break;
    case 'pixel':ctx.fillRect(x-cw*.48,y-ch*.48,cw*.96,ch*.96);break;
    case 'dots':dot(ctx,x,y,unit*.49*Math.sqrt(tone));break;
    case 'dither':if(ditherOn(c.light,c.x,c.y))ctx.fillRect(x-cw*.43,y-ch*.43,cw*.86,ch*.86);break;
    case 'stipple':if(rand<tone)dot(ctx,x+(other-.5)*cw*.65,y+(rand-.5)*ch*.65,unit*.22);break;
    case 'led':dot(ctx,x,y,unit*.37);break;
    case 'particles':dot(ctx,x+(rand-.5)*cw*.95,y+(other-.5)*ch*.95,unit*(.08+.3*tone));break;
    case 'contours':{
      if(!edge||edge.strength<.09)break;
      ctx.strokeStyle=ctx.fillStyle;ctx.lineWidth=Math.max(.5,unit*(.12+.25*edge.strength));
      const r=unit*.73,dx=Math.cos(edge.angle)*r,dy=Math.sin(edge.angle)*r;
      ctx.beginPath();ctx.moveTo(x-dx,y-dy);ctx.lineTo(x+dx,y+dy);ctx.stroke();break;
    }
    case 'hatch':{
      const count=Math.ceil(tone*4);
      ctx.strokeStyle=ctx.fillStyle;ctx.lineWidth=Math.max(.4,unit*.12);
      ctx.beginPath();
      for(let i=0;i<count;i++){const offset=(i-(count-1)/2)*unit*.2;ctx.moveTo(x-cw*.37,y+ch*.35+offset);ctx.lineTo(x+cw*.37,y-ch*.35+offset);}
      ctx.stroke();break;
    }
  }
}
