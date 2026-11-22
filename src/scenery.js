export const THEMES={
 backyard:{floor:'#e8dfc7',grout:'#d4c7a9',roof:'#b87b4c',body:'#d5a570',trim:'#f3dfae',name:'GARDEN LEMONADE'},
 park:{floor:'#dce2c9',grout:'#c4ccb0',roof:'#527e63',body:'#cbb18b',trim:'#f1e9ca',name:'PARKSIDE KIOSK'},
 school:{floor:'#d8e2df',grout:'#bfcfcd',roof:'#4d87a5',body:'#e6bc76',trim:'#f7e7b8',name:'SCHOOL SQUEEZE'},
 market:{floor:'#dfcbb8',grout:'#c8af99',roof:'#b56c62',body:'#bb9775',trim:'#f9e7bc',name:'MARKET FRESH'},
 boardwalk:{floor:'#dbcba6',grout:'#bba883',roof:'#599da1',body:'#f0e6c9',trim:'#e5f1df',name:'BEACH BREEZE'}
};
function paint(c){return {
 box(x,y,w,h,color,r=4){c.fillStyle=color;c.beginPath();c.roundRect(x,y,w,h,r);c.fill();},
 oval(x,y,rx,ry,color){c.fillStyle=color;c.beginPath();c.ellipse(x,y,rx,ry,0,0,Math.PI*2);c.fill();},
 poly(points,color){c.fillStyle=color;c.beginPath();points.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.closePath();c.fill();},
 line(points,color,width=2){c.strokeStyle=color;c.lineWidth=width;c.beginPath();points.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.stroke();},
 label(value,x,y,size=12,color='#264b3c',weight=700){c.fillStyle=color;c.font=`${weight} ${size}px system-ui,sans-serif`;c.textAlign='center';c.textBaseline='middle';c.fillText(value,x,y);}
};}
function lemon(c,x,y,scale=1){const p=paint(c);c.save();c.translate(x,y);c.rotate(-.25);c.scale(scale,scale);p.oval(0,0,11,7,'#d8ac2e');p.oval(-1,-1,9,6,'#f2cf47');p.oval(-4,-3,4,1.5,'#ffe795');p.oval(5,-7,5,2,'#6d974f');c.restore();}
function cup(c,x,y,s=1){const p=paint(c);c.save();c.translate(x,y);c.scale(s,s);p.poly([[-9,-15],[9,-15],[6,12],[-6,12]],'#e8f2de');p.poly([[-7,-4],[7,-4],[5,10],[-5,10]],'#efcc58');p.line([[1,0],[4,-23],[10,-26]],'#b56c62',2);p.oval(0,-15,10,3,'#fffbe9');p.line([[-5,-11],[-3,7]],'#fff9e7',2);c.restore();}
function tree(c,x,y,palm=false,time=0){const p=paint(c);p.oval(x,y+5,25,8,'#234e3020');if(palm){p.poly([[x-5,y],[x+3,y],[x+11,y-64],[x+6,y-67]],'#ad9163');const sway=Math.sin(time*.9)*3;for(let i=0;i<5;i++){const a=-Math.PI+i*.68;p.poly([[x+8,y-65],[x+8+Math.cos(a)*38+sway,y-65+Math.sin(a)*29],[x+8+Math.cos(a+.27)*24,y-65+Math.sin(a+.27)*17]],i%2?'#6d9e76':'#568567');}}else{p.box(x-5,y-32,10,36,'#a1845b');p.oval(x-11,y-39,21,25,'#678b5e');p.oval(x+10,y-44,24,31,'#719867');p.oval(x-2,y-60,24,23,'#89ab77');p.oval(x-11,y-64,10,6,'#a6c58d');}}
export function drawSurroundings(c,id,time){
 const p=paint(c),t=THEMES[id]||THEMES.backyard;
 // Ground speckles and a raised courtyard border give all locations a little depth.
 for(let i=0;i<25;i++)p.oval(-120+(i*113)%840,180+(i*167)%610,2+(i%3),1.5,'#64825d16');
 c.save();c.shadowColor='#264b3b25';c.shadowBlur=12;c.shadowOffsetY=7;p.box(22,219,556,570,'#acbb91',35);c.restore();
 if(id==='backyard'){
  p.box(-60,203,720,7,'#c8b28b');for(let x=-50;x<680;x+=26){p.poly([[x,219],[x,183],[x+6,176],[x+12,183],[x+12,219]],'#f2e6c9');p.line([[x+2,187],[x+2,215]],'#fffae5',1);}
  for(const x of [-24,620]){tree(c,x,365);p.box(x-24,710,47,25,'#ab7e58',8);for(let i=0;i<4;i++){p.line([[x-14+i*9,710],[x-14+i*9,693]],'#71925e');p.oval(x-14+i*9,691,5,4,['#d69783','#e3c764'][i%2]);}}
 }else if(id==='park'){
  c.strokeStyle='#aacfd0';c.lineWidth=52;c.beginPath();c.moveTo(615,150);c.bezierCurveTo(555,340,680,490,602,800);c.stroke();c.strokeStyle='#d7e7d9';c.lineWidth=2;for(let y=260;y<790;y+=95){c.beginPath();c.moveTo(601,y);c.quadraticCurveTo(623,y+5,637,y-2);c.stroke();}
  tree(c,-8,380,false,time);tree(c,598,211,false,time);for(const x of [-15,605]){p.box(x-20,620,40,8,'#a1855d');p.box(x-18,607,36,7,'#b09c73');p.line([[x-13,624],[x-13,642]],'#5e7360',4);p.line([[x+13,624],[x+13,642]],'#5e7360',4);}
 }else if(id==='school'){
  p.box(-85,139,220,74,'#c99479',3);p.box(470,139,220,74,'#c99479',3);for(let y=149;y<211;y+=15){p.line([[-85,y],[135,y]],'#d9b698',2);p.line([[470,y],[690,y]],'#d9b698',2);}p.box(-10,150,42,42,'#648793');p.box(-6,154,34,34,'#b4d1cf');p.line([[11,154],[11,188]],'#f5e7bf');p.line([[-6,171],[28,171]],'#f5e7bf');
  for(let i=0;i<5;i++){p.box(-9,300+i*49,29,35,i%2?'#f1d77f':'#c7d4dc',3);p.label(String(i+1),6,318+i*49,14,'#6d7a79');}tree(c,613,650);
 }else if(id==='market'){
  for(const x of [-40,610]){p.box(x-27,180,58,38,'#ac8565');p.box(x-32,170,68,15,'#a7675a');for(let i=0;i<4;i++)p.box(x-30+i*16,170,8,15,'#f1e2b8',0);p.box(x-10,190,24,25,'#6e735c');}
  p.line([[-40,165],[115,191]],'#887255',2);p.line([[485,191],[645,165]],'#887255',2);for(const x of [-20,5,30,55,80,105,495,520,545,570,595,620]){const y=x<200?168+(x+40)*.17:191-(x-485)*.17;p.oval(x,y+8,5,8,'#eccd78');}
  tree(c,-12,570);tree(c,612,390);
 }else{
  c.fillStyle='#9bcace';c.fillRect(575,150,170,650);for(let i=0;i<6;i++){const y=250+i*90+Math.sin(time*.6+i)*5;p.line([[583,y],[650,y+5],[710,y]],'#dbeee3',3);}
  for(let y=260;y<780;y+=50){p.box(580,y,9,8,'#a28f66');p.line([[585,y],[585,y+44]],'#f4e4bf',4);}tree(c,-10,340,true,time);tree(c,592,209,true,time);tree(c,615,740,true,time);
  p.line([[-18,629],[-18,688]],'#9b8d64',4);p.poly([[-55,632],[-18,603],[20,632]],'#dcaf76');p.poly([[-18,603],[-5,632],[20,632]],'#f5e1ad');
 }
 // A thin edge highlight keeps the work floor readable against its surroundings.
 p.line([[60,225],[540,225]],'#fff8df88',2);
}
export function drawStorefront(c,id,x,y,accent,price,time,expanded){
 const p=paint(c),t=THEMES[id]||THEMES.backyard;c.save();c.translate(x,y);const width=expanded?192:172,L=-width/2;
 p.oval(0,-47,width*.58,14,'#284f3c22');
 // Posts, recessed counter and a softly shaded front panel.
 p.box(L+8,-132,8,77,'#97764f',3);p.box(-L-16,-132,8,77,'#97764f',3);
 const front=c.createLinearGradient(0,-95,0,-54);front.addColorStop(0,t.body);front.addColorStop(1,id==='boardwalk'?'#d5cfb2':'#aa865f');p.box(L+9,-98,width-18,47,front,7);
 if(id==='backyard'){for(let i=1;i<5;i++)p.line([[L+9+i*(width-18)/5,-93],[L+9+i*(width-18)/5,-54]],'#946f4a55',1);p.box(-59,-84,118,23,'#f2dfab',3);}
 if(id==='park'){p.poly([[L-5,-123],[0,-162],[-L+5,-123]],t.roof);p.poly([[L-5,-123],[0,-162],[0,-155],[L+6,-123]],'#789779');p.box(L-7,-126,width+14,9,'#426f59',3);p.box(-56,-87,112,25,'#f5ead0');}
 else if(id==='school'){p.poly([[L-3,-132],[L+15,-151],[-L-15,-151],[-L+3,-132]],t.roof);p.box(L-5,-135,width+10,17,'#619bb5');p.box(-62,-88,124,28,'#f2dfa6');for(let i=0;i<5;i++)p.box(L+12+i*30,-57,20,5,['#bd7d6c','#e0bb56','#6b9c93'][i%3],1);p.box(-14,-145,28,12,'#e6bc76');}
 else if(id==='market'){p.poly([[L-8,-124],[L+5,-153],[-L-5,-153],[-L+8,-124]],t.roof);for(let i=0;i<7;i++)if(i%2===0)p.poly([[L-8+i*(width+16)/7,-124],[L+5+i*(width-10)/7,-153],[L+5+(i+1)*(width-10)/7,-153],[L-8+(i+1)*(width+16)/7,-124]],'#f4e3b9');p.box(L-8,-124,width+16,12,'#b76f64');for(let i=0;i<7;i++)if(i%2===0)p.box(L-8+i*(width+16)/7,-124,(width+16)/7,12,'#f4e3b9');p.box(-60,-87,120,26,'#f7e5b8');p.oval(L+7,-106,6,10,'#efcc73');p.oval(-L-7,-106,6,10,'#efcc73');}
 else if(id==='boardwalk'){p.poly([[L-9,-128],[L+11,-153],[-L-11,-153],[-L+9,-128]],t.roof);for(let i=0;i<8;i++)p.line([[L+12+i*(width-24)/8,-150],[L-5+i*(width+10)/8,-130]],'#afd0c0',1.5);p.box(L-8,-130,width+16,9,'#d8e8d5');for(let i=0;i<7;i++)p.line([[L+15+i*(width-30)/6,-93],[L+15+i*(width-30)/6,-55]],'#fff6de',3);p.box(-62,-89,124,25,'#f2e7bd');p.line([[L+10,-152],[L+10,-175]],'#9c8e62',2);p.poly([[L+10,-175],[L+35,-172+Math.sin(time*2)*3],[L+10,-163]],accent);}
 else{ // A simple slatted canopy makes the backyard feel handmade.
  p.box(L-5,-129,width+10,18,'#c19860');for(let i=0;i<8;i++)p.box(L-5+i*(width+10)/8,-129,6,18,'#e0b77c',1);
 }
 p.box(L+3,-104,width-6,9,'#735c41',3);p.box(L,-108,width,8,'#f4dbaa',3);p.line([[L+4,-108],[-L-4,-108]],'#fff1ca',2);
 p.label(t.name,0,-74,10.5,'#355b49');
 cup(c,L+27,-120,.66);lemon(c,L+54,-115,.65);
 p.box(width/2-61,-120,50,17,'#fff8dc',4);p.label('$'+price.toFixed(2),width/2-36,-111,10,'#46614b');
 // Custom stand color stays visible as a trim stripe at every location.
 p.box(L+10,-54,width-20,4,accent,1);
 if(expanded){p.box(L-22,-88,24,36,'#a1855e');cup(c,L-10,-79,.55);cup(c,L-10,-65,.55);}
 c.restore();
}
export function drawSupplyBin(c,x,y,kind,cost=.25){const p=paint(c);c.save();c.translate(x,y);p.oval(0,-42,53,10,'#264a3820');p.box(-44,-91,88,49,kind==='ice'?'#6499a8':'#ab8050',7);p.poly([[-48,-91],[-37,-109],[38,-109],[48,-91]],kind==='ice'?'#bcdee0':'#d7b16c');p.box(-48,-93,96,33,kind==='ice'?'#a6ced1':'#d6ad66',6);p.box(-38,-85,76,18,kind==='ice'?'#8db9c3':'#b58a46',3);
 if(kind==='lemons'){for(const [lx,ly] of [[-25,-87],[-2,-91],[20,-86],[-14,-74],[12,-75]])lemon(c,lx,ly,.75);for(const xx of [-30,0,30])p.line([[xx,-59],[xx,-44]],'#805e3c',2);}else{for(const [ix,iy] of [[-25,-85],[-3,-90],[20,-82],[-12,-72],[13,-70]]){p.poly([[ix-8,iy-8],[ix+6,iy-12],[ix+12,iy-2],[ix-3,iy+3]],'#dcf2ec');p.poly([[ix-3,iy+3],[ix+12,iy-2],[ix+10,iy+9],[ix-3,iy+13]],'#a7d9dc');p.poly([[ix-8,iy-8],[ix-3,iy+3],[ix-3,iy+13],[ix-9,iy+2]],'#c4e7e2');}}
 p.label('$'+cost.toFixed(2),0,-49,13,'#fff6dd');c.restore();}
