import type {Cell} from './pixels.ts';
import type {Settings} from './settings.ts';
export function seed(x:number,y:number){let n=Math.imul(x+1,374761393)^Math.imul(y+1,668265263);n=Math.imul(n^(n>>>13),1274126177);return ((n^(n>>>16))>>>0)/4294967296;}
const smooth=(x:number)=>{x=Math.min(1,Math.max(0,x));return x*x*(3-2*x);};
export function animate(c:Cell,t:number,cols:number,rows:number,s:Settings,reduced=false,chars=Array.from(s.ramp)){
  if(reduced||s.effect==='none')return {opacity:1,dx:0,dy:0,glyph:c.glyph};
  const time=t*s.speed, rnd=seed(c.x,c.y), phase=time*2.3+c.x*.21+c.y*.13+rnd*2;
  const flicker=.88+.12*Math.sin(phase);
  let opacity=flicker,dx=0,dy=0;
  if(s.effect==='reveal'){
    const progress=Math.min(1,time/2.8);
    const order=.65*(1-c.y/Math.max(1,rows-1))+.22*c.x/Math.max(1,cols-1)+.13*rnd;
    opacity*=smooth((progress-order+.18)/.18);
    dy=Math.sin(phase)*.13;
  } else if(s.effect==='wave'){dx=Math.sin(phase)*.24;dy=Math.cos(phase*.85)*.21;}
  else opacity=.75+.25*Math.sin(phase*.8);
  const idx=chars.indexOf(c.glyph);
  const glyph=(chars.length>1 && Math.sin(time*1.2+rnd*19)> .96)?chars[Math.min(chars.length-1,Math.max(0,idx+(rnd>.5?1:-1)))]:c.glyph;
  return {opacity,dx,dy,glyph};
}
