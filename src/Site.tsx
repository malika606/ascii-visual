import {lazy,Suspense,useState} from 'react';
import Hero from './components/Hero.tsx';
// Do not request the editor chunk until the first explicit action.
const Editor=lazy(()=>import('./App.tsx'));
export default function Site(){
  const [opened,setOpened]=useState(false),[created,setCreated]=useState(false);
  const start=()=>{setCreated(true);setOpened(true);};
  const back=()=>setOpened(false);
  return <>
    {!opened&&<Hero onStart={start} restoreFocus={created}/>}
    {created&&<div hidden={!opened}>
      <Suspense fallback={<div className="editor-loading" role="status">Loading editor… <button onClick={back}>Back to intro</button></div>}>
        <Editor active={opened} onBack={back}/>
      </Suspense>
    </div>}
  </>;
}
