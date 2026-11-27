import type {Cell} from './pixels.ts';
import type {Settings,CreativeMotion,MotionDirection} from './settings.ts';

export const creativeMotionLabels:Record<CreativeMotion,string>={
  assemble:'Assemble',disintegrate:'Disintegrate',breathing:'Breathing',rain:'Digital rain',
  scan:'Scan reveal',spiral:'Spiral reveal',flow:'Flow',glitch:'Glitch loop',dissolve:'Dissolve',shimmer:'Shimmer'
};
export function isCreativeMotion(effect:Settings['effect']):effect is CreativeMotion{
  return Object.prototype.hasOwnProperty.call(creativeMotionLabels,effect);
}
const clamp=(n:number,min=0,max=1)=>Math.max(min,Math.min(max,n));
const smooth=(n:number)=>{n=clamp(n);return n*n*(3-2*n);};
const tau=Math.PI*2;
export function motionPeriod(s:Settings){
  const duration=Number.isFinite(s.motionDuration)?clamp(s.motionDuration!,1,5):3;
  const speed=Number.isFinite(s.speed)?clamp(s.speed,.25,2):1;
  return Math.round(clamp(duration/speed,1,5)*10)/10;
}
export function motionStrength(s:Settings){return Number.isFinite(s.motionIntensity)?clamp(s.motionIntensity!,0,100)/100:1;}
export function motionElapsed(t:number,s:Settings){
  const period=motionPeriod(s),time=Math.max(0,Number.isFinite(t)?t:0);
  if(s.motionLoop===false)return Math.min(time,period);
  const rest=time%period;
  return time>0&&rest<1e-8?period:rest;
}
export function motionPhase(t:number,s:Settings){
  const p=motionElapsed(t,s)/motionPeriod(s);
  return s.motionLoop===false?p:p%1;
}
export function motionDirection(direction:MotionDirection,u:number,v:number){
  if(direction==='up')return {x:0,y:-1,order:1-v};
  if(direction==='down')return {x:0,y:1,order:v};
  if(direction==='left')return {x:-1,y:0,order:1-u};
  if(direction==='right')return {x:1,y:0,order:u};
  const x=u-.5,y=v-.5,r=Math.hypot(x,y),sign=direction==='inward'?-1:1;
  return {x:r?x/r*sign:0,y:r?y/r*sign:0,order:direction==='inward'?1-clamp(r*Math.SQRT2):clamp(r*Math.SQRT2)};
}
export function supportsDirection(effect:Settings['effect']){
  return effect==='assemble'||effect==='disintegrate'||effect==='rain'||effect==='scan'||effect==='flow';
}
export interface CreativeFrame {phase:number;strength:number;loop:boolean;direction:MotionDirection}
export function creativeFrame(s:Settings,t:number):CreativeFrame{
  return {phase:motionPhase(t,s),strength:motionStrength(s),loop:s.motionLoop!==false,direction:s.motionDirection??'up'};
}
export function creativeMark(c:Cell,cols:number,rows:number,effect:CreativeMotion,f:CreativeFrame,rnd:number){
  const p=f.phase,theta=tau*p,k=f.strength;
  if(k===0)return {opacity:1,dx:0,dy:0,glyph:c.glyph};
  const u=(c.x+.5)/Math.max(1,cols),v=(c.y+.5)/Math.max(1,rows),d=motionDirection(f.direction,u,v);
  // The periodic envelope is zero at both ends, and never uses random time-dependent flashes.
  const pulse=(1-Math.cos(theta))/2;
  const sweep=f.loop?pulse:p;
  const jitter=(rnd-.5)*2,phase=theta+(u*2+v*1.5+rnd*.4)*Math.PI;
  let opacity=1,dx=0,dy=0;
  const reveal=(progress:number,order:number)=>smooth((progress-order*.82)/.18);
  switch(effect){
    case 'assemble':{
      const a=reveal(sweep,d.order*.65+rnd*.35),travel=(1-a)*Math.min(14,Math.max(cols,rows)*.08);
      opacity=a;dx=d.x*travel+jitter*travel*.5;dy=d.y*travel;break;
    }
    case 'disintegrate':{
      const a=reveal(sweep,d.order*.65+rnd*.35),travel=a*Math.min(18,Math.max(cols,rows)*.1);
      opacity=1-a;dx=d.x*travel+jitter*travel*.6;dy=d.y*travel;break;
    }
    case 'breathing':{
      const stretch=Math.sin(theta)*.075;
      dx=(u-.5)*cols*stretch;dy=(v-.5)*rows*stretch;opacity=.9+.1*Math.cos(theta);break;
    }
    case 'rain':{
      const band=Math.sin(theta-d.order*tau*1.5+rnd*.35);
      const travel=Math.sin(theta-d.order*tau+rnd*.3)*Math.min(4,Math.max(cols,rows)*.025);
      dx=d.x*travel;dy=d.y*travel;opacity=.72+.28*(band+1)/2;break;
    }
    case 'scan':opacity=reveal(sweep,d.order);break;
    case 'spiral':{
      const angle=(Math.atan2(v-.5,u-.5)+Math.PI)/tau;
      const order=clamp(angle*.55+Math.hypot(u-.5,v-.5)*.6);
      opacity=reveal(sweep,order);break;
    }
    case 'flow':{
      const wave=Math.sin(phase)*Math.min(3,Math.max(cols,rows)*.025);
      dx=d.x*wave-d.y*Math.cos(phase)*.35;dy=d.y*wave+d.x*Math.cos(phase)*.35;break;
    }
    case 'glitch':{
      // Smooth band displacement, not rapid whole-screen flashes.
      const band=Math.floor(v*13),strength=.15+.85*Math.pow(pulse,3);
      dx=Math.sin(theta+band*2.17)*strength*Math.min(7,cols*.05);
      dy=Math.sin(theta+band*.9)*.25;break;
    }
    case 'dissolve':opacity=1-reveal(sweep,rnd);break;
    case 'shimmer':{
      const light=Math.pow((1+Math.sin(theta-u*tau*1.3-v*Math.PI))/2,3);
      opacity=.57+.43*light;break;
    }
  }
  return {opacity:clamp(1+(opacity-1)*k),dx:dx*k,dy:dy*k,glyph:c.glyph};
}
