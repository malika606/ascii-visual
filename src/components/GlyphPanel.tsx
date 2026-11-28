import type {Settings} from '../engine/settings.ts';
import {detailDefaults} from '../engine/detail.ts';
export function GlyphPanel({settings,onChange}:{settings:Settings;onChange:(s:Settings)=>void}){
 const mode=settings.mode??'glyph',variable=mode!=='pixel'&&mode!=='led'&&mode!=='contours';
 const range=(key:'density'|'markSize'|'edgeEmphasis',label:string,min:number,max:number)=><label className="range"><span>{label}<output>{settings[key]??detailDefaults[key]}%</output></span><input aria-label={label} type="range" min={min} max={max} step={1} value={settings[key]??detailDefaults[key]} onChange={e=>onChange({...settings,[key]:Number(e.target.value)})}/></label>;
 return <details className="advanced glyph-details" open><summary>Mark geometry</summary><div className="advanced-body">
 {mode==='glyph'&&<label className="select">Glyph mapping<select aria-label="Glyph mapping" value={settings.glyphMapping??'measured'} onChange={e=>onChange({...settings,glyphMapping:e.target.value as 'measured'|'ordered'})}><option value="measured">Measured ink density</option><option value="ordered">Original ramp order</option></select></label>}
 {variable&&range('density','Density',50,160)}
 {range('markSize','Mark size',50,130)}
 {variable&&range('edgeEmphasis','Edge emphasis',0,100)}
 <p className="hint">Density changes the tone-to-mark mapping; size changes marks without changing the grid. Edge emphasis increases mark density near sampled luminance boundaries. Masked cells remain hidden.</p>
 <button type="button" className="wide" onClick={()=>onChange({...settings,...detailDefaults})}>Reset geometry</button>
 </div></details>;
}
