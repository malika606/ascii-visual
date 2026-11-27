import {useEffect,useRef} from 'react';
import './hero.css';

const poster = new URL('../assets/hero-poster.webp', import.meta.url).href;
const movie = new URL('../assets/hero.mp4', import.meta.url).href;
type DataConnection = EventTarget & {saveData?: boolean};

export default function Hero({onStart,restoreFocus=false}:{onStart:()=>void;restoreFocus?:boolean}) {
  const video=useRef<HTMLVideoElement>(null), visual=useRef<HTMLDivElement>(null), cta=useRef<HTMLButtonElement>(null);
  useEffect(()=>{if(restoreFocus)cta.current?.focus({preventScroll:true});},[restoreFocus]);
  useEffect(()=>{
    const el=video.current, stage=visual.current;
    if(!el||!stage)return;
    const motion=window.matchMedia('(prefers-reduced-motion: reduce)');
    const connection=(navigator as Navigator & {connection?:DataConnection}).connection;
    let disposed=false,failed=false,requested=false,attempt=0,raf=0;
    const stopFade=()=>{cancelAnimationFrame(raf);raf=0;};
    const showPoster=()=>{stopFade();stage.dataset.playing='false';stage.style.setProperty('--loop-shade','0');};
    const unload=()=>{attempt++;requested=false;showPoster();el.pause();if(el.hasAttribute('src')){el.removeAttribute('src');el.load();}};
    const allowed=()=>!disposed&&!failed&&!motion.matches&&!connection?.saveData;
    const animate=()=>{
      if(disposed||el.paused||document.hidden)return;
      const duration=el.duration,t=el.currentTime;
      // Native loop, no second decoder: ease through black for 0.38 s on each side.
      const edge=Number.isFinite(duration)?Math.min(t,duration-t):1;
      const x=Math.max(0,Math.min(1,edge/.38));
      stage.style.setProperty('--loop-shade',String(1-x*x*(3-2*x)));
      raf=requestAnimationFrame(animate);
    };
    const playing=()=>{if(!allowed()||document.hidden){el.pause();return;}stage.dataset.playing='true';stopFade();animate();};
    const pause=()=>{showPoster();};
    const fail=()=>{failed=true;unload();};
    const sync=()=>{
      if(!allowed()){unload();return;}
      if(document.hidden){attempt++;el.pause();showPoster();return;}
      if(!requested){requested=true;el.src=movie;}
      const current=++attempt;
      el.muted=true;
      void el.play().catch(()=>{if(current===attempt&&allowed()&&!document.hidden)fail();});
    };
    el.addEventListener('playing',playing);el.addEventListener('pause',pause);el.addEventListener('error',fail);
    motion.addEventListener('change',sync);connection?.addEventListener('change',sync);document.addEventListener('visibilitychange',sync);
    sync();
    return()=>{disposed=true;motion.removeEventListener('change',sync);connection?.removeEventListener('change',sync);document.removeEventListener('visibilitychange',sync);el.removeEventListener('playing',playing);el.removeEventListener('pause',pause);el.removeEventListener('error',fail);unload();};
  },[]);
  return <main className="hero" aria-labelledby="hero-title">
    <div ref={visual} className="hero-visual" data-playing="false" aria-hidden="true">
      <img className="hero-poster" src={poster} alt="" width={1280} height={768} fetchPriority="high"/>
      <video ref={video} className="hero-video" muted loop playsInline preload="none" aria-hidden="true" tabIndex={-1}/>
      <div className="hero-loop-shade"/>
    </div>
    <div className="hero-scrim" aria-hidden="true"/>
    <div className="hero-wordmark" aria-label="ASCII Visual">ASCII<span className="hero-wordmark-dot">.</span>VISUAL</div>
    <div className="hero-copy">
      <h1 id="hero-title">Images,<br/>rewritten as<br/>characters.</h1>
      <p>ASCII art builds pictures from letters, numbers and symbols.</p>
      <button ref={cta} className="hero-cta" onClick={onStart}>MAKE IT ASCII <span aria-hidden="true">↗</span></button>
    </div>
  </main>;
}
