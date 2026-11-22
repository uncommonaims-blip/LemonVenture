import test from 'node:test';
import assert from 'node:assert/strict';
import {fresh,restoreWalk,transact,canAct} from '../src/stand.js';
import {harvest,water,stepFarm,dispatch,farmInfo,buyFarmProject,ROAD,restoreFarm} from '../src/orchard.js';
test('ripe trees yield fruit once, watering boosts growth and harvests regrow',()=>{
 let s=fresh();s=harvest(s,0);assert.equal(s.farm.stock,4);assert.equal(harvest(s,0),s);
 s=water(s,0);assert.equal(water(s,0),s);s=stepFarm(s,20);assert.equal(s.farm.trees[0].growth,.5);s=stepFarm(s,20);assert.equal(s.farm.trees[0].growth,1);s=harvest(s,0);assert.equal(s.farm.stock,8);assert.equal(s.farm.trees[0].watered,false);
});
test('dispatch reserves stock and delivers exactly once after road travel',()=>{
 let s={...fresh(),farm:{...fresh().farm,stock:30}};s=dispatch(s);assert.equal(s.farm.stock,18);assert.equal(s.farm.shipment.amount,12);assert.equal(dispatch(s),s);
 s=stepFarm(s,89);assert.equal(s.farm.standStock,0);s=stepFarm(s,1);assert.equal(s.farm.standStock,12);s=stepFarm(s,90);assert.equal(s.farm.standStock,12);assert.equal(s.farm.delivered,12);
});
test('all five road works spend chest funds and reduce future delivery duration',()=>{
 let s={...fresh(),community:10000};const cash=s.cash;for(const p of ROAD){const before=farmInfo(s).seconds,old=s.community;s=buyFarmProject(s,'road');assert.equal(old-s.community,p[1]);assert.ok(farmInfo(s).seconds<before);assert.equal(s.cash,cash);}assert.equal(farmInfo(s).seconds,20);assert.equal(buyFarmProject(s,'road'),s);assert.equal(s.communityInvested,2700);
 assert.equal(buyFarmProject(fresh(),'road').farm.road,0);
});
test('groves, irrigation, gardeners and carts work together and preserve saves',()=>{
 let s={...fresh(),cash:1e7};for(let i=0;i<10;i++)s=buyFarmProject(s,'plant');assert.equal(s.farm.trees.length,12);assert.equal(buyFarmProject(s,'plant'),s);for(const id of ['irrigation','gardeners','carts'])s=buyFarmProject(s,id);assert.equal(farmInfo(s).yield,5);assert.equal(farmInfo(s).load,24);s=stepFarm(s,90);assert.ok(s.farm.shipment);assert.ok(s.farm.shipment.amount>0);const saved=restoreWalk(JSON.stringify(s));assert.deepEqual(saved,s);assert.deepEqual(restoreFarm(null),fresh().farm);
});
test('delivered lemons replace paid supplies and profit includes their savings',()=>{
 let s={...fresh(),cash:0,farm:{...fresh().farm,standStock:1},ice:1};assert.ok(canAct(s,'lemons'));s=transact(s,'lemons');assert.equal(s.cash,0);assert.equal(s.farm.standStock,0);s=transact(s,'mix');s=transact(s,'serve',true);assert.equal(s.operatingProfit,1.75);assert.equal(s.farmDrinks,0);assert.equal(s.farmLemons,0);assert.equal(s.totalExpenses,0);
});
test('migration repairs malformed farm state and keeps older businesses intact',()=>{
 const old={...fresh(),cash:12345};delete old.farm;delete old.farmLemons;delete old.farmDrinks;const s=restoreWalk(JSON.stringify(old));assert.equal(s.cash,12345);assert.equal(s.farm.trees.length,2);
 const f=restoreFarm({trees:[{growth:Infinity}],road:999,carts:-3,stock:-5,shipment:{amount:-5,remaining:2,total:3}});assert.equal(f.road,5);assert.equal(f.stock,0);assert.equal(f.trees[0].growth,0);assert.equal(f.shipment,null);
});
