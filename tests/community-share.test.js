import test from 'node:test';
import assert from 'node:assert/strict';
import {fresh,transact,setCommunityRate,moveLocation,restoreWalk,advanceClock,GAME_DAY_SECONDS} from '../src/stand.js';
const withDrink=s=>({...s,drinks:1});
test('community percentage applies to profit after ingredients, rather than gross sales',()=>{
 const s=transact(withDrink(setCommunityRate(fresh(),50)),'serve',true);
 assert.equal(s.totalRevenue,2);assert.equal(s.operatingProfit,1.5);assert.equal(s.community,.75);assert.equal(s.pendingCash,1.25);
});
test('0% retains all proceeds and 100% gives only the profitable part of a sale',()=>{
 const zero=transact(withDrink(setCommunityRate(fresh(),0)),'serve',true);assert.equal(zero.community,0);assert.equal(zero.pendingCash,2);
 const all=transact(withDrink(setCommunityRate(fresh(),100)),'serve',true);assert.equal(all.community,1.5);assert.equal(all.pendingCash,.5);
 assert.equal(setCommunityRate(fresh(),-20).communityRate,0);assert.equal(setCommunityRate(fresh(),200).communityRate,100);
});
test('rent must be recovered before allocating community profit',()=>{
 let s=moveLocation(setCommunityRate(fresh(),100),'park');assert.equal(s.operatingProfit,-3);
 s=transact(withDrink(s),'serve',true);assert.equal(s.community,0);s=transact(withDrink(s),'serve',true);assert.equal(s.community,0);
 s=transact(withDrink(s),'serve',true);assert.equal(s.community,1.5);assert.equal(s.profitPeak,1.5);
 s=advanceClock({...s,cash:20},GAME_DAY_SECONDS);assert.equal(s.operatingProfit,-1.5);
 s=transact(withDrink(s),'serve',true);s=transact(withDrink(s),'serve',true);assert.equal(s.community,1.5);
 s=transact(withDrink(s),'serve',true);assert.equal(s.community,3);
});
test('changing the rate is prospective and old savings and preferences survive reload',()=>{
 let s=transact(withDrink(setCommunityRate(fresh(),0)),'serve',true);s=setCommunityRate({...s,community:2.5,communityInvested:1.5,villageLevel:2},50);s=transact(withDrink(s),'serve',true);
 assert.equal(s.community,3.25);assert.equal(s.communityInvested,1.5);assert.equal(s.villageLevel,2);assert.deepEqual(restoreWalk(JSON.stringify(s)),s);
 const old={...fresh(),community:4};delete old.communityRate;delete old.operatingProfit;delete old.profitPeak;
 const migrated=restoreWalk(JSON.stringify(old));assert.equal(migrated.communityRate,5);assert.equal(migrated.community,4);assert.equal(migrated.operatingProfit,0);
});
