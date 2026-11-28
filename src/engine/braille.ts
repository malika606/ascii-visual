import type {Settings} from './settings.ts';
import {pixelsToCells,sourceLightMapper,toneMapper} from './pixels.ts';
import {densityTone} from './detail.ts';
import {edgeStrength} from './marks.ts';
// Unicode dots 1,4 / 2,5 / 3,6 / 7,8 in row-major source order.
export const brailleWeights=[1,8,2,16,4,32,64,128] as const;
export function braillePattern(tones:ArrayLike<number>,threshold=50){
  let bits=0;for(let i=0;i<8;i++)if(tones[i]>=0&&tones[i]>threshold*2.55)bits|=brailleWeights[i];
  return bits;
}
export function spatialBrailleCells(data:Uint8ClampedArray,cols:number,rows:number,s:Settings){
  const w=cols*2,h=rows*4,sourceLight=sourceLightMapper(s),mapTone=toneMapper(s),tones=new Float32Array(w*h);
  for(let i=0;i<tones.length;i++){const l=sourceLight(data,i*4);if(l<0){tones[i]=-1;continue;}const t=mapTone(l);tones[i]=s.invert?255-t:t;}
  const edges=(s.edgeEmphasis??0)>0?Float32Array.from(tones,v=>Math.max(0,v)):undefined;
  const rgba=new Uint8ClampedArray(cols*rows*4),patterns=new Uint8Array(cols*rows),local=new Float32Array(8),threshold=s.brailleThreshold??50;
  for(let y=0;y<rows;y++)for(let x=0;x<cols;x++){
    let r=0,g=0,b=0,n=0;
    for(let dy=0;dy<4;dy++)for(let dx=0;dx<2;dx++){
      const sx=x*2+dx,sy=y*4+dy,i=sy*w+sx,p=i*4,k=dy*2+dx,t=tones[i];
      local[k]=t<0?-1:densityTone(t,s.density??100,edges?edgeStrength(edges,w,h,sx,sy).strength:0,s.edgeEmphasis??0);
      if(local[k]>threshold*2.55){const alpha=data[p+3]/255;r+=data[p]*alpha;g+=data[p+1]*alpha;b+=data[p+2]*alpha;n++;}
    }
    const j=y*cols+x;patterns[j]=braillePattern(local,threshold);
    if(n){rgba[j*4]=r/n;rgba[j*4+1]=g/n;rgba[j*4+2]=b/n;rgba[j*4+3]=255;}
  }
  // Color is the mean of enabled subcells. Masks were already applied independently above.
  return pixelsToCells(rgba,cols,rows,{...s,background:'dark',threshold:0}).map(c=>({...c,brailleBits:patterns[c.y*cols+c.x]}));
}
