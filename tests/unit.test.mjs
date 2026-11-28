import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';
import {glyphForBrightness,pixelsToCells,fitSize,resolutionChoices,outputSize,mp4OutputSize} from '../src/engine/pixels.ts';import {animate} from '../src/engine/motion.ts';import {defaultSettings} from '../src/engine/settings.ts';import {validateFile,validateDuration,validateDimensions,MAX_FILE_BYTES} from '../src/media/validation.ts';import {decodeGif,gifFrameIndex} from '../src/media/gif.ts';import {exportDuration,extensionForMime} from '../src/export/record.ts';
const fixture=name=>readFileSync(new URL(`fixtures/${name}`,import.meta.url));const gif=name=>{const b=fixture(name);return decodeGif(b.buffer.slice(b.byteOffset,b.byteOffset+b.byteLength));};
test('glyph ramp endpoints, midpoint and clamping',()=>{assert.equal(glyphForBrightness(-1,'.+@'),'.');assert.equal(glyphForBrightness(128,'.+@'),'+');assert.equal(glyphForBrightness(999,'.+@'),'@');});
test('dark and transparent pixels excluded, color retained',()=>{const c=pixelsToCells(new Uint8ClampedArray([0,0,0,255,255,0,0,255,255,255,255,0]),3,1,{...defaultSettings,contrast:1,saturation:1});assert.equal(c.length,1);assert.equal(c[0].x,1);assert.equal(c[0].red,255);assert.equal(c[0].green,0);});
test('aspect ratio and maximum output',()=>{assert.deepEqual(fitSize(1920,1080),{width:960,height:540});assert.deepEqual(fitSize(200,400),{width:200,height:400});});
test('motion deterministic, bounded, reduced motion static',()=>{const c={x:3,y:5,glyph:'+',red:255,green:100,blue:10,light:120};const a=animate(c,3,10,10,defaultSettings);assert.deepEqual(a,animate(c,3,10,10,defaultSettings));assert.ok(a.opacity>=0&&a.opacity<=1);assert.deepEqual(animate(c,0,10,10,defaultSettings,true),{opacity:1,dx:0,dy:0,glyph:'+'});});
test('file validation and limits',()=>{assert.equal(validateFile({name:'x.GIF',type:'',size:123}),'gif');assert.equal(validateFile({name:'x.mp4',type:'video/mp4',size:123}),'video');assert.throws(()=>validateFile({name:'x.svg',type:'image/svg+xml',size:123}));assert.throws(()=>validateFile({name:'x.png',type:'image/png',size:MAX_FILE_BYTES+1}));assert.throws(()=>validateFile({name:'x.png',type:'image/png',size:0}));assert.throws(()=>validateDuration(15.01));assert.throws(()=>validateDuration(Infinity));assert.throws(()=>validateDimensions(0,10));});
test('GIF real frames, delay, wrap and transparency/compositing',()=>{const g=gif('motion.gif');assert.equal(g.frames.length,3);assert.equal(g.duration,.6);assert.deepEqual(g.frames.map(f=>f.delay),[100,200,300]);assert.equal(gifFrameIndex(g,.12),1);assert.equal(gifFrameIndex(g,.35),2);assert.equal(gifFrameIndex(g,.61),0);for(let n=0;n<3;n++){const expected=fixture(`motion-${n}.rgba`),actual=g.frames[n].rgba;for(let i=0;i<actual.length;i+=4){assert.equal(actual[i+3],expected[i+3]);if(expected[i+3])assert.deepEqual([...actual.slice(i,i+3)],[...expected.slice(i,i+3)]);}}});
test('interlaced palette GIF and dictionary growth vs Pillow',()=>{const g=gif('palette.gif');assert.deepEqual(Buffer.from(g.frames[0].rgba),fixture('palette.rgba'));});
test('corrupt GIF rejected',()=>{assert.throws(()=>decodeGif(new ArrayBuffer(5)));const b=fixture('motion.gif');assert.throws(()=>decodeGif(b.buffer.slice(b.byteOffset,b.byteOffset+b.byteLength-10)));});
test('recording extension and duration are explicit',()=>{assert.equal(extensionForMime('video/webm;codecs=vp9'),'webm');assert.equal(extensionForMime('video/mp4;codecs=avc1'),'mp4');assert.throws(()=>extensionForMime('video/unknown'));assert.equal(exportDuration(0,'image'),5);assert.equal(exportDuration(.6,'gif'),2);assert.equal(exportDuration(30,'video'),15);});

