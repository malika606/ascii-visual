"""Run against `npm run dev` (or an independently transpiled static harness).
Requires Python playwright, Chromium and ffmpeg/ffprobe. No network fixtures.
"""
import base64, io, json, os, pathlib, subprocess, tempfile, sys
from playwright.sync_api import sync_playwright
from PIL import Image

BASE=os.environ.get('ASCII_TEST_URL','http://localhost:5173')
with sync_playwright() as p, tempfile.TemporaryDirectory() as tmp:
    browser=p.chromium.launch(executable_path=os.environ.get('CHROMIUM_PATH') or None,args=['--no-sandbox','--autoplay-policy=no-user-gesture-required'])
    page=browser.new_page(); errors=[]; page.on('pageerror', lambda e:errors.append(str(e)))
    if os.environ.get('ASCII_OFFLINE_BUNDLE'):
        # Evaluate only local code and in-memory fixtures in the initial blank document.
        page.set_content('<canvas id="preview"></canvas>')
        fixtures={f.name:base64.b64encode(f.read_bytes()).decode() for f in (pathlib.Path(__file__).parent/'fixtures').iterdir() if f.suffix in ('.png','.jpg','.webp','.gif','.webm','.mp4')}
        page.evaluate('(f)=>window.asciiFixtures=f',fixtures)
        page.evaluate(pathlib.Path(os.environ['ASCII_OFFLINE_BUNDLE']).read_text())
    else:
        page.goto(BASE+'/tests/browser.html')
    page.wait_for_function('!!window.asciiTest')
    print('Chromium',browser.version,flush=True)
    def run(method,arg=None):return page.evaluate('(args)=>window.asciiTest[args[0]](args[1])',[method,arg])
    for name in ('still.png','still.jpg','still.webp'):
        result=run('image',name);im=Image.open(io.BytesIO(base64.b64decode(result['png'].split(',')[1]))).convert('RGB');assert im.size==(96,64) and im.getbbox() is not None;assert im.getpixel((0,0))==(0,0,0);print('PASS decode/render/PNG',name,im.size,flush=True)
    g=run('gif');assert len(set(g['hashes'][:3]))==3 and g['hashes'][0]==g['hashes'][3];print('PASS GIF real frame changes and wrap',g,flush=True)
    for name in ('motion.webm','motion.mp4'):
        v=run('video',name);assert v['hashes'][0]!=v['hashes'][1] and v['hashes'][0]==v['hashes'][2];print('PASS video decode, real frame changes, reset',name,v,flush=True)
    for name in ('still.png','motion.gif','motion.webm','motion.mp4'):
        result=run('export',name);out=pathlib.Path(tmp)/('output.'+result['extension']);out.write_bytes(base64.b64decode(result['data'].split(',')[1]));assert out.stat().st_size==result['size']>100
        probe=json.loads(subprocess.check_output(['ffprobe','-v','error','-count_frames','-show_streams','-show_format','-of','json',str(out)]));streams=probe['streams'];assert len(streams)==1 and streams[0]['codec_type']=='video';assert result['extension'] in probe['format']['format_name'];frames=int(streams[0]['nb_read_frames']);assert frames>=5
        hashes=subprocess.check_output(['ffmpeg','-v','error','-i',str(out),'-f','framemd5','-'],text=True);unique=len({line.split(',')[-1].strip() for line in hashes.splitlines() if line and not line.startswith('#')});assert unique>=2
        print('PASS animated silent export',name,'->',result['extension'],streams[0]['codec_name'],frames,'frames',unique,'unique',result['size'],'bytes',flush=True)
    assert run('cancel');print('PASS cancel recording',flush=True);assert not errors,errors;browser.close()
