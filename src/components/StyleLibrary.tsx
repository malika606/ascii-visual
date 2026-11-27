import {useEffect,useState} from 'react';
import {presets,styleDescriptions} from '../engine/settings.ts';
import {Renderer} from '../engine/renderer.ts';
import {demoFile} from '../media/demo.ts';
const names=Object.keys(presets);
const initial=names.slice(0,4);

export function StyleLibrary({style,onSelect}:{style:string;onSelect:(name:string)=>void}){
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
  const visible=expanded?names:[...initial,...(!initial.includes(style)?[style]:[])];
  return <div className="style-library">
    <div className="presets style-grid" role="group" aria-label="Style">
      {visible.map(name=><button type="button" className="style-card" key={name} aria-pressed={style===name} title={styleDescriptions[name]} onClick={()=>onSelect(name)}>
        {thumbs[name]?<img src={thumbs[name]} alt="" width={160} height={137}/>:<span className="style-placeholder" aria-hidden="true">.:*#@</span>}
        <span>{name}</span>
      </button>)}
    </div>
    <button type="button" className="style-expand" aria-expanded={expanded} onClick={()=>setExpanded(v=>!v)}>{expanded?'Show essentials':`Browse all ${names.length} styles`}</button>
    <p className="hint style-description">{styleDescriptions[style]}</p>
  </div>;
}