import {clampPosition} from '../src/media/source.ts';
import {GifEncoder,gifExportDuration} from '../src/export/gif.ts';
import {verifyContainer} from '../src/export/record.ts';
test('light and key masks operate before contrast, include transparent pixels and preserve subject',()=>{const p=new Uint8ClampedArray([250,250,250,255,15,150,240,255,240,30,30,255,255,0,0,0]);const s={...defaultSettings,threshold:0,contrast:2,saturation:2,tolerance:10};assert.deepEqual(pixelsToCells(p,4,1,{...s,background:'light'}).map(c=>c.x),[1,2]);assert.deepEqual(pixelsToCells(p,4,1,{...s,background:'color',keyColor:'#1096f0'}).map(c=>c.x),[0,2]);assert.deepEqual(pixelsToCells(p,4,1,{...s,background:'dark'}).map(c=>c.x),[0,1,2]);});
test('export dimensions never exceed source or render cap',()=>{assert.deepEqual(resolutionChoices(1920,1080).map(r=>[r.width,r.height]),[[960,540],[720,405],[480,270],[320,180]]);assert.deepEqual(resolutionChoices(100,200),[{side:200,width:100,height:200}]);assert.deepEqual(outputSize(100,200,1920),{width:100,height:200});assert.deepEqual(outputSize(800,1000,480),{width:384,height:480});assert.deepEqual(mp4OutputSize(96,64,64),{width:64,height:42});assert.equal(mp4OutputSize(1,10),null);});
test('seek end keeps final GIF frame instead of wrapping',()=>{const g=gif('motion.gif');assert.equal(gifFrameIndex(g,.1),1);assert.equal(gifFrameIndex(g,.3),2);assert.equal(gifFrameIndex(g,clampPosition(g.duration,g.duration)),2);assert.equal(clampPosition(-2,g.duration),0);});
test('GIF writer produces true animation, quantized colors and delays',async()=>{const w=80,h=80,enc=new GifEncoder(w,h);const frame=new Uint8ClampedArray(w*h*4);let n=17;for(let i=0;i<frame.length;i+=4){n=(Math.imul(n,1664525)+1013904223)>>>0;frame.set([n&255,n>>>8&255,n>>>16&255,255],i);}enc.frame(frame,10);const second=frame.slice();second[0]=255-second[0];enc.frame(second,20);const blob=enc.finish();assert.equal(blob.type,'image/gif');const g=decodeGif(await blob.arrayBuffer());assert.equal(g.frames.length,2);assert.deepEqual(g.frames.map(f=>f.delay),[100,200]);for(let i=0;i<frame.length;i+=4){assert.equal(g.frames[0].rgba[i],Math.round(Math.round(frame[i]*7/255)*255/7));assert.equal(g.frames[0].rgba[i+2],Math.round(Math.round(frame[i+2]*3/255)*255/3));}assert.equal(gifExportDuration(15,'video'),5);});
test('container signatures reject relabelled bytes',async()=>{await verifyContainer(new Blob([Uint8Array.of(0,0,0,24,102,116,121,112)]),'mp4');await verifyContainer(new Blob([Uint8Array.of(26,69,223,163)]),'webm');await assert.rejects(verifyContainer(new Blob([Uint8Array.of(26,69,223,163)]),'mp4'));});

