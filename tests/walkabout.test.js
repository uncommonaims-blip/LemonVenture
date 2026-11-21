import test from 'node:test';
import assert from 'node:assert/strict';
import {fresh,transact,canAct,purchase,restoreWalk,FloatingStick,joystickVector} from '../src/stand.js';
test('a complete customer loop conserves stock and separates cash pickup from sales',()=>{let s=fresh();s=transact(s,'lemons');s=transact(s,'ice');assert.equal(s.cash,39.5);s=transact(s,'mix');assert.equal(s.lemons+s.ice,0);assert.equal(s.drinks,1);assert.equal(canAct(s,'serve',false),false);s=transact(s,'serve',true);assert.equal(s.cash,39.5);assert.equal(s.pendingCash,1.9);assert.equal(s.community,.1);assert.equal(s.drinks,0);s=transact(s,'cash');assert.equal(s.cash,41.4);assert.equal(s.pendingCash,0);assert.equal(s.served,1);});
test('insufficient supplies, full bags and unaffordable upgrades cannot create resources',()=>{let s=fresh();assert.equal(transact(s,'mix'),s);assert.equal(purchase(s,'stand'),s);for(let i=0;i<3;i++)s=transact(s,'lemons');assert.equal(transact(s,'lemons'),s);const broke={...s,cash:0,ice:0};assert.equal(transact(broke,'ice'),broke);});
test('legacy balances migrate and pending earnings survive reload',()=>{const s=restoreWalk(null,JSON.stringify({version:1,cash:27,inventory:4,upgrades:['cooler']}));assert.equal(s.cash,27);assert.equal(s.lemons,4);assert.equal(s.ice,4);assert.ok(s.upgrades.includes('cooler'));const roundtrip={...fresh(),pendingCash:3.8};assert.deepEqual(restoreWalk(JSON.stringify(roundtrip)),roundtrip);assert.deepEqual(restoreWalk('{bad'),fresh());});
test('floating stick requires a hold, ignores other fingers, clamps movement and stops on release',()=>{const j=new FloatingStick();j.start(1,100,100,0);j.move(1,180,100);assert.equal(j.sample(50).active,false);assert.equal(j.sample(200).x,1);assert.equal(j.start(2,0,0,250),false);j.end(2);assert.equal(j.sample(300).active,true);j.end(1);assert.deepEqual(j.sample(400),{x:0,y:0,active:false});j.start(3,0,0,500);j.move(3,1,2);assert.deepEqual(j.sample(800),{x:0,y:0,active:true});j.stop();assert.equal(j.sample(900).active,false);});
test('joystick speed has a dead zone and normalized diagonal direction',()=>{assert.deepEqual(joystickVector(3,3),{x:0,y:0});const p=joystickVector(100,100);assert.ok(Math.abs(Math.hypot(p.x,p.y)-1)<1e-10);assert.ok(p.x===p.y);assert.ok(joystickVector(20,0).x<1);});

test('stations save as a complete valid layout, with bounds and overlap protection',async()=>{
 const {getStations,boundPosition,placementAllowed,normalizeLayout,MOVE_SPEED,MOVE_HOLD_MS}=await import('../src/stand.js');
 assert.equal(MOVE_SPEED,247);assert.equal(MOVE_HOLD_MS,80);
 let s=fresh();const original=getStations(s);assert.equal(placementAllowed(original,'lemons',{x:300,y:390}),false);
 assert.deepEqual(boundPosition(-100,1000),{x:90,y:740});
 const positions=Object.fromEntries(original.map(st=>[st.id,{x:st.x,y:st.y}]));
 positions.lemons={x:150,y:270};s={...s,layout:positions};
 const restored=restoreWalk(JSON.stringify(s));assert.equal(getStations(restored).find(st=>st.id==='lemons').x,150);
 assert.equal(restored.cash,s.cash);assert.deepEqual(normalizeLayout({lemons:{x:300,y:390}}),{});
 assert.deepEqual(normalizeLayout({lemons:{x:NaN,y:0}}).lemons,{x:90,y:270});
});
