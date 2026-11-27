"""Actual Chromium screenshots for manual design review, not simulated mockups."""
import os,pathlib
from playwright.sync_api import sync_playwright,expect
from ui_runtime import open_ui,OFFLINE
folder=pathlib.Path(os.environ.get('ASCII_SCREENSHOTS','artifacts/screenshots'));folder.mkdir(parents=True,exist_ok=True)
with sync_playwright() as p:
    browser=p.chromium.launch(executable_path=os.environ.get('CHROMIUM_PATH') or None,args=['--no-sandbox','--autoplay-policy=no-user-gesture-required'])
    page=browser.new_page(viewport={'width':1440,'height':900},reduced_motion='reduce')
    errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
    open_ui(page);page.get_by_role('button',name='MAKE IT ASCII').click()
    expect(page.locator('.status')).to_have_text('Source ready.')
    expect(page.locator('.style-grid img')).to_have_count(4,timeout=15000)
    page.screenshot(path=str(folder/'studio-desktop.png'),full_page=True)
    page.get_by_role('button',name='Browse all 18 styles').click()
    expect(page.locator('.style-grid img')).to_have_count(18,timeout=15000)
    page.screenshot(path=str(folder/'studio-gallery.png'),full_page=True)
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