import {gridSize,previewBudget,pngOutputSize,pngResolutionChoices,PNG_CELLS,FAST_CELLS,HIGH_PLAY_CELLS} from '../src/engine/quality.ts';
test('2 px grid adds detail without exceeding budgets, even at extreme aspect ratios',()=>{const fine=gridSize(1920,1080,2),normal=gridSize(1920,1080,6);assert.ok(fine.cols*fine.rows>normal.cols*normal.rows);for(const [w,h] of [[3840,2160],[960,960],[1,960],[960,1]])for(const cap of [1,24,FAST_CELLS,PNG_CELLS]){const g=gridSize(w,h,2,cap);assert.ok(g.cols*g.rows<=cap);assert.ok(g.cols>=1&&g.rows>=1);}assert.equal(previewBudget('auto',true),FAST_CELLS);assert.equal(previewBudget('high',true),HIGH_PLAY_CELLS);assert.equal(previewBudget('auto',false),PNG_CELLS);assert.equal(previewBudget('fast',false),FAST_CELLS);});
test('high resolution PNG is source-bounded and separate from video cap',()=>{assert.deepEqual(pngOutputSize(7680,4320,3840),{width:3840,height:2160});assert.deepEqual(pngOutputSize(640,480,3840),{width:640,height:480});assert.deepEqual(pngResolutionChoices(1920,1080)[0],{side:1920,width:1920,height:1080});assert.deepEqual(outputSize(7680,4320,3840),{width:960,height:540});});

import {brailleGlyph,ditherOn,edgeStrength,markColor} from '../src/engine/marks.ts';
import {presets,styleDescriptions,featuredPresets,featuredCaptions} from '../src/engine/settings.ts';
test('26 labelled styles use sixteen render modes and preserve the original four',()=>{assert.equal(Object.keys(presets).length,26);assert.equal(new Set(Object.values(presets).map(s=>s.mode??'glyph')).size,16);for(const name of Object.keys(presets))assert.ok(styleDescriptions[name]);assert.equal(presets.Bloom.cell,9);assert.equal(presets.Fine.cell,6);});
test('ordered dither coverage, Braille density and contour response',()=>{assert.equal(brailleGlyph(0),'\u2800');assert.equal(brailleGlyph(255),'\u28ff');let n=0;for(let y=0;y<4;y++)for(let x=0;x<4;x++)if(ditherOn(128,x,y))n++;assert.equal(n,8);assert.equal(edgeStrength(new Float32Array(9).fill(100),3,3,1,1).strength,0);assert.ok(edgeStrength(Float32Array.from([0,0,255,0,0,255,0,0,255]),3,3,1,1).strength>.9);});
test('style palettes and explicit green override',()=>{const c={x:0,y:0,glyph:'@',red:1,green:2,blue:3,light:255};assert.equal(markColor(c,{...defaultSettings,palette:'amber'}),'rgb(255,188,68)');assert.equal(markColor(c,{...defaultSettings,palette:'white',monochrome:true}),'rgb(1,2,3)');});

import {colorMapper,gradientColor,rgbFromHex} from '../src/engine/palette.ts';
import {normalizedEffects,distortionOffset,effectScale} from '../src/engine/effects.ts';
test('gradient palettes preserve endpoints, shade dark tones and safely parse custom colors',()=>{assert.deepEqual(rgbFromHex('#12abFF'),[18,171,255]);assert.deepEqual(rgbFromHex('oops'),[255,255,255]);assert.equal(gradientColor('#ff0000','#0000ff',0),'rgb(0,0,0)');assert.equal(gradientColor('#ff0000','#0000ff',255),'rgb(0,0,255)');const c={x:0,y:0,glyph:'@',red:1,green:2,blue:3,light:255};assert.equal(colorMapper({...defaultSettings,palette:'custom',gradientLow:'#000000',gradientHigh:'#ff0000'})(c),'rgb(255,0,0)');assert.equal(colorMapper({...defaultSettings,palette:'rose',monochrome:true})(c),'rgb(1,2,3)');});
test('effect amounts clamp independently and no stack remains the default',()=>{assert.deepEqual(normalizedEffects(),{glow:0,rgbSplit:0,scanlines:0,grain:0,distortion:0,vignette:0});assert.deepEqual(normalizedEffects({glow:180,rgbSplit:-1,grain:NaN,vignette:45}),{glow:100,rgbSplit:0,scanlines:0,grain:0,distortion:0,vignette:45});assert.equal(effectScale(3840,2160),4);for(let y=0;y<100;y++)assert.ok(Math.abs(distortionOffset(y,100,100))<=18);});

