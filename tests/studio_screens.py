"""Actual Chromium screenshots for manual design review, not simulated mockups."""
import os,pathlib,base64,io,tempfile,json
from PIL import Image,ImageDraw,ImageStat
from playwright.sync_api import sync_playwright,expect
from ui_runtime import open_ui,OFFLINE,load_bouquet
folder=pathlib.Path(os.environ.get('ASCII_SCREENSHOTS','artifacts/screenshots'));folder.mkdir(parents=True,exist_ok=True)
with sync_playwright() as p:
    browser=p.chromium.launch(executable_path=os.environ.get('CHROMIUM_PATH') or None,args=['--no-sandbox','--autoplay-policy=no-user-gesture-required'])
    page=browser.new_page(viewport={'width':1440,'height':900},reduced_motion='reduce')
    errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
    open_ui(page);page.get_by_role('button',name='MAKE IT ASCII').click()
    expect(page.locator('.status')).to_have_text('Source ready.')
    expect(page.locator('.style-grid img')).to_have_count(8,timeout=15000)
    page.screenshot(path=str(folder/'studio-desktop.png'),full_page=True)
    for w,h in [(390,844),(320,568)]:
        page.set_viewport_size({'width':w,'height':h});assert page.evaluate('document.documentElement.scrollWidth <= innerWidth')
        page.screenshot(path=str(folder/f'presets-mobile-{w}.png'),full_page=True)
    page.set_viewport_size({'width':1440,'height':900})
    page.get_by_role('button',name='Advanced editor →',exact=True).click()
    page.screenshot(path=str(folder/'studio-advanced-desktop.png'),full_page=True)
    load_bouquet(page)
    page.get_by_role('button',name='Bloom',exact=True).click()
    # Same source, same settings, only measured ink compensation changes.
    def capture(name):
        data=base64.b64decode(page.get_by_label('Rendered ASCII artwork',exact=True).evaluate("(c)=>c.toDataURL('image/png')").split(',',1)[1])
        (folder/name).write_bytes(data)
        return Image.open(io.BytesIO(data)).convert('RGB')
    def mean(im):
        return sum(ImageStat.Stat(im).mean)/3
    page.get_by_role('tab',name='Adjust',exact=True).click()
    ink=page.get_by_role('slider',name='Ink compensation',exact=True)
    ink.fill('0');page.wait_for_timeout(100);before=capture('tone-demo-ink-off.png')
    ink.fill('100');page.wait_for_timeout(100);after=capture('tone-demo-ink-on.png')
    assert mean(after)>mean(before)*1.05
    # Deterministic dark, midtone and saturated patches, with a pure-black control.
    with tempfile.TemporaryDirectory() as tmp:
        fixture=pathlib.Path(tmp)/'tone-patches.png'
        im=Image.new('RGB',(720,480),'black');draw=ImageDraw.Draw(im)
        colors=[(32,24,16),(70,38,55),(100,60,120),(120,110,100),(235,120,60)]
        for i,col in enumerate(colors):draw.rectangle((120*(i+1),0,120*(i+2)-1,479),fill=col)
        im.save(fixture);im.save(folder/'tone-patches-source.png')
        page.locator('input[type=file]').set_input_files(str(fixture))
        expect(page.get_by_text('tone-patches.png',exact=True)).to_be_visible()
        page.get_by_role('tab',name='Style',exact=True).click();page.get_by_role('button',name='Fine',exact=True).click()
        page.get_by_role('tab',name='Adjust',exact=True).click()
        page.get_by_role('slider',name='Contrast',exact=True).fill('1')
        page.get_by_label('Custom characters',exact=True).fill('@')
        page.get_by_role('button',name='Apply characters',exact=True).click()
        ink.fill('0');page.wait_for_timeout(100);off=capture('tone-patches-ink-off.png')
        ink.fill('100');page.wait_for_timeout(100);on=capture('tone-patches-ink-on.png')
        bounds=(10,20,110,460)
        assert mean(on.crop(bounds))==0 and mean(off.crop(bounds))==0
        dark=(140,20,220,460)
        assert mean(on.crop(dark))>mean(off.crop(dark))*1.1
        (folder/'tone-metrics.json').write_text(json.dumps({'demo_mean_rgb_off':mean(before),'demo_mean_rgb_on':mean(after),'dark_patch_off':mean(off.crop(dark)),'dark_patch_on':mean(on.crop(dark)),'note':'RGB code-value averages, not perceptual brightness or aesthetic scores.'},indent=2))
    load_bouquet(page)
    page.get_by_role('tab',name='Style',exact=True).click();page.get_by_role('button',name='Bloom',exact=True).click()
    page.get_by_role('tab',name='Style',exact=True).click()
    print('PASS paired artwork captures and dark-patch brightness with black preservation',flush=True)
    page.get_by_role('button',name='Browse all 30 styles').click()
    expect(page.locator('.style-grid img')).to_have_count(30,timeout=15000)
    page.screenshot(path=str(folder/'studio-gallery.png'),full_page=True)
    for name in ('Cross','Diamond','Lines','Diagonal','Stud mosaic','Voxel','Disco'):
        page.get_by_role('button',name=name,exact=True).click()
        capture('geometry-'+name.lower().replace(' ','-')+'.png')
    page.get_by_role('button',name='Halftone',exact=True).click()
    page.get_by_role('button',name='Show essentials').click()
    page.get_by_role('tab',name='Color',exact=True).click()
    page.get_by_role('combobox',name='Color palette',exact=True).select_option('rose')
    page.get_by_role('tab',name='Effects',exact=True).click()
    page.get_by_role('slider',name='Glow',exact=True).fill('60')
    page.get_by_role('button',name='Compare',exact=True).click()
    page.screenshot(path=str(folder/'studio-comparison.png'),full_page=True)
    page.get_by_role('button',name='Compare',exact=True).click()
    for w,h in [(390,844),(320,568)]:
        page.set_viewport_size({'width':w,'height':h})
        page.get_by_role('tab',name='Adjust',exact=True).click()
        assert page.evaluate('document.documentElement.scrollWidth <= innerWidth')
        page.evaluate('window.scrollTo(0,0)')
        page.screenshot(path=str(folder/f'studio-mobile-{w}.png'),full_page=True)
    assert not errors,errors
    browser.close()
    print('PASS real studio screenshot captures via '+('offline React' if OFFLINE else 'Vite'),flush=True)
