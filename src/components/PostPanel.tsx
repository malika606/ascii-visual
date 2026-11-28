import type {Settings} from '../engine/settings.ts';
import {postDefaults} from '../engine/post.ts';
type Key=keyof typeof postDefaults;
export function PostPanel({settings,onChange}:{settings:Settings;onChange:(s:Settings)=>void}){
 const disabled=settings.backdrop==='transparent';
 const range=(key:Key,label:string,min:number,max:number,step=1,unit='%')=><label className="range"><span>{label}<output>{settings[key]??postDefaults[key]}{unit}</output></span><input type="range" aria-label={label} disabled={disabled} min={min} max={max} step={step} value={settings[key]??postDefaults[key]} onChange={e=>onChange({...settings,[key]:Number(e.target.value)})}/></label>;
 return <details className="advanced post-details" open><summary>Lighting &amp; finish</summary><div className="advanced-body">
 {(settings.effects?.glow??0)>0&&<>{range('glowRadius','Glow radius',0,100)}{range('glowThreshold','Glow threshold',0,100)}</>}
 {(settings.effects?.rgbSplit??0)>0&&range('rgbAngle','RGB angle',0,180,1,'°')}
 {(settings.effects?.scanlines??0)>0&&range('scanSpacing','Scanline spacing',2,16,1,' px')}
 {(settings.effects?.vignette??0)>0&&range('vignetteRadius','Vignette radius',0,100)}
 {range('lightAmount','Spotlight',0,100)}
 {(settings.lightAmount??0)>0&&<>{range('lightX','Light X',0,100)}{range('lightY','Light Y',0,100)}{range('lightRadius','Light radius',10,100)}</>}
 {range('sharpen','Sharpen',0,100)}
 <h3>Output levels</h3>
 {range('postBlack','Black point',0,Math.max(0,(settings.postWhite??255)-1),1,'')}
 {range('postWhite','White point',Math.min(255,(settings.postBlack??0)+1),255,1,'')}
 {range('postGamma','Output gamma',.5,2.5,.05,'')}
 <p className="hint">These controls operate on the finished composite, including its backdrop. Spotlight raises existing signal without painting light onto black. Sharpness and levels may amplify noise. Transparent backdrop pauses post-processing.</p>
 <button type="button" className="wide" onClick={()=>onChange({...settings,...postDefaults})}>Reset finish</button>
 </div></details>;
}
