import {Chiptune} from './music.js?v=10.1';
import {stepFarm,farmInfo,treePosition,harvest,water,dispatch,farmProject,buyFarmProject,drawOrchard} from './orchard.js?v=10.1';
import {KEY,STATIONS,UPGRADES,fresh,restoreWalk,capacity,canAct,transact,purchase,canRestartGrant,FloatingStick,MOVE_SPEED,EDIT_HOLD_MS,getStations,boundPosition,placementAllowed,effects,nextProject,developVillage,LOCATIONS,GAME_DAY_SECONDS,marketInfo,setPrice,moveLocation,advanceClock,willingToPay,setCommunityRate,upgradeLevel,upgradeCost,upgradeAvailable,ingredientCost} from './stand.js?v=10.1';
import {syncWorkers,stepWorkers} from './workers.js?v=10.1';
import {drawVillage} from './village.js?v=10.1';
import {drawSurroundings,drawStorefront,drawSupplyBin,drawMixer,drawRegister,THEMES} from './scenery.js?v=10.1';
const $=id=>document.getElementById(id), money=n=>'$'+n.toFixed(2);
const music=new Chiptune({onStatus:renderMusic});
try{const prefs=JSON.parse(localStorage.getItem('lemonventure.music')||'{}');music.enabled=prefs.enabled!==false;if(Number.isFinite(prefs.volume))music.setVolume(prefs.volume);}catch{/* Use gentle defaults if preferences are unavailable. */}
function renderMusic(){for(const id of ['music-toggle','music-settings-toggle']){$(id).textContent=music.enabled?'♫ Music on':'♫ Music off';$(id).setAttribute('aria-pressed',String(music.enabled));}$('music-note').textContent=music.available?'Original 8-bit melody. Starts after a tap and pauses when you leave the game.':'Audio is unavailable in this browser. The game still works.';}
function saveMusic(){try{localStorage.setItem('lemonventure.music',JSON.stringify({enabled:music.enabled,volume:music.volume}));}catch{/* Audio remains usable without saved preferences. */}}
for(const id of ['music-toggle','music-settings-toggle'])$(id).onclick=()=>{music.setEnabled(!music.enabled);saveMusic();};
$('music-volume').value=Math.round(music.volume*100);
$('music-volume').oninput=e=>{music.setVolume(Number(e.target.value)/100);saveMusic();};
document.addEventListener('pointerdown',()=>void music.unlock(),{passive:true});
document.addEventListener('keydown',()=>void music.unlock());
window.addEventListener('pagehide',()=>music.setPaused(true));
window.addEventListener('pageshow',()=>music.setPaused(manualPause||document.hidden));
renderMusic();

