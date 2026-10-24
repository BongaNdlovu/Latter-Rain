/* Rain of the Word — main: flow, verse logic, HUD, input, update orchestration, loop */
window.ROW=window.ROW||{};
(function(){
'use strict';
const R=ROW;
const M=R.main={};
const $=id=>document.getElementById(id);

M.hintT=0;
M.init=function(){
  R.vEl=$('verse');R.hEl=$('hearts');R.ov=$('ov');R.rev=$('rev');
  R.fxEl=$('fx');R.barEl=$('bar').firstElementChild;
  R.sEl=$('s');R.stEl=$('stt');R.ltEl=$('lt');R.locEl=$('loc');
  R.wxEl=$('wx');R.powsEl=$('pows');R.hintEl=$('hint');R.warnEl=$('warn');
  R.pz=$('pz');R.pb=$('pb');R.mb=$('mb');
  R.focEl=$('foc');R.focFill=$('fbar').firstElementChild;
  R.transEl=$('trans');R.transLoc=$('transLoc');R.transSub=$('transSub');
  M.powsLast='';M.powsT=0;M.focLast=-1;
  R.tricks.initDom();

  R.pb.onclick=e=>{e.stopPropagation();M.setPaused(!R.paused)};
  R.mb.onclick=e=>{e.stopPropagation();M.setMute(!R.muted)};
  $('ob').onclick=e=>{e.stopPropagation();M.photoMode()};
  $('jb').onclick=e=>{e.stopPropagation()};
  /* jump button fires on pointerdown (touch or mouse) — no click delay */
  $('jb').addEventListener('pointerdown',e=>{e.preventDefault();e.stopPropagation();R.skate.press()});
  $('jb').addEventListener('pointerup',()=>R.skate.release());
  $('jb').addEventListener('pointercancel',()=>R.skate.release());
  /* r8: ⤓ = hold to fast-fall in the air / manual on the ground (the "low" answer at a verse gate) */
  const dnOn=v=>{R.skate.fall=v;R.tricks.keys.dn=v;if(!v)R.tricks.mLock=0};
  $('dn').addEventListener('pointerdown',e=>{e.preventDefault();e.stopPropagation();dnOn(1)});
  $('dn').addEventListener('pointerup',()=>dnOn(0));
  $('dn').addEventListener('pointercancel',()=>dnOn(0));
  $('dn').onclick=e=>e.stopPropagation();
  $('kb').addEventListener('pointerdown',e=>{e.preventDefault();e.stopPropagation();R.tricks.press('kick')});
  /* touch trick button: tap = kickflip (buffered if still on the ground) */
  $('kb').onclick=e=>{e.stopPropagation()};
  /* r6: touch has no SPACE key — the FOCUS meter is a tap target on touch screens */
  $('foc').addEventListener('pointerdown',e=>{e.preventDefault();e.stopPropagation();if(R.st!=='menu'&&R.st!=='over')M.toggleFocus()});
  [R.pb,R.mb,$('ob'),$('jb'),$('kb'),$('dn')].forEach(b=>b.addEventListener('pointerdown',e=>e.stopPropagation()));
  /* r8 touch / mouse: tap anywhere = ollie (hold = higher); tap again in the air = a trick; drag down = fast-fall /
     manual (the LOWER gate word). There is no steering: the board auto-runs, like Vector. */
  let gest=null;
  const inRun=()=>(R.st==='play'||R.st==='wait')&&!R.paused;
  addEventListener('pointerdown',e=>{
    if(!inRun()||gest)return;
    if(e.target.closest&&e.target.closest('button,select,input,#foc,#ov,#pz'))return;
    gest={id:e.pointerId,y:e.clientY,dn:0};
    const B=R.board,S=R.skate;
    if(!B.grounded&&!S.crash&&!S.grind&&S.airT>.14&&B.jy>40*R.S&&!R.tricks.trk){
      R.tricks.press(['kick','heel','shove'][Math.random()*3|0]);       /* airborne tap = trick */
    }else S.press();
  },{passive:true});
  addEventListener('pointermove',e=>{
    if(!gest||e.pointerId!==gest.id||gest.dn)return;
    if(e.clientY-gest.y>34){gest.dn=1;R.skate.fall=1;R.tricks.keys.dn=1}
  },{passive:true});
  const gestEnd=e=>{
    if(!gest||e.pointerId!==gest.id)return;
    R.skate.release();
    if(gest.dn){R.skate.fall=0;R.tricks.keys.dn=0;R.tricks.mLock=0}
    gest=null;
  };
  addEventListener('pointerup',gestEnd,{passive:true});
  addEventListener('pointercancel',gestEnd,{passive:true});
  $('pr').onclick=()=>M.setPaused(false);
  $('prn').onclick=()=>{M.setPaused(false);M.start()};
  $('pp').onclick=()=>M.photoMode();
  $('pm').onclick=()=>{M.setPaused(false);M.buildMenu()};
  document.addEventListener('visibilitychange',()=>{if(document.hidden){R.keys.l=R.keys.r=0;R.tricks.keys.dn=0;M.setPaused(true)}});
  addEventListener('blur',()=>{R.keys.l=R.keys.r=0;R.tricks.keys.dn=0;M.setPaused(true)});

  /* input (r8: no pointer steering — see the gesture handler above) */
  /* r5b input: physical key (e.code) first so AZERTY/QWERTZ/Dvorak all work, then e.key as a fallback */
  const CODE={KeyW:'w',ArrowUp:'up',KeyA:'a',ArrowLeft:'left',KeyD:'d',ArrowRight:'right',KeyS:'s',ArrowDown:'down',
    KeyJ:'j',KeyZ:'z',KeyK:'k',KeyX:'x',KeyL:'l',KeyC:'c',KeyV:'v',KeyT:'t',KeyH:'h',KeyF:'f',KeyG:'g',KeyB:'b',KeyE:'e',KeyQ:'q',
    KeyP:'p',Escape:'esc',KeyM:'m',KeyO:'o',ShiftLeft:'shift',ShiftRight:'shift',Space:'space',Enter:'enter',NumpadEnter:'enter'};
  const KEY={' ':'space',Enter:'enter',Escape:'esc',Shift:'shift',ArrowUp:'up',ArrowDown:'down',ArrowLeft:'left',ArrowRight:'right'};
  const kid=e=>CODE[e.code]||KEY[e.key]||(e.key&&e.key.length===1?e.key.toLowerCase():e.key);
  M.kid=kid;
  const typing=()=>{const a=document.activeElement;return a&&(a.tagName==='INPUT'||a.tagName==='TEXTAREA'||a.tagName==='SELECT')};
  addEventListener('keydown',e=>{
    if(typing())return;
    const k=kid(e);
    if(['up','down','left','right','space'].includes(k))e.preventDefault();   /* no page scroll / button activation */
    if(k==='left'||k==='a'){R.keys.l=1;return}
    if(k==='right'||k==='d'){R.keys.r=1;return}
    if(k==='up'||k==='w'){if(!e.repeat)R.skate.press();return}      /* instant ollie on keydown; repeats ignored */
    if(e.repeat)return;
    /* tricks: J/Z kickflip · K/X heelflip · L/C 360 shove-it · V varial · T tre · H/F hardflip · G/B grabs · E/Q nose manual · S/↓ manual */
    if(k==='j'||k==='z'){R.tricks.press('kick');return}
    if(k==='k'||k==='x'){R.tricks.press('heel');return}
    if(k==='l'||k==='c'){R.tricks.press('shove');return}
    if(k==='v'){R.tricks.press('varial');return}
    if(k==='t'){R.tricks.press('tre');return}
    if(k==='h'||k==='f'){R.tricks.press('hard');return}
    if(k==='g'){R.tricks.grabKey('indy',1);return}
    if(k==='b'){R.tricks.grabKey('melon',1);return}
    if(k==='e'||k==='q'){R.tricks.keys.nose=1;return}
    if(k==='s'||k==='down'){R.tricks.keys.dn=1;R.skate.fall=1;return}
    if(k==='p'||k==='esc'){M.setPaused(!R.paused);return}
    if(k==='m'){M.setMute(!R.muted);return}
    if(k==='o'){M.photoMode();return}
    if(k==='shift'&&R.st!=='menu'&&R.st!=='over'){M.toggleFocus();return}
    if(k==='space'||k==='enter'){
      if(R.st==='menu'||R.st==='over'){const sv=M.save&&M.save();if(R.st==='menu'&&sv)M.startAt(sv.lvl,sv.score);else M.start()}   /* r14: Enter/Space on the menu continues a saved journey */
      else if(R.paused&&k==='enter'){M.setPaused(false)}
      else if(k==='space'){if(R.journey&&R.journey.locked())R.skate.press();else M.toggleFocus()}   /* r8: Space = ollie; Focus is Shift */
    }
  },{passive:false});
  addEventListener('keyup',e=>{
    const k=kid(e);
    if(k==='left'||k==='a')R.keys.l=0;
    if(k==='right'||k==='d')R.keys.r=0;
    if(k==='s'||k==='down'){R.tricks.keys.dn=0;R.tricks.mLock=0;R.skate.fall=0}
    if(k==='up'||k==='w'||k==='space')R.skate.release();
    if(k==='g')R.tricks.grabKey('indy',0);
    if(k==='b')R.tricks.grabKey('melon',0);
    if(k==='e'||k==='q'){R.tricks.keys.nose=0;R.tricks.mLock=0}
  });
  /* focus: the canvas/page takes keyboard focus on load and on any click */
  const cv=document.querySelector('canvas');
  if(cv){cv.tabIndex=0;cv.style.outline='none'}
  const grab=()=>{try{const a=document.activeElement;if(a&&a!==document.body&&a!==cv&&a.tagName==='BUTTON')a.blur();window.focus();cv&&cv.focus({preventScroll:true})}catch(_){}};
  M.grabFocus=grab;
  addEventListener('load',grab);setTimeout(grab,0);
  addEventListener('pointerdown',e=>{if(!e.target.closest||!e.target.closest('button,select,input,#menu,#pz'))grab()},{passive:true});
};

/* ---------- UI helpers ---------- */
M.showHint=function(txt,ms){
  R.hintEl.textContent=txt;R.hintEl.style.opacity=1;
  clearTimeout(M.hintT);M.hintT=setTimeout(()=>R.hintEl.style.opacity=0,ms||4000);
};
M.showWarn=function(txt){
  R.warnEl.textContent=txt;
  R.warnEl.classList.remove('show');void R.warnEl.offsetWidth;
  R.warnEl.classList.add('show');
  R.audio.tone(320,'sawtooth',0.35,0.09);R.audio.tone(240,'sawtooth',0.5,0.08,0.22);
  clearTimeout(M.warnT);
  M.warnT=setTimeout(()=>R.warnEl.classList.remove('show'),3600);
};

const HEART='<svg viewBox="0 0 24 22"><path d="M12 21s-9-5.6-9-12a5 5 0 0 1 9-3 5 5 0 0 1 9 3c0 6.4-9 12-9 12z"/></svg>';
const heartsHTML=()=>Array.from({length:R.maxHearts},(_,i)=>`<span class="${i<R.hearts?'':'x'}">${HEART}</span>`).join('');
const mult=()=>1+Math.min(4,Math.floor(R.streak/3));
const addScore=n=>{R.score+=Math.round(n*R.scoreMul)};
M.addScore=addScore;M.mult=mult;

/* ---------- board unlocks ---------- */
M.boardUnlocked=function(i){
  if(i<=0)return true;
  if(i>=R.BOARDS.length)return R.tryGet('rotw-unlock-transformer')==='1';
  const b=R.BOARDS[i];if(!b)return false;
  if(b.req.kind==='level')return (+R.tryGet('rotw-maxlvl')||1)>=b.req.v;
  if(b.req.kind==='verses')return R.col.filter(Boolean).length>=b.req.v;
  if(b.req.kind==='score'){
    let best=0;for(let d2=0;d2<R.DIFFS.length;d2++)best=Math.max(best,+R.tryGet('rotw-best-'+d2)||0);
    return best>=b.req.v;
  }
  if(b.req.kind==='card')return R.tryGet('rotw-unlock-transformer')==='1';
  if(b.req.kind==='xp')return (R.xp||0)>=b.req.v;
  return false;
};
M.saveRecords=function(){
  R.trySet('rotw-maxlvl',String(Math.max(+R.tryGet('rotw-maxlvl')||1,R.lvl)));
};
M.checkUnlocks=function(){
  const un=R.BOARDS.map((b,i)=>i).filter(i=>M.boardUnlocked(i));
  const prev=(R.tryGet('rotw-seen-boards')||'0').split(',').filter(Boolean).map(Number);
  const fresh=un.filter(i=>prev.indexOf(i)<0&&i!==0);
  if(fresh.length)M.showHint('New board unlocked: '+fresh.map(i=>R.BOARDS[i].n).join(' · ')+' — equip it from the menu!',6500);
  R.trySet('rotw-seen-boards',un.join(','));
};

/* ---------- verse ---------- */

/* ---------- verse selection (V3): a persistent shuffle-bag, so EVERY verse comes up before any repeats ----------
   · difficulty tiers by verse length: short (<80 chars) early, medium from level 4, long from level 10
   · the bag is saved (rotw-vbag), survives reloads, and tops itself up with verses added later
   · level 1 of a brand-new save is always Psalm 23:1 (idx 0), as before */
M.vTier=i=>{const n=R.V[i][0].length;return n<80?0:n<125?1:2};
M.vBag=function(){
  let bag=null;try{bag=JSON.parse(R.tryGet('rotw-vbag')||'null')}catch(e){}
  if(!Array.isArray(bag))bag=null;
  if(bag)bag=bag.filter(n=>Number.isInteger(n)&&n>=0&&n<R.V.length);
  return bag;
};
M.nextVerseIdx=function(){
  let bag=M.vBag();
  const fresh=!bag;
  if(!bag||!bag.length){
    bag=R.V.map((v,k)=>k);
    for(let k=bag.length-1;k>0;k--){const j=Math.random()*(k+1)|0;[bag[k],bag[j]]=[bag[j],bag[k]]}
    R.vCycles=(R.vCycles||0)+1;
  }
  /* verses added after the bag was saved are mixed in */
  const have=new Set(bag);const seenKey=+R.tryGet('rotw-vn')||0;
  if(!fresh&&seenKey&&seenKey<R.V.length){for(let k=seenKey;k<R.V.length;k++)if(!have.has(k))bag.splice(Math.random()*(bag.length+1)|0,0,k)}
  R.trySet('rotw-vn',String(R.V.length));
  const maxT=R.lvl<4?0:R.lvl<10?1:2;
  let pos=-1;
  if(fresh&&R.lvl===1&&!R.col.some(Boolean))pos=bag.indexOf(0);
  if(pos<0){
    const ok=[];for(let k=0;k<bag.length;k++)if(bag[k]!==R.lastIdx&&M.vTier(bag[k])<=maxT)ok.push(k);
    if(ok.length)pos=ok[Math.random()*ok.length|0];
    else pos=bag.findIndex(n=>n!==R.lastIdx);
    if(pos<0)pos=0;
  }
  const idx=bag.splice(pos,1)[0];
  R.trySet('rotw-vbag',JSON.stringify(bag));
  return idx;
};
M.loadVerse=function(idx){
  const i=idx!=null?idx:M.nextVerseIdx();
  R.lastIdx=i;
  const txt=R.V[i][0],ref=R.V[i][1];
  R.verse={idx:i,ref,txt:txt.replace(/[\[\]]/g,''),
    parts:txt.split(/(\[[^\]]+\])/).filter(Boolean).map(s=>
      s[0]==='['?{w:s.slice(1,-1),b:1,f:0,m:0}:{w:s})
  };
  R.verseMiss=0;
  M.renderVerse();
  R.vEl.classList.remove('in');void R.vEl.offsetWidth;R.vEl.classList.add('in');
};
/* keep the rank pill clear of the verse panel: if a tall verse (phones) reaches it, drop the pill under the panel */
M.placeRank=function(){
  const rk=document.getElementById('rkp'),v=R.vEl;if(!rk||!v)return;
  rk.style.top='';
  /* layout boxes (offset*) ignore the entry animation's transform, so the result is stable */
  const vr0=v.getBoundingClientRect(),vt=v.offsetTop,vb=vt+v.offsetHeight,vl=vr0.left,vr=vr0.right;
  const rr0=rk.getBoundingClientRect(),rt=rk.offsetTop,rb=rt+rk.offsetHeight,rl=rr0.left,rr=rr0.right;
  const hit=v.offsetHeight&&!(vr<=rl||rr<=vl||vb<=rt||rb<=vt);
  if(hit)rk.style.top=(vb+8)+'px';
};
addEventListener('resize',()=>M.placeRank&&M.placeRank());
M.renderVerse=function(){
  if(!R.verse||!R.verse.parts.length){R.vEl.innerHTML=''}
  else{
    const curP=R.verse.parts.find(p=>p.b&&!p.f);
    R.vEl.innerHTML=R.verse.parts.map(p=>
      p.b?`<span class="b${p.f?' f'+(p.fresh?' n':''):(p.m?' m':'')}${p===curP?' cur':''}">${p.f?p.w:'_____'}</span>`:p.w
    ).join('')+`<small>${R.verse.ref}</small>`;
    R.verse.parts.forEach(p=>p.fresh=0);
    const tot=R.verse.parts.reduce((n,p)=>n+(p.b?1:0),0),
          got=R.verse.parts.reduce((n,p)=>n+(p.b&&p.f?1:0),0);
    R.barEl.style.width=(tot?Math.round(got/tot*100):0)+'%';
  }
  R.hEl.innerHTML=heartsHTML();
  M.placeRank();
  R.ltEl.textContent='Level '+R.lvl;
  R.locEl.textContent=R.LOC[R.locI].n;
  R.stEl.innerHTML=(R.streak>1?`<i class="stk">${R.streak} streak · x${mult()}</i>`:'')+`<em>Best ${R.best}</em>`;
};

/* ---------- catching ---------- */
M.catchCard=function(c){
  c.dead=true;
  if(c.pow){M.applyPow(c.pow,c);M.renderVerse();return}
  const part=R.verse.parts.find(p=>p.b&&!p.f&&p.w===c.word);
  if(part){
    part.f=1;part.fresh=1;R.bPulse=1;R.streak++;addScore(100*mult());
    R.focusM=Math.min(1,R.focusM+0.09);
    R.audio.chime();R.vibrate(22);
    R.fx.burst(c.x,c.y,'#ffd98a',44);
    R.fx.rings.push({x:c.x,y:c.y,r:8,a:1});
    R.fx.flyTexts.push({w:c.word,x:c.x,y:c.y,t:0});
    R.kick_=1;R.ts=0.42;R.CA=Math.max(R.CA,2.5);
    /* hit-stop + zoom punch */
    R.fx.hitStop(0.07+Math.min(0.05,R.streak*0.004));
    R.cam.punchFn(0.7);
    R.board.squash=1;
    R.fx.flashScreen('rgba(255,200,90,.22)');
    if(!R.verse.parts.some(q=>q.b&&!q.f)){
      /* verse chain: flawless verses stack a score bonus, damage resets it */
      if(R.verseMiss===0)R.chain++;else R.chain=0;
      R.stats.chainBest=Math.max(R.stats.chainBest,R.chain);
      const cm=M.chainMult();
      addScore(250*mult()*cm);
      if(R.verseMiss===0){
        const b=Math.round(150*mult()*cm);addScore(b);
        R.fx.flyTexts.push({w:'It is written · Perfect +'+b,x:R.W/2,y:R.H*0.30,t:0,col:'255,217,138'});
        R.audio.arp([784,1046,1318,1568],0.5,0.11);
        if(R.chain>=2){
          R.fx.flyTexts.push({w:'Verse chain ×'+cm.toFixed(1),x:R.W/2,y:R.H*0.30+34,t:0,col:'95,242,230',small:1});
        }
      }
      if(!R.col[R.verse.idx]){R.col[R.verse.idx]=1;R.newCol=true;R.trySet('rotw-col',JSON.stringify(R.col))}
      R.done++;
      R.tricks.gain(100,true);
      R.focusM=Math.min(1,R.focusM+0.15);
      M.checkUnlocks();
      R.waitT=Math.max(1.2,2.2-R.lvl*0.05);
      R.st='wait';
      R.rev.innerHTML=`“${R.verse.txt}”<small>${R.verse.ref}</small>`;
      R.rev.style.opacity=1;
      if(R.score>R.best){R.best=R.score;R.runBest=true;R.trySet('rotw-best-'+R.diff,R.best)}
    }
  }else{
    if(R.verse.parts.some(p=>p.b&&p.w===c.word)){
      R.fx.burst(c.x,c.y,'#ffd98a',18,220);
      R.fx.flyTexts.push({w:'Already written',x:c.x,y:c.y,t:0,col:'255,217,138',small:1});
      R.audio.tone(523,'sine',0.2,0.07);
      M.renderVerse();
      return;
    }
    if(R.shield>0){
      R.shield=0;
      R.fx.shieldRipples.push({ox:c.x-R.px,oy:-70*R.S,r:14*R.S,a:1});
      R.fx.flashScreen('rgba(110,220,255,.3)');
      R.fx.burst(c.x,c.y,'#7fe8ff',36);
      R.fx.flyTexts.push({w:'Shield!',x:c.x,y:c.y,t:0,col:'127,232,255'});
      R.audio.noise(1400,'bandpass',0.4,0.3);R.audio.tone(392,'square',0.25,0.1);
      R.kick_=1;R.ts=0.55;R.CA=Math.max(R.CA,4);R.vibrate(15);
      R.fx.hitStop(0.06);R.cam.punchFn(0.5);
    }else{
      R.hearts--;R.verseMiss++;R.streak=0;R.bRed=1;
      M.breakChain();
      R.audio.stab();R.vibrate([60,40,60]);
      R.hEl.classList.remove('hit');void R.hEl.offsetWidth;R.hEl.classList.add('hit');
      R.shake=1;R.CA=6;
      R.fx.hitStop(0.12);R.cam.punchFn(1);
      R.fx.burst(c.x,c.y,'#ff5a2a',44);
      R.fx.flashScreen('rgba(255,30,40,.38)');
      R.cv.style.filter='saturate(.2)';
      setTimeout(()=>{R.cv.style.filter=''},380);
      if(R.hearts<=0){R.st='dying';R.overT=1.2}
    }
  }
  M.renderVerse();
};

/* ---------- power-ups ---------- */
M.applyPow=function(p,c){
  addScore(60);R.kick_=1;R.ts=0.5;R.vibrate(18);R.CA=Math.max(R.CA,3);
  R.fx.hitStop(0.05);R.cam.punchFn(0.6);
  if(p==='shield'){
    R.shield=1;R.fx.flashScreen('rgba(110,220,255,.25)');R.fx.burst(c.x,c.y,'#7fe8ff',40);
    R.audio.arp([523,784],0.4,0.15);
    R.fx.flyTexts.push({w:'Shield up',x:c.x,y:c.y,t:0,col:'127,232,255'});
  }else if(p==='slow'){
    R.slowT=5;R.fx.flashScreen('rgba(150,190,255,.18)');R.fx.burst(c.x,c.y,'#b39dff',40);
    R.audio.arp([880,659,523],0.55,0.13);
    R.fx.flyTexts.push({w:'Be still…',x:c.x,y:c.y,t:0,col:'179,157,255'});
  }else if(p==='wide'){
    R.wideT=7;R.fx.flashScreen('rgba(255,210,120,.2)');R.fx.burst(c.x,c.y,'#ffd98a',40);
    R.audio.arp([659,880,1319],0.45,0.13);
    R.fx.flyTexts.push({w:'Thy word is a lamp',x:c.x,y:c.y,t:0,col:'255,217,138'});
  }else if(p==='seek'){
    R.seekT=8;R.fx.flashScreen('rgba(184,255,138,.2)');R.fx.burst(c.x,c.y,'#b8ff8a',40);
    R.audio.arp([523,659,784],0.45,0.13);
    R.fx.flyTexts.push({w:'Seek, and ye shall find',x:c.x,y:c.y,t:0,col:'184,255,138'});
  }else if(p==='heart'){
    if(R.hearts<R.maxHearts){R.hearts++;R.fx.flyTexts.push({w:'+ Heart',x:c.x,y:c.y,t:0,col:'255,122,158'})}
    else{addScore(500);R.fx.flyTexts.push({w:'+500',x:c.x,y:c.y,t:0,col:'255,122,158'})}
    R.fx.flashScreen('rgba(255,110,150,.2)');R.fx.burst(c.x,c.y,'#ff7a9e',44);
    R.audio.arp([392,523,659],0.5,0.15);
  }else if(p==='transform'){
    R.transformT=12;
    R.trySet('rotw-unlock-transformer','1');
    R.fx.flashScreen('rgba(255,190,90,.3)');
    R.fx.burst(c.x,c.y,'#ffb347',52);
    R.audio.arp([392,523,659,880],0.4,0.14);
    R.audio.whoosh();
    R.fx.flyTexts.push({w:'Transformer!',x:c.x,y:c.y,t:0,col:'255,190,90'});
    R.cam.punchFn(1);
    R.vibrate([20,30,20]);
  }
};

/* ---------- ground obstacles ---------- */
M.scoreAir=function(o){
  R.stats.obst++;
  addScore(30);
  R.tricks.gain(30,true);R.tricks.clearBonus();
  R.fx.flyTexts.push({w:'Clean! +30',x:o.x,y:R.gy-50*R.S,t:0,col:'150,240,220',small:1});
  R.audio.tone(880,'sine',0.15,0.06);
};
M.hitObstacle=function(o){
  if(R.st!=='play')return;
  if(R.shield>0){
    R.shield=0;
    R.fx.shieldRipples.push({ox:o.x-R.px,oy:-20*R.S,r:14*R.S,a:1});
    R.fx.flashScreen('rgba(110,220,255,.3)');
    R.fx.burst(o.x,R.gy-10,'#7fe8ff',30);
    R.fx.flyTexts.push({w:'Shield!',x:o.x,y:R.gy-40*R.S,t:0,col:'127,232,255',small:1});
    R.audio.noise(1400,'bandpass',0.4,0.3);R.audio.tone(392,'square',0.25,0.1);
    R.kick_=1;R.CA=Math.max(R.CA,3);R.vibrate(15);
    return;
  }
  R.hearts--;R.streak=0;R.bRed=1;
  M.breakChain();
  R.audio.stab();R.vibrate([60,40,60]);
  R.hEl.classList.remove('hit');void R.hEl.offsetWidth;R.hEl.classList.add('hit');
  R.shake=1.2;R.CA=6;
  R.fx.hitStop(0.12);R.cam.punchFn(1.2);
  /* the crash staggers the board: knocked back and briefly slowed */
  if(R.skate)R.skate.knock(-Math.sign(o.x-R.px||1)*46*R.S);
  R.ts=Math.min(R.ts,0.55);
  R.board.squash=1;
  R.fx.burst(o.x,R.gy-12*R.S,o.type==='icerock'||o.type==='mound'?'rgba(200,230,255,0.9)':'rgba(180,140,90,0.9)',36,320);
  R.fx.flyTexts.push({w:'Crash!',x:o.x,y:R.gy-44*R.S,t:0,col:'255,110,110',small:1});
  R.fx.flashScreen('rgba(255,60,30,.34)');
  R.cv.style.filter='saturate(.2)';
  setTimeout(()=>{R.cv.style.filter=''},380);
  if(R.hearts<=0){R.st='dying';R.overT=1.2}
  M.renderVerse();
};

/* ---------- tsunami waves ---------- */
M.scoreWave=function(w){
  R.stats.waves++;
  addScore(80);
  R.fx.flyTexts.push({w:'Rode the wave! +80',x:w.x,y:R.gy-w.h-20*R.S,t:0,col:'150,240,220'});
  R.audio.arp([659,880],0.3,0.1);
  R.audio.noise(400,'bandpass',0.25,0.4);
  R.vibrate(14);
};
M.hitWave=function(w){
  if(R.st!=='play')return;
  if(R.shield>0){
    R.shield=0;
    R.fx.shieldRipples.push({ox:w.x-R.px,oy:-w.h*0.4,r:16*R.S,a:1});
    R.fx.flashScreen('rgba(110,220,255,.35)');
    R.fx.flyTexts.push({w:'Shield!',x:R.px,y:R.gy-60*R.S,t:0,col:'127,232,255'});
    R.audio.noise(1400,'bandpass',0.4,0.3);
    R.kick_=1;R.CA=Math.max(R.CA,3);R.vibrate(15);
    return;
  }
  R.hearts--;R.streak=0;R.bRed=1;
  M.breakChain();
  R.audio.stab();
  R.audio.noise(90,'lowpass',0.5,1.4);
  R.vibrate([80,50,80]);
  R.hEl.classList.remove('hit');void R.hEl.offsetWidth;R.hEl.classList.add('hit');
  R.shake=1.2;R.CA=8;
  R.fx.hitStop(0.15);R.cam.punchFn(1.2);
  R.fx.burst(R.px,R.gy-30*R.S,'rgba(140,200,255,0.9)',44,380);
  R.fx.flyTexts.push({w:'Swept!',x:R.px,y:R.gy-70*R.S,t:0,col:'150,200,255'});
  R.fx.flashScreen('rgba(70,150,255,.4)');
  R.cv.style.filter='saturate(.2) brightness(.8)';
  setTimeout(()=>{R.cv.style.filter=''},420);
  if(R.hearts<=0){R.st='dying';R.overT=1.2}
  M.renderVerse();
};

/* ---------- medical kit / verse chain / stats ---------- */
M.useMedkit=function(){
  R.stats.med++;
  if(R.hearts<R.maxHearts){
    R.hearts++;
    R.fx.flyTexts.push({w:'+1 ♥',x:R.px,y:R.gy-40*R.S,t:0,col:'120,240,160'});
  }else{
    addScore(250);
    R.fx.flyTexts.push({w:'Full health +250',x:R.px,y:R.gy-40*R.S,t:0,col:'120,240,160',small:1});
  }
  R.fx.burst(R.px,R.gy-16*R.S,'rgba(120,240,160,0.9)',26,240);
  R.audio.arp([523,659,784],0.4,0.12);
  R.vibrate(16);
  M.renderVerse();
};
M.chainMult=()=>1+Math.min(10,R.chain)*0.1;
M.breakChain=function(){R.chain=0};

/* ---------- focus ---------- */
M.toggleFocus=function(){
  if(R.paused)return;
  if(R.focusOn){R.focusOn=false;return}
  if(R.focusM>=0.25&&(R.st==='play'||R.st==='wait'||R.st==='trans')){
    R.focusOn=true;R.focusT=2.6;
    R.audio.arp([880,660,520,392],0.5,0.10);
    R.fx.flashScreen('rgba(140,190,255,.15)');
    R.vibrate(14);
  }else R.audio.tone(160,'sine',0.12,0.05);
};

/* ---------- photo mode ---------- */
M.photoMode=function(){
  if(R.photoBusy)return;R.photoBusy=true;
  document.body.classList.add('photo');
  try{R.audio.noise(5000,'highpass',0.22,0.05);R.audio.tone(2400,'square',0.04,0.06)}catch(e){}
  setTimeout(()=>{
    try{
      const t2=document.createElement('canvas');t2.width=R.cv.width;t2.height=R.cv.height;
      const g=t2.getContext('2d');g.drawImage(R.cv,0,0);
      const cap=`Rain of the Word  ·  ${R.LOC[R.locI].n}  ·  ${R.verse&&R.verse.ref?R.verse.ref:'Menu'}  ·  Score ${R.score}`;
      g.font=`${13*R.d}px Georgia`;g.textAlign='right';
      g.shadowColor='rgba(0,0,0,.8)';g.shadowBlur=6;g.fillStyle='rgba(255,255,255,.85)';
      g.fillText(cap,t2.width-16*R.d,t2.height-14*R.d);
      const a=document.createElement('a');a.download='rain-of-the-word.png';
      a.href=t2.toDataURL('image/png');a.click();
      R.fx.flashScreen('rgba(255,255,255,.55)');
    }catch(e){}
    document.body.classList.remove('photo');R.photoBusy=false;
  },200);
};

/* ---------- game over ---------- */
M.gameOver=function(){
  M.setPaused(false);
  R.st='over';
  R.rev.style.opacity=0;
  R.warnEl.classList.remove('show');
  R.powsEl.innerHTML='';M.powsLast='';
  R.audio.roar(0,0);R.audio.quake(0);
  if(R.score>R.best){R.best=R.score;R.runBest=true;R.trySet('rotw-best-'+R.diff,R.best)}
  R.tricks.saveXP();
  M.saveRecords();M.checkUnlocks();
  /* run stats card */
  const mm=Math.floor(R.stats.time/60),ss=Math.floor(R.stats.time%60);
  const stat=(v,l)=>`<div><b>${v}</b>${l}</div>`;
  const statsHtml=
    `<div class="st">`+
    stat(mm+':'+String(ss).padStart(2,'0'),'Time')+
    stat(Math.round(R.stats.dist)+'m','Distance')+
    stat(R.done,'Verses')+
    stat('×'+(1+Math.min(10,R.stats.chainBest)*0.1).toFixed(1),'Best chain')+
    (R.journey?stat(R.journey.stats.bibles,'Bibles')+stat(R.journey.stats.gatesOk+'/'+(R.journey.stats.gatesOk+R.journey.stats.gatesBad),'Gates right')+stat(R.journey.stats.tricks,'Trick cards')+stat(R.journey.stats.powers,'Powers earned'):'')+
    stat(R.stats.waves,'Waves ridden')+
    stat(R.stats.obst,'Obstacles cleared')+
    stat(R.stats.med,'Medkits')+
    stat(R.tricks.landed,'Tricks landed')+
    stat('×'+R.tricks.bestCombo,'Best combo')+
    stat(R.tricks.RANKS[R.tricks.rankOf(R.xp)][1],'Rank')+
    `</div>`;
  R.ov.style.display='flex';
  R.ov.innerHTML=
    `<h1>The storm passes</h1>`+
    (R.verse&&R.verse.txt?`<div class="v">“${R.verse.txt}”<br><small>${R.verse.ref}</small></div>`:'')+
    `<p>Score ${R.score} · Level ${R.lvl} · ${R.LOC[R.locI].n} · ${R.DIFFS[R.diff].n}${R.runBest?' · ✦ New best!':''}</p>`+
    statsHtml+
    `<p>Collection ${R.col.filter(Boolean).length}/${R.V.length}${R.newCol?' · ✦ New verse collected':''}</p>`+
    `<div class="row">`+
    (R.checkpoint>1?`<button id="cont">Continue · Level ${R.checkpoint}</button>`:'')+
    `<button id="go">Run again</button><button class="ghost" id="gm">Menu</button></div>`;
  const cb=document.getElementById('cont');
  if(cb)cb.onclick=()=>M.start(true);
  document.getElementById('go').onclick=()=>M.start(false);
  document.getElementById('gm').onclick=M.buildMenu;
};

/* ---------- menu ---------- */
M.buildMenu=function(){
  M.setPaused(false);
  R.st='menu';
  R.rev.style.opacity=0;R.warnEl.classList.remove('show');
  R.vEl.innerHTML='';
  R.stEl.innerHTML=`<em>Best ${R.best}</em>`;
  R.barEl.style.width='0%';
  R.powsEl.innerHTML='';M.powsLast='';
  R.audio.roar(0,0);R.audio.quake(0);
  R.shield=0;R.slowT=0;R.slowF=1;R.wideT=0;R.seekT=0;R.transformT=0;R.disasters.ev=null;R.disasters.pending=null;R.disasters.gapBomb=R.disasters.gapDis=0;
  R.clearWorld();if(R.journey)R.journey.reset();
  R.score=0;R.sShown=0;R.sLast=-1;R.sEl.textContent='0';R.streak=0;R.lvl=1;R.done=0;
  R.locI=M.locFor(1);R.todSet(R.locI);M._todN='';
  let bi=Math.max(0,Math.min(R.BOARDS.length,+R.tryGet('rotw-board')||0));
  if(!M.boardUnlocked(bi))bi=0;
  R.boardI=bi;
  R.env.buildAll();R.ground.build();R.ground.resetObs();R.rain.build();
  R.maxHearts=R.DIFFS[R.diff].hearts;R.hearts=R.maxHearts;
  R.best=+R.tryGet('rotw-best-'+R.diff)||0;
  R.hEl.innerHTML=heartsHTML();R.ltEl.textContent='Level 1';R.locEl.textContent=R.LOC[R.locI].n;R.barEl.style.width='0%';
  R.stEl.innerHTML=`<em>Best ${R.best}</em>`;
  R.ov.style.display='flex';
  const bs=R.DIFFS.map((dd,i)=>{
    const b=+R.tryGet('rotw-best-'+i)||0;
    return `<button class="db${i===R.diff?' on':''}" data-d="${i}">${dd.n}<small>Best ${b} · ×${dd.mul} score</small></button>`;
  }).join('');
  const colCount=R.col.filter(Boolean).length;
  const pct=Math.round(colCount/R.V.length*100);
  const pills=R.V.map((vv,i)=>`<span class="cv${R.col[i]?' on':''}">${vv[1]}</span>`).join('');
  const tUnlocked=M.boardUnlocked(R.BOARDS.length);
  const bPills=R.BOARDS.map((b,i)=>{
    const un=M.boardUnlocked(i);
    return `<button class="db bd${i===R.boardI?' on':''}${un?'':' lk'}" data-b="${i}"${un?'':' disabled'}><canvas class="bth" data-bt="${i}" width="132" height="56"></canvas>${un?'':'🔒 '}${b.n}<small>${un?b.desc:b.req.text}</small></button>`;
  }).join('')+
    `<button class="db bd${R.boardI===R.BOARDS.length?' on':''}${tUnlocked?'':' lk'}" data-b="${R.BOARDS.length}"${tUnlocked?'':' disabled'}><canvas class="bth" data-bt="${R.BOARDS.length}" width="132" height="56"></canvas>${tUnlocked?'⚡':'🔒 ⚡'} Transformer<small>${tUnlocked?R.TRANSFORM.desc:R.TRANSFORM.req.text}</small></button>`;
  R.ov.innerHTML=
    '<h1>Rain of the Word</h1>'+
    '<p class="tag">Ride the journey · outrun the last plague · complete the verse</p>'+
    `<div class="msec"><b>Boards</b><div class="bpv"><canvas id="bprev" width="440" height="150"></canvas><span id="bpn"></span></div><div class="row">${bPills}</div>`+
    `<div class="mline sub">Unlock new boards by travelling further, collecting verses and setting records.</div></div>`+
    `<div class="msec"><b>Difficulty</b><div class="row">${bs}</div></div>`+
    `<div class="msec"><b>Graphics</b><div class="row">${[['auto','Auto','adapts to your device'],['high','High','full-res sky &amp; bloom'],['medium','Medium','softer far layers'],['low','Low','fastest']].map(([k,n,d])=>`<button class="db${R.qualSet===k?' on':''}" data-q="${k}">${n}<small>${d}</small></button>`).join('')}</div></div>`+
    `<div class="msec"><b>Journey</b><div class="row"><select id="startSel" class="sel">`+
      `<option value="-2"${R.startPick===-2?' selected':''}>🌍 World Tour · starts in London</option>`+
      `<option value="-1"${R.startPick===-1?' selected':''}>🎲 Random order</option>`+
      R.LOC.map((l,i)=>`<option value="${i}"${R.startPick===i?' selected':''}>Start in ${l.n}</option>`).join('')+
    `</select></div><div class="mline">${M.tourNames().join(' &nbsp;·&nbsp; ')}</div>`+
    `<div class="mline sub">Every 10th level is the tsunami summit · tornadoes, earthquakes (fissures &amp; debris), lightning strikes, sandstorms, wildfires &amp; hail roam the land — each one is announced first · ⛒ medkits drop when you are critical</div></div>`+
    `<div class="msec"><b>Scripture Collection</b><div class="cbar"><i style="width:${pct}%"></i></div>`+
    `<div class="mline sub">${colCount} of ${R.V.length} verses collected</div>`+
    (colCount?`<details><summary>view collected verses</summary><div class="cvs">${pills}</div></details>`:'')+
    `</div>`+
    `<div class="mline ctr">The board runs by itself &nbsp;·&nbsp; Space / W / ↑ / tap = ollie (hold = higher; tap again in the air = trick) &nbsp;·&nbsp; S / ↓ / drag down = fast-fall &amp; manual &nbsp;·&nbsp; verse gates: ⬆ jump through the upper word, ⬇ stay low for the lower &nbsp;·&nbsp; low beams: stay on the ground &nbsp;·&nbsp; Shift focus &nbsp;·&nbsp; P pause &nbsp;·&nbsp; M mute</div>`+
    `<details class="msec"><summary><b>Trick list &amp; street guide</b></summary><div class="mline sub" style="text-align:left;line-height:1.7">`+
    `<b>Flips (in the air):</b> J Kickflip · K Heelflip · L 360 Shove-it · H Hardflip (or K+L) · V Varial Kickflip · T 360 Flip / Tre (or J+L)<br>`+
    `<b>Grabs (hold in the air, let go before landing):</b> G Indy · B Melon<br>`+
    `<b>Ground:</b> hold S / ↓ Manual · hold E Nose Manual<br>`+
    `<b>Grinds:</b> land on a rail = 50-50 · hold ↓ as you land on a rail, ledge or bench = Boardslide · A/D keep your balance<br>`+
    `<b>Bails:</b> slam (hit an obstacle face) · trip (wheels catch an edge, curb or pothole) · over-rotated (spin not finished) · primo (flip half done / grab still held)<br>`+
    `<b>Edge markers:</b> <span style="color:#6ef0a0">green</span> skateable (curb, ledge, bench, rail, stairs, kicker, gap) · <span style="color:#ff6046">red</span> hazard — ollie it or lose a heart · <span style="color:#82c8ff">blue</span> puddle</div></details>`+
    `<div class="mline sub ctr">📖 Bibles = points &amp; fill the ★ power meter (air Bibles need a jump) · ✦ trick cards auto-jump the next obstacle or gap · » speed pads &amp; trick landings = speed · 🌪 the last plague closes in when you crash or pick the wrong word · ★ power cards are earned (full meter or a perfect verse): 🛡 Shield · ⏳ Be still · 🏮 Lamp (Bible magnet) · ✦ Seek (shows the right gate word) · ❤️ Mercy · ⚡ Transformer</div>`+
    '<button id="go">Begin</button>';
  M.drawBoardPreviews();
  R.ov.querySelectorAll('.db[data-q]').forEach(b=>b.onclick=()=>{R.setQuality(b.dataset.q);M.buildMenu()});
  R.ov.querySelectorAll('.db[data-d]').forEach(b=>b.onclick=()=>{R.diff=+b.dataset.d;R.trySet('rotw-diff',R.diff);M.buildMenu()});
  R.ov.querySelectorAll('.db[data-b]').forEach(b=>{
    b.onclick=()=>{
      if(b.disabled)return;
      R.boardI=+b.dataset.b;R.trySet('rotw-board',R.boardI);M.buildMenu();
    };
  });
  const ss=document.getElementById('startSel');
  if(ss)ss.onchange=()=>{R.startPick=+ss.value;R.trySet('rotw-start',String(R.startPick));M.buildMenu()};
  document.getElementById('go').onclick=()=>M.start(false);
};


/* ---------- board previews in the menu (thumbnails + big spinning preview of the selected deck) ---------- */
M.boardDef=i=>i>=R.BOARDS.length?R.TRANSFORM:R.BOARDS[i];
M.drawBoardPreviews=function(){
  const pose=(def,spin,vp)=>({flipAngle:0,spinAngle:spin,tilt:0,deckColors:[def.art[1],def.art[2]],gripColor:'#1d1d22',look:def.look,vp});
  R.ov.querySelectorAll('canvas.bth').forEach(c=>{
    const def=M.boardDef(+c.dataset.bt),g=c.getContext('2d');g.clearRect(0,0,c.width,c.height);
    /* r6: distinct previews — each deck sits on its own colour glow, is shown three-quarter so the
       graphic reads, and carries speed / reach / jump bars so the boards differ at a glance */
    g.save();if(c.closest('.lk'))g.globalAlpha=.4;
    const rg=g.createRadialGradient(c.width/2,c.height*.6,2,c.width/2,c.height*.6,c.width*.55);
    rg.addColorStop(0,`rgba(${def.glow},.42)`);rg.addColorStop(1,`rgba(${def.glow},0)`);g.fillStyle=rg;g.fillRect(0,0,c.width,c.height);
    window.drawSkateboard(g,c.width*.42,c.height*.7,1.3,pose(def,-.85,.32));
    const st=[['S',def.speed],['R',def.reach],['J',def.jump]];
    g.font='bold 8px system-ui,sans-serif';g.textBaseline='middle';
    st.forEach(([l,v],i)=>{const y=9+i*10,x=c.width-40;g.fillStyle='rgba(255,255,255,.75)';g.fillText(l,x-9,y);
      g.fillStyle='rgba(255,255,255,.15)';g.fillRect(x,y-2.5,34,5);g.fillStyle=`rgb(${def.glow})`;g.fillRect(x,y-2.5,Math.max(2,Math.min(1,(v-.6)/.9)*34),5)});
    g.restore();
  });
  const big=document.getElementById('bprev'),nm=document.getElementById('bpn');
  if(!big)return;
  const def=M.boardDef(R.boardI);nm.textContent=def.n+' — '+def.desc;
  const g=big.getContext('2d');let t0=performance.now();
  const spin=()=>{
    if(!big.isConnected)return;
    const t=(performance.now()-t0)/1000,sp=-.55+Math.sin(t*.9)*.45;
    g.clearRect(0,0,big.width,big.height);
    const rg=g.createRadialGradient(220,118,4,220,118,150);rg.addColorStop(0,`rgba(${def.glow},.35)`);rg.addColorStop(1,`rgba(${def.glow},0)`);
    g.fillStyle=rg;g.save();g.translate(0,118);g.scale(1,.28);g.translate(0,-118);g.fillRect(0,0,440,300);g.restore();
    window.drawSkateboard(g,220,112,3.4,pose(def,sp,.5+Math.sin(t*.9)*.08));
    M._bprevT=requestAnimationFrame(spin);
  };
  cancelAnimationFrame(M._bprevT);spin();
};

/* ---------- location order (V2 picker + World Tour) ---------- */
R.startPick=(()=>{const v=R.tryGet('rotw-start');return v===null?-2:+v})();
if(!(R.startPick>=-2&&R.startPick<R.LOC.length))R.startPick=-2;
M.order=function(){
  const T=R.TOUR;
  if(R.startPick===-1){
    if(!M.rndOrder){M.rndOrder=T.slice();for(let i=M.rndOrder.length-1;i>0;i--){const j=Math.random()*(i+1)|0;[M.rndOrder[i],M.rndOrder[j]]=[M.rndOrder[j],M.rndOrder[i]]}}
    return M.rndOrder;
  }
  const s0=R.startPick>=0?Math.max(0,T.indexOf(R.startPick)):0;
  return T.slice(s0).concat(T.slice(0,s0));
};
M.locFor=lvl=>{const o=M.order();return o[(lvl-1)%o.length]};
M.tourNames=()=>M.order().map(i=>R.LOC[i].n);

/* ---------- flow ---------- */
M.pickWeather=function(lvl){
  if(lvl%10===0)return 'Tempest';
  const loc=R.LOC[M.locFor(lvl)];
  const opts=loc.wx.filter(n=>n!==R.wxSys.name());
  return opts.length?opts[Math.random()*opts.length|0]:loc.wx[0];
};
M.start=function(cont){
  if(M.grabFocus)M.grabFocus();
  R.audio.init();R.audio.resume();
  M.setPaused(false);
  R.best=+R.tryGet('rotw-best-'+R.diff)||0;R.runBest=false;R.newCol=false;
  R.maxHearts=R.DIFFS[R.diff].hearts;R.hearts=R.maxHearts;
  R.fMul=R.DIFFS[R.diff].fs;R.sMul=R.DIFFS[R.diff].sp;R.ccAdj=R.DIFFS[R.diff].cc;R.scoreMul=R.DIFFS[R.diff].mul;
  let bi=Math.max(0,Math.min(R.BOARDS.length,+R.tryGet('rotw-board')||0));
  if(!M.boardUnlocked(bi))bi=0;
  R.boardI=bi;
  let pick;
  if(cont&&R.checkpoint>1){
    /* continue from the last checkpoint: level kept, score reduced a quarter */
    R.lvl=R.checkpoint;
    /* r14: a saved level start resumes with its own score; the old checkpoint keeps its 25% penalty */
    R.score=R.resumeScore!=null?R.resumeScore:Math.round(R.cpScore*0.75);R.resumeScore=null;
    if(!R.stats)R.stats={waves:0,obst:0,med:0,chainBest:0,time:0,dist:0};R.chain=R.chain||0;
    R.locI=M.locFor(R.lvl);R.todSet(R.locI);M._todN='';R.todSet(R.locI);M._todN='';
    pick=M.pickWeather(R.lvl);
    if(R.lvl%10===0)R.forceShield=true;
  }else{
    if(R.startPick===-1)M.rndOrder=null;   /* fresh shuffle each new run */
    R.lvl=1;R.score=0;R.locI=M.locFor(1);R.todSet(R.locI);M._todN='';
    pick=R.LOC[R.locI].wx[0];
    R.chain=0;R.checkpoint=1;R.cpScore=0;
    R.stats={waves:0,obst:0,med:0,chainBest:0,time:0,dist:0};
    R.forceShield=false;
  }
  R.wxSys.setW(pick);
  R.streak=0;R.sShown=0;R.sLast=-1;
  R.env.buildAll();R.ground.build();R.rain.build();
  R.clearWorld();
  if(!cont)R.done=0;
  R.st='play';R.spawnT=0.7;R.waitT=0;R.ts=1;R.overT=0;
  R.transT=0;R.swapped=false;
  R.shake=0;R.flash=0;R.storm.bolt=null;R.storm.pulses=[];R.storm.timer=2.5;R.kick_=0;R.CA=0;
  R.shield=0;R.slowT=0;R.slowF=1;R.wideT=0;R.seekT=0;R.verseMiss=0;R.transformT=0;
  R.focusM=1;R.focusOn=false;R.focusT=0;
  R.disasters.arm();
  R.ground.resetObs();
  R.introT=1.8;
  R.tricks.reset();R.tricks.landed=0;R.tricks.bestCombo=0;
  M.titleCard('Now skating',R.LOC[R.locI].n,'Level '+R.lvl+' · '+(R.journey?R.journey.tagFor(R.lvl)+' · ':'')+R.WXN[R.wxI].n,2200);
  M.powsLast='§';R.powsEl.innerHTML='';
  R.prevPx=R.px=R.tx=R.journey?R.journey.anchorX():R.W/2;R.lean=0;if(R.skate)R.skate.reset();
  R.cam.whipV=0;R.cam.whipX=0;R.cam.punch=0;
  R.ov.style.display='none';R.pz.style.display='none';
  R.rev.style.opacity=0;
  M.loadVerse();
  if(R.journey){if(!cont)R.journey.resetRun();R.journey.startLevel()}
  if(!R.tryGet('rotw-h1k')){M.showHint(matchMedia('(pointer:coarse)').matches?'The board runs by itself — TAP to jump (hold = higher), drag DOWN to stay low. Outrun the last plague to the finish 🏁':'The board runs by itself — SPACE / ↑ to jump (hold = higher), ↓ to stay low. Outrun the last plague to the finish 🏁',7000);R.trySet('rotw-h1k','1')}
  if(!R.tryGet('rotw-h3k')){setTimeout(()=>{if(R.st==='play')M.showHint(matchMedia('(pointer:coarse)').matches?'Tap the FOCUS meter to slow the storm.':'Press SHIFT for Focus — slow the storm.',5000);R.trySet('rotw-h3k','1')},16000)}
};

/* advance to the next location: phase 1 closes the letterbox under a veil,
   phase 2 rebuilds the world behind it and reveals the new place */
M.beginTransition=function(){
  M.saveRecords();
  R.st='trans';R.transT=1.6;R.swapped=false;
  R.rev.style.opacity=0;
  R.audio.travel();
};
M.swapLocation=function(){
  R.lvl++;
  M.saveRecords();M.checkUnlocks();
  /* checkpoint every 5th level: enables "Continue" on the game-over screen */
  if(R.lvl%5===0&&R.lvl>R.checkpoint){R.checkpoint=R.lvl;R.cpScore=R.score;}
  R.locI=M.locFor(R.lvl);
  const pick=M.pickWeather(R.lvl);
  if(R.lvl%10===0)R.forceShield=true;
  R.wxSys.setW(pick);
  R.env.buildAll();
  R.ground.build();
  R.ground.resetObs();
  R.rain.build();
  R.clearWorld();
  R.cam.whip((R.lvl%2?1:-1));
  R.disasters.arm();
  M.loadVerse();
  if(R.journey)R.journey.startLevel();
  R.spawnT=0.9;
  /* title card */
  M.titleCard('Traveling to',R.LOC[R.locI].n,R.lvl%10===0
      ?'Level '+R.lvl+' · TSUNAMI SURVIVAL'
      :'Level '+R.lvl+' · '+(R.journey?R.journey.tagFor(R.lvl)+' · ':'')+R.wxSys.name(),1100);
  R.audio.arp([659,988],0.45,0.07);
};
M.finishTransition=function(){
  R.st='play';R.introT=0.9;R.swapped=false;
  R.transEl.classList.remove('show');
};

/* shared title card (#trans): travel cards and, from V2, the run-start card */
M.titleCard=function(kicker,name,sub,ms){
  if(!R.transEl)return;
  const em=R.transEl.querySelector('em');if(em)em.textContent=kicker;
  R.transLoc.textContent=name;R.transSub.textContent=sub;
  R.transEl.classList.add('show');
  clearTimeout(M.transCardT);
  M.transCardT=setTimeout(()=>R.transEl.classList.remove('show'),ms||1100);
};

/* ---------- pause / mute ---------- */
M.setPaused=function(v){
  if(v===R.paused)return;
  if(v&&!(R.st==='play'||R.st==='wait'||R.st==='trans'))return;
  R.paused=v;
  R.pz.style.display=v?'flex':'none';
  R.pb.textContent=v?'▶':'⏸';
  v?R.audio.suspend():R.audio.resume();
};
M.setMute=function(v){
  R.muted=v;R.trySet('rotw-mute',v?'1':'');
  R.audio.setMute(v);
  if(R.mb)R.mb.textContent=v?'🔇':'🔊';
};

/* ---------- HUD tick ---------- */
M.tickHud=function(dt){
  M.powsT-=dt;
  if(M.powsT<=0){
    M.powsT=0.25;
    let h='';
    if(R.shield)h+='<span class="pw" style="color:#9fe8ff;border-color:rgba(127,232,255,.45)">🛡 Shield</span>';
    if(R.slowT>0)h+='<span class="pw" style="color:#c9b8ff;border-color:rgba(179,157,255,.45)">⏳ '+Math.ceil(R.slowT)+'s</span>';
    if(R.wideT>0)h+='<span class="pw" style="color:#ffd98a;border-color:rgba(255,217,138,.45)">🏮 '+Math.ceil(R.wideT)+'s</span>';
    if(R.seekT>0)h+='<span class="pw" style="color:#b8ff8a;border-color:rgba(184,255,138,.45)">✦ Seek '+Math.ceil(R.seekT)+'s</span>';
    if(R.transformT>0)h+='<span class="pw" style="color:#ffb347;border-color:rgba(255,170,80,.55)">⚡ '+Math.ceil(R.transformT)+'s</span>';
    if(R.chain>0)h+='<span class="pw" style="color:#5ff2e6;border-color:rgba(95,242,230,.5)">⛓ ×'+M.chainMult().toFixed(1)+'</span>';
    if(h!==M.powsLast){M.powsLast=h;R.powsEl.innerHTML=h}
    R.focEl.style.opacity=(R.st==='play'||R.st==='wait'||R.st==='trans')?1:0.3;
  }
  const fw=Math.round(R.focusM*100);
  if(fw!==M.focLast){M.focLast=fw;R.focFill.style.width=fw+'%'}
};

/* ---------- update ---------- */
M.update=function(dt){
  /* r6 time of day clock (runs while skating a place) */
  if(R.st==='play'||R.st==='wait'){R.todClock+=dt;const tn=R._tod&&R._tod.n;if(tn&&tn!==M._todN){M._todN=tn;R.locEl.textContent=R.LOC[R.locI].n+' · '+tn}}
  R.t+=dt;R.dt=dt;
  R.introT=Math.max(0,R.introT-dt);
  R.lbH+=((R.st==='trans'
    ?(R.transT>R.transDur*0.5?0.24:0.09)
    :R.st==='wait'?0.085:R.introT>0?0.075:0.035)+(R.tricks.slowHold>0?0.06:0)-R.lbH)*Math.min(1,dt*3);
  R.CA=Math.max(0,R.CA-dt*10);
  R.wxSys.update(dt);
  /* score readout */
  R.sShown+=(R.score-R.sShown)*Math.min(1,dt*7);
  if(Math.abs(R.score-R.sShown)<.6)R.sShown=R.score;
  const v=Math.round(R.sShown);
  if(v!==R.sLast){R.sLast=v;R.sEl.textContent=v}
  /* world scroll */
  R.zs+=dt*R.ts*(0.9+R.lvl*0.06)*(R.journey?R.journey.mul:1);
  if(R.st==='play'){R.stats.time+=dt;R.stats.dist+=Math.abs(R.vel)*dt*0.06;}
  R.wRot+=dt*R.ts*(10+R.lvl*0.6);
  R.bPulse=Math.max(0,R.bPulse-dt*2.2);
  R.bRed=Math.max(0,R.bRed-dt*2.2);
  M.tickHud(dt);
  /* player */
  /* player: momentum, pushing, friction, carving (skate.js) */
  R.skate.move(dt);
  /* jump physics run before collisions: a fresh jump lifts the board this frame */
  R.board.update(dt);
  R.tricks.update(dt);
  /* time scale + focus + power-ups */
  R.ts+=(1-R.ts)*Math.min(1,dt*2.6);
  if(R.focusOn){
    R.focusT-=dt;R.focusM=Math.max(0,R.focusM-dt/2.6);
    if(R.focusT<=0||R.focusM<=0)R.focusOn=false;
  }
  R.slowT=Math.max(0,R.slowT-dt);R.wideT=Math.max(0,R.wideT-dt);R.seekT=Math.max(0,R.seekT-dt);
  R.transformT=Math.max(0,R.transformT-dt);
  let sT=(R.focusOn&&R.slowT>0)?0.36:(R.focusOn?0.4:R.slowT>0?0.45:1);
  if(R.tricks.slowHold>0)sT=Math.min(sT,0.3);   /* big-landing slow-mo beat */
  R.slowF+=(sT-R.slowF)*Math.min(1,dt*4);
  /* decays */
  R.shake=Math.max(0,R.shake-dt*1.7);
  R.kick_=Math.max(0,R.kick_-dt*1.8);
  R.cam.update(dt);
  /* systems */
  R.env.update(dt);
  R.storm.update(dt);
  R.disasters.update(dt);
  R.rain.update(dt);
  R.ground.update(dt);
  if(R.journey)R.journey.update(dt);
  R.fx.update(dt);
  /* rolling sound */
  if(R.audio.ready()&&(R.st==='play'||R.st==='wait'||R.st==='trans')){
    R.stepT-=dt;
    if(R.stepT<=0){
      R.stepT=30/(70+R.lvl*3);
      R.step++;
      if(R.step%2===0&&R.lvl>1)R.audio.kick();
      if(R.step%2===1&&R.lvl>=5)R.audio.noise(7000,'highpass',0.045,0.07);
      if(R.step%4===0&&R.lvl>=3)R.audio.tone([220,262,330,392,440][Math.random()*5|0],'sine',1.0,0.035);
    }
  }
  /* spawning */
  if(R.st==='play'){
    R.spawnT-=dt*R.slowF;
    if(R.spawnT<=0){
      /* r6 smooth ramp: interval eases toward 0.5 s; a second card phases in gradually from level 12
         (was: linear to a 0.42 s floor at level 14 then an abrupt double-spawn at 16) */
      const n=Math.random()<Math.min(.55,Math.max(0,(R.lvl-12)/30))?2:1;
      /* r7 journey: words no longer rain from the sky — they live on verse gates along the road (journey.js) */
      void n;
      R.spawnT=(0.5+0.75*Math.exp(-(R.lvl-1)/9))*R.sMul;
      /* bombs rain down from level 5: rare, glowing, devastating */
      if(!R.journey&&R.lvl>=5&&R.bombs.length<3&&R.disasters.bombsAllowed()&&Math.random()<0.09+R.lvl*0.005)R.ent.spawnBomb();   /* r8: no bombs — the auto-run cannot dodge sideways */
    }
  }
  /* wait → transition → next place */
  if(R.st==='wait'){
    R.waitT-=dt;
    if(R.waitT<=0.55)R.rev.style.opacity=0;
    if(R.waitT<=0)M.beginTransition();
  }
  if(R.st==='trans'){
    R.transT-=dt;
    if(!R.swapped&&R.transT<=R.transDur*0.5){R.swapped=true;M.swapLocation()}
    if(R.transT<=0)M.finishTransition();
  }
  if(R.st==='dying'){
    R.overT-=dt;
    if(R.overT<=0)M.gameOver();
  }
  R.ent.update(dt);
  R.ent.updateBombs(dt);
};

/* ---------- bombs ---------- */
M.bombHit=function(x,caught){
  if(R.st!=='play')return;
  R.fx.burst(x,R.gy-30*R.S,'rgba(255,150,60,0.95)',60,520);
  R.fx.burst(x,R.gy-30*R.S,'rgba(40,40,50,0.9)',30,300);
  R.fx.flashScreen('rgba(255,120,50,.5)');
  R.audio.noise(80,'lowpass',0.6,1.6);
  R.audio.kick();
  R.shake=1.4;R.CA=8;R.fx.hitStop(0.16);R.cam.punchFn(1.4);
  M.breakChain();
  const near=caught||Math.abs(x-R.px)<90*R.S;
  if(!near){ return; }
  if(R.shield>0){
    R.shield=0;
    R.fx.shieldRipples.push({ox:x-R.px,oy:-30,r:18*R.S,a:1});
    R.fx.flyTexts.push({w:'Shield saved you!',x:R.px,y:R.gy-70*R.S,t:0,col:'127,232,255'});
    R.audio.arp([392,523],0.3,0.1);
    return;
  }
  const dmg=R.diff===0?1:(R.diff===1?2:R.hearts);
  R.hearts=Math.max(0,R.hearts-dmg);
  R.streak=0;R.bRed=1;
  R.fx.flyTexts.push({w:caught?'BOOM!':'BOMB!',x:R.px,y:R.gy-70*R.S,t:0,col:'255,120,60'});
  R.vibrate([90,60,90]);
  if(R.hearts<=0){R.st='dying';R.overT=1.4}
  M.renderVerse();
};

/* ---------- loop ---------- */
/* round 5: fixed 60 Hz simulation + interpolated rendering. The sim always advances by real time
   (no slow motion below 30 fps), and the board is drawn between the last two sim states. */
const STEP=1/60;let last=performance.now(),acc=0;
M.steps=0;
function loop(now){
  requestAnimationFrame(loop);
  const raw=Math.min(0.1,(now-last)/1000);
  if(R.paused){last=now;acc=0;return}
  last=now;
  /* r5b: an input that changed the board (ollie) gets at least one sim step and an un-interpolated draw
     this very frame, and cancels any hit-stop freeze, so the take-off is visible on the next rendered frame */
  const kick=M.kick;M.kick=0;
  if(kick){R.hitStop=0;acc=Math.max(acc,STEP)}
  if((R.W!==innerWidth||R.H!==innerHeight)&&(innerWidth>10&&innerHeight>10))R.resize();
  R.fAvg+=(raw-R.fAvg)*0.08;
  R.qAdapt(raw);   /* r6: adaptive quality (drops and recovers) */
  if(R.hitStop>0){
    R.hitStop-=raw;
    R.t+=raw*0.2;
    R.cam.update(raw*0.5);
    R.draw();
    return;
  }
  acc+=raw;
  let n=0,ppx=R.px,pjy=R.board.jy;
  while(acc>=STEP&&n<6){ppx=R.px;pjy=R.board.jy;M.update(STEP);acc-=STEP;n++;M.steps++}
  if(n===6)acc=0;
  /* interpolate the visible board between sim states (skip across teleports) */
  const a=n?acc/STEP:1,cx_=R.px,cy_=R.board.jy;
  if(n&&!kick&&Math.abs(cx_-ppx)<R.W*0.2){R.px=ppx+(cx_-ppx)*a;R.board.jy=pjy+(cy_-pjy)*a}
  R.draw();
  R.px=cx_;R.board.jy=cy_;
}

/* ---------- boot ---------- */
M.init();
R.resize();
R.verse={parts:[],txt:'',ref:''};
M.setMute(R.tryGet('rotw-mute')==='1');
M.buildMenu();
requestAnimationFrame(loop);
})();
