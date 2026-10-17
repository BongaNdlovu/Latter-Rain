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

  R.pb.onclick=e=>{e.stopPropagation();M.setPaused(!R.paused)};
  R.mb.onclick=e=>{e.stopPropagation();M.setMute(!R.muted)};
  $('ob').onclick=e=>{e.stopPropagation();M.photoMode()};
  $('jb').onclick=e=>{e.stopPropagation();R.board.jump()};
  [R.pb,R.mb,$('ob'),$('jb')].forEach(b=>b.addEventListener('pointerdown',e=>e.stopPropagation()));
  /* swipe up = jump */
  let swY=null,swT=0;
  addEventListener('pointerdown',e=>{swY=e.clientY;swT=performance.now()},{passive:true});
  addEventListener('pointerup',e=>{
    if(swY!=null&&performance.now()-swT<350&&swY-e.clientY>60)R.board.jump();
    swY=null;
  },{passive:true});
  $('pr').onclick=()=>M.setPaused(false);
  $('prn').onclick=()=>{M.setPaused(false);M.start()};
  $('pp').onclick=()=>M.photoMode();
  $('pm').onclick=()=>{M.setPaused(false);M.buildMenu()};
  document.addEventListener('visibilitychange',()=>{if(document.hidden){R.keys.l=R.keys.r=0;M.setPaused(true)}});
  addEventListener('blur',()=>{R.keys.l=R.keys.r=0;M.setPaused(true)});

  /* input */
  const setPointer=e=>{
    const x=(e.touches&&e.touches[0])?e.touches[0].clientX:e.clientX;
    if(typeof x==='number')R.tx=R.clamp(x,R.W*0.07,R.W*0.93);
  };
  addEventListener('pointermove',setPointer,{passive:true});
  addEventListener('pointerdown',setPointer,{passive:true});
  addEventListener('touchmove',e=>{if(e.touches[0])setPointer(e)},{passive:true});
  addEventListener('keydown',e=>{
    const k=e.key;
    if(k==='ArrowLeft'||k==='a'||k==='A')R.keys.l=1;
    if(k==='ArrowRight'||k==='d'||k==='D')R.keys.r=1;
    const tog=k==='p'||k==='P'||k==='Escape'||k==='m'||k==='M'||k==='o'||k==='O'||k==='Shift'||k===' '||k==='Enter'||k==='ArrowUp'||k==='w'||k==='W';
    if(e.repeat&&tog)return;
    if(k==='ArrowUp'||k==='w'||k==='W'){R.board.jump();return}
    if(k==='p'||k==='P'||k==='Escape'){M.setPaused(!R.paused);return}
    if(k==='m'||k==='M'){M.setMute(!R.muted);return}
    if(k==='o'||k==='O'){M.photoMode();return}
    if(k==='Shift'&&R.st==='play'){M.toggleFocus();return}
    if(k===' '||k==='Enter'){
      if(R.st==='menu'||R.st==='over'){e.preventDefault();M.start()}
      else if(k===' '&&R.st==='play'){e.preventDefault();M.toggleFocus()}
    }
  },{passive:false});
  addEventListener('keyup',e=>{
    const k=e.key;
    if(k==='ArrowLeft'||k==='a'||k==='A')R.keys.l=0;
    if(k==='ArrowRight'||k==='d'||k==='D')R.keys.r=0;
  });
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
M.loadVerse=function(){
  let i;
  if(R.lvl-1<R.V.length)i=R.lvl-1;
  else{do{i=Math.random()*R.V.length|0}while(i===R.lastIdx)}
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
M.renderVerse=function(){
  if(!R.verse||!R.verse.parts.length){R.vEl.innerHTML=''}
  else{
    R.vEl.innerHTML=R.verse.parts.map(p=>
      p.b?`<span class="b${p.f?' f'+(p.fresh?' n':''):(p.m?' m':'')}">${p.f?p.w:'_____'}</span>`:p.w
    ).join('')+`<small>${R.verse.ref}</small>`;
    R.verse.parts.forEach(p=>p.fresh=0);
    const tot=R.verse.parts.reduce((n,p)=>n+(p.b?1:0),0),
          got=R.verse.parts.reduce((n,p)=>n+(p.b&&p.f?1:0),0);
    R.barEl.style.width=(tot?Math.round(got/tot*100):0)+'%';
  }
  R.hEl.innerHTML=heartsHTML();
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
  R.tx=R.clamp(R.px-Math.sign(o.x-R.px||1)*46*R.S,R.W*0.07,R.W*0.93);
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
  if(R.focusM>=0.25&&R.st==='play'){
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
    stat(R.stats.waves,'Waves ridden')+
    stat(R.stats.obst,'Obstacles cleared')+
    stat(R.stats.med,'Medkits')+
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
  R.shield=0;R.slowT=0;R.slowF=1;R.wideT=0;R.seekT=0;R.transformT=0;R.disasters.ev=null;R.disasters.pending=null;
  R.clearWorld();
  R.score=0;R.sShown=0;R.sLast=-1;R.sEl.textContent='0';R.streak=0;R.lvl=1;R.done=0;
  R.locI=0;
  let bi=Math.max(0,Math.min(R.BOARDS.length,+R.tryGet('rotw-board')||0));
  if(!M.boardUnlocked(bi))bi=0;
  R.boardI=bi;
  R.env.buildAll();R.ground.build();R.ground.resetObs();R.rain.build();
  R.maxHearts=R.DIFFS[R.diff].hearts;R.hearts=R.maxHearts;
  R.best=+R.tryGet('rotw-best-'+R.diff)||0;
  R.hEl.innerHTML=heartsHTML();R.ltEl.textContent='Level 1';R.locEl.textContent=R.LOC[0].n;R.barEl.style.width='0%';
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
    return `<button class="db${i===R.boardI?' on':''}" data-b="${i}"${un?'':' disabled'}>${un?'':'🔒 '}${b.n}<small>${un?b.desc:b.req.text}</small></button>`;
  }).join('')+
    `<button class="db${R.boardI===R.BOARDS.length?' on':''}" data-b="${R.BOARDS.length}"${tUnlocked?'':' disabled'}>${tUnlocked?'⚡':'🔒 ⚡'} Transformer<small>${tUnlocked?R.TRANSFORM.desc:R.TRANSFORM.req.text}</small></button>`;
  R.ov.innerHTML=
    '<h1>Rain of the Word</h1>'+
    '<p class="tag">Skate the storm · catch the verse · survive the sky</p>'+
    `<div class="msec"><b>Boards</b><div class="row">${bPills}</div>`+
    `<div class="mline sub">Unlock new boards by travelling further, collecting verses and setting records.</div></div>`+
    `<div class="msec"><b>Difficulty</b><div class="row">${bs}</div></div>`+
    `<div class="msec"><b>Journey</b><div class="mline">${R.LOC.map(l=>l.n).join(' &nbsp;·&nbsp; ')}</div>`+
    `<div class="mline sub">Every 10th level is the tsunami summit · storms, tornadoes, quakes &amp; hail roam the land · ⛒ medkits drop when you are critical</div></div>`+
    `<div class="msec"><b>Scripture Collection</b><div class="cbar"><i style="width:${pct}%"></i></div>`+
    `<div class="mline sub">${colCount} of ${R.V.length} verses collected</div>`+
    (colCount?`<details><summary>view collected verses</summary><div class="cvs">${pills}</div></details>`:'')+
    `</div>`+
    `<div class="mline ctr">A·D / arrows move &nbsp;·&nbsp; W / ↑ jump &nbsp;·&nbsp; Space focus &nbsp;·&nbsp; P pause &nbsp;·&nbsp; O snapshot &nbsp;·&nbsp; M mute</div>`+
    `<div class="mline sub ctr">Specials: 🛡 Shield · ⏳ Be still · 🏮 Lamp unto my feet · ✦ Seek · ❤️ Mercy · ⚡ Transformer</div>`+
    '<button id="go">Begin</button>';
  R.ov.querySelectorAll('.db[data-d]').forEach(b=>b.onclick=()=>{R.diff=+b.dataset.d;R.trySet('rotw-diff',R.diff);M.buildMenu()});
  R.ov.querySelectorAll('.db[data-b]').forEach(b=>{
    b.onclick=()=>{
      if(b.disabled)return;
      R.boardI=+b.dataset.b;R.trySet('rotw-board',R.boardI);M.buildMenu();
    };
  });
  document.getElementById('go').onclick=()=>M.start(false);
};

