import {pixelsToCells,outputSize,mp4OutputSize,MAX_RENDER_SIDE} from './pixels.ts';
import {gridSize,pngOutputSize,videoOutputSize,VIDEO_CELLS} from './quality.ts';
import type {Cell} from './pixels.ts';
import {animate} from './motion.ts';
import {creativeFrame,isCreativeMotion} from './creativeMotion.ts';
import {drawMark,edgeStrength} from './marks.ts';
import {colorMapper} from './palette.ts';
import {ditherMap} from './dither.ts';
import {spatialBrailleCells} from './braille.ts';
import {detailLight,detailMap} from './detail.ts';
import {GlyphCoverage,markFont} from './coverage.ts';
import {Compositor,compositeSettings} from './composite.ts';
import {EffectsRenderer} from './effects.ts';
import type {Settings} from './settings.ts';
export class Renderer {
  private sample=document.createElement('canvas');
  private sc=this.sample.getContext('2d',{willReadFrequently:true})!;
  private ctx:CanvasRenderingContext2D;
  private canvas:HTMLCanvasElement;
  private effects=new EffectsRenderer();
  private coverage=new GlyphCoverage();
  private compositor=new Compositor();
  private cached?:{frame:CanvasImageSource;settings:Settings;cols:number;rows:number;cells:Cell[]};
  constructor(canvas:HTMLCanvasElement){this.canvas=canvas;const ctx=canvas.getContext('2d');if(!ctx)throw Error('Canvas 2D is unavailable.');this.ctx=ctx;}
  draw(frame:CanvasImageSource,w:number,h:number,s:Settings,t:number,reduced=false,side=MAX_RENDER_SIDE,even=false,options:{budget?:number;highResolution?:boolean;staticSource?:boolean;videoResolution?:boolean;opaque?:boolean}={}){
    const size=options.videoResolution?videoOutputSize(w,h,side,even):even?mp4OutputSize(w,h,side):options.highResolution?pngOutputSize(w,h,side):outputSize(w,h,side);if(!size)throw Error('MP4 needs at least 2 × 2 output pixels.');const {canvas,ctx}=this;
    if(canvas.width!==size.width||canvas.height!==size.height){canvas.width=size.width;canvas.height=size.height;}
    const {cols,rows}=gridSize(w,h,s.cell,options.budget??VIDEO_CELLS);
    const spatial=s.mode==='braille'&&s.brailleSampling!=='density',sampleW=spatial?cols*2:cols,sampleH=spatial?rows*4:rows;
    if(this.sample.width!==sampleW||this.sample.height!==sampleH){this.sample.width=sampleW;this.sample.height=sampleH;}
    let cells:Cell[];
    const cache=this.cached;
    if(options.staticSource&&cache&&cache.frame===frame&&cache.settings===s&&cache.cols===cols&&cache.rows===rows)cells=cache.cells;
    else{
      this.sc.clearRect(0,0,sampleW,sampleH);this.sc.imageSmoothingEnabled=true;this.sc.imageSmoothingQuality='high';this.sc.drawImage(frame,0,0,sampleW,sampleH);
      const data=this.sc.getImageData(0,0,sampleW,sampleH).data;
      cells=spatial?spatialBrailleCells(data,cols,rows,s):pixelsToCells(data,cols,rows,s);
      this.cached=options.staticSource?{frame,settings:s,cols,rows,cells}:undefined;
    }
    const chars=Array.from(s.ramp),color=colorMapper(s),motion=isCreativeMotion(s.effect)?creativeFrame(s,t):undefined;
    const glyphMode=!s.mode||s.mode==='glyph',density=s.density??100,emphasis=s.edgeEmphasis??0,markScale=(s.markSize??100)/100;
    const edges=s.mode==='contours'||emphasis>0?detailMap(cells,cols,rows):undefined;
    let dither:Uint8Array|undefined;
    if(s.mode==='dither'){const tones=new Float32Array(cols*rows).fill(-1);for(const c of cells)tones[c.y*cols+c.x]=detailLight(c,density,emphasis,edges,cols,rows);dither=ditherMap(tones,cols,rows,s.ditherAlgorithm??'bayer4',s.ditherThreshold??50);}
    const scale=Math.min(size.width/w,size.height/h),contentW=w*scale,contentH=h*scale;const ox=(size.width-contentW)/2,oy=(size.height-contentH)/2,cw=contentW/cols,ch=contentH/rows;
    const composition=compositeSettings(s);this.compositor.backdrop(ctx,frame,composition,ox,oy,contentW,contentH);
    const markCtx=this.compositor.marksContext(ctx,composition);markCtx.font=markFont(cw,ch,s.glyphWeight??400,markScale);markCtx.textAlign='center';markCtx.textBaseline='middle';
    const measured=glyphMode?this.coverage.prepare(chars,cw/ch,s.glyphWeight??400,s.monochrome||s.palette!=='white'&&s.palette!=='paper'?s.coverageCompensation??65:0,markScale):undefined;
    const calibrated=measured&&s.glyphMapping!=='ordered',motionChars=calibrated?measured.ordered:chars;
    for(const c of cells){
      if(composition.markOpacity===0)break;
      const light=detailLight(c,density,emphasis,edges,cols,rows);
      const glyph=calibrated?measured.lookup[Math.round(light)]:(chars[Math.round(light/255*(chars.length-1))]??' ');
      const mark=dither?{...c,light,glyph,ditherBit:dither[c.y*cols+c.x]}:light===c.light&&glyph===c.glyph?c:{...c,light,glyph};
      const a=animate(mark,t,cols,rows,s,reduced,motionChars,motion);if(a.opacity<.01)continue;
      markCtx.globalAlpha=a.opacity*(c.maskOpacity??1);markCtx.fillStyle=color(c,measured?.gains.get(a.glyph)??1);
      const edge=s.mode==='contours'&&edges?edgeStrength(edges,cols,rows,c.x,c.y):undefined;
      drawMark(markCtx,mark,s,a.glyph,ox+(c.x+.5+a.dx)*cw,oy+(c.y+.5+a.dy)*ch,cw*markScale,ch*markScale,edge);
    }
    markCtx.globalAlpha=1;
    this.compositor.finish(ctx,markCtx,composition,options.opaque===true||options.videoResolution===true);
    // Existing opaque post-processing passes are bypassed for alpha artwork.
    if(composition.backdrop!=='transparent')this.effects.apply(canvas,ctx,s.effects,s);
  }
}