let state;try{state=restoreWalk(localStorage.getItem(KEY),localStorage.getItem('lemonventure.v1'));}catch{state=fresh();}
let stations=getStations(state);let workers=syncWorkers(state,[]);let shopFilter='all',shopPage=0,buildAt=-100000,lastCommunity=state.community;let selectedLocation=state.location,clockTick=0;
let scene='stand',farmPage='groves',farmTarget=null,farmProgress=0;
let editing=false,candidate=null,dragging=null;
const canvas=$('world'),ctx=canvas.getContext('2d'),stick=new FloatingStick(),keys=new Set();
let W=0,H=0,scale=1,ox=0,oy=0,last=0,time=0,spawn=1.5,progress=0,activeStation=null,upgradeLatch=false,manualPause=false,paused=false,saveDirty=false,hudTimer=0,toast='',toastTime=0;
const player={x:300,y:555,phase:0,moving:false};
let customers=[],particles=[],nextId=0;
const colors=['#e68c7c','#7c9fb8','#af8dbe','#e4b857','#74a99d'];
function save(){try{localStorage.setItem(KEY,JSON.stringify(state));saveDirty=false;}catch{$('save-status').textContent='Saving is unavailable in this browser. Keep this tab open to continue.';}}
function changed(){saveDirty=true;if(state.community>lastCommunity){$('community-chest').classList.remove('funded');void $('community-chest').offsetWidth;$('community-chest').classList.add('funded');}lastCommunity=state.community;updateHUD();}
function say(message){toast=message;toastTime=2.8;setTask(message);}
function setTask(message){if($('task').textContent!==message)$('task').textContent=message;}
function updateHUD(){for(const [id,value] of [['cash',money(state.cash)],['pending',money(state.pendingCash)],['served',state.served],['community',money(state.community)]])$(id).textContent=value;$('carry').textContent=scene==='village'?`🍋 ${state.farm.stock} stored · ${state.farm.standStock} at stand`:`🍋 ${state.lemons} · 🧊 ${state.ice} · 🥤 ${state.drinks}`;$('day').textContent=`${LOCATIONS[state.location].icon} ${LOCATIONS[state.location].name} · Day ${state.day} · ${Math.ceil(GAME_DAY_SECONDS-state.dayElapsed)}s`;if(scene==='village')$('day').textContent='🌳 Grove '+state.farm.trees.length+'/12 · Road '+state.farm.road+'/5';const market=marketInfo(state);$('live-price').textContent=money(state.price)+'/cup';$('price-down').disabled=state.price<=.5;$('price-up').disabled=state.price>=20;$('price-outlook').textContent=`Fame ${Math.round(market.notoriety)} · Typical budget ~${money(market.willingness)}`;$('price').value=state.price;$('price-value').textContent=money(state.price);$('grant').hidden=scene==='village'||editing||!canRestartGrant(state);$('community-label').textContent='🏡 Community · '+state.communityRate+'%';$('community-chest').style.setProperty('--fill',Math.min(1,state.community/nextProject(state).cost));}
function resize(){cancelGesture();cancelDrag();const r=canvas.getBoundingClientRect();W=r.width;H=r.height;const dpr=Math.min(2,devicePixelRatio||1);canvas.width=Math.round(W*dpr);canvas.height=Math.round(H*dpr);ctx.setTransform(dpr,0,0,dpr,0,0);scale=Math.min(W/600,(H-62)/800);scale=Math.max(.1,scale);ox=(W-600*scale)/2;oy=36+(H-62-800*scale)/2;}
new ResizeObserver(resize).observe(canvas);
function stopInput(){cancelGesture();stick.stop();keys.clear();player.moving=false;$('stick').classList.remove('active');}
function syncPause(){music.setPaused(manualPause||document.hidden);paused=manualPause||editing||$('panel').open||document.hidden;$('paused').hidden=!manualPause;$('pause').textContent=manualPause?'▶':'Ⅱ';$('pause').setAttribute('aria-pressed',String(manualPause));$('pause').setAttribute('aria-label',manualPause?'Resume game':'Pause game');if(paused)stopInput();}
function localPoint(e){const r=canvas.getBoundingClientRect();return {x:e.clientX-r.left,y:e.clientY-r.top};}
function worldPoint(p){return {x:(p.x-ox)/scale,y:(p.y-oy)/scale};}
function hitStation(p){if(scene==='village')return null;const w=worldPoint(p);return [...stations].reverse().find(s=>Math.abs(w.x-s.x)<Math.max(s.id==='serve'?104:55,24/scale)&&w.y>s.y-(s.id==='serve'?180:150)&&w.y<s.y+36);}
function cancelGesture(){if(candidate)clearTimeout(candidate.timer);candidate=null;}
function cancelDrag(){if(dragging){Object.assign(stations.find(s=>s.id===dragging.id),dragging.original);dragging=null;}}
function beginEdit(id=null,p=null,pointer=null){
 stopInput();editing=true;progress=0;activeStation=null;$('edit-tools').hidden=false;$('price-controls').hidden=true;$('grant').hidden=true;
 if(id&&p){const s=stations.find(s=>s.id===id),w=worldPoint(p);dragging={id,pointer,original:{x:s.x,y:s.y},dx:w.x-s.x,dy:w.y-s.y};}
 syncPause();setTask('Wobble mode: drag any station. Tap Done to play.');
}
function finishEdit(){cancelGesture();cancelDrag();editing=false;$('edit-tools').hidden=true;$('price-controls').hidden=false;state.layout=Object.fromEntries(stations.map(s=>[s.id,{x:s.x,y:s.y}]));changed();save();syncPause();say('Station layout saved.');canvas.focus({preventScroll:true});}
$('edit-done').onclick=finishEdit;
$('edit-reset').onclick=()=>{cancelDrag();stations=STATIONS.map(s=>({...s}));state.layout={};save();setTask('Original layout restored. Drag stations or tap Done.');};
canvas.addEventListener('pointerdown',e=>{
 if(e.button!==0||stick.id!==null||candidate||dragging)return;
 const p=localPoint(e);
 if(editing){const s=hitStation(p);if(s){const w=worldPoint(p);dragging={id:s.id,pointer:e.pointerId,original:{x:s.x,y:s.y},dx:w.x-s.x,dy:w.y-s.y};}else return;}
 else{if(paused)return;const s=hitStation(p);if(s){candidate={id:s.id,pointer:e.pointerId,x:p.x,y:p.y,timer:setTimeout(()=>{if(candidate?.pointer===e.pointerId)beginEdit(s.id,p,e.pointerId);},EDIT_HOLD_MS)};}else stick.start(e.pointerId,p.x,p.y,performance.now());}
 canvas.setPointerCapture(e.pointerId);canvas.focus({preventScroll:true});e.preventDefault();
});
canvas.addEventListener('pointermove',e=>{
 const p=localPoint(e);
 if(editing){if(dragging?.pointer===e.pointerId){const w=worldPoint(p);Object.assign(stations.find(s=>s.id===dragging.id),boundPosition(w.x-dragging.dx,w.y-dragging.dy));}return;}
 if(candidate?.pointer===e.pointerId&&Math.hypot(p.x-candidate.x,p.y-candidate.y)>8){const c=candidate;cancelGesture();stick.start(e.pointerId,c.x,c.y,performance.now()-80);}
 stick.move(e.pointerId,p.x,p.y);
});
function endPointer(e,cancelled=false){
 if(candidate?.pointer===e.pointerId)cancelGesture();
 if(dragging?.pointer===e.pointerId){const s=stations.find(s=>s.id===dragging.id);if(cancelled||!placementAllowed(stations,s.id,s)){Object.assign(s,dragging.original);setTask(cancelled?'Move cancelled. Drag a station or tap Done.':'Keep a little space between stations. Try another spot.');}else{state.layout=Object.fromEntries(stations.map(s=>[s.id,{x:s.x,y:s.y}]));save();setTask('Station moved. Drag another, or tap Done.');}dragging=null;}
 stick.end(e.pointerId);if(stick.id===null)$('stick').classList.remove('active');
}
canvas.addEventListener('pointerup',e=>endPointer(e));
canvas.addEventListener('pointercancel',e=>endPointer(e,true));
canvas.addEventListener('lostpointercapture',e=>endPointer(e,true));
canvas.addEventListener('contextmenu',e=>e.preventDefault());
window.addEventListener('blur',()=>{cancelDrag();stopInput();save();});
document.addEventListener('visibilitychange',()=>{cancelDrag();stopInput();syncPause();if(document.hidden)save();});
window.addEventListener('pagehide',save);
const movementKeys=['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','w','a','s','d','W','A','S','D'];
window.addEventListener('keydown',e=>{if(paused||/INPUT|TEXTAREA|BUTTON/.test(e.target.tagName))return;if(movementKeys.includes(e.key)){keys.add(e.key.toLowerCase());e.preventDefault();}});
window.addEventListener('keyup',e=>keys.delete(e.key.toLowerCase()));
$('pause').onclick=()=>{manualPause=!manualPause;syncPause();};
function selectTab(name){for(const b of document.querySelectorAll('[data-tab]'))b.setAttribute('aria-pressed',String(b.dataset.tab===(name==='farm'?'village':name)));for(const id of ['upgrades','style','results','village','town','farm'])$('tab-'+id).hidden=id!==name;$('panel-title').textContent=name==='farm'?'Village works':'Your stand';if(name==='farm')renderFarm();if(name==='results')renderResults();if(name==='village')renderVillage();if(name==='town'){selectedLocation=state.location;renderTown();}}
function renderPanel(){
 $('name').value=state.name;$('color').value=state.color;$('price').value=state.price;$('price-value').textContent=money(state.price);
 renderShop();
 renderResults();
}
function renderResults(){
 $('results').replaceChildren(...[['Customers served',state.served],['Total sales',money(state.totalRevenue)],['Operating profit',money(state.operatingProfit)],['Community share',state.communityRate+'%'],['Supplies & upgrades',money(state.totalExpenses)],['Awaiting collection',money(state.pendingCash)],['Community chest',money(state.community)],['Invested in village',money(state.communityInvested)],['Village projects',state.villageLevel],['Reputation',Math.round(marketInfo(state).notoriety)+'/100'],['Rent paid',money(state.rentPaid)]].map(([label,value])=>{const p=document.createElement('p'),s=document.createElement('span'),b=document.createElement('strong');s.textContent=label;b.textContent=value;p.append(s,b);return p;}));
}
function renderShop(){
 const items=Object.entries(UPGRADES).filter(([,u])=>shopFilter==='all'||u.category===shopFilter);const pages=Math.max(1,Math.ceil(items.length/3));shopPage=Math.min(shopPage,pages-1);
 $('shop-position').textContent=`${shopPage+1} / ${pages}`;$('shop-prev').disabled=shopPage===0;$('shop-next').disabled=shopPage===pages-1;
 for(const b of document.querySelectorAll('[data-filter]'))b.setAttribute('aria-pressed',String(b.dataset.filter===shopFilter));
 $('upgrades').replaceChildren(...items.slice(shopPage*3,shopPage*3+3).map(([id,u])=>{const row=document.createElement('div');row.className='upgrade';const body=document.createElement('div'),h=document.createElement('h3'),p=document.createElement('p'),b=document.createElement('button');const level=upgradeLevel(state,id),cost=upgradeCost(state,id);h.textContent=u.icon+' '+u.name+(u.maxLevel?' · '+level+'/'+u.maxLevel:'');p.textContent=u.description;body.append(h,p);const owned=level>=(u.maxLevel||1),locked=u.requires&&!state.upgrades.includes(u.requires);if(locked)p.textContent+=' Requires '+UPGRADES[u.requires].name+'.';b.textContent=owned?'✓ Complete':locked?'Locked':money(cost);b.disabled=!upgradeAvailable(state,id)||state.cash<cost;b.setAttribute('aria-label',owned?u.name+' complete':'Buy '+u.name+' for '+money(cost));b.onclick=()=>{const next=purchase(state,id);if(next===state)return;state=next;workers=syncWorkers(state,workers);changed();save();renderPanel();$('shop-message').textContent=u.name+' ready!';};row.append(body,b);return row;}));
 $('shop-cash').textContent=money(state.cash)+' available';
}
for(const b of document.querySelectorAll('[data-filter]'))b.onclick=()=>{shopFilter=b.dataset.filter;shopPage=0;$('shop-message').textContent='';renderShop();};
$('shop-prev').onclick=()=>{shopPage--;renderShop();};$('shop-next').onclick=()=>{shopPage++;renderShop();};
$('shop').onclick=()=>openPanel('upgrades');
$('community-chest').onclick=()=>openPanel('village');
function changePrice(amount){state=setPrice(state,state.price+amount);changed();save();say('Price set to '+money(state.price)+' per cup.');}
$('price-down').onclick=()=>changePrice(-.25);$('price-up').onclick=()=>changePrice(.25);
$('town').onclick=()=>openPanel('town');
function renderTown(){
 const place=LOCATIONS[selectedLocation],current=selectedLocation===state.location,market=marketInfo(state,selectedLocation);
 for(const b of document.querySelectorAll('[data-location]')){b.setAttribute('aria-pressed',String(b.dataset.location===selectedLocation));b.classList.toggle('leased',b.dataset.location===state.location);}
 const preview=$('store-preview'),pc=preview.getContext('2d');pc.clearRect(0,0,preview.width,preview.height);pc.fillStyle=place.color;pc.fillRect(0,0,preview.width,preview.height);drawStorefront(pc,selectedLocation,160,190,state.color,state.price,time,false);$('town-name').textContent=place.icon+' '+place.name;$('town-description').textContent=place.description;
 $('town-economy').textContent=money(place.rent)+'/day · Traffic '+place.traffic.toFixed(2)+'× · Visibility '+place.visibility.toFixed(2)+'×';
 $('town-budgets').textContent='With your reputation: '+market.traffic.toFixed(2)+'× customer exposure · Typical budget ~'+money(market.willingness);
 $('lease').textContent=current?'✓ Current location':place.rent?'Rent here · '+money(place.rent)+' upfront':'Move here · free';$('lease').disabled=current||state.cash<place.rent;
 $('town-note').textContent=current?'Current lease. Next rent in '+Math.ceil(GAME_DAY_SECONDS-state.dayElapsed)+' seconds of active play. No rent while paused or away.':state.cash<place.rent?'You need '+money(place.rent-state.cash)+' more cash to rent here.':'A day is 2 minutes of active play. Rent is paid on moving and each new day. Moving starts a fresh day timer.';
}
for(const b of document.querySelectorAll('[data-location]'))b.onclick=()=>{selectedLocation=b.dataset.location;renderTown();};
$('lease').onclick=()=>{const next=moveLocation(state,selectedLocation);if(next===state)return;state=next;clockTick=0;customers=[];spawn=.5;changed();save();renderTown();say('Welcome to '+LOCATIONS[state.location].name+'!');};
function renderVillage(){const project=nextProject(state);$('community-rate').value=state.communityRate;$('community-rate-value').textContent=state.communityRate+'%';$('village-level').textContent='Village level '+state.villageLevel+' · Fame '+Math.round(marketInfo(state).notoriety);$('village-balance').textContent=money(state.community)+' in your chest';$('invested').textContent=money(state.communityInvested)+' contributed so far';$('project-name').textContent=project.name;$('project-progress').max=project.cost;$('project-progress').value=Math.min(project.cost,state.community);$('project-progress').setAttribute('aria-label',money(state.community)+' saved toward '+project.name+' costing '+money(project.cost));$('build-village').textContent='Contribute '+money(project.cost)+' & build';$('build-village').disabled=state.community<project.cost;$('project-needed').textContent=state.community<project.cost?money(project.cost-state.community)+' more needed from sales':'Your next village upgrade is ready!';$('village-coins').style.height=(15+Math.min(1,state.community/project.cost)*60)+'%';}
$('community-rate').oninput=e=>{state=setCommunityRate(state,Number(e.target.value));changed();save();renderVillage();};
$('build-village').onclick=()=>{const project=nextProject(state),next=developVillage(state);if(next===state)return;state=next;buildAt=performance.now();changed();save();renderVillage();$('village-announcement').textContent=project.name+' built! More people know your stand, and customer budgets have grown.';};
function openPanel(tab='upgrades'){if(editing)finishEdit();stopInput();renderPanel();selectTab(tab);if(!$('panel').open)$('panel').showModal();syncPause();}
$('menu').onclick=()=>openPanel('style');$('close').onclick=()=>$('panel').close();$('panel').addEventListener('close',()=>{syncPause();save();canvas.focus({preventScroll:true});});
for(const b of document.querySelectorAll('[data-tab]'))b.onclick=()=>selectTab(b.dataset.tab);
$('name').onchange=e=>{state.name=e.target.value.trim()||'My sunny stand';changed();save();};$('color').oninput=e=>{state.color=e.target.value;changed();save();};$('price').oninput=e=>{state=setPrice(state,Number(e.target.value));$('price-value').textContent=money(state.price);changed();save();};
$('reset').onclick=()=>{if(confirm('Start a new adventure? This replaces your current walkabout progress.')){state=fresh();scene='stand';music.scene='stand';$('visit-farm').textContent='🌳';$('price-controls').hidden=false;$('farm-tools').hidden=true;$('visit-farm').setAttribute('aria-label','Visit lemon village');stations=getStations(state);workers=[];clockTick=0;selectedLocation='backyard';buildAt=-100000;customers=[];particles=[];player.x=300;player.y=555;spawn=1.5;progress=0;activeStation=null;upgradeLatch=false;changed();save();$('panel').close();say('Fresh start! Walk to the lemon ring.');}};
$('grant').onclick=()=>{if(canRestartGrant(state)){state={...state,cash:state.cash+5};changed();save();say('A $5 practice grant. Keep some cash for ingredients!');}};
function puff(x,y,text,color='#173e35'){particles.push({x,y,text,color,age:0});}
function nextHint(){if(state.drinks>0)return 'Carry your drinks to the SERVE ring.';if(state.pendingCash>=3)return 'Visit CASH to collect your earnings.';if(!state.lemons)return 'Walk to LEMONS. Hold in the ring to collect.';if(!state.ice)return 'Now collect ICE from the blue ring.';return 'Bring lemons + ice to MIX to make lemonade.';}
function stationMessage(id){if(id==='lemons'||id==='ice'){if(state[id]>=capacity(state,id))return 'Your '+id+' bag is full. Head to MIX.';if(id==='lemons'&&state.farm.standStock>0)return 'Collecting village lemons · no purchase cost';if(state.cash<ingredientCost(state))return 'Collect your cash first, or use the practice grant.';return 'Picking up '+id+' · '+money(ingredientCost(state))+' each';}if(id==='mix'){if(state.drinks>=capacity(state,'drinks'))return 'Your tray is full. Head to SERVE.';if(!state.lemons||!state.ice)return 'Mixing needs one lemon + one ice.';return 'Mixing fresh lemonade…';}if(id==='serve')return state.drinks===0?'Bring lemonade from MIX.':customers.some(c=>c.mode==='waiting')?'Serving your customer…':'Waiting for a customer to reach the counter.';if(id==='cash')return state.pendingCash?'Collecting your earnings…':'Cash appears here after you serve a customer.';return 'Visit upgrades to grow your stand.';}
function update(dt,now){
 state=stepFarm(state,dt);time+=dt;if(toastTime>0)toastTime-=dt;clockTick+=dt;if(clockTick>=1){const oldLocation=state.location;state=advanceClock(state,clockTick);clockTick=0;changed();if(oldLocation!==state.location){customers=[];spawn=1;say('Rent was unaffordable. You moved back to free Backyard lane.');save();}}
 let vector=stick.sample(now);$('stick').classList.toggle('active',vector.active);
 if(vector.active){$('stick').style.left=(stick.x-52)+'px';$('stick').style.top=(stick.y-52)+'px';const dx=stick.px-stick.x,dy=stick.py-stick.y,d=Math.hypot(dx,dy),k=d?Math.min(48,d)/d:0;$('knob').style.transform=`translate(${dx*k}px,${dy*k}px)`;}
 let vx=(keys.has('arrowright')||keys.has('d')?1:0)-(keys.has('arrowleft')||keys.has('a')?1:0),vy=(keys.has('arrowdown')||keys.has('s')?1:0)-(keys.has('arrowup')||keys.has('w')?1:0);const len=Math.hypot(vx,vy);if(len){vx/=len;vy/=len;}else{vx=vector.x;vy=vector.y;}
 player.moving=Math.hypot(vx,vy)>.02;
 if(player.moving){const nx=Math.max(26,Math.min(574,player.x+vx*effects(state).speed*dt)),ny=Math.max(245,Math.min(775,player.y+vy*effects(state).speed*dt));player.x=nx;player.y=ny;player.phase+=dt*11;}
 spawn-=dt;const line=customers.filter(c=>c.mode!=='leaving');if(spawn<=0&&line.length<3){customers.push({id:nextId++,x:650,y:378,mode:'arriving',maxPrice:Math.round(marketInfo(state).willingness*(.85+Math.random()*.5)*100)/100,patience:effects(state).patience,maxPatience:effects(state).patience,phase:0,color:colors[nextId%colors.length],cup:false});spawn=effects(state).spawnSeconds;}
 let queue=customers.filter(c=>c.mode!=='leaving');for(const c of customers){c.phase+=dt*8;if(c.mode==='leaving'){c.x+=105*dt;c.y+=30*dt;}else{const serve=stations.find(s=>s.id==='serve'),direction=serve.x>300?-1:1;const slot=queue.indexOf(c),tx=serve.x+direction*(37+slot*64),ty=serve.y-20;const dx=tx-c.x,dy=ty-c.y,d=Math.hypot(dx,dy);if(d>2){c.x+=dx/d*Math.min(d,80*dt);c.y+=dy/d*Math.min(d,80*dt);c.mode='arriving';}else{c.mode='waiting';if(!willingToPay(state,c)){c.mode='leaving';puff(c.x,c.y-70,'Too pricey!','#aa704d');continue;}c.patience-=dt;if(c.patience<=0){c.mode='leaving';puff(c.x,c.y-70,'Maybe next time','#9b6f56');}}}}
 customers=customers.filter(c=>c.x<690);
 if(scene==='village')workOrchard(dt);
 const near=scene==='stand'?stations.find(s=>Math.hypot(s.x-player.x,s.y-player.y)<37):null;if(near?.id!==activeStation){activeStation=near?.id||null;progress=0;}if(activeStation!=='upgrade')upgradeLatch=false;
 const waiting=customers.find(c=>c.mode==='waiting'&&queue.indexOf(c)===0&&willingToPay(state,c));
 if(near&&!player.moving){if(toastTime<=0)setTask(stationMessage(near.id));if(near.id==='upgrade'&&upgradeLatch){progress=0;}else if(canAct(state,near.id,Boolean(waiting))){const duration=near.id==='mix'?effects(state).mixSeconds:near.id==='serve'?effects(state).serveSeconds:near.id==='upgrade'?.7:effects(state).supplySeconds;progress+=dt/duration;if(progress>=1){progress=0;if(near.id==='upgrade'){upgradeLatch=true;openPanel();}else{state=transact(state,near.id,Boolean(waiting));changed();save();if(near.id==='serve'){waiting.mode='leaving';waiting.cup=true;puff(waiting.x,waiting.y-60,'Thank you!','#397c5d');const cashStation=stations.find(s=>s.id==='cash');puff(cashStation.x,cashStation.y-50,'+'+money(state.price));}else if(near.id==='cash')puff(player.x,player.y-70,'Cash collected!');else puff(player.x,player.y-70,near.id==='mix'?'+1 lemonade':'+1 '+near.id);}}}else progress=0;}else{progress=0;if(toastTime<=0&&scene==='stand')setTask(nextHint());}
 const work=stepWorkers(state,workers,stations,customers,dt);if(work.state!==state){state=work.state;changed();save();}for(const event of work.events)puff(event.x,event.y,event.text,'#557e62');
 for(const p of particles){p.age+=dt;p.y-=22*dt;}particles=particles.filter(p=>p.age<1.5);
 hudTimer+=dt;if(hudTimer>2){hudTimer=0;if(saveDirty)save();}
}
function round(x,y,w,h,r,color){ctx.fillStyle=color;ctx.beginPath();ctx.roundRect(x,y,w,h,r);ctx.fill();}
function ellipse(x,y,rx,ry,color){ctx.fillStyle=color;ctx.beginPath();ctx.ellipse(x,y,rx,ry,0,0,Math.PI*2);ctx.fill();}
function text(str,x,y,size=18,color='#173e35',weight=600){ctx.fillStyle=color;ctx.font=`${weight} ${size}px system-ui,sans-serif`;ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(str,x,y);}
function person(p,isPlayer=false){const walking=isPlayer?player.moving:p.mode!=='waiting',bob=walking?Math.sin(p.phase)*2:Math.sin(time*2)*1,step=walking?Math.sin(p.phase)*6:0;ellipse(p.x,p.y+5,17,7,'#173e3523');round(p.x-11,p.y-14+step,8,18,4,'#314b4d');round(p.x+3,p.y-14-step,8,18,4,'#314b4d');round(p.x-17,p.y-46+bob,34,34,11,isPlayer?'#eff5e8':p.color);if(isPlayer){round(p.x-11,p.y-39+bob,22,25,3,'#dba644');round(p.x-6,p.y-28+bob,12,8,2,'#bd8e38');round(p.x-10,p.y-37+bob,3,21,1,'#f7db83');}ellipse(p.x,p.y-57+bob,14,15,'#dca47a');ellipse(p.x,p.y-66+bob,14,7,isPlayer?'#71503a':'#4f4940');if(isPlayer){ellipse(p.x,p.y-71+bob,18,5,'#f1cd65');round(p.x-11,p.y-82+bob,22,12,3,'#f1cd65');}if(p.worker){round(p.x-15,p.y-76+bob,30,9,4,p.color);text(p.name,p.x,p.y+22,10,p.color,800);}round(p.x-20,p.y-39+bob,7,21,4,'#dca47a');round(p.x+13,p.y-39+bob,7,21,4,'#dca47a');ellipse(p.x-5,p.y-57+bob,1.4,1.8,'#3f3c37');ellipse(p.x+5,p.y-57+bob,1.4,1.8,'#3f3c37');if(isPlayer){text('YOU',p.x,p.y+24,11,'#397457',800);const carried=scene==='village'?'':state.drinks>0?'🥤'.repeat(Math.min(3,state.drinks)):(state.lemons||state.ice)?`${state.lemons?'🍋':''}${state.ice?'🧊':''}`:'';if(carried){round(p.x-30,p.y-109,60,25,8,'#fffbea');text(carried,p.x,p.y-97,17);}}else if(p.cup)text('🥤',p.x+23,p.y-29+bob,24);else if(!p.worker&&p.mode==='waiting'){round(p.x-20,p.y-90,40,7,4,'#c0cdb3');round(p.x-20,p.y-90,40*Math.max(0,p.patience/(p.maxPatience||65)),7,4,p.patience>20?'#62a17b':'#df9c63');text('🥤',p.x,p.y-112,24);}}
function station(s){const near=activeStation===s.id;ellipse(s.x,s.y+5,44,27,'#173e3510');ellipse(s.x,s.y,42,27,near?'#fff9df':'#fff9df99');ctx.strokeStyle=s.color;ctx.lineWidth=near?4:2;ctx.setLineDash([7,5]);ctx.beginPath();ctx.ellipse(s.x,s.y,42,27,0,0,Math.PI*2);ctx.stroke();ctx.setLineDash([]);text(s.label,s.x,s.y,12,s.color,800);if(near&&progress>0){ctx.strokeStyle='#fffdf3';ctx.lineWidth=6;ctx.beginPath();ctx.arc(s.x,s.y-10,36,-Math.PI/2,-Math.PI/2+Math.PI*2*progress);ctx.stroke();}}
function draw(){
 ctx.clearRect(0,0,W,H);ctx.fillStyle=LOCATIONS[state.location].color;ctx.fillRect(0,0,W,H);ctx.save();ctx.translate(ox,oy);ctx.scale(scale,scale);
 if(scene==='village'){drawOrchard(ctx,state,time,player);person(player,true);ctx.restore();return;}
 // Layered location scenery stays lightweight and contains no external textures.
 drawSurroundings(ctx,state.location,time);
 // Garden details, a warm tiled courtyard, and the customer path.
 for(let i=0;i<14;i++){ellipse(18+(i*131)%570,80+(i*173)%680,3,7,'#b8cda4');}
 round(24,220,552,566,36,'#d0dcb5');round(34,230,532,546,28,THEMES[state.location].floor);
 ctx.strokeStyle=THEMES[state.location].grout;ctx.lineWidth=1;for(let y=250;y<770;y+=52){ctx.beginPath();ctx.moveTo(45,y);ctx.lineTo(555,y);ctx.stroke();}for(let x=64;x<560;x+=58){ctx.beginPath();ctx.moveTo(x,240);ctx.lineTo(x,765);ctx.stroke();}
 const servePad=stations.find(s=>s.id==='serve');const pathX=servePad.x>300?0:servePad.x+35;round(pathX,servePad.y-60,servePad.x>300?servePad.x+20:625-pathX,76,20,'#d4dcc2');
 // Title and garden backdrop.
 const title=state.name.length>25?state.name.slice(0,24)+'…':state.name;text(title,300,65,30,'#284c3d',750);text('YOUR VILLAGE · '+state.villageLevel+' PROJECTS FUNDED',300,102,12,'#6d835e',700);drawVillage(ctx,150,109,300,100,state.villageLevel,(performance.now()-buildAt)/1000);
 for(const x of [42,558]){round(x-17,180,34,32,6,'#b78056');ellipse(x,167,31,35,'#80a266');ellipse(x-14,156,20,20,'#91b174');ellipse(x+13,155,22,25,'#75955d');text('🍋',x,170,22);}
 for(const s of stations){
 const base=STATIONS.find(b=>b.id===s.id);ctx.save();
 ctx.translate(s.x,s.y);if(editing)ctx.rotate(Math.sin(performance.now()/115+STATIONS.indexOf(base))*0.025);ctx.translate(-base.x,-base.y);
 if(s.id==='lemons'||s.id==='ice'){drawSupplyBin(ctx,base.x,base.y,s.id,s.id==='lemons'&&state.farm.standStock>0?0:ingredientCost(state));}
 else if(s.id==='mix'){drawMixer(ctx,base.x,base.y,time,activeStation==='mix'&&progress>0,state.upgrades.includes('blender'));}
 else if(s.id==='cash'){drawRegister(ctx,base.x,base.y,state.pendingCash);}
 else if(s.id==='serve'){drawStorefront(ctx,state.location,base.x,base.y,state.color,state.price,time,state.upgrades.includes('stand'));}
 else if(s.id==='upgrade'){round(240,649,120,42,10,'#9075ab');round(244,647,112,34,9,'#b39cc6');text('⬆ UPGRADES',300,666,14,'#fffdf6');}
 station({...s,x:base.x,y:base.y});
 if(editing){ctx.strokeStyle=placementAllowed(stations,s.id,s)?'#a37db6':'#c85d4c';ctx.lineWidth=3;ctx.setLineDash([8,5]);ctx.strokeRect(base.x-(s.id==='serve'?104:58),base.y-(s.id==='serve'?180:150),s.id==='serve'?208:116,s.id==='serve'?213:183);ctx.setLineDash([]);text('✥',base.x+49,base.y-115,20,'#8e66a2');}
 ctx.restore();
 }
 if(state.upgrades.includes('flowers'))for(const x of [15,585])for(let i=0;i<5;i++){ellipse(x,480+i*30,7,7,i%2?'#e8a6a6':'#c4a4d1');ellipse(x,480+i*30,2,2,'#ffe0a1');}
 if(state.upgrades.includes('lights')){ctx.strokeStyle='#867c58';ctx.beginPath();ctx.moveTo(30,214);ctx.quadraticCurveTo(300,260,570,214);ctx.stroke();for(let i=0;i<15;i++)ellipse(30+i*38,214+Math.sin(i/14*Math.PI)*22,4,6,Math.sin(time*2+i)>0?'#fff2b0':'#d6af65');}
 if(state.upgrades.includes('fountain')){ellipse(5,686,27,12,'#aaa88d');ellipse(5,682,24,9,'#8dc5cf');for(let i=0;i<5;i++)ellipse(5+Math.sin(time*3+i)*14,655+Math.cos(time*3+i)*15,2,4,'#d2eff0');}
 if(state.upgrades.includes('gold')){round(561,705,30,30,3,'#a08f65');text('🏆',576,687,40);}
 // Characters are depth-sorted for a coherent little world.
 const people=[...customers,...workers.map(w=>({...w,worker:true})),{...player,isPlayer:true}].sort((a,b)=>a.y-b.y);for(const p of people)person(p,Boolean(p.isPlayer));
 for(const p of particles){ctx.globalAlpha=Math.max(0,1-p.age/1.5);text(p.text,p.x,p.y,16,p.color,800);}ctx.globalAlpha=1;
 ctx.restore();
}
function frame(now){const dt=Math.min(.04,(now-(last||now))/1000);last=now;if(!paused)update(dt,now);draw();if($('panel').open&&!$('tab-village').hidden){const preview=$('village-preview');preview.getContext('2d').clearRect(0,0,preview.width,preview.height);drawVillage(preview.getContext('2d'),0,0,preview.width,preview.height,state.villageLevel,(now-buildAt)/1000);}requestAnimationFrame(frame);}
updateHUD();resize();syncPause();requestAnimationFrame(frame);

