export type Kind='image'|'gif'|'video';
export const MAX_FILE_BYTES=30*1024*1024, MAX_VIDEO_SECONDS=15, MAX_IMAGE_PIXELS=24_000_000, MAX_GIF_PIXELS=2_000_000, MAX_GIF_FRAMES=300, MAX_GIF_DECODED_BYTES=96*1024*1024;
const formats:Record<string,Kind>={'image/png':'image','image/jpeg':'image','image/webp':'image','image/gif':'gif','video/mp4':'video','video/webm':'video'};
const extensions:Record<string,Kind>={png:'image',jpg:'image',jpeg:'image',webp:'image',gif:'gif',mp4:'video',webm:'video'};
export function validateFile(file:{name:string;type:string;size:number}):Kind{
  if(file.size===0)throw Error('The file is empty.');
  if(file.size>MAX_FILE_BYTES)throw Error('File exceeds the 30 MB limit.');
  const kind=formats[file.type.toLowerCase()]||((!file.type||file.type==='application/octet-stream')?extensions[file.name.split('.').pop()!.toLowerCase()]:undefined);
  if(!kind)throw Error('Unsupported file. Choose PNG, JPG, WebP, GIF, MP4 or WebM.');return kind;
}
export function validateDimensions(w:number,h:number,max=MAX_IMAGE_PIXELS){if(!Number.isSafeInteger(w)||!Number.isSafeInteger(h)||w<=0||h<=0||w*h>max)throw Error('Unsupported image dimensions (pixel limit exceeded).');}
export function validateDuration(seconds:number){if(!Number.isFinite(seconds)||seconds<=0||seconds>MAX_VIDEO_SECONDS)throw Error('Video must have a finite duration of up to 15 seconds.');}
