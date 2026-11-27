import {useState} from 'react';
import {LOOKS_KEY,MAX_LOOKS,parseLooks,copyLook,type Look,type SavedLook} from '../engine/studio.ts';
export function SavedLooks({look,onApply}:{look:Look;onApply:(look:Look)=>void}){
  const [saved,setSaved]=useState<SavedLook[]>(()=>{try{return parseLooks(localStorage.getItem(LOOKS_KEY));}catch{return [];}});
  const [name,setName]=useState(''),[selected,setSelected]=useState(''),[notice,setNotice]=useState('');
  function persist(next:SavedLook[]){
    try{localStorage.setItem(LOOKS_KEY,JSON.stringify(next));setSaved(next);return true;}
    catch{setNotice('Browser storage unavailable. Changes were not saved.');return false;}
  }
  function save(){
    const title=name.trim();if(!title)return;
    if(saved.some(x=>x.name.toLowerCase()===title.toLowerCase())){setNotice('That name already exists. Choose another name.');return;}
    if(saved.length>=MAX_LOOKS){setNotice('30 looks saved. Remove one to save another.');return;}
    if(persist([...saved,{name:title,...copyLook(look)}])){setSelected(title);setName('');setNotice('Look saved on this device.');}
  }
  function remove(){
    if(!saved.some(x=>x.name===selected))return;
    if(persist(saved.filter(x=>x.name!==selected))){setSelected('');setNotice('Saved look removed.');}
  }
  return <details className="advanced saved-looks"><summary>My looks <span className="effect-count">{saved.length}/{MAX_LOOKS}</span></summary>
    <p className="hint">Save settings only. Your media is never stored here.</p>
    <label className="select">Look name<input aria-label="Look name" maxLength={40} value={name} placeholder="e.g. Rose film" onChange={e=>setName(e.target.value)} onKeyDown={e=>{if(e.key==='Enter'){e.preventDefault();save();}}}/></label>
    <button type="button" className="wide" disabled={!name.trim()} onClick={save}>Save look</button>
    {saved.length>0&&<>
      <label className="select">Saved look<select aria-label="Saved look" value={selected} onChange={e=>setSelected(e.target.value)}><option value="">Choose a look</option>{saved.map(x=><option key={x.name} value={x.name}>{x.name}</option>)}</select></label>
      <div className="look-actions"><button type="button" disabled={!selected} onClick={()=>{const item=saved.find(x=>x.name===selected);if(item){onApply(copyLook(item));setNotice('Look applied.');}}}>Apply look</button><button type="button" disabled={!selected} onClick={remove}>Remove</button></div>
    </>}
    <p role="status" className="hint">{notice}</p>
  </details>;
}
