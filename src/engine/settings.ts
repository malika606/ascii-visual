export type CreativeMotion = 'assemble' | 'disintegrate' | 'breathing' | 'rain' | 'scan' | 'spiral' | 'flow' | 'glitch' | 'dissolve' | 'shimmer';
export type Effect = 'reveal' | 'wave' | 'glimmer' | 'none' | CreativeMotion;
export type MotionDirection = 'up' | 'down' | 'left' | 'right' | 'outward' | 'inward';
export type BackdropMode = 'black' | 'solid' | 'source' | 'blurred' | 'transparent';
export type MarkBlend = 'source-over' | 'screen' | 'multiply' | 'overlay' | 'soft-light' | 'difference' | 'lighten';
export type BackgroundMode = 'dark' | 'light' | 'color';
export type DitherAlgorithm='bayer4'|'bayer8'|'floyd-steinberg'|'atkinson'|'noise'|'threshold';
export type BrailleSampling='spatial'|'density';
export type GeometricMode = 'cross'|'diamond'|'lines'|'stud'|'voxel'|'disco';
export type RenderMode = GeometricMode | 'glyph' | 'dots' | 'pixel' | 'dither' | 'braille' | 'contours' | 'stipple' | 'led' | 'hatch' | 'particles';
export type StylePalette = 'source' | 'white' | 'amber' | 'paper' | 'rose' | 'ocean' | 'sunset' | 'ice' | 'custom';
export type VisualEffects = {glow:number;rgbSplit:number;scanlines:number;grain:number;distortion:number;vignette:number};
export const noEffects:VisualEffects={glow:0,rgbSplit:0,scanlines:0,grain:0,distortion:0,vignette:0};
export interface Settings { glowRadius?:number; glowThreshold?:number; rgbAngle?:number; scanSpacing?:number; vignetteRadius?:number; postBlack?:number; postWhite?:number; postGamma?:number; sharpen?:number; lightAmount?:number; lightX?:number; lightY?:number; lightRadius?:number; shapeAngle?:number; shapeRelief?:number; ditherAlgorithm?:DitherAlgorithm; ditherThreshold?:number; brailleSampling?:BrailleSampling; brailleThreshold?:number; glyphMapping?:'measured'|'ordered'; density?:number; markSize?:number; edgeEmphasis?:number; backdrop?:BackdropMode; backdropColor?:string; backdropOpacity?:number; backdropBlur?:number; markOpacity?:number; markBlend?:MarkBlend; coverageCompensation?:number; brightness?:number; gamma?:number; shadows?:number; highlights?:number; colorBoost?:number; glyphWeight?:number; invert?:boolean; motionIntensity?:number; motionDuration?:number; motionLoop?:boolean; motionDirection?:MotionDirection; mode?: RenderMode; palette?: StylePalette; gradientLow?:string; gradientHigh?:string; effects?:VisualEffects; background: BackgroundMode; keyColor: string; tolerance: number; cell: number; contrast: number; saturation: number; threshold: number; speed: number; effect: Effect; ramp: string; monochrome: boolean }
export const presets: Record<string, Settings> = {
  Bloom: {background:'dark',keyColor:'#ffffff',tolerance:30,cell:9,contrast:1.25,saturation:1.5,threshold:16,speed:1,effect:'reveal',ramp:'.:-=+*oO#@',monochrome:false},
  Terminal: {background:'dark',keyColor:'#ffffff',tolerance:30,cell:10,contrast:1.4,saturation:1,threshold:22,speed:0.8,effect:'glimmer',ramp:'.:;il1tfLCG08@',monochrome:true},
  Mosaic: {background:'dark',keyColor:'#ffffff',tolerance:30,cell:13,contrast:1.05,saturation:1.2,threshold:8,speed:0.8,effect:'wave',ramp:'.-+*#@',monochrome:false},
  Fine: {background:'dark',keyColor:'#ffffff',tolerance:30,cell:6,contrast:1.1,saturation:1,threshold:10,speed:1,effect:'none',ramp:'.,:;irsXA253hMHGS#9B&@',monochrome:false}
};
export const defaultSettings = {...presets.Bloom};
const look=(changes:Partial<Settings>):Settings=>({...presets.Fine,effect:'none',...changes});
Object.assign(presets,{
  Microtype:look({cell:3,contrast:1.2,ramp:'.:ilI1tfLCG08@'}),
  Matrix:look({cell:8,monochrome:true,ramp:'01',effect:'glimmer',contrast:1.3}),
  Dither:look({mode:'dither',palette:'white',cell:5,contrast:1.1}),
  Halftone:look({mode:'dots',cell:12,saturation:1.25,contrast:1.1}),
  Pixel:look({mode:'pixel',cell:12,saturation:1.3,contrast:1.1}),
  Braille:look({mode:'braille',palette:'white',cell:7,contrast:1.1}),
  Contours:look({mode:'contours',cell:6,contrast:1.15,saturation:1.4}),
  Stipple:look({mode:'stipple',palette:'paper',cell:6,contrast:1.15}),
  Typography:look({cell:10,ramp:' .asciiVISUAL#@',contrast:1.15}),
  LED:look({mode:'led',cell:9,saturation:1.45,contrast:1.15,effect:'glimmer'}),
  Engraving:look({mode:'hatch',palette:'paper',cell:8,contrast:1.1}),
  Particles:look({mode:'particles',cell:9,saturation:1.4,effect:'wave'}),
  Newspaper:look({mode:'dots',palette:'paper',cell:8,contrast:1.55}),
  Amber:look({palette:'amber',cell:8,ramp:'.:;il1tfLCG08@',effect:'glimmer'}),
  Cross:look({mode:'cross',cell:10,contrast:1.1}),
  Diamond:look({mode:'diamond',cell:10,contrast:1.1}),
  Lines:look({mode:'lines',cell:9,shapeAngle:0}),
  Diagonal:look({mode:'lines',cell:9,shapeAngle:45}),
  'Stud mosaic':look({mode:'stud',cell:14,shapeRelief:75}),
  Voxel:look({mode:'voxel',cell:14,shapeRelief:75}),
  Disco:look({mode:'disco',cell:12,shapeRelief:80})
});
export const styleDescriptions:Record<string,string>={
 Bloom:'Colorful animated characters',Terminal:'Green phosphor text',Mosaic:'Bold moving symbols',Fine:'Detailed character art',
 Microtype:'Extra-small characters',Matrix:'Green binary code',Dither:'Ordered or error-diffused raster screen',Halftone:'Colored variable-size dots',
 Pixel:'Color mosaic tiles',Braille:'Eight independently sampled Unicode dots',Contours:'Local brightness edges',Stipple:'Scattered ink dots',
 Typography:'Letter-based texture',LED:'Round colored display cells',Engraving:'Layered diagonal strokes',Particles:'Drifting specks',
 Newspaper:'High-contrast cream halftone',Amber:'Warm monochrome terminal',Cross:'Density-scaled plus shapes',Diamond:'Faceted diamond halftone',Lines:'Adjustable line screen',Diagonal:'Slanted line screen','Stud mosaic':'Raised round studs on colored tiles',Voxel:'Isometric shaded blocks',Disco:'Seeded reflective tile mosaic'
};
