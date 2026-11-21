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
export function fresh(){return {version:3,cash:40,price:2,name:'My sunny stand',color:'#f3c64e',lemons:0,ice:0,drinks:0,pendingCash:0,upgrades:[],served:0,totalRevenue:0,totalExpenses:0,community:0,communityInvested:0,villageLevel:0,history:[],layout:{}};}
export function restoreWalk(raw,legacy){
  try{
    if(raw){const s=JSON.parse(raw);const numbers=['cash','price','lemons','ice','drinks','pendingCash','served','totalRevenue','totalExpenses','community'];
      if(s.version!==3||!numbers.every(k=>Number.isFinite(s[k])&&s[k]>=0)||s.price<.5||s.price>5||!['lemons','ice','drinks','served'].every(k=>Number.isInteger(s[k]))||!Array.isArray(s.upgrades)||s.upgrades.some(k=>!UPGRADES[k])||typeof s.name!=='string'||!/^#[0-9a-f]{6}$/i.test(s.color)||!Array.isArray(s.history))return fresh();
      return {...s,communityInvested:Number.isFinite(s.communityInvested)&&s.communityInvested>=0?s.communityInvested:0,villageLevel:Number.isInteger(s.villageLevel)&&s.villageLevel>=0?Math.min(10000,s.villageLevel):0,layout:normalizeLayout(s.layout),history:s.history.filter(r=>r&&Number.isFinite(r.revenue)&&Number.isFinite(r.sold)&&Number.isFinite(r.day)).slice(-50)};
    }
    if(legacy){const old=JSON.parse(legacy);if(old.version===1&&Number.isFinite(old.cash)&&old.cash>=0){const s=fresh();for(const k of ['cash','price','name','color','totalRevenue','totalExpenses','community'])if(typeof old[k]===typeof s[k])s[k]=old[k];s.price=Math.max(.5,Math.min(5,s.price));s.color=/^#[0-9a-f]{6}$/i.test(s.color)?s.color:'#f3c64e';s.upgrades=(old.upgrades||[]).filter(k=>UPGRADES[k]);const stock=Math.max(0,Math.floor(Number(old.inventory)||0));s.lemons=stock;s.ice=stock;return s;}}
  }catch{/* A missing or damaged save starts a new adventure. */}
  return fresh();
}
const cents=n=>Math.round(n*100)/100;
export function capacity(s,kind){return (s.upgrades.includes(kind==='drinks'?'stand':'cooler')?5:3)+(kind!=='drinks'&&s.upgrades.includes('crates')?4:0);}
export function canAct(s,id,waiting=false){
  if(id==='lemons'||id==='ice')return s[id]<capacity(s,id)&&s.cash>=.25;
  if(id==='mix')return s.lemons>0&&s.ice>0&&s.drinks<capacity(s,'drinks');
  if(id==='serve')return s.drinks>0&&waiting;
  if(id==='cash')return s.pendingCash>0;
  return id==='upgrade';
}
export function transact(s,id,waiting=false){
  if(!canAct(s,id,waiting))return s;
  if(id==='lemons'||id==='ice')return {...s,[id]:s[id]+1,cash:cents(s.cash-.25),totalExpenses:cents(s.totalExpenses+.25)};
  if(id==='mix')return {...s,lemons:s.lemons-1,ice:s.ice-1,drinks:s.drinks+1};
  if(id==='serve'){
    const contribution=cents(s.price*.05);const sold=s.served+1;
    return {...s,drinks:s.drinks-1,served:sold,totalRevenue:cents(s.totalRevenue+s.price),community:cents(s.community+contribution),pendingCash:cents(s.pendingCash+s.price-contribution),history:[...s.history,{day:sold,sold:1,revenue:s.price,contribution}].slice(-50)};
  }
  if(id==='cash')return {...s,cash:cents(s.cash+s.pendingCash),pendingCash:0};
  return s;
}
export function purchase(s,id){const u=UPGRADES[id];if(!u||s.upgrades.includes(id)||s.cash<u.cost)return s;return {...s,cash:cents(s.cash-u.cost),totalExpenses:cents(s.totalExpenses+u.cost),upgrades:[...s.upgrades,id]};}
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
 speed:MOVE_SPEED*(has('shoes')?1.2:1),
 mixSeconds:(has('stand')?.65:1.3)*(has('blender')?.6:1),
 serveSeconds:.75*(has('service')?.55:1),
 spawnSeconds:(has('sign')?4:6)*(has('flyers')?.75:1)*(has('banner')?.7:1)*(1+(s.price-2)*.25),
 patience:65+(has('benches')?35:0)
};}
const PROJECTS=[['A second home',.5],['A village road',1],['Shade trees',2],['A community garden',3],['Another family home',5],['A clean-water well',8],['A village school',12],['A market square',18]];
export function nextProject(s){const n=s.villageLevel||0;return n<PROJECTS.length?{name:PROJECTS[n][0],cost:PROJECTS[n][1]}:{name:n%2?'More trees and gardens':'A new family home',cost:25+(n-8)*5};}
export function developVillage(s){const p=nextProject(s);if(s.community<p.cost)return s;return {...s,community:cents(s.community-p.cost),communityInvested:cents((s.communityInvested||0)+p.cost),villageLevel:(s.villageLevel||0)+1};}