export function drawMixer(c,x,y,time,working,electric){const p=paint(c);c.save();c.translate(x,y);p.oval(0,-41,55,10,'#264a3820');p.box(-46,-94,92,49,'#a18058',7);p.box(-52,-108,104,32,'#dcc199',8);p.line([[-44,-104],[43,-104]],'#f7e3bc',2);p.box(-18,-86,36,7,'#817b64');p.poly([[-17,-137],[17,-137],[13,-90],[-12,-90]],'#d7ebe080');p.poly([[-14,-114],[14,-114],[11,-93],[-10,-93]],'#e9c85d');p.line([[-13,-133],[-9,-101]],'#fff8de',3);p.line([[17,-126],[25,-124],[25,-109],[16,-108]],'#a3bbb1',3);p.box(-19,-141,38,6,electric?'#6c9d92':'#ad9669',2);if(working){const sx=Math.sin(time*10)*7;p.line([[sx,-135],[sx+4,-100]],'#998d68',3);p.oval(-3,-105,7,2,'#fff4bb');}if(electric){p.box(-20,-89,40,10,'#71968b',3);p.oval(12,-84,2,2,'#e9d276');}p.label(electric?'ELECTRIC MIXER':'FRESHLY MIXED',0,-49,9,'#fff5d9');c.restore();}
export function drawRegister(c,x,y,money){const p=paint(c);c.save();c.translate(x,y);p.oval(0,-43,52,10,'#264a3820');p.box(-44,-95,88,51,'#698b60',7);p.box(-50,-110,100,32,'#b0c591',8);p.box(-23,-128,45,29,'#5b7766',5);p.box(-16,-124,31,12,'#d4e4b2',2);p.label('$',-1,-118,10,'#52755c');for(let i=0;i<6;i++)p.box(-14+i%3*9,-106+Math.floor(i/3)*5,5,3,'#e1d5b0',1);if(money>0){for(let i=0;i<5;i++){p.oval(24+(i%2)*10,-95-Math.floor(i/2)*3,7,3,'#c69b39');p.oval(24+(i%2)*10,-97-Math.floor(i/2)*3,7,3,'#f1d26a');}p.box(-42,-144,84,22,'#fff5d6',6);p.label('$'+money.toFixed(2),0,-133,12,'#4d7758');}c.restore();}
