import type {Source} from './source.ts';
export interface SourceTransform {left:number;right:number;top:number;bottom:number;rotation:0|90|180|270;flip:boolean}
export const initialTransform:SourceTransform={left:0,right:0,top:0,bottom:0,rotation:0,flip:false};
export function cropGeometry(w:number,h:number,t:SourceTransform){
 const left=Math.min(90,Math.max(0,t.left)),right=Math.min(90-left,Math.max(0,t.right)),top=Math.min(90,Math.max(0,t.top)),bottom=Math.min(90-top,Math.max(0,t.bottom));
 const x=Math.min(w-1,Math.floor(w*left/100)),y=Math.min(h-1,Math.floor(h*top/100));
 const cw=Math.max(1,w-x-Math.floor(w*right/100)),ch=Math.max(1,h-y-Math.floor(h*bottom/100));
 const swap=t.rotation===90||t.rotation===270;
 return {x,y,cw,ch,width:swap?ch:cw,height:swap?cw:ch};
}
export function transformedSource(source:Source,t:SourceTransform):Source{
 if(!t.left&&!t.right&&!t.top&&!t.bottom&&!t.rotation&&!t.flip)return source;
 const g=cropGeometry(source.width,source.height,t);
 const canvas=document.createElement('canvas'),scale=Math.min(1,3840/Math.max(g.width,g.height));
 canvas.width=Math.max(1,Math.round(g.width*scale));canvas.height=Math.max(1,Math.round(g.height*scale));
 const ctx=canvas.getContext('2d')!;let ready=false;
 return {...source,width:g.width,height:g.height,frame(time){
   if(source.kind==='image'&&ready)return canvas;
   const frame=source.frame(time);ctx.setTransform(1,0,0,1,0,0);ctx.clearRect(0,0,canvas.width,canvas.height);
   ctx.translate(canvas.width/2,canvas.height/2);ctx.scale(canvas.width/g.width,canvas.height/g.height);if(t.flip)ctx.scale(-1,1);ctx.rotate(t.rotation*Math.PI/180);
   ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality='high';ctx.drawImage(frame,g.x,g.y,g.cw,g.ch,-g.cw/2,-g.ch/2,g.cw,g.ch);
   ready=true;return canvas;
 },dispose(){canvas.width=canvas.height=0;source.dispose();}};
}
