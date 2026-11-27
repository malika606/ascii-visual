// Original procedural still life. No external assets, fonts, or network requests.
export async function demoFile():Promise<File>{
  const canvas=document.createElement('canvas');canvas.width=840;canvas.height=720;
  const c=canvas.getContext('2d')!;c.fillStyle='#050708';c.fillRect(0,0,840,720);
  function stem(x:number,y:number,tx:number,ty:number){c.strokeStyle='#497e46';c.lineWidth=9;c.beginPath();c.moveTo(tx,ty);c.quadraticCurveTo(x+80,y+100,x,y);c.stroke();}
  function leaf(x:number,y:number,angle:number){c.save();c.translate(x,y);c.rotate(angle);const g=c.createLinearGradient(0,-35,0,35);g.addColorStop(0,'#a7d37d');g.addColorStop(1,'#275a38');c.fillStyle=g;c.beginPath();c.moveTo(0,0);c.quadraticCurveTo(75,-72,145,0);c.quadraticCurveTo(75,55,0,0);c.fill();c.restore();}
  function flower(x:number,y:number,r:number,light:string,dark:string,rotation:number){for(let j=0;j<12;j++){c.save();c.translate(x,y);c.rotate(rotation+j*Math.PI/6);const g=c.createLinearGradient(0,0,r,0);g.addColorStop(0,dark);g.addColorStop(.64,light);g.addColorStop(1,dark);c.fillStyle=g;c.beginPath();c.ellipse(r*.55,0,r*.55,r*.27,0,0,Math.PI*2);c.fill();c.restore();}c.fillStyle='#e9b34a';c.beginPath();c.arc(x,y,r*.23,0,Math.PI*2);c.fill();for(let j=0;j<25;j++){const a=j*2.39996,d=r*.19*Math.sqrt(j/25);c.fillStyle=j%2?'#ffdc86':'#925124';c.beginPath();c.arc(x+Math.cos(a)*d,y+Math.sin(a)*d,r*.035,0,Math.PI*2);c.fill();}}
  const flowers=[{x:250,y:230,r:105,l:'#ff9dc9',d:'#963065',a:.1},{x:440,y:154,r:120,l:'#ffc878',d:'#ba5b42',a:.3},{x:606,y:260,r:110,l:'#c3a0ff',d:'#66469d',a:.2},{x:400,y:335,r:105,l:'#ff758c',d:'#ac284e',a:.4}];
  for(const f of flowers)stem(f.x,f.y,430,655);
  leaf(402,520,-2.55);leaf(451,468,-.35);leaf(378,410,-2.7);leaf(433,590,-.55);leaf(520,366,-.32);
  for(const f of flowers)flower(f.x,f.y,f.r,f.l,f.d,f.a);
  const blob=await new Promise<Blob>((resolve,reject)=>canvas.toBlob(b=>b?resolve(b):reject(Error('Demo generation failed.')),'image/png'));
  return new File([blob],'ASCII Visual — original bouquet.png',{type:'image/png'});
}
