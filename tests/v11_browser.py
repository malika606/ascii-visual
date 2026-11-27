"""V1.1 engine browser tests. Run with Vite or ASCII_OFFLINE_BUNDLE; never a React UI test."""
import base64, io, json, os, pathlib, subprocess, tempfile
from playwright.sync_api import sync_playwright
from PIL import Image, ImageSequence
BASE=os.environ.get('ASCII_TEST_URL','http://localhost:5173')
FIXTURES=pathlib.Path(__file__).parent/'fixtures'
SAMPLES=os.environ.get('ASCII_SAMPLE_DIR')
def decode(data):return base64.b64decode(data.split(',',1)[1])
def image(result):return Image.open(io.BytesIO(decode(result['png']))).convert('RGB')
def export_stats(path):
    probe=json.loads(subprocess.check_output(['ffprobe','-v','error','-count_frames','-show_streams','-show_format','-of','json',str(path)])); streams=probe['streams'];assert len(streams)==1 and streams[0]['codec_type']=='video';s=streams[0]
    hashes=subprocess.check_output(['ffmpeg','-v','error','-i',str(path),'-f','framemd5','-'],text=True); unique=len({line.split(',')[-1].strip() for line in hashes.splitlines() if line and not line.startswith('#')}); assert unique>=2
    return probe['format']['format_name'],s['codec_name'],s['width'],s['height'],int(s['nb_read_frames']),unique
with sync_playwright() as p,tempfile.TemporaryDirectory() as temp:
    browser=p.chromium.launch(executable_path=os.environ.get('CHROMIUM_PATH') or None,args=['--no-sandbox','--autoplay-policy=no-user-gesture-required']);page=browser.new_page();errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
    if os.environ.get('ASCII_OFFLINE_BUNDLE'):
        page.set_content('<canvas id="preview"></canvas>'); fixtures={f.name:base64.b64encode(f.read_bytes()).decode() for f in FIXTURES.iterdir() if f.suffix in ('.png','.jpg','.webp','.gif','.webm','.mp4')};page.evaluate('(f)=>window.asciiFixtures=f',fixtures);page.evaluate(pathlib.Path(os.environ['ASCII_OFFLINE_BUNDLE']).read_text())
    else:page.goto(BASE+'/tests/browser.html')
    page.wait_for_function('!!window.asciiTest');print('Chromium',browser.version,flush=True)
    def run(method,arg=None):return page.evaluate('(a)=>window.asciiTest[a[0]](a[1])',[method,arg])
    for name in ('motion.gif','motion.webm','motion.mp4'):
        result=run('seek',name);h=result['hashes'];a=result['actual'];assert len(set(h[:3]))==3 and h[0]==h[4]==result['pausedHash'];assert abs(a[1]-result['duration']*.25)<.01 and abs(a[2]-result['duration']*.75)<.01 and 0<=result['duration']-a[3]<.01;assert h[3]!=h[0];print('PASS seek/pause/end/restart',name,result,flush=True)
    for name in ('seek-colors.webm','seek-colors.mp4'):
        result=run('seekColors',name);assert result['dominant']==[0,1,2,0,2,1] and result['oldAborted'] and abs(result['latest']-2.4)<.01;print('PASS known-color frame seek + cancelled stale seek',name,result,flush=True)
    bg=run('background');dark=image(bg['dark']);light=image(bg['light']);color=image(bg['color']);smaller=image(bg['smaller']);assert dark.crop((0,0,50,120)).getbbox() is not None;assert light.crop((0,0,50,120)).getbbox() is None and color.crop((0,0,50,120)).getbbox() is None;assert light.crop((85,40,155,80)).getbbox() and color.crop((85,40,155,80)).getbbox();assert smaller.size==(120,60);print('PASS background keys and lower resolution',dark.size,smaller.size,flush=True)
    demo=run('demo');im=image(demo);assert im.size==(720,617) and im.getbbox();print('PASS procedural bouquet PNG',im.size,flush=True)
    if SAMPLES:pathlib.Path(SAMPLES).mkdir(parents=True,exist_ok=True);pathlib.Path(SAMPLES,'bouquet.png').write_bytes(decode(demo['png']));pathlib.Path(SAMPLES,'light-before.png').write_bytes(decode(bg['dark']['png']));pathlib.Path(SAMPLES,'light-after.png').write_bytes(decode(bg['light']['png']));pathlib.Path(SAMPLES,'color-key.png').write_bytes(decode(bg['color']['png']))
    formats=run('formats');print('Native formats',formats,flush=True)
    for method,names in [('mp4',('still.png','motion.gif','motion.webm','motion.mp4')),('gifExport',('still.png','motion.gif','motion.webm','motion.mp4'))]:
        if method=='mp4' and not any(f['extension']=='mp4' for f in formats):print('SKIP MP4: browser lacks native H.264 capability',flush=True);continue
        for name in names:
            result=run(method,name);path=pathlib.Path(temp)/f'{method}-{name}.{result["extension"]}';path.write_bytes(decode(result['data']));assert path.stat().st_size==result['size']>100; stats=export_stats(path);assert result['extension'] in stats[0] and stats[2]==64;assert stats[3]==(42 if method=='mp4' and name=='still.png' else 43 if name=='still.png' else 48);assert stats[1]==('h264' if method=='mp4' else 'gif');assert stats[4]>=5
            if method=='gifExport':
                with Image.open(path) as gif:
                    assert gif.is_animated and gif.n_frames==(50 if name=='still.png' else 20); assert gif.info['loop']==0; assert all(f.info['duration']==100 for f in ImageSequence.Iterator(gif));assert len({f.convert('RGB').tobytes() for f in ImageSequence.Iterator(gif)})>=2
            print('PASS',method,name,stats,result['size'],'bytes',flush=True)
            if SAMPLES and name=='motion.gif':pathlib.Path(SAMPLES,f'animated-from-gif.{result["extension"]}').write_bytes(path.read_bytes())
    assert run('cancelGif');print('PASS cancel GIF export',flush=True)
    for ext in ('webm','mp4','gif'):
        if ext!='gif' and not any(f['extension']==ext for f in formats):continue
        result=run('demoExport',ext);path=pathlib.Path(temp)/('bouquet.'+ext);path.write_bytes(decode(result['data']));stats=export_stats(path);assert stats[2:4]==({'webm':(720,617),'mp4':(720,616),'gif':(480,411)}[ext]);assert stats[4]>=20
        print('PASS original bouquet export',ext,stats,result['size'],'bytes',flush=True)
        if SAMPLES:pathlib.Path(SAMPLES,'bouquet.'+ext).write_bytes(path.read_bytes())
    assert not errors,errors;browser.close()
