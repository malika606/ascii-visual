import type {Settings} from './settings.ts';
export const tonalDefaults={brightness:100,gamma:1,shadows:0,highlights:0,colorBoost:100,glyphWeight:400,invert:false};
export function toneValue(value:number,s:Settings){
  const t=Math.max(0,Math.min(1,value/255));
  const g=Math.max(.5,Math.min(2.5,s.gamma??1));
  const v=Math.pow(t,1/g);
  const lifted=v+(s.shadows??0)/100*4*v*(1-v)*(1-v);
  return Math.max(0,Math.min(255,255*(lifted+(s.highlights??0)/100*lifted*lifted*(1-lifted))*(s.brightness??100)/100));
}
export function boostColor(value:number,s:Settings){return Math.max(0,Math.min(255,value*(s.colorBoost??100)/100));}
// Estimate a conservative exposure correction from visible, non-keyed cells, excluding pure black.
export function autoExposure(lights:readonly number[]){
  const hist=new Uint32Array(256);let n=0;
  for(const l of lights){if(l>0&&Number.isFinite(l)){hist[Math.min(255,Math.round(l))]++;n++;}}
  if(!n)return {brightness:100,gamma:1,shadows:0,colorBoost:100};
  let cumulative=0,p=255;for(let i=0;i<256;i++){cumulative+=hist[i];if(cumulative>=n*.9){p=i;break;}}
  return {brightness:Math.round(Math.max(100,Math.min(180,210/Math.max(1,p)*100))),gamma:1.35,shadows:15,colorBoost:125};
}
