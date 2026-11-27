import {Renderer} from '../engine/renderer.ts';
import type {Settings} from '../engine/settings.ts';
import {loadSource} from '../media/source.ts';
export interface RecordingFormat {mime:string;extension:'webm'|'mp4'}
const formats:RecordingFormat[]=[{mime:'video/webm;codecs=vp9',extension:'webm'},{mime:'video/webm;codecs=vp8',extension:'webm'},{mime:'video/webm',extension:'webm'},{mime:'video/mp4;codecs=avc1.42001f',extension:'mp4'},{mime:'video/mp4;codecs=avc1',extension:'mp4'}];
export function supportedFormats(){if(typeof MediaRecorder==='undefined'||typeof HTMLCanvasElement.prototype.captureStream!=='function')return [];return (['webm','mp4'] as const).flatMap(ext=>{const f=formats.find(f=>f.extension===ext&&MediaRecorder.isTypeSupported(f.mime));return f?[f]:[];});}
export function supportedFormat(){return supportedFormats()[0]??null;}
export function extensionForMime(mime:string){if(/^video\/webm(?:;|$)/i.test(mime))return 'webm';if(/^video\/mp4(?:;|$)/i.test(mime))return 'mp4';throw Error('Recorder returned an unknown video format.');}
export async function verifyContainer(blob:Blob,extension:string){const b=new Uint8Array(await blob.slice(0,16).arrayBuffer());const valid=extension==='webm'?b[0]===0x1a&&b[1]===0x45&&b[2]===0xdf&&b[3]===0xa3:extension==='mp4'&&String.fromCharCode(...b.slice(4,8))==='ftyp';if(!valid)throw Error('Recorder returned bytes inconsistent with the requested container.');}
export function exportDuration(sourceDuration:number,kind:string){return kind==='image'?5:Math.min(15,Math.max(2,sourceDuration));}
export async function record(file:File,settings:Settings,signal:AbortSignal,onProgress:(p:number)=>void,options:{format?:RecordingFormat;side?:number}={}):Promise<{blob:Blob;extension:string}>{
  const format=options.format??supportedFormat();if(!format)throw Error('Video recording is not supported by this browser.');
  if(document.hidden)throw Error('Keep the tab visible during recording.');
  const source=await loadSource(file,signal);let stream:MediaStream|undefined,recorder:MediaRecorder|undefined,raf=0;
  try{
    const canvas=document.createElement('canvas'),renderer=new Renderer(canvas);const duration=exportDuration(source.duration,source.kind);renderer.draw(source.frame(0),source.width,source.height,settings,0,false,options.side,format.extension==='mp4');
    stream=canvas.captureStream(24);recorder=new MediaRecorder(stream,{mimeType:format.mime,videoBitsPerSecond:3_000_000});const mr=recorder;const chunks:Blob[]=[];
    return await new Promise<{blob:Blob;extension:string}>((resolve,reject)=>{
      let start=0,nextDraw=0,finished=false,watchdog:ReturnType<typeof setTimeout>;
      const cleanup=()=>{clearTimeout(watchdog);cancelAnimationFrame(raf);signal.removeEventListener('abort',cancel);document.removeEventListener('visibilitychange',visibility);mr.ondataavailable=null;mr.onerror=null;mr.onstop=null;};
      const fail=(e:unknown)=>{if(finished)return;finished=true;cleanup();if(mr.state!=='inactive')mr.stop();reject(e);};
      const cancel=()=>fail(new DOMException('Export cancelled.','AbortError'));const visibility=()=>{if(document.hidden)fail(Error('Recording stopped because the tab became hidden.'));};
      mr.ondataavailable=e=>{if(e.data.size)chunks.push(e.data);};mr.onerror=()=>fail(Error('Video recorder failed.'));
      mr.onstop=async()=>{if(finished)return;try{const mime=mr.mimeType||chunks[0]?.type||format.mime;const blob=new Blob(chunks,{type:mime.split(';')[0]});if(!blob.size)throw Error('Recorder produced an empty video.');const extension=extensionForMime(mime);if(extension!==format.extension)throw Error('Recorder returned a different container than requested.');await verifyContainer(blob,extension);if(finished)return;finished=true;cleanup();resolve({blob,extension});}catch(e){fail(e);}};
      const tick=(now:number)=>{if(finished)return;try{const t=(now-start)/1000;if(t>=duration){onProgress(1);mr.stop();return;}if(t*1000>=nextDraw){renderer.draw(source.frame(t),source.width,source.height,settings,t,false,options.side,format.extension==='mp4');nextDraw=(Math.floor(t*24)+1)*1000/24;onProgress(t/duration);}raf=requestAnimationFrame(tick);}catch(e){fail(e);}};
      signal.addEventListener('abort',cancel,{once:true});document.addEventListener('visibilitychange',visibility);watchdog=setTimeout(()=>fail(Error('Recording timed out.')), (duration+15)*1000);
      if(signal.aborted){cancel();return;}if(document.hidden){visibility();return;}
      source.play().then(()=>{if(finished)return;try{mr.start(250);start=performance.now();raf=requestAnimationFrame(tick);}catch(e){fail(e);}},fail);
    });
  }finally{cancelAnimationFrame(raf);if(recorder&&recorder.state!=='inactive')recorder.stop();stream?.getTracks().forEach(t=>t.stop());source.dispose();}
}
