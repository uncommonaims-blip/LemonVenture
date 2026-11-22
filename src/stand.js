export const MOVE_SPEED = 190 * 1.3;
export const MOVE_HOLD_MS = 80;
export const EDIT_HOLD_MS = 650;
export const KEY = 'lemonventure.walkabout.v3';
export const STATIONS = [
  {id:'lemons',x:90,y:270,color:'#e5b930',label:'LEMONS',icon:'🍋'},
  {id:'ice',x:510,y:270,color:'#70b9d5',label:'ICE',icon:'🧊'},
  {id:'serve',x:300,y:390,color:'#4a9476',label:'SERVE',icon:'🥤'},
  {id:'mix',x:90,y:560,color:'#c89662',label:'MIX',icon:'🍹'},
  {id:'cash',x:510,y:560,color:'#79a656',label:'CASH',icon:'💵'},
  {id:'upgrade',x:300,y:730,color:'#a88cc3',label:'UPGRADE',icon:'⬆'}
];
export const UPGRADES = {
 sign:{name:'Street sign',category:'customers',icon:'🪧',cost:18,description:'Bring customers in 33% sooner.'},
 cooler:{name:'Ice cooler',category:'equipment',icon:'🧊',cost:25,description:'Carry 5 of each ingredient.'},
 stand:{name:'Bigger stand',category:'equipment',icon:'🥤',cost:45,description:'Carry 5 drinks and mix twice as fast.'},
 shoes:{name:'Running shoes',category:'equipment',icon:'👟',cost:22,description:'Walk 20% faster around your stand.'},
 crates:{name:'Supply crates',category:'equipment',icon:'📦',cost:24,description:'Carry 4 extra lemons and ice.'},
 blender:{name:'Electric mixer',category:'equipment',icon:'⚡',cost:30,description:'Cut mixing time by another 40%.'},
 service:{name:'Quick-serve counter',category:'equipment',icon:'🛎️',cost:20,description:'Hand over drinks 45% faster.'},
 flyers:{name:'Neighborhood flyers',category:'customers',icon:'📣',cost:26,description:'Bring customers in another 25% sooner.'},
 benches:{name:'Comfortable waiting area',category:'customers',icon:'🪑',cost:32,description:'Add 35 seconds of customer patience.'},
 banner:{name:'Festival banner',category:'customers',icon:'🎏',cost:55,description:'Bring customers in another 30% sooner.'},
 runner:{name:'Hire a supply runner',category:'team',icon:'🧑‍🌾',cost:35,description:'Gathers lemons and ice. One-time hire.'},
 chef:{name:'Hire a lemonade maker',category:'team',icon:'🧑‍🍳',cost:50,description:'Mixes drinks whenever ingredients are ready. One-time hire.'},
 server:{name:'Hire a server',category:'team',icon:'🧑‍💼',cost:65,description:'Serves waiting customers. One-time hire.'},
 cashier:{name:'Hire a cashier',category:'team',icon:'💵',cost:40,description:'Collects your earnings. One-time hire.'}
};
// Tiered investments remain useful well beyond the starter shop.
const ADVANCED = [
 ['warehouse','Supply warehouse','equipment','🏭',120,'+6 ingredient capacity per level.'],
 ['trays','Stacking drink trays','equipment','🥤',100,'+4 drink capacity per level.'],
 ['scoops','Quick-load scoops','equipment','🥄',85,'Load supplies 12% faster per level.'],
 ['press','Commercial citrus press','equipment','🍋',160,'Mix 12% faster per level.'],
 ['conveyor','Serving conveyor','equipment','⚙️',190,'Serve 12% faster per level.'],
 ['sneakers','Premium running gear','equipment','👟',90,'Walk 5% faster per level.'],
 ['bulk','Wholesale contracts','equipment','🚚',240,'Cut ingredient costs by 3% per level.'],
 ['recipe','Signature recipe','customers','📖',150,'Raise customer budgets by $0.15 per level.'],
 ['organic','Organic certification','customers','🌿',350,'Raise customer budgets by $0.20 per level.'],
 ['radio','Local radio campaign','customers','📻',180,'Bring customers 8% sooner per level.'],
 ['loyalty','Loyalty club','customers','💛',260,'Bring customers 8% sooner per level.'],
 ['festival','Festival sponsorship','customers','🎉',650,'Bring customers 10% sooner per level.'],
 ['shade','Shaded waiting area','customers','⛱️',120,'Add 10 seconds of patience per level.'],
 ['tips','Tip jar charm','customers','🪙',140,'Earn guaranteed tips of $0.05 per sale per level.'],
 ['runnerTraining','Runner training','team','🏃',130,'Supply runners move and load 10% faster per level.','runner'],
 ['chefTraining','Maker training','team','👨‍🍳',170,'Makers move and mix 10% faster per level.','chef'],
 ['serverTraining','Server training','team','🛎️',210,'Servers move and serve 10% faster per level.','server'],
 ['cashierTraining','Cashier training','team','🧮',110,'Cashiers move and collect 10% faster per level.','cashier'],
 ['luxury','Luxury brand','customers','💎',1500,'Raise customer budgets by $0.25 per level.'],
 ['franchise','Franchise publicity','customers','🌎',3000,'Bring customers 12% sooner per level.']
];
for(const [id,name,category,icon,cost,description,requires] of ADVANCED)UPGRADES[id]={name,category,icon,cost,description,requires,maxLevel:10};
for(const [id,name,job,cost] of [['runner2','Second supply runner','runner',400],['chef2','Second lemonade maker','chef',650],['server2','Second server','server',900],['cashier2','Second cashier','cashier',500]])UPGRADES[id]={name,category:'team',icon:'👥',cost,requires:job,description:'Adds a second employee who shares the workload.'};
for(const [id,name,icon,cost,description] of [['flowers','Flower planters','🌸',200,'Bright flower beds around your courtyard.'],['lights','Festival lights','💡',600,'Animated warm lights across your shop.'],['fountain','Courtyard fountain','⛲',1800,'A sparkling fountain beside the stand.'],['gold','Golden stand trophy','🏆',10000,'A golden monument to your lemonade empire.']])UPGRADES[id]={name,category:'decor',icon,cost,description};
export function upgradeLevel(s,id){return UPGRADES[id]?.maxLevel?Math.max(0,Math.min(10,Math.floor(s.upgradeLevels?.[id]||0))):(s.upgrades.includes(id)?1:0);}
export function upgradeCost(s,id){const u=UPGRADES[id];return u?Math.round(u.cost*1.85**upgradeLevel(s,id)):Infinity;}
export function upgradeAvailable(s,id){const u=UPGRADES[id];return Boolean(u&&upgradeLevel(s,id)<(u.maxLevel||1)&&(!u.requires||s.upgrades.includes(u.requires)));}
export function ingredientCost(s){return cents(.25*(1-.03*upgradeLevel(s,'bulk')));}
export function fresh(){return {version:3,upgradeLevels:{},cash:40,price:2,name:'My sunny stand',color:'#f3c64e',lemons:0,ice:0,drinks:0,pendingCash:0,upgrades:[],served:0,totalRevenue:0,totalExpenses:0,community:0,communityInvested:0,communityRate:5,operatingProfit:0,profitPeak:0,villageLevel:0,location:'backyard',day:1,dayElapsed:0,rentPaid:0,history:[],layout:{}};}
export function restoreWalk(raw,legacy){
  try{
    if(raw){const s=JSON.parse(raw);const numbers=['cash','price','lemons','ice','drinks','pendingCash','served','totalRevenue','totalExpenses','community'];
      if(s.version!==3||!numbers.every(k=>Number.isFinite(s[k])&&s[k]>=0)||s.price<.5||s.price>20||!['lemons','ice','drinks','served'].every(k=>Number.isInteger(s[k]))||!Array.isArray(s.upgrades)||s.upgrades.some(k=>!UPGRADES[k])||typeof s.name!=='string'||!/^#[0-9a-f]{6}$/i.test(s.color)||!Array.isArray(s.history))return fresh();
      return {...s,upgradeLevels:Object.fromEntries(Object.keys(UPGRADES).filter(id=>UPGRADES[id].maxLevel&&s.upgradeLevels?.[id]>0).map(id=>[id,Number.isFinite(s.upgradeLevels?.[id])?Math.max(0,Math.min(10,Math.floor(s.upgradeLevels[id]))):0])),communityRate:Number.isFinite(s.communityRate)?Math.max(0,Math.min(100,s.communityRate)):5,operatingProfit:Number.isFinite(s.operatingProfit)?s.operatingProfit:0,profitPeak:Number.isFinite(s.profitPeak)&&s.profitPeak>=0?s.profitPeak:0,location:LOCATIONS[s.location]?s.location:'backyard',day:Number.isInteger(s.day)&&s.day>0?s.day:1,dayElapsed:Number.isFinite(s.dayElapsed)&&s.dayElapsed>=0&&s.dayElapsed<GAME_DAY_SECONDS?s.dayElapsed:0,rentPaid:Number.isFinite(s.rentPaid)&&s.rentPaid>=0?s.rentPaid:0,communityInvested:Number.isFinite(s.communityInvested)&&s.communityInvested>=0?s.communityInvested:0,villageLevel:Number.isInteger(s.villageLevel)&&s.villageLevel>=0?Math.min(10000,s.villageLevel):0,layout:normalizeLayout(s.layout),history:s.history.filter(r=>r&&Number.isFinite(r.revenue)&&Number.isFinite(r.sold)&&Number.isFinite(r.day)).slice(-50)};
    }
    if(legacy){const old=JSON.parse(legacy);if(old.version===1&&Number.isFinite(old.cash)&&old.cash>=0){const s=fresh();for(const k of ['cash','price','name','color','totalRevenue','totalExpenses','community'])if(typeof old[k]===typeof s[k])s[k]=old[k];s.price=Math.max(.5,Math.min(20,s.price));s.color=/^#[0-9a-f]{6}$/i.test(s.color)?s.color:'#f3c64e';s.upgrades=(old.upgrades||[]).filter(k=>UPGRADES[k]);const stock=Math.max(0,Math.floor(Number(old.inventory)||0));s.lemons=stock;s.ice=stock;return s;}}
  }catch{/* A missing or damaged save starts a new adventure. */}
  return fresh();
}
const cents=n=>Math.round(n*100)/100;
export function capacity(s,kind){return (s.upgrades.includes(kind==='drinks'?'stand':'cooler')?5:3)+(kind!=='drinks'&&s.upgrades.includes('crates')?4:0)+upgradeLevel(s,kind==='drinks'?'trays':'warehouse')*(kind==='drinks'?4:6);}
export function canAct(s,id,waiting=false){
  if(id==='lemons'||id==='ice')return s[id]<capacity(s,id)&&s.cash>=ingredientCost(s);
  if(id==='mix')return s.lemons>0&&s.ice>0&&s.drinks<capacity(s,'drinks');
  if(id==='serve')return s.drinks>0&&waiting;
  if(id==='cash')return s.pendingCash>0;
  return id==='upgrade';
}
export function transact(s,id,waiting=false){
  if(!canAct(s,id,waiting))return s;
  if(id==='lemons'||id==='ice')return {...s,[id]:s[id]+1,cash:cents(s.cash-ingredientCost(s)),totalExpenses:cents(s.totalExpenses+ingredientCost(s))};
  if(id==='mix')return {...s,lemons:s.lemons-1,ice:s.ice-1,drinks:s.drinks+1};
  if(id==='serve'){
    const revenue=cents(s.price+.05*upgradeLevel(s,'tips'));
    const operatingProfit=cents((s.operatingProfit||0)+revenue-ingredientCost(s)*2);
    const profitPeak=Math.max(s.profitPeak||0,operatingProfit,0);
    const eligibleProfit=Math.max(0,operatingProfit-(s.profitPeak||0));
    const contribution=cents(eligibleProfit*(s.communityRate??5)/100);const sold=s.served+1;
    return {...s,operatingProfit,profitPeak,drinks:s.drinks-1,served:sold,totalRevenue:cents(s.totalRevenue+revenue),community:cents(s.community+contribution),pendingCash:cents(s.pendingCash+revenue-contribution),history:[...s.history,{day:sold,sold:1,revenue,contribution}].slice(-50)};
  }
  if(id==='cash')return {...s,cash:cents(s.cash+s.pendingCash),pendingCash:0};
  return s;
}
export function purchase(s,id){const cost=upgradeCost(s,id);if(!upgradeAvailable(s,id)||s.cash<cost)return s;const level=upgradeLevel(s,id)+1;return {...s,cash:cents(s.cash-cost),totalExpenses:cents(s.totalExpenses+cost),upgrades:s.upgrades.includes(id)?s.upgrades:[...s.upgrades,id],upgradeLevels:{...s.upgradeLevels,...(UPGRADES[id].maxLevel?{[id]:level}:{})}};}
export function canRestartGrant(s){return s.cash<.5&&s.pendingCash===0&&s.drinks===0&&(s.lemons===0||s.ice===0);}
export function joystickVector(dx,dy,radius=48,dead=7){const distance=Math.hypot(dx,dy);if(distance<=dead)return {x:0,y:0};const strength=Math.min(1,(distance-dead)/(radius-dead));return {x:dx/distance*strength,y:dy/distance*strength};}
export class FloatingStick {
  constructor(){this.stop();}
  start(id,x,y,time){if(this.id!==null)return false;this.id=id;this.x=x;this.y=y;this.px=x;this.py=y;this.time=time;return true;}
  move(id,x,y){if(this.id!==id)return;this.px=x;this.py=y;}
  sample(time){if(this.id===null||time-this.time<MOVE_HOLD_MS)return {x:0,y:0,active:false};return {...joystickVector(this.px-this.x,this.py-this.y),active:true};}
  end(id){if(this.id===id)this.stop();}
  stop(){this.id=null;this.x=0;this.y=0;this.px=0;this.py=0;this.time=0;}
}

// Layout coordinates describe the work ring; the matching equipment moves with it.
export function getStations(state){return STATIONS.map(s=>({...s,...state.layout?.[s.id]}));}
export function boundPosition(x,y){return {x:Math.max(90,Math.min(510,x)),y:Math.max(270,Math.min(740,y))};}
export function placementAllowed(stations,id,point){return stations.every(s=>s.id===id||Math.abs(s.x-point.x)>=112||Math.abs(s.y-point.y)>=150);}
export function normalizeLayout(raw){
 const layout={};if(!raw||typeof raw!=='object'||!Object.keys(raw).length)return layout;
 const wanted=STATIONS.map(s=>{const p=raw[s.id];return p&&Number.isFinite(p.x)&&Number.isFinite(p.y)?{...s,...boundPosition(p.x,p.y)}:{...s};});
 for(const s of wanted){if(!placementAllowed(wanted,s.id,s))return {};layout[s.id]={x:s.x,y:s.y};}
 return layout;
}

export function effects(s){const has=id=>s.upgrades.includes(id);return {
 speed:MOVE_SPEED*(has('shoes')?1.2:1)*(1+.05*upgradeLevel(s,'sneakers')),
 mixSeconds:(has('stand')?.65:1.3)*(has('blender')?.6:1)*.88**upgradeLevel(s,'press'),
 serveSeconds:.75*(has('service')?.55:1)*.88**upgradeLevel(s,'conveyor'),
 supplySeconds:.6*.88**upgradeLevel(s,'scoops'),
 spawnSeconds:Math.max(.18,(has('sign')?4:6)*(has('flyers')?.75:1)*(has('banner')?.7:1)*(1+(s.price-2)*.25)/marketInfo(s).traffic*.92**(upgradeLevel(s,'radio')+upgradeLevel(s,'loyalty'))*.9**upgradeLevel(s,'festival')*.88**upgradeLevel(s,'franchise')), 
 patience:65+(has('benches')?35:0)+10*upgradeLevel(s,'shade')
};}
const PROJECTS=[['A second home',.5],['A village road',1],['Shade trees',2],['A community garden',3],['Another family home',5],['A clean-water well',8],['A village school',12],['A market square',18]];
export function nextProject(s){const n=s.villageLevel||0;return n<PROJECTS.length?{name:PROJECTS[n][0],cost:PROJECTS[n][1]}:{name:n%2?'More trees and gardens':'A new family home',cost:25+(n-8)*5};}
export function developVillage(s){const p=nextProject(s);if(s.community<p.cost)return s;return {...s,community:cents(s.community-p.cost),communityInvested:cents((s.communityInvested||0)+p.cost),villageLevel:(s.villageLevel||0)+1};}

export const GAME_DAY_SECONDS=120;
export const LOCATIONS={
 backyard:{name:'Backyard lane',icon:'🏠',rent:0,traffic:1,visibility:1,premium:0,color:'#dce9ce',description:'A free, quiet place to learn the ropes.'},
 park:{name:'Riverside park',icon:'🌳',rent:3,traffic:1.35,visibility:1.1,premium:.1,color:'#d0e5cf',description:'Walkers and families, with a modest daily rent.'},
 school:{name:'School corner',icon:'🏫',rent:5,traffic:1.65,visibility:1.2,premium:.2,color:'#e8e0ca',description:'A busy neighborhood corner with good visibility.'},
 market:{name:'Market square',icon:'🏪',rent:9,traffic:2.1,visibility:1.35,premium:.35,color:'#e6d9c2',description:'A central spot where shoppers can easily find you.'},
 boardwalk:{name:'Beach boardwalk',icon:'🏖️',rent:14,traffic:2.6,visibility:1.5,premium:.6,color:'#d7e8e8',description:'Premium visibility, tourist traffic and the highest rent.'}
};
export function marketInfo(s,location=s.location||'backyard'){
 const place=LOCATIONS[location]||LOCATIONS.backyard;
 const notoriety=Math.min(100,(s.villageLevel||0)*5+Math.sqrt(s.communityInvested||0)*3);
 return {place,notoriety,traffic:place.traffic*place.visibility*(1+notoriety*.008),willingness:2.5+place.premium+notoriety*.035+.15*upgradeLevel(s,'recipe')+.2*upgradeLevel(s,'organic')+.25*upgradeLevel(s,'luxury')};
}
export function setPrice(s,value){if(!Number.isFinite(value))return s;return {...s,price:cents(Math.max(.5,Math.min(20,value)))};}
export function moveLocation(s,id){const place=LOCATIONS[id];if(!place||id===(s.location||'backyard')||s.cash<place.rent)return s;return {...s,location:id,dayElapsed:0,operatingProfit:cents((s.operatingProfit||0)-place.rent),cash:cents(s.cash-place.rent),totalExpenses:cents(s.totalExpenses+place.rent),rentPaid:cents((s.rentPaid||0)+place.rent)};}
export function advanceClock(s,seconds){
 if(!Number.isFinite(seconds)||seconds<=0)return s;let elapsed=(s.dayElapsed||0)+seconds,next={...s};
 while(elapsed>=GAME_DAY_SECONDS){elapsed-=GAME_DAY_SECONDS;next.day=(next.day||1)+1;const rent=(LOCATIONS[next.location]||LOCATIONS.backyard).rent;if(next.cash<rent){next.location='backyard';}else{next.operatingProfit=cents((next.operatingProfit||0)-rent);next.cash=cents(next.cash-rent);next.totalExpenses=cents(next.totalExpenses+rent);next.rentPaid=cents((next.rentPaid||0)+rent);}}
 return {...next,dayElapsed:elapsed};
}
export function willingToPay(state,customer){return state.price<=(customer.maxPrice??Infinity);}

export function setCommunityRate(s,percent){if(!Number.isFinite(percent))return s;return {...s,communityRate:Math.max(0,Math.min(100,Math.round(percent)))};}
