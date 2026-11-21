// Drawn directly in canvas, so the village works offline without image downloads.
export function drawVillage(c,x,y,width,height,level=0,buildAge=99){
 c.save();c.translate(x,y);c.scale(width/400,height/210);
 const box=(x,y,w,h,color,r=4)=>{c.fillStyle=color;c.beginPath();c.roundRect(x,y,w,h,r);c.fill();};
 const oval=(x,y,rx,ry,color)=>{c.fillStyle=color;c.beginPath();c.ellipse(x,y,rx,ry,0,0,Math.PI*2);c.fill();};
 oval(200,150,192,54,'#c2d5a8');
 if(level>=2){c.strokeStyle='#ded2ac';c.lineWidth=15;c.beginPath();c.ellipse(200,150,133,37,0,0,Math.PI*2);c.stroke();c.beginPath();c.moveTo(200,153);c.lineTo(200,205);c.stroke();}
 function house(x,y,color,animate=false,school=false){c.save();c.translate(x,y);const t=Math.min(1,buildAge/1.1);const k=animate?Math.max(.05,1-Math.pow(1-t,3)+Math.sin(t*Math.PI*2)*(1-t)*.15):1;c.scale(k,k);oval(0,4,36,10,'#56784125');box(-27,-43,54,45,color);c.fillStyle=school?'#5b8f9b':'#ba7856';c.beginPath();c.moveTo(-34,-41);c.lineTo(0,-70);c.lineTo(34,-41);c.closePath();c.fill();box(-6,-19,12,22,'#8a684c');box(-20,-32,10,11,'#f3e6aa',2);box(10,-32,10,11,'#f3e6aa',2);if(school){box(-18,-36,36,9,'#fcf1cc',2);}c.restore();}
 house(183,128,'#f1d7a0');
 if(level>=1)house(275,150,'#efdcb8',level===1);
 if(level>=5)house(108,163,'#e9c7a0',level===5);
 if(level>=7)house(313,108,'#f0deaf',level===7,true);
 if(level>=3){for(const [tx,ty] of [[54,137],[352,158],[84,102]]){const k=level===3?Math.min(1,Math.max(.05,buildAge)):1;c.save();c.translate(tx,ty);c.scale(k,k);box(-4,-26,8,29,'#a18056');oval(0,-43,20,26,'#76a26c');oval(-12,-33,17,20,'#8cb77b');c.restore();}}
 if(level>=4){box(140,158,65,23,'#a5b27e');for(let i=0;i<6;i++){oval(147+i*10,165,3,4,'#6c9457');oval(147+i*10,175,3,4,'#dfab68');}}
 if(level>=6){oval(234,169,15,8,'#8cb8c1');box(220,155,28,13,'#afae94');box(218,152,32,6,'#dfd5b7');}
 if(level>=8){box(240,179,61,14,'#b7976f');for(let i=0;i<4;i++)box(240+i*15,170,15,10,i%2?'#f6e7b5':'#e6ab70');}
 // Later contributions keep adding homes and trees across the landscape.
 const extra=Math.min(16,Math.max(0,level-8));for(let i=0;i<extra;i++){const tx=35+(i*67)%330,ty=85+(i%3)*37;if(i%2===0)house(tx,ty,'#e1d4ae',i===extra-1);else{box(tx,ty-20,5,22,'#a18056');oval(tx+2,ty-28,13,18,'#79a268');}}
 if(buildAge<2){for(let i=0;i<12;i++){const angle=i*Math.PI/6,r=30+buildAge*48;c.fillStyle=['#e9bb47','#72a978','#c28abc'][i%3];c.globalAlpha=Math.max(0,1-buildAge/2);c.fillRect(200+Math.cos(angle)*r,110+Math.sin(angle)*r-buildAge*18,5,8);}c.globalAlpha=1;}
 c.restore();
}