function switchScene(){if(editing)finishEdit();stopInput();scene=scene==='stand'?'village':'stand';music.scene=scene;farmTarget=null;farmProgress=0;progress=0;activeStation=null;player.x=300;player.y=scene==='village'?750:555;$('visit-farm').textContent=scene==='village'?'🥤':'🌳';$('play-hint').textContent=scene==='village'?'Hold + drag to walk · Stand in tree rings to water or harvest':'Hold + drag to walk · Hold a station to rearrange';$('visit-farm').setAttribute('aria-label',scene==='village'?'Return to lemonade stand':'Visit lemon village');$('price-controls').hidden=scene==='village';$('farm-tools').hidden=scene!=='village';$('grant').hidden=scene==='village'||!canRestartGrant(state);canvas.setAttribute('aria-label',scene==='village'?'Lemon village. Hold and drag to move. Stand in tree rings to water or harvest; stand at the shed to dispatch.':'Lemonade stand play area. Hold and drag to move.');changed();save();say(scene==='village'?'Walk to a tree ring to harvest or water. Visit the shed to dispatch.':'Back at your lemonade stand.');canvas.focus({preventScroll:true});}
$('visit-farm').onclick=switchScene;
$('village-explore').onclick=()=>{$('panel').close();if(scene!=='village')switchScene();};
$('farm-manage').onclick=()=>openPanel('farm');
$('farm-manage-village').onclick=()=>openPanel('farm');
$('farm-return').onclick=()=>{selectTab('village');};
for(const b of document.querySelectorAll('[data-farm-page]'))b.onclick=()=>{farmPage=b.dataset.farmPage;renderFarm();};
function workOrchard(dt){const tree=state.farm.trees.findIndex((t,i)=>{const p=treePosition(i);return Math.hypot(player.x-p.x,player.y-p.y)<35;});const atShed=Math.hypot(player.x-300,player.y-764)<38;const target=tree>=0?'tree'+tree:atShed?'shed':null;if(target!==farmTarget){farmTarget=target;farmProgress=0;}if(player.moving||!target){farmProgress=0;if(toastTime<=0)setTask('Tree rings: water / harvest · Shed: dispatch · Village works: expand & repair');return;}farmProgress+=dt;if(farmProgress<1)return;farmProgress=0;const old=state;if(tree>=0){state=state.farm.trees[tree].growth>=1?harvest(state,tree):water(state,tree);if(state!==old)say(state.farm.stock>old.farm.stock?'Harvested '+farmInfo(state).yield+' lemons!':'Tree watered. Growth boosted 50%.');else if(toastTime<=0)setTask('This tree is growing. Try another ring.');}else{state=dispatch(state);if(state!==old)say('Lemons dispatched! Delivery takes '+farmInfo(state).seconds+' seconds.');else if(toastTime<=0)setTask(state.farm.shipment?'Your cart is on the mountain road.':'Harvest ripe trees to fill the shed.');}if(state!==old){changed();save();}}
function renderFarm(){const f=state.farm,info=farmInfo(state);for(const b of document.querySelectorAll('[data-farm-page]'))b.setAttribute('aria-pressed',String(b.dataset.farmPage===farmPage));$('farm-stats').textContent=`${f.trees.length}/12 trees · ${info.ready} ripe · ${f.stock} stored · ${f.standStock} at stand`;$('farm-delivery').textContent=f.shipment?`${f.shipment.amount} lemons in transit · ${Math.ceil(f.shipment.remaining)}s remaining`:`Road ${f.road}/5 · ${info.seconds}s delivery · ${info.load} lemons per cart`;$('farm-funds').textContent=money(state.cash)+' cash · '+money(state.community)+' community chest';const ids=farmPage==='groves'?['plant','irrigation','gardeners']:farmPage==='road'?['road']:['carts'];$('farm-projects').replaceChildren(...ids.map(id=>{const p=farmProject(state,id),row=document.createElement('div'),body=document.createElement('div'),title=document.createElement('h3'),desc=document.createElement('p'),button=document.createElement('button');row.className='upgrade';title.textContent=p.name;desc.textContent=p.description;button.textContent=p.done?'✓ Complete':money(p.cost);button.disabled=p.done||state[p.fund]<p.cost;button.setAttribute('aria-label','Build '+p.name+' for '+money(p.cost)+' from '+p.fund);button.onclick=()=>{const next=buyFarmProject(state,id);if(next===state)return;state=next;changed();save();renderFarm();$('farm-notice').textContent=p.name+' completed!';};body.append(title,desc);row.append(body,button);return row;}));$('farm-harvest').disabled=!info.ready;$('farm-dispatch').disabled=!f.stock||!!f.shipment;}
$('farm-harvest').onclick=()=>{for(let i=0;i<state.farm.trees.length;i++)state=harvest(state,i);changed();save();renderFarm();$('farm-notice').textContent='Ripe trees harvested into the village shed.';};
$('farm-dispatch').onclick=()=>{state=dispatch(state);changed();save();renderFarm();$('farm-notice').textContent='Shipment on the mountain road. Return to play to advance time.';};
