import type {DitherAlgorithm} from './settings.ts';
import {seed} from './motion.ts';
export const ditherLabels:Record<DitherAlgorithm,string>={bayer4:'Bayer 4 × 4',bayer8:'Bayer 8 × 8','floyd-steinberg':'Floyd–Steinberg',atkinson:'Atkinson',noise:'Seeded noise',threshold:'Hard threshold'};
const bayer4=[0,8,2,10,12,4,14,6,3,11,1,9,15,7,13,5];
const bayer8=Array.from({length:64},(_,i)=>{const x=i%8,y=i>>3;return 4*bayer4[(y&3)*4+(x&3)]+[0,2,3,1][(y>>2)*2+(x>>2)];});
const floyd=[[1,0,7/16],[-1,1,3/16],[0,1,5/16],[1,1,1/16]];
const atkinson=[[1,0,1/8],[2,0,1/8],[-1,1,1/8],[0,1,1/8],[1,1,1/8],[0,2,1/8]];
// Negative values mean masked cells. Never emit dots or transfer error into those cells.
export function ditherMap(tones:Float32Array,cols:number,rows:number,algorithm:DitherAlgorithm='bayer4',threshold=50){
  const bits=new Uint8Array(cols*rows),bias=(50-Math.max(0,Math.min(100,threshold)))*2.55;
  const diffusion=algorithm==='floyd-steinberg'?floyd:algorithm==='atkinson'?atkinson:undefined;
  const work=diffusion?Float32Array.from(tones,v=>v<0?v:Math.max(0,Math.min(255,v+bias))):undefined;
  for(let y=0;y<rows;y++)for(let x=0;x<cols;x++){
    const i=y*cols+x;if(tones[i]<0)continue;
    const v=Math.max(0,Math.min(255,work?work[i]:tones[i]+bias));
    const limit=algorithm==='bayer4'?(bayer4[(y&3)*4+(x&3)]+.5)*255/16:algorithm==='bayer8'?(bayer8[(y&7)*8+(x&7)]+.5)*255/64:algorithm==='noise'?(seed(x,y)*.998+.001)*255:127.5;
    const on=v>limit;bits[i]=on?1:0;
    if(work&&diffusion){const error=v-(on?255:0);for(const [dx,dy,weight] of diffusion){const xx=x+dx,yy=y+dy,j=yy*cols+xx;if(xx>=0&&xx<cols&&yy>=0&&yy<rows&&tones[j]>=0)work[j]+=error*weight;}}
  }
  return bits;
}
