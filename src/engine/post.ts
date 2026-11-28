import type {Settings} from './settings.ts';
export const postDefaults={glowRadius:50,glowThreshold:0,rgbAngle:0,scanSpacing:4,vignetteRadius:30,postBlack:0,postWhite:255,postGamma:1,sharpen:0,lightAmount:0,lightX:50,lightY:35,lightRadius:65} as const;
const clamp=(v:number,min:number,max:number)=>Math.max(min,Math.min(max,v));
export function levelCurve(black=0,white=255,gamma=1){
  const lo=clamp(black,0,254),hi=clamp(white,lo+1,255),g=clamp(gamma,.5,2.5);
  return Uint8ClampedArray.from({length:256},(_,i)=>255*Math.pow(clamp((i-lo)/(hi-lo),0,1),1/g));
}
export function lightGain(x:number,y:number,cx:number,cy:number,radius:number,amount:number){
  const distance=Math.hypot(x-cx,y-cy),r=Math.max(.1,radius);
  const v=clamp(1-distance/r,0,1),smooth=v*v*(3-2*v);
  return 1+clamp(amount,0,1)*smooth*1.5;
}
export function postActive(s:Partial<Settings>){
  return (s.postBlack??0)!==0||(s.postWhite??255)!==255||(s.postGamma??1)!==1||(s.sharpen??0)>0||(s.lightAmount??0)>0;
}
// Postprocess the rendered pixels, not the source. Four-neighbor unsharp mask is bounded
// and keeps the original alpha channel. A copy is needed only when sharpening is enabled.
export function postPixels(data:Uint8ClampedArray,w:number,h:number,s:Partial<Settings>){
  const lut=levelCurve(s.postBlack,s.postWhite,s.postGamma),sharp=clamp((s.sharpen??0)/100,0,1)*.85;
  const original=sharp?new Uint8ClampedArray(data):data;
  const amount=(s.lightAmount??0)/100,cx=(s.lightX??50)/100,cy=(s.lightY??35)/100,radius=(s.lightRadius??65)/100;
  for(let y=0;y<h;y++)for(let x=0;x<w;x++){
    const p=(y*w+x)*4;
    const gain=amount>0?lightGain((x+.5)/w,(y+.5)/h,cx,cy,radius,amount):1;
    const left=x>0?p-4:p,right=x<w-1?p+4:p,up=y>0?p-w*4:p,down=y<h-1?p+w*4:p;
    for(let c=0;c<3;c++){
      const v=original[p+c],detail=sharp? v-(original[left+c]+original[right+c]+original[up+c]+original[down+c])*.25:0;
      data[p+c]=lut[Math.round(clamp((v+sharp*detail)*gain,0,255))];
    }
  }
}
