import type {Settings,BackdropMode,MarkBlend} from './settings.ts';
export const backdropLabels:Record<BackdropMode,string>={black:'Black · pure ASCII',solid:'Solid color',source:'Original image',blurred:'Blurred image',transparent:'Transparent'};
export const blendLabels:Record<MarkBlend,string>={'source-over':'Normal',screen:'Screen',multiply:'Multiply',overlay:'Overlay','soft-light':'Soft light',difference:'Difference',lighten:'Lighten'};
export const compositeDefaults={backdrop:'black',backdropColor:'#000000',backdropOpacity:40,backdropBlur:30,markOpacity:100,markBlend:'source-over'} as const;
const percent=(n:number|undefined,fallback:number)=>typeof n==='number'&&Number.isFinite(n)?Math.max(0,Math.min(100,n)):fallback;
export function compositeSettings(s:Settings){
  const backdrop=s.backdrop??'black';
  return {backdrop,color:/^#[0-9a-f]{6}$/i.test(s.backdropColor??'')?s.backdropColor!:'#000000',opacity:percent(s.backdropOpacity,40)/100,blur:percent(s.backdropBlur,30),markOpacity:percent(s.markOpacity,100)/100,blend:backdrop==='transparent'?'source-over' as const:s.markBlend??'source-over'};
}
export const hybridSettings={backdrop:'blurred',backdropColor:'#000000',backdropOpacity:45,backdropBlur:25,markOpacity:100,markBlend:'screen'} as const;
export class Compositor {
  private blur?:HTMLCanvasElement;
  private marks?:HTMLCanvasElement;
  backdrop(ctx:CanvasRenderingContext2D,frame:CanvasImageSource,s:ReturnType<typeof compositeSettings>,x:number,y:number,w:number,h:number){
    const canvas=ctx.canvas;
    ctx.globalAlpha=1;ctx.globalCompositeOperation='source-over';ctx.clearRect(0,0,canvas.width,canvas.height);
    if(s.backdrop==='transparent')return;
    ctx.fillStyle=s.backdrop==='black'?'#000000':s.color;ctx.fillRect(0,0,canvas.width,canvas.height);
    if((s.backdrop!=='source'&&s.backdrop!=='blurred')||s.opacity===0)return;
    ctx.save();ctx.globalAlpha=s.opacity;ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality='high';
    if(s.backdrop==='blurred'&&s.blur>0){
      // Bounded downsample plus smooth resampling: browser-independent low-pass approximation.
      const b=this.blur??=document.createElement('canvas'),side=Math.max(8,Math.round(480/(1+s.blur*.16))),ratio=side/Math.max(w,h);
      b.width=Math.max(1,Math.round(w*ratio));b.height=Math.max(1,Math.round(h*ratio));
      const bc=b.getContext('2d')!;bc.imageSmoothingEnabled=true;bc.imageSmoothingQuality='high';bc.drawImage(frame,0,0,b.width,b.height);
      ctx.drawImage(b,x,y,w,h);
    }else ctx.drawImage(frame,x,y,w,h);
    ctx.restore();
  }
  marksContext(ctx:CanvasRenderingContext2D,s:ReturnType<typeof compositeSettings>){
    if(s.markOpacity===1&&s.blend==='source-over')return ctx;
    const b=this.marks??=document.createElement('canvas'),{width,height}=ctx.canvas;
    if(b.width!==width||b.height!==height){b.width=width;b.height=height;}
    const mc=b.getContext('2d')!;mc.globalAlpha=1;mc.globalCompositeOperation='source-over';mc.clearRect(0,0,width,height);return mc;
  }
  finish(ctx:CanvasRenderingContext2D,marks:CanvasRenderingContext2D,s:ReturnType<typeof compositeSettings>,opaque:boolean){
    if(marks!==ctx){ctx.globalAlpha=s.markOpacity;ctx.globalCompositeOperation=s.blend;ctx.drawImage(marks.canvas,0,0);}
    ctx.globalAlpha=1;ctx.globalCompositeOperation='source-over';
    if(s.backdrop==='transparent'&&opaque){ctx.globalCompositeOperation='destination-over';ctx.fillStyle='#000';ctx.fillRect(0,0,ctx.canvas.width,ctx.canvas.height);ctx.globalCompositeOperation='source-over';}
  }
}
