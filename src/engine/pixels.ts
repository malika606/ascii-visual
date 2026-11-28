import type {Settings} from './settings.ts';
import {toneValue,boostColor,softContrast,gainRgb} from './tonal.ts';
export const clamp = (n:number,min=0,max=255) => Math.max(min,Math.min(max,n));
export const luminance = (r:number,g:number,b:number) => .2126*r+.7152*g+.0722*b;
export function glyphForBrightness(value:number,ramp:string):string {
  const chars=Array.from(ramp); if (!chars.length) return ' ';
  return chars[Math.round(clamp(value)/255*(chars.length-1))];
}
export interface Cell {x:number;y:number;glyph:string;red:number;green:number;blue:number;light:number;colorLight?:number;brailleBits?:number;ditherBit?:number;maskOpacity?:number}
export function toneMapper(s:Settings){
  const curve=Float64Array.from({length:256},(_,i)=>softContrast(toneValue(i,s),s.contrast));
  return (v:number)=>{const x=clamp(v),lo=Math.floor(x),hi=Math.min(255,lo+1);return curve[lo]+(curve[hi]-curve[lo])*(x-lo);};
}
export function maskCoverageMapper(s:Settings){
 const key=/^#[0-9a-f]{6}$/i.test(s.keyColor)?parseInt(s.keyColor.slice(1),16):0xffffff;
 const kr=key>>16,kg=(key>>8)&255,kb=key&255,tolerance=clamp(s.tolerance,0,100)*2.55,feather=(s.maskFeather??0)*2.55;
 const ramp=(d:number)=>d<=0?0:feather>0?Math.min(1,d/feather):1;
 return (data:Uint8ClampedArray,p:number)=>{
   const r=data[p],g=data[p+1],b=data[p+2],alpha=data[p+3]/255;if(alpha===0)return 0;
   const keyDistance=s.background==='light'?255-luminance(r,g,b)-tolerance:s.background==='color'?Math.hypot(r-kr,g-kg,b-kb)/Math.sqrt(3)-tolerance:Infinity;
   return Math.min(ramp(keyDistance),ramp(luminance(r*alpha,g*alpha,b*alpha)-s.threshold));
 };
}
export function sourceLightMapper(s:Settings){
 const coverage=maskCoverageMapper(s);
 return (data:Uint8ClampedArray,p:number)=>{if(coverage(data,p)<=0)return -1;const alpha=data[p+3]/255;return luminance(data[p]*alpha,data[p+1]*alpha,data[p+2]*alpha);};
}
export function pixelsToCells(data:Uint8ClampedArray,cols:number,rows:number,s:Settings):Cell[] {
  const cells:Cell[]=[];const chars=Array.from(s.ramp);
  const mapTone=toneMapper(s),coverage=maskCoverageMapper(s);
  for(let i=0;i<cols*rows;i++){
    const p=i*4,maskOpacity=coverage(data,p);if(maskOpacity<=0)continue;
    const alpha=data[p+3]/255,r=data[p]*alpha,g=data[p+1]*alpha,b=data[p+2]*alpha,l=luminance(r,g,b);
    const corrected=mapTone(l);
    const light=s.invert?255-corrected:corrected;
    const colorLight=boostColor(corrected,s);
    // Scale a gamut-safe saturated RGB vector by the corrected luminance.
    // Compression toward the original luminance keeps saturated hues from clipping independently.
    const dr=r-l,dg=g-l,db=b-l;
    const positive=Math.max(dr,dg,db,0),negative=Math.max(-dr,-dg,-db,0);
    const saturation=Math.max(0,Math.min(s.saturation,positive?(255-l)/positive:Infinity,negative?l/negative:Infinity));
    const [red,green,blue]=gainRgb(l+dr*saturation,l+dg*saturation,l+db*saturation,corrected/Math.max(l,1e-6)*(s.colorBoost??100)/100);
    cells.push({x:i%cols,y:Math.floor(i/cols),glyph:chars[Math.round(light/255*(chars.length-1))]??' ',red:s.monochrome?Math.round(colorLight*.35):red,green:s.monochrome?Math.round(colorLight):green,blue:s.monochrome?Math.round(colorLight*.55):blue,light,colorLight,...(maskOpacity<1?{maskOpacity}:{})});
  } return cells;
}
export function fitSize(w:number,h:number,max=960){const ratio=Math.min(1,max/Math.max(w,h));return {width:Math.max(1,Math.round(w*ratio)),height:Math.max(1,Math.round(h*ratio))};}

export const MAX_RENDER_SIDE=960;
export function resolutionChoices(w:number,h:number){const max=Math.min(MAX_RENDER_SIDE,Math.max(w,h));return [...new Set([max,720,480,320].filter(n=>n<=max))].map(n=>({side:n,...fitSize(w,h,n)}));}
export function outputSize(w:number,h:number,side=MAX_RENDER_SIDE){return fitSize(w,h,Math.min(MAX_RENDER_SIDE,Math.max(1,side)));}

// H.264 encoders commonly require even frame dimensions. Round down, never upscale.
export function mp4OutputSize(w:number,h:number,side=MAX_RENDER_SIDE){const s=outputSize(w,h,side);const width=s.width-s.width%2,height=s.height-s.height%2;return width>=2&&height>=2?{width,height}:null;}
