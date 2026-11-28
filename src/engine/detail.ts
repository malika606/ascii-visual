import type {Cell} from './pixels.ts';
import {edgeStrength} from './marks.ts';
export const detailDefaults={glyphMapping:'measured',density:100,markSize:100,edgeEmphasis:0} as const;
export function densityTone(light:number,density=100,edge=0,emphasis=0){
  const t=Math.max(0,Math.min(1,light/255)),d=Math.max(50,Math.min(160,density))/100;
  // Preserve zero and white; shift the midtones toward sparse or dense marks.
  const base=Math.pow(t,1/d);
  return 255*Math.min(1,base+Math.max(0,Math.min(1,edge))*Math.max(0,Math.min(100,emphasis))/100*.45*(1-base));
}
export function detailMap(cells:readonly Cell[],cols:number,rows:number){
  const map=new Float32Array(cols*rows);
  for(const c of cells)map[c.y*cols+c.x]=c.light;
  return map;
}
export function detailLight(c:Cell,density:number,emphasis:number,map:Float32Array|undefined,cols:number,rows:number){
  const edge=map&&emphasis>0?edgeStrength(map,cols,rows,c.x,c.y).strength:0;
  return densityTone(c.light,density,edge,emphasis);
}
