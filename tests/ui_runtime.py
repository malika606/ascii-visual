"""Normal UI checks use Vite. Optional offline check uses a separate local React bundle.
The latter exercises actual components, but does not verify Vite, HTTP or package versions.
"""
import base64, os, pathlib
ROOT=pathlib.Path(__file__).resolve().parents[1]
OFFLINE=os.environ.get('ASCII_UI_OFFLINE_BUNDLE')
BASE=os.environ.get('ASCII_TEST_URL','http://localhost:5173')
def open_ui(page, *, bad_video=False, data_saver=False):
    if data_saver:
        script="""(()=>{const c=new EventTarget();c.saveData=true;Object.defineProperty(navigator,'connection',{configurable:true,value:c});})()"""
        if OFFLINE:page.evaluate(script)
        else:page.add_init_script(script)
    if not OFFLINE:
        if bad_video:page.route('**/*hero*.mp4',lambda route:route.abort())
        page.goto(BASE);return
    css=(ROOT/'src/styles.css').read_text()+(ROOT/'src/components/hero.css').read_text()+(ROOT/'src/components/editor.css').read_text()
    page.set_content('<!doctype html><html lang="en"><head><meta name="viewport" content="width=device-width,initial-scale=1"><style>'+css+'</style></head><body><div id="root"></div></body></html>')
    assets={f.name:[base64.b64encode(b'bad video' if bad_video and f.suffix=='.mp4' else f.read_bytes()).decode(),'video/mp4' if f.suffix=='.mp4' else 'image/webp'] for f in (ROOT/'src/assets').iterdir()}
    page.evaluate('(a)=>{window.testAssets=Object.fromEntries(Object.entries(a).map(([name,[b64,mime]])=>[name,URL.createObjectURL(new Blob([Uint8Array.from(atob(b64),c=>c.charCodeAt(0))],{type:mime}))]));}',assets)
    page.add_script_tag(content=pathlib.Path(OFFLINE).read_text())

# Keep the original static rendering regression fixture independent of the new GIF demo.
def load_bouquet(page):
    if OFFLINE:raise RuntimeError('The bouquet regression fixture requires Vite.')
    page.evaluate("""async ()=>{const {bouquetFixture}=await import('/src/media/bouquetFixture.ts');const dt=new DataTransfer();dt.items.add(await bouquetFixture());const input=document.querySelector('input[type=file]');input.files=dt.files;input.dispatchEvent(new Event('change',{bubbles:true}));}""")
    from playwright.sync_api import expect
    expect(page.get_by_text('ASCII Visual — original bouquet.png',exact=True)).to_be_visible()
    expect(page.get_by_role('button',name='Download',exact=True)).to_be_enabled()
