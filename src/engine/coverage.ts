import {coverageGain} from './tonal.ts';
// Estimate ink coverage of the actual selected font, at a supersampled reference size.
// Cache per renderer/typographic geometry. This compensates color only: ramp order is unchanged.
export const MARK_FONT='ui-monospace, Consolas, monospace';
export class GlyphCoverage {
  private canvas?:HTMLCanvasElement;
  private key='';
  private gains=new Map<string,number>();
  prepare(chars:readonly string[],ratio:number,weight:number,strength:number){
    const key=JSON.stringify([chars,Math.round(ratio*1000),weight,strength]);
    if(key===this.key)return this.gains;
    this.key=key;this.gains=new Map();
    if(strength<=0)return this.gains;
    const canvas=this.canvas??=document.createElement('canvas');
    canvas.height=80;canvas.width=Math.max(1,Math.min(240,Math.round(80*ratio)));
    const ctx=canvas.getContext('2d',{willReadFrequently:true});if(!ctx)return this.gains;
    ctx.font=`${weight} ${Math.min(canvas.height,canvas.width/.62)*.96}px ${MARK_FONT}`;
    ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillStyle='#fff';
    for(const glyph of new Set(chars)){
      ctx.clearRect(0,0,canvas.width,canvas.height);ctx.fillText(glyph,canvas.width/2,canvas.height/2);
      const pixels=ctx.getImageData(0,0,canvas.width,canvas.height).data;let area=0;
      for(let i=3;i<pixels.length;i+=4)area+=pixels[i]/255;
      this.gains.set(glyph,coverageGain(area/(canvas.width*canvas.height),strength));
    }
    return this.gains;
  }
}
