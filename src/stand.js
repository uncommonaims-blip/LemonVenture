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
  sign:{name:'Street sign',cost:18,description:'Customers arrive more often.'},
  cooler:{name:'Ice cooler',cost:25,description:'Carry 5 of each ingredient.'},
  stand:{name:'Bigger stand',cost:45,description:'Carry 5 drinks and mix twice as fast.'}
};
export function fresh(){return {version:3,cash:40,price:2,name:'My sunny stand',color:'#f3c64e',lemons:0,ice:0,drinks:0,pendingCash:0,upgrades:[],served:0,totalRevenue:0,totalExpenses:0,community:0,history:[]};}
export function restoreWalk(raw,legacy){
  try{
    if(raw){const s=JSON.parse(raw);const numbers=['cash','price','lemons','ice','drinks','pendingCash','served','totalRevenue','totalExpenses','community'];
      if(s.version!==3||!numbers.every(k=>Number.isFinite(s[k])&&s[k]>=0)||s.price<.5||s.price>5||!['lemons','ice','drinks','served'].every(k=>Number.isInteger(s[k]))||!Array.isArray(s.upgrades)||s.upgrades.some(k=>!UPGRADES[k])||typeof s.name!=='string'||!/^#[0-9a-f]{6}$/i.test(s.color)||!Array.isArray(s.history))return fresh();
      return {...s,history:s.history.filter(r=>r&&Number.isFinite(r.revenue)&&Number.isFinite(r.sold)&&Number.isFinite(r.day)).slice(-50)};
    }
    if(legacy){const old=JSON.parse(legacy);if(old.version===1&&Number.isFinite(old.cash)&&old.cash>=0){const s=fresh();for(const k of ['cash','price','name','color','totalRevenue','totalExpenses','community'])if(typeof old[k]===typeof s[k])s[k]=old[k];s.price=Math.max(.5,Math.min(5,s.price));s.color=/^#[0-9a-f]{6}$/i.test(s.color)?s.color:'#f3c64e';s.upgrades=(old.upgrades||[]).filter(k=>UPGRADES[k]);const stock=Math.max(0,Math.floor(Number(old.inventory)||0));s.lemons=stock;s.ice=stock;return s;}}
  }catch{/* A missing or damaged save starts a new adventure. */}
  return fresh();
}
const cents=n=>Math.round(n*100)/100;
export function capacity(s,kind){return s.upgrades.includes(kind==='drinks'?'stand':'cooler')?5:3;}
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
  sample(time){if(this.id===null||time-this.time<180)return {x:0,y:0,active:false};return {...joystickVector(this.px-this.x,this.py-this.y),active:true};}
  end(id){if(this.id===id)this.stop();}
  stop(){this.id=null;this.x=0;this.y=0;this.px=0;this.py=0;this.time=0;}
}
