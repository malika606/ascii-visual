import {fitSize, MAX_RENDER_SIDE} from './pixels.ts';
export type PreviewQuality = 'auto' | 'fast' | 'high';
export const MIN_CELL = 2, MAX_CELL = 32;
export const FAST_CELLS = 24_000, HIGH_PLAY_CELLS = 90_000, PNG_CELLS = 240_000, VIDEO_CELLS = 60_000;
export const MAX_PNG_SIDE = 3840;

// Fixed reference grid: larger PNGs rasterize the artwork afresh, not a scaled bitmap.
export function gridSize(w:number,h:number,cell:number,budget=PNG_CELLS){
  const ref=fitSize(w,h,MAX_RENDER_SIDE);
  const step=Math.max(MIN_CELL,Math.min(MAX_CELL,Number.isFinite(cell)?cell:9));
  const limit=Math.max(1,Math.floor(Number.isFinite(budget)?budget:PNG_CELLS));
  const requestedCols=Math.max(1,Math.floor(ref.width/(step*.62)));
  const requestedRows=Math.max(1,Math.floor(ref.height/step));
  const factor=Math.min(1,Math.sqrt(limit/(requestedCols*requestedRows)));
  const cols=Math.max(1,Math.min(limit,Math.floor(requestedCols*factor)));
  const rows=Math.max(1,Math.min(Math.floor(limit/cols),Math.floor(requestedRows*factor)));
  return {cols,rows,limited:cols!==requestedCols||rows!==requestedRows};
}
export function previewBudget(quality:PreviewQuality,playing:boolean){
  return quality==='fast'?FAST_CELLS:playing?(quality==='high'?HIGH_PLAY_CELLS:FAST_CELLS):PNG_CELLS;
}
export function pngOutputSize(w:number,h:number,side:number){
  return fitSize(w,h,Math.max(1,Math.min(MAX_PNG_SIDE,side)));
}
export function pngResolutionChoices(w:number,h:number){
  const max=Math.min(MAX_PNG_SIDE,Math.max(w,h));
  return [...new Set([max,2560,1920,1440,960,720,480,320].filter(n=>n<=max))].sort((a,b)=>b-a).map(side=>({side,...pngOutputSize(w,h,side)}));
}
