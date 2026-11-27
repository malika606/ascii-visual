import {decodeGif,gifFrameIndex} from './gif.ts';
import {validateFile,validateDimensions,validateDuration,type Kind} from './validation.ts';
export interface Source {kind:Kind;width:number;height:number;duration:number;frame(t:number):CanvasImageSource;position(t:number):number;seek(t:number,signal?:AbortSignal):Promise<number>;play():Promise<void>;pause():void;reset():Promise<void>;dispose():void}
export function clampPosition(t:number,duration:number){return Math.min(Math.max(0,duration-.001),Math.max(0,Number.isFinite(t)?t:0));}
const noop=()=>{};const done=async()=>{};
function aborted(signal?:AbortSignal){if(signal?.aborted)throw new DOMException('Loading cancelled.','AbortError');}
function waitEvent(el:HTMLMediaElement,event:string,signal?:AbortSignal,timeout=12000){return new Promise<void>((resolve,reject)=>{
  let timer:ReturnType<typeof setTimeout>;const cleanup=()=>{clearTimeout(timer);el.removeEventListener(event,ok);el.removeEventListener('error',fail);signal?.removeEventListener('abort',cancel);};
  const ok=()=>{cleanup();resolve();},fail=()=>{cleanup();reject(Error('Video cannot be decoded by this browser.'));},cancel=()=>{cleanup();reject(new DOMException('Loading cancelled.','AbortError'));};
  el.addEventListener(event,ok,{once:true});el.addEventListener('error',fail,{once:true});signal?.addEventListener('abort',cancel,{once:true});timer=setTimeout(()=>{cleanup();reject(Error('Video decoding timed out.'));},timeout);if(signal?.aborted)cancel();
});}
// A seeked event can precede the next painted video frame. Yield two animation
// frames before a paused redraw; bounded fallback also works in a hidden tab.
function settleFrame(signal:AbortSignal){return new Promise<void>((resolve,reject)=>{let raf=0;const clean=()=>{cancelAnimationFrame(raf);clearTimeout(timer);signal.removeEventListener('abort',cancel);};const finish=()=>{clean();resolve();};const cancel=()=>{clean();reject(new DOMException('Seek cancelled.','AbortError'));};const timer=setTimeout(finish,150);signal.addEventListener('abort',cancel,{once:true});if(signal.aborted){cancel();return;}raf=requestAnimationFrame(()=>{raf=requestAnimationFrame(finish);});});}
export async function loadSource(file:File,signal?:AbortSignal):Promise<Source>{
  const kind=validateFile(file);aborted(signal);
  if(kind==='image'){
    const bitmap=await createImageBitmap(file);try{aborted(signal);validateDimensions(bitmap.width,bitmap.height);}catch(e){bitmap.close();throw e;}
    return {kind,width:bitmap.width,height:bitmap.height,duration:0,frame:()=>bitmap,position:()=>0,seek:async()=>0,play:done,pause:noop,reset:done,dispose:()=>bitmap.close()};
  }
  if(kind==='gif'){
    const buffer=await file.arrayBuffer();aborted(signal);let gif=decodeGif(buffer);const canvas=document.createElement('canvas');canvas.width=gif.width;canvas.height=gif.height;const ctx=canvas.getContext('2d')!;let last=-1;
    return {kind,width:gif.width,height:gif.height,duration:gif.duration,frame(t){const index=gifFrameIndex(gif,t);if(index!==last){const f=gif.frames[index];ctx.putImageData(new ImageData(f.rgba,gif.width,gif.height),0,0);last=index;}return canvas;},position:t=>t>=0&&t<gif.duration?t:((t%gif.duration)+gif.duration)%gif.duration,seek:async(t,signal)=>{aborted(signal);return clampPosition(t,gif.duration);},play:done,pause:noop,reset:async()=>{last=-1;},dispose(){gif={...gif,frames:[]};canvas.width=canvas.height=0;}};
  }
  const video=document.createElement('video');video.muted=true;video.defaultMuted=true;video.playsInline=true;video.loop=true;video.preload='auto';const url=URL.createObjectURL(file);let disposed=false;const lifetime=new AbortController();
  const dispose=()=>{if(disposed)return;disposed=true;lifetime.abort();video.pause();video.removeAttribute('src');video.load();URL.revokeObjectURL(url);};
  try{const ready=waitEvent(video,'loadeddata',signal);video.src=url;await ready;aborted(signal);validateDimensions(video.videoWidth,video.videoHeight);validateDuration(video.duration);
    const seek=async(t:number,signal?:AbortSignal)=>{aborted(lifetime.signal);aborted(signal);video.pause();const target=clampPosition(t,video.duration);
      if(!video.seeking&&Math.abs(video.currentTime-target)<.00001)return video.currentTime;
      const combined=signal?AbortSignal.any([lifetime.signal,signal]):lifetime.signal;
      const pending=waitEvent(video,'seeked',combined);video.currentTime=target;await pending;await settleFrame(combined);aborted(combined);return video.currentTime;};
    return {kind,width:video.videoWidth,height:video.videoHeight,duration:video.duration,frame:()=>video,position:()=>video.currentTime,seek,play:async()=>{await video.play();},pause:()=>video.pause(),reset:async()=>{await seek(0);},dispose};
  }catch(e){dispose();throw e;}
}
