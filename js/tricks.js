/* Rain of the Word — tricks: flip tricks, hardflip combo, manuals, bails, combo banking,
   XP + ranks, big-landing slow-mo. Ported from V2 and wired into board.js jump/land. */
window.ROW=window.ROW||{};
(function(){
'use strict';
const R=ROW;
const T=R.tricks={trk:null,air:[],airPts:0,combo:0,comboT:0,comboPts:0,manual:false,manualT:0,
  tilt:0,tiltT:0,slowHold:0,queue:null,qT:0,landed:0,bestCombo:0,bails:0,keys:{dn:0}};

T.DEFS={
  kick: {n:'Kickflip',    ax:'flip',tr:1, d:.44,p:300},
  heel: {n:'Heelflip',    ax:'flip',tr:-1,d:.44,p:300},
  shove:{n:'360 Shove-it',ax:'spin',tr:1, d:.5, p:400},
  hard: {n:'Hardflip',    ax:'both',tr:1, d:.54,p:600},
  varial:{n:'Varial Kickflip',ax:'vflip',tr:1,d:.5,p:550},
  tre:  {n:'360 Flip',    ax:'tre', tr:1, d:.6, p:800}
};
T.GRABS={indy:{n:'Indy Grab',p:300,roll:.35},melon:{n:'Melon Grab',p:300,roll:-.35}};
T.grab=null;T.keys.g=0;T.keys.h=0;T.keys.nose=0;
T.RANKS=[[0,'Grom'],[3000,'Local'],[10000,'Shredder'],[25000,'Ripper'],[60000,'Pro'],[120000,'Legend']];
R.xp=+R.tryGet('rotw-xp')||0;
T.rankOf=x=>{let r=0;for(let i=0;i<T.RANKS.length;i++)if(x>=T.RANKS[i][0])r=i;return r};
let lastRank=T.rankOf(R.xp);

const $=id=>document.getElementById(id);
const el={};
T.initDom=function(){el.combo=$('combo');el.banner=$('banner');el.rk=$('rk');el.xp=$('xpbar')&&$('xpbar').firstElementChild;T.hud()};

T.saveXP=()=>R.trySet('rotw-xp',String(Math.round(R.xp)));
T.gain=function(pts,xpOnly){
  if(!xpOnly)R.score+=Math.round(pts*R.scoreMul);
  R.xp+=pts;
  const rk=T.rankOf(R.xp);
  if(rk>lastRank){lastRank=rk;T._rankT=R.t;T.banner('Rank up · '+T.RANKS[rk][1],'#5ff2e6');
    R.audio.arp([523,784,1046],0.4,0.12);T.saveXP();
    if(R.main){R.main.checkUnlocks()}}
};
T.hud=function(){
  if(!el.rk)return;
  const r=T.rankOf(R.xp),nx=T.RANKS[r+1];
  el.rk.textContent='Rank · '+T.RANKS[r][1]+(nx?'':' ★');
  if(el.xp)el.xp.style.width=(nx?Math.min(100,(R.xp-T.RANKS[r][0])/(nx[0]-T.RANKS[r][0])*100):100)+'%';
};
T._rankT=-9;
T.banner=function(txt,col){
  if(!el.banner)return;
  /* a fresh rank-up keeps the banner for its full beat */
  if(txt.indexOf('Rank up')<0&&R.t-T._rankT<1.4)return;
  el.banner.textContent=txt;el.banner.style.color=col;
  el.banner.classList.remove('show');void el.banner.offsetWidth;el.banner.classList.add('show');
  clearTimeout(T._bt);T._bt=setTimeout(()=>el.banner.classList.remove('show'),1400);
};
const showCombo=(names,txt,pop)=>{
  if(!el.combo)return;
  el.combo.firstElementChild.textContent=names;el.combo.lastElementChild.innerHTML=txt;
  el.combo.classList.add('show');
  if(pop){el.combo.classList.remove('pop');void el.combo.offsetWidth;el.combo.classList.add('pop')}
};
const hideCombo=()=>{if(el.combo)el.combo.classList.remove('show')};

const canSkate=()=>(R.st==='play'||R.st==='wait'||R.st==='trans')&&!R.paused;
const inAir=()=>!R.board.grounded;

/* ---------- input ---------- */
T.press=function(id){
  if(!canSkate())return;
  if(!inAir()){T.queue=id;T.qT=0.18;if(R.skate&&R.skate.tryPop)R.skate.tryPop();return}  /* r5b: trick key on the ground = instant ollie + trick */
  if(T.trk){
    /* flip + shove pressed together (or within 30% of the trick) = hardflip */
    if(T.trk.t<.3&&T.trk.ax!=='both'&&T.trk.ax!=='tre'&&T.DEFS[id]&&((T.trk.ax==='flip')!==(T.DEFS[id].ax==='flip'))){
      /* kickflip + shove = 360 flip (tre), heelflip + shove = hardflip */
      const up=(T.trk.n==='Kickflip'||id==='kick')?'tre':'hard';
      T.trk=Object.assign({},T.DEFS[up],{t:T.trk.t});R.audio.whoosh();}
    return;
  }
  /* too late in the jump to finish anything: ignore */
  if(R.board.jv<0&&R.board.jy-(R.skate.sup||0)<14*R.S)return;
  if(R.skate.grind)return;
  T.trk=Object.assign({},T.DEFS[id],{t:0});R.audio.whoosh();
};
T.grabKey=function(id,down){
  T.keys[id==='indy'?'g':'h']=down?1:0;
  if(!down){ if(T.grab&&T.grab.id===id)T.endGrab(); return }
  if(!canSkate()||!inAir()||T.grab||T.trk)return;
  T.grab={id,n:T.GRABS[id].n,t:0};R.audio.whoosh();
};
T.endGrab=function(){
  const g=T.grab;T.grab=null;if(!g)return;
  if(g.t>.18){const p=Math.round(T.GRABS[g.id].p*(1+g.t*2));T.air.push(g.n);T.airPts+=p;
    R.fx.flyTexts.push({w:g.n,x:R.px,y:R.gy-R.board.jy-70*R.S,t:0,col:'255,255,255',small:1})}
};
T.crashReset=function(){
  T.trk=null;T.grab=null;T.air=[];T.airPts=0;T.bails++;
  if(T.combo>0)R.fx.flyTexts.push({w:'Combo lost',x:R.px,y:R.gy-120*R.S,t:0,col:'255,106,61',small:1});
  T.combo=0;T.comboPts=0;T.manual=false;T.manualT=0;hideCombo();
};
T.onJump=function(){
  T.manual=false;T.manualT=0;T.tiltT=0;T.tilt=-.3;
  if(T.queue){const q=T.queue;T.queue=null;T.press(q)}
};
T.clearBonus=function(){ /* a debris clear while airborne links into the combo */
  if(inAir()){T.air.push('Clear');T.airPts+=150}
};

/* ---------- landing verdict ---------- */
T.onLand=function(jv,pitch){
  const hard=Math.min(1,Math.abs(jv)/900);
  T.tilt=.12;
  if(!canSkate()){T.trk=null;T.grab=null;T.air=[];T.airPts=0;return 'ok'}
  /* verdicts: grab still held = landed primo; rotation not finished = over/under-rotated or primo */
  if(T.grab){T.grab=null;return 'primo'}
  let verdict='ok';
  if(T.trk){
    const k=T.trk,t=k.t;
    if(t<.82){
      if(k.ax==='flip'||k.ax==='vflip')return t>=.45?'primo':'overrot';
      return 'overrot';                                    /* spin not finished: board lands crooked */
    }
    if(t<.93)verdict='sketchy';
  }
  if(Math.abs(pitch||0)>.32)verdict=verdict==='ok'?'sketchy':verdict;   /* nose/tail not level on touchdown */
  if(T.trk){T.air.push(T.trk.n);T.airPts+=T.trk.p;T.trk=null}
  if(T.air.length){
    const n=T.air.length;T.combo++;
    const pts=Math.round(T.airPts*n*(1+T.combo*.5)/5)*5;
    T.gain(pts);T.comboPts+=pts;T.landed+=n;T.bestCombo=Math.max(T.bestCombo,T.combo);T.comboT=2.4;
    showCombo(T.air.join(' + '),`${T.comboPts.toLocaleString()}<em>×${T.combo}</em>`,1);
    R.fx.flyTexts.push({w:'+'+pts,x:R.px,y:R.gy-110*R.S,t:0,col:'255,79,163'});
    R.fx.rings.push({x:R.px,y:R.gy-10*R.S,r:10,a:.9});
    const big=n>=2||T.combo>=4||T.air.indexOf('Hardflip')>=0||T.air.indexOf('360 Flip')>=0;
    if(big){
      /* cinematic beat: world slows, bars widen, camera punches */
      T.slowHold=.9;R.kick_=1;R.CA=Math.max(R.CA,5);R.cam.punchFn(1);
      R.fx.flashScreen('rgba(255,79,163,.18)');
      R.fx.burst(R.px,R.gy-20*R.S,'#ff4fa3',40,520);R.fx.burst(R.px,R.gy-20*R.S,'#ffd98a',30,380);
      R.audio.arp([523,659,784,1046].slice(0,Math.min(4,n+1)),0.35,0.1);
      /* r9: the journey keeps the frame clean — only real milestones get the big banner */
      if(!(R.journey&&R.journey.locked())||T.combo>=8)T.banner(T.combo>=8?'Legendary Line':T.combo>=4?'Sick Combo':T.air.indexOf('Hardflip')>=0?'Hardflip!':'Double Up','#ff4fa3');
    }else R.audio.tone(660+T.combo*40,'triangle',.25,.07);
    T.hud();
  }
  T.air=[];T.airPts=0;
  if(hard>.3)R.shake=Math.max(R.shake,.1+hard*.15);
  return verdict;
};

/* ---------- per-frame ---------- */
T.update=function(dt){
  T.slowHold=Math.max(0,T.slowHold-dt);
  if(T.qT>0){T.qT-=dt;if(T.qT<=0)T.queue=null}
  if(inAir()){
    if(!T.grab&&!T.trk&&(T.keys.g||T.keys.h)&&R.skate.airT>0.06&&!R.skate.crash&&canSkate()){
      const id=T.keys.g?'indy':'melon';T.grab={id,n:T.GRABS[id].n,t:0};R.audio.whoosh()}
    if(T.grab){T.grab.t+=dt;T.comboT=Math.max(T.comboT,.6)}
    if(T.trk){T.trk.t+=dt/T.trk.d;
      if(T.trk.t>=1){T.air.push(T.trk.n);T.airPts+=T.trk.p;
        R.fx.flyTexts.push({w:T.trk.n,x:R.px,y:R.gy-R.board.jy-70*R.S,t:0,col:'255,255,255',small:1});T.trk=null}}
  }else if(canSkate()){
    T.manual=(!!T.keys.dn||!!T.keys.nose)&&!T.mLock&&!R.skate.grind&&!R.skate.crash;
    T.nose=T.manual&&!!T.keys.nose;
    if(T.manual){
      if(T.manualT===0)T.mStarts=(T.mStarts||0)+1;T.manualT+=dt;T.mPeak=Math.max(T.mPeak||0,T.manualT);T.tiltT=(T.nose?.2:-.2)+Math.sin(R.t*7)*.04*Math.min(1,T.manualT);T.comboT=Math.max(T.comboT,.6);
      const mp=dt*(T.nose?80:60)*(1+T.combo*.5);T.gain(mp);T.comboPts+=mp;
      if(T.manualT>.15)showCombo(T.nose?'Nose Manual':'Manual',`${Math.round(T.comboPts).toLocaleString()}<em>×${Math.max(1,T.combo)}</em>`);
      if(T.manualT>3.5){T.mLock=1;T.manual=false;T.manualN=(T.manualN||0)+1;T.tiltT=0;T.banner('Manual Mastered','#5ff2e6');T.gain(200)}
    }else{T.manualT=0;T.tiltT=0}
    if(T.combo>0&&!T.manual){T.comboT-=dt;if(T.comboT<=0){
      if(T.comboPts>0)R.fx.flyTexts.push({w:'Banked '+Math.round(T.comboPts),x:R.W/2,y:R.gy+60*R.S,t:0,col:'255,217,138',small:1});
      T.combo=0;T.comboPts=0;hideCombo();T.saveXP();T.hud()}}
    else if(T.combo===0&&!T.manual&&T.comboPts>0){T.comboPts=0;hideCombo();T.saveXP();T.hud()}
    else if(T.combo===0&&!T.manual)hideCombo();
  }
  T.tilt+=(T.tiltT-T.tilt)*Math.min(1,dt*10);
};
T.reset=function(){
  T.trk=null;T.air=[];T.airPts=0;T.combo=0;T.comboT=0;T.comboPts=0;T.manual=false;T.manualT=0;
  T.tilt=T.tiltT=0;T.slowHold=0;T.queue=null;T.keys.dn=0;T.keys.nose=0;T.grab=null;if(R.skate)R.skate.reset();T.mLock=0;hideCombo();T.saveXP();T.hud();
};

/* ---------- board pose for board3d ---------- */
T.boardOpts=function(def,tf){
  let fa=0,sa=0;
  const k=T.trk;
  if(k){const a=k.t*R.TAU;
    if(k.ax==='flip')fa=a*k.tr; else if(k.ax==='spin')sa=a*k.tr; else if(k.ax==='vflip'){fa=a;sa=-a/2} else if(k.ax==='tre'){fa=a;sa=a} else{fa=a;sa=a/2}}
  let gr=0;if(T.grab)gr=T.GRABS[T.grab.id].roll*Math.min(1,T.grab.t*6);
  sa+=R.lean*.35;
  const dc=tf?['#ff8a2a','#ffe7a3']:[def.art[1],def.art[2]];
  const o={flipAngle:fa+gr,spinAngle:sa,tilt:-T.tilt*(R.lean<0?-1:1)+(T.grab?.12:0),deckColors:dc,gripColor:'#1d1d22',look:def.look,vp:.26};
  return R.skate?R.skate.pose(o):o;
};
})();