/* ---------- flow ---------- */
M.pickWeather=function(lvl){
  if(lvl%10===0)return 'Tempest';
  const loc=R.LOC[(lvl-1)%R.LOC.length];
  const opts=loc.wx.filter(n=>n!==R.wxSys.name());
  return opts.length?opts[Math.random()*opts.length|0]:loc.wx[0];
};
M.start=function(cont){
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
    R.score=Math.round(R.cpScore*0.75);
    R.locI=(R.lvl-1)%R.LOC.length;
    pick=M.pickWeather(R.lvl);
    if(R.lvl%10===0)R.forceShield=true;
  }else{
    R.lvl=1;R.score=0;R.locI=0;
    pick=R.LOC[0].wx[0];
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
  M.powsLast='§';R.powsEl.innerHTML='';
  R.prevPx=R.W/2;R.px=R.tx=R.W/2;R.lean=0;
  R.cam.whipV=0;R.cam.whipX=0;R.cam.punch=0;
  R.ov.style.display='none';R.pz.style.display='none';
  R.rev.style.opacity=0;
  M.loadVerse();
  if(!R.tryGet('rotw-h1')){M.showHint('Catch the glowing words that complete the verse — avoid the rest!',6000);R.trySet('rotw-h1','1')}
  if(!R.tryGet('rotw-h3')){setTimeout(()=>{if(R.st==='play')M.showHint('Press SPACE for Focus — slow the storm.',5000);R.trySet('rotw-h3','1')},8000)}
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
  R.locI=(R.lvl-1)%R.LOC.length;
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
  R.spawnT=0.9;
  /* title card */
  if(R.transEl){
    R.transLoc.textContent=R.LOC[R.locI].n;
    R.transSub.textContent=R.lvl%10===0
      ?'Level '+R.lvl+' · TSUNAMI SURVIVAL'
      :'Level '+R.lvl+' · '+R.wxSys.name();
    R.transEl.classList.add('show');
    clearTimeout(M.transCardT);
    M.transCardT=setTimeout(()=>R.transEl.classList.remove('show'),1100);
  }
  R.audio.arp([659,988],0.45,0.07);
};
M.finishTransition=function(){
  R.st='play';R.introT=0.9;R.swapped=false;
  R.transEl.classList.remove('show');
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
  R.t+=dt;R.dt=dt;
  R.introT=Math.max(0,R.introT-dt);
  R.lbH+=((R.st==='trans'
    ?(R.transT>R.transDur*0.5?0.24:0.09)
    :R.st==='wait'?0.085:R.introT>0?0.075:0.035)-R.lbH)*Math.min(1,dt*3);
  R.CA=Math.max(0,R.CA-dt*10);
  R.wxSys.update(dt);
  /* score readout */
  R.sShown+=(R.score-R.sShown)*Math.min(1,dt*7);
  if(Math.abs(R.score-R.sShown)<.6)R.sShown=R.score;
  const v=Math.round(R.sShown);
  if(v!==R.sLast){R.sLast=v;R.sEl.textContent=v}
  /* world scroll */
  R.zs+=dt*R.ts*(0.9+R.lvl*0.06);
  if(R.st==='play'){R.stats.time+=dt;R.stats.dist+=Math.abs(R.vel)*dt*0.06;}
  R.wRot+=dt*R.ts*(10+R.lvl*0.6);
  R.bPulse=Math.max(0,R.bPulse-dt*2.2);
  R.bRed=Math.max(0,R.bRed-dt*2.2);
  M.tickHud(dt);
  /* player */
  R.prevPx=R.px;
  const spd=R.board.def().speed;
  if(R.keys.l)R.tx-=R.W*0.95*dt*spd;
  if(R.keys.r)R.tx+=R.W*0.95*dt*spd;
  R.tx=R.clamp(R.tx,R.W*0.07,R.W*0.93);
  R.px+=(R.tx-R.px)*Math.min(1,dt*11*spd);
  R.vel=(R.px-R.prevPx)/Math.max(dt,0.0001);
  const leanT=R.clamp(R.vel/(R.W*0.9),-1,1);
  R.lean+=(leanT-R.lean)*Math.min(1,dt*9);
  /* jump physics run before collisions: a fresh jump lifts the board this frame */
  R.board.update(dt);
  /* time scale + focus + power-ups */
  R.ts+=(1-R.ts)*Math.min(1,dt*2.6);
  if(R.focusOn){
    R.focusT-=dt;R.focusM=Math.max(0,R.focusM-dt/2.6);
    if(R.focusT<=0||R.focusM<=0)R.focusOn=false;
  }
  R.slowT=Math.max(0,R.slowT-dt);R.wideT=Math.max(0,R.wideT-dt);R.seekT=Math.max(0,R.seekT-dt);
  R.transformT=Math.max(0,R.transformT-dt);
  const sT=(R.focusOn&&R.slowT>0)?0.36:(R.focusOn?0.4:R.slowT>0?0.45:1);
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
      const n=R.lvl>=16?2:1;
      for(let i=0;i<n;i++)R.ent.spawnCard();
      R.spawnT=Math.max(0.42,(1.25-R.lvl*0.06)*R.sMul);
      /* bombs rain down from level 5: rare, glowing, devastating */
      if(R.lvl>=5&&R.bombs.length<3&&Math.random()<0.09+R.lvl*0.005)R.ent.spawnBomb();
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
let last=performance.now();
function loop(now){
  requestAnimationFrame(loop);
  const raw=Math.min(0.05,(now-last)/1000);
  if(R.paused){last=now;return}
  last=now;
  /* viewport heartbeat: catch viewports that settled without a resize event */
  if((R.W!==innerWidth||R.H!==innerHeight)&&(innerWidth>10&&innerHeight>10))R.resize();
  R.fAvg+=(raw-R.fAvg)*0.08;
  const dt=Math.min(0.033,raw*0.4+R.fAvg*0.6);
  if(R.fAvg>0.024){R.qt+=raw;if(R.qt>2.5)R.Q=0.6}else R.qt=Math.max(0,R.qt-raw);
  /* hit-stop: freeze the world, keep a breath of camera life */
  if(R.hitStop>0){
    R.hitStop-=raw;
    R.t+=raw*0.2;
    R.cam.update(raw*0.5);
    R.draw();
    return;
  }
  M.update(dt);
  R.draw();
}

/* ---------- boot ---------- */
M.init();
R.resize();
R.verse={parts:[],txt:'',ref:''};
M.setMute(R.tryGet('rotw-mute')==='1');
M.buildMenu();
requestAnimationFrame(loop);
})();
