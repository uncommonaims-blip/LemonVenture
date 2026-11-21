import {KEY,STATIONS,UPGRADES,fresh,restoreWalk,capacity,canAct,transact,purchase,canRestartGrant,FloatingStick,MOVE_SPEED,EDIT_HOLD_MS,getStations,boundPosition,placementAllowed} from './stand.js';
const $=id=>document.getElementById(id), money=n=>'$'+n.toFixed(2);
let state;try{state=restoreWalk(localStorage.getItem(KEY),localStorage.getItem('lemonventure.v1'));}catch{state=fresh();}
let stations=getStations(state);
let editing=false,candidate=null,dragging=null;
const canvas=$('world'),ctx=canvas.getContext('2d'),stick=new FloatingStick(),keys=new Set();
let W=0,H=0,scale=1,ox=0,oy=0,last=0,time=0,spawn=1.5,progress=0,activeStation=null,upgradeLatch=false,manualPause=false,paused=false,saveDirty=false,hudTimer=0,toast='',toastTime=0;
const player={x:300,y:555,phase:0,moving:false};
let customers=[],particles=[],nextId=0;
const colors=['#e68c7c','#7c9fb8','#af8dbe','#e4b857','#74a99d'];
function save(){try{localStorage.setItem(KEY,JSON.stringify(state));saveDirty=false;}catch{$('save-status').textContent='Saving is unavailable in this browser. Keep this tab open to continue.';}}
function changed(){saveDirty=true;updateHUD();}
function say(message){toast=message;toastTime=2.8;setTask(message);}
function setTask(message){if($('task').textContent!==message)$('task').textContent=message;}
function updateHUD(){for(const [id,value] of [['cash',money(state.cash)],['pending',money(state.pendingCash)],['served',state.served],['community',money(state.community)]])$(id).textContent=value;$('carry').textContent=`🍋 ${state.lemons} · 🧊 ${state.ice} · 🥤 ${state.drinks}`;$('day').textContent=`☀ Day ${1+Math.floor(state.served/10)}`;$('grant').hidden=!canRestartGrant(state);}
function resize(){cancelGesture();cancelDrag();const r=canvas.getBoundingClientRect();W=r.width;H=r.height;const dpr=Math.min(2,devicePixelRatio||1);canvas.width=Math.round(W*dpr);canvas.height=Math.round(H*dpr);ctx.setTransform(dpr,0,0,dpr,0,0);scale=Math.min(W/600,(H-62)/800);scale=Math.max(.1,scale);ox=(W-600*scale)/2;oy=36+(H-62-800*scale)/2;}
new ResizeObserver(resize).observe(canvas);
function stopInput(){cancelGesture();stick.stop();keys.clear();player.moving=false;$('stick').classList.remove('active');}
function syncPause(){paused=manualPause||editing||$('panel').open||document.hidden;$('paused').hidden=!manualPause;$('pause').textContent=manualPause?'▶':'Ⅱ';$('pause').setAttribute('aria-pressed',String(manualPause));$('pause').setAttribute('aria-label',manualPause?'Resume game':'Pause game');if(paused)stopInput();}
function localPoint(e){const r=canvas.getBoundingClientRect();return {x:e.clientX-r.left,y:e.clientY-r.top};}
function worldPoint(p){return {x:(p.x-ox)/scale,y:(p.y-oy)/scale};}
function hitStation(p){const w=worldPoint(p);return [...stations].reverse().find(s=>Math.abs(w.x-s.x)<Math.max(55,24/scale)&&w.y>s.y-120&&w.y<s.y+36);}
function cancelGesture(){if(candidate)clearTimeout(candidate.timer);candidate=null;}
function cancelDrag(){if(dragging){Object.assign(stations.find(s=>s.id===dragging.id),dragging.original);dragging=null;}}
function beginEdit(id=null,p=null,pointer=null){
 stopInput();editing=true;progress=0;activeStation=null;$('edit-tools').hidden=false;$('grant').hidden=true;
 if(id&&p){const s=stations.find(s=>s.id===id),w=worldPoint(p);dragging={id,pointer,original:{x:s.x,y:s.y},dx:w.x-s.x,dy:w.y-s.y};}
 syncPause();setTask('Wobble mode: drag any station. Tap Done to play.');
}
function finishEdit(){cancelGesture();cancelDrag();editing=false;$('edit-tools').hidden=true;state.layout=Object.fromEntries(stations.map(s=>[s.id,{x:s.x,y:s.y}]));changed();save();syncPause();say('Station layout saved.');canvas.focus({preventScroll:true});}
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
function selectTab(name){for(const b of document.querySelectorAll('[data-tab]'))b.setAttribute('aria-pressed',String(b.dataset.tab===name));for(const id of ['upgrades','style','results'])$('tab-'+id).hidden=id!==name;}
function renderPanel(){
 $('name').value=state.name;$('color').value=state.color;$('price').value=state.price;$('price-value').textContent=money(state.price);
 $('upgrades').replaceChildren(...Object.entries(UPGRADES).map(([id,u])=>{const row=document.createElement('div');row.className='upgrade';const body=document.createElement('div'),h=document.createElement('h3'),p=document.createElement('p'),b=document.createElement('button');h.textContent=u.name;p.textContent=u.description;body.append(h,p);const owned=state.upgrades.includes(id);b.textContent=owned?'✓ Owned':money(u.cost);b.disabled=owned||state.cash<u.cost;b.onclick=()=>{state=purchase(state,id);changed();save();renderPanel();};row.append(body,b);return row;}));
 $('results').replaceChildren(...[['Customers served',state.served],['Total sales',money(state.totalRevenue)],['Supplies & upgrades',money(state.totalExpenses)],['Awaiting collection',money(state.pendingCash)],['Community fund',money(state.community)]].map(([label,value])=>{const p=document.createElement('p'),s=document.createElement('span'),b=document.createElement('strong');s.textContent=label;b.textContent=value;p.append(s,b);return p;}));
}
function openPanel(tab='upgrades'){if(editing)finishEdit();stopInput();renderPanel();selectTab(tab);if(!$('panel').open)$('panel').showModal();syncPause();}
$('menu').onclick=()=>openPanel('style');$('close').onclick=()=>$('panel').close();$('panel').addEventListener('close',()=>{syncPause();save();canvas.focus({preventScroll:true});});
for(const b of document.querySelectorAll('[data-tab]'))b.onclick=()=>selectTab(b.dataset.tab);
$('name').onchange=e=>{state.name=e.target.value.trim()||'My sunny stand';changed();save();};$('color').oninput=e=>{state.color=e.target.value;changed();save();};$('price').oninput=e=>{state.price=Number(e.target.value);$('price-value').textContent=money(state.price);changed();save();};
$('reset').onclick=()=>{if(confirm('Start a new adventure? This replaces your current walkabout progress.')){state=fresh();stations=getStations(state);customers=[];particles=[];player.x=300;player.y=555;spawn=1.5;progress=0;activeStation=null;upgradeLatch=false;changed();save();$('panel').close();say('Fresh start! Walk to the lemon ring.');}};
$('grant').onclick=()=>{if(canRestartGrant(state)){state={...state,cash:state.cash+5};changed();save();say('A $5 practice grant. Keep some cash for ingredients!');}};
function puff(x,y,text,color='#173e35'){particles.push({x,y,text,color,age:0});}
function nextHint(){if(state.drinks>0)return 'Carry your drinks to the SERVE ring.';if(state.pendingCash>=3)return 'Visit CASH to collect your earnings.';if(!state.lemons)return 'Walk to LEMONS. Hold in the ring to collect.';if(!state.ice)return 'Now collect ICE from the blue ring.';return 'Bring lemons + ice to MIX to make lemonade.';}
function stationMessage(id){if(id==='lemons'||id==='ice'){if(state[id]>=capacity(state,id))return 'Your '+id+' bag is full. Head to MIX.';if(state.cash<.25)return 'Collect your cash first, or use the practice grant.';return 'Picking up '+id+' · $0.25 each';}if(id==='mix'){if(state.drinks>=capacity(state,'drinks'))return 'Your tray is full. Head to SERVE.';if(!state.lemons||!state.ice)return 'Mixing needs one lemon + one ice.';return 'Mixing fresh lemonade…';}if(id==='serve')return state.drinks===0?'Bring lemonade from MIX.':customers.some(c=>c.mode==='waiting')?'Serving your customer…':'Waiting for a customer to reach the counter.';if(id==='cash')return state.pendingCash?'Collecting your earnings…':'Cash appears here after you serve a customer.';return 'Visit upgrades to grow your stand.';}
function update(dt,now){
 time+=dt;if(toastTime>0)toastTime-=dt;
 let vector=stick.sample(now);$('stick').classList.toggle('active',vector.active);
 if(vector.active){$('stick').style.left=(stick.x-52)+'px';$('stick').style.top=(stick.y-52)+'px';const dx=stick.px-stick.x,dy=stick.py-stick.y,d=Math.hypot(dx,dy),k=d?Math.min(48,d)/d:0;$('knob').style.transform=`translate(${dx*k}px,${dy*k}px)`;}
 let vx=(keys.has('arrowright')||keys.has('d')?1:0)-(keys.has('arrowleft')||keys.has('a')?1:0),vy=(keys.has('arrowdown')||keys.has('s')?1:0)-(keys.has('arrowup')||keys.has('w')?1:0);const len=Math.hypot(vx,vy);if(len){vx/=len;vy/=len;}else{vx=vector.x;vy=vector.y;}
 player.moving=Math.hypot(vx,vy)>.02;
 if(player.moving){const nx=Math.max(26,Math.min(574,player.x+vx*MOVE_SPEED*dt)),ny=Math.max(245,Math.min(775,player.y+vy*MOVE_SPEED*dt));player.x=nx;player.y=ny;player.phase+=dt*11;}
 spawn-=dt;const line=customers.filter(c=>c.mode!=='leaving');if(spawn<=0&&line.length<3){customers.push({id:nextId++,x:650,y:378,mode:'arriving',patience:65,phase:0,color:colors[nextId%colors.length],cup:false});spawn=(state.upgrades.includes('sign')?4:6)*(1+(state.price-2)*.25);}
 let queue=customers.filter(c=>c.mode!=='leaving');for(const c of customers){c.phase+=dt*8;if(c.mode==='leaving'){c.x+=105*dt;c.y+=30*dt;}else{const serve=stations.find(s=>s.id==='serve'),direction=serve.x>300?-1:1;const slot=queue.indexOf(c),tx=serve.x+direction*(37+slot*64),ty=serve.y-20;const dx=tx-c.x,dy=ty-c.y,d=Math.hypot(dx,dy);if(d>2){c.x+=dx/d*Math.min(d,80*dt);c.y+=dy/d*Math.min(d,80*dt);c.mode='arriving';}else{c.mode='waiting';c.patience-=dt;if(c.patience<=0){c.mode='leaving';puff(c.x,c.y-70,'Maybe next time','#9b6f56');}}}}
 customers=customers.filter(c=>c.x<690);
 const near=stations.find(s=>Math.hypot(s.x-player.x,s.y-player.y)<37);if(near?.id!==activeStation){activeStation=near?.id||null;progress=0;}if(activeStation!=='upgrade')upgradeLatch=false;
 const waiting=customers.find(c=>c.mode==='waiting'&&queue.indexOf(c)===0);
 if(near&&!player.moving){if(toastTime<=0)setTask(stationMessage(near.id));if(near.id==='upgrade'&&upgradeLatch){progress=0;}else if(canAct(state,near.id,Boolean(waiting))){const duration=near.id==='mix'?(state.upgrades.includes('stand')?.65:1.3):near.id==='serve'?.75:near.id==='upgrade'?.7:.6;progress+=dt/duration;if(progress>=1){progress=0;if(near.id==='upgrade'){upgradeLatch=true;openPanel();}else{state=transact(state,near.id,Boolean(waiting));changed();save();if(near.id==='serve'){waiting.mode='leaving';waiting.cup=true;puff(waiting.x,waiting.y-60,'Thank you!','#397c5d');const cashStation=stations.find(s=>s.id==='cash');puff(cashStation.x,cashStation.y-50,'+'+money(state.price));}else if(near.id==='cash')puff(player.x,player.y-70,'Cash collected!');else puff(player.x,player.y-70,near.id==='mix'?'+1 lemonade':'+1 '+near.id);}}}else progress=0;}else{progress=0;if(toastTime<=0)setTask(nextHint());}
 for(const p of particles){p.age+=dt;p.y-=22*dt;}particles=particles.filter(p=>p.age<1.5);
 hudTimer+=dt;if(hudTimer>2){hudTimer=0;if(saveDirty)save();}
}
function round(x,y,w,h,r,color){ctx.fillStyle=color;ctx.beginPath();ctx.roundRect(x,y,w,h,r);ctx.fill();}
function ellipse(x,y,rx,ry,color){ctx.fillStyle=color;ctx.beginPath();ctx.ellipse(x,y,rx,ry,0,0,Math.PI*2);ctx.fill();}
function text(str,x,y,size=18,color='#173e35',weight=600){ctx.fillStyle=color;ctx.font=`${weight} ${size}px system-ui,sans-serif`;ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(str,x,y);}
function person(p,isPlayer=false){const walking=isPlayer?player.moving:p.mode!=='waiting',bob=walking?Math.sin(p.phase)*2:Math.sin(time*2)*1,step=walking?Math.sin(p.phase)*6:0;ellipse(p.x,p.y+5,17,7,'#173e3523');round(p.x-11,p.y-14+step,8,18,4,'#314b4d');round(p.x+3,p.y-14-step,8,18,4,'#314b4d');round(p.x-17,p.y-46+bob,34,34,11,isPlayer?'#eff5e8':p.color);if(isPlayer)round(p.x-11,p.y-39+bob,22,25,3,'#dba644');ellipse(p.x,p.y-57+bob,14,15,'#dca47a');ellipse(p.x,p.y-66+bob,14,7,isPlayer?'#71503a':'#4f4940');if(isPlayer){ellipse(p.x,p.y-71+bob,18,5,'#f1cd65');round(p.x-11,p.y-82+bob,22,12,3,'#f1cd65');}round(p.x-20,p.y-39+bob,7,21,4,'#dca47a');round(p.x+13,p.y-39+bob,7,21,4,'#dca47a');ellipse(p.x-5,p.y-57+bob,1.4,1.8,'#3f3c37');ellipse(p.x+5,p.y-57+bob,1.4,1.8,'#3f3c37');if(isPlayer){text('YOU',p.x,p.y+24,11,'#397457',800);const carried=state.drinks>0?'🥤'.repeat(Math.min(3,state.drinks)):(state.lemons||state.ice)?`${state.lemons?'🍋':''}${state.ice?'🧊':''}`:'';if(carried){round(p.x-30,p.y-109,60,25,8,'#fffbea');text(carried,p.x,p.y-97,17);}}else if(p.cup)text('🥤',p.x+23,p.y-29+bob,24);else if(p.mode==='waiting'){round(p.x-20,p.y-90,40,7,4,'#c0cdb3');round(p.x-20,p.y-90,40*Math.max(0,p.patience/65),7,4,p.patience>20?'#62a17b':'#df9c63');text('🥤',p.x,p.y-112,24);}}
function station(s){const near=activeStation===s.id;ellipse(s.x,s.y+5,44,27,'#173e3510');ellipse(s.x,s.y,42,27,near?'#fff9df':'#fff9df99');ctx.strokeStyle=s.color;ctx.lineWidth=near?4:2;ctx.setLineDash([7,5]);ctx.beginPath();ctx.ellipse(s.x,s.y,42,27,0,0,Math.PI*2);ctx.stroke();ctx.setLineDash([]);text(s.label,s.x,s.y,12,s.color,800);if(near&&progress>0){ctx.strokeStyle='#fffdf3';ctx.lineWidth=6;ctx.beginPath();ctx.arc(s.x,s.y-10,36,-Math.PI/2,-Math.PI/2+Math.PI*2*progress);ctx.stroke();}}
function draw(){
 ctx.clearRect(0,0,W,H);ctx.fillStyle='#dce9ce';ctx.fillRect(0,0,W,H);ctx.save();ctx.translate(ox,oy);ctx.scale(scale,scale);
 // Garden details, a warm tiled courtyard, and the customer path.
 for(let i=0;i<14;i++){ellipse(18+(i*131)%570,80+(i*173)%680,3,7,'#b8cda4');}
 round(24,220,552,566,36,'#d0dcb5');round(34,230,532,546,28,'#ece4cd');
 ctx.strokeStyle='#d8d1ba';ctx.lineWidth=1;for(let y=250;y<770;y+=52){ctx.beginPath();ctx.moveTo(45,y);ctx.lineTo(555,y);ctx.stroke();}for(let x=64;x<560;x+=58){ctx.beginPath();ctx.moveTo(x,240);ctx.lineTo(x,765);ctx.stroke();}
 const servePad=stations.find(s=>s.id==='serve');const pathX=servePad.x>300?0:servePad.x+35;round(pathX,servePad.y-60,servePad.x>300?servePad.x+20:625-pathX,76,20,'#d4dcc2');
 // Title and garden backdrop.
 const title=state.name.length>25?state.name.slice(0,24)+'…':state.name;text(title,300,65,30,'#284c3d',750);text('A LITTLE STAND. A BIG ADVENTURE.',300,104,12,'#6d835e',700);
 for(const x of [42,558]){round(x-17,180,34,32,6,'#b78056');ellipse(x,167,31,35,'#80a266');ellipse(x-14,156,20,20,'#91b174');ellipse(x+13,155,22,25,'#75955d');text('🍋',x,170,22);}
 for(const s of stations){
 const base=STATIONS.find(b=>b.id===s.id);ctx.save();
 ctx.translate(s.x,s.y);if(editing)ctx.rotate(Math.sin(performance.now()/115+STATIONS.indexOf(base))*0.025);ctx.translate(-base.x,-base.y);
 if(s.id==='lemons'){
 round(46,171,88,62,10,'#ac8551');round(42,163,96,43,9,'#edc65b');text('🍋 🍋',90,184,25);text('$0.25',90,218,14,'#fff9db');
 }
 else if(s.id==='ice'){
 round(466,171,88,62,10,'#6c9fae');round(462,163,96,43,9,'#b5e1e6');text('🧊 🧊',510,184,25);text('$0.25',510,218,14,'#effcff');
 }
 else if(s.id==='mix'){
 round(44,460,92,58,9,'#ae8258');round(38,449,104,40,9,'#dbb587');text('🍹',90+Math.sin(time*9)*(activeStation==='mix'&&progress>0?3:0),464,34);text('LEMON + ICE',90,508,10,'#fff9df');
 }
 else if(s.id==='cash'){
 round(466,460,88,58,9,'#709563');round(460,449,100,40,9,'#a4bd7e');text(state.pendingCash>0?'💵':'💰',510,466,30);if(state.pendingCash>0){round(470,419,80,24,8,'#fff9df');text(money(state.pendingCash),510,431,14,'#4a8052');}
 }
 else if(s.id==='serve'){
 round(222,273,156,61,10,'#ac7b4d');round(214,266,172,32,8,state.color);for(let i=0;i<6;i++)if(i%2===0)round(214+i*28,266,28,30,2,'#fff5d4');round(229,298,142,35,5,'#f5df99');text('LEMONADE',300,313,15);text('🥤',253,253,29);text(money(state.price),345,253,16);
 }
 else if(s.id==='upgrade'){
 round(242,650,116,38,12,'#b39cc6');text('⬆ UPGRADES',300,669,14,'#fffdf6');
 }
 station({...s,x:base.x,y:base.y});
 if(editing){ctx.strokeStyle=placementAllowed(stations,s.id,s)?'#a37db6':'#c85d4c';ctx.lineWidth=3;ctx.setLineDash([8,5]);ctx.strokeRect(base.x-58,base.y-124,116,157);ctx.setLineDash([]);text('✥',base.x+49,base.y-115,20,'#8e66a2');}
 ctx.restore();
 }
 // Characters are depth-sorted for a coherent little world.
 const people=[...customers,{...player,isPlayer:true}].sort((a,b)=>a.y-b.y);for(const p of people)person(p,Boolean(p.isPlayer));
 for(const p of particles){ctx.globalAlpha=Math.max(0,1-p.age/1.5);text(p.text,p.x,p.y,16,p.color,800);}ctx.globalAlpha=1;
 ctx.restore();
}
function frame(now){const dt=Math.min(.04,(now-(last||now))/1000);last=now;if(!paused)update(dt,now);draw();requestAnimationFrame(frame);}
updateHUD();resize();syncPause();requestAnimationFrame(frame);
