import type {Settings,Effect,MotionDirection} from '../engine/settings.ts';
import {creativeMotionLabels,isCreativeMotion,motionPeriod,supportsDirection} from '../engine/creativeMotion.ts';

export function MotionPanel({settings,onChange,reduced}:{settings:Settings;onChange:(s:Settings)=>void;reduced:boolean}){
  const creative=isCreativeMotion(settings.effect),enabled=settings.effect!=='none';
  const change=(patch:Partial<Settings>)=>onChange({...settings,...patch});
  return <details className="advanced motion-details" open><summary>Motion studio <span className="effect-count">{enabled?'On':'Off'}</span></summary>
    <label className="select">Motion<select aria-label="Motion" value={settings.effect} onChange={e=>change({effect:e.target.value as Effect})}>
      <option value="none">None</option>
      <optgroup label="Original"><option value="reveal">Reveal + glimmer</option><option value="wave">Soft wave</option><option value="glimmer">Glimmer</option></optgroup>
      <optgroup label="Creative motion">{Object.entries(creativeMotionLabels).map(([id,label])=><option key={id} value={id}>{label}</option>)}</optgroup>
    </select></label>
    {enabled&&<>
      <label className="range"><span>Intensity <output>{settings.motionIntensity??100}%</output></span><input aria-label="Motion intensity" type="range" min={0} max={100} step={1} value={settings.motionIntensity??100} onChange={e=>change({motionIntensity:Number(e.target.value)})}/></label>
      <label className="range"><span>Speed <output>{settings.speed.toFixed(2)}×</output></span><input aria-label="Speed" type="range" min={.25} max={2} step={.05} value={settings.speed} onChange={e=>change({speed:Number(e.target.value)})}/></label>
    </>}
    {creative&&<>
      <label className="range"><span>Base duration <output>{(settings.motionDuration??3).toFixed(1)} s</output></span><input aria-label="Motion duration" type="range" min={1} max={5} step={.1} value={settings.motionDuration??3} onChange={e=>change({motionDuration:Number(e.target.value)})}/></label>
      <label className="select">Playback<select aria-label="Motion playback" value={settings.motionLoop===false?'once':'loop'} onChange={e=>change({motionLoop:e.target.value==='loop'})}><option value="loop">Seamless cycle</option><option value="once">Play once</option></select></label>
      {supportsDirection(settings.effect)&&<label className="select">Direction<select aria-label="Motion direction" value={settings.motionDirection??'up'} onChange={e=>change({motionDirection:e.target.value as MotionDirection})}><option value="up">Up</option><option value="down">Down</option><option value="left">Left</option><option value="right">Right</option><option value="outward">Outward</option><option value="inward">Inward</option></select></label>}
      <p className="hint">Effective cycle: {motionPeriod(settings).toFixed(1)} s. Source videos keep their own timing. Restart to replay from zero.</p>
    </>}
    {reduced&&<p className="hint">Generated motion is disabled. GIF and video sources can still be played.</p>}
  </details>;
}