import {creativeMotionLabels,motionPeriod,motionPhase,motionDirection,creativeFrame} from '../src/engine/creativeMotion.ts';
test('ten creative motions are deterministic, periodic, bounded and obey reduced motion/intensity',()=>{
  const c={x:13,y:8,glyph:'@',red:255,green:90,blue:170,light:150};
  const staticMark={opacity:1,dx:0,dy:0,glyph:'@'};
  for(const effect of Object.keys(creativeMotionLabels)){
    const s={...defaultSettings,effect,motionDuration:3,speed:1};
    const a=animate(c,.7,40,30,s),b=animate(c,.7,40,30,s);
    assert.deepEqual(a,b);assert.ok(a.opacity>=0&&a.opacity<=1&&Number.isFinite(a.dx)&&Number.isFinite(a.dy));
    const end=animate(c,3.7,40,30,s);for(const key of ['opacity','dx','dy'])assert.ok(Math.abs(a[key]-end[key])<1e-8,effect);
    assert.deepEqual(animate(c,.7,40,30,s,true),staticMark);
    assert.deepEqual(animate(c,.7,40,30,{...s,motionIntensity:0}),staticMark);
  }
});
test('creative duration is bounded, once clamps, and directions are distinct',()=>{
  const s={...defaultSettings,effect:'assemble',motionDuration:4,speed:2};
  assert.equal(motionPeriod(s),2);assert.equal(motionPeriod({...s,speed:.25}),5);assert.equal(motionPeriod({...s,motionDuration:1,speed:2}),1);
  assert.equal(motionPhase(7,{...s,motionLoop:false}),1);assert.equal(motionPhase(2,s),0);
  assert.equal(motionDirection('up',.2,.3).y,-1);assert.equal(motionDirection('right',.2,.3).x,1);
  assert.deepEqual(creativeFrame(s,.5),{phase:.25,strength:1,loop:true,direction:'up'});
  assert.equal(exportDuration(0,'image',s),2);assert.equal(gifExportDuration(0,'image',s),2);assert.equal(exportDuration(8,'video',s),8);
  const c={x:13,y:8,glyph:'@',red:255,green:90,blue:170,light:150};
  assert.equal(animate(c,0,40,30,{...s,motionLoop:false}).opacity,0);
  assert.equal(animate(c,2,40,30,{...s,motionLoop:false}).opacity,1);
});

import {initialHistory,historyReducer,sameSettings,validRamp,validLook,parseLooks,surpriseLook,HISTORY_LIMIT} from '../src/engine/studio.ts';
test('look history groups a drag, restores complete styles and clears redo after new edits',()=>{
  const original={style:'Bloom',settings:defaultSettings};let h=initialHistory(original);
  const commit=(style,settings,group)=>{h=historyReducer(h,{type:'commit',look:{style,settings},group});};
  commit('Bloom',{...defaultSettings,cell:10},1);commit('Bloom',{...defaultSettings,cell:14},1);
  assert.equal(h.past.length,1);assert.equal(h.present.settings.cell,14);
  commit('Fine',presets.Fine);h=historyReducer(h,{type:'undo'});assert.equal(h.present.style,'Bloom');assert.equal(h.present.settings.cell,14);
  h=historyReducer(h,{type:'undo'});assert.ok(sameSettings(h.present.settings,original.settings));h=historyReducer(h,{type:'redo'});assert.equal(h.present.settings.cell,14);
  commit('Bloom',{...defaultSettings,cell:16});assert.equal(h.future.length,0);
  for(let i=0;i<100;i++)commit('Bloom',{...defaultSettings,cell:i%30+2});assert.ok(h.past.length<=HISTORY_LIMIT);
});
test('saved settings validation rejects corrupted data and custom ramps exclude controls',()=>{
  assert.ok(validRamp(' .a▓@'));assert.ok(!validRamp('   '));assert.ok(!validRamp('a\nb'));assert.ok(!validRamp('a'.repeat(65)));
  const look={style:'Bloom',settings:{...defaultSettings,ramp:' .a▓@'}};
  assert.ok(validLook(look));assert.ok(!validLook({...look,style:'__proto__'}));assert.ok(!validLook({...look,settings:{...look.settings,cell:0}}));
  const parsed=parseLooks(JSON.stringify([{name:'Rose',...look},{name:'Rose',...look},{name:'Bad',style:'oops',settings:{}},{name:'Broken',...look,settings:{...look.settings,effects:{glow:999}}}]));
  assert.equal(parsed.length,1);assert.equal(parsed[0].settings.ramp,' .a▓@');assert.deepEqual(parseLooks('not JSON'),[]);
});
test('curated surprise choices keep background mask, change style and are valid',()=>{
  const current={style:'Bloom',settings:{...defaultSettings,background:'color',keyColor:'#123456',tolerance:17}};
  for(const n of [0,.12,.25,.5,.75,.99]){const result=surpriseLook(current,()=>n);assert.notEqual(result.style,current.style);assert.equal(result.settings.background,'color');assert.equal(result.settings.keyColor,'#123456');assert.equal(result.settings.tolerance,17);assert.ok(validLook(result));}
});

