/* Rain of the Word — disasters: tornado, dust devil, earthquake, hailstorm, lightning barrage */
window.ROW=window.ROW||{};
(function(){
'use strict';
const R=ROW;
const D=R.disasters={
  ev:null,pending:null,warned:false,debris:[],
  gapBomb:0,gapDis:0,clash:0
};
/* ---- hazard exclusion (V3) ----
   Bombs and disasters (quake, tornado, dust devil, hail, barrage, tsunami) never overlap:
   · no bomb spawns while a disaster is active OR scheduled (pending), nor for GAP s after one ends
   · a pending disaster is held back (and its warning delayed) while any bomb is in the air, and for GAP s after the last one lands
   · only one disaster exists at a time; starting one cleanly ends the previous */
const GAP=4;
D.GAP=GAP;
D.bombsAllowed=()=>!D.ev&&!D.pending&&D.gapBomb<=0;
D.mayStart=()=>R.bombs.length===0&&D.gapDis<=0;

const WARN={
  tornado:'⚠ Tornado funnel forming — brace!',
  devil:'⚠ A dust devil stirs the ground…',
  quake:'⚠ The ground trembles…',
  hail:'⚠ Hail is coming — watch the sky!',
  barrage:'⚠ The storm cell is splitting — lightning barrage!',
  tsunami:'⚠ TSUNAMI WARNING — the sea is drawing back… jump the waves as they break!',
  sandstorm:'⚠ Sandstorm wall approaching — visibility will drop, watch the edge markers!',
  strike:'⚠ Lightning cell overhead — leave the glowing rings before they strike!',
  wildfire:'⚠ Wildfire on the wind — ollie the burning brush!'
};
const QUAKE_WARN=m=>'⚠ EARTHQUAKE M'+m.toFixed(1)+' — fissures opening, debris falling!';

/* choose & schedule a disaster for this level */
D.arm=function(){
  D.pending=null;D.warned=false;if(D.ev){R.audio.quake(0);R.audio.roar(0,0);D.end()}D.debris.length=0;
  /* every 10th level is the tsunami summit — scripted, no random draw */
  if(R.lvl>0&&R.lvl%10===0){
    D.pending={type:'tsunami',t:3.5};
    return;
  }
  if(R.lvl<3)return;
  const p=Math.min(0.72,0.2+R.lvl*0.05);
  if(Math.random()>p)return;
  const L=R.LOC[R.locI],wxn=R.WXN[R.wxI].n;
  const pool=[];
  if(L.ground==='sand')pool.push('devil','sandstorm');
  if(L.ground==='forest'||L.sky==='canyon'||L.sky==='mesa'||wxn==='Heatwave')pool.push('wildfire');
  if(wxn==='Storm'||wxn==='Tempest'||wxn==='Downpour')pool.push('tornado','barrage','strike');
  if(wxn==='Hailstorm'||wxn==='Storm')pool.push('hail');
  pool.push('quake');
  if(!pool.length)return;
  const type=pool[Math.random()*pool.length|0];
  D.pending={type,t:5+Math.random()*7};
};

D.funnelX=function(u){
  const e=D.ev;if(!e)return 0;
  if(!(e.type==='tornado'||e.type==='devil'))return e.x||0;
  const sway=Math.sin(u*2.6+R.t*1.6+e.seed)*u*u*R.W*0.045+Math.sin(R.t*0.5+e.seed*2)*u*R.W*0.02;
  return e.x+sway;
};

D.update=function(dt){
  /* cooldown clocks: bombs in the air keep the disaster gap topped up; a disaster keeps the bomb gap topped up */
  if(R.bombs.length)D.gapDis=GAP;else D.gapDis=Math.max(0,D.gapDis-dt);
  if(D.ev)D.gapBomb=GAP;else D.gapBomb=Math.max(0,D.gapBomb-dt);
  if(D.ev&&D.ev.type==='quake'&&R.bombs.length)D.clash++;   /* must stay 0 — checked by tests */
  if(D.pending){
    D.pending.t-=dt;
    if(D.pending.t<3&&!D.warned){
      /* don't announce a disaster while bombs are falling / just landed: hold at the 3 s mark */
      if(!D.mayStart())D.pending.t=3;
      else{
        D.warned=true;
        if(D.pending.type==='quake')D.pending.mag=+(4.6+Math.random()*2.6+Math.min(1,R.lvl/20)).toFixed(1);
        if(R.main)R.main.showWarn(D.pending.type==='quake'?QUAKE_WARN(D.pending.mag):(WARN[D.pending.type]||'⚠ Danger approaches…'));
      }
    }
    if(D.pending.t<=0){
      /* hold the disaster until gameplay resumes (e.g. during a place transition) and until the air is clear of bombs */
      if(R.st!=='play'||!D.mayStart())D.pending.t=0.01;
      else {D.begin(D.pending.type,D.pending.mag);D.pending=null}
    }
  }
  if(!D.ev)return;
  /* once the run is over the storm lets go: audio fades, entities clear.
     during the death fade the visuals stay for drama but go quiet */
  if(R.st==='over'){
    R.audio.roar(0,0);R.audio.quake(0);
    D.end();
    return;
  }
  if(R.st==='dying'){
    R.audio.roar(0,0);R.audio.quake(0);
    return;
  }
  const e=D.ev;
  e.t-=dt;
  if(e.type==='tornado'||e.type==='devil'){
    const devil=e.type==='devil';
    e.x+=e.dir*e.spd*dt;
    e.x+=Math.sin(R.t*0.4+e.seed)*R.W*0.02*dt;
    const pullBase=devil?0.35:1;
    const near=Math.abs(e.x-R.px);
    const pull=R.clamp(1-near/(R.W*0.45),0,1)*pullBase;
    /* pull cards into the funnel, fling them out the top */
    for(const c of R.cards){
      if(c.dead)continue;
      const dx=c.x-D.funnelX(Math.min(1,c.y/R.gy));
      const ad=Math.abs(dx);
      if(ad<R.W*0.4){
        c.x-=dx*pull*1.5*dt;
        c.y-=pull*150*dt;
        c.r+=pull*dt*6*(dx>0?1:-1);
        if(ad<26&&c.y<R.gy*0.55&&!c.fling){c.fling=dx>=0?1:-1}
      }
    }
    /* drag the rider */
    /* suction: the funnel pulls on the board's momentum (stronger the closer it is) */
    {const ddx=e.x-R.px,near=Math.max(0,1-Math.abs(ddx)/(R.W*.45));
     if(R.skate){R.skate.vx+=Math.sign(ddx)*pull*near*R.W*1.6*dt;
       if(!R.board.grounded)R.board.jv+=pull*near*160*R.S*dt*(1+Math.abs(R.skate.vx)/R.W)}
     else R.tx+=ddx*pull*0.9*dt;}
    R.shake=Math.max(R.shake,pull*0.55);
    /* debris spiralling up */
    for(let i=0;i<3;i++){
      D.debris.push({ang:Math.random()*R.TAU,rad:R.rnd(8,60)*R.S,h:R.rnd(0,14),
        vh:R.rnd(60,190),c:devil?'rgba(150,110,60,0.7)':'rgba(70,74,96,0.8)',s:R.rnd(1.5,3.5)*R.S});
    }
    if(D.debris.length>90)D.debris.splice(0,D.debris.length-90);
    for(const d of D.debris){
      d.h+=d.vh*dt;d.rad*=1+dt*0.45;d.ang+=dt*(5+d.rad*0.02);
    }
    R.fx.compact(D.debris,d=>d.h<R.H*0.75);
    /* roar */
    const pan=R.clamp((e.x-R.px)/R.W*1.6,-1,1);
    R.audio.roar(0.3+pull*0.7+0.1,pan);
    if(devil)R.wxSys.sandBoost=Math.max(R.wxSys.sandBoost,0.35);
    if(e.t<=0){R.audio.roar(0,0);D.end()}
  }else if(e.type==='quake'){
    const ramp=Math.min(1,(e.dur-e.t)/0.6,e.t/1.2);
    /* shake scales with magnitude (log energy): M4.6 ≈ 0.35, M7 ≈ 1.0 */
    const mk=R.clamp((e.mag-4)/3,0.25,1.1);
    R.cam.quakeAmp=Math.max(R.cam.quakeAmp,0.75*ramp*mk);
    R.audio.quake(0.75*ramp*mk);
    /* fissures: a crack is announced at the right edge, then tears open over 0.8 s as it scrolls in */
    e.fis-=dt;
    if(e.fis<=0&&e.t>1.5&&R.st==='play'){
      const o=R.ground.spawnOb('fissure');o.full=o.w*(0.8+0.4*mk);o.open=0;o.w=1;e.fiss.push(o);if(R.journey)R.journey.cardFor(o,o.full);
      e.fis=(2.2+Math.random()*1.6-mk*0.6)*(R.journey&&R.journey.locked()?1.7:1);
      R.audio.noise(80,'lowpass',0.5,0.8);
    }
    for(const o of e.fiss){if(o.open<1){o.open=Math.min(1,o.open+dt/0.8);o.w=Math.max(1,o.full*o.open);
      if(Math.random()<.6)R.fx.add(o.x+(Math.random()-.5)*o.w,R.gy,(Math.random()-.5)*60,-40-Math.random()*90,.7,'rgba(160,140,120,.7)',(1.5+Math.random()*2)*R.S)}}
    /* falling debris: a shadow ring marks where it lands (1.0 s warning), then the chunk stays as an obstacle */
    e.deb-=dt;
    if(e.deb<=0&&e.t>1.2&&R.st==='play'){
      /* r8 auto-run: chunks land AHEAD of the board (the ring warns 1 s early), then roll in as an obstacle to jump */
      e.rocks.push({x:R.journey&&R.journey.locked()?R.clamp(R.px+R.rnd(R.W*0.32,R.W*0.62),R.W*0.08,R.W*0.95):R.clamp(R.px+R.rnd(-R.W*0.25,R.W*0.35),R.W*0.08,R.W*0.92),y:-40,t:1.0,vy:0});
      e.deb=(1.4+Math.random()*1.2-mk*0.4)*(R.journey&&R.journey.locked()?1.7:1);
    }
    for(const k of e.rocks){
      k.t-=dt;
      if(k.t<=0.45){k.vy+=2600*R.S*dt;k.y+=k.vy*dt}
      if(k.t<=0&&!k.hit){
        k.hit=1;R.shake=Math.max(R.shake,0.45);R.fx.burst(k.x,R.gy,'rgba(170,150,130,.85)',26,260);R.audio.noise(180,'lowpass',0.5,0.4);
        const o=R.ground.spawnOb('debris');o.x=k.x;if(R.journey)R.journey.cardFor(o);
        if(R.st==='play'&&Math.abs(k.x-R.px)<40*R.S&&R.board.jy<o.h)R.skate.obstacleCrash(o,'slam','hit by falling debris');
      }
    }
    R.fx.compact(e.rocks,k=>!k.hit);
    if(Math.random()<dt*14){
      R.fx.add(Math.random()*R.W,R.gy*(0.2+Math.random()*0.3),(Math.random()-0.5)*30,30+Math.random()*50,1.2,'rgba(150,140,130,0.10)',(6+Math.random()*10)*R.S,(30+Math.random()*30)*R.S);
    }
    for(const c of R.cards)if(!c.dead)c.x+=(Math.random()-0.5)*90*dt*ramp*mk;
    if(e.t<=0){R.audio.quake(0);D.end()}
  }else if(e.type==='sandstorm'){
    /* a wall of dust sweeps in; visibility drops to ~35 %, the board is buffeted, the obstacle edge markers stay readable */
    const ramp=Math.min(1,(e.dur-e.t)/1.5,e.t/1.5);e.vis=ramp;
    R.wxSys.sandBoost=Math.max(R.wxSys.sandBoost||0,0.7*ramp);
    if(R.skate&&R.st==='play')R.skate.vx+=Math.sin(R.t*1.3)*R.W*0.25*ramp*dt;
    if(e.t<=0)D.end();
  }else if(e.type==='strike'){
    /* lightning strikes: target ring 1.1 s before the bolt, strike leaves a scorch that scrolls with the road */
    e.nx-=dt;
    const auto=R.journey&&R.journey.locked();
    const spd=R.ground.roadSpeed();
    /* r8 auto-run: the ring rides in with the road and the bolt falls just as it reaches the board — be in the air then */
    if(e.nx<=0&&e.t>1.3&&R.st==='play'){e.tg.push({x:auto?R.px+spd*1.1+R.rnd(-30,30)*R.S:R.clamp(R.px+R.rnd(-R.W*0.12,R.W*0.2),R.W*0.06,R.W*0.94),t:1.1,mv:auto?1:0});e.nx=1.5+Math.random()*1.1}
    for(const g of e.tg){
      g.t-=dt;g.x-=spd*dt*(g.mv?1:0);   /* manual mode: rings are painted on the road surface and stay put */
      if(g.t<=0&&!g.done){
        g.done=1;R.flash=Math.max(R.flash||0,0.9);R.shake=Math.max(R.shake,0.5);R.audio.noise(2400,'highpass',0.7,0.25);R.audio.noise(90,'lowpass',0.6,1.2);
        e.bolt={x:g.x,t:0.18,seg:Array.from({length:9},()=>Math.random()-.5)};
        e.scorch.push({x:g.x,a:1});
        R.fx.burst(g.x,R.gy,'rgba(220,230,255,.95)',30,340);
        if(R.st==='play'&&Math.abs(g.x-R.px)<46*R.S&&(!g.mv||R.board.jy<32*R.S))R.skate.obstacleCrash({x:g.x,w:20,h:0,type:'lightning'},'slam','struck by lightning');
      }
    }
    R.fx.compact(e.tg,g=>!g.done);
    for(const sc of e.scorch){sc.x-=spd*dt;sc.a-=dt*0.08}
    R.fx.compact(e.scorch,sc=>sc.a>0&&sc.x>-80);
    if(e.bolt){e.bolt.t-=dt;if(e.bolt.t<=0)e.bolt=null}
    if(e.t<=0&&!e.tg.length)D.end();
  }else if(e.type==='wildfire'){
    /* ember storm + burning brush patches on the road; ash darkens the sky */
    e.nx-=dt;e.ash=Math.min(1,(e.dur-e.t)/2,e.t/2);
    if(e.nx<=0&&e.t>2&&R.st==='play'){const fo=R.ground.spawnOb('fire');if(R.journey)R.journey.cardFor(fo);e.nx=2.4+Math.random()*1.4}
    if(Math.random()<.8)R.fx.add(Math.random()*R.W,-10,-40-Math.random()*60,40+Math.random()*60,3,'rgba(255,150,60,.8)',(0.8+Math.random()*1.4)*R.S);
    if(e.t<=0)D.end();
  }else if(e.type==='hail'){
    R.wxSys.hailBoost=Math.max(R.wxSys.hailBoost,0.1);
    if(e.t<=0)D.end();
  }else if(e.type==='barrage'){
    if(Math.random()<dt*2)R.shake=Math.max(R.shake,0.2);
    if(e.t<=0)D.end();
  }else if(e.type==='tsunami'){
    /* spawn a telegraphed wave every few seconds, up to 5 */
    e.next-=dt;
    if(e.next<=0&&e.count<5){
      e.count++;
      const fromLeft=e.count%2===1;
      e.waves.push({x:fromLeft?-150:R.W+150,vx:(fromLeft?1:-1)*R.W/3.6,
        h:76+(e.count-1)*6*Math.min(1,R.H/720),scored:false});
      e.next=4.4+Math.random()*1.6;
      /* deep rising swell cue as the wave forms */
      R.audio.noise(120,'lowpass',0.3,2.6);
    }
    for(const w of e.waves){
      w.x+=w.vx*dt*(0.4+0.6*R.slowF);
      if(R.st==='play'&&!w.scored&&Math.abs(w.x-R.px)<24*R.S){
        if(R.board.jy>w.h-10*R.S){
          w.scored=true;
          R.main.scoreWave(w);
        }else{
          w.scored=true;
          R.main.hitWave(w);
        }
      }
      if(w.x<-220||w.x>R.W+220)w.dead=true;
    }
    R.fx.compact(e.waves,w=>!w.dead);
    /* constant dread: light shake + roar bus while the sea is up */
    R.shake=Math.max(R.shake,0.12);
    R.audio.roar(0.38,0);
    if(e.t<=0&&e.waves.length===0){
      R.audio.roar(0,0);
      if(R.main)R.main.showHint('The sea recedes… you survived the tsunami!',5000);
      D.end();
    }
  }
};

D.begin=function(type,mag){
  if(D.ev){R.audio.quake(0);R.audio.roar(0,0);D.end()}   /* one disaster at a time */
  if(R.bombs.length)R.bombs.length=0;                    /* never alongside bombs (normally already held back) */
  D.gapBomb=GAP;
  if(type==='tornado'||type==='devil'){
    const devil=type==='devil';
    const dir=R.px>R.W/2?-1:1;
    D.ev={type,t:devil?9:16,dur:devil?9:16,x:dir<0?R.W+R.W*0.18:-R.W*0.18,dir,
      spd:R.W*(devil?0.13:0.085),seed:Math.random()*10,rTop:R.W*(devil?0.022:0.05),rBot:R.W*(devil?0.006:0.009)};
  }else if(type==='quake'){
    const m=mag||+(4.6+Math.random()*2.6).toFixed(1);
    D.ev={type,t:7,dur:7,mag:m,fis:0.6,fiss:[],deb:1.2,rocks:[]};
    if(R.main&&!mag)R.main.showWarn(QUAKE_WARN(m));
  }else if(type==='sandstorm'){
    D.ev={type,t:10,dur:10,vis:0};
  }else if(type==='strike'){
    D.ev={type,t:9,dur:9,nx:0.8,tg:[],scorch:[],bolt:null};
  }else if(type==='wildfire'){
    D.ev={type,t:12,dur:12,nx:1,ash:0};
  }else if(type==='hail'){
    D.ev={type,t:9,dur:9};
  }else if(type==='barrage'){
    D.ev={type,t:7,dur:7};
  }else if(type==='tsunami'){
    D.ev={type,t:27,dur:27,waves:[],next:2.2,count:0};
  }
};

D.end=function(){D.ev=null;R.cam.quakeAmp=0;D.gapBomb=GAP};

/* funnel drawn behind the ground plane */
D.drawBack=function(){
  const e=D.ev;
  if(!e||!(e.type==='tornado'||e.type==='devil'))return;
  const cx=R.cx,devil=e.type==='devil';
  const y0=R.H*0.10,gy=R.gy;
  /* wall cloud */
  cx.save();
  const wg=cx.createRadialGradient(e.x,y0,0,e.x,y0,R.W*0.22);
  wg.addColorStop(0,'rgba(24,26,40,0.9)');wg.addColorStop(0.55,'rgba(24,26,40,0.55)');wg.addColorStop(1,'rgba(24,26,40,0)');
  cx.fillStyle=wg;cx.fillRect(e.x-R.W*0.22,y0-R.W*0.13,R.W*0.44,R.W*0.26);
  for(let i=0;i<6;i++){
    const a=R.t*0.8+i*1.05;
    cx.fillStyle='rgba(18,20,34,0.6)';
    cx.beginPath();cx.ellipse(e.x+Math.cos(a)*R.W*0.05,y0+Math.sin(a)*R.W*0.014,R.W*0.04,R.W*0.013,0,0,R.TAU);cx.fill();
  }
  cx.restore();
  /* solid funnel silhouette */
  const N=30;
  const grad=cx.createLinearGradient(0,y0,0,gy);
  if(devil){grad.addColorStop(0,'rgba(96,72,40,0.85)');grad.addColorStop(1,'rgba(150,112,62,0.8)')}
  else{grad.addColorStop(0,'rgba(40,44,64,0.85)');grad.addColorStop(0.6,'rgba(56,60,84,0.8)');grad.addColorStop(1,'rgba(84,88,116,0.75)')}
  cx.fillStyle=grad;
  cx.beginPath();
  for(let i=0;i<=N;i++){
    const u=i/N,y=y0+(gy-y0)*u,xc=D.funnelX(u),r=R.lerp(e.rTop,e.rBot,Math.pow(u,0.85));
    i?cx.lineTo(xc-r,y):cx.moveTo(xc-r,y);
  }
  for(let i=N;i>=0;i--){
    const u=i/N,y=y0+(gy-y0)*u,xc=D.funnelX(u),r=R.lerp(e.rTop,e.rBot,Math.pow(u,0.85));
    cx.lineTo(xc+r,y);
  }
  cx.closePath();cx.fill();
  /* rotating texture bands + core shading */
  cx.save();
  for(let i=0;i<=N;i+=2){
    const u=i/N,y=y0+(gy-y0)*u,xc=D.funnelX(u),r=R.lerp(e.rTop,e.rBot,Math.pow(u,0.85));
    cx.globalAlpha=0.10+0.08*Math.sin(i*1.7+R.t*3);
    cx.fillStyle='rgba(10,12,24,1)';
    cx.beginPath();cx.ellipse(xc,y,r,r*0.3,0,0,R.TAU);cx.fill();
    cx.globalAlpha=0.12;
    cx.strokeStyle='rgba(215,220,245,1)';cx.lineWidth=1.4;
    cx.beginPath();cx.ellipse(xc,y,r*0.85,r*0.26,0,R.t*3+i,R.t*3+i+1.9);cx.stroke();
  }
  /* dark inner core */
  cx.globalAlpha=0.3;
  cx.fillStyle='rgba(8,10,20,1)';
  cx.beginPath();
  for(let i=0;i<=N;i++){
    const u=i/N,y=y0+(gy-y0)*u,xc=D.funnelX(u),r=R.lerp(e.rTop,e.rBot,Math.pow(u,0.85))*0.4;
    i?cx.lineTo(xc-r,y):cx.moveTo(xc-r,y);
  }
  for(let i=N;i>=0;i--){
    const u=i/N,y=y0+(gy-y0)*u,xc=D.funnelX(u),r=R.lerp(e.rTop,e.rBot,Math.pow(u,0.85))*0.4;
    cx.lineTo(xc+r,y);
  }
  cx.closePath();cx.fill();
  cx.restore();
  cx.globalAlpha=1;
};

/* debris + base dust drawn in front */
D.drawFront=function(){
  const e=D.ev;
  if(!e)return;
  const cx=R.cx;
  if(e.type==='tornado'||e.type==='devil'){
    const devil=e.type==='devil';
    /* dust ring at the base */
    cx.save();cx.globalCompositeOperation='lighter';
    for(let i=0;i<3;i++){
      const u=(R.t*0.9+i*0.33)%1;
      const r=R.lerp(e.rBot*2,R.W*0.07,u);
      cx.strokeStyle=devil?`rgba(180,140,80,${(1-u)*0.2})`:`rgba(150,155,185,${(1-u)*0.18})`;
      cx.lineWidth=2;
      cx.beginPath();cx.ellipse(D.funnelX(1),R.gy-2,r,r*0.22,0,0,R.TAU);cx.stroke();
    }
    cx.restore();
    for(const d of D.debris){
      const u=Math.min(1,d.h/R.gy);
      const x=D.funnelX(u)+Math.cos(d.ang)*d.rad;
      const y=R.gy-d.h;
      cx.fillStyle=d.c;
      cx.save();cx.translate(x,y);cx.rotate(d.ang*2);
      cx.fillRect(-d.s,-d.s*0.4,d.s*2,d.s*0.8);
      cx.restore();
    }
  }else if(e.type==='quake'){
    for(const k of e.rocks){
      const p=1-Math.max(0,k.t)/1.0,r=(26-14*p)*R.S;
      cx.strokeStyle=`rgba(255,90,60,${.5+.4*Math.sin(R.t*20)})`;cx.lineWidth=2*R.S;
      cx.beginPath();cx.ellipse(k.x,R.gy+2,r,r*0.28,0,0,R.TAU);cx.stroke();
      cx.fillStyle=`rgba(0,0,0,${.15+.35*p})`;cx.beginPath();cx.ellipse(k.x,R.gy+2,r*0.8,r*0.2,0,0,R.TAU);cx.fill();
      if(k.y>-40){cx.fillStyle='#5a5258';cx.save();cx.translate(k.x,Math.min(R.gy-10*R.S,k.y));cx.rotate(k.y*0.02);cx.fillRect(-11*R.S,-9*R.S,22*R.S,18*R.S);cx.restore()}
    }
  }else if(e.type==='sandstorm'){
    const a=0.55*e.vis;
    cx.fillStyle=`rgba(176,128,72,${a})`;cx.fillRect(-80,-80,R.W+160,R.H+160);
    cx.save();cx.globalAlpha=0.25*e.vis;cx.strokeStyle='rgba(230,190,130,1)';cx.lineWidth=1;
    for(let i=0;i<40;i++){const y=(i*53+R.t*40)%R.H,x=((i*97)-R.t*900)%(R.W+200);const xx=x<0?x+R.W+200:x;cx.beginPath();cx.moveTo(xx,y);cx.lineTo(xx-40*R.S,y+3);cx.stroke()}
    cx.restore();
  }else if(e.type==='strike'){
    for(const sc of e.scorch){cx.fillStyle=`rgba(10,8,6,${.7*sc.a})`;cx.beginPath();cx.ellipse(sc.x,R.gy+3,30*R.S,5*R.S,0,0,R.TAU);cx.fill();
      cx.fillStyle=`rgba(255,120,40,${.35*sc.a})`;cx.beginPath();cx.ellipse(sc.x,R.gy+3,10*R.S,2*R.S,0,0,R.TAU);cx.fill()}
    for(const g of e.tg){const p=1-g.t/1.1,r=(48-14*p)*R.S;
      cx.strokeStyle=`rgba(200,220,255,${.45+.45*Math.sin(R.t*(14+p*30))})`;cx.lineWidth=2.2*R.S;
      cx.beginPath();cx.ellipse(g.x,R.gy+2,r,r*0.26,0,0,R.TAU);cx.stroke();
      cx.fillStyle=`rgba(160,190,255,${.12+.2*p})`;cx.fill()}
    if(e.bolt){const b=e.bolt;cx.save();cx.globalCompositeOperation='lighter';
      for(const [lw,col] of [[9,'rgba(140,170,255,.35)'],[3,'rgba(240,245,255,1)']]){
        cx.strokeStyle=col;cx.lineWidth=lw*R.S;cx.beginPath();cx.moveTo(b.x+b.seg[0]*60,0);
        for(let i=1;i<9;i++)cx.lineTo(b.x+b.seg[i]*50*R.S*(1-i/9),R.gy*i/8);cx.lineTo(b.x,R.gy);cx.stroke()}
      cx.restore()}
  }else if(e.type==='wildfire'){
    cx.fillStyle=`rgba(90,40,20,${0.22*e.ash})`;cx.fillRect(-80,-80,R.W+160,R.gy+80);
    cx.fillStyle=`rgba(255,110,40,${0.10*e.ash})`;cx.fillRect(-80,R.gy*0.75,R.W+160,R.gy*0.25);
  }else if(e.type==='hail'){
    /* cold flash ring on the ground */
    cx.save();cx.globalCompositeOperation='lighter';
    cx.fillStyle=`rgba(190,215,255,${0.03+0.02*Math.sin(R.t*7)})`;
    cx.fillRect(-80,R.gy,R.W+160,R.H-R.gy);
    cx.restore();
  }else if(e.type==='tsunami'){
    /* dread tint over the sky */
    cx.save();
    cx.fillStyle='rgba(16,50,110,0.12)';
    cx.fillRect(-80,-80,R.W+160,R.gy+80);
    /* rising flood water over the road (surge level) */
    const lv=Math.min(1,(e.dur-e.t)/6)*Math.min(1,e.t/3)*14*R.S;
    cx.fillStyle='rgba(40,90,150,0.45)';cx.fillRect(-80,R.gy-lv,R.W+160,lv+R.H);
    cx.strokeStyle='rgba(200,230,255,.5)';cx.lineWidth=1.2;cx.beginPath();
    for(let x=-80;x<=R.W+80;x+=20)cx.lineTo(x,R.gy-lv+Math.sin(x*0.05+R.t*3)*1.5*R.S);cx.stroke();
    /* side telegraph: the next wave's direction, 1.5 s ahead */
    if(e.next<1.6&&e.count<5){const fl=(e.count+1)%2===1,x=fl?24*R.S:R.W-24*R.S,p=.6+.4*Math.sin(R.t*14);
      cx.globalAlpha=p;cx.fillStyle='rgba(120,200,255,.95)';cx.beginPath();
      if(fl){cx.moveTo(x+16*R.S,R.gy-40*R.S);cx.lineTo(x-4*R.S,R.gy-52*R.S);cx.lineTo(x-4*R.S,R.gy-28*R.S)}
      else{cx.moveTo(x-16*R.S,R.gy-40*R.S);cx.lineTo(x+4*R.S,R.gy-52*R.S);cx.lineTo(x+4*R.S,R.gy-28*R.S)}
      cx.closePath();cx.fill();cx.globalAlpha=1}
    cx.restore();
    for(const w of e.waves){
      const x=w.x,h=w.h,gy=R.gy,hw=120*R.S;
      /* water wall body with a rippling crest */
      const g=cx.createLinearGradient(0,gy-h,0,gy);
      g.addColorStop(0,'rgba(120,190,240,0.85)');
      g.addColorStop(0.35,'rgba(50,110,190,0.9)');
      g.addColorStop(1,'rgba(14,40,90,0.95)');
      cx.fillStyle=g;
      cx.beginPath();
      cx.moveTo(x-hw,gy);
      for(let i=0;i<=16;i++){
        const u=i/16,xi=x-hw+u*hw*2;
        const yi=gy-h*(0.72+0.28*Math.sin(u*7+R.t*6+w.x*0.01));
        i?cx.lineTo(xi,yi):cx.moveTo(xi,yi);
      }
      cx.lineTo(x+hw,gy);
      cx.closePath();cx.fill();
      /* foam crest */
      cx.strokeStyle='rgba(235,248,255,0.9)';
      cx.lineWidth=3*R.S;
      cx.beginPath();
      for(let i=0;i<=16;i++){
        const u=i/16,xi=x-hw+u*hw*2;
        const yi=gy-h*(0.72+0.28*Math.sin(u*7+R.t*6+w.x*0.01));
        i?cx.lineTo(xi,yi):cx.moveTo(xi,yi);
      }
      cx.stroke();
      cx.strokeStyle='rgba(190,225,255,0.4)';
      cx.lineWidth=1.4;
      cx.beginPath();
      for(let i=0;i<=16;i++){
        const u=i/16,xi=x-hw+u*hw*2;
        const yi=gy-h*0.45*(0.8+0.2*Math.sin(u*5-R.t*4));
        i?cx.lineTo(xi,yi):cx.moveTo(xi,yi);
      }
      cx.stroke();
      /* spray whipped off the crest */
      if(Math.random()<0.7){
        R.fx.add(x+R.rnd(-hw*0.7,hw*0.7),gy-h,w.vx*0.25+(Math.random()-0.5)*60,-R.rnd(60,190),0.5,'rgba(220,240,255,0.85)',R.rnd(1,2.6)*R.S);
      }
    }
  }
};
})();
