/* Rain of the Word — ground: per-place terrain, wet sheen, puddles, rain-tick ripples,
   light pools, board tracks, reflections parameters */
window.ROW=window.ROW||{};
(function(){
'use strict';
const R=ROW;
const G=R.ground={refl:{a:0.2,wob:1,rows:12}};

G.ticks=[];   // rain-hit rings
G.puddles=[];
G.tracks=[];
G.boats=[];
G.leaves=0;
G.tex={};
G.obs=[];     // road obstacles
G.obsT=5;
G.medkit=null;    // critical-health pickup, once per level
G.medkitUsed=false;

/* ---------- road obstacles ---------- */
const OB_DEFS={
  cone:   [16,30], crate:[30,26], rock:[34,20],  log:[46,15],  buoy:[18,26],
  pot:    [24,30], block:[34,22], stump:[26,22], barrel:[24,34],
  icerock:[30,24], mound:[46,16]
};
const OB_TYPES={
  water:['log','buoy'], asphalt:['cone','crate','rock'], flagstone:['pot','block'],
  forest:['stump','log','rock'], sand:['rock','barrel'], snow:['icerock','mound']
};
G.resetObs=function(){G.obs.length=0;G.obsT=5;G.medkit=null;G.medkitUsed=false};
G.spawnOb=function(){
  const types=OB_TYPES[R.LOC[R.locI].ground]||['rock'];
  const type=types[Math.random()*types.length|0];
  const d=OB_DEFS[type];
  G.obs.push({x:R.W+70,type,w:d[0]*R.S,h:d[1]*R.S,scored:false});
};
G.updateObs=function(dt){
  if(R.st==='play'){
    G.obsT-=dt;
    if(G.obsT<=0){
      G.spawnOb();
      G.obsT=Math.max(1.5,3.8-R.lvl*0.12)*(0.7+Math.random()*0.6);
    }
    /* medical kit: once per level, only when hearts are critical */
    const critical=R.hearts<=Math.max(1,Math.round(R.maxHearts/3))&&R.hearts>0;
    if(!G.medkitUsed&&!G.medkit&&critical&&R.hearts<R.maxHearts){
      G.medkit={x:R.W+70};
      if(R.main)R.main.showWarn('⚕ A medical kit drops ahead — drive through it!');
      R.audio.arp([523,659],0.3,0.07);
    }
    if(G.medkit){
      G.medkit.x-=dt*(120+R.lvl*8)*R.S*(0.4+0.6*R.slowF);
      if(Math.abs(G.medkit.x-R.px)<32*R.S&&R.board.jy<22*R.S){
        G.medkit=null;G.medkitUsed=true;
        R.main.useMedkit();
      }else if(G.medkit.x<-60){
        G.medkit=null;G.medkitUsed=true;
      }
    }
  }
  const spd=(120+R.lvl*10)*R.S;
  for(const o of G.obs){
    o.x-=spd*dt*(0.4+0.6*R.slowF);
    /* symmetric two-zone collision: wide zone scores an aerial clear,
       tight zone is actual contact — works from both travel directions */
    if(R.st==='play'&&!o.scored){
      const clearZone=o.w*0.5+34*R.S,hitZone=o.w*0.5+26*R.S;
      const dx=Math.abs(o.x-R.px);
      if(dx<clearZone&&R.board.jy>o.h-6*R.S){
        o.scored=true;
        R.main.scoreAir(o);
      }else if(dx<hitZone&&R.board.jy<=o.h-6*R.S){
        o.dead=true;
        R.main.hitObstacle(o);
      }
    }
    if(o.x<-90)o.dead=true;
  }
  G.obs=G.obs.filter(o=>!o.dead);
};
G.drawObs=function(){
  if(!G.obs.length && !G.medkit)return;
  const cx=R.cx,gy=R.gy;
  /* medical kit: white case, green cross, pulsing rescue glow */
  if(G.medkit){
    const x=G.medkit.x,w=26*R.S,h=17*R.S,y=gy-h;
    const pulse=0.6+0.4*Math.sin(R.t*4);
    cx.save();cx.globalCompositeOperation='lighter';
    const bg=cx.createRadialGradient(x,y+h/2,0,x,y+h/2,34*R.S);
    bg.addColorStop(0,`rgba(90,220,140,${0.30*pulse})`);bg.addColorStop(1,'rgba(90,220,140,0)');
    cx.fillStyle=bg;cx.fillRect(x-34*R.S,y-30*R.S,68*R.S,68*R.S);
    /* rescue beam so it reads from afar */
    const bm=cx.createLinearGradient(0,y-90*R.S,0,y);
    bm.addColorStop(0,'rgba(90,220,140,0)');bm.addColorStop(1,`rgba(90,220,140,${0.18*pulse})`);
    cx.fillStyle=bm;
    cx.beginPath();cx.moveTo(x-10*R.S,y);cx.lineTo(x+10*R.S,y);cx.lineTo(x+20*R.S,y-90*R.S);cx.lineTo(x-20*R.S,y-90*R.S);cx.closePath();cx.fill();
    cx.restore();
    cx.fillStyle='rgba(0,0,0,0.3)';
    cx.beginPath();cx.ellipse(x,gy+2,w*0.62,2.6*R.S,0,0,R.TAU);cx.fill();
    /* case */
    cx.fillStyle='rgba(238,246,242,0.96)';
    cx.beginPath();cx.roundRect(x-w/2,y,w,h,3.5*R.S);cx.fill();
    cx.strokeStyle='rgba(24,80,48,.85)';cx.lineWidth=1.4;
    cx.beginPath();cx.roundRect(x-w/2,y,w,h,3.5*R.S);cx.stroke();
    /* green cross */
    cx.fillStyle='#1e9e50';
    cx.fillRect(x-3*R.S,y+h*0.16,6*R.S,h*0.68);
    cx.fillRect(x-w*0.22,y+h/2-3*R.S,w*0.44,6*R.S);
    /* latch */
    cx.fillStyle='rgba(24,80,48,.85)';cx.fillRect(x-3*R.S,y-1.5*R.S,6*R.S,2*R.S);
  }
  for(const o of G.obs){
    const x=o.x,w=o.w,h=o.h;
    /* ground shadow */
    cx.fillStyle='rgba(0,0,0,0.3)';
    cx.beginPath();cx.ellipse(x,gy+2,w*0.6,2.6*R.S,0,0,R.TAU);cx.fill();
    const L=x-w/2,T=gy-h;
    if(o.type==='cone'){
      cx.fillStyle='#ff7a2a';
      cx.beginPath();cx.moveTo(x,T);cx.lineTo(x+w*0.5,gy);cx.lineTo(x-w*0.5,gy);cx.closePath();cx.fill();
      cx.fillStyle='rgba(255,255,255,0.75)';
      cx.fillRect(x-w*0.28,T+h*0.45,w*0.56,h*0.16);
      cx.fillStyle='#e05a10';cx.fillRect(x-w*0.55,gy-3*R.S,w*1.1,3*R.S);
    }else if(o.type==='crate'){
      cx.fillStyle='#8a5a34';cx.fillRect(L,T,w,h);
      cx.strokeStyle='rgba(50,28,10,.8)';cx.lineWidth=1.5;
      cx.strokeRect(L,T,w,h);
      cx.beginPath();cx.moveTo(L,T);cx.lineTo(L+w,T+h);cx.moveTo(L+w,T);cx.lineTo(L,T+h);cx.stroke();
      cx.fillStyle='rgba(255,255,255,.12)';cx.fillRect(L,T,w,2.5);
    }else if(o.type==='rock'){
      cx.fillStyle='#6a6a76';
      cx.beginPath();cx.moveTo(L,gy);cx.lineTo(L+w*0.2,T+h*0.3);cx.lineTo(x-w*0.05,T);cx.lineTo(L+w,T+h*0.25);cx.lineTo(L+w,gy);cx.closePath();cx.fill();
      cx.fillStyle='rgba(255,255,255,.14)';
      cx.beginPath();cx.moveTo(L+w*0.2,T+h*0.3);cx.lineTo(x-w*0.05,T);cx.lineTo(x,T+h*0.4);cx.closePath();cx.fill();
    }else if(o.type==='log'){
      cx.fillStyle='#5a3a20';
      cx.beginPath();cx.roundRect(L,T,w,h,h/2);cx.fill();
      cx.fillStyle='#c8a06a';
      cx.beginPath();cx.ellipse(L+w-2,gy-h/2,h*0.42,h/2,0,0,R.TAU);cx.fill();
      cx.strokeStyle='rgba(90,58,32,.8)';cx.lineWidth=1;
      cx.beginPath();cx.ellipse(L+w-2,gy-h/2,h*0.2,h*0.24,0,0,R.TAU);cx.stroke();
    }else if(o.type==='buoy'){
      cx.fillStyle='#d84040';
      cx.beginPath();cx.roundRect(x-w*0.5,T+h*0.3,w,h*0.7,h*0.2);cx.fill();
      cx.fillStyle='rgba(255,255,255,0.85)';
      cx.fillRect(x-w*0.5,T+h*0.55,w,h*0.18);
      cx.strokeStyle='#d84040';cx.lineWidth=1.6;
      cx.beginPath();cx.moveTo(x,T+h*0.3);cx.lineTo(x,T);cx.stroke();
      cx.fillStyle='#ffd98a';
      cx.beginPath();cx.arc(x,T,2.2*R.S,0,R.TAU);cx.fill();
    }else if(o.type==='pot'){
      cx.fillStyle='#b0623a';
      cx.beginPath();cx.moveTo(x-w*0.4,T);cx.lineTo(x+w*0.4,T);cx.lineTo(x+w*0.3,gy);cx.lineTo(x-w*0.3,gy);cx.closePath();cx.fill();
      cx.fillStyle='#c87446';cx.fillRect(x-w*0.5,T,w,h*0.22);
      cx.fillStyle='rgba(40,60,30,.9)';cx.beginPath();cx.ellipse(x,T,w*0.32,h*0.08,0,0,R.TAU);cx.fill();
    }else if(o.type==='block'){
      cx.fillStyle='#7a7488';cx.fillRect(L,T,w,h);
      cx.fillStyle='rgba(255,255,255,.12)';cx.fillRect(L,T,w,2.5);
      cx.strokeStyle='rgba(0,0,0,.4)';cx.lineWidth=1;
      cx.beginPath();cx.moveTo(L+w*0.3,T+h*0.3);cx.lineTo(L+w*0.7,T+h*0.7);cx.stroke();
    }else if(o.type==='stump'){
      cx.fillStyle='#5a3a22';cx.fillRect(L,T+h*0.15,w,h*0.85);
      cx.fillStyle='#c8a06a';
      cx.beginPath();cx.ellipse(x,T+h*0.15,w*0.5,h*0.2,0,0,R.TAU);cx.fill();
      cx.strokeStyle='rgba(90,58,32,.8)';cx.lineWidth=1;
      cx.beginPath();cx.ellipse(x,T+h*0.15,w*0.28,h*0.11,0,0,R.TAU);cx.stroke();
    }else if(o.type==='barrel'){
      cx.fillStyle='#7a4a26';
      cx.beginPath();cx.roundRect(L,T,w,h,4*R.S);cx.fill();
      cx.fillStyle='rgba(40,24,10,.8)';
      cx.fillRect(L,T+h*0.22,w,2.2*R.S);cx.fillRect(L,T+h*0.7,w,2.2*R.S);
      cx.fillStyle='rgba(255,255,255,.1)';cx.fillRect(L+w*0.15,T,w*0.14,h);
    }else if(o.type==='icerock'){
      cx.fillStyle='#bcd8f0';
      cx.beginPath();cx.moveTo(L,gy);cx.lineTo(L+w*0.25,T+h*0.2);cx.lineTo(x+w*0.1,T);cx.lineTo(L+w,gy);cx.closePath();cx.fill();
      cx.fillStyle='rgba(255,255,255,.5)';
      cx.beginPath();cx.moveTo(L+w*0.25,T+h*0.2);cx.lineTo(x+w*0.1,T);cx.lineTo(x,T+h*0.35);cx.closePath();cx.fill();
    }else if(o.type==='mound'){
      cx.fillStyle='#e8f0fc';
      cx.beginPath();cx.moveTo(L,gy);cx.quadraticCurveTo(x,T-h*0.3,L+w,gy);cx.closePath();cx.fill();
      cx.fillStyle='rgba(160,190,235,.4)';
      cx.beginPath();cx.moveTo(L+w*0.15,gy);cx.quadraticCurveTo(x,T+h*0.15,L+w*0.85,gy);cx.closePath();cx.fill();
    }
  }
};

G.build=function(){
  if(!R.W||!R.H)return;
  const L=R.LOC[R.locI],gr=L.ground,W=R.W,H=R.H;
  G.ticks.length=0;G.tracks.length=0;
  G.tex={};
  /* asphalt texture: noise + cracks */
  if(gr==='asphalt'){
    const c=document.createElement('canvas');c.width=256;c.height=256;
    const g=c.getContext('2d');
    for(let i=0;i<2600;i++){
      g.fillStyle=`rgba(${180+Math.random()*60|0},${180+Math.random()*60|0},${200},${Math.random()*0.05})`;
      g.fillRect(Math.random()*256,Math.random()*256,1.5,1.5);
    }
    g.strokeStyle='rgba(0,0,0,.5)';g.lineWidth=1;
    for(let i=0;i<7;i++){
      g.beginPath();let x=Math.random()*256,y=Math.random()*256;g.moveTo(x,y);
      for(let j=0;j<6;j++){x+=(Math.random()-0.5)*50;y+=(Math.random()-0.5)*50;g.lineTo(x,y)}
      g.stroke();
    }
    G.tex.asphalt=c;
    G.puddles=[];
    for(let i=0;i<7;i++){
      G.puddles.push({x:R.rnd(0.08,0.92),u:Math.random()<0.4?R.rnd(0.02,0.22):R.rnd(0.25,0.85),
        w:R.rnd(50,150)*R.S,ph:Math.random()*6.3,cd:0,rip:[]});
    }
  }
  /* flagstone: perspective slab grid, pre-rendered */
  if(gr==='flagstone'){
    const c=document.createElement('canvas');c.width=Math.max(2,W|0);c.height=Math.max(2,(H-gy0())|0||2);
    const g=c.getContext('2d');
    let y=0,row=0;
    while(y<c.height){
      const u=y/c.height,rowH=R.lerp(5,40,Math.pow(u,1.7));
      const slabW=R.lerp(46,190,Math.pow(u,1.5));
      const off=(row%2)*slabW*0.5;
      for(let x=-slabW;x<c.width+slabW;x+=slabW){
        const l=R.rnd(14,26),warm=R.rnd(-6,8);
        g.fillStyle=`rgb(${l*2.1+warm|0},${l*2+warm*0.5|0},${l*2.6|0})`;
        g.fillRect(x+off,y+1,slabW-2,rowH-2);
        if(Math.random()<0.08){g.fillStyle='rgba(40,70,35,.35)';g.fillRect(x+off,y+1,slabW-2,rowH-2)}
        if(Math.random()<0.12){
          g.strokeStyle='rgba(0,0,0,.4)';g.beginPath();
          g.moveTo(x+off+slabW*R.rnd(.2,.8),y+2);g.lineTo(x+off+slabW*R.rnd(.2,.8),y+rowH-2);g.stroke();
        }
      }
      g.fillStyle='rgba(0,0,0,.55)';g.fillRect(0,y,c.width,1.5);
      y+=rowH;row++;
    }
    G.tex.flag=c;
  }
  /* forest floor: soil, leaf litter, roots */
  if(gr==='forest'){
    const c=document.createElement('canvas');c.width=Math.max(2,W|0);c.height=Math.max(2,(H-gy0())|0||2);
    const g=c.getContext('2d');
    const cols=['#5a3a1e','#7a4a22','#4a3a18','#63502a','#3a2a12'];
    for(let i=0;i<170;i++){
      g.save();g.translate(Math.random()*c.width,Math.random()*c.height);g.rotate(Math.random()*6.3);
      g.globalAlpha=R.rnd(0.25,0.6);g.fillStyle=cols[Math.random()*cols.length|0];
      g.beginPath();g.ellipse(0,0,R.rnd(3,9)*R.S,R.rnd(1.5,3.5)*R.S,0,0,R.TAU);g.fill();g.restore();
    }
    g.globalAlpha=1;
    g.strokeStyle='rgba(10,6,3,.8)';g.lineWidth=2.5*R.S;
    for(let i=0;i<8;i++){
      const y0=Math.random()*c.height;
      g.beginPath();g.moveTo(-20,y0);
      g.bezierCurveTo(c.width*0.3,y0+R.rnd(-24,24),c.width*0.7,y0+R.rnd(-24,24),c.width+20,y0+R.rnd(-14,14));
      g.stroke();
    }
    for(let i=0;i<10;i++){
      const x=Math.random()*c.width,y=Math.random()*c.height,r=R.rnd(24,70)*R.S;
      const rg=g.createRadialGradient(x,y,0,x,y,r);
      rg.addColorStop(0,'rgba(40,70,35,.3)');rg.addColorStop(1,'rgba(40,70,35,0)');
      g.fillStyle=rg;g.fillRect(x-r,y-r,r*2,r*2);
    }
    G.tex.forest=c;
  }
  /* snow drifts */
  if(gr==='snow'){
    const c=document.createElement('canvas');c.width=Math.max(2,W|0);c.height=Math.max(2,(H-gy0())|0||2);
    const g=c.getContext('2d');
    for(let i=0;i<9;i++){
      const x=Math.random()*c.width,y=Math.random()*c.height,r=R.rnd(50,150)*R.S;
      const rg=g.createRadialGradient(x,y-r*0.3,0,x,y,r);
      rg.addColorStop(0,'rgba(235,242,255,.35)');rg.addColorStop(1,'rgba(235,242,255,0)');
      g.fillStyle=rg;g.beginPath();g.ellipse(x,y,r,r*0.4,0,0,R.TAU);g.fill();
    }
    G.tex.snow=c;
  }
  /* water boats */
  if(gr==='water'){
    G.boats=[{u:0.14,x:0.28,ph:1.2},{u:0.3,x:0.7,ph:4.1}];
  }else G.boats=[];
  G.leaves=0;
};
function gy0(){return R.gy}

G.addTick=function(x,y){
  if(G.ticks.length<40)G.ticks.push({x,y,r:1,a:0.5});
};

G.update=function(dt){
  const L=R.LOC[R.locI],gr=L.ground;
  G.updateObs(dt);
  /* rain-hit tick rings */
  for(const t of G.ticks){t.r+=dt*46*R.S;t.a-=dt*2.2}
  G.ticks=G.ticks.filter(t=>t.a>0);
  if(gr==='asphalt'){
    const raining=R.wx.rain>0.3;
    for(const p of G.puddles){
      p.cd=Math.max(0,p.cd-dt);
      for(const r of p.rip){r.r+=dt*60*R.S;r.a-=dt*1.6}
      p.rip=p.rip.filter(r=>r.a>0);
      if(raining&&Math.random()<dt*wxRainRate())p.rip.push({r:1,a:0.4});
      /* board splashes through near puddles */
      const pxP=p.x*R.W+(R.px-R.W/2)*0.12*(1-p.u);
      const wHit=p.w*(0.5+p.u);
      if(p.u<0.24&&p.cd<=0&&Math.abs(R.vel)>R.W*0.1&&Math.abs(R.px-pxP)<wHit*0.55){
        p.cd=1.1;
        R.fx.burst(pxP,R.gy,'rgba(190,232,255,0.9)',16,300);
        R.audio.noise(900,'bandpass',0.18,0.25);
      }
    }
  }
  if(gr==='snow'){
    G.tracks.push({x:R.px,age:0});
    for(const t of G.tracks)t.age+=dt;
    G.tracks=G.tracks.filter(t=>t.age<2.4);
    if(G.tracks.length>70)G.tracks.shift();
  }
  if(gr==='forest'){
    G.leaves-=dt;
    if(G.leaves<=0){
      G.leaves=1.4+Math.random()*2;
      R.fx.parts.push({x:Math.random()*R.W,y:-10,vx:(Math.random()-0.5)*30,vy:40+Math.random()*30,
        l:3,c:'rgba(180,110,50,0.75)',r:2.2*R.S,gr:0});
    }
  }
};
function wxRainRate(){return R.wx.rain*2.2}

/* ground light pools from city lights collected this frame */
G.drawPools=function(cx){
  const gr=R.LOC[R.locI].ground,wet=R.wx.wet;
  cx.save();cx.globalCompositeOperation='lighter';
  for(const li of R.lightsS){
    if(li.kind==='firefly'||li.kind==='neon')continue;
    const a=li.a;
    if(gr==='water'){
      const sg=cx.createLinearGradient(0,R.gy,0,R.H);
      sg.addColorStop(0,li.c);sg.addColorStop(1,'rgba(0,0,0,0)');
      cx.globalAlpha=.16*a;cx.fillStyle=sg;cx.fillRect(li.x-16*R.S,R.gy,32*R.S,(R.H-R.gy)*.85);
      for(let j=0;j<5;j++){
        const yy=R.gy+10+j*((R.H-R.gy)*0.14);
        const off=Math.sin(R.t*2.2+j*1.7)*(4+j*4)*R.S;
        cx.globalAlpha=.14*a*(1-j*0.16);
        cx.fillRect(li.x-12*R.S+off,yy,24*R.S,1.6*R.S);
      }
    }else if(gr==='asphalt'){
      const sg=cx.createLinearGradient(0,R.gy,0,R.H);
      sg.addColorStop(0,li.c);sg.addColorStop(1,'rgba(0,0,0,0)');
      cx.globalAlpha=.12*a*(.4+.6*wet);cx.fillStyle=sg;cx.fillRect(li.x-14*R.S,R.gy,28*R.S,(R.H-R.gy)*.8);
    }else{
      const pr=(gr==='snow'?60:44)*R.S;
      const pg=cx.createRadialGradient(li.x,R.gy+10,0,li.x,R.gy+10,pr);
      pg.addColorStop(0,`rgba(255,200,120,${.16*a*(.5+.5*wet)})`);pg.addColorStop(1,'rgba(255,200,120,0)');
      cx.fillStyle=pg;cx.beginPath();cx.ellipse(li.x,R.gy+10,pr,pr*0.3,0,0,R.TAU);cx.fill();
    }
  }
  cx.globalAlpha=1;cx.restore();
};

G.draw=function(){
  const cx=R.cx,L=R.LOC[R.locI],gr=L.ground,gy=R.gy,W=R.W,H=R.H;
  /* reflection parameters per ground */
  const wet=R.wx.wet,rain=R.wx.rain;
  const refl={
    water:{a:Math.min(.7,.4+.3*wet+rain*.08),wob:2.2+rain*2.4,rows:16},
    asphalt:{a:.14+.3*wet,wob:1.1,rows:12},
    flagstone:{a:.08+.18*wet,wob:0.7,rows:12},
    forest:{a:.07+.06*wet,wob:0.45,rows:8},
    sand:{a:.05,wob:0.35,rows:6},
    snow:{a:.1+.08*wet,wob:0.5,rows:8}
  }[gr]||{a:.2,wob:1,rows:12};
  G.refl=refl;

  /* base gradient */
  const bases={
    water:['#0a2036','#071626','#040c18'],
    asphalt:['#16161f','#0c0c15','#05050c'],
    flagstone:['#1c1a26','#100e18','#07060c'],
    forest:['#171208','#0e0b05','#060503'],
    sand:['#4a3018','#2c1c0c','#140c06'],
    snow:['#7e8cb4','#46507a','#1c2240']
  }[gr];
  const bg=cx.createLinearGradient(0,gy,0,H);
  bg.addColorStop(0,bases[0]);bg.addColorStop(.4,bases[1]);bg.addColorStop(1,bases[2]);
  cx.fillStyle=bg;cx.fillRect(-80,gy,W+160,H-gy+80);

  const hz=((gy-H/2+R.cam.sy)*R.cam.zm+H/2)*R.d,gh=(H-gy)*R.cam.zm*R.d;

  /* screen-space reflection strips (samples what has already been drawn) */
  if(refl.a>0.04){
    const N=refl.rows,sh=gh/N;
    cx.save();cx.setTransform(1,0,0,1,0,0);cx.globalAlpha=refl.a;
    for(let j=0;j<N;j++){
      const sy=hz-(j+1)*sh;if(sy<0)break;
      const rip=Math.sin(R.t*2.2+j*.9)*(1+j*.3)*refl.wob*(0.3+rain+.2*wet)*R.d;
      cx.drawImage(R.cv,0,sy,R.cv.width,sh,rip,hz+j*sh,R.cv.width,sh+1);
    }
    cx.restore();
  }

  /* per-ground detail */
  if(gr==='water')G.drawWater(cx);
  else if(gr==='asphalt')G.drawAsphalt(cx);
  else if(gr==='flagstone')G.drawFlag(cx);
  else if(gr==='forest')G.drawForest(cx);
  else if(gr==='sand')G.drawSand(cx);
  else if(gr==='snow')G.drawSnow(cx);

  /* darkening toward the viewer */
  const mg=cx.createLinearGradient(0,gy,0,H);
  mg.addColorStop(0,'rgba(4,4,15,0)');mg.addColorStop(1,'rgba(4,4,15,.92)');
  cx.fillStyle=mg;cx.fillRect(-80,gy,W+160,H-gy+80);

  G.drawPools(cx);
  G.drawTicks(cx);

  /* horizon edge light */
  cx.fillStyle=gr==='sand'?'rgba(255,220,170,0.25)':'rgba(210,190,255,0.22)';
  cx.fillRect(-80,gy-1,W+160,1.5);
};

G.drawTicks=function(cx){
  for(const t of G.ticks){
    cx.strokeStyle=`rgba(190,232,255,${t.a*0.7})`;
    cx.lineWidth=1;
    cx.beginPath();cx.ellipse(t.x,t.y,t.r,t.r*0.32,0,0,R.TAU);cx.stroke();
  }
};

G.drawWater=function(cx){
  const gy=R.gy,H=R.H,W=R.W;
  /* wet shoreline + drifting foam */
  cx.fillStyle='rgba(220,238,255,0.10)';
  cx.fillRect(-80,gy,W+160,2.4);
  cx.strokeStyle='rgba(232,246,255,0.16)';
  cx.lineWidth=1;
  for(let i=0;i<14;i++){
    const fx=(i*W/14+Math.sin(R.t*0.8+i*2.1)*10*R.S+W)%W;
    const fy=gy+2.5+Math.sin(i*2.2)*1.6;
    const ln=(12+6*Math.sin(R.t*1.3+i*2))*R.S;
    cx.beginPath();cx.moveTo(fx-ln/2,fy);cx.lineTo(fx+ln/2,fy);cx.stroke();
  }
  /* swell lines */
  cx.save();cx.globalCompositeOperation='lighter';
  for(let i=0;i<3;i++){
    const u0=(i/3+((R.t*0.02)%0.33))%1,y=gy+(H-gy)*Math.pow(u0,1.5);
    cx.strokeStyle=`rgba(190,230,255,${0.05+0.05*Math.sin(R.t*1.3+i*2)})`;
    cx.lineWidth=1.5;
    cx.beginPath();
    for(let x=-20;x<=W+20;x+=40){
      const yy=y+Math.sin(x*0.02+R.t*1.6+i*2)*(2+u0*9)*R.S;
      x===-20?cx.moveTo(x,yy):cx.lineTo(x,yy);
    }
    cx.stroke();
  }
  /* specular glints */
  for(let i=0;i<26;i++){
    const sd2=(i*97.13)%1,u=sd2,y=gy+(H-gy)*Math.pow(u,1.4);
    const tw=Math.abs(Math.sin(R.t*(1+u*2)+i*2.7));
    if(tw<0.6)continue;
    const x=((i*213.7)%1)*W+Math.sin(R.t*0.6+i)*20*R.S;
    const ln=(6+u*30)*R.S;
    cx.strokeStyle=`rgba(220,240,255,${(tw-0.6)*(0.12+u*0.3)})`;
    cx.lineWidth=1.2;
    cx.beginPath();cx.moveTo(x-ln/2,y);cx.lineTo(x+ln/2,y);cx.stroke();
  }
  cx.restore();
  /* boats */
  for(const b of G.boats){
    const y=gy+(H-gy)*Math.pow(b.u,1.5);
    const x=b.x*W+Math.sin(R.t*0.3+b.ph)*14*R.S;
    const bob=Math.sin(R.t*1.1+b.ph)*3*R.S;
    cx.save();cx.translate(x,y+bob);
    cx.fillStyle='#05070d';
    cx.beginPath();cx.moveTo(-16*R.S,0);cx.quadraticCurveTo(0,6*R.S,16*R.S,0);cx.lineTo(12*R.S,-3*R.S);cx.lineTo(-12*R.S,-3*R.S);cx.closePath();cx.fill();
    cx.strokeStyle='#05070d';cx.lineWidth=1.4*R.S;
    cx.beginPath();cx.moveTo(0,-3*R.S);cx.lineTo(0,-20*R.S);cx.stroke();
    const lr=cx.createRadialGradient(4*R.S,-16*R.S,0,4*R.S,-16*R.S,16*R.S);
    lr.addColorStop(0,'rgba(255,200,120,.9)');lr.addColorStop(1,'rgba(255,200,120,0)');
    cx.fillStyle=lr;cx.fillRect(-12*R.S,-32*R.S,32*R.S,32*R.S);
    cx.restore();
  }
};

G.drawAsphalt=function(cx){
  const gy=R.gy,H=R.H,W=R.W;
  /* texture */
  if(G.tex.asphalt){
    cx.save();cx.globalAlpha=0.5;
    const p=cx.createPattern(G.tex.asphalt,'repeat');
    cx.fillStyle=p;cx.fillRect(-80,gy,W+160,H-gy+80);
    cx.restore();
  }
  /* road edge lines */
  cx.fillStyle='rgba(230,220,170,0.10)';
  cx.beginPath();cx.moveTo(W/2-W*0.02,gy);cx.lineTo(W/2+W*0.02,gy);cx.lineTo(W/2+W*0.55,H);cx.lineTo(W/2-W*0.55,H);cx.closePath();cx.fill();
  cx.fillStyle='rgba(230,220,170,0.14)';
  cx.beginPath();cx.moveTo(W/2-W*0.004,gy);cx.lineTo(W/2+W*0.004,gy);cx.lineTo(W/2+W*0.03,H);cx.lineTo(W/2-W*0.03,H);cx.closePath();cx.fill();
  /* scrolling centre dashes */
  for(let i=0;i<9;i++){
    const zi=((i/9)+R.zs*0.055)%1,y=gy+(H-gy)*Math.pow(zi,2);
    const w2=R.lerp(2,9,zi),ln=R.lerp(4,26,zi);
    cx.fillStyle=`rgba(230,220,160,${0.1+0.25*zi})`;
    cx.fillRect(W/2-w2/2,y,w2,ln);
  }
  /* wet sheen bands drifting */
  if(R.wx.wet>0.2){
    cx.save();cx.globalCompositeOperation='lighter';
    for(let i=0;i<2;i++){
      const sx=((R.t*(6+i*3)+i*W*0.6)%(W*1.4))-W*0.2;
      const sg=cx.createLinearGradient(sx-W*0.08,0,sx+W*0.08,0);
      sg.addColorStop(0,'rgba(180,210,255,0)');sg.addColorStop(.5,`rgba(180,210,255,${0.05*R.wx.wet})`);sg.addColorStop(1,'rgba(180,210,255,0)');
      cx.fillStyle=sg;cx.fillRect(sx-W*0.08,gy,W*0.16,H-gy);
    }
    cx.restore();
  }
  /* puddles */
  for(const p of G.puddles){
    const y=gy+(H-gy)*Math.pow(p.u,1.7);
    const x=p.x*W+(R.px-W/2)*0.12*(1-p.u);
    const w2=p.w*(0.5+p.u),h2=w2*0.16;
    cx.save();
    const pg=cx.createLinearGradient(0,y-h2,0,y+h2);
    pg.addColorStop(0,`rgba(${R.wx.bot[0]+40|0},${R.wx.bot[1]+50|0},${R.wx.bot[2]+70|0},0.55)`);
    pg.addColorStop(1,'rgba(10,12,22,0.7)');
    cx.fillStyle=pg;
    cx.beginPath();cx.ellipse(x,y,w2,h2,0,0,R.TAU);cx.fill();
    cx.strokeStyle='rgba(255,255,255,0.08)';cx.lineWidth=1;
    cx.beginPath();cx.ellipse(x,y,w2,h2,0,0,R.TAU);cx.stroke();
    /* lamp glints inside puddles */
    cx.globalCompositeOperation='lighter';
    for(const li of R.lightsS){
      if(li.kind==='firefly')continue;
      if(Math.abs(li.x-x)<w2*0.8){
        cx.strokeStyle=R.hexA(li.c.startsWith('rgb')?'#ffb45a':li.c,0.3*li.a);
        cx.lineWidth=1.4;
        cx.beginPath();cx.moveTo(li.x-6*R.S,y);cx.lineTo(li.x+6*R.S,y);cx.stroke();
      }
    }
    cx.restore();
    for(const r of p.rip){
      cx.strokeStyle=`rgba(200,235,255,${r.a*0.6})`;cx.lineWidth=1;
      cx.beginPath();cx.ellipse(x+(r.ox||0),y,r.r,r.r*0.3,0,0,R.TAU);cx.stroke();
    }
  }
};

G.drawFlag=function(cx){
  const gy=R.gy,H=R.H,W=R.W;
  if(G.tex.flag){
    cx.save();
    const ox=(R.px-W/2)*0.05;
    cx.drawImage(G.tex.flag,ox,gy,W,H-gy);
    cx.restore();
  }
  /* wet sheen in the joints */
  if(R.wx.wet>0.25){
    cx.save();cx.globalCompositeOperation='lighter';
    for(let i=0;i<6;i++){
      const u=(i/6+R.zs*0.01)%1,y=gy+(H-gy)*Math.pow(u,1.6);
      cx.fillStyle=`rgba(190,215,255,${0.05*R.wx.wet*(0.3+u)})`;
      cx.fillRect(-80,y,W+160,1.2);
    }
    cx.restore();
  }
};

G.drawForest=function(cx){
  const gy=R.gy,H=R.H,W=R.W;
  if(G.tex.forest)cx.drawImage(G.tex.forest,0,gy,W,H-gy);
  /* drifting light dapples */
  cx.save();cx.globalCompositeOperation='lighter';
  for(let i=0;i<4;i++){
    const x=W*0.2+((i*W*0.23+Math.sin(R.t*0.14+i*2)*W*0.06)%W);
    const y=gy+(H-gy)*(0.2+0.16*i);
    const r=(60+30*i)*R.S;
    const rg=cx.createRadialGradient(x,y,0,x,y,r);
    rg.addColorStop(0,`rgba(190,255,170,${0.05+0.02*Math.sin(R.t*0.8+i)})`);rg.addColorStop(1,'rgba(190,255,170,0)');
    cx.fillStyle=rg;cx.fillRect(x-r,y-r*0.4,r*2,r*0.8);
  }
  cx.restore();
};

G.drawSand=function(cx){
  const gy=R.gy,H=R.H,W=R.W;
  /* scrolling ripple ridges */
  const wind=R.wx.wind;
  for(let i=0;i<9;i++){
    const u=((i/9)+R.zs*0.02*wind*0.3)%1;
    const y=gy+(H-gy)*Math.pow(u,1.6);
    const amp=(1.5+u*6)*R.S,wv=(30+u*120)*R.S;
    cx.strokeStyle=`rgba(255,210,150,${0.05+0.09*u})`;
    cx.lineWidth=1;
    cx.beginPath();
    for(let x=-20;x<=W+20;x+=wv/2){
      const yy=y+Math.sin((x+R.t*wind*30*(0.5+u))/wv*6.283)*amp;
      x===-20?cx.moveTo(x,yy):cx.lineTo(x,yy);
    }
    cx.stroke();
    cx.strokeStyle=`rgba(0,0,0,${0.12+0.1*u})`;
    cx.beginPath();
    for(let x=-20;x<=W+20;x+=wv/2){
      const yy=y+Math.sin((x+R.t*wind*30*(0.5+u))/wv*6.283)*amp+1.5;
      x===-20?cx.moveTo(x,yy):cx.lineTo(x,yy);
    }
    cx.stroke();
  }
  /* sparkles */
  cx.save();cx.globalCompositeOperation='lighter';
  for(let i=0;i<30;i++){
    const tw=Math.abs(Math.sin(R.t*(0.8+(i%5)*0.3)+i*3.1));
    if(tw<0.75)continue;
    const u=(i*0.618)%1,x=((i*373.1)%1)*W,y=gy+(H-gy)*Math.pow(u,1.4);
    cx.fillStyle=`rgba(255,235,190,${(tw-0.75)*1.6*(0.1+u*0.3)})`;
    cx.fillRect(x,y,1.6,1.6);
  }
  cx.restore();
};

G.drawSnow=function(cx){
  const gy=R.gy,H=R.H,W=R.W;
  if(G.tex.snow)cx.drawImage(G.tex.snow,0,gy,W,H-gy);
  /* board tracks fading in the snow */
  if(G.tracks.length>1){
    cx.strokeStyle='rgba(40,52,88,0.4)';
    cx.lineWidth=2.2*R.S;
    for(const side of[-1,1]){
      cx.beginPath();
      let started=false;
      for(const t of G.tracks){
        const a=1-t.age/2.4;
        if(a<=0)continue;
        const x=t.x+side*14*R.S,y=gy+4;
        if(!started){cx.moveTo(x,y);started=true}else cx.lineTo(x,y);
      }
      cx.globalAlpha=0.5;cx.stroke();cx.globalAlpha=1;
    }
  }
  /* sparkle glints */
  cx.save();cx.globalCompositeOperation='lighter';
  for(let i=0;i<36;i++){
    const tw=Math.abs(Math.sin(R.t*(1+(i%7)*0.4)+i*2.3));
    if(tw<0.8)continue;
    const u=(i*0.618)%1,x=((i*271.3)%1)*W,y=gy+(H-gy)*Math.pow(u,1.3);
    cx.fillStyle=`rgba(255,255,255,${(tw-0.8)*3*(0.15+u*0.35)})`;
    cx.fillRect(x,y,2,2);
  }
  cx.restore();
};
R.onResize.push(()=>G.build());
})();
