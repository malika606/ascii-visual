import type {Settings,StylePalette,VisualEffects} from '../engine/settings.ts';
import {noEffects} from '../engine/settings.ts';
import {gradientStops,paletteLabels} from '../engine/palette.ts';
import {effectNames,normalizedEffects} from '../engine/effects.ts';
const labels:Record<keyof VisualEffects,string>={glow:'Glow',rgbSplit:'RGB split',scanlines:'CRT scanlines',grain:'Film grain',distortion:'Distortion',vignette:'Vignette'};
const descriptions:Record<keyof VisualEffects,string>={glow:'Soft halo around marks',rgbSplit:'Separate red and blue channels',scanlines:'Retro horizontal screen lines',grain:'Fine static texture',distortion:'Horizontal displacement',vignette:'Darken the edges'};
export function EffectsPanel({settings,onChange,section}:{settings:Settings;onChange:(s:Settings)=>void;section:'color'|'effects'}){
  const values=normalizedEffects(settings.effects),active=effectNames.filter(k=>values[k]>0).length;
  const stops=gradientStops(settings);
  const palette=settings.palette??'source';
  const swatch=stops??(palette==='amber'?['#211300','#ffbc44']:palette==='paper'?['#30291b','#e9dfc8']:palette==='white'?['#1a1a1a','#f3f3f3']:['#663dbb','#f3a1c5','#8ad9af']);
  const change=(key:keyof VisualEffects,n:number)=>onChange({...settings,effects:{...values,[key]:n}});
  return <section className="color-effects" aria-label={section==='color'?'Palette controls':'Effect controls'}>
    {section==='color'&&<>
    <label className="select">Color palette
      <select aria-label="Color palette" value={palette} onChange={e=>onChange({...settings,palette:e.target.value as StylePalette,monochrome:false})}>
        {Object.entries(paletteLabels).map(([key,name])=><option value={key} key={key}>{name}</option>)}
      </select>
    </label>
    <div className="palette-swatch" aria-hidden="true" style={{background:`linear-gradient(90deg,${swatch.join(',')})`}}/>
    {settings.monochrome&&<p className="hint">Green monochrome is active. Selecting a palette turns it off.</p>}
    {palette!=='source'&&!settings.monochrome&&<p className="hint">Palette replaces source hue; contrast still shapes the tones.</p>}
    {palette==='custom'&&<div className="gradient-inputs">
      <label>Shadows <input type="color" aria-label="Shadow color" value={settings.gradientLow??'#48216b'} onChange={e=>onChange({...settings,gradientLow:e.target.value})}/></label>
      <label>Highlights <input type="color" aria-label="Highlight color" value={settings.gradientHigh??'#ffb6df'} onChange={e=>onChange({...settings,gradientHigh:e.target.value})}/></label>
    </div>}
    </>}
    {section==='effects'&&<details className="advanced effects-details" open={true}><summary>Visual effects <span className="effect-count">{active?active+' active':'Off'}</span></summary>
      <p className="hint">Combine effects; they are baked into the downloaded artwork.</p>
      {effectNames.map(key=><label className="range" key={key} title={descriptions[key]}><span>{labels[key]}<output>{values[key]}%</output></span><input type="range" aria-label={labels[key]} min={0} max={100} step={1} value={values[key]} onChange={e=>change(key,Number(e.target.value))}/></label>)}
      <button type="button" className="effect-reset" disabled={!active} onClick={()=>onChange({...settings,effects:{...noEffects}})}>Reset effects</button>
      <p className="hint">Effects are static and do not add flashing. High settings can soften fine detail.</p>
    </details>}
  </section>;
}
