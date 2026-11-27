import type {Settings} from './settings.ts';
export const clamp = (n:number,min=0,max=255) => Math.max(min,Math.min(max,n));
export const luminance = (r:number,g:number,b:number) => .2126*r+.7152*g+.0722*b;
export function glyphForBrightness(value:number,ramp:string):string {
  const chars=Array.from(ramp); if (!chars.length) return ' ';
  return chars[Math.round(clamp(value)/255*(chars.length-1))];
}
export interface Cell {x:number;y:number;glyph:string;red:number;green:number;blue:number;light:number}
export function pixelsToCells(data:Uint8ClampedArray,cols:number,rows:number,s:Settings):Cell[] {
  const cells:Cell[]=[];const chars=Array.from(s.ramp);
  const key=/^#[0-9a-f]{6}$/i.test(s.keyColor)?parseInt(s.keyColor.slice(1),16):0xffffff;
  const kr=key>>16,kg=(key>>8)&255,kb=key&255;
  for(let i=0;i<cols*rows;i++){
    const p=i*4, alpha=data[p+3]/255;
    // Key the sampled original RGB before alpha, saturation or contrast.
    if(s.background==='light' && luminance(data[p],data[p+1],data[p+2])>=255-clamp(s.tolerance,0,100)*2.55)continue;
    if(s.background==='color' && Math.hypot(data[p]-kr,data[p+1]-kg,data[p+2]-kb)/Math.sqrt(3)<=clamp(s.tolerance,0,100)*2.55)continue;
    const r=data[p]*alpha,g=data[p+1]*alpha,b=data[p+2]*alpha;
    const l=luminance(r,g,b); if(l<=s.threshold || alpha===0) continue;
    const light=clamp((l-128)*s.contrast+128);
    const tone=(c:number)=>Math.round(clamp(((l+(c-l)*s.saturation)-128)*s.contrast+128));
    cells.push({x:i%cols,y:Math.floor(i/cols),glyph:chars[Math.round(light/255*(chars.length-1))]??' ',red:s.monochrome?Math.round(light*.35):tone(r),green:s.monochrome?Math.round(light):tone(g),blue:s.monochrome?Math.round(light*.55):tone(b),light});
  } return cells;
}
export function fitSize(w:number,h:number,max=960){const ratio=Math.min(1,max/Math.max(w,h));return {width:Math.max(1,Math.round(w*ratio)),height:Math.max(1,Math.round(h*ratio))};}

export const MAX_RENDER_SIDE=960;
export function resolutionChoices(w:number,h:number){const max=Math.min(MAX_RENDER_SIDE,Math.max(w,h));return [...new Set([max,720,480,320].filter(n=>n<=max))].map(n=>({side:n,...fitSize(w,h,n)}));}
export function outputSize(w:number,h:number,side=MAX_RENDER_SIDE){return fitSize(w,h,Math.min(MAX_RENDER_SIDE,Math.max(1,side)));}

// H.264 encoders commonly require even frame dimensions. Round down, never upscale.
export function mp4OutputSize(w:number,h:number,side=MAX_RENDER_SIDE){const s=outputSize(w,h,side);const width=s.width-s.width%2,height=s.height-s.height%2;return width>=2&&height>=2?{width,height}:null;}
