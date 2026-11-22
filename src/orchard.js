// Orchard simulation uses active play time only. Menus and hidden tabs pause it.
const round=n=>Math.round(n*100)/100;
const whole=(n,max=1e7)=>Number.isFinite(n)?Math.max(0,Math.min(max,Math.floor(n))):0;
export const ROAD=[['Clear rockfalls',25,72],['Repair drainage',75,58],['Stabilize steep sections',200,45],['Bridge the ravine',600,32],['Surface the mountain road',1800,20]];
export function newFarm(){return {trees:[{growth:1,watered:false},{growth:.5,watered:false}],stock:0,standStock:0,road:0,carts:0,irrigation:0,gardeners:0,shipment:null,delivered:0};}
export function restoreFarm(raw){if(!raw||!Array.isArray(raw.trees))return newFarm();const f=newFarm();for(const k of ['stock','standStock','delivered'])f[k]=whole(raw[k]);for(const k of ['road','carts','irrigation','gardeners'])f[k]=whole(raw[k],5);f.trees=raw.trees.slice(0,12).map(t=>({growth:Number.isFinite(t?.growth)?Math.max(0,Math.min(1,t.growth)):0,watered:!!t?.watered}));if(!f.trees.length)f.trees=newFarm().trees;const sh=raw.shipment;if(sh&&Number.isFinite(sh.remaining)&&sh.remaining>0&&Number.isFinite(sh.total)&&sh.total>0&&sh.remaining<=sh.total&&whole(sh.amount)>0)f.shipment={amount:whole(sh.amount),remaining:Math.min(90,sh.remaining),total:Math.min(90,sh.total)};return f;}
export function farmInfo(s){const f=s.farm||newFarm();return {seconds:f.road?ROAD[f.road-1][2]:90,load:12+f.carts*12,yield:4+f.irrigation,growSeconds:60/(1+f.irrigation*.2),ready:f.trees.filter(t=>t.growth>=1).length};}
export function treePosition(i){return {x:180+(i%3)*140,y:300+Math.floor(i/3)*120};}
export function harvest(s,index){const f=s.farm,t=f?.trees[index];if(!t||t.growth<1)return s;return {...s,farm:{...f,trees:f.trees.map((v,i)=>i===index?{growth:0,watered:false}:v),stock:f.stock+farmInfo(s).yield}};}
export function water(s,index){const f=s.farm,t=f?.trees[index];if(!t||t.growth>=1||t.watered)return s;return {...s,farm:{...f,trees:f.trees.map((v,i)=>i===index?{...v,watered:true}:v)}};}
export function dispatch(s){const f=s.farm;if(!f||f.shipment||f.stock<1)return s;const info=farmInfo(s),amount=Math.min(info.load,f.stock);return {...s,farm:{...f,stock:f.stock-amount,shipment:{amount,remaining:info.seconds,total:info.seconds}}};}
export function farmProject(s,id){const f=s.farm,info=farmInfo(s);if(!f)return null;
 if(id==='plant')return {name:'Expand lemon grove',cost:Math.round(35*1.7**(f.trees.length-2)),fund:'cash',done:f.trees.length>=12,description:`Plant tree ${f.trees.length+1}/12. Each harvest yields ${info.yield} lemons.`};
 if(id==='irrigation')return {name:'Irrigation & richer soil',cost:120*3**f.irrigation,fund:'cash',done:f.irrigation>=5,description:'Each level adds 1 lemon per harvest and speeds growth.'};
 if(id==='gardeners')return {name:'Village gardeners',cost:200*3**f.gardeners,fund:'cash',done:f.gardeners>=5,description:'Automatic harvesting capacity: '+(f.gardeners+1)+' trees at once.'};
 if(id==='road'){const p=ROAD[f.road];return {name:p?.[0]||'Mountain road complete',cost:p?.[1]||0,fund:'community',done:!p,description:p?`Delivery ${info.seconds} → ${p[2]} seconds. Community chest pays.`:'All five road sections improved. Deliveries take 20 seconds.'};}
 if(id==='carts')return {name:'Larger delivery cart',cost:150*3**f.carts,fund:'cash',done:f.carts>=5,description:`Shipment capacity ${info.load} → ${info.load+12} lemons. Automatic departures.`};
 return null;
}
export function buyFarmProject(s,id){const p=farmProject(s,id);if(!p||p.done||s[p.fund]<p.cost)return s;const f={...s.farm};if(id==='plant')f.trees=[...f.trees,{growth:0,watered:false}];else f[id]++;const next={...s,[p.fund]:round(s[p.fund]-p.cost),farm:f};if(p.fund==='cash')next.totalExpenses=round(s.totalExpenses+p.cost);else{next.communityInvested=round((s.communityInvested||0)+p.cost);}return next;}
export function stepFarm(s,dt){if(!Number.isFinite(dt)||dt<=0)return s;let f=s.farm||newFarm();const info=farmInfo({...s,farm:f});f={...f,trees:f.trees.map(t=>({...t,growth:Math.min(1,t.growth+dt/info.growSeconds*(t.watered?1.5:1))}))};if(f.shipment){const sh={...f.shipment,remaining:f.shipment.remaining-dt};if(sh.remaining<=0){f.standStock+=sh.amount;f.delivered+=sh.amount;f.shipment=null;}else f.shipment=sh;}
 let next={...s,farm:f};let picked=0;for(let i=0;i<f.trees.length&&picked<f.gardeners;i++)if(next.farm.trees[i].growth>=1){next=harvest(next,i);picked++;}
 if(next.farm.carts>0)next=dispatch(next);return next;
}
export function drawOrchard(c,s,time,player){const f=s.farm,info=farmInfo(s);c.fillStyle='#dce8c7';c.fillRect(0,0,600,800);
 const text=(t,x,y,size=15,color='#34563f')=>{c.font=`700 ${size}px system-ui`;c.textAlign='center';c.fillStyle=color;c.fillText(t,x,y);};
 const oval=(x,y,rx,ry,color)=>{c.fillStyle=color;c.beginPath();c.ellipse(x,y,rx,ry,0,0,7);c.fill();};
 c.fillStyle='#9dab94';c.beginPath();c.moveTo(0,170);c.lineTo(90,35);c.lineTo(160,120);c.lineTo(250,10);c.lineTo(370,150);c.lineTo(480,40);c.lineTo(600,170);c.fill();
 c.fillStyle='#c3cfb5';c.fillRect(0,160,600,75);for(let i=0;i<Math.min(6,1+(s.villageLevel||0));i++){const x=190+i*60;c.fillStyle='#eee1b4';c.fillRect(x,150,32,20);c.fillStyle='#ae8060';c.beginPath();c.moveTo(x-5,150);c.lineTo(x+16,135);c.lineTo(x+37,150);c.fill();c.fillStyle='#8a7957';c.fillRect(x+13,160,7,10);}
 text('THE MASSIF · LEMON GROVES',330,57,22);text(`${f.trees.length}/12 trees · Road ${f.road}/5 · ${info.seconds}s deliveries`,330,82,13);
 const road=(color,width)=>{c.strokeStyle=color;c.lineWidth=width;c.lineCap='round';c.beginPath();c.moveTo(75,795);c.bezierCurveTo(15,655,115,595,65,460);c.bezierCurveTo(15,350,100,290,55,235);c.stroke();};road('#b7ad8c',18+f.road*3);road(f.road>=4?'#d2cfb7':'#c6b48e',12+f.road*3);
 for(let i=f.road;i<5;i++)oval(58+(i%2)*14,290+i*95,10,6,'#8d8e7b');
 if(f.road>=4){c.fillStyle='#927c58';c.fillRect(43,448,43,32);c.strokeStyle='#e5d4ad';c.lineWidth=3;for(let y=450;y<480;y+=8){c.beginPath();c.moveTo(43,y);c.lineTo(86,y);c.stroke();}}
 for(let i=0;i<12;i++){const {x,y}=treePosition(i),t=f.trees[i];oval(x,y,46,26,t?'#c5d6ab':'#d3ddbe');if(!t){text('＋',x,y+5,23,'#9bac8c');continue;}const g=.45+t.growth*.55;c.save();c.translate(x,y-15);c.scale(g,g);c.fillStyle='#a88757';c.fillRect(-6,-50,12,50);oval(-14,-65,28,28,'#78a362');oval(15,-74,30,34,'#69945b');oval(-5,-92,31,24,'#8bb573');if(t.growth>=1){for(let k=0;k<5;k++)oval(-25+k*12,-65-Math.sin(k*2)*22,7,5,'#f5d449');}c.restore();text(t.growth>=1?'HARVEST':t.watered?'WATERED':`${Math.floor(t.growth*100)}% · WATER`,x,y+13,10,t.growth>=1?'#867012':'#547954');}
 c.fillStyle='#b99b72';c.fillRect(240,701,120,48);c.fillStyle='#718c66';c.beginPath();c.moveTo(230,703);c.lineTo(300,677);c.lineTo(370,703);c.fill();text('🍋 '+f.stock+' stored',300,728,16);oval(300,764,51,22,'#fff9df');text('DISPATCH',300,768,11);
 if(f.shipment){const progress=1-f.shipment.remaining/f.shipment.total;const y=770-progress*520,x=65+Math.sin(progress*8)*15;text('🛒',x,y,29);text(f.shipment.amount+'🍋',x,y-24,11);}
 text(f.shipment?`${f.shipment.amount} lemons arrive in ${Math.ceil(f.shipment.remaining)}s`:`Cart ready · ${info.load} lemons / shipment`,325,105,16);text(`${f.standStock} lemons at stand · ${f.delivered} delivered total`,325,129,12);
}
