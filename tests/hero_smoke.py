"""Intro/lifecycle regression checks. Run on Vite with Chromium, or the explicitly marked offline React harness."""
import os,pathlib
from playwright.sync_api import sync_playwright,expect
from ui_runtime import open_ui,OFFLINE,ROOT
SCREENSHOTS=os.environ.get('ASCII_SCREENSHOTS')
FIXTURES=ROOT/'tests/fixtures'

def screenshot(page,name):
    if SCREENSHOTS:
        folder=pathlib.Path(SCREENSHOTS);folder.mkdir(parents=True,exist_ok=True);page.screenshot(path=str(folder/name))
def assert_poster(page):
    expect(page.locator('.hero-visual')).to_have_attribute('data-playing','false')
    expect(page.locator('.hero-poster')).to_be_visible()
    page.wait_for_function("document.querySelector('.hero-poster').naturalWidth > 0")
    page.wait_for_function('!document.querySelector(".hero-video").hasAttribute("src")')
def visibility(page,hidden):
    # A deterministic visibility event simulation; not an OS tab-switch test.
    page.evaluate('(h)=>{Object.defineProperty(document,"hidden",{configurable:true,get:()=>h});document.dispatchEvent(new Event("visibilitychange"));}',hidden)
with sync_playwright() as p:
    browser=p.chromium.launch(executable_path=os.environ.get('CHROMIUM_PATH') or None,args=['--no-sandbox','--autoplay-policy=no-user-gesture-required']);print('Chromium',browser.version,'offline React' if OFFLINE else 'Vite',flush=True)
    page=browser.new_page(viewport={'width':1440,'height':900});errors=[];page.on('pageerror',lambda e:errors.append(str(e)));requests=[];page.on('request',lambda r:requests.append(r.url));open_ui(page)
    cta=page.get_by_role('button',name='MAKE IT ASCII');expect(cta).to_be_visible();assert page.get_by_role('button').count()==1;assert page.locator('canvas').count()==0
    if not OFFLINE: assert not any('/src/App.tsx' in url for url in requests),requests
    video=page.locator('.hero-video');page.wait_for_function("document.querySelector('.hero-video').currentTime > 0.5")
    assert video.evaluate('(v)=>v.muted&&v.loop&&v.playsInline&&!v.paused');assert page.evaluate('document.documentElement.scrollWidth <= innerWidth && document.documentElement.scrollHeight <= innerHeight')
    video.evaluate('(v)=>v.currentTime=2.4');page.wait_for_timeout(250);screenshot(page,'ascii-visual-desktop.png');print('PASS desktop, one CTA, playing local video',flush=True)
    video.evaluate('(v)=>v.currentTime=v.duration-.24');page.wait_for_function("Number(document.querySelector('.hero-visual').style.getPropertyValue('--loop-shade'))>0.15");page.wait_for_function("document.querySelector('.hero-video').currentTime<1");page.wait_for_timeout(600);assert video.evaluate('(v)=>!v.paused');print('PASS actual loop wraps with black fade',flush=True)
    visibility(page,True);expect(page.locator('.hero-visual')).to_have_attribute('data-playing','false');assert video.evaluate('(v)=>v.paused');t=video.evaluate('(v)=>v.currentTime');page.wait_for_timeout(250);assert abs(video.evaluate('(v)=>v.currentTime')-t)<.02;visibility(page,False);page.wait_for_function("!document.querySelector('.hero-video').paused");print('PASS visibility-event pause/resume (simulated)',flush=True)
    old=video.element_handle();cta.click();expect(page.get_by_role('heading',name='ASCII Visual.')).to_be_visible();expect(page.get_by_role('button',name='Download',exact=True)).to_be_enabled(timeout=15000);assert page.locator('.hero-video').count()==0;assert old.evaluate('(v)=>v.paused&&!v.hasAttribute("src")&&!v.isConnected');print('PASS editor opens and hero video released',flush=True)
    page.get_by_text('Advanced settings',exact=True).click();page.get_by_label('Reduce motion',exact=True).check();page.get_by_text('Advanced settings',exact=True).click();page.locator('input[type=file]').set_input_files(str(FIXTURES/'motion.gif'));expect(page.get_by_text('motion.gif',exact=True)).to_be_visible();expect(page.get_by_role('button',name='Fine')).to_be_enabled();page.get_by_role('button',name='Fine').click();page.get_by_role('slider',name='Playback position').fill('0.15');expect(page.get_by_role('button',name='Download',exact=True)).to_be_enabled();canvas=page.locator('canvas');frame=canvas.evaluate('(c)=>c.toDataURL()');controls=page.locator('.settings input, .settings select').evaluate_all('(els)=>els.map(e=>[e.value,e.checked])');pos=page.get_by_role('slider',name='Playback position').input_value()
    page.get_by_role('button',name='Back to intro').click();expect(cta).to_be_visible();expect(cta).to_be_focused();assert not canvas.is_visible();page.wait_for_function("!document.querySelector('.hero-video').paused");cta.click();expect(page.get_by_text('motion.gif',exact=True)).to_be_visible();assert page.get_by_role('slider',name='Playback position').input_value()==pos;assert canvas.evaluate('(c)=>c.toDataURL()')==frame;assert page.locator('.settings input, .settings select').evaluate_all('(els)=>els.map(e=>[e.value,e.checked])')==controls;expect(page.get_by_role('button',name='Play')).to_be_visible();print('PASS file, settings, exact GIF frame/time and paused state survive round trip',flush=True)
    # Moving-source state as well: leave while playing, return paused without resetting.
    page.locator('input[type=file]').set_input_files(str(FIXTURES/'seek-colors.mp4'));expect(page.get_by_text('seek-colors.mp4',exact=True)).to_be_visible();expect(page.get_by_role('button',name='Download',exact=True)).to_be_enabled();page.get_by_role('slider',name='Playback position').fill('1.4');expect(page.get_by_role('button',name='Download',exact=True)).to_be_enabled();page.get_by_role('button',name='Play').click();page.wait_for_function("Number(document.querySelector('input[aria-label=\"Playback position\"]').value)>1.5");page.get_by_role('button',name='Back to intro').click();expect(cta).to_be_visible();page.wait_for_timeout(400);cta.click();expect(page.get_by_text('seek-colors.mp4',exact=True)).to_be_visible();expect(page.get_by_role('button',name='Play')).to_be_visible();ret=float(page.get_by_role('slider',name='Playback position').input_value());assert 1.5<=ret<2.5,ret;frame=canvas.evaluate('(c)=>c.toDataURL()');page.wait_for_timeout(200);assert canvas.evaluate('(c)=>c.toDataURL()')==frame;print('PASS MP4 returns paused at retained playback time',flush=True)
    page.get_by_role('button',name='Back to intro').click();page.emulate_media(reduced_motion='reduce');assert_poster(page);page.emulate_media(reduced_motion='no-preference');page.wait_for_function("!document.querySelector('.hero-video').paused");print('PASS dynamic reduced motion',flush=True)
    for w,h in [(390,844),(320,568)]:
        page.set_viewport_size({'width':w,'height':h});page.wait_for_timeout(150);assert page.evaluate('document.documentElement.scrollWidth <= innerWidth');box=cta.bounding_box();assert box and box['x']>=0 and box['x']+box['width']<=w and box['y']+box['height']<=h,(w,h,box);video=page.locator('.hero-video');assert video.evaluate("v=>getComputedStyle(v).objectFit==='contain'");
        if w==390:video.evaluate('(v)=>v.currentTime=2.4');page.wait_for_timeout(250);screenshot(page,'ascii-visual-mobile.png')
    print('PASS mobile 390×844 and 320×568, CTA fits viewport, no horizontal overflow, full media fit',flush=True);assert not errors,errors;page.close()
    for mode in ('reduce','data','error'):
        page=browser.new_page(viewport={'width':390,'height':844},reduced_motion='reduce' if mode=='reduce' else 'no-preference');errors=[];page.on('pageerror',lambda e:errors.append(str(e)));open_ui(page,bad_video=mode=='error',data_saver=mode=='data');expect(page.get_by_role('button',name='MAKE IT ASCII')).to_be_visible();assert_poster(page);assert not errors,errors
        if mode=='reduce':screenshot(page,'ascii-visual-reduced-motion.png')
        page.close();print('PASS poster fallback:',mode,flush=True)
    browser.close()
