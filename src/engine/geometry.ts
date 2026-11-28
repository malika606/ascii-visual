import type {GeometricMode,Settings} from './settings.ts';
import {seed} from './motion.ts';
export const geometricModes:readonly GeometricMode[]=['cross','diamond','lines','stud','voxel','disco'];
export function isGeometricMode(mode:unknown):mode is GeometricMode{return (geometricModes as readonly unknown[]).includes(mode);}
export function geometryScale(light:number){return Math.sqrt(Math.max(0,Math.min(255,light))/255);}
export function shadeColor(base:string,amount:number){
  const m=/^#([0-9a-f]{6})$/i.exec(base),rgb=/^rgba?\(\s*(\d+(?:\.\d+)?)\s*,\s*(\d+(?:\.\d+)?)\s*,\s*(\d+(?:\.\d+)?)/i.exec(base);
  const n=m?parseInt(m[1],16):0;const c=m?[n>>16,(n>>8)&255,n&255]:rgb?rgb.slice(1,4).map(Number):[255,255,255];
  const a=Math.max(-1,Math.min(1,amount));return 'rgb('+c.map(v=>Math.round(Math.max(0,Math.min(255,a>=0?v+(255-v)*a:v*(1+a))))).join(',')+')';
}
function poly(ctx:CanvasRenderingContext2D,points:readonly (readonly [number,number])[]){
  ctx.beginPath();ctx.moveTo(...points[0]);for(let i=1;i<points.length;i++)ctx.lineTo(...points[i]);ctx.closePath();ctx.fill();
}
function ellipse(ctx:CanvasRenderingContext2D,x:number,y:number,rx:number,ry:number){ctx.beginPath();ctx.ellipse(x,y,rx,ry,0,0,Math.PI*2);ctx.fill();}
export function drawGeometry(ctx:CanvasRenderingContext2D,mode:GeometricMode,s:Settings,light:number,x:number,y:number,cw:number,ch:number,col:number,row:number){
  const f=geometryScale(light);if(f<=0)return;
  const w=cw*.47*f,h=ch*.47*f,unit=Math.min(w,h),base=String(ctx.fillStyle),relief=Math.max(0,Math.min(100,s.shapeRelief??70))/100;
  if(mode==='cross'){
    const a=w*.32,b=h*.32;
    poly(ctx,[[x-a,y-h],[x+a,y-h],[x+a,y-b],[x+w,y-b],[x+w,y+b],[x+a,y+b],[x+a,y+h],[x-a,y+h],[x-a,y+b],[x-w,y+b],[x-w,y-b],[x-a,y-b]]);return;
  }
  if(mode==='diamond'){poly(ctx,[[x,y-h],[x+w,y],[x,y+h],[x-w,y]]);return;}
  if(mode==='lines'){
    const angle=(s.shapeAngle??0)*Math.PI/180,dx=Math.cos(angle),dy=Math.sin(angle);
    const half=Math.min(cw*.46/Math.max(.001,Math.abs(dx)),ch*.46/Math.max(.001,Math.abs(dy)))*f;
    const t=unit*.36,nx=-dy*t,ny=dx*t;
    poly(ctx,[[x-dx*half+nx,y-dy*half+ny],[x+dx*half+nx,y+dy*half+ny],[x+dx*half-nx,y+dy*half-ny],[x-dx*half-nx,y-dy*half-ny]]);return;
  }
  if(mode==='stud'){
    ctx.fillStyle=shadeColor(base,-.28*relief);ctx.fillRect(x-w,y-h,w*2,h*2);
    ctx.fillStyle=base;ctx.fillRect(x-w,y-h,w*2,h*1.76);
    ctx.fillStyle=shadeColor(base,-.35*relief);ellipse(ctx,x,y+h*.12,w*.62,h*.47);
    ctx.fillStyle=shadeColor(base,.24*relief);ellipse(ctx,x,y-h*.10,w*.62,h*.47);
  }else if(mode==='voxel'){
    const top=y-h,mid=y-h*.28,bottom=y+h,join=y+h*.38;
    ctx.fillStyle=shadeColor(base,.24*relief);poly(ctx,[[x,top],[x+w,mid],[x,join],[x-w,mid]]);
    ctx.fillStyle=shadeColor(base,-.18*relief);poly(ctx,[[x-w,mid],[x,join],[x,bottom],[x-w,y+h*.32]]);
    ctx.fillStyle=shadeColor(base,-.38*relief);poly(ctx,[[x+w,mid],[x,join],[x,bottom],[x+w,y+h*.32]]);
  }else{
    const r=seed(col,row),glint=seed(col+173,row+83);
    ctx.fillStyle=shadeColor(base,(r-.5)*.65*relief);ctx.fillRect(x-w,y-h,w*2,h*2);
    ctx.fillStyle=shadeColor(base,.50*relief);poly(ctx,[[x-w,y-h],[x+w,y-h],[x-w,y+h]]);
    if(glint>.72){ctx.fillStyle=shadeColor(base,.8*relief);ctx.fillRect(x-w*.76,y-h*.76,w*.42,h*.20);}
  }
  ctx.fillStyle=base;
}
