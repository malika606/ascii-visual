"""Real Vite renderer output, fixed synthetic fixtures, repeatability, and timing.
Metrics describe sampled pixels, not subjective art quality or competitor parity.
Run with ASCII_TEST_URL pointing to Vite and Playwright Chromium installed.
"""
import base64, io, json, math, os, pathlib
from PIL import Image, ImageDraw, ImageStat, ImageOps
from playwright.sync_api import sync_playwright
from ui_runtime import BASE, OFFLINE

assert not OFFLINE, 'Quality audit requires actual Vite modules'
folder=pathlib.Path(os.environ.get('ASCII_SCREENSHOTS','artifacts/screenshots'))/'quality'
folder.mkdir(parents=True,exist_ok=True)
W,H=640,480

def fixture(name):
    im=Image.new('RGB',(W,H),'black');d=ImageDraw.Draw(im)
    if name=='portrait':
        d.ellipse((165,45,475,427),fill='#553443')
        d.ellipse((209,72,430,384),fill='#b77769')
        d.ellipse((223,85,417,366),fill='#e4ae96')
        d.ellipse((248,171,280,188),fill='#44343a');d.ellipse((356,171,388,188),fill='#44343a')
        d.polygon([(320,183),(304,244),(336,244)],fill='#c58a7b')
        d.arc((284,248,356,288),0,180,fill='#823c4e',width=5)
        d.polygon([(90,447),(186,345),(320,408),(454,345),(550,447)],fill='#456a88')
    elif name=='architecture':
        for j in range(6):
            x=48+j*91;top=55+(j%3)*42
            d.rectangle((x,top,x+79,435),fill=(70+j*22,84+j*18,102+j*12))
            for y in range(top+16,425,31):
                for xx in (x+10,x+43):d.rectangle((xx,y,xx+22,y+18),fill='#e3bd85' if (y+xx)%3 else '#252836')
    elif name=='landscape':
        for y in range(32,448):
            t=(y-32)/416;d.line((32,y,607,y),fill=(int(230-155*t),int(107-55*t),int(130-22*t)))
        d.ellipse((270,100,370,200),fill='#ffd398')
        d.polygon([(32,350),(165,180),(282,330),(410,150),(607,355),(607,447),(32,447)],fill='#343a65')
        d.polygon([(32,400),(180,300),(325,388),(460,260),(607,390),(607,447),(32,447)],fill='#497c85')
    elif name=='light-object':
        d.rounded_rectangle((112,72,528,408),radius=48,fill='#f0eee5')
        d.ellipse((210,116,430,346),fill='#b3bdca')
        d.ellipse((223,122,419,331),fill='#fffdf8')
        d.ellipse((251,148,392,300),fill='#e3e5e2')
    elif name=='abstract':
        for y in range(32,448):
            for x in range(32,608):
                v=(math.sin(x*.045+y*.027)+1)/2
                q=(math.cos(x*.021-y*.036)+1)/2
                im.putpixel((x,y),(int(18+190*v*q),int(18+145*q),int(36+215*v)))
    return im

def data_uri(im):
    b=io.BytesIO();im.save(b,format='PNG')
    return 'data:image/png;base64,'+base64.b64encode(b.getvalue()).decode()

def decode(url):
    return Image.open(io.BytesIO(base64.b64decode(url.split(',',1)[1]))).convert('RGB')

def stats(im):
    a=im.convert('L');hist=a.histogram();n=im.width*im.height
    return {'mean_rgb':round(sum(ImageStat.Stat(im).mean)/3,3),
            'nonblack_fraction':round((n-hist[0])/n,5),
            'nearwhite_fraction':round(sum(hist[250:])/n,5)}

