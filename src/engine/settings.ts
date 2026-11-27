export type Effect = 'reveal' | 'wave' | 'glimmer' | 'none';
export type BackgroundMode = 'dark' | 'light' | 'color';
export interface Settings { background: BackgroundMode; keyColor: string; tolerance: number; cell: number; contrast: number; saturation: number; threshold: number; speed: number; effect: Effect; ramp: string; monochrome: boolean }
export const presets: Record<string, Settings> = {
  Bloom: {background:'dark',keyColor:'#ffffff',tolerance:30,cell:9,contrast:1.25,saturation:1.5,threshold:16,speed:1,effect:'reveal',ramp:'.:-=+*oO#@',monochrome:false},
  Terminal: {background:'dark',keyColor:'#ffffff',tolerance:30,cell:10,contrast:1.4,saturation:1,threshold:22,speed:0.8,effect:'glimmer',ramp:'.:;il1tfLCG08@',monochrome:true},
  Mosaic: {background:'dark',keyColor:'#ffffff',tolerance:30,cell:13,contrast:1.05,saturation:1.2,threshold:8,speed:0.8,effect:'wave',ramp:'.-+*#@',monochrome:false},
  Fine: {background:'dark',keyColor:'#ffffff',tolerance:30,cell:6,contrast:1.1,saturation:1,threshold:10,speed:1,effect:'none',ramp:'.,:;irsXA253hMHGS#9B&@',monochrome:false}
};
export const defaultSettings = {...presets.Bloom};
