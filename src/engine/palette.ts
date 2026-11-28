import type {Settings,StylePalette} from './settings.ts';
import type {Cell} from './pixels.ts';
import {gainRgb} from './tonal.ts';

export const gradients={rose:['#481770','#ffb6df'],ocean:['#173982','#8bffde'],sunset:['#81244f','#ffe0a0'],ice:['#21456f','#e3faff']} as const;
export const paletteLabels:Record<StylePalette,string>={source:'Original colors',white:'Silver / white',amber:'Amber',paper:'Warm paper',rose:'Rose neon',ocean:'Ocean',sunset:'Sunset',ice:'Ice',custom:'Custom duotone'};
export function rgbFromHex(hex:string,fallback='#ffffff'):[number,number,number]{
  const value=parseInt((/^#[0-9a-f]{6}$/i.test(hex)?hex:fallback).slice(1),16);
  return [value>>16,(value>>8)&255,value&255];
}
export function gradientStops(s:Settings):readonly [string,string]|undefined{
  const p=s.palette;
  if(p==='custom')return [s.gradientLow??'#48216b',s.gradientHigh??'#ffb6df'];
  if(p==='rose'||p==='ocean'||p==='sunset'||p==='ice')return gradients[p];
  return undefined;
}
export function gradientColor(low:string,high:string,light:number){
  const a=rgbFromHex(low),b=rgbFromHex(high),t=Math.max(0,Math.min(255,light))/255;
  // Fade the deepest tones to black; retain legible shading even with bright custom stops.
  const gain=Math.min(1,t*3);
  return 'rgb('+a.map((v,i)=>Math.round((v+(b[i]-v)*t)*gain)).join(',')+')';
}
export function colorMapper(s:Settings):(c:Cell,gain?:number)=>string{
  if(s.monochrome||!s.palette||s.palette==='source')return (c,gain=1)=>gain===1?`rgb(${c.red},${c.green},${c.blue})`:`rgb(${gainRgb(c.red,c.green,c.blue,gain).join(',')})`;
  const stops=gradientStops(s);
  if(stops){
    const table=Array.from({length:256},(_,i)=>gradientColor(stops[0],stops[1],i));
    return (c,gain=1)=>table[Math.max(0,Math.min(255,Math.round((c.colorLight??c.light)*gain)))];
  }
  if(s.palette==='amber')return (c,gain=1)=>{const l=Math.min(255,(c.colorLight??c.light)*gain);return `rgb(${Math.round(l)},${Math.round(188*l/255)},${Math.round(68*l/255)})`;};
  return ()=>s.palette==='paper'?'#e9dfc8':'#f3f3f3';
}
