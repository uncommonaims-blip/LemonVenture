import test from 'node:test';
import assert from 'node:assert/strict';
import {Chiptune,scoreStep,LOOP_STEPS} from '../src/music.js';
test('original loop stays finite, repeats cleanly and gives the village a lighter arrangement',()=>{
 let stand=0,village=0;for(let i=0;i<LOOP_STEPS;i++){for(const note of scoreStep(i)){assert.ok(Number.isFinite(note.midi)&&note.midi>=29&&note.midi<=90);assert.ok(note.duration>0&&note.gain>0&&note.gain<=.12);stand++;}village+=scoreStep(i,'village').length;assert.deepEqual(scoreStep(i+LOOP_STEPS),scoreStep(i));}assert.ok(stand>village);
});
function fakeContext(){const param=()=>({value:0,setValueAtTime(){},linearRampToValueAtTime(){},setTargetAtTime(v){this.value=v;}});return {currentTime:0,state:'running',destination:{},async resume(){this.state='running';},createGain(){return {gain:param(),connect(){},disconnect(){}};},createBiquadFilter(){return {frequency:param(),connect(){}};},createOscillator(){return {frequency:param(),connect(){},disconnect(){},start(){},stop(){this.stopped=true;}};}};}
test('audio waits for interaction, mute cancels all voices, and resume never stacks timers',async()=>{
 let created=0,timers=0;const c=fakeContext(),m=new Chiptune({createContext:()=>{created++;return c;},repeat:()=>++timers,cancel:()=>timers--});m.setPaused(false);assert.equal(created,0);await m.unlock();assert.equal(timers,1);assert.ok(m.nodes.size>0);await m.unlock();assert.equal(timers,1);m.setEnabled(false);assert.equal(timers,0);assert.equal(m.nodes.size,0);m.setEnabled(true);await m.unlock();assert.equal(timers,1);m.setPaused(true);assert.equal(timers,0);m.setVolume(4);assert.equal(m.volume,1);m.setVolume(-1);assert.equal(m.volume,0);
});
test('unsupported audio fails quietly and scheduling avoids catching up missed music',async()=>{
 const failed=new Chiptune({createContext:()=>{throw Error('No audio');}});await failed.unlock();assert.equal(failed.available,false);
 const c=fakeContext(),m=new Chiptune({createContext:()=>c,repeat:()=>1,cancel(){}});await m.unlock();c.currentTime=1000;m.schedule();assert.ok(m.nextTime>1000&&m.nextTime<1001);assert.ok(m.nodes.size<20);m.stop();
});
test('default browser timers are called without binding the audio instance as receiver',async()=>{
 const originalSet=globalThis.setInterval,originalClear=globalThis.clearInterval;
 try{globalThis.setInterval=function(){assert.equal(this,undefined);return 42;};globalThis.clearInterval=function(){assert.equal(this,undefined);};const m=new Chiptune({createContext:fakeContext});await m.unlock();assert.equal(m.available,true);assert.equal(m.timer,42);m.stop();assert.equal(m.timer,null);}finally{globalThis.setInterval=originalSet;globalThis.clearInterval=originalClear;}
});
