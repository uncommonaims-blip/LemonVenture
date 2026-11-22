import test from 'node:test';
import assert from 'node:assert/strict';
import {fresh,LOCATIONS,moveLocation,advanceClock,GAME_DAY_SECONDS,marketInfo,developVillage,effects,setPrice,willingToPay,restoreWalk,getStations} from '../src/stand.js';
import {syncWorkers,stepWorkers} from '../src/workers.js';
test('town locations trade progressively higher rents for visibility and traffic',()=>{
 const places=Object.values(LOCATIONS);assert.equal(places.length,5);for(let i=1;i<places.length;i++){assert.ok(places[i].rent>places[i-1].rent);assert.ok(places[i].traffic>places[i-1].traffic);assert.ok(places[i].visibility>places[i-1].visibility);}
 const s=fresh();assert.equal(moveLocation(s,'missing'),s);assert.equal(moveLocation(s,'backyard'),s);const broke={...s,cash:2};assert.equal(moveLocation(broke,'park'),broke);
});
test('rent is prepaid on moving, recurs once each active day and preserves a free fallback',()=>{
 let s=moveLocation(fresh(),'park');assert.equal(s.cash,37);assert.equal(s.rentPaid,3);assert.equal(s.totalExpenses,3);
 s=advanceClock(s,GAME_DAY_SECONDS-1);assert.equal(s.cash,37);s=advanceClock(s,1);assert.equal(s.cash,34);assert.equal(s.day,2);assert.equal(s.rentPaid,6);
 assert.equal(advanceClock(s,0),s);const missed=advanceClock({...s,cash:1,pendingCash:100},GAME_DAY_SECONDS);assert.equal(missed.location,'backyard');assert.equal(missed.cash,1);assert.equal(missed.pendingCash,100);
 const free=moveLocation({...s,cash:0},'backyard');assert.equal(free.location,'backyard');assert.equal(free.cash,0);
});
test('contributions increase fame, customer volume and willingness to pay',()=>{
 const initial={...fresh(),community:10},before=marketInfo(initial);assert.equal(before.notoriety,0);
 const after=developVillage(initial),grown=marketInfo(after);assert.ok(grown.notoriety>before.notoriety);assert.ok(grown.traffic>before.traffic);assert.ok(grown.willingness>before.willingness);assert.ok(effects(after).spawnSeconds<effects(initial).spawnSeconds);
 assert.ok(marketInfo(after,'boardwalk').willingness>grown.willingness);assert.ok(marketInfo(after,'boardwalk').traffic>grown.traffic);
});
test('live pricing is bounded and customers and employees respect budgets',()=>{
 const s=fresh();assert.equal(setPrice(s,100).price,5);assert.equal(setPrice(s,-10).price,.5);assert.equal(setPrice(s,NaN),s);assert.equal(setPrice(s,2.25).price,2.25);
 assert.equal(willingToPay({...s,price:3},{maxPrice:2.5}),false);assert.equal(willingToPay({...s,price:2},{maxPrice:2.5}),true);
 let shop={...s,upgrades:['server'],drinks:1};const workers=syncWorkers(shop,[]),customers=[{mode:'waiting',maxPrice:1}];for(let i=0;i<100;i++)shop=stepWorkers(shop,workers,getStations(shop),customers,.1).state;assert.equal(shop.served,0);assert.equal(shop.drinks,1);
});
test('location, rent clock and price persist, and older saves gain safe defaults',()=>{
 const s=setPrice(advanceClock(moveLocation(fresh(),'school'),45),3.25);assert.deepEqual(restoreWalk(JSON.stringify(s)),s);
 const old={...fresh()};delete old.location;delete old.day;delete old.dayElapsed;delete old.rentPaid;const restored=restoreWalk(JSON.stringify(old));assert.equal(restored.location,'backyard');assert.equal(restored.dayElapsed,0);assert.equal(restored.day,1);assert.equal(restored.rentPaid,0);
});
