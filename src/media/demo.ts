// The supplied GIF is a local bundled asset, loaded only when opening the editor.
export const demoName='ASCII Visual — cat.gif';
const assets=import.meta.glob('../assets/demo-cat.gif',{eager:true,query:'?url',import:'default'}) as Record<string,string>;
let cached:Promise<Blob>|undefined;
export async function demoFile():Promise<File>{
 const url=assets['../assets/demo-cat.gif'];
 if(!url)throw Error('Demo asset is missing. Add src/assets/demo-cat.gif to the repository.');
 cached??=fetch(url).then(async response=>{
   if(!response.ok)throw Error('Unable to load the local demo GIF.');
   const blob=await response.blob();
   const magic=new Uint8Array(await blob.slice(0,6).arrayBuffer());
   if(!['GIF87a','GIF89a'].includes(String.fromCharCode(...magic)))throw Error('Invalid demo GIF.');
   return blob;
 }).catch(e=>{cached=undefined;throw e;});
 return new File([await cached],demoName,{type:'image/gif'});
}
