"""React UI smoke. Run against a real Vite dev/preview server; not the engine harness."""
import os,pathlib,tempfile,subprocess,json
from playwright.sync_api import sync_playwright,expect
from PIL import Image
from ui_runtime import open_ui,OFFLINE
BASE=os.environ.get('ASCII_TEST_URL','http://localhost:5173');FIXTURES=pathlib.Path(__file__).parent/'fixtures'
with sync_playwright() as p,tempfile.TemporaryDirectory() as tmp:
    browser=p.chromium.launch(executable_path=os.environ.get('CHROMIUM_PATH') or None,args=['--no-sandbox','--autoplay-policy=no-user-gesture-required']);page=browser.new_page(accept_downloads=True,viewport={'width':1280,'height':900});errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
    open_ui(page);page.get_by_role('button',name='MAKE IT ASCII').click();expect(page.get_by_role('heading',name='ASCII Visual.')).to_be_visible();expect(page.locator('.status')).to_have_text('Source ready.');expect(page.get_by_text('ASCII Visual — original bouquet.png')).to_be_visible();expect(page.locator('canvas')).to_be_visible();expect(page.get_by_role('button',name='Download',exact=True)).to_be_enabled()
    def tab(name):
        target=page.get_by_role('tab',name=name,exact=True);target.click();expect(target).to_have_attribute('aria-selected','true')
    tab('Adjust');page.get_by_text('Advanced settings',exact=True).click();page.get_by_label('Reduce motion',exact=True).check();page.get_by_text('Advanced settings',exact=True).click();page.get_by_label('Export resolution').select_option('720');expect(page.locator('canvas')).to_have_attribute('width','720');expect(page.locator('canvas')).to_have_attribute('height','617')
    assert page.get_by_role('button',name='Upload file').is_visible();assert page.get_by_role('button',name='Download',exact=True).count()==1
    assert not page.get_by_label('Background mode').is_visible();tab('Style');assert page.get_by_role('button',name='Bloom').get_attribute('aria-pressed')=='true';tab('Adjust')
    assert page.get_by_role('slider',name='Detail').is_visible();assert page.get_by_role('slider',name='Color intensity').is_visible()
    frames=[]
    for ramp in ('Classic','Numbers','Binary','Blocks'):
        page.get_by_label('Characters',exact=True).select_option(ramp);page.wait_for_timeout(100);frames.append(page.locator('canvas').evaluate('(c)=>c.toDataURL()'))
    assert len(set(frames))==4, 'All ramps must change actual canvas pixels'
    tab('Style');page.get_by_role('button',name='Bloom').click();tab('Adjust');page.get_by_role('slider',name='Detail').fill('12');assert 'adjusted' in page.locator('.selected-style').inner_text();tab('Style');assert page.get_by_role('button',name='Bloom').get_attribute('aria-pressed')=='true';page.get_by_role('button',name='Bloom').click()
    print('PASS four distinct character ramps, style adjusted marker, primary controls',flush=True)
    # Tabs use the expected keyboard navigation and only one panel is visible.
    page.get_by_role('tab',name='Style',exact=True).focus();page.keyboard.press('ArrowRight')
    expect(page.get_by_role('tab',name='Adjust',exact=True)).to_be_focused()
    expect(page.get_by_role('tab',name='Adjust',exact=True)).to_have_attribute('aria-selected','true')
    assert page.get_by_role('tabpanel').count()==1
    tab('Style');page.get_by_role('button',name='Fine',exact=True).click();tab('Adjust')
    detail=page.get_by_role('slider',name='Detail');detail.fill('11')
    original_hash=page.locator('canvas').evaluate('(c)=>c.toDataURL()')
    page.get_by_label('Custom characters',exact=True).fill(' .ABC#@');page.get_by_role('button',name='Apply characters').click()
    custom_hash=page.locator('canvas').evaluate('(c)=>c.toDataURL()');assert custom_hash!=original_hash
    page.get_by_role('button',name='Undo',exact=True).click()
    assert page.locator('canvas').evaluate('(c)=>c.toDataURL()')==original_hash
    page.get_by_role('button',name='Redo',exact=True).click()
    assert page.locator('canvas').evaluate('(c)=>c.toDataURL()')==custom_hash
    page.get_by_role('button',name='Undo',exact=True).focus();page.keyboard.press('Control+z')
    assert page.locator('canvas').evaluate('(c)=>c.toDataURL()')==original_hash
    page.keyboard.press('Control+Shift+z');assert page.locator('canvas').evaluate('(c)=>c.toDataURL()')==custom_hash
    tab('Style');page.get_by_text('My looks',exact=False).first.click()
    page.get_by_label('Look name',exact=True).fill('QA custom');page.get_by_role('button',name='Save look',exact=True).click()
    expect(page.get_by_label('Saved look',exact=True)).to_have_value('QA custom')
    page.get_by_role('button',name='Surprise me',exact=True).click()
    assert page.locator('canvas').evaluate('(c)=>c.toDataURL()')!=custom_hash
    page.get_by_role('button',name='Apply look',exact=True).click();assert page.locator('canvas').evaluate('(c)=>c.toDataURL()')==custom_hash
    page.get_by_role('button',name='Compare',exact=True).click()
    raw=page.locator('.original-overlay');art=page.get_by_label('Rendered ASCII artwork',exact=True)
    expect(raw).to_be_visible();assert raw.evaluate('(c)=>c.toDataURL()')!=art.evaluate('(c)=>c.toDataURL()')
    a,b=raw.bounding_box(),art.bounding_box();assert all(abs(a[k]-b[k])<1 for k in ('x','y','width','height'))
    page.get_by_role('slider',name='Before / After',exact=True).fill('73')
    assert '27%' in raw.evaluate('(el)=>el.style.clipPath')
    assert art.evaluate('(c)=>c.toDataURL()')==custom_hash
    for w,h in [(390,844),(320,568)]:
        page.set_viewport_size({'width':w,'height':h});assert page.evaluate('document.documentElement.scrollWidth <= innerWidth')
        a,b=raw.bounding_box(),art.bounding_box();assert all(abs(a[k]-b[k])<1 for k in ('x','y','width','height'))
    page.set_viewport_size({'width':1280,'height':900})
    page.get_by_role('button',name='Compare',exact=True).click();expect(raw).to_have_count(0)
    page.get_by_role('button',name='Bloom',exact=True).click()
    print('PASS tabs/keyboard, custom ramp, Undo/Redo, curated surprise, local save/apply, comparison alignment and split',flush=True)
    def download(ext):
        page.get_by_label('Format',exact=True).select_option(ext)
        with page.expect_download(timeout=30000) as d:page.get_by_role('button',name='Download',exact=True).click()
        output=pathlib.Path(tmp)/d.value.suggested_filename;d.value.save_as(output);return output
    assert Image.open(download('png')).size==(720,617)
    page.get_by_role('button',name='Fine',exact=True).click()
    page.get_by_role('button',name='Compare',exact=True).click()
    art=page.get_by_label('Rendered ASCII artwork',exact=True)
    expected=art.evaluate("(c)=>Array.from(c.getContext('2d').getImageData(0,0,c.width,c.height).data)")
    with Image.open(download('png')) as exported:assert exported.convert('RGBA').tobytes()==bytes(expected)
    page.get_by_role('button',name='Compare',exact=True).click()
    page.get_by_role('button',name='Bloom',exact=True).click()
    # Actual rendered style gallery: each look is generated by the shared renderer.
    page.get_by_role('button',name='Browse all 18 styles').click()
    gallery=page.locator('.style-grid');expect(gallery.get_by_role('button')).to_have_count(18)
    expect(gallery.locator('img')).to_have_count(18,timeout=15000)
    style_names=gallery.get_by_role('button').all_text_contents()
    hashes=[]
    for name in style_names:
        button=gallery.get_by_role('button',name=name,exact=True);button.click();expect(button).to_have_attribute('aria-pressed','true')
        page.wait_for_timeout(80);hashes.append(page.locator('canvas').evaluate('(c)=>c.toDataURL()'))
    assert len(set(hashes))==18,'Each style must produce different actual artwork'
    gallery.get_by_role('button',name='Halftone',exact=True).click()
    before=page.locator('canvas').evaluate("(c)=>Array.from(c.getContext('2d').getImageData(0,0,c.width,c.height).data)")
    with Image.open(download('png')) as exported:assert exported.size==(720,617) and exported.convert('RGBA').tobytes()==bytes(before)
    gallery.get_by_role('button',name='Bloom',exact=True).click();page.get_by_role('button',name='Show essentials').click()
    print('PASS 18 real style thumbnails and distinct Canvas frames; PNG matches selected style',flush=True)
    # Every effect changes the real rendered frame, and resetting restores the original.
    page.get_by_role('button',name='Fine',exact=True).click()
    frame=lambda:page.locator('canvas').evaluate('(c)=>c.toDataURL()')
    baseline=frame();tab('Effects')
    labels=('Glow','RGB split','CRT scanlines','Film grain','Distortion','Vignette')
    effect_frames=[]
    for name in labels:
        page.get_by_role('slider',name=name,exact=True).fill('85');page.wait_for_timeout(60)
        effect_frames.append(frame());assert effect_frames[-1]!=baseline,name
        page.get_by_role('button',name='Reset effects').click();page.wait_for_timeout(60);assert frame()==baseline,name
    assert len(set(effect_frames))==len(labels)
    tab('Color');palette=page.get_by_label('Color palette',exact=True)
    palette_frames=[]
    for name in ('source','rose','ocean','sunset','ice','custom'):
        palette.select_option(name);page.wait_for_timeout(50);palette_frames.append(frame())
    assert len(set(palette_frames))==6
    page.get_by_label('Highlight color',exact=True).fill('#24ff66');page.wait_for_timeout(60);assert frame()!=palette_frames[-1]
    tab('Effects');page.get_by_role('slider',name='Glow',exact=True).fill('70')
    page.get_by_role('slider',name='RGB split',exact=True).fill('35')
    page.get_by_role('slider',name='CRT scanlines',exact=True).fill('45')
    page.wait_for_timeout(60)
    composite=page.locator('canvas').evaluate("(c)=>Array.from(c.getContext('2d').getImageData(0,0,c.width,c.height).data)")
    with Image.open(download('png')) as exported:assert exported.size==(720,617) and exported.convert('RGBA').tobytes()==bytes(composite)
    tab('Style');page.get_by_role('button',name='Bloom',exact=True).click()
    print('PASS 6 independent visual effects, palette changes, combined export pixels and reset',flush=True)
    # New motion uses a separate still-image timeline, with true Canvas changes.
    page.get_by_role('button',name='Fine',exact=True).click()
    tab('Adjust');page.get_by_text('Advanced settings',exact=True).click();page.get_by_label('Reduce motion',exact=True).uncheck();page.get_by_text('Advanced settings',exact=True).click()
    tab('Motion')
    motion=page.get_by_label('Motion',exact=True)
    motion_frames=[]
    for name in ('assemble','disintegrate','breathing','rain','scan','spiral','flow','glitch','dissolve','shimmer'):
        motion.select_option(name)
        seek_motion=page.get_by_role('slider',name='Motion position',exact=True)
        seek_motion.fill('0');page.wait_for_timeout(60);first=frame()
        seek_motion.fill('0.9');page.wait_for_timeout(60);second=frame()
        assert first!=second,name
        motion_frames.append(second)
    assert len(set(motion_frames))==10
    motion.select_option('assemble');page.get_by_label('Motion playback').select_option('once');page.get_by_role('slider',name='Motion duration').fill('2')
    seek_motion.fill('2');page.wait_for_timeout(60);assembled=frame()
    seek_motion.fill('0');page.wait_for_timeout(60);assert frame()!=assembled
    page.get_by_role('slider',name='Motion intensity').fill('0');page.wait_for_timeout(60);assert frame()==assembled
    page.get_by_role('slider',name='Motion intensity').fill('100');page.get_by_label('Motion playback').select_option('loop')
    motion.select_option('breathing');page.get_by_role('slider',name='Motion duration').fill('2')
    animated=download('gif')
    with Image.open(animated) as g:
        assert g.n_frames==20
        g.seek(0);first=g.convert('RGB').tobytes();g.seek(5);assert first!=g.convert('RGB').tobytes()
    page.get_by_label('Format',exact=True).select_option('png')
    tab('Adjust');page.get_by_text('Advanced settings',exact=True).click();page.get_by_label('Reduce motion',exact=True).check();page.get_by_text('Advanced settings',exact=True).click()
    expect(seek_motion).to_be_disabled()
    tab('Style');page.get_by_role('button',name='Bloom',exact=True).click()
    print('PASS ten creative animations change Canvas, still scrub, once, intensity, GIF cycle and reduced motion',flush=True)
    # Dense preview and a real high-resolution PNG on a generated source.
    large=pathlib.Path(tmp)/'large.png';Image.new('RGB',(1920,1080),'#ee99bb').save(large)
    page.locator('input[type=file]').set_input_files(str(large));expect(page.get_by_text('large.png',exact=True)).to_be_visible()
    tab('Adjust');page.get_by_role('slider',name='Detail').fill('2');page.get_by_label('Preview quality').select_option('fast');expect(page.locator('.stage-meta')).to_contain_text('quality cap')
    page.get_by_label('Preview quality').select_option('high');expect(page.locator('.stage-meta')).not_to_contain_text('quality cap')
    page.get_by_label('Export resolution').select_option('1920');expect(page.locator('canvas')).to_have_attribute('width','960')
    assert Image.open(download('png')).size==(1920,1080)
    page.get_by_label('Format',exact=True).select_option('gif');assert '1920' not in page.get_by_label('Export resolution').locator('option').evaluate_all('(els)=>els.map(e=>e.value)')
    print('PASS 2 px detail, budget indicator, fresh 1920px PNG and animation cap',flush=True)
    # HTML embeds freshly rendered artwork and opens without external dependencies.
    import base64,re
    tab('Style');page.get_by_role('button',name='Fine',exact=True).click()
    page.get_by_label('Format',exact=True).select_option('html');page.get_by_label('Export resolution').select_option('1920')
    still_html=download('html');html=still_html.read_text()
    assert '<script' not in html and '<source' not in html
    from io import BytesIO
    with Image.open(BytesIO(base64.b64decode(re.search(r'data:image/png;base64,([A-Za-z0-9+/=]+)',html).group(1)))) as still:
        assert still.size==(1920,1080)
    tab('Adjust')
    advanced=page.locator('#studio-panel-Adjust details.advanced')
    if not advanced.evaluate('(el)=>el.open'):advanced.locator('summary').click()
    page.get_by_label('Reduce motion',exact=True).uncheck()
    tab('Motion');page.get_by_label('Motion',exact=True).select_option('breathing');page.get_by_role('slider',name='Motion duration',exact=True).fill('2')
    page.get_by_label('Format',exact=True).select_option('html-loop')
    animated_html=download('html-loop');html=animated_html.read_text()
    assert 'prefers-reduced-motion: no-preference' in html
    with Image.open(BytesIO(base64.b64decode(re.search(r'data:image/gif;base64,([A-Za-z0-9+/=]+)',html).group(1)))) as g:
        assert g.size==(480,270) and g.n_frames==20
        g.seek(0);first=g.convert('RGB').tobytes();g.seek(5);assert first!=g.convert('RGB').tobytes()
    html_page=browser.new_page(reduced_motion='reduce');external=[]
    html_page.on('request',lambda req:external.append(req.url) if req.url.startswith(('http://','https://')) else None)
    html_page.goto(animated_html.as_uri());html_page.wait_for_function("document.querySelector('img').naturalWidth===480")
    assert html_page.locator('img').evaluate("(el)=>el.currentSrc.startsWith('data:image/png')")
    html_page.emulate_media(reduced_motion='no-preference')
    html_page.wait_for_function("document.querySelector('img').currentSrc.startsWith('data:image/gif')")
    assert not external;html_page.close()
    # Native full-HD video is conditional on the runtime codec support, not on filename.
    tab('Style');page.get_by_role('button',name='Fine',exact=True).click()
    tab('Adjust');page.get_by_label('Reduce motion',exact=True).check();advanced.locator('summary').click()
    if page.get_by_label('Format',exact=True).locator('option[value=webm]').count():
        page.get_by_label('Format',exact=True).select_option('webm');page.get_by_label('Export resolution').select_option('1920')
        page.get_by_label('Target frame rate',exact=True).select_option('12');page.get_by_label('Video quality',exact=True).select_option('high')
        expect(page.locator('.actual-size').first).to_contain_text('1920 × 1080')
        hd=download('webm');probe=json.loads(subprocess.check_output(['ffprobe','-v','error','-show_streams','-of','json',str(hd)]))
        assert (probe['streams'][0]['width'],probe['streams'][0]['height'])==(1920,1080)
        page.get_by_label('Target frame rate',exact=True).select_option('24');page.get_by_label('Video quality',exact=True).select_option('balanced')
    if page.get_by_label('Format',exact=True).locator('option[value=mp4]').count():
        page.get_by_label('Format',exact=True).select_option('mp4');page.get_by_label('Export resolution').select_option('1920')
        page.get_by_label('Target frame rate',exact=True).select_option('12')
        hd=download('mp4');probe=json.loads(subprocess.check_output(['ffprobe','-v','error','-show_streams','-of','json',str(hd)]))
        assert (probe['streams'][0]['width'],probe['streams'][0]['height'])==(1920,1080)
        assert probe['streams'][0]['codec_name']=='h264'
        page.get_by_label('Target frame rate',exact=True).select_option('24')
    print('PASS standalone HTML with reduced-motion fallback, embedded animated GIF and conditional full-HD video',flush=True)
    # A replacement source must use the same resolution in the selector, label and actual export.
    page.get_by_label('Format',exact=True).select_option('gif')
    odd=pathlib.Path(tmp)/'odd-native.png';Image.new('RGB',(600,400),'#eac18b').save(odd)
    page.locator('input[type=file]').set_input_files(str(odd));expect(page.get_by_text('odd-native.png',exact=True)).to_be_visible()
    expect(page.get_by_label('Export resolution',exact=True)).to_have_value('480')
    expect(page.locator('.actual-size').first).to_contain_text('480 × 320')
    expect(page.get_by_label('Rendered ASCII artwork',exact=True)).to_have_attribute('width','480')
    expect(page.get_by_role('button',name='Play',exact=True)).to_be_disabled()
    page.get_by_role('button',name='Go to export ↓',exact=True).click()
    expect(page.get_by_role('heading',name='Save your artwork')).to_be_focused()
    print('PASS export resolution stays consistent on source replacement, still playback idle and jump to export',flush=True)
    upload=page.locator('input[type=file]')
    def source(name):
        tab('Style');upload.set_input_files(str(FIXTURES/name));expect(page.locator('.status')).to_have_text('Source ready.');expect(page.get_by_text(name,exact=True)).to_be_visible();expect(page.get_by_role('button',name='Fine')).to_be_enabled();page.get_by_role('button',name='Fine').click()
    def hash_frame():return page.locator('canvas').evaluate('(c)=>c.toDataURL()')
    def seek(value):
        page.get_by_role('slider',name='Playback position').fill(str(value));expect(page.get_by_role('button',name='Download',exact=True)).to_be_enabled();return hash_frame()
    source('motion.gif');expect(page.get_by_text('64 × 48 · GIF')).to_be_visible();a=seek(0);b=seek(.15);c=seek(.45);assert len({a,b,c})==3;assert seek(.6)==c;assert seek(0)==a;page.wait_for_timeout(150);assert hash_frame()==a
    page.get_by_role('button',name='Restart').click();expect(page.get_by_role('button',name='Download',exact=True)).to_be_enabled();assert hash_frame()==a
    page.get_by_role('button',name='Browse all 18 styles').click();page.get_by_role('button',name='Pixel',exact=True).click();page.get_by_role('button',name='Show essentials').click()
    tab('Color');page.get_by_label('Color palette',exact=True).select_option('rose');tab('Effects');page.get_by_role('slider',name='Glow',exact=True).fill('70')
    gif=download('gif');assert gif.suffix=='.gif';assert Image.open(gif).n_frames==20
    for name in ('seek-colors.webm','seek-colors.mp4'):
        source(name);a,b,c=seek(.4),seek(1.4),seek(2.4);assert len({a,b,c})==3;assert seek(.4)==a
    source('motion.gif');page.get_by_role('button',name='Browse all 18 styles').click();page.get_by_role('button',name='LED',exact=True).click();page.get_by_role('button',name='Show essentials').click()
    for ext in ('WEBM','MP4'):
        option=page.get_by_label('Format',exact=True).locator(f'option[value={ext.lower()}]')
        if option.count():
            output=download(ext.lower());assert output.suffix=='.'+ext.lower();probe=json.loads(subprocess.check_output(['ffprobe','-v','error','-show_streams','-show_format','-of','json',str(output)]));assert len(probe['streams'])==1 and probe['streams'][0]['codec_type']=='video';assert ext.lower() in probe['format']['format_name'];print('PASS UI download',ext,probe['streams'][0]['codec_name'],flush=True)
        else:print('SKIP unsupported UI download',ext,flush=True)
    tab('Adjust');page.get_by_text('Advanced settings',exact=True).click();page.get_by_label('Background mode').select_option('color');page.get_by_label('Background color').fill('#22aacc');page.get_by_role('slider',name='Background tolerance',exact=False).fill('10');page.get_by_label('Background mode').select_option('light')
    # Upload errors are local to the preview; the existing paused frame and settings survive.
    source('motion.gif');seek(.15);tab('Adjust');page.get_by_role('slider',name='Detail').fill('12')
    old_frame=hash_frame();old_position=page.get_by_role('slider',name='Playback position').input_value();old_detail=page.get_by_role('slider',name='Detail').input_value()
    oversized=pathlib.Path(tmp)/'oversized.png'
    with oversized.open('wb') as f:f.truncate(30*1024*1024+1)
    bad_cases=[({'name':'bad.txt','mimeType':'text/plain','buffer':b'not an image'},'Unsupported file'),(str(oversized),'30 MB limit'),({'name':'broken.png','mimeType':'image/png','buffer':b'not a PNG'},'could not be decoded')]
    for w,h in [(1280,900),(390,844),(320,568)]:
        page.set_viewport_size({'width':w,'height':h});page.evaluate('window.scrollTo(0,0)')
        for bad,reason in bad_cases:
            upload.set_input_files(bad);alert=page.get_by_role('alert');expect(alert).to_have_count(1);expect(alert).to_contain_text(reason);expect(alert).to_contain_text('Previous source kept.')
            expect(page.locator('.stage').get_by_role('alert')).to_be_visible();assert page.locator('.export-panel').get_by_role('alert').count()==0
            assert alert.evaluate('(el)=>{const r=el.getBoundingClientRect();return r.top>=0&&r.bottom<=innerHeight&&r.left>=0&&r.right<=innerWidth}')
            assert alert.bounding_box()['y']<page.locator('.viewport').bounding_box()['y']
            expect(page.get_by_text('motion.gif',exact=True)).to_be_visible();expect(page.get_by_role('button',name='Download',exact=True)).to_be_enabled()
            assert hash_frame()==old_frame;assert page.get_by_role('slider',name='Playback position').input_value()==old_position;assert page.get_by_role('slider',name='Detail').input_value()==old_detail
    source('still.png');expect(page.get_by_role('alert')).to_have_count(0);assert hash_frame()!=old_frame
    page.set_viewport_size({'width':1280,'height':900});print('PASS unsupported, oversized and corrupt uploads: one visible alert near Upload at desktop/390/320, retained source/frame/settings/time, successful next upload',flush=True)
    page.get_by_role('button',name='Use demo').click();expect(page.get_by_text('ASCII Visual — original bouquet.png')).to_be_visible();expect(page.get_by_role('button',name='Download',exact=True)).to_be_enabled()
    tab('Adjust');page.set_viewport_size({'width':390,'height':844});assert page.evaluate('document.documentElement.scrollWidth <= innerWidth');expect(page.get_by_role('button',name='Download',exact=True)).to_be_visible();page.emulate_media(reduced_motion='reduce');expect(page.get_by_text('Reduced motion enabled')).to_be_visible();assert not errors,errors
    for w,h in [(390,844),(320,568)]:
        page.set_viewport_size({'width':w,'height':h});assert page.evaluate('document.documentElement.scrollWidth <= innerWidth');assert page.locator('.stage').bounding_box()['y']<page.locator('.appearance').bounding_box()['y']<page.locator('.export-panel').bounding_box()['y']
    page.set_viewport_size({'width':1280,'height':900});page.get_by_label('Format',exact=True).select_option('gif');page.get_by_role('button',name='Download',exact=True).click();expect(page.get_by_role('button',name='Cancel export')).to_be_visible();page.get_by_role('button',name='Cancel export').click();expect(page.locator('.status')).to_have_text('Export cancelled.');expect(page.get_by_role('button',name='Download',exact=True)).to_be_enabled();print('PASS export progress and cancellation',flush=True)
    # Local recipe survives a page reload, but never stores media bytes.
    stored=page.evaluate("JSON.parse(localStorage.getItem('ascii-visual.looks.v1'))")
    assert len(stored)==1 and stored[0]['name']=='QA custom' and set(stored[0])=={'name','style','settings'}
    open_ui(page);page.get_by_role('button',name='MAKE IT ASCII').click();expect(page.get_by_role('button',name='Download',exact=True)).to_be_enabled()
    page.get_by_text('My looks',exact=False).first.click();page.get_by_label('Saved look',exact=True).select_option('QA custom')
    page.get_by_role('button',name='Apply look',exact=True).click();tab('Adjust')
    expect(page.get_by_label('Custom characters',exact=True)).to_have_value(' .ABC#@')
    expect(page.get_by_role('slider',name='Detail',exact=True)).to_have_value('11')
    tab('Style');page.get_by_role('button',name='Remove',exact=True).click()
    assert page.evaluate("JSON.parse(localStorage.getItem('ascii-visual.looks.v1')).length")==0
    print('PASS local settings-only recipe survives reload and can be removed',flush=True)
    page.close();page=browser.new_page();open_ui(page);page.evaluate('window.MediaRecorder=undefined');page.get_by_role('button',name='MAKE IT ASCII').click();expect(page.get_by_role('button',name='Download',exact=True)).to_be_enabled();assert page.get_by_label('Format',exact=True).locator('option').all_text_contents()==['PNG','GIF','HTML · still','HTML · animated'];expect(page.locator('.export-note')).to_contain_text('unavailable');print('PASS fallback when native video recording unavailable (simulated)',flush=True)
    browser.close();print('PASS '+('offline React runtime' if OFFLINE else 'Vite UI')+': full UI demo, source upload, scrub/pause/restart, settings, dimensions, PNG/video/GIF downloads, validation, mobile layout, reduced motion')
