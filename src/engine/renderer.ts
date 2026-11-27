import {fitSize,pixelsToCells,outputSize,mp4OutputSize,MAX_RENDER_SIDE} from './pixels.ts';
import {animate} from './motion.ts';
import type {Settings} from './settings.ts';
export class Renderer {
  private sample=document.createElement('canvas');
  private sc=this.sample.getContext('2d',{willReadFrequently:true})!;
  private ctx:CanvasRenderingContext2D;
  private canvas:HTMLCanvasElement;
  constructor(canvas:HTMLCanvasElement){this.canvas=canvas;const ctx=canvas.getContext('2d',{alpha:false});if(!ctx)throw Error('Canvas 2D is unavailable.');this.ctx=ctx;}
  draw(frame:CanvasImageSource,w:number,h:number,s:Settings,t:number,reduced=false,side=MAX_RENDER_SIDE,even=false){
    const size=even?mp4OutputSize(w,h,side):outputSize(w,h,side);if(!size)throw Error('MP4 needs at least 2 × 2 output pixels.');const reference=fitSize(w,h), {canvas,ctx}=this;
    if(canvas.width!==size.width||canvas.height!==size.height){canvas.width=size.width;canvas.height=size.height;}
    const cellH=s.cell,cellW=s.cell*.62,cols=Math.max(1,Math.floor(reference.width/cellW)),rows=Math.max(1,Math.floor(reference.height/cellH));
    if(this.sample.width!==cols||this.sample.height!==rows){this.sample.width=cols;this.sample.height=rows;}
    this.sc.clearRect(0,0,cols,rows);this.sc.imageSmoothingEnabled=true;this.sc.imageSmoothingQuality='high';this.sc.drawImage(frame,0,0,cols,rows);
    const cells=pixelsToCells(this.sc.getImageData(0,0,cols,rows).data,cols,rows,s);
    ctx.globalAlpha=1;ctx.fillStyle='#000';ctx.fillRect(0,0,canvas.width,canvas.height);
    const scale=Math.min(size.width/w,size.height/h),contentW=w*scale,contentH=h*scale;const ox=(size.width-contentW)/2,oy=(size.height-contentH)/2,cw=contentW/cols,ch=contentH/rows;ctx.font=`${Math.min(ch,cw/.62)*.96}px ui-monospace, Consolas, monospace`;ctx.textAlign='center';ctx.textBaseline='middle';
    for(const c of cells){const a=animate(c,t,cols,rows,s,reduced);if(a.opacity<.01)continue;ctx.globalAlpha=a.opacity;ctx.fillStyle=`rgb(${c.red},${c.green},${c.blue})`;ctx.fillText(a.glyph,ox+(c.x+.5+a.dx)*cw,oy+(c.y+.5+a.dy)*ch);}
    ctx.globalAlpha=1;
  }
}