import {videoOutputSize,videoResolutionChoices,gifResolutionChoices,videoBitrate} from '../src/engine/quality.ts';
import {webDocument} from '../src/export/web.ts';
test('advanced video sizes are real, source bounded and even for MP4',()=>{
  assert.deepEqual(videoOutputSize(3840,2160,1920,true),{width:1920,height:1080});
  assert.deepEqual(videoOutputSize(721,617,1920,true),{width:720,height:616});
  assert.deepEqual(videoOutputSize(64,48,1920),{width:64,height:48});
  assert.equal(videoOutputSize(1,1280,1920,true),null);
  assert.equal(videoResolutionChoices(3840,2160,true)[0].side,1920);
  assert.equal(gifResolutionChoices(1920,1080)[0].side,480);
  assert.ok(videoBitrate(1920,1080,30,'high')>videoBitrate(960,540,24,'balanced'));
  assert.ok(videoBitrate(1920,1080,30,'high')<=18_000_000);
});
test('standalone HTML includes only rendered data and a reduced motion fallback',()=>{
  const png='data:image/png;base64,AAAA',gif='data:image/gif;base64,BBBB';
  const still=webDocument(png,720,617),animated=webDocument(png,480,411,gif);
  assert.ok(still.includes(png)&&!still.includes('<source'));
  assert.ok(animated.includes('prefers-reduced-motion: no-preference')&&animated.includes(png)&&animated.includes(gif));
  assert.ok(!animated.includes('<script')&&!animated.includes('http://')&&!animated.includes('https://'));
  assert.throws(()=>webDocument('https://invalid.example/image.png',1,1));
  assert.throws(()=>webDocument(png,0,1));
});

import {resolveOutputSide} from '../src/engine/quality.ts';
test('resolved export side is always an advertised choice, including unusual native sizes',()=>{
  const options=[{side:480},{side:320}];
  assert.equal(resolveOutputSide(options,960),480);assert.equal(resolveOutputSide(options,390),320);
  assert.equal(resolveOutputSide(options,200),320);assert.equal(resolveOutputSide([{side:64}],960),64);
  const tall=videoResolutionChoices(2,1920,true);assert.equal(resolveOutputSide(tall,960),1440);
});

import {toneValue,boostColor,autoExposure} from '../src/engine/tonal.ts';
test('tone defaults preserve luminance, gamma and shadow lift brighten midtones, black stays black',()=>{
 for(const v of [0,32,128,255])assert.equal(toneValue(v,defaultSettings),v);
 assert.ok(toneValue(64,{...defaultSettings,gamma:1.5,shadows:20})>64);
 assert.equal(toneValue(0,{...defaultSettings,brightness:250,gamma:2,shadows:60}),0);
 assert.equal(boostColor(200,{...defaultSettings,colorBoost:200}),255);
 assert.ok(autoExposure([20,30,40]).brightness>100);
});
test('color boost is independent of mark density, masking precedes correction and saved looks validate',()=>{
 const data=Uint8ClampedArray.from([80,60,40,255,0,0,0,255,255,255,255,0]);
 const a=pixelsToCells(data,3,1,defaultSettings),b=pixelsToCells(data,3,1,{...defaultSettings,colorBoost:180});
 assert.equal(a.length,1);assert.equal(b.length,1);assert.equal(a[0].glyph,b[0].glyph);assert.equal(a[0].light,b[0].light);assert.ok(b[0].red>a[0].red);
 assert.ok(validLook({style:'Bloom',settings:{...defaultSettings,brightness:140,gamma:1.5,glyphWeight:700,invert:true}}));
});

