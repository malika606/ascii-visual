import {initialTransform,type SourceTransform} from '../media/transform.ts';
export function SourceTools({value,onChange,disabled}:{value:SourceTransform;onChange:(t:SourceTransform)=>void;disabled:boolean}){
 const crop=(key:'left'|'right'|'top'|'bottom',other:'left'|'right'|'top'|'bottom',label:string)=><label className="range"><span>{label}<output>{value[key]}%</output></span><input aria-label={label} type="range" min={0} max={90-value[other]} step={1} value={value[key]} onChange={e=>onChange({...value,[key]:Number(e.target.value)})}/></label>;
 return <details className="source-tools"><summary>Crop &amp; rotate</summary><fieldset disabled={disabled}>
 <div className="look-actions"><button type="button" onClick={()=>onChange({...value,rotation:((value.rotation+270)%360) as SourceTransform['rotation']})}>Rotate left</button><button type="button" onClick={()=>onChange({...value,rotation:((value.rotation+90)%360) as SourceTransform['rotation']})}>Rotate right</button><button type="button" aria-pressed={value.flip} onClick={()=>onChange({...value,flip:!value.flip})}>Flip horizontal</button></div>
 <p className="hint">Trim the original edges before rotation. The whole source stays available; edits apply to every frame and export.</p>
 <div className="crop-grid">{crop('left','right','Crop left')}{crop('right','left','Crop right')}{crop('top','bottom','Crop top')}{crop('bottom','top','Crop bottom')}</div>
 <button type="button" className="wide" onClick={()=>onChange({...initialTransform})}>Reset framing</button>
 </fieldset></details>;
}
