import {capacity,canAct,transact,effects,willingToPay,upgradeLevel,ingredientCost} from './stand.js?v=9';
const JOBS={runner:{name:'Runner',color:'#71a17a'},chef:{name:'Maker',color:'#bb8bba'},server:{name:'Server',color:'#6b9fb8'},cashier:{name:'Cashier',color:'#d79e61'}};
for(const id of ['runner','chef','server','cashier'])JOBS[id+'2']={...JOBS[id],name:JOBS[id].name+' II'};
export function syncWorkers(state,workers){return Object.entries(JOBS).filter(([id])=>state.upgrades.includes(id)).map(([id,job],i)=>workers.find(w=>w.id===id)||{id,...job,x:210+i*48,y:620,phase:0,progress:0,target:null,mode:'waiting'});}
export function stepWorkers(state,workers,stations,customers,dt){
 let s=state;const events=[];
 for(const w of workers){
  const job=w.id.replace('2',''),training=1+.1*upgradeLevel(s,job+'Training');
  const waiting=customers.find(c=>c.mode!=='leaving');let target=null;
  if(job==='runner'&&(s.cash>=ingredientCost(s)||s.farm?.standStock>0)){if(s.lemons<capacity(s,'lemons')&&(s.lemons<=s.ice||s.ice>=capacity(s,'ice')))target='lemons';else if(s.cash>=ingredientCost(s)&&s.ice<capacity(s,'ice'))target='ice';}
  if(job==='chef'&&canAct(s,'mix'))target='mix';
  if(job==='server'&&waiting&&willingToPay(s,waiting)&&canAct(s,'serve',waiting.mode==='waiting'))target='serve';
  if(job==='cashier'&&canAct(s,'cash'))target='cash';
  if(target!==w.target){w.progress=0;w.target=target;}w.phase+=dt*9;
  if(!target){w.mode='waiting';continue;}
  const station=stations.find(st=>st.id===target);const dx=station.x+18-w.x,dy=station.y-w.y,d=Math.hypot(dx,dy);
  if(d>4){w.x+=dx/d*Math.min(d,150*training*dt);w.y+=dy/d*Math.min(d,150*training*dt);w.mode='walking';w.progress=0;continue;}
  w.mode='waiting';const e=effects(s);const duration=target==='mix'?e.mixSeconds:target==='serve'?e.serveSeconds:e.supplySeconds;w.progress+=dt*training/duration;
  if(w.progress>=1){w.progress=0;const next=transact(s,target,waiting?.mode==='waiting');if(next!==s){s=next;if(target==='serve'){waiting.mode='leaving';waiting.cup=true;}events.push({x:w.x,y:w.y-65,text:target==='serve'?'Served!':target==='mix'?'+1 drink':target==='cash'?'Cash collected!':'+1 '+target});}}
 }
 return {state:s,events};
}
