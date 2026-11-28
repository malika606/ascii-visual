import {useEffect,useState} from 'react';
import {presets,styleDescriptions,featuredPresets,featuredCaptions} from '../engine/settings.ts';
import {Renderer} from '../engine/renderer.ts';
import {demoFile} from '../media/demo.ts';
const initial:readonly string[]=featuredPresets;
const names=[...initial,...Object.keys(presets).filter(name=>!initial.includes(name))];

export function StyleLibrary({style,onSelect,advanced}:{style:string;onSelect:(name:string)=>void;advanced:boolean}){
  const [expanded,setExpanded]=useState(false);
  const [thumbs,setThumbs]=useState<Record<string,string>>({});
  useEffect(()=>{
    let cancelled=false;
    let bitmap:ImageBitmap|undefined;
    async function generate(){
      try{
        bitmap=await createImageBitmap(await demoFile());
        if(cancelled)return;
        const source=document.createElement('canvas');source.width=240;source.height=Math.round(240*bitmap.height/bitmap.width);
        source.getContext('2d')!.drawImage(bitmap,0,0,source.width,source.height);
        const canvas=document.createElement('canvas'),renderer=new Renderer(canvas);
        for(const name of names){
          if(cancelled)return;
          const preset=presets[name];
          renderer.draw(source,source.width,source.height,{...preset,cell:Math.max(2,Math.round(preset.cell*.45))},3,true,160,false,{budget:6500,staticSource:true});
          const url=canvas.toDataURL('image/png');
          setThumbs(prev=>({...prev,[name]:url}));
          await new Promise<void>(resolve=>setTimeout(resolve,0));
        }
      }catch{ /* Keep labelled buttons usable if a thumbnail cannot be generated. */ }
      finally{bitmap?.close();}
    }
    void generate();return()=>{cancelled=true;};
  },[]);
  const visible=advanced&&expanded?names:[...initial,...(!initial.includes(style)?[style]:[])];
  return <div className={'style-library'+(!advanced?' featured-library':'')}>
    {!advanced&&<p className="preset-intro">Choose a look. Every preset is ready to use.</p>}
    <div className="presets style-grid" role="group" aria-label="Style">
      {visible.map(name=><button type="button" className="style-card" key={name} aria-pressed={style===name} aria-label={name} title={styleDescriptions[name]} onClick={()=>onSelect(name)}>
        {thumbs[name]?<img src={thumbs[name]} alt="" width={160} height={160}/>:<span className="style-placeholder" aria-hidden="true">.:*#@</span>}
        <span>{name}</span>{!advanced&&featuredCaptions[name]&&<span className="preset-caption">{featuredCaptions[name]}</span>}
      </button>)}
    </div>
    {advanced&&<button type="button" className="style-expand" aria-expanded={expanded} onClick={()=>setExpanded(v=>!v)}>{expanded?'Show essentials':`Browse all ${names.length} styles`}</button>}
    <p className="hint style-description">{styleDescriptions[style]}</p>{!advanced&&<p className="hint preset-preview-note">Thumbnails show the demo image. Your artwork updates in the main preview.</p>}
  </div>;
}