import {softContrast,gainRgb,coverageGain} from '../src/engine/tonal.ts';
test('soft contrast keeps dark tones, fixed endpoints and monotonic order',()=>{
 for(const c of [.5,1,1.25,2]){assert.equal(softContrast(0,c),0);assert.equal(softContrast(255,c),255);for(let v=1;v<=255;v++)assert.ok(softContrast(v,c)>softContrast(v-1,c));}
 assert.ok(softContrast(15,1.5)>0);assert.deepEqual(gainRgb(160,80,40,3),[255,128,64]);
 assert.equal(coverageGain(.1,0),1);assert.ok(coverageGain(.1,65)>coverageGain(.5,65));assert.ok(coverageGain(.01,100)<=3);
});
test('shadow correction is applied before contrast and does not revive masked pixels',()=>{
 const data=Uint8ClampedArray.from([18,18,18,255,32,16,8,255,0,0,0,255,255,255,255,0]);
 const a=pixelsToCells(data,4,1,{...defaultSettings,threshold:0,contrast:1.5,saturation:1});
 const b=pixelsToCells(data,4,1,{...defaultSettings,threshold:0,contrast:1.5,saturation:1,gamma:1.8});
 assert.equal(a.length,2);assert.equal(b.length,2);assert.ok(a[0].light>0&&b[0].light>a[0].light);
 assert.ok(b[1].red>b[1].green&&b[1].green>b[1].blue);
 assert.ok(validLook({style:'Fine',settings:{...presets.Fine,coverageCompensation:65}}));
 assert.ok(!validLook({style:'Fine',settings:{...presets.Fine,coverageCompensation:101}}));
});
test('auto exposure is less aggressive on already bright sources',()=>{
 const dark=autoExposure([12,20,35,48,62]),bright=autoExposure([150,190,220,240,250]);
 assert.ok(dark.gamma>bright.gamma&&dark.brightness>bright.brightness);
 assert.equal(bright.colorBoost,100);
});

import {compositeSettings,hybridSettings} from '../src/engine/composite.ts';
test('compositing defaults are pure ASCII, hybrid is opt-in and transparent uses normal blend',()=>{
 const d=compositeSettings(defaultSettings);assert.equal(d.backdrop,'black');assert.equal(d.markOpacity,1);assert.equal(d.blend,'source-over');
 const h=compositeSettings({...defaultSettings,...hybridSettings});assert.equal(h.backdrop,'blurred');assert.equal(h.opacity,.45);assert.equal(h.blend,'screen');
 assert.equal(compositeSettings({...defaultSettings,backdrop:'transparent',markBlend:'multiply'}).blend,'source-over');
 assert.ok(validLook({style:'Fine',settings:{...presets.Fine,...hybridSettings}}));
 assert.ok(!validLook({style:'Fine',settings:{...presets.Fine,markOpacity:101}}));
});

