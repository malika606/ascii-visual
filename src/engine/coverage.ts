import {coverageGain} from './tonal.ts';
export const MARK_FONT='ui-monospace, Consolas, monospace';
export interface InkSample {glyph:string;area:number}
export function measuredRamp(samples:readonly InkSample[]){
  return [...samples].sort((a,b)=>a.area-b.area);
}
// Quantize to measured coverage rather than evenly spaced character indices.
// Normalize to the actual available minimum and maximum; never insert unrequested glyphs.
export function measuredGlyphs(samples:readonly InkSample[]):string[]{
  const sorted=measuredRamp(samples),first=sorted[0],last=sorted[sorted.length-1];
  if(!first||!last)return Array(256).fill(' ');
  return Array.from({length:256},(_,i)=>{
    if(i===0)return first.glyph;if(i===255)return last.glyph;
    const target=first.area+(last.area-first.area)*i/255;
    let best=first;for(const sample of sorted)if(Math.abs(sample.area-target)<Math.abs(best.area-target))best=sample;
    return best.glyph;
  });
}
export function markFont(cw:number,ch:number,weight:number,scale=1){
  return `${weight} ${Math.min(ch,cw/.62)*.96*scale}px ${MARK_FONT}`;
}
export class GlyphCoverage {
  private canvas?:HTMLCanvasElement;
  private key='';
  private strength=-1;
  private samples:InkSample[]=[];
  private gains=new Map<string,number>();
  private lookup:string[]=[];
  private ordered:string[]=[];
  prepare(chars:readonly string[],ratio:number,weight:number,strength:number,scale=1){
    const key=JSON.stringify([chars,Math.round(ratio*1000),weight,scale]);
    if(key!==this.key){
      this.key=key;this.strength=-1;this.samples=[];
      const canvas=this.canvas??=document.createElement('canvas');
      canvas.height=80;canvas.width=Math.max(1,Math.min(240,Math.round(80*ratio)));
      const ctx=canvas.getContext('2d',{willReadFrequently:true});
      if(ctx){
        ctx.font=markFont(canvas.width,canvas.height,weight,scale);ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillStyle='#fff';
        for(const glyph of new Set(chars)){
          ctx.clearRect(0,0,canvas.width,canvas.height);ctx.fillText(glyph,canvas.width/2,canvas.height/2);
          const pixels=ctx.getImageData(0,0,canvas.width,canvas.height).data;let area=0;
          for(let i=3;i<pixels.length;i+=4)area+=pixels[i]/255;
          this.samples.push({glyph,area:area/(canvas.width*canvas.height)});
        }
      }
      if(!this.samples.length)this.samples=chars.map((glyph,i)=>({glyph,area:i/Math.max(1,chars.length-1)}));
      this.lookup=measuredGlyphs(this.samples);this.ordered=measuredRamp(this.samples).map(x=>x.glyph);
    }
    if(strength!==this.strength){this.strength=strength;this.gains=new Map(this.samples.map(x=>[x.glyph,coverageGain(x.area,strength)]));}
    return {gains:this.gains,lookup:this.lookup,ordered:this.ordered};
  }
}
