import type {Settings} from '../engine/settings.ts';
import {tonalDefaults} from '../engine/tonal.ts';
const sliders=[{key:'brightness',label:'Brightness',min:50,max:250,step:1,unit:'%'},{key:'gamma',label:'Gamma',min:.5,max:2.5,step:.05,unit:''},{key:'shadows',label:'Shadow lift',min:0,max:60,step:1,unit:'%'},{key:'highlights',label:'Highlights',min:-50,max:50,step:1,unit:'%'},{key:'colorBoost',label:'Color boost',min:50,max:200,step:1,unit:'%'}] as const;
export function TonalPanel({settings,onChange,onAuto}:{settings:Settings;onChange:(s:Settings)=>void;onAuto:()=>void}){
 return <section className="tonal-panel" aria-label="Tone controls">
 <div className="look-actions"><button type="button" onClick={onAuto}>Auto enhance</button><button type="button" onClick={()=>onChange({...settings,...tonalDefaults})}>Reset tone</button></div>
 {sliders.map(c=><label className="range" key={c.key}><span>{c.label}<output>{settings[c.key]??tonalDefaults[c.key]}{c.unit}</output></span><input type="range" aria-label={c.label} min={c.min} max={c.max} step={c.step} value={settings[c.key]??tonalDefaults[c.key]} onChange={e=>onChange({...settings,[c.key]:Number(e.target.value)})}/></label>)}
 {(!settings.mode||settings.mode==='glyph'||settings.mode==='braille')&&<label className="select">Font weight<select aria-label="Font weight" value={settings.glyphWeight??400} onChange={e=>onChange({...settings,glyphWeight:Number(e.target.value)})}><option value={400}>Regular</option><option value={500}>Medium</option><option value={700}>Bold</option></select></label>}
 <label className="check"><input type="checkbox" checked={settings.invert??false} onChange={e=>onChange({...settings,invert:e.target.checked})}/> Invert mark density</label>
 <p className="hint">Gamma above 1 lifts midtones. Color boost changes mark color independently of density. The background mask is applied first.</p>
 </section>;
}