import {measuredRamp,measuredGlyphs} from '../src/engine/coverage.ts';
import {densityTone,detailMap,detailLight} from '../src/engine/detail.ts';
test('measured glyph selection follows actual ink area, not character order',()=>{
 const samples=[{glyph:'@',area:.4},{glyph:'.',area:.02},{glyph:'+',area:.18},{glyph:'#',area:.28}];
 const sorted=measuredRamp(samples);assert.deepEqual(sorted.map(x=>x.glyph),['.','+','#','@']);
 const lut=measuredGlyphs(samples);assert.equal(lut[0],'.');assert.equal(lut[255],'@');
 const areas=new Map(samples.map(x=>[x.glyph,x.area]));for(let i=1;i<256;i++)assert.ok(areas.get(lut[i])>=areas.get(lut[i-1]));
 assert.ok(measuredGlyphs([{glyph:'@',area:.4}]).every(x=>x==='@'));
});
test('density and edge emphasis preserve endpoints, alter midtones and do not create masked cells',()=>{
 assert.equal(densityTone(0,160),0);assert.equal(densityTone(255,50),255);assert.equal(densityTone(100),100);
 assert.ok(densityTone(100,160)>100&&densityTone(100,50)<100);
 const c={x:1,y:0,light:100,glyph:'+',red:100,green:100,blue:100};
 const map=detailMap([c,{...c,x:2,light:255}],3,1);
 assert.equal(map[0],0);assert.ok(detailLight(c,100,100,map,3,1)>100);
 assert.ok(validLook({style:'Fine',settings:{...presets.Fine,glyphMapping:'ordered',density:150,markSize:120,edgeEmphasis:80}}));
 assert.ok(!validLook({style:'Fine',settings:{...presets.Fine,markSize:200}}));
});

import {ditherMap,ditherLabels} from '../src/engine/dither.ts';
import {braillePattern,spatialBrailleCells,brailleWeights} from '../src/engine/braille.ts';
test('dither algorithms deterministic, preserve masks and use different spatial patterns',()=>{
 const w=32,h=32,tones=Float32Array.from({length:w*h},(_,i)=>Math.round((i%w)*255/(w-1)));tones[0]=-1;
 const patterns=new Set();
 for(const algorithm of Object.keys(ditherLabels)){
   const a=ditherMap(tones,w,h,algorithm),b=ditherMap(tones,w,h,algorithm);
   assert.deepEqual(a,b);assert.equal(a[0],0);patterns.add(Buffer.from(a).toString('base64'));
   assert.ok(ditherMap(tones,w,h,algorithm,10).reduce((a,b)=>a+b,0)>=ditherMap(tones,w,h,algorithm,90).reduce((a,b)=>a+b,0));
 }
 assert.equal(patterns.size,6);
 // Both Bayer matrices legitimately produce the same checkerboard at 50%.
 const flat=new Float32Array(64).fill(128);
 assert.deepEqual(ditherMap(flat,8,8,'bayer4'),ditherMap(flat,8,8,'bayer8'));
 const quarter=new Float32Array(64).fill(75);
 assert.notDeepEqual(ditherMap(quarter,8,8,'bayer4'),ditherMap(quarter,8,8,'bayer8'));
 assert.equal(ditherMap(quarter,8,8,'bayer4').reduce((a,b)=>a+b,0),20);
 assert.equal(ditherMap(quarter,8,8,'bayer8').reduce((a,b)=>a+b,0),19);
 const half=ditherMap(new Float32Array(64).fill(128),8,8,'bayer8');assert.equal(half.reduce((a,b)=>a+b,0),32);
});
test('spatial Braille maps all eight independent positions to correct Unicode dots',()=>{
 for(let k=0;k<8;k++){
   const tones=new Float32Array(8).fill(0);tones[k]=255;assert.equal(braillePattern(tones),brailleWeights[k]);
   const data=new Uint8ClampedArray(32);data.set([255,255,255,255],k*4);
   const cells=spatialBrailleCells(data,1,1,{...presets.Braille,contrast:1,threshold:0});
   assert.equal(cells.length,1);assert.equal(cells[0].brailleBits,brailleWeights[k]);
 }
 assert.equal(braillePattern(new Float32Array(8).fill(-1),10),0);
 assert.equal(braillePattern(new Float32Array(8).fill(255),90),255);
 assert.ok(validLook({style:'Braille',settings:{...presets.Braille,brailleSampling:'spatial',brailleThreshold:40}}));
});

