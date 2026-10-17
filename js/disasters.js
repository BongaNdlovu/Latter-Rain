/* Rain of the Word — disasters: tornado, dust devil, earthquake, hailstorm, lightning barrage */
window.ROW=window.ROW||{};
(function(){
'use strict';
const R=ROW;
const D=R.disasters={
  ev:null,pending:null,warned:false,debris:[]
};

const WARN={
  tornado:'⚠ Tornado funnel forming — brace!',
  devil:'⚠ A dust devil stirs the ground…',
  quake:'⚠ The ground trembles…',
  hail:'⚠ Hail is coming — watch the sky!',
  barrage:'⚠ The storm cell is splitting — lightning barrage!',
  tsunami:'⚠ TSUNAMI WARNING — jump the waves as they break!'
};

/* choose & schedule a disaster for this level */
D.arm=function(){
  D.pending=null;D.warned=false;D.ev=null;D.debris.length=0;
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
  if(L.ground==='sand')pool.push('devil','devil');
  if(wxn==='Storm'||wxn==='Tempest'||wxn==='Downpour')pool.push('tornado','barrage');
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
  if(D.pending){
    D.pending.t-=dt;
    if(D.pending.t<3&&!D.warned){
      D.warned=true;
      if(R.main)R.main.showWarn(WARN[D.pending.type]||'⚠ Danger approaches…');
    }
    if(D.pending.t<=0){
      /* hold the disaster until gameplay resumes (e.g. during a place transition) */
      if(R.st!=='play')D.pending.t=0.01;
      else {D.begin(D.pending.type);D.pending=null}
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
    R.tx+=(e.x-R.px)*pull*0.9*dt;
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
    D.debris=D.debris.filter(d=>d.h<R.H*0.75);
    /* roar */
    const pan=R.clamp((e.x-R.px)/R.W*1.6,-1,1);
    R.audio.roar(0.3+pull*0.7+0.1,pan);
    if(devil)R.wxSys.sandBoost=Math.max(R.wxSys.sandBoost,0.35);
    if(e.t<=0){R.audio.roar(0,0);D.end()}
  }else if(e.type==='quake'){
    const ramp=Math.min(1,(e.dur-e.t)/0.6,e.t/1.2);
    R.cam.quakeAmp=Math.max(R.cam.quakeAmp,0.65*ramp);
    R.audio.quake(0.7*ramp);
    if(Math.random()<dt*14){
      R.fx.parts.push({x:Math.random()*R.W,y:R.gy*(0.2+Math.random()*0.3),
        vx:(Math.random()-0.5)*30,vy:30+Math.random()*50,l:1.2,gr:(30+Math.random()*30)*R.S,
        c:'rgba(150,140,130,0.10)',r:(6+Math.random()*10)*R.S});
    }
    for(const c of R.cards)if(!c.dead)c.x+=(Math.random()-0.5)*90*dt*ramp;
    if(e.t<=0){R.audio.quake(0);D.end()}
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
    e.waves=e.waves.filter(w=>!w.dead);
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

D.begin=function(type){
  if(type==='tornado'||type==='devil'){
    const devil=type==='devil';
    const dir=R.px>R.W/2?-1:1;
    D.ev={type,t:devil?9:16,dur:devil?9:16,x:dir<0?R.W+R.W*0.18:-R.W*0.18,dir,
      spd:R.W*(devil?0.13:0.085),seed:Math.random()*10,rTop:R.W*(devil?0.022:0.05),rBot:R.W*(devil?0.006:0.009)};
  }else if(type==='quake'){
    D.ev={type,t:6,dur:6};
  }else if(type==='hail'){
    D.ev={type,t:9,dur:9};
  }else if(type==='barrage'){
    D.ev={type,t:7,dur:7};
  }else if(type==='tsunami'){
    D.ev={type,t:27,dur:27,waves:[],next:2.2,count:0};
  }
};

D.end=function(){D.ev=null;R.cam.quakeAmp=0};

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
        R.fx.parts.push({x:x+R.rnd(-hw*0.7,hw*0.7),y:gy-h,
          vx:w.vx*0.25+(Math.random()-0.5)*60,vy:-R.rnd(60,190),
          l:0.5,c:'rgba(220,240,255,0.85)',r:R.rnd(1,2.6)*R.S});
      }
    }
  }
};
})();
