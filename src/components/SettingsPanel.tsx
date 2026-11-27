import type {Settings,Effect,BackgroundMode} from '../engine/settings.ts';
import {presets} from '../engine/settings.ts';
import {StyleLibrary} from './StyleLibrary.tsx';
import {EffectsPanel} from './EffectsPanel.tsx';
export const ramps = {Classic:presets.Bloom.ramp,Numbers:'0123456789',Binary:'01',Blocks:'░▒▓█'};
const controls=[{key:'cell',label:'Detail',min:2,max:32,step:1,unit:' px'},{key:'contrast',label:'Contrast',min:.5,max:2,step:.05,unit:'×'},{key:'saturation',label:'Color intensity',min:0,max:2,step:.05,unit:'×'},{key:'threshold',label:'Dark threshold',min:0,max:100,step:1,unit:''},{key:'speed',label:'Speed',min:.25,max:2,step:.05,unit:'×'}] as const;
export function SettingsPanel({settings,onChange,disabled,style,onStyle,reduced,onReduced}:{settings:Settings;onChange:(s:Settings)=>void;disabled:boolean;style:string;onStyle:(s:string)=>void;reduced:boolean;onReduced:(r:boolean)=>void}){
  const range=(c:typeof controls[number])=><label className="range" key={c.key}><span>{c.label}<output>{Number(settings[c.key].toFixed(2))}{c.unit}</output></span><input aria-label={c.label} aria-describedby={c.key==='cell'?'detail-help':undefined} type="range" min={c.min} max={c.max} step={c.step} value={settings[c.key]} onChange={e=>onChange({...settings,[c.key]:Number(e.target.value)})}/></label>;
  const chosen=Object.entries(ramps).find(([,v])=>v===settings.ramp)?.[0]??'preset';
  return <fieldset disabled={disabled} className="settings"><legend>Style <span className="selected-style">{style}{JSON.stringify(settings)!==JSON.stringify(presets[style])?' · adjusted':''}</span></legend><StyleLibrary style={style} onSelect={name=>{onStyle(name);onChange({...presets[name]});}}/>
    {range(controls[0])}<p className="hint" id="detail-help">Smaller marks = more detail.</p>{range(controls[1])}{range(controls[2])}
    {(!settings.mode||settings.mode==='glyph')&&<label className="select">Characters<select aria-label="Characters" value={chosen} onChange={e=>{const ramp=ramps[e.target.value as keyof typeof ramps]??presets[style].ramp;onChange({...settings,ramp});}}>{!Object.values(ramps).includes(presets[style].ramp)&&<option value="preset">{style} original</option>}{Object.entries(ramps).map(([name,chars])=><option key={name} value={name}>{name} · {chars}</option>)}</select></label>}
    <EffectsPanel settings={settings} onChange={onChange}/>
    <details className="advanced"><summary>Advanced settings</summary><div className="advanced-body">
    <label className="select">Background mode<select aria-label="Background mode" value={settings.background} onChange={e=>onChange({...settings,background:e.target.value as BackgroundMode})}><option value="dark">Dark / transparent</option><option value="light">Light</option><option value="color">Chosen color</option></select></label>
    {settings.background==='color'&&<label className="check color-picker">Background color <input type="color" value={settings.keyColor} onChange={e=>onChange({...settings,keyColor:e.target.value})}/></label>}
    {settings.background!=='dark'&&<><label className="range"><span>Background tolerance<output>{settings.tolerance}%</output></span><input aria-label="Background tolerance" type="range" min={0} max={100} step={1} value={settings.tolerance} onChange={e=>onChange({...settings,tolerance:Number(e.target.value)})}/></label><p className="hint">Masks matching colors, including parts of the subject.</p></>}
    {range(controls[3])}<p className="hint">Hide dark pixels in any background mode.</p>
    <label className="select">Motion<select aria-label="Motion" value={settings.effect} onChange={e=>onChange({...settings,effect:e.target.value as Effect})}><option value="reveal">Reveal + glimmer</option><option value="wave">Soft wave</option><option value="glimmer">Glimmer</option><option value="none">None</option></select></label>
    {settings.effect!=='none'&&range(controls[4])}
    <label className="check"><input type="checkbox" checked={settings.monochrome} onChange={e=>onChange({...settings,monochrome:e.target.checked})}/> Green monochrome</label>
    <label className="check"><input type="checkbox" checked={reduced} onChange={e=>onReduced(e.target.checked)}/> Reduce motion</label>
    </div></details>
  </fieldset>;
}
