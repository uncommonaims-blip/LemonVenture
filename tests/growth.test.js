import test from 'node:test';
import assert from 'node:assert/strict';
import {fresh,effects,capacity,purchase,UPGRADES,nextProject,developVillage,restoreWalk,getStations} from '../src/stand.js';
import {syncWorkers,stepWorkers} from '../src/workers.js';
test('shop upgrades change capacity, speed, service, customer frequency and patience',()=>{
 const base=fresh(),s={...base,upgrades:Object.keys(UPGRADES)};
 assert.equal(Object.keys(UPGRADES).length,14);
 assert.ok(effects(s).speed>effects(base).speed);
 assert.ok(effects(s).mixSeconds<effects(base).mixSeconds/2);
 assert.ok(effects(s).serveSeconds<effects(base).serveSeconds);
 assert.ok(effects(s).spawnSeconds<effects(base).spawnSeconds);
 assert.equal(effects(s).patience,100);assert.equal(capacity(s,'lemons'),9);assert.equal(capacity(s,'drinks'),5);
 const hired=purchase({...base,cash:100},'runner');assert.equal(hired.cash,65);assert.equal(purchase(hired,'runner'),hired);
});
test('community builds spend only chest funds, preserve working cash and persist village growth',()=>{
 let s={...fresh(),community:3.5};const cash=s.cash;
 for(let i=0;i<3;i++){const project=nextProject(s),before=s.community;s=developVillage(s);assert.equal(s.community,Math.round((before-project.cost)*100)/100);}
 assert.equal(s.villageLevel,3);assert.equal(s.community,0);assert.equal(s.communityInvested,3.5);assert.equal(s.cash,cash);
 assert.equal(developVillage(s),s);assert.deepEqual(restoreWalk(JSON.stringify(s)),s);
 const old={...fresh()};delete old.villageLevel;delete old.communityInvested;
 assert.equal(restoreWalk(JSON.stringify(old)).villageLevel,0);assert.equal(restoreWalk(JSON.stringify(old)).communityInvested,0);
});
test('all four employees complete the supply-to-cash loop without player input',()=>{
 let s={...fresh(),cash:100,upgrades:['runner','chef','server','cashier']};let workers=syncWorkers(s,[]);const stations=getStations(s),customers=[];
 for(let tick=0;tick<900;tick++){
  if(customers.filter(c=>c.mode!=='leaving').length<3)customers.push({mode:'waiting',cup:false});
  const next=stepWorkers(s,workers,stations,customers,.1);s=next.state;
 }
 assert.equal(workers.length,4);assert.ok(s.served>=3);assert.ok(s.totalRevenue>=6);assert.ok(s.community>=.3);assert.ok(s.cash>100);assert.ok(s.lemons>=0&&s.ice>=0&&s.drinks>=0);
 const restored=restoreWalk(JSON.stringify(s));assert.equal(syncWorkers(restored,[]).length,4);
});
test('employees respect moved stations and cannot consume missing ingredients or invent money',()=>{
 let s={...fresh(),cash:0,upgrades:['runner','chef','server','cashier']};const workers=syncWorkers(s,[]);
 for(let i=0;i<100;i++)s=stepWorkers(s,workers,getStations(s),[{mode:'waiting'}],.1).state;
 assert.equal(s.served,0);assert.equal(s.cash,0);assert.equal(s.drinks,0);
 s={...fresh(),upgrades:['runner'],layout:{lemons:{x:170,y:270}}};const runner=syncWorkers(s,[]);
 for(let i=0;i<60;i++)s=stepWorkers(s,runner,getStations(s),[],.1).state;
 assert.ok(s.lemons>0);assert.ok(s.cash<40);
});