import {geometryScale,shadeColor,geometricModes} from '../src/engine/geometry.ts';
test('geometric marks scale monotonically and use bounded shading',()=>{
 assert.equal(geometryScale(0),0);assert.equal(geometryScale(255),1);assert.ok(geometryScale(100)<geometryScale(200));
 assert.equal(shadeColor('#804020',0),'rgb(128,64,32)');assert.equal(shadeColor('#804020',-1),'rgb(0,0,0)');assert.equal(shadeColor('rgb(128,64,32)',1),'rgb(255,255,255)');
 assert.equal(geometricModes.length,6);assert.ok(validLook({style:'Voxel',settings:{...presets.Voxel,shapeRelief:80}}));assert.ok(!validLook({style:'Lines',settings:{...presets.Lines,shapeAngle:181}}));
});

import {levelCurve,lightGain,postPixels,postActive} from '../src/engine/post.ts';
test('output levels are monotonic, neutral by default and clamp black/white points',()=>{
 const neutral=levelCurve();assert.deepEqual([...neutral],Array.from({length:256},(_,i)=>i));
 const lut=levelCurve(20,220,1.4);assert.equal(lut[20],0);assert.equal(lut[220],255);
 for(let i=1;i<256;i++)assert.ok(lut[i]>=lut[i-1]);
 assert.ok(levelCurve(0,255,1.5)[64]>64);assert.equal(postActive(defaultSettings),false);
});
test('spotlight preserves black, alpha and falls off spatially; sharpen increases local edge contrast',()=>{
 assert.equal(lightGain(0,0,.5,.5,.1,1),1);assert.ok(lightGain(.5,.5,.5,.5,.5,1)>1);
 const d=Uint8ClampedArray.from([0,0,0,0,80,80,80,100,80,80,80,255]);
 postPixels(d,3,1,{lightAmount:100,lightX:50,lightY:50,lightRadius:30});
 assert.deepEqual([...d.slice(0,4)],[0,0,0,0]);assert.ok(d[4]>80);assert.equal(d[7],100);assert.equal(d[8],80);
 const edge=Uint8ClampedArray.from([40,40,40,255,100,100,100,255,40,40,40,255]);
 postPixels(edge,3,1,{sharpen:100});assert.ok(edge[4]>100&&edge[0]<40);
 assert.ok(validLook({style:'Fine',settings:{...presets.Fine,postGamma:1.5,lightAmount:70,glowRadius:20}}));
});

import {cropGeometry,initialTransform} from '../src/media/transform.ts';
import {maskCoverageMapper} from '../src/engine/pixels.ts';
test('crop geometry keeps valid pixels, trims before rotation and swaps dimensions',()=>{
 assert.deepEqual(cropGeometry(720,480,initialTransform),{x:0,y:0,cw:720,ch:480,width:720,height:480});
 assert.deepEqual(cropGeometry(720,480,{...initialTransform,left:25,right:25,rotation:90}),{x:180,y:0,cw:360,ch:480,width:480,height:360});
 const g=cropGeometry(3,2,{...initialTransform,left:90,right:90,top:90,bottom:90});assert.ok(g.width>=1&&g.height>=1);
});
test('soft masks keep excluded pixels hidden and fade only near the threshold',()=>{
 const s={...defaultSettings,threshold:20,maskFeather:20,contrast:1},mask=maskCoverageMapper(s),data=Uint8ClampedArray.from([10,10,10,255,40,40,40,255,120,120,120,255,255,255,255,0]);
 assert.equal(mask(data,0),0);assert.ok(mask(data,4)>0&&mask(data,4)<1);assert.equal(mask(data,8),1);assert.equal(mask(data,12),0);
 const cells=pixelsToCells(data,4,1,s);assert.equal(cells.length,2);assert.ok(cells[0].maskOpacity>0&&cells[0].maskOpacity<1);assert.equal(cells[1].maskOpacity,undefined);
});

test('featured presets are eight diverse valid looks and Hybrid is ready to composite',()=>{
 assert.equal(featuredPresets.length,8);assert.equal(new Set(featuredPresets).size,8);
 for(const style of featuredPresets){assert.ok(featuredCaptions[style]);assert.ok(validLook({style,settings:presets[style]}));}
 assert.equal(presets.Hybrid.backdrop,'blurred');assert.equal(presets.Hybrid.markBlend,'screen');assert.equal(presets.Hybrid.effect,'none');
});
