"""Compare original Noir and new featured looks on the exact supplied GIF frames."""
import base64,io,json,os,pathlib
from PIL import Image,ImageStat,ImageDraw
from playwright.sync_api import sync_playwright
from ui_runtime import BASE,OFFLINE

assert not OFFLINE
folder=pathlib.Path(os.environ.get('ASCII_SCREENSHOTS','artifacts/screenshots'))/'cat-quality'
folder.mkdir(parents=True,exist_ok=True)
def decode(url):
    return Image.open(io.BytesIO(base64.b64decode(url.split(',',1)[1]))).convert('RGB')
def mean(im):
    return sum(ImageStat.Stat(im).mean)/3

with sync_playwright() as p:
    browser=p.chromium.launch(executable_path=os.environ.get('CHROMIUM_PATH') or None,args=['--no-sandbox'])
    page=browser.new_page()
    page.goto(BASE)
    rows=page.evaluate("""async ()=>{
      const {demoFile}=await import('/src/media/demo.ts');
      const {loadSource}=await import('/src/media/source.ts');
      const {Renderer}=await import('/src/engine/renderer.ts');
      const {presets,featuredPresets}=await import('/src/engine/settings.ts');
      const source=await loadSource(await demoFile());
      try{
        const canvas=document.createElement('canvas'),renderer=new Renderer(canvas),rows=[];
        const names=['Noir',...featuredPresets];
        for(const t of [0,1.12,1.8]){
          const frame=source.frame(t),original=frame.toDataURL();
          const looks=names.map(name=>{
            renderer.draw(frame,source.width,source.height,presets[name],t,true,360);
            return {name,png:canvas.toDataURL()};
          });
          rows.push({t,original,looks});
        }
        return rows;
      }finally{source.dispose();}
    }""")
    browser.close()
metrics=[];sheet=Image.new('RGB',(5*240,6*260),'#141414');draw=ImageDraw.Draw(sheet)
for i,row in enumerate(rows):
    original=decode(row['original'])
    pictures={'Source':original,**{r['name']:decode(r['png']) for r in row['looks']}}
    # Central face/chest patch from the actual 360px cat demo, not a generic subject detector.
    box=(105,85,250,235)
    old=mean(pictures['Noir'].crop(box));new=mean(pictures['Bright Mono'].crop(box))
    assert new>old*1.15,(row['t'],old,new)
    mono=pictures['Bright Mono'];r,g,b=mono.split();assert r.tobytes()==g.tobytes()==b.tobytes()
    assert mono.size==(360,360)
    assert mean(mono.crop((0,0,60,90)))>new,(row['t'],'foreground/background tonal separation')
    metrics.append({'time':row['t'],'old_face_mean_rgb':old,'bright_face_mean_rgb':new,'ratio':new/max(old,1e-6),'new_frame_mean_rgb':mean(mono)})
    for j,(name,im) in enumerate(pictures.items()):
        im.save(folder/f'frame-{i}-{name.lower().replace(" ","-")}.png')
        x=(j%5)*240;y=(i*2+j//5)*260
        draw.text((x+5,y+4),f'{row["t"]:.2f}s / {name}',fill='white')
        sheet.paste(im.resize((230,230)),(x+5,y+24))
sheet.save(folder/'comparison.png')
(folder/'metrics.json').write_text(json.dumps({'note':'RGB code-value means of fixed central patch, not perceptual or subjective quality scores. Real browser output.','frames':metrics},indent=2))
print('PASS cat demo: three frames brighter in central detail, monochrome and tonal separation preserved',flush=True)
