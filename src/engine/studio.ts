import {presets,type Settings,type StylePalette} from './settings.ts';
import {creativeMotionLabels} from './creativeMotion.ts';
import {effectNames} from './effects.ts';
export interface Look {style:string;settings:Settings}
export interface History {past:Look[];present:Look;future:Look[];group:number|null}
export type HistoryAction={type:'commit';look:Look;group?:number|null}|{type:'undo'}|{type:'redo'};
export const HISTORY_LIMIT=60;
export function sameSettings(a:Settings,b:Settings){
  const keys=new Set([...Object.keys(a),...Object.keys(b)] as (keyof Settings)[]);
  return [...keys].every(k=>k==='effects'?effectNames.every(n=>(a.effects?.[n]??0)===(b.effects?.[n]??0)):a[k]===b[k]);
}
export function copyLook(look:Look):Look{
  return {style:look.style,settings:{...look.settings,...(look.settings.effects?{effects:{...look.settings.effects}}:{})}};
}
export function initialHistory(look:Look):History{return {past:[],present:copyLook(look),future:[],group:null};}
export function historyReducer(h:History,action:HistoryAction):History{
  if(action.type==='undo'){
    if(!h.past.length)return h;
    return {past:h.past.slice(0,-1),present:h.past[h.past.length-1],future:[h.present,...h.future].slice(0,HISTORY_LIMIT),group:null};
  }
  if(action.type==='redo'){
    if(!h.future.length)return h;
    return {past:[...h.past,h.present].slice(-HISTORY_LIMIT),present:h.future[0],future:h.future.slice(1),group:null};
  }
  if(h.present.style===action.look.style&&sameSettings(h.present.settings,action.look.settings))return h;
  const group=action.group??null;
  const past=group!==null&&group===h.group?h.past:[...h.past,h.present].slice(-HISTORY_LIMIT);
  return {past,present:copyLook(action.look),future:[],group};
}
// A density ramp is an ordered sequence of printable Unicode code points, dark to light.
// Spaces are allowed as a low-density mark; control/format characters are not.
export function validRamp(value:unknown):value is string{
  return typeof value==='string'&&Array.from(value).length>=1&&Array.from(value).length<=64&&value.trim().length>0&&!/[\p{C}\p{Zl}\p{Zp}]/u.test(value);
}
const ranges={cell:[2,32],contrast:[.5,2],saturation:[0,2],threshold:[0,100],tolerance:[0,100],speed:[.25,2]} as const;
const optionalRanges={motionIntensity:[0,100],motionDuration:[1,5]} as const;
const allowedEnums={background:['dark','light','color'],effect:['none','reveal','wave','glimmer',...Object.keys(creativeMotionLabels)],mode:['glyph','dots','pixel','dither','braille','contours','stipple','led','hatch','particles'],palette:['source','white','amber','paper','rose','ocean','sunset','ice','custom'],motionDirection:['up','down','left','right','outward','inward']} as const;
const inRange=(v:unknown,min:number,max:number)=>typeof v==='number'&&Number.isFinite(v)&&v>=min&&v<=max;
const hex=(v:unknown)=>typeof v==='string'&&/^#[0-9a-f]{6}$/i.test(v);
const own=(o:object,k:string)=>Object.prototype.hasOwnProperty.call(o,k);
const permitted=new Set([...Object.keys(ranges),...Object.keys(optionalRanges),...Object.keys(allowedEnums),'keyColor','gradientLow','gradientHigh','monochrome','motionLoop','ramp','effects']);
export function validLook(value:unknown):value is Look{
  if(!value||typeof value!=='object')return false;
  const look=value as Record<string,unknown>;
  if(typeof look.style!=='string'||!own(presets,look.style)||!look.settings||typeof look.settings!=='object'||Array.isArray(look.settings))return false;
  const s=look.settings as Record<string,unknown>;
  if(Object.keys(s).some(k=>!permitted.has(k)))return false;
  for(const [k,[min,max]] of Object.entries(ranges))if(!inRange(s[k],min,max))return false;
  for(const [k,[min,max]] of Object.entries(optionalRanges))if(s[k]!==undefined&&!inRange(s[k],min,max))return false;
  for(const [k,values] of Object.entries(allowedEnums))if((k==='background'||k==='effect'||s[k]!==undefined)&&!(values as readonly unknown[]).includes(s[k]))return false;
  if(!hex(s.keyColor)||!validRamp(s.ramp)||typeof s.monochrome!=='boolean')return false;
  for(const key of ['gradientLow','gradientHigh'])if(s[key]!==undefined&&!hex(s[key]))return false;
  if(s.motionLoop!==undefined&&typeof s.motionLoop!=='boolean')return false;
  if(s.effects!==undefined){
    if(!s.effects||typeof s.effects!=='object'||Array.isArray(s.effects))return false;
    const f=s.effects as Record<string,unknown>;
    if(Object.keys(f).some(k=>!(effectNames as readonly string[]).includes(k))||effectNames.some(k=>!inRange(f[k],0,100)))return false;
  }
  return true;
}
export interface SavedLook extends Look {name:string}
export const LOOKS_KEY='ascii-visual.looks.v1';
export const MAX_LOOKS=30;
export function parseLooks(raw:string|null):SavedLook[]{
  try{
    const value:unknown=JSON.parse(raw??'[]');
    if(!Array.isArray(value))return [];
    const seen=new Set<string>();
    return value.filter((x):x is SavedLook=>{
      if(!validLook(x))return false;
      const name=(x as SavedLook).name;
      if(typeof name!=='string'||!name.trim()||name.length>40||seen.has(name))return false;
      seen.add(name);return true;
    }).slice(0,MAX_LOOKS).map(x=>({name:x.name,...copyLook(x)}));
  }catch{return [];}
}
const ideas:readonly {style:string;palette:StylePalette;glow:number;grain:number;scanlines:number;split:number}[]=[
  {style:'Halftone',palette:'rose',glow:45,grain:8,scanlines:0,split:12},
  {style:'Fine',palette:'ice',glow:30,grain:10,scanlines:0,split:14},
  {style:'Terminal',palette:'amber',glow:35,grain:10,scanlines:40,split:0},
  {style:'Braille',palette:'ocean',glow:25,grain:6,scanlines:0,split:0},
  {style:'Engraving',palette:'paper',glow:0,grain:26,scanlines:0,split:0},
  {style:'LED',palette:'sunset',glow:48,grain:0,scanlines:12,split:15},
  {style:'Pixel',palette:'rose',glow:16,grain:0,scanlines:25,split:28},
  {style:'Microtype',palette:'source',glow:22,grain:7,scanlines:0,split:8}
];
export function surpriseLook(current:Look,random=Math.random):Look{
  const candidates=ideas.filter(x=>x.style!==current.style);
  const n=Math.max(0,Math.min(candidates.length-1,Math.floor(random()*candidates.length)));
  const idea=candidates[n]??candidates[0];
  // Curated combinations, not random extreme values; preserve the source mask.
  const s=current.settings;
  return {style:idea.style,settings:{...presets[idea.style],background:s.background,keyColor:s.keyColor,tolerance:s.tolerance,threshold:s.threshold,
    palette:idea.palette,monochrome:false,effect:'none',effects:{glow:idea.glow,grain:idea.grain,scanlines:idea.scanlines,rgbSplit:idea.split,distortion:0,vignette:10}}};
}
