import {pixelsToCells,outputSize,mp4OutputSize,MAX_RENDER_SIDE} from './pixels.ts';
import {gridSize,pngOutputSize,VIDEO_CELLS} from './quality.ts';
import type {Cell} from './pixels.ts';
import {animate} from './motion.ts';
import {drawMark,edgeStrength} from './marks.ts';
import {colorMapper} from './palette.ts';
import {EffectsRenderer} from './effects.ts';
import type {Settings} from './settings.ts';
export class Renderer {
  private sample=document.createElement('canvas');
  private sc=this.sample.getContext('2d',{willReadFrequently:true})!;
  private ctx:CanvasRenderingContext2D;
  private canvas:HTMLCanvasElement;
  private effects=new EffectsRenderer();
  private cached?:{frame:CanvasImageSource;settings:Settings;cols:number;rows:number;cells:Cell[]};
  constructor(canvas:HTMLCanvasElement){this.canvas=canvas;const ctx=canvas.getContext('2d',{alpha:false});if(!ctx)throw Error('Canvas 2D is unavailable.');this.ctx=ctx;}
  draw(frame:CanvasImageSource,w:number,h:number,s:Settings,t:number,reduced=false,side=MAX_RENDER_SIDE,even=false,options:{budget?:number;highResolution?:boolean;staticSource?:boolean}={}){
    const size=even?mp4OutputSize(w,h,side):options.highResolution?pngOutputSize(w,h,side):outputSize(w,h,side);if(!size)throw Error('MP4 needs at least 2 × 2 output pixels.');const {canvas,ctx}=this;
    if(canvas.width!==size.width||canvas.height!==size.height){canvas.width=size.width;canvas.height=size.height;}
    const {cols,rows}=gridSize(w,h,s.cell,options.budget??VIDEO_CELLS);
    if(this.sample.width!==cols||this.sample.height!==rows){this.sample.width=cols;this.sample.height=rows;}
    let cells:Cell[];
    const cache=this.cached;
    if(options.staticSource&&cache&&cache.frame===frame&&cache.settings===s&&cache.cols===cols&&cache.rows===rows)cells=cache.cells;
    else{
      this.sc.clearRect(0,0,cols,rows);this.sc.imageSmoothingEnabled=true;this.sc.imageSmoothingQuality='high';this.sc.drawImage(frame,0,0,cols,rows);
      cells=pixelsToCells(this.sc.getImageData(0,0,cols,rows).data,cols,rows,s);
      this.cached=options.staticSource?{frame,settings:s,cols,rows,cells}:undefined;
    }
    const chars=Array.from(s.ramp),color=colorMapper(s);
    const edges=s.mode==='contours'?new Float32Array(cols*rows):undefined;
    if(edges)for(const c of cells)edges[c.y*cols+c.x]=c.light;
    ctx.globalAlpha=1;ctx.fillStyle='#000';ctx.fillRect(0,0,canvas.width,canvas.height);
    const scale=Math.min(size.width/w,size.height/h),contentW=w*scale,contentH=h*scale;const ox=(size.width-contentW)/2,oy=(size.height-contentH)/2,cw=contentW/cols,ch=contentH/rows;ctx.font=`${Math.min(ch,cw/.62)*.96}px ui-monospace, Consolas, monospace`;ctx.textAlign='center';ctx.textBaseline='middle';
    for(const c of cells){const a=animate(c,t,cols,rows,s,reduced,chars);if(a.opacity<.01)continue;ctx.globalAlpha=a.opacity;ctx.fillStyle=color(c);drawMark(ctx,c,s,a.glyph,ox+(c.x+.5+a.dx)*cw,oy+(c.y+.5+a.dy)*ch,cw,ch,edges?edgeStrength(edges,cols,rows,c.x,c.y):undefined);}
    ctx.globalAlpha=1;
    this.effects.apply(canvas,ctx,s.effects);
  }
}
