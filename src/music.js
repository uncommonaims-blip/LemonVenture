// Original looping chiptune: 32 bars in C major, 104 BPM. No downloads or samples.
export const STEP_SECONDS=60/104/2;
export const LOOP_STEPS=512;
const CHORDS=[[48,52,55],[43,47,50],[45,48,52],[41,45,48],[48,52,55],[43,47,50],[41,45,48],[43,47,50]];
const THEMES=[
 [72,null,76,79,76,null,74,72,67,null,72,74,76,null,74,null],
 [76,null,79,81,79,76,74,null,72,null,74,76,79,null,76,null],
 [79,null,76,74,72,null,67,69,72,74,76,null,74,null,72,null],
 [72,null,74,76,79,null,76,74,72,null,67,71,72,null,null,null]
];
export function scoreStep(index,scene='stand'){
 const step=((index%LOOP_STEPS)+LOOP_STEPS)%LOOP_STEPS,bar=Math.floor(step/16),beat=step%16,chord=CHORDS[bar%8],phrase=Math.floor(bar/8);
 const rootOffset=chord[0]-48;const melody=THEMES[phrase][beat];const notes=[];
 if(melody!==null)notes.push({midi:melody+rootOffset,wave:'square',gain:.065,duration:STEP_SECONDS*(beat%4===0?1.55:.8)});
 if(beat%2===0)notes.push({midi:chord[(beat/2)%3]+12,wave:'triangle',gain:scene==='village'?.055:.04,duration:STEP_SECONDS*1.6});
 if(beat%4===0)notes.push({midi:chord[0]-12+(beat===8?12:0),wave:'triangle',gain:.12,duration:STEP_SECONDS*2.7});
 // Quiet, short pitched ticks keep the rhythm gentle without noisy percussion.
 if(scene==='stand'&&beat%4===2)notes.push({midi:84,wave:'square',gain:.012,duration:.025});
 return notes;
}
export class Chiptune {
 constructor({createContext=()=>new (window.AudioContext||window.webkitAudioContext)(),onStatus=()=>{},repeat=(fn,ms)=>setInterval(fn,ms),cancel=id=>clearInterval(id)}={}){this.createContext=createContext;this.onStatus=onStatus;this.repeat=repeat;this.cancel=cancel;this.enabled=true;this.volume=.3;this.paused=false;this.scene='stand';this.context=null;this.timer=null;this.nodes=new Set();this.step=0;this.available=true;}
 async unlock(){if(!this.enabled||this.paused)return;try{if(!this.context){this.context=this.createContext();this.master=this.context.createGain();this.master.gain.value=this.volume;const filter=this.context.createBiquadFilter();filter.type='lowpass';filter.frequency.value=2400;this.master.connect(filter);filter.connect(this.context.destination);}if(this.context.state!=='running')await this.context.resume();if(this.enabled&&!this.paused&&this.context.state==='running'&&this.timer===null){this.nextTime=this.context.currentTime+.04;this.schedule();this.timer=this.repeat(()=>this.schedule(),25);}this.available=true;}catch{this.available=false;this.stop();}this.onStatus();}
 schedule(){const c=this.context;if(!c||!this.enabled||this.paused||c.state!=='running')return;if(this.nextTime<c.currentTime)this.nextTime=c.currentTime+.025;while(this.nextTime<c.currentTime+.14){for(const note of scoreStep(this.step,this.scene))this.play(note,this.nextTime);this.step=(this.step+1)%LOOP_STEPS;this.nextTime+=STEP_SECONDS;}}
 play(note,at){const c=this.context,o=c.createOscillator(),g=c.createGain();o.type=note.wave;o.frequency.value=440*2**((note.midi-69)/12);g.gain.setValueAtTime(0,at);g.gain.linearRampToValueAtTime(note.gain,at+.008);g.gain.setValueAtTime(note.gain*.7,at+Math.min(.04,note.duration*.5));g.gain.linearRampToValueAtTime(0,at+note.duration);o.connect(g);g.connect(this.master);this.nodes.add(o);o.onended=()=>{this.nodes.delete(o);o.disconnect();g.disconnect();};o.start(at);o.stop(at+note.duration+.01);}
 stop(){if(this.timer!==null){this.cancel(this.timer);this.timer=null;}for(const o of this.nodes){try{o.stop();}catch{/* already ended */}}this.nodes.clear();}
 setEnabled(value){this.enabled=!!value;if(!this.enabled)this.stop();else void this.unlock();this.onStatus();}
 setPaused(value){this.paused=!!value;if(this.paused)this.stop();else if(this.context)void this.unlock();}
 setVolume(value){if(!Number.isFinite(value))return;this.volume=Math.max(0,Math.min(1,value));if(this.master)this.master.gain.setTargetAtTime(this.volume,this.context.currentTime,.025);}
}