variants=['ordered-no-comp','measured','hybrid','dither','braille']
names=['bouquet','portrait','architecture','landscape','light-object','abstract']
metrics=[];sheet=Image.new('RGB',(6*200,6*178),'#161616');labels=ImageDraw.Draw(sheet)
with sync_playwright() as p:
    browser=p.chromium.launch(executable_path=os.environ.get('CHROMIUM_PATH') or None,args=['--no-sandbox'])
    page=browser.new_page(reduced_motion='reduce')
    page.goto(BASE)
    for row,name in enumerate(names):
        uri=None if name=='bouquet' else data_uri(fixture(name))
        result=page.evaluate("""async ({uri})=>{
          const {Renderer}=await import('/src/engine/renderer.ts');
          const {presets}=await import('/src/engine/settings.ts');
          const {hybridSettings}=await import('/src/engine/composite.ts');
          const {bouquetFixture}=await import('/src/media/bouquetFixture.ts');
          const bitmap=await createImageBitmap(uri?await (await fetch(uri)).blob():await bouquetFixture());
          const source=document.createElement('canvas'),scale=Math.min(1,640/Math.max(bitmap.width,bitmap.height));
          source.width=Math.round(bitmap.width*scale);source.height=Math.round(bitmap.height*scale);
          source.getContext('2d').drawImage(bitmap,0,0,source.width,source.height);bitmap.close();
          const base={...presets.Fine,effect:'none',threshold:0,contrast:1,cell:6};
          const looks=[
            ['ordered-no-comp',{...base,glyphMapping:'ordered',coverageCompensation:0}],
            ['measured',{...base,glyphMapping:'measured',coverageCompensation:65}],
            ['hybrid',{...base,...hybridSettings}],
            ['dither',{...base,mode:'dither',palette:'white',ditherAlgorithm:'floyd-steinberg'}],
            ['braille',{...base,mode:'braille',palette:'white',brailleSampling:'spatial'}]
          ];
          const out={source:source.toDataURL(),images:{}};
          for(const [name,settings] of looks){
            const canvas=document.createElement('canvas'),renderer=new Renderer(canvas),opts={staticSource:true};
            const start=performance.now();renderer.draw(source,source.width,source.height,settings,0,true,640,false,opts);
            const png=canvas.toDataURL(),firstMs=performance.now()-start;
            const t=performance.now();renderer.draw(source,source.width,source.height,settings,0,true,640,false,opts);
            const repeat=canvas.toDataURL(),repeatMs=performance.now()-t;
            const other=document.createElement('canvas');new Renderer(other).draw(source,source.width,source.height,settings,0,true,640,false,opts);
            out.images[name]={png,firstMs,repeatMs,repeatable:repeat===png,freshParity:other.toDataURL()===png};
          }
          return out;
        }""",{'uri':uri})
        imgs={'source':decode(result['source'])}
        for key in variants:
            record=result['images'][key];im=decode(record['png']);imgs[key]=im
            assert record['repeatable'] and record['freshParity'],(name,key,'non-deterministic output')
            assert im.size==imgs['source'].size,(name,key,'size mismatch')
            metric=stats(im);assert metric['nonblack_fraction']>.001,(name,key,'empty artwork')
            if name!='bouquet' and key!='hybrid':assert im.crop((0,0,12,12)).getbbox() is None,(name,key,'masked border')
            metrics.append({'fixture':name,'look':key,**metric,'first_ms_including_png':round(record['firstMs'],2),'repeat_ms_including_png':round(record['repeatMs'],2),'fresh_renderer_parity':True})
        assert len({im.tobytes() for key,im in imgs.items() if key!='source'})==len(variants),(name,'duplicate looks')
        for col,key in enumerate(['source']+variants):
            im=imgs[key];im.save(folder/(name+'-'+key+'.png'))
            thumb=ImageOps.contain(im,(190,144));x=col*200+(200-thumb.width)//2;y=row*178+24
            sheet.paste(thumb,(x,y));labels.text((col*200+5,row*178+5),name+' / '+key,fill='white')
    browser.close()
sheet.save(folder/'comparison-sheet.png')
(folder/'metrics.json').write_text(json.dumps({'scope':'Synthetic test scenes and original procedural bouquet, same current engine; not a prior-version or ASCII Magic comparison. Timing includes PNG serialization; not an FPS claim.','results':metrics},indent=2))
print('PASS six fixtures, 30 rendered variants, repeatability, fresh renderer parity and masked borders; visual and timing artifacts saved',flush=True)
