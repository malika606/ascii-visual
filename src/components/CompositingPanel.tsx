import type {Settings,BackdropMode,MarkBlend} from '../engine/settings.ts';
import {backdropLabels,blendLabels,compositeDefaults,hybridSettings} from '../engine/composite.ts';
export function CompositingPanel({settings,onChange}:{settings:Settings;onChange:(s:Settings)=>void}){
 const mode=settings.backdrop??'black',source=mode==='source'||mode==='blurred';
 const patch=(p:Partial<Settings>)=>onChange({...settings,...p});
 const range=(key:'backdropOpacity'|'backdropBlur'|'markOpacity',label:string)=><label className="range"><span>{label}<output>{settings[key]??compositeDefaults[key]}%</output></span><input aria-label={label} type="range" min={0} max={100} step={1} value={settings[key]??compositeDefaults[key]} onChange={e=>patch({[key]:Number(e.target.value)})}/></label>;
 return <section className="composition-panel" aria-label="Compositing controls">
   <h3>Layers &amp; backdrop</h3>
   <div className="look-actions"><button type="button" onClick={()=>patch(hybridSettings)}>Hybrid look</button><button type="button" onClick={()=>patch(compositeDefaults)}>Reset layers</button></div>
   <label className="select">Backdrop<select aria-label="Backdrop" value={mode} onChange={e=>patch({backdrop:e.target.value as BackdropMode})}>{Object.entries(backdropLabels).map(([k,v])=><option key={k} value={k}>{v}</option>)}</select></label>
   {(mode==='solid'||source)&&<label className="check color-picker">Backdrop color <input aria-label="Backdrop color" type="color" value={settings.backdropColor??'#000000'} onChange={e=>patch({backdropColor:e.target.value})}/></label>}
   {source&&range('backdropOpacity','Backdrop opacity')}
   {mode==='blurred'&&range('backdropBlur','Backdrop blur')}
   {range('markOpacity','Mark opacity')}
   {mode!=='transparent'&&<label className="select">Blend mode<select aria-label="Blend mode" value={settings.markBlend??'source-over'} onChange={e=>patch({markBlend:e.target.value as MarkBlend})}>{Object.entries(blendLabels).map(([k,v])=><option key={k} value={k}>{v}</option>)}</select></label>}
   {source&&<p className="hint">The image layer uses the original frame, including areas hidden by the source mask. Lower its opacity to keep the ASCII texture dominant.</p>}
   {mode==='transparent'&&<p className="hint">True alpha in PNG and still HTML. Animated formats flatten onto black. Post effects and blending are paused in transparent mode.</p>}
 </section>;
}
