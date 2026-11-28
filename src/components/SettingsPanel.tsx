import {useEffect,useRef,useState} from 'react';
import type {KeyboardEvent,PointerEvent} from 'react';
import type {Settings,BackgroundMode} from '../engine/settings.ts';
import {presets} from '../engine/settings.ts';
import {sameSettings,validRamp,surpriseLook,type Look} from '../engine/studio.ts';
import {StyleLibrary} from './StyleLibrary.tsx';
import {EffectsPanel} from './EffectsPanel.tsx';
import {MotionPanel} from './MotionPanel.tsx';
import {TonalPanel} from './TonalPanel.tsx';
import {SavedLooks} from './SavedLooks.tsx';
export const ramps = {Classic:presets.Bloom.ramp,Numbers:'0123456789',Binary:'01',Blocks:'░▒▓█'};
const tabs=['Style','Adjust','Color','Motion','Effects'] as const;
type Tab=typeof tabs[number];
const controls=[{key:'cell',label:'Detail',min:2,max:32,step:1,unit:' px'},{key:'contrast',label:'Contrast',min:.5,max:2,step:.05,unit:'×'},{key:'saturation',label:'Color intensity',min:0,max:2,step:.05,unit:'×'},{key:'threshold',label:'Dark threshold',min:0,max:100,step:1,unit:''}] as const;
interface Props{
  settings:Settings;onChange:(s:Settings,style?:string)=>void;disabled:boolean;style:string;reduced:boolean;onReduced:(r:boolean)=>void;
  onAuto:()=>void;canUndo:boolean;canRedo:boolean;onUndo:()=>void;onRedo:()=>void;onGestureStart:()=>void;
}
export function SettingsPanel({settings,onChange,disabled,style,reduced,onReduced,canUndo,canRedo,onUndo,onRedo,onGestureStart,onAuto}:Props){
  const [tab,setTab]=useState<Tab>('Style'),[draft,setDraft]=useState(settings.ramp);
  const buttons=useRef<(HTMLButtonElement|null)[]>([]);
  useEffect(()=>setDraft(settings.ramp),[settings.ramp]);
  const look:Look={style,settings};
  const choose=(next:Look)=>onChange(next.settings,next.style);
  const range=(c:typeof controls[number])=><label className="range" key={c.key}><span>{c.label}<output>{Number(settings[c.key].toFixed(2))}{c.unit}</output></span><input aria-label={c.label} aria-describedby={c.key==='cell'?'detail-help':undefined} type="range" min={c.min} max={c.max} step={c.step} value={settings[c.key]} onChange={e=>onChange({...settings,[c.key]:Number(e.target.value)})}/></label>;
  const chosen=Object.entries(ramps).find(([,v])=>v===settings.ramp)?.[0]??(settings.ramp===presets[style].ramp?'preset':'custom');
  const applyRamp=()=>{if(validRamp(draft))onChange({...settings,ramp:draft});};
  function tabKey(e:KeyboardEvent<HTMLButtonElement>,index:number){
    let next=index;
    if(e.key==='ArrowRight')next=(index+1)%tabs.length;
    else if(e.key==='ArrowLeft')next=(index+tabs.length-1)%tabs.length;
    else if(e.key==='Home')next=0;
    else if(e.key==='End')next=tabs.length-1;
    else return;
    e.preventDefault();setTab(tabs[next]);buttons.current[next]?.focus();
  }
  const beginGesture=(e:PointerEvent<HTMLElement>)=>{if(e.target instanceof HTMLInputElement&&e.target.type==='range')onGestureStart();};
  return <fieldset disabled={disabled} className="settings" onPointerDownCapture={beginGesture}>
    <legend>Look <span className="selected-style">{style}{!sameSettings(settings,presets[style])?' · adjusted':''}</span></legend>
    <div className="history-actions"><button type="button" disabled={!canUndo} onClick={onUndo} title="Ctrl / Cmd + Z">Undo</button><button type="button" disabled={!canRedo} onClick={onRedo} title="Ctrl / Cmd + Shift + Z">Redo</button><button type="button" onClick={()=>choose(surpriseLook(look))}>Surprise me</button></div>
    <div role="tablist" aria-label="Studio settings" className="studio-tabs">
      {tabs.map((name,i)=><button key={name} type="button" role="tab" id={'studio-tab-'+name} aria-controls={'studio-panel-'+name} aria-selected={tab===name} tabIndex={tab===name?0:-1} ref={el=>{buttons.current[i]=el;}} onClick={()=>setTab(name)} onKeyDown={e=>tabKey(e,i)}>{name}</button>)}
    </div>
    <div role="tabpanel" id="studio-panel-Style" aria-labelledby="studio-tab-Style" hidden={tab!=='Style'}>
      <StyleLibrary style={style} onSelect={name=>onChange({...presets[name]},name)}/>
      <SavedLooks look={look} onApply={choose}/>
    </div>
    <div role="tabpanel" id="studio-panel-Adjust" aria-labelledby="studio-tab-Adjust" hidden={tab!=='Adjust'}>
      {range(controls[0])}<p className="hint" id="detail-help">Smaller marks = more detail.</p>{range(controls[1])}{range(controls[2])}<TonalPanel settings={settings} onChange={onChange} onAuto={onAuto}/>
      {(!settings.mode||settings.mode==='glyph')&&<>
        <label className="select">Characters<select aria-label="Characters" value={chosen} onChange={e=>{const key=e.target.value;const ramp=key==='custom'?' .:+#@':ramps[key as keyof typeof ramps]??presets[style].ramp;onChange({...settings,ramp});}}>{!Object.values(ramps).includes(presets[style].ramp)&&<option value="preset">{style} original</option>}{Object.entries(ramps).map(([name,chars])=><option key={name} value={name}>{name} · {chars}</option>)}<option value="custom">Custom</option></select></label>
        <label className="select">Custom characters<input aria-label="Custom characters" aria-describedby="ramp-help" maxLength={128} value={draft} onChange={e=>setDraft(e.target.value)} onKeyDown={e=>{if(e.key==='Enter'){e.preventDefault();applyRamp();}}}/></label>
        <p className="hint" id="ramp-help">1–64 printable characters, ordered from sparse to dense. Spaces are allowed.</p>
        <button type="button" className="wide" disabled={!validRamp(draft)||draft===settings.ramp} onClick={applyRamp}>Apply characters</button>
      </>}
      <details className="advanced"><summary>Advanced settings</summary><div className="advanced-body">
        <label className="select">Background mode<select aria-label="Background mode" value={settings.background} onChange={e=>onChange({...settings,background:e.target.value as BackgroundMode})}><option value="dark">Dark / transparent</option><option value="light">Light</option><option value="color">Chosen color</option></select></label>
        {settings.background==='color'&&<label className="check color-picker">Background color <input type="color" value={settings.keyColor} onChange={e=>onChange({...settings,keyColor:e.target.value})}/></label>}
        {settings.background!=='dark'&&<><label className="range"><span>Background tolerance<output>{settings.tolerance}%</output></span><input aria-label="Background tolerance" type="range" min={0} max={100} step={1} value={settings.tolerance} onChange={e=>onChange({...settings,tolerance:Number(e.target.value)})}/></label><p className="hint">Masks matching colors, including parts of the subject.</p></>}
        {range(controls[3])}<p className="hint">Hide dark pixels in any background mode.</p>
        <label className="check"><input type="checkbox" checked={reduced} onChange={e=>onReduced(e.target.checked)}/> Reduce motion</label>
      </div></details>
    </div>
    <div role="tabpanel" id="studio-panel-Color" aria-labelledby="studio-tab-Color" hidden={tab!=='Color'}>
      <EffectsPanel settings={settings} onChange={onChange} section="color"/>
      <label className="check"><input type="checkbox" checked={settings.monochrome} onChange={e=>onChange({...settings,monochrome:e.target.checked})}/> Green monochrome</label>
    </div>
    <div role="tabpanel" id="studio-panel-Motion" aria-labelledby="studio-tab-Motion" hidden={tab!=='Motion'}><MotionPanel settings={settings} onChange={onChange} reduced={reduced}/></div>
    <div role="tabpanel" id="studio-panel-Effects" aria-labelledby="studio-tab-Effects" hidden={tab!=='Effects'}><EffectsPanel settings={settings} onChange={onChange} section="effects"/></div>
  </fieldset>;
}
