import type {Settings} from './settings.ts';
export const tonalDefaults={brightness:100,gamma:1,shadows:0,highlights:0,colorBoost:100,glyphWeight:400,invert:false,coverageCompensation:65};
export function toneValue(value:number,s:Settings){
  const t=Math.max(0,Math.min(1,value/255));
  const g=Math.max(.5,Math.min(2.5,s.gamma??1));
  const v=Math.pow(t,1/g);
  const lifted=v+(s.shadows??0)/100*4*v*(1-v)*(1-v);
  return Math.max(0,Math.min(255,255*(lifted+(s.highlights??0)/100*lifted*lifted*(1-lifted))*(s.brightness??100)/100));
}
// Contrast with fixed endpoints: unlike a clipped linear transform, dark nonzero tones survive.
export function softContrast(value:number,contrast:number){
  const t=Math.max(0,Math.min(1,value/255));if(t===0||t===1||contrast===1)return t*255;
  const a=Math.pow(t,contrast),b=Math.pow(1-t,contrast);return 255*a/(a+b);
}
export function gainRgb(r:number,g:number,b:number,gain:number):[number,number,number]{
  const peak=Math.max(r,g,b);const k=Math.min(Math.max(0,gain),peak>0?255/peak:1);
  return [Math.round(r*k),Math.round(g*k),Math.round(b*k)];
}
export function coverageGain(coverage:number,strength:number){
  if(coverage<=0)return 1;
  return Math.min(3,Math.pow(1/Math.max(.06,Math.min(1,coverage)),.5*Math.max(0,Math.min(100,strength))/100));
}
export function boostColor(value:number,s:Settings){return Math.max(0,Math.min(255,value*(s.colorBoost??100)/100));}
// Estimate a conservative exposure correction from visible, non-keyed cells, excluding pure black.
export function autoExposure(lights:readonly number[]){
  const hist=new Uint32Array(256);let n=0;
  for(const l of lights){if(l>0&&Number.isFinite(l)){hist[Math.min(255,Math.round(l))]++;n++;}}
  if(!n)return {brightness:100,gamma:1,shadows:0,colorBoost:100};
  const quantile=(q:number)=>{let cumulative=0;for(let i=0;i<256;i++){cumulative+=hist[i];if(cumulative>=n*q)return i;}return 255;};
  const mid=quantile(.5),hi=quantile(.95);
  const gamma=Math.round(Math.max(1,Math.min(1.8,1+(120-mid)/180))*20)/20;
  const liftedHi=255*Math.pow(hi/255,1/gamma);
  const brightness=Math.round(Math.max(100,Math.min(180,230/Math.max(1,liftedHi)*100)));
  return {brightness,gamma,shadows:Math.max(0,Math.min(25,Math.round((100-mid)/4))),colorBoost:hi<220?115:100};
}
