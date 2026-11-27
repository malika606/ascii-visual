import type {VisualEffects} from './settings.ts';
import {noEffects} from './settings.ts';
import {seed} from './motion.ts';
export const effectNames=['glow','rgbSplit','scanlines','grain','distortion','vignette'] as const;
export function normalizedEffects(input?:Partial<VisualEffects>):VisualEffects{
  const result={...noEffects};
  for(const key of effectNames){
    const n=input?.[key];
    result[key]=typeof n==='number'&&Number.isFinite(n)?Math.max(0,Math.min(100,n)):0;
  }
  return result;
}
export function distortionOffset(y:number,height:number,amount:number,scale=1){
  return Math.round((Math.sin(y/Math.max(1,height)*Math.PI*8)*.62+Math.sin(y/Math.max(1,height)*Math.PI*21)*.38)*amount*.18*scale);
}
export function effectScale(width:number,height:number){return Math.max(.25,Math.max(width,height)/960);}
function context(canvas:HTMLCanvasElement){const c=canvas.getContext('2d');if(!c)throw Error('Effects canvas is unavailable.');return c;}
function resize(canvas:HTMLCanvasElement,w:number,h:number){if(canvas.width!==w||canvas.height!==h){canvas.width=w;canvas.height=h;}}
/** One reusable frame buffer, one reusable channel buffer and a tiny deterministic noise tile.
 * No DOM overlays: these passes are baked into every rendered export. */
export class EffectsRenderer{
  private frame?:HTMLCanvasElement;
  private channel?:HTMLCanvasElement;
  private blur?:HTMLCanvasElement;
  private noise?:HTMLCanvasElement;
  private copy(canvas:HTMLCanvasElement){
    const b=this.frame??=document.createElement('canvas');resize(b,canvas.width,canvas.height);
    const c=context(b);c.globalCompositeOperation='copy';c.drawImage(canvas,0,0);c.globalCompositeOperation='source-over';return b;
  }
  private noiseTile(){
    if(this.noise)return this.noise;
    const b=this.noise=document.createElement('canvas');resize(b,96,96);
    const c=context(b),data=c.createImageData(96,96);
    for(let y=0;y<96;y++)for(let x=0;x<96;x++){
      const i=(y*96+x)*4,v=Math.round(seed(x+11,y+93)*255);
      data.data[i]=data.data[i+1]=data.data[i+2]=v;data.data[i+3]=255;
    }
    c.putImageData(data,0,0);return b;
  }
  apply(canvas:HTMLCanvasElement,ctx:CanvasRenderingContext2D,input?:Partial<VisualEffects>){
    const f=normalizedEffects(input);if(!effectNames.some(k=>f[k]>0)){
      // Release large scratch buffers when an effect stack is cleared.
      this.frame=this.channel=this.blur=undefined;return;
    }
    const w=canvas.width,h=canvas.height,scale=effectScale(w,h);
    ctx.save();
    try{
      ctx.globalAlpha=1;ctx.globalCompositeOperation='source-over';
      if(f.distortion>0){
        const b=this.copy(canvas),band=Math.max(1,Math.round(3*scale));
        ctx.fillStyle='#000';ctx.fillRect(0,0,w,h);
        for(let y=0;y<h;y+=band){
          const bh=Math.min(band,h-y),offset=distortionOffset(y,h,f.distortion,scale);
          ctx.drawImage(b,0,y,w,bh,offset,y,w,bh);
        }
      }
      if(f.rgbSplit>0){
        const b=this.copy(canvas),ch=this.channel??=document.createElement('canvas');resize(ch,w,h);
        const c=context(ch),shift=Math.max(1,Math.round(f.rgbSplit*.075*scale));
        // Recompose independently translated RGB channels. Preserve green at the original position.
        ctx.fillStyle='#000';ctx.fillRect(0,0,w,h);ctx.globalCompositeOperation='lighter';
        for(const [color,offset] of [['#ff0000',-shift],['#00ff00',0],['#0000ff',shift]] as const){
          c.globalCompositeOperation='copy';c.drawImage(b,0,0);c.globalCompositeOperation='multiply';c.fillStyle=color;c.fillRect(0,0,w,h);
          ctx.drawImage(ch,offset,0);
        }
        ctx.globalCompositeOperation='source-over';
        // Keep original signal at low slider values for a continuous, subtle effect.
        ctx.globalAlpha=1-f.rgbSplit/100;ctx.drawImage(b,0,0);ctx.globalAlpha=1;
      }
      if(f.glow>0){
        // Downsampled halo, then screen over the untouched sharp marks; works without Canvas filter.
        const b=this.blur??=document.createElement('canvas');
        const divisor=3+f.glow*.075;
        resize(b,Math.max(1,Math.round(w/(divisor*scale))),Math.max(1,Math.round(h/(divisor*scale))));
        const c=context(b);c.globalCompositeOperation='copy';c.imageSmoothingEnabled=true;c.imageSmoothingQuality='high';c.drawImage(canvas,0,0,b.width,b.height);
        ctx.globalCompositeOperation='screen';ctx.globalAlpha=f.glow*.009;ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality='high';ctx.drawImage(b,0,0,w,h);
        ctx.globalCompositeOperation='source-over';ctx.globalAlpha=1;
      }
      if(f.grain>0){
        const pattern=ctx.createPattern(this.noiseTile(),'repeat');
        if(pattern){ctx.save();ctx.scale(scale,scale);ctx.globalCompositeOperation='soft-light';ctx.globalAlpha=f.grain*.006;ctx.fillStyle=pattern;ctx.fillRect(0,0,w/scale,h/scale);ctx.restore();}
      }
      if(f.scanlines>0){
        const period=Math.max(2,Math.round(4*scale)),line=Math.max(1,Math.round(period*.35));
        ctx.globalAlpha=f.scanlines*.007;ctx.fillStyle='#000';
        for(let y=0;y<h;y+=period)ctx.fillRect(0,y,w,line);
        ctx.globalAlpha=1;
      }
      if(f.vignette>0){
        ctx.save();ctx.translate(w/2,h/2);ctx.scale(w/2,h/2);
        const g=ctx.createRadialGradient(0,0,.3,0,0,1.38);g.addColorStop(0,'rgba(0,0,0,0)');g.addColorStop(1,`rgba(0,0,0,${f.vignette*.0095})`);ctx.fillStyle=g;ctx.fillRect(-1,-1,2,2);ctx.restore();
      }
    }finally{ctx.restore();}
  }
}
