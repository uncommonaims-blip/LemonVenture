import test from 'node:test';
import assert from 'node:assert/strict';
import {fresh,purchase,upgradeCost,upgradeLevel,capacity,effects,ingredientCost,transact,marketInfo,restoreWalk,getStations,UPGRADES} from '../src/stand.js';
import {syncWorkers,stepWorkers} from '../src/workers.js';
test('tiered investments grow in price, cap at ten and survive reload',()=>{
 let s={...fresh(),cash:1e9};
 for(let n=0;n<10;n++){const before=s.cash,cost=upgradeCost(s,'warehouse');s=purchase(s,'warehouse');assert.equal(s.cash,Math.round((before-cost)*100)/100);assert.equal(upgradeLevel(s,'warehouse'),n+1);}
 assert.equal(capacity(s,'lemons'),63);assert.equal(purchase(s,'warehouse'),s);assert.deepEqual(restoreWalk(JSON.stringify(s)),s);
 assert.equal(purchase({...fresh(),cash:119},'warehouse').cash,119);
 assert.equal(upgradeCost(s,'gold'),10000);
});
test('every functional advanced investment changes its advertised mechanic',()=>{
 const base={...fresh(),cash:1e8};let s=base;
 for(const id of Object.keys(UPGRADES))s=purchase(s,id);
 assert.equal(capacity(s,'drinks'),9);assert.equal(ingredientCost(s),.24);
 assert.ok(effects(s).mixSeconds<effects({...base,upgrades:['stand','blender']}).mixSeconds);
 assert.ok(effects(s).serveSeconds<effects({...base,upgrades:['service']}).serveSeconds);
 assert.ok(effects(s).supplySeconds<.6);assert.ok(effects(s).patience>100);
 assert.ok(marketInfo(s).willingness>marketInfo(base).willingness);
 const sold=transact({...s,drinks:1,communityRate:0},'serve',true);assert.equal(sold.totalRevenue,2.05);assert.equal(sold.operatingProfit,1.57);
 assert.equal(syncWorkers(s,[]).length,8);
});
test('training needs its employee and eight employees still conserve supplies and earn cash',()=>{
 let s={...fresh(),cash:10000};assert.equal(purchase(s,'runnerTraining'),s);assert.equal(purchase(s,'runner2'),s);
 for(const id of ['runner','chef','server','cashier','runner2','chef2','server2','cashier2','runnerTraining','chefTraining','serverTraining','cashierTraining'])s=purchase(s,id);
 const start=s.cash,workers=syncWorkers(s,[]),customers=[];
 for(let i=0;i<1800;i++){if(customers.filter(c=>c.mode!=='leaving').length<3)customers.push({mode:'waiting'});s=stepWorkers(s,workers,getStations(s),customers,.05).state;}
 assert.ok(s.served>5);assert.ok(s.cash>start);assert.ok(s.drinks>=0&&s.lemons>=0&&s.ice>=0);
 assert.equal(restoreWalk(JSON.stringify(s)).upgrades.length,s.upgrades.length);
});
