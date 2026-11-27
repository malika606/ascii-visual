/** Standalone web artwork; no source media, scripts, external assets or dependencies. */
function dataUrl(blob:Blob):Promise<string>{
  return new Promise((resolve,reject)=>{const reader=new FileReader();reader.onerror=()=>reject(Error('Could not package artwork.'));reader.onload=()=>resolve(String(reader.result));reader.readAsDataURL(blob);});
}
export function webDocument(poster:string,width:number,height:number,animation?:string){
  if(!/^data:image\/png;base64,[A-Za-z0-9+/=]+$/.test(poster)||animation&&!/^data:image\/gif;base64,[A-Za-z0-9+/=]+$/.test(animation))throw Error('Invalid embedded artwork.');
  if(!Number.isInteger(width)||!Number.isInteger(height)||width<1||height<1||width>3840||height>3840)throw Error('Invalid artwork size.');
  // The PNG is the default, including when reduced-motion is preferred or the media query is unsupported.
  const picture='<picture>'+(animation?'<source media="(prefers-reduced-motion: no-preference)" type="image/gif" srcset="'+animation+'">':'')+'<img alt="ASCII artwork" width="'+width+'" height="'+height+'" src="'+poster+'"></picture>';
  return '<!doctype html>\n<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>ASCII Visual artwork</title><style>html,body{margin:0;background:#000;color:#fff;min-height:100%}main{min-height:100vh;display:grid;place-items:center}picture{display:block;max-width:100%}img{display:block;max-width:100%;height:auto;margin:auto}</style></head><body><main>'+picture+'</main></body></html>';
}
export async function webBlob(poster:Blob,width:number,height:number,animation?:Blob){
  const [png,gif]=await Promise.all([dataUrl(poster),animation?dataUrl(animation):Promise.resolve(undefined)]);
  return new Blob([webDocument(png,width,height,gif)],{type:'text/html;charset=utf-8'});
}
