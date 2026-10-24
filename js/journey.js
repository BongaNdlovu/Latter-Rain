/* Rain of the Word — journey (round 8): every level is a run to a finish line, Vector-style.
   · The board AUTO-RUNS (no steering). You ollie, fast-fall and trick; the world does the rest.
   · "The last plague" (a storm wall) chases from behind and genuinely gains: every crash, wrong word and
     slowdown lets it close in; speed pads and trick landings (flow) pull you away. If it reaches you it costs a heart.
   · A level DIRECTOR lays the road out in patterns (single, pair, trio, gap run, low beam, Bible arcs, kicker,
     speed pad, verse gate) with spacing worked out from jump air-time and run speed, seeded per level so every
     level is a different course, with a level theme (Rail yard, Gap run, Boost run, Low bridge, ...).
   · Trick cards sit just before most obstacles and gaps: roll through one and the board auto-tricks over (or onto) it.
   · Low beams: stay on the ground. Verse gates: jump through the UPPER word or stay low for the LOWER one.
   · Bibles = points (air Bibles need a jump) and charge the earned power-card meter.
   No more raining words. Disasters, weather, places and boards are untouched. */
window.ROW=window.ROW||{};
(function(){
'use strict';
const R=ROW,M=R.main;
const GAP0=36,GAPMAX=50;
const J=R.journey={items:[],mul:1,gap:GAP0,dist:0,bib:0,bibTot:0,meter:0,need:20,boostT:0,slowT:0,autoT:0,
  gatesTot:0,gatesDone:0,vLeft:0,vTot:0,vDone:0,state:'idle',front:0,sinceGate:0,secLen:3,padD:30,powerQ:0,
  stats:{gatesOk:0,gatesBad:0,caught:0,tricks:0,pads:0,powers:0,bibles:0,beams:0},log:[]};
J.GAP0=GAP0;
const CM=()=>1.95*R.S;                    /* 1 cm in px (deck 80 cm) */
const PXM=()=>100*R.S;                    /* journey metre in px */
const G_=()=>2450*R.S;
const kW=()=>Math.max(.5,Math.min(1,R.W/(1000*R.S)));
const nom=()=>(600+R.lvl*22)*R.S*kW();     /* the level's nominal run speed (px/s), independent of slow-mo */
J.versesFor=lvl=>Math.min(6,2+Math.floor((lvl-1)/3));      /* 2,2,2,3,3,3,4,4,4,5,... */
const baseSpeed=R.ground.roadSpeed;
R.ground.roadSpeed=()=>baseSpeed()*J.mul;
J.baseSpeed=baseSpeed;
const playing=()=>R.st==='play'&&!R.paused;
const blanks=()=>R.verse&&R.verse.parts?R.verse.parts.filter(p=>p.b):[];
const clamp=R.clamp;

/* ---------- state queries used by the other modules ---------- */
J.active=()=>J.state==='run'||J.state==='done';
J.locked=()=>J.state!=='idle'&&R.st!=='menu';
J.blockObs=()=>J.state!=='idle';
J.boostK=()=>clamp((J.mul-1)/.6,0,1.2);
J.feel=()=>J.boostK()*1.5;
/* the journey runs LEFT → RIGHT: the board starts near the left edge and travels across the screen to the finish line
   at the right as the level progresses, with the plague behind it (to the left) and the world rolling past */
J.progS=0;
J.prog=()=>J.state==='done'?1:clamp((J.gatesDone+Math.min(.92,J.sinceGate/(J.secLen+1)))/Math.max(1,J.gatesTot),0,.97);
const portrait=()=>R.W<R.H;
J.anchorX=()=>R.W*((portrait()?.2:.13)+(portrait()?.22:.4)*J.progS+.04*clamp(J.boostK(),0,1));
/* items spawn a little further right as the board advances, so they always give the same warning time */
const edge=()=>R.W+100*R.S+R.W*(portrait()?.22:.4)*J.progS;

/* ---------- seeded level layout ---------- */
let rs=1;
function rn(){rs=(rs+0x6D2B79F5)|0;let t=Math.imul(rs^rs>>>15,1|rs);t=(t+Math.imul(t^t>>>7,61|t))^t;return((t^t>>>14)>>>0)/4294967296}
J.runSeed=(Math.random()*1e9)|0;
const MODS=[
  {n:'Open road'},
  {n:'Rooftops',   roofs:2.2},
  {n:'Rail yard',  w:{rail:5,ledge:3,bench:3,curb:2,stairs:3,dock:3}},
  {n:'Gap run',    w:{gap:6,pothole:2},gaps:3},
  {n:'Boost run',  pad:2.4,arcs:1.5},
  {n:'Low bridge', bar:3},
  {n:'Obstacle course',dbl:1.9},
  {n:'Skate park', w:{kicker:5,ledge:2,rail:2},arcs:2,kick:5}
];
J.modIdx=lvl=>lvl<=1?0:1+((lvl*5+((M&&M.locFor)?M.locFor(lvl):0))%(MODS.length-1));
J.tagFor=lvl=>lvl%10===0?'Tsunami summit':MODS[J.modIdx(lvl)].n;

/* ---------- jump numbers (match skate.js S.pop with a plain tap) ---------- */
const jumpPeak=()=>(68+42*R.skate.speedN()+27.5)*R.S*R.board.def().jump*R.skate.jumpMul();
const jumpAir=pk=>2*Math.sqrt(2*pk/G_());

/* ---------- level setup ---------- */
J.runId=0;J.startLevel=function(){J.runId++;
  J.items.length=0;J.mul=1;J.boostT=0;J.slowT=0;J.autoT=0;J.dist=0;J.gap=GAP0;J.state='run';
  J.vTot=J.versesFor(R.lvl);J.vLeft=J.vTot-1;J.vDone=0;
  J.queue=[];for(let i=0;i<J.vLeft;i++){const k=M.nextVerseIdx();R.lastIdx=k;J.queue.push(k)}
  const nb=i=>(R.V[i][0].match(/\[/g)||[]).length;
  J.gatesTot=nb(R.verse.idx)+J.queue.reduce((n,i)=>n+nb(i),0);J.gatesDone=0;
  rs=(R.lvl*7919+R.locI*104729+J.runSeed)|0;
  J.mod=MODS[J.modIdx(R.lvl)];
  J.progS=0;if(R.st!=='menu')R.px=R.tx=R.prevPx=J.anchorX();
  J.atkT=R.lvl<=1?22:Math.max(7,12-R.lvl*.3);J.smT=0;J.ts=1;DR.x=-400*R.S;DR.vx=0;DR.shown=0;J.lt=0;
  document.body.classList.add('vec');
  J.front=R.W+700*R.S;J.sinceGate=0;J.secLen=newSec();J.padD=34+rn()*30;J.powerQ=0;
  J.need=Math.min(40,20+Math.round(1.5*R.lvl));
  J.finishSpawned=false;J.wantFinish=false;J.caughtT=0;J.autoAir=0;J.inAuto=false;J.pat=0;
};
const newSec=()=>Math.max(1,Math.round(2.1-R.lvl*.06+rn()*1.5));

/* ---------- the director ---------- */
function add(it){it.x=it.x==null?R.W+100*R.S:it.x;it.dead=false;J.items.push(it);return it}
const spaceMin=()=>nom()*(.95-Math.min(.3,R.lvl*.012))+140*R.S;
const gapAfter=()=>spaceMin()*(1+rn()*.45);
const holdSpawn=()=>{const D=R.disasters;return D&&(D.ev||(D.pending&&D.pending.t<4.5))};
const flatOK=()=>R.LOC[R.locI].ground!=='water';
function pickType(){
  const L=R.LOC[R.locI],G=R.ground,lv=R.lvl;
  let t=(G.OB_TYPES[L.ground]||['rock']).concat(G.THEME[L.sky]||[]).filter(x=>x!=='vend'&&x!=='kicker'&&x!=='puddle'&&x!=='tire');
  if((L.ground==='asphalt'||L.ground==='flagstone'||L.ground==='cobble')&&t.indexOf('gap')<0)t.push('gap');
  const hard=lv<=1?['gap','stairs','rail','dock','barrier','bin','chair','cart','barrel','pothole','skip','tank','ventstack','generator']:lv<=2?['gap','barrier','chair']:[];
  const f=t.filter(x=>hard.indexOf(x)<0);if(f.length)t=f;
  const w=J.mod.w||{};
  for(const k in w){const n=t.filter(x=>x===k).length;if(n||k==='gap'&&t.indexOf('gap')>=0)for(let i=n;i<w[k];i++)t.push(k)}
  return t[rn()*t.length|0];
}
const pCard=()=>R.lvl<=3?.92:.85;
const cardable=o=>o.kind==='haz'||o.type==='gap'||o.type==='pothole'||o.land;
const modeOf=o=>(o.land&&o.w>230*R.S&&o.type!=='gap')?'land':'over';
const leadOf=(o,m)=>m==='land'?Math.max(160*R.S,nom()*.5):Math.max(90*R.S,nom()*.26);
/* place an obstacle whose trick card (if any) sits at x; returns the obstacle and the right edge of the whole group */
function placeOb(type,x,allowCard){
  const o=R.ground.spawnOb(type);if(!o)return null;
  const m=modeOf(o),withCard=allowCard&&cardable(o)&&rn()<pCard();
  if(withCard){const ld=leadOf(o,m);add({k:'trick',ob:o,x,h:30*CM(),mode:m,roll:o.roll||1});o.x=x+ld+o.w/2}
  else o.x=x+70*R.S+o.w/2;
  o.hasCard=withCard;
  return {o,card:withCard,cardX:x,end:o.x+o.w/2};
}
function bibleLine(x,n,hcm,step){for(let i=0;i<n;i++)add({k:'bible',x:x+i*(step||46)*CM(),h:hcm*CM(),ph:rn()*6.28})}
/* r13 Bible arcs ride the real jump curve: the board stays put on screen while the world scrolls, so a jump traces a
   parabola in the world. Bibles are laid along it — the trick-ring hop when a ring sits before the obstacle,
   otherwise a plain ollie from the natural take-off point — at the board's own height, so one clean jump collects
   the whole arc. */
function jumpCurve(xTake,base,v,n,t0,t1){
  const g=G_(),sp=nom(),c=CM();
  for(let i=0;i<n;i++){const t=t0+(t1-t0)*i/(n-1);add({k:'bible',x:xTake+sp*t,h:base+v*t-.5*g*t*t+18*c,ph:rn()*6.28})}
}
function arcFor(o,cardX,base){
  base=base||0;const g=G_(),sp=nom(),c=CM(),S=R.S;
  if(cardX!=null){
    /* the same plan J.autoTrick makes when the board rolls through the ring */
    const far=(o.x+Math.max(o.w,o.full||0)/2+46*S)-cardX;
    const Tair=Math.min(.98,Math.max(.72,(far/sp)*1.2+.08));
    const h=Math.max(0,o.h-base),v=Math.max(g*Tair/2,Math.sqrt(2*g*(h+34*c))),T=2*v/g;
    jumpCurve(cardX,base,v,5,T*.16,T*.84);
  }else{
    const pk=jumpPeak(),v=Math.sqrt(2*g*pk),T=2*v/g;
    jumpCurve(o.x-sp*T/2,base,v,5,T*.16,T*.84);      /* apex over the obstacle's centre */
  }
}

/* --- patterns: each takes the x where it may start and returns the x of its right edge --- */
function pSingle(x0,type){
  const r=placeOb(type||pickType(),x0,true);if(!r)return x0+300*R.S;
  if(r.card?rn()<.6:rn()<.85)arcFor(r.o,r.card?r.cardX:null,0);
  return r.end;
}
function pPair(x0){
  const r1=placeOb(pickType(),x0,true);if(!r1)return x0;
  if(rn()<.45)arcFor(r1.o,r1.card?r1.cardX:null,0);
  const r2=placeOb(pickType(),r1.end+spaceMin()*.95,true);if(!r2)return r1.end;
  if(rn()<.5)arcFor(r2.o,r2.card?r2.cardX:null,0);
  return r2.end;
}
function pTrio(x0){
  let x=x0,end=x0;
  const types=['cone','crate','rock','stump','pot','block','log','mound','icerock','buoy','barrel'],pool=(R.ground.OB_TYPES[R.LOC[R.locI].ground]||[]).filter(t=>types.indexOf(t)>=0);
  for(let i=0;i<3;i++){
    const t=pool.length?pool[rn()*pool.length|0]:'cone';
    const r=placeOb(t,x,true);if(!r)break;
    end=r.end;x=r.end+spaceMin()*.8;
    if(i===1)arcFor(r.o,r.card?r.cardX:null,0);
  }
  return end;
}
/* r9 terrain: rooftops (raised blocks), wide gaps and bridge decks are obstacles in R.ground.obs, so skate.js
   handles them (support, faces, one-way decks) and js/vector.js draws them as Vector-style silhouettes */
function structure(type,x,w,h,extra){
  const o=R.ground.spawnOb(type==='gap'?'gap':'ledge');if(!o)return null;
  o.type=type;o.w=w;o.h=h;o.x=x+w/2;o.kind='skate';o.land=type!=='gap';
  if(extra)Object.assign(o,extra);
  return o;
}
function cardAt(o,x,base,mode){add({k:'trick',ob:o,x,h:(base||0)+30*CM(),base:base||0,mode,roll:1})}
function gapAt(x,base,minT,spanT){
  const w=Math.max(110*R.S,nom()*(minT+rn()*spanT));
  const o=structure('gap',x,w,0);if(!o)return null;
  return o;
}
function pGap(x0){
  const card=rn()<pCard(),gx=x0+(card?leadOf(null,'over'):70*R.S);
  const o=gapAt(gx,0,.26,J.mod.gaps?.24:.18);if(!o)return x0+300*R.S;
  o.hasCard=card;if(card)cardAt(o,x0,0,'over');
  arcFor(o,card?x0:null,0);
  return gx+o.w;
}
function pRoof(x0){
  const pk=jumpPeak(),h=pk*(.3+rn()*.3),len=nom()*(1+rn()*1.1);
  const card=rn()<pCard(),rx=x0+(card?leadOf(null,'land'):90*R.S);
  const o=structure('roof',rx,len,h,{seed:rn()});if(!o)return x0+300*R.S;
  o.hasCard=card;if(card)cardAt(o,x0,0,'land');
  bibleLine(rx+len*.3,4,h/CM()+22,46);
  if(R.vec)add({k:'decor',x:rx+len*(.15+rn()*.7),base:h,kind:R.vec.decorFor(true,rn),seed:rn(),back:1});
  let end=rx+len,top=h;
  const r2=rn();
  if(r2<.35&&R.lvl>=2){
    /* a second tier: step up (trick card on the roof carries you onto it) or step down */
    const up=rn()<.5,h2=Math.max(pk*.22,Math.min(pk*.95,h+(up?1:-1)*pk*(.18+rn()*.2))),len2=nom()*(.8+rn()*.8);
    const o2=structure('roof',end,len2,h2,{seed:rn()});
    if(o2&&h2>h&&rn()<pCard()){o2.hasCard=true;cardAt(o2,end-leadOf(null,'land'),h,'land')}
    if(o2){bibleLine(end+len2*.35,3,h2/CM()+22,46);end+=len2;top=h2}
  }else if(r2<.75&&R.lvl>=2){
    /* the roof ends at a gap: jump it back down to street level */
    const g=gapAt(end,top,.22,.14);
    if(g){const cx0=end-leadOf(null,'over')-10*R.S,cd=rn()<pCard();if(cd){g.hasCard=true;cardAt(g,cx0,top,'over')}arcFor(g,cd?cx0:null,top);end+=g.w}
  }
  return end;
}
function pFire(x0){
  const r=placeOb('fire',x0,true);if(!r)return x0+300*R.S;
  if(!R.tryGet('rotw-jf')){M.showHint('Fire on the route — jump it (or roll through the trick ring before it)',5000);R.trySet('rotw-jf','1')}
  return r.end;
}
/* r11 indoor sections: ride off a rooftop through a broken facade, drop to the floor inside, ride through the rooms
   (furniture to jump, a ceiling over your head), and out the far side */
function pRoom(x0){
  const pk=jumpPeak(),cb=pk*1.42,len=nom()*(2.6+rn()*1.4),bh=cb+(170+rn()*140)*R.S;
  let x=x0+60*R.S;
  if(rn()<.6){
    const ra=pk*(.3+rn()*.12),lenA=nom()*(.9+rn()*.5),ca=rn()<pCard(),rx=x0+(ca?leadOf(null,'land'):90*R.S);
    const a=structure('roof',rx,lenA,ra,{seed:rn()});if(a&&ca){a.hasCard=true;cardAt(a,x0,0,'land')}
    if(a)x=rx+lenA;
  }
  const room=structure('room',x,len,bh,{bot:cb,seed:rn(),style:rn()});if(!room)return x+len;
  const types=['desk','sofa','boxes','cabinet'];
  let fx=x+nom()*.9;
  for(let k=0;k<2&&fx<x+len-nom()*.9;k++){
    const r=placeOb(types[rn()*types.length|0],fx,true);if(!r)break;
    fx=r.end+spaceMin()*.9;
  }
  bibleLine(x+len*.12,4,22,46);
  if(!R.tryGet('rotw-jr')){M.showHint('Inside! Mind the ceiling — small hops only, and jump the furniture',5000);R.trySet('rotw-jr','1')}
  return x+len+60*R.S;
}
function pBar(x0){
  const w=150*R.S,x=x0+330*R.S,bot=50*CM();
  add({k:'bar',x,w,bot,used:false});
  bibleLine(x-70*CM(),4,22,46);                 /* the reward for staying low */
  if(!R.tryGet('rotw-jb')){M.showHint('Low beam ahead — do NOT jump: stay on the ground and roll under it',5500);R.trySet('rotw-jb','1')}
  return x+w/2+50*R.S;
}
function pBibles(x0){
  const sp=nom();
  if(rn()<.6){const pk=jumpPeak(),g=G_(),v=Math.sqrt(2*g*pk),T=2*v/g;add({k:'mark',x:x0+60*R.S});jumpCurve(x0+60*R.S,0,v,6,T*.12,T*.88)}   /* ollie at the mark, the arc is your jump */
  else bibleLine(x0+60*R.S,5,24,46);                  /* an easy ground line */
  return x0+sp*.8;
}
function pKicker(x0){
  const r=R.ground.spawnOb('kicker');if(!r)return x0+300*R.S;
  r.x=x0+70*R.S+r.w/2;
  const sp=nom(),v=sp*.9+180*R.S,T=2*v/G_(),g=G_(),x1=r.x+r.w/2;
  for(let i=0;i<5;i++){const t=T*(.18+.64*i/4);add({k:'bible',x:x1+sp*t,h:v*t-.5*g*t*t+8*R.S,ph:rn()*6.28,raw:1})}
  return x1+sp*T;
}
function pPad(x0){
  const w=130*CM(),x=x0+80*R.S+w/2;
  add({k:'pad',x,w});bibleLine(x-w/2+14*CM(),4,20,26);
  if(!R.tryGet('rotw-jp')){M.showHint('» Speed pad — roll over it on the ground for a burst that pulls you away from the storm',5000);R.trySet('rotw-jp','1')}
  return x+w/2+nom()*1.7;
}
function pPower(x0){
  add({k:'power',x:x0+80*R.S,h:70*CM()});return x0+200*R.S;
}
function pGate(x0){
  const p=blanks().find(q=>!q.f&&!q.g);if(!p)return null;
  p.g=1;
  const verseWords=new Set((R.verse.txt||'').toLowerCase().match(/[a-z']+/g)||[]);
  const pool=R.DECOY.filter(w=>!verseWords.has(w.toLowerCase())&&w!==p.w.toLowerCase());
  const wrong=pool[rn()*pool.length|0]||'storm';
  /* a bridge fork: OVER the deck (ollie onto it) or UNDER it (stay on the street). The deck top sits at 68% of a
     tap ollie, its underside leaves room for the board to roll beneath. */
  const up=rn()<.5,pk=jumpPeak(),T=jumpAir(pk),sp=nom(),ht=pk*.68,th=24*R.S,len=sp*1.3;
  const dl=x0+sp*T*.45+240*R.S;
  const deck=structure('deck',dl,len,ht,{bot:ht-th,seed:rn()});if(!deck)return null;
  const gx=dl+len*.55;
  add({k:'gate',x:gx,part:p,up:up?p.w:wrong,down:up?wrong:p.w,ans:up?'up':'down',pk,T,sp,ht,bot:ht-th,
    tko:dl-sp*T*.45-gx,dlo:dl-gx,dro:dl+len-gx,done:false,res:null,t:0,t2:0});
  bibleLine(dl+len*.15,3,ht/CM()+22,46);bibleLine(dl+len*.15,3,22,46);
  J.sinceGate=0;J.secLen=newSec();
  if(!R.tryGet('rotw-jg3')){M.showHint('Verse bridge! JUMP onto the bridge for the UPPER word, or stay LOW and roll under it for the LOWER word — take the one that completes the verse',7500);R.trySet('rotw-jg3','1')}
  return dl+len+80*R.S;
}
function build(x0){
  if(J.wantFinish&&!J.finishSpawned){J.finishSpawned=true;add({k:'finish',x:x0+260*R.S});return x0+400*R.S}
  if(J.powerQ>0){J.powerQ--;return pPower(x0)}
  if(J.padD<=0&&J.sinceGate>0&&J.state==='run'){J.padD=(80+rn()*70)/(J.mod.pad||1);J.sinceGate++;return pPad(x0)}
  const canGate=blanks().some(q=>!q.f&&!q.g);
  if(canGate&&J.sinceGate>=J.secLen){const e=pGate(x0);if(e!=null)return e}
  const L=R.lvl,m=J.mod;J.sinceGate++;J.pat++;
  const opts=[
    /* r9: Vector-style courses are mostly rooftops and the gaps between them, with street props in between */
    [pSingle,3.5],
    [pPair,L>=3?2*(m.dbl||1):0],
    [pTrio,L>=6?1.2*(m.dbl||1):0],
    [pGap,flatOK()?(m.gaps?5.5:3):0],
    [pRoof,(flatOK()?5.5:3)*(m.roofs||1)],
    [pBar,L>=2?1.2*(m.bar||1):0],
    [pFire,L>=2?1.3:0],
    [pRoom,L>=3&&flatOK()&&(!R.vec||R.vec.kind()==='city')?Math.min(2.6,.5+.18*L):0],
    [pBibles,1.2*(m.arcs||1)],
    [pKicker,L>=2&&(R.ground.OB_TYPES[R.LOC[R.locI].ground]||[]).indexOf('kicker')>=0?(m.kick||.8):0]
  ];
  let tot=0;for(const o of opts)tot+=o[1];
  let r=rn()*tot,fn=pSingle;
  for(const o of opts){if(r<o[1]){fn=o[0];break}r-=o[1]}
  /* never two beams or two kickers back to back */
  if(fn===J.lastFn&&(fn===pBar||fn===pKicker||fn===pBibles||fn===pRoom||fn===pFire))fn=pSingle;
  J.lastFn=fn;
  return fn(x0);
}

/* disaster hazards (fissure, quake chunk, fire) get a trick card too, so the auto-run stays fair */
J.add=add;J.rn=rn;
J.cardFor=function(o,wFull){
  if(!J.active()||!o||o.hasCard||Math.random()>.85)return;
  o.hasCard=true;
  const w=wFull||o.w,ld=leadOf(o,'over');
  add({k:'trick',ob:o,x:o.x-w/2-ld,h:30*CM(),mode:'over',roll:1});
};
J.earnPower=function(why){
  J.meter=0;J.stats.powers++;J.powerQ++;
  M.showWarn('★ Power card earned — '+why+'! Jump for it ahead');
  R.audio.arp([523,784,1046],0.4,0.12);
};

/* ---------- update ---------- */
/* r11 slow motion: the whole simulation runs on J.ts (1 = normal). At each verse bridge the world eases down to a third
   for 2 real seconds so both words can be read and the choice made. */
J.ts=1;J.smT=0;
const mUpdate=M.update;M.update=function(dt){return mUpdate.call(this,dt*(J.ts||1))};
J.slowMo=function(){
  J.smT=2;if(R.sfx)R.sfx.slowIn();else R.audio.whoosh();R.CA=Math.max(R.CA,2);
  if(R.vEl){R.vEl.classList.remove('sm');void R.vEl.offsetWidth;R.vEl.classList.add('sm')}
};
/* r11 weather from above: fog banks and hail roll in at random from level 2 (they slow you and set the mood) */
J.wx=null;J.wxK=0;J.wxT=30;
function weatherTick(realDt){
  const X=R.sfx;
  if(X){X.wind(J.wx&&J.wx.type==='fog'?J.wxK:J.wx&&J.wx.type==='hail'?J.wxK*.35:0);
    if(J.wx&&J.wx.type==='hail'&&Math.random()<realDt*22*J.wxK)X.hailTick();
    const f=R.ground.obs.find(o=>o.type==='fire'&&o.x>-60&&o.x<R.W+60);
    if(f&&Math.random()<realDt*6)X.crackle(clamp(1-Math.abs(f.x-R.px)/(R.W*.7),.15,1))}
  if(J.wx){
    const w=J.wx;w.t+=realDt;
    J.wxK=clamp(Math.min(w.t/1.6,(w.dur-w.t)/1.6),0,1);
    if(w.type==='hail')R.wxSys.hailBoost=Math.max(R.wxSys.hailBoost,.25);
    if(w.t>=w.dur){J.wx=null;J.wxK=0;J.wxT=28+Math.random()*26}
  }else if(R.st==='play'&&J.state==='run'&&R.lvl>=2){
    J.wxT-=realDt;
    if(J.wxT<=0&&!holdSpawn()){
      const type=Math.random()<.5?'fog':'hail';
      J.wx={type,t:0,dur:11+Math.random()*6};
      M.showWarn(type==='fog'?'☁ Fog rolls in from above — keep your eyes ahead':'⛆ Hail from above — it slows you down');
      R.audio.noise(type==='fog'?300:3000,type==='fog'?'lowpass':'highpass',.4,1.2);
    }
  }
}
J.update=function(dt){
  if(!(R.st==='play'||R.st==='wait'))return;
  const realDt=dt/(J.ts||1);
  const smWas=J.smT>0;J.smT=Math.max(0,J.smT-realDt);if(smWas&&J.smT<=0&&R.sfx)R.sfx.slowOut();
  J.ts+=((J.smT>0?.33:1)-J.ts)*Math.min(1,realDt*(J.smT>0?7:3));
  if(J.smT>0)R.lbH+=(.1-R.lbH)*Math.min(1,realDt*4);
  weatherTick(realDt);
  const S=R.skate,B=R.board,c=CM(),Sx=R.S;
  J.boostT=Math.max(0,J.boostT-dt);J.slowT=Math.max(0,J.slowT-dt);J.autoT=Math.max(0,J.autoT-dt);J.caughtT=Math.max(0,J.caughtT-dt);
  let tgt=1;
  if(J.boostT>0)tgt*=1.6;
  if(J.slowT>0)tgt*=.7;
  if(S.crash)tgt*=.35;
  if(R.st==='wait')tgt*=.6;
  if(J.wx)tgt*=1-(J.wx.type==='hail'?.18:.1)*J.wxK;
  J.mul+=(tgt-J.mul)*Math.min(1,dt*(tgt>J.mul?5:3.5));
  const spd=R.ground.roadSpeed(),bs=baseSpeed();
  const dm=spd*dt/PXM();
  const x=R.px;
  J.progS+=(J.prog()-J.progS)*Math.min(1,dt*.8);
  if(R.st==='play'){
    J.dist+=dm;
    /* the last plague: nominal pace plus a pressure that grows with the level, so it is always gaining unless you pull away */
    const rate=1+(1.2+.05*R.lvl)*PXM()/Math.max(1,nom());
    /* the plague holds back while a disaster owns the screen (no pads or trick cards to fight it with) */
    const calm=holdSpawn()?.3:1;
    J.gap=Math.min(GAPMAX,J.gap+dm-bs*dt/PXM()*(1+(rate-1)*calm));
    if(J.gap<=0)J.caught();
    /* the director */
    J.front-=spd*dt;J.padD-=dm;
    const ed=edge();
    if(holdSpawn()||J.finishSpawned)J.front=Math.max(J.front,ed);
    else{
      let guard=0;
      while(J.front<=ed&&guard++<2&&!J.finishSpawned){
        const x0=Math.max(J.front,ed);
        const end=build(x0);
        J.front=end+gapAfter();
        if(R.vec)R.vec.fill(end,J.front,rn);
      }
    }
  }
  /* flow: landing an auto-trick feeds the run speed */
  if(J.inAuto){
    if(!B.grounded)J.autoAir+=dt;
    else if(J.autoAir>.25){J.inAuto=false;if(!S.crash){J.boostT=Math.max(J.boostT,1);R.fx.flyTexts.push({w:'Flow »',x:R.px,y:R.gy-130*c,t:0,col:'95,242,230',small:1})}}
    else if(J.autoAir>0)J.inAuto=false;
  }
  /* move + resolve */
  let n=0;const A=J.items;
  for(let i=0;i<A.length;i++){
    const it=A[i];
    const mv=spd*dt*(it.roll||1);
    it.x-=mv;it.t=(it.t||0)+dt;
    if(R.st==='play'&&!it.used){
      const dx=it.x-x;
      if(it.k==='bible'){
        const mag=R.wideT>0&&Math.abs(dx)<260*Sx;
        if(mag){it.x-=dx*Math.min(1,dt*7);it.h+=((B.jy+20*c)-it.h)*Math.min(1,dt*7)}
        if(!mag&&Math.abs(dx)<90*Sx&&Math.abs(it.h-(B.jy+18*c))<70*c&&!S.crash)it.h+=((B.jy+18*c)-it.h)*Math.min(1,dt*6);
        if(Math.abs(it.x-x)<46*Sx&&Math.abs(it.h-(B.jy+18*c))<38*c&&!S.crash){it.used=1;J.gotBible(it)}
      }else if(it.k==='trick'){
        if(Math.abs(dx)<44*Sx&&B.jy<(it.base||0)+70*c&&!S.crash&&!S.grind){it.used=1;J.autoTrick(it.ob,it.mode)}
      }else if(it.k==='pad'){
        if(Math.abs(dx)<it.w/2&&B.jy<14*c&&!S.crash){it.used=1;J.boost()}
      }else if(it.k==='power'){
        if(Math.abs(dx)<44*Sx&&Math.abs(it.h-(B.jy+18*c))<30*c&&!S.crash){it.used=1;J.gotPower(it)}
      }else if(it.k==='bar'){
        if(Math.abs(dx)<it.w/2+34*Sx&&!S.crash&&B.jy+16*c>it.bot){it.used=1;J.hitBar(it)}
        else if(dx<-(it.w/2+34*Sx)){it.used=1;J.stats.beams++;M.addScore(40);R.tricks.gain(25,true);
          R.fx.flyTexts.push({w:'Low! +40',x:R.px,y:R.gy-70*c,t:0,col:'150,240,220',small:1})}
      }else if(it.k==='gate'){
        if(!it.sm&&!it.done&&dx<R.W*.55){it.sm=1;J.slowMo()}
        if(!it.done&&dx<=0)J.resolveGate(it,S.crash?0:B.jy);
      }else if(it.k==='finish'){
        if(it.x<=x){it.used=1;J.finish()}
      }
    }
    if(it.done)it.t2+=dt;
    if(it.used&&it.k!=='gate'&&it.k!=='finish'&&it.k!=='pad'&&it.k!=='bar'){it.fade=(it.fade||0)+dt*4;if(it.fade>=1)it.dead=true}
    if(it.x<-300*Sx)it.dead=true;
    if(!it.dead)A[n++]=it;
  }
  A.length=n;
  J.droneTick(dt,realDt);
  J.hudT=(J.hudT||0)-dt;if(J.hudT<=0){J.hudT=.15;J.hud()}
};

/* ---------- events ---------- */
J.gotBible=function(it){
  J.bib++;J.bibTot++;J.stats.bibles++;J.meter++;
  M.addScore(10*M.mult());R.tricks.gain(5,true);
  R.fx.burst(it.x,R.gy-it.h,'rgba(255,217,138,.95)',10,160);
  R.audio.tone(1046+((J.bib%5)*120),'sine',0.12,0.06);
  if(J.meter>=J.need)J.earnPower(J.need+' Bibles collected');
};
/* trick card: plan a jump that clears (or lands on) the obstacle that follows, with a trick sized to the air time */
J.autoTrick=function(o,mode){
  const B=R.board,S=R.skate,T=R.tricks,c=CM();
  if(S.crash)return;
  const g=G_(),spd=Math.max(60*R.S,R.ground.roadSpeed()*(o&&o.roll||1));
  let v,Tair;
  if(o&&!o.dead&&mode==='land'&&o.land){
    /* land on the top of a long ledge/bench/rail/stairs, 30% in (a rail starts a grind) */
    const xl=o.x-o.w/2+Math.min(o.w*.3,110*R.S);
    Tair=Math.max(.7,(xl-R.px)/spd);
    const dh=o.h-B.jy;
    v=(dh+.5*g*Tair*Tair)/Tair;
    while(v*v/(2*g)<dh+22*c){Tair+=.05;v=(dh+.5*g*Tair*Tair)/Tair}
  }else{
    const far=o&&!o.dead?(o.x+o.w/2+46*R.S)-R.px:150*R.S;
    const h=Math.max(0,(o?o.h:40*c)-B.jy);
    Tair=Math.min(.98,Math.max(.72,(far/spd)*1.2+.08));
    v=Math.max(g*Tair/2,Math.sqrt(2*g*(h+34*c)));
  }
  /* indoors the jump must stay under the ceiling */
  for(const q of R.ground.obs){if(q.type==='room'&&q.x-q.w/2<R.px+420*R.S&&q.x+q.w/2>R.px-40*R.S){const vmax=Math.sqrt(2*g*Math.max(40*R.S,q.bot-34*R.S-B.jy));if(v>vmax){v=vmax;Tair=Math.min(Tair,2*v/g)}}}
  const ids=['kick','heel','shove','varial','hard','tre'];
  let id=ids[Math.random()*ids.length|0];
  const flight=2*v/g;
  if(T.DEFS[id].d>flight-.16)id='kick';
  if(S.grind)S.endGrind(true);
  B.jv=v;B.grounded=false;B.jy=Math.max(B.jy,2*R.S);S.coyote=0;S.buf=0;S.airT=0;S.popT=0;S.pitchV=7.5;S.sup0=B.jy;S.airMax=B.jy;S.jl=1;
  if(R.main)R.main.kick=1;
  if(o)o.trickSafe=1;
  J.autoT=flight+.3;J.stats.tricks++;J.inAuto=true;J.autoAir=0;
  T.manual=false;T.grab=null;T.queue=null;
  T.trk=Object.assign({},T.DEFS[id],{t:0});
  S.jumps.push({h:Math.round((v*v/(2*g))/c),c:0,auto:1});if(S.jumps.length>30)S.jumps.shift();
  J.log.push({lvl:R.lvl,ob:o&&o.type,mode,trick:id,v:Math.round(v),T:+flight.toFixed(2)});if(J.log.length>40)J.log.shift();
  R.fx.flyTexts.push({w:T.DEFS[id].n,x:R.px,y:R.gy-B.jy-80*R.S,t:0,col:'255,170,215',small:1});
  R.audio.whoosh();R.audio.arp([659,988],0.25,0.1);
  R.fx.burst(R.px,R.gy-B.jy,'rgba(255,79,163,.9)',22,240);
  R.vibrate(14);
};
J.boost=function(){
  J.boostT=2.4;J.stats.pads++;
  M.addScore(25);
  R.fx.flyTexts.push({w:'Boost »',x:R.px,y:R.gy-R.board.jy-80*R.S,t:0,col:'95,242,230',small:1});
  R.audio.whoosh();R.audio.tone(330,'sawtooth',.35,.06);R.audio.tone(660,'sine',.4,.07,.08);
  R.cam.punchFn(.5);R.CA=Math.max(R.CA,3);R.vibrate(16);
};
J.hitBar=function(it){
  const o={x:it.x,w:it.w,h:it.bot,type:'bar',scored:false,kind:'haz'};
  R.skate.obstacleCrash(o,'slam','hit the low beam');
  R.fx.burst(it.x,R.gy-it.bot,'rgba(255,200,60,.95)',26,320);
};
J.gotPower=function(it){
  const pool=['shield','slow','wide','heart','seek'];if(R.lvl>=4)pool.push('transform');
  const p=pool[Math.random()*pool.length|0];
  M.applyPow(p,{x:it.x,y:R.gy-it.h});J.lastPow=p;M.renderVerse();
};
J.resolveGate=function(it,h){
  it.done=true;
  const dir=it.bot!=null?(h>=it.bot-2*R.S?'up':'down'):(h>.34*it.pk?'up':'down');
  it.res=dir;
  const p=it.part;
  if(dir===it.ans){
    it.ok=1;J.stats.gatesOk++;
    p.f=1;p.fresh=1;R.bPulse=1;R.streak++;M.addScore(100*M.mult());
    R.focusM=Math.min(1,R.focusM+0.09);J.gap=Math.min(GAPMAX,J.gap+4);
    R.audio.chime();R.vibrate(22);
    const y=R.gy-(dir==='up'?(it.ht||it.pk)+60*R.S:40*R.S);
    R.fx.burst(it.x,y,'#ffd98a',44);R.fx.rings.push({x:it.x,y,r:8,a:1});
    R.fx.flyTexts.push({w:p.w,x:it.x,y,t:0});
    R.kick_=1;R.CA=Math.max(R.CA,2.5);R.fx.hitStop(0.06);R.cam.punchFn(0.6);
    R.fx.flashScreen('rgba(255,200,90,.2)');
  }else{
    it.ok=0;J.stats.gatesBad++;
    p.f=1;p.m=1;p.fresh=1;R.verseMiss++;R.streak=0;
    J.slowT=1.6;J.gap-=10;
    R.fx.flyTexts.push({w:'Wrong way — “'+p.w+'”',x:R.px,y:R.gy-130*CM(),t:0,col:'255,120,90',small:1});
    if(R.shield>0){
      R.shield=0;R.fx.flashScreen('rgba(110,220,255,.3)');
      R.fx.flyTexts.push({w:'Shield!',x:R.px,y:R.gy-90*CM(),t:0,col:'127,232,255'});
      R.audio.noise(1400,'bandpass',0.4,0.3);
    }else{
      R.hearts--;R.bRed=1;M.breakChain();
      R.audio.stab();R.vibrate([60,40,60]);
      R.hEl.classList.remove('hit');void R.hEl.offsetWidth;R.hEl.classList.add('hit');
      R.shake=1;R.CA=6;R.fx.hitStop(0.1);R.cam.punchFn(1);
      R.fx.flashScreen('rgba(255,30,40,.34)');
      if(R.hearts<=0){R.st='dying';R.overT=1.2}
    }
  }
  J.gatesDone++;
  if(!blanks().some(q=>!q.f))J.verseComplete();
  M.renderVerse();
};
J.verseComplete=function(){
  if(R.verseMiss===0)R.chain++;else R.chain=0;
  R.stats.chainBest=Math.max(R.stats.chainBest,R.chain);
  const cm=M.chainMult();
  M.addScore(250*M.mult()*cm);
  if(R.verseMiss===0){
    const b=Math.round(150*M.mult()*cm);M.addScore(b);
    R.fx.flyTexts.push({w:'It is written · Perfect +'+b,x:R.W/2,y:R.H*0.30,t:0,col:'255,217,138'});
    R.audio.arp([784,1046,1318,1568],0.5,0.11);
  }
  if(!R.col[R.verse.idx]){R.col[R.verse.idx]=1;R.newCol=true;R.trySet('rotw-col',JSON.stringify(R.col))}
  R.done++;J.vDone++;
  R.tricks.gain(100,true);R.focusM=Math.min(1,R.focusM+0.15);
  M.checkUnlocks();
  if(R.score>R.best){R.best=R.score;R.runBest=true;R.trySet('rotw-best-'+R.diff,R.best)}
  R.rev.innerHTML=`“${R.verse.txt}”<small>${R.verse.ref}</small>`;R.rev.style.opacity=1;
  clearTimeout(J.revT);J.revT=setTimeout(()=>{if(R.st==='play')R.rev.style.opacity=0},2600);
  {const id=J.runId;if(R.verseMiss===0&&R.st==='play')setTimeout(()=>{if(R.st==='play'&&J.runId===id)J.earnPower('perfect verse')},900);}
  if(J.queue&&J.queue.length){
    const k=J.queue.shift();
    {const id=J.runId;setTimeout(()=>{if(R.st==='play'&&J.runId===id&&J.state==='run'){M.loadVerse(k);J.sinceGate=Math.max(J.sinceGate,J.secLen-1)}},1800);}
  }else{
    J.wantFinish=true;
    M.showWarn('🏁 Verses complete — the finish line is ahead!');
  }
};
J.finish=function(){
  J.state='done';
  M.addScore(Math.round(200+J.gap*6));
  R.fx.flyTexts.push({w:'Finish! storm lead '+Math.round(J.gap)+'m +'+Math.round(200+J.gap*6),x:R.W/2,y:R.H*0.36,t:0,col:'150,240,220'});
  R.audio.arp([523,659,784,1046,1318],0.5,0.12);R.fx.flashScreen('rgba(255,255,255,.3)');
  R.tricks.banner('Level complete','#ffd98a');
  for(const col of ['#ffd98a','#5ff2e6','#ff4fa3','#ffffff'])R.fx.burst(R.px+40*R.S,R.gy-130*CM(),col,26,560);
  R.waitT=Math.max(1.6,2.4-R.lvl*0.04);R.st='wait';
  if(R.score>R.best){R.best=R.score;R.runBest=true;R.trySet('rotw-best-'+R.diff,R.best)}
};
J.caught=function(){
  J.stats.caught++;J.gap=18;J.caughtT=1.2;
  R.fx.flashScreen('rgba(40,0,30,.6)');R.shake=1.4;R.CA=8;R.audio.thunder&&R.audio.thunder(0,1,0);
  R.fx.flyTexts.push({w:'The drone catches you!',x:R.W/2,y:R.H*0.4,t:0,col:'255,90,120'});
  if(R.shield>0){R.shield=0;R.fx.flyTexts.push({w:'Shield!',x:R.px,y:R.gy-90*CM(),t:0,col:'127,232,255'});return}
  R.hearts--;R.streak=0;R.bRed=1;M.breakChain();R.vibrate([80,50,80]);
  R.hEl.classList.remove('hit');void R.hEl.offsetWidth;R.hEl.classList.add('hit');
  if(R.hearts<=0){R.st='dying';R.overT=1.2}
  M.renderVerse();
};
/* crashes (obstacles, waves) let the plague gain on you */
const hO=M.hitObstacle;M.hitObstacle=function(o){if(R.st==='play'&&!(R.shield>0))J.gap-=8;return hO.apply(this,arguments)};
const hW=M.hitWave;M.hitWave=function(w){if(R.st==='play'&&!(R.shield>0))J.gap-=8;return hW.apply(this,arguments)};
/* a trick card's obstacle can never crash you while its auto-trick is in the air */
const oc=R.skate.obstacleCrash;R.skate.obstacleCrash=function(o){if(o&&o.trickSafe&&J.autoT>0){if(o.type==='gap'||o.type==='fissure'){const B=R.board;B.jv=Math.max(B.jv,520*R.S);B.grounded=false;B.jy=Math.max(B.jy,0)}else o.scored=true;return}const r=oc.apply(this,arguments);if(o&&(o.type==='gap'||o.type==='fissure')&&J.locked())J.skipPast(o);return r};
/* r9: after a fall the board is put back on the route just past the gap (the plague has gained meanwhile) */
J.skipPast=function(o){
  const d=(o.x+Math.max(o.w,o.full||0)/2+60*R.S)-R.px;if(!(d>0))return;
  for(const q of R.ground.obs)q.x-=d;
  for(const it of J.items)it.x-=d;
  J.front-=d;
  if(R.ground.medkit)R.ground.medkit.x-=d;
  R.board.jy=0;R.board.jv=0;R.board.grounded=true;
  R.fx.flashScreen('rgba(20,10,30,.5)');R.cam.whip(1);
  R.fx.flyTexts.push({w:'Back on the route',x:R.px,y:R.gy-110*CM(),t:0,col:'200,200,255',small:1});
};

/* ---------- drawing (world space, camera applied) ---------- */
const spr={};
function bibleSprite(){
  if(spr.b)return spr.b;
  const s=72,cv=document.createElement('canvas');cv.width=cv.height=s;const g=cv.getContext('2d');
  const rg=g.createRadialGradient(s/2,s/2,2,s/2,s/2,s/2);rg.addColorStop(0,'rgba(170,110,255,.45)');rg.addColorStop(1,'rgba(170,110,255,0)');
  g.fillStyle=rg;g.fillRect(0,0,s,s);
  /* closed book: violet glass cover with a bright edge, page block and cross */
  g.save();g.shadowColor='rgba(190,130,255,1)';g.shadowBlur=10;
  g.fillStyle='rgba(120,60,230,.85)';g.beginPath();g.roundRect?g.roundRect(23,18,26,34,3):g.rect(23,18,26,34);g.fill();
  g.strokeStyle='rgba(235,220,255,1)';g.lineWidth=2;g.stroke();g.restore();
  g.fillStyle='rgba(245,236,255,.9)';g.fillRect(47,21,3,28);
  g.fillStyle='#fff';g.fillRect(34.5,24,3,18);g.fillRect(30,29,12,3);
  spr.b=cv;return cv;
}
function cardSprite(key,col,glyph,label){
  if(spr[key])return spr[key];
  const w=92,h=122,cv=document.createElement('canvas');cv.width=w;cv.height=h;const g=cv.getContext('2d');
  const rr=(x,y,ww,hh,r)=>{g.beginPath();g.moveTo(x+r,y);g.arcTo(x+ww,y,x+ww,y+hh,r);g.arcTo(x+ww,y+hh,x,y+hh,r);g.arcTo(x,y+hh,x,y,r);g.arcTo(x,y,x+ww,y,r);g.closePath()};
  g.shadowColor=`rgb(${col})`;g.shadowBlur=14;
  rr(10,10,w-20,h-20,10);g.fillStyle='rgba(14,12,30,.92)';g.fill();
  g.shadowBlur=0;g.lineWidth=2.5;g.strokeStyle=`rgb(${col})`;g.stroke();
  g.fillStyle=`rgb(${col})`;g.font='bold 38px Georgia';g.textAlign='center';g.textBaseline='middle';g.fillText(glyph,w/2,h/2-8);
  g.font='bold 11px system-ui,sans-serif';g.fillText(label,w/2,h-28);
  spr[key]=cv;return cv;
}
function drawBible(cx,it,gy,S,refl){
  const f=it.fade||0,a=1-f;if(a<=0)return;
  const sp=bibleSprite(),sz=46*S*(1+f*.6),bob=Math.sin(R.t*3+it.ph)*4*S;
  const spin=.4+.6*Math.abs(Math.cos(R.t*2.1+it.ph)),y=gy-it.h+bob-f*30*S;
  if(!refl){                                   /* contact shadow: smaller and fainter the higher it floats */
    const hn=clamp(it.h/(200*S),0,1);
    cx.save();cx.globalAlpha=a*.32*(1-hn*.8);cx.fillStyle='#000';cx.beginPath();cx.ellipse(it.x,gy+3*S,15*S*(1-hn*.4),4*S,0,0,6.283);cx.fill();cx.restore();
  }
  cx.save();cx.globalAlpha=a;cx.translate(it.x,y);cx.scale(spin,1);cx.drawImage(sp,-sz/2,-sz/2,sz,sz);
  if(!refl){                                   /* gilt glint */
    const gl=(R.t*1.3+it.ph)%2;
    if(gl<.5){const k=Math.sin(gl/.5*Math.PI);cx.globalCompositeOperation='lighter';cx.strokeStyle=`rgba(255,246,210,${.9*k})`;cx.lineWidth=1.4*S;
      cx.beginPath();cx.moveTo(-9*S*k,-9*S*k);cx.lineTo(9*S*k,9*S*k);cx.moveTo(9*S*k,-9*S*k);cx.lineTo(-9*S*k,9*S*k);cx.stroke()}
  }
  cx.restore();
}
function drawCard(cx,it,gy,S,refl){
  const a=1-(it.fade||0);if(a<=0)return;
  const base=gy-(it.base||0);
  if(it.k==='trick'){
    /* Vector-style trick zone: a glowing half-ring standing on the surface, chromatic edges, ✦ at its crown */
    const r=40*S*(1+(it.fade||0)*.5),cy=base,p=.5+.5*Math.sin(R.t*5+it.x*.01);
    cx.save();cx.globalAlpha=a;cx.lineCap='round';
    cx.globalCompositeOperation='lighter';
    cx.lineWidth=14*S;cx.strokeStyle=`rgba(255,255,255,${.14+.08*p})`;cx.beginPath();cx.arc(it.x,cy,r,Math.PI,0);cx.stroke();
    cx.lineWidth=4.5*S;
    cx.strokeStyle='rgba(255,90,200,.75)';cx.beginPath();cx.arc(it.x-1.6*S,cy,r,Math.PI,0);cx.stroke();
    cx.strokeStyle='rgba(90,220,255,.75)';cx.beginPath();cx.arc(it.x+1.6*S,cy,r,Math.PI,0);cx.stroke();
    cx.lineWidth=5*S;cx.strokeStyle='rgba(255,255,255,.95)';cx.beginPath();cx.arc(it.x,cy,r,Math.PI,0);cx.stroke();
    cx.fillStyle=`rgba(255,240,250,${.75+.25*p})`;cx.font=`bold ${Math.round(15*S)}px system-ui,sans-serif`;cx.textAlign='center';cx.textBaseline='middle';
    cx.fillText('✦',it.x,cy-r-12*S);
    const pg=cx.createRadialGradient(it.x,cy,0,it.x,cy,r*1.4);pg.addColorStop(0,`rgba(230,220,255,${.18+.08*p})`);pg.addColorStop(1,'rgba(230,220,255,0)');
    cx.fillStyle=pg;cx.fillRect(it.x-r*1.4,cy-r*1.4,r*2.8,r*1.4);
    cx.restore();
    return;
  }
  const sp=cardSprite('p','255,217,138','★','POWER');
  const w=46*S,h=61*S,bob=Math.sin(R.t*4+it.x*.01)*5*S,y=gy-it.h-h/2+bob;
  cx.save();cx.globalAlpha=a;cx.translate(it.x,y+h/2);cx.rotate(Math.sin(R.t*2.4)*.08);
  cx.drawImage(sp,-w/2,-h/2,w,h);
  if(!refl){
    cx.beginPath();cx.rect(-w*.38,-h*.38,w*.76,h*.76);cx.clip();
    const k=((R.t*.7+it.x*.003)%1)*2-.5,sg=cx.createLinearGradient(-w*.5+k*w,-h*.5,-w*.5+k*w+w*.35,h*.5);
    sg.addColorStop(0,'rgba(255,255,255,0)');sg.addColorStop(.5,'rgba(255,255,255,.5)');sg.addColorStop(1,'rgba(255,255,255,0)');
    cx.globalCompositeOperation='lighter';cx.fillStyle=sg;cx.fillRect(-w/2,-h/2,w,h);
  }
  cx.restore();
  if(!refl&&!it.used){
    cx.save();cx.globalCompositeOperation='lighter';
    cx.fillStyle=`rgba(255,217,138,${.18+.1*Math.sin(R.t*6)})`;cx.beginPath();cx.arc(it.x,y+h/2,44*S,0,6.283);cx.fill();
    cx.restore();
  }
}
function drawPad(cx,it,gy,S){
  const L=it.x-it.w/2,on=it.used?.35:1;
  cx.save();
  /* slab: lit top face, darker front face, blinking edge lights */
  cx.fillStyle='rgba(8,22,30,.92)';cx.fillRect(L,gy-1*S,it.w,6*S);
  const tg=cx.createLinearGradient(0,gy-3*S,0,gy+3*S);tg.addColorStop(0,'rgba(60,150,160,.95)');tg.addColorStop(1,'rgba(20,60,72,.95)');
  cx.fillStyle=tg;cx.fillRect(L,gy-3*S,it.w,4*S);
  cx.globalCompositeOperation='lighter';
  const ph=(R.t*3)%1;
  for(let k=0;k<4;k++){const u=((k/4)+ph)%1,xx=L+it.w*u;
    cx.fillStyle=`rgba(95,242,230,${(.35+.5*(1-u))*on})`;cx.beginPath();cx.moveTo(xx,gy-3*S);cx.lineTo(xx+16*S,gy);cx.lineTo(xx,gy+3*S);cx.lineTo(xx+6*S,gy);cx.closePath();cx.fill()}
  for(let k=0;k<7;k++){const xx=L+it.w*(k+.5)/7,bl=.5+.5*Math.sin(R.t*9-k*.9);
    cx.fillStyle=`rgba(180,255,246,${(.4+.5*bl)*on})`;cx.beginPath();cx.arc(xx,gy+4.5*S,1.7*S,0,6.283);cx.fill()}
  const g2=cx.createLinearGradient(0,gy-46*S,0,gy);g2.addColorStop(0,'rgba(95,242,230,0)');g2.addColorStop(1,`rgba(95,242,230,${.3*on})`);
  cx.fillStyle=g2;cx.fillRect(L,gy-46*S,it.w,46*S);
  const pg=cx.createRadialGradient(it.x,gy+4*S,0,it.x,gy+4*S,it.w*.75);pg.addColorStop(0,`rgba(95,242,230,${.35*on})`);pg.addColorStop(1,'rgba(95,242,230,0)');
  cx.translate(0,gy+4*S);cx.scale(1,.2);cx.translate(0,-(gy+4*S));cx.fillStyle=pg;cx.fillRect(it.x-it.w,gy+4*S-it.w,it.w*2,it.w*2);
  cx.restore();
}
J.drawWorld=function(){
  if(R.st==='menu'||!J.items.length)return;
  const cx=R.cx,gy=R.gy,c=CM(),S=R.S,A=J.items;
  for(const it of A){
    if(it.x<-300*S||it.x>R.W+400*S)continue;
    if(it.k==='pad')drawPad(cx,it,gy,S);
    else if(it.k==='bible')drawBible(cx,it,gy,S,false);
    else if(it.k==='trick'||it.k==='power')drawCard(cx,it,gy,S,false);
    else if(it.k==='gate')drawGate(cx,it,gy,c,S);
    else if(it.k==='bar')drawBar(cx,it,gy,c,S);
    else if(it.k==='finish')drawFinish(cx,it,gy,S);
    else if(it.k==='mark'){cx.save();cx.globalCompositeOperation='lighter';for(let k=0;k<3;k++){const xx=it.x-12*S+k*12*S;cx.beginPath();cx.moveTo(xx,gy-1*S);cx.lineTo(xx+7*S,gy-9*S);cx.lineTo(xx+14*S,gy-1*S);cx.strokeStyle=`rgba(200,170,255,${.35+.5*((R.t*3+k*.3)%1)})`;cx.lineWidth=2*S;cx.stroke()}cx.restore()}
  }
  /* wet-road reflections of the pickups */
  if(R.qLv>=1&&R.ground.refl&&R.ground.refl.a>.02){
    cx.save();cx.beginPath();cx.rect(-80,gy,R.W+160,R.H-gy+80);cx.clip();
    cx.globalAlpha=R.ground.refl.a*1.1;cx.translate(0,2*gy);cx.scale(1,-1);
    for(const it of A){
      if(it.x<-100*S||it.x>R.W+100*S)continue;
      if(it.k==='bible')drawBible(cx,it,gy,S,true);else if(it.k==='trick'||it.k==='power')drawCard(cx,it,gy,S,true);
    }
    cx.restore();
  }
};
/* r10 verse signs: neon lettering in a black billboard frame (the word over the bridge stands on the deck, the word
   under the bridge hangs beneath it). Uppercase, letter-spaced, glowing tubes with a slight chromatic fringe. */
function sign(cx,x,y,word,dir,state,seek,S){
  const pf=Math.round(R.F()*(R.W<500?.58:.8));
  const txt=word.toUpperCase().split('').join(String.fromCharCode(8202));
  cx.save();
  cx.font=`600 ${pf}px "Segoe UI","Helvetica Neue",Arial,sans-serif`;
  const tw=cx.measureText(txt).width,w=tw+pf*2.4,h=pf*1.9;
  const col=state==='ok'?[120,255,170]:state==='bad'?[255,90,80]:seek?[190,255,140]:dir==='up'?[255,214,150]:[140,226,255];
  const L=x-w/2,T=y-h/2;
  /* the billboard box: black frame, smoked glass panel, lamp hoods on top */
  cx.fillStyle='#030305';cx.fillRect(L-4*S,T-4*S,w+8*S,h+8*S);
  cx.fillStyle='rgba(8,10,16,.92)';cx.fillRect(L,T,w,h);
  cx.fillStyle='#030305';for(const fx of[.2,.5,.8]){cx.beginPath();cx.moveTo(L+w*fx-7*S,T-4*S);cx.lineTo(L+w*fx+7*S,T-4*S);cx.lineTo(L+w*fx+3*S,T-10*S);cx.lineTo(L+w*fx-3*S,T-10*S);cx.fill()}
  /* soft light the tubes throw onto the panel */
  const pg=cx.createRadialGradient(x,y,0,x,y,w*.55);pg.addColorStop(0,`rgba(${col},.22)`);pg.addColorStop(1,`rgba(${col},0)`);
  cx.fillStyle=pg;cx.fillRect(L,T,w,h);
  /* arrow triangle, Vector-style */
  const ax=L+pf*.75,ay=y;
  cx.beginPath();if(dir==='up'){cx.moveTo(ax-pf*.32,ay+pf*.22);cx.lineTo(ax+pf*.32,ay+pf*.22);cx.lineTo(ax,ay-pf*.3)}else{cx.moveTo(ax-pf*.32,ay-pf*.22);cx.lineTo(ax+pf*.32,ay-pf*.22);cx.lineTo(ax,ay+pf*.3)}cx.closePath();
  cx.shadowColor=`rgb(${col})`;cx.shadowBlur=14*S;cx.strokeStyle=`rgb(${col})`;cx.lineWidth=2*S;cx.stroke();
  /* neon word: glow, chromatic fringe, hot white core */
  const tx=x+pf*.45;cx.textAlign='center';cx.textBaseline='middle';
  cx.shadowBlur=18*S;cx.fillStyle=`rgb(${col})`;cx.fillText(txt,tx,y+1);
  cx.shadowBlur=0;cx.globalCompositeOperation='lighter';
  cx.fillStyle='rgba(255,60,190,.35)';cx.fillText(txt,tx-1.3*S,y+1);
  cx.fillStyle='rgba(60,220,255,.35)';cx.fillText(txt,tx+1.3*S,y+1);
  cx.fillStyle='rgba(255,255,255,.9)';cx.fillText(txt,tx,y+1);
  /* light spill into the air around the sign */
  const sg=cx.createRadialGradient(x,y,h*.4,x,y,w*.9);sg.addColorStop(0,`rgba(${col},.16)`);sg.addColorStop(1,`rgba(${col},0)`);
  cx.fillStyle=sg;cx.fillRect(x-w,y-w,w*2,w*2);
  cx.restore();
  return {w,h};
}
function drawGate(cx,it,gy,c,S){
  const x=it.x,deckTop=gy-it.ht,deckBot=gy-it.bot,g=G_();
  const fade=it.done?Math.max(0,1-it.t2*1.4):1;
  const seekUp=R.seekT>0&&it.ans==='up',seekDn=R.seekT>0&&it.ans==='down';
  const stU=it.done?(it.res==='up'?(it.ok?'ok':'bad'):(it.ans==='up'?'ok':'')):'';
  const stD=it.done?(it.res==='down'?(it.ok?'ok':'bad'):(it.ans==='down'?'ok':'')):'';
  const pf=R.F()*(R.W<500?.62:.86),sh=pf*1.75;
  /* OVER: a billboard on two black posts standing on the deck */
  const uy=deckTop-34*S-sh/2;
  cx.fillStyle='#050507';cx.fillRect(x-30*S,uy,5*S,deckTop-uy);cx.fillRect(x+25*S,uy,5*S,deckTop-uy);
  sign(cx,x,uy,it.up,'up',stU,seekUp,S);
  /* UNDER: a sign hanging from the deck's underside on two chains */
  const ly=deckBot+7*S+sh/2;
  cx.strokeStyle='#050507';cx.lineWidth=2*S;cx.beginPath();cx.moveTo(x-22*S,deckBot);cx.lineTo(x-22*S,ly-sh/2);cx.moveTo(x+22*S,deckBot);cx.lineTo(x+22*S,ly-sh/2);cx.stroke();
  sign(cx,x,ly,it.down,'down',stD,seekDn,S);
  if(fade<=0)return;
  /* the jump line onto the bridge, and the low line under it */
  cx.save();cx.globalAlpha=fade;
  const tx=x+it.tko,v=it.T*g/2,n=9;
  cx.globalCompositeOperation='lighter';
  for(let i=0;i<n;i++){
    const t=it.T*(.05+.5*i/(n-1)),px=tx+it.sp*t,py=gy-(v*t-.5*g*t*t)-12*S,pu=.5+.5*Math.sin(R.t*7-i*.8);
    cx.fillStyle=`rgba(255,226,160,${.45+.45*pu})`;cx.beginPath();cx.arc(px,py,(3.4+2*pu)*S,0,6.283);cx.fill();
  }
  cx.globalCompositeOperation='source-over';
  cx.textAlign='center';cx.font=`bold ${Math.round(10*S)}px system-ui,sans-serif`;
  cx.fillStyle='rgba(255,226,160,.95)';cx.fillText('JUMP ▲',tx,gy+16*S);
  for(let k=0;k<3;k++){const xx=tx-12*S+k*12*S;cx.beginPath();cx.moveTo(xx,gy-1*S);cx.lineTo(xx+7*S,gy-9*S);cx.lineTo(xx+14*S,gy-1*S);cx.strokeStyle=`rgba(255,226,160,${.35+.5*((R.t*3+k*.3)%1)})`;cx.lineWidth=2*S;cx.stroke()}
  cx.strokeStyle='rgba(150,226,255,.55)';cx.setLineDash([5*S,7*S]);cx.lineWidth=2*S;
  cx.beginPath();cx.moveTo(tx+30*S,gy-6*S);cx.lineTo(x+it.dlo+20*S,gy-6*S);cx.stroke();cx.setLineDash([]);
  cx.fillStyle='rgba(150,226,255,.9)';cx.fillText('STAY LOW ▼',x+it.dlo-10*S,gy+16*S);
  cx.restore();
}
function drawBar(cx,it,gy,c,S){
  const L=it.x-it.w/2,Rr=it.x+it.w/2,bot=gy-it.bot,th=15*c,topP=bot-th-46*S;
  /* shadow of the beam on the road */
  cx.save();cx.fillStyle='rgba(0,0,0,.28)';cx.fillRect(L-7*S,gy-1*S,it.w+14*S,6*S);cx.restore();
  cx.save();
  /* steel posts: lit left edge, dark right edge, base plates and bolts */
  for(const px of [L-7*S,Rr-2*S]){
    const pg=cx.createLinearGradient(px,0,px+9*S,0);pg.addColorStop(0,'#5a5a6c');pg.addColorStop(.35,'#3a3a48');pg.addColorStop(1,'#1c1c26');
    cx.fillStyle=pg;cx.fillRect(px,topP,9*S,gy-topP);
    cx.fillStyle='#24242e';cx.fillRect(px-4*S,gy-5*S,17*S,5*S);
    cx.fillStyle='#7c7c90';for(let k=0;k<3;k++)cx.fillRect(px+3*S,topP+10*S+k*((gy-topP-20*S)/3),3*S,3*S);
  }
  /* hazard-striped beam with a lit top edge and shaded underside */
  cx.save();cx.beginPath();cx.rect(L-7*S,bot-th,it.w+14*S,th);cx.clip();
  cx.fillStyle='#f2c230';cx.fillRect(L-7*S,bot-th,it.w+14*S,th);
  cx.fillStyle='#17171f';const sw=16*S;
  for(let x=L-30*S;x<Rr+30*S;x+=sw*2){cx.beginPath();cx.moveTo(x,bot);cx.lineTo(x+sw,bot);cx.lineTo(x+sw+th,bot-th);cx.lineTo(x+th,bot-th);cx.closePath();cx.fill()}
  const bg=cx.createLinearGradient(0,bot-th,0,bot);bg.addColorStop(0,'rgba(255,255,255,.38)');bg.addColorStop(.18,'rgba(255,255,255,0)');bg.addColorStop(.7,'rgba(0,0,0,0)');bg.addColorStop(1,'rgba(0,0,0,.5)');
  cx.fillStyle=bg;cx.fillRect(L-7*S,bot-th,it.w+14*S,th);
  cx.restore();
  /* chains swaying under the beam */
  cx.strokeStyle='rgba(120,120,135,.8)';cx.lineWidth=1.4*S;
  for(const fx of [.22,.78]){const x0=L+it.w*fx,sw2=Math.sin(R.t*2+fx*9)*2*S;cx.beginPath();cx.moveTo(x0,bot);cx.lineTo(x0+sw2,bot+10*S);cx.stroke();
    for(let k=0;k<3;k++){cx.beginPath();cx.ellipse(x0+sw2*(k+1)/3.4,bot+(2+k*3.4)*S,1.5*S,2.2*S,0,0,6.283);cx.stroke()}}
  /* sign */
  const p=.5+.5*Math.sin(R.t*7);
  cx.fillStyle='rgba(255,210,70,.95)';cx.font=`bold ${Math.round(12*S)}px system-ui,sans-serif`;cx.textAlign='center';
  cx.fillText('STAY LOW',it.x,bot-th-58*S);
  cx.fillStyle=`rgba(255,210,70,${.5+.5*p})`;cx.beginPath();cx.moveTo(it.x-9*S,bot-th-48*S);cx.lineTo(it.x+9*S,bot-th-48*S);cx.lineTo(it.x,bot-th-34*S);cx.closePath();cx.fill();
  /* blinking warning lamps on the posts + the safe corridor */
  cx.globalCompositeOperation='lighter';
  for(const px of [L-2.5*S,Rr+2.5*S]){
    const b=Math.sin(R.t*6+(px<it.x?0:Math.PI))>0?1:.15;
    const lg=cx.createRadialGradient(px,topP,0,px,topP,22*S);lg.addColorStop(0,`rgba(255,170,40,${.9*b})`);lg.addColorStop(1,'rgba(255,170,40,0)');
    cx.fillStyle=lg;cx.fillRect(px-22*S,topP-22*S,44*S,44*S);
  }
  const g=cx.createLinearGradient(0,bot,0,gy);g.addColorStop(0,'rgba(120,255,190,0)');g.addColorStop(1,`rgba(120,255,190,${.12+.06*p})`);
  cx.fillStyle=g;cx.fillRect(L,bot,it.w,gy-bot);
  cx.restore();
}
function drawFinish(cx,it,gy,S){
  const x=it.x,h=210*S,w=16*S,sq=10*S;
  cx.save();
  cx.fillStyle='rgba(0,0,0,.3)';cx.fillRect(x-80*S,gy-1*S,160*S,7*S);
  /* gantry towers with LED strips */
  for(const px of [x-72*S,x+64*S]){
    const pg=cx.createLinearGradient(px,0,px+8*S,0);pg.addColorStop(0,'#e8e8f0');pg.addColorStop(1,'#8a8a9c');
    cx.fillStyle=pg;cx.fillRect(px,gy-h,8*S,h);
    cx.fillStyle='#5a5a6c';cx.fillRect(px-4*S,gy-6*S,16*S,6*S);
  }
  /* a chequered cloth banner rippling in the wind */
  const cols=26,cw=(128*S)/cols;
  for(let k=0;k<cols;k++){
    const xx=x-64*S+k*cw,wv=Math.sin(R.t*3.2-k*.45)*3.5*S*(.4+k/cols);
    for(let r=0;r<3;r++){
      const shade=.78+.22*Math.sin(R.t*3.2-k*.45+r);
      cx.fillStyle=(Math.floor(k/2)+r)%2?`rgb(${22*shade|0},${22*shade|0},${26*shade|0})`:`rgb(${246*shade|0},${246*shade|0},${250*shade|0})`;
      cx.fillRect(xx,gy-h+r*sq+wv,cw+.6,sq);
    }
  }
  cx.fillStyle='#ffd98a';cx.font=`bold ${Math.round(15*S)}px Georgia`;cx.textAlign='center';cx.fillText('FINISH',x,gy-h-10*S);
  cx.globalCompositeOperation='lighter';
  const g=cx.createLinearGradient(0,gy-h,0,gy);g.addColorStop(0,'rgba(255,240,200,.26)');g.addColorStop(1,'rgba(255,240,200,0)');
  cx.fillStyle=g;cx.fillRect(x-64*S,gy-h+3*sq,128*S,h-3*sq);
  for(const px of [x-68*S,x+68*S]){const lg=cx.createRadialGradient(px,gy-h,0,px,gy-h,34*S);lg.addColorStop(0,'rgba(255,230,160,.8)');lg.addColorStop(1,'rgba(255,230,160,0)');cx.fillStyle=lg;cx.fillRect(px-34*S,gy-h-34*S,68*S,68*S)}
  for(let k=0;k<6;k++){cx.fillStyle=k%2?'rgba(0,0,0,.6)':'rgba(255,255,255,.7)';cx.fillRect(x-w/2,gy-1+k*4*S,w,4*S)}
  cx.restore();
}

/* ---------- r11 the drone: a high-tech hunter-killer that chases the board, sweeps a red laser along the route and fires
   EMP pulses that roll along the ground. Jump the laser sweep and the pulse front; let it catch you and it costs a heart. */
const DR=J.drone={x:-200,y:200,vx:0,vy:0,tilt:0,charge:0,eye:0};
let atk=null;J.atkT=12;
const roomAt=x=>R.ground.obs.some(o=>o.type==='room'&&Math.abs(o.x-x)<o.w/2+40*R.S);
const floorAt=()=>Math.max(0,R.skate.shadowH||0);
/* r12: the drone starts far behind (off screen) and only comes into view as it catches up. u = 0 → right behind the
   board, u ≥ 1 → still out of sight to the left. */
J.lt=0;
J.droneX=()=>{
  const S=R.S,u=clamp((J.gap-6)/40,0,1),gx=(R.px-190*S)*(1-u)+30*S*u;
  const arrive=R.smooth?R.smooth(clamp((J.lt-10)/8,0,1)):clamp((J.lt-10)/8,0,1);   /* it takes ~10-18 s to catch up each level */
  return -320*S+(gx+320*S)*arrive;
};
J.stormEdge=()=>J.droneX()-80*R.S;
J.droneTick=function(dt,realDt){
  const S=R.S,near=clamp(1-J.gap/GAP0,0,1),gy=R.gy,X=R.sfx;
  if(R.st==='play'&&J.state==='run')J.lt+=realDt;
  const tx=J.droneX(),ty=gy-(230-80*near)*S-floorAt()*.4+Math.sin(R.t*1.7)*10*S;
  const ax=(tx-DR.x)*18-DR.vx*7,ay=(ty-DR.y)*16-DR.vy*6;
  DR.vx+=ax*realDt;DR.vy+=ay*realDt;DR.x+=DR.vx*realDt;DR.y+=DR.vy*realDt;
  DR.tilt+=(clamp(DR.vx/(600*S),-.35,.35)+.12-DR.tilt)*Math.min(1,realDt*5);
  DR.charge=Math.max(0,DR.charge-realDt*1.5);
  /* sound: the rotor hum swells as it closes in, panned to where it is */
  const vis=clamp((DR.x+260*S)/(220*S),0,1);
  if(X)X.hum(R.st==='play'||R.st==='wait'?(.15+.85*vis)*(.35+.65*near):0,clamp(DR.x/R.W*2-1,-1,1),1+.25*near+.4*DR.charge);
  /* the moment it breaks into view */
  const shown=DR.x>-20*S;
  if(shown&&!DR.shown&&R.st==='play'){DR.shown=1;if(R.t-(DR.lastSeen||-99)>8){M.showWarn('◉ The drone has caught up — it is right behind you');if(X)X.droneAppear()}}
  if(!shown&&DR.shown&&DR.x<-140*S){DR.shown=0;DR.lastSeen=R.t}
  if(R.st!=='play'||J.state!=='run')return;
  /* attacks: WARN (banner + alarm) → LOCK (aim line / EMP charge) → FIRE */
  if(!atk){
    J.atkT-=realDt;
    const gateAhead=J.items.some(i=>i.k==='gate'&&!i.done&&i.x<R.W*1.7);
    const ok=J.atkT<=0&&!gateAhead&&!holdSpawn()&&!(J.smT>0)&&!R.skate.crash&&!roomAt(R.px)&&!roomAt(R.px+R.W*.5)&&DR.x>40*S;
    if(ok){
      const kind=R.lvl>=2&&Math.random()<.45?'emp':'laser';
      atk={k:kind,ph:'warn',t:0,xs:DR.x,r:0,ox:DR.x};
      M.showWarn(kind==='laser'?'⚠ LASER LOCK — jump when the beam sweeps to you':'⚠ EMP CHARGING — jump the pulse');
      if(X)X.alarm();
      if(!R.tryGet('rotw-jl'+kind)){M.showHint(kind==='laser'?'The drone fires a laser along the ground — watch the red line, JUMP as the beam reaches you':'An EMP pulse will roll along the ground — JUMP over it as it reaches you',6000);R.trySet('rotw-jl'+kind,'1')}
    }
    return;
  }
  atk.t+=realDt;
  const B=R.board,low=B.jy-floorAt()<24*S&&!R.skate.crash;
  if(atk.ph==='warn'){
    DR.charge=Math.min(.5,DR.charge+realDt);
    if(atk.t>1.2){atk.ph=atk.k==='laser'?'aim':'charge';atk.t=0;if(X){if(atk.k==='laser')X.laserLock(1.1);else X.empCharge(1.1)}}
    return;
  }
  if(atk.k==='laser'){
    if(atk.ph==='aim'){DR.charge=Math.min(1,DR.charge+realDt*2);
      if(atk.t>1.1){atk.ph='fire';atk.t=0;atk.xs=DR.x+20*S;if(X)X.laserFire();R.CA=Math.max(R.CA,2)}}
    else{
      const prev=atk.xs;atk.xs+=520*S*realDt;
      if(prev<R.px+18*S&&atk.xs>=R.px-18*S&&!atk.hit){atk.hit=1;if(low)J.droneHit('laser');else{M.addScore(60);if(X)X.dodge();R.fx.flyTexts.push({w:'Dodged! +60',x:R.px,y:R.gy-B.jy-90*S,t:0,col:'255,170,170',small:1})}}
      if(Math.random()<.6)R.fx.burst(atk.xs,R.gy-floorAt(),'rgba(255,90,60,.95)',3,260);
      if(X&&Math.random()<realDt*18)X.laserSizzle();
      if(atk.xs>R.W+60*S)atk=null;
    }
  }else{
    if(atk.ph==='charge'){DR.charge=Math.min(1,DR.charge+realDt*1.6);if(atk.t>1.1){atk.ph='wave';atk.t=0;atk.ox=DR.x;atk.r=0;if(X)X.empBlast();R.shake=Math.max(R.shake,.5)}}
    else{
      const prev=atk.ox+atk.r;atk.r+=560*S*realDt;const fr=atk.ox+atk.r;
      if(prev<R.px+16*S&&fr>=R.px-16*S&&!atk.hit){atk.hit=1;if(low)J.droneHit('emp');else{M.addScore(60);if(X)X.dodge();R.fx.flyTexts.push({w:'Pulse cleared +60',x:R.px,y:R.gy-B.jy-90*S,t:0,col:'170,220,255',small:1})}}
      if(fr>R.W+120*S)atk=null;
    }
  }
  if(!atk)J.atkT=Math.max(6,13-R.lvl*.45)+Math.random()*6;
};
J.droneHit=function(kind){
  const o={x:R.px,w:20*R.S,h:0,type:kind,scored:false,kind:'haz'};
  R.skate.obstacleCrash(o,'slam',kind==='laser'?'burned by the drone laser':'knocked out by the EMP');
  if(R.sfx)R.sfx.hit(kind);
  R.fx.burst(R.px,R.gy-R.board.jy,kind==='laser'?'rgba(255,80,50,.95)':'rgba(140,210,255,.95)',36,420);
  if(kind==='emp'){R.cv.style.filter='saturate(.3) contrast(1.2)';setTimeout(()=>{R.cv.style.filter=''},420)}
};
/* the on-screen warning over the board while an attack winds up */
function drawWarning(cx,S){
  if(!atk||!(atk.ph==='warn'||atk.ph==='aim'||atk.ph==='charge'))return;
  const x=R.px,y=R.gy-R.board.jy-120*S,p=.5+.5*Math.sin(R.t*14),laser=atk.k==='laser';
  const col=laser?'255,70,60':'140,210,255';
  const left=atk.ph==='warn'?2.3-atk.t:1.1-atk.t;
  cx.save();
  cx.globalAlpha=.75+.25*p;
  cx.fillStyle=`rgba(${col},.18)`;cx.beginPath();cx.arc(x,y,30*S,0,6.283);cx.fill();
  cx.strokeStyle=`rgb(${col})`;cx.lineWidth=2.5*S;cx.beginPath();cx.arc(x,y,30*S,-Math.PI/2,-Math.PI/2+6.283*clamp(left/2.3,0,1));cx.stroke();
  cx.fillStyle=`rgb(${col})`;cx.beginPath();cx.moveTo(x,y-17*S);cx.lineTo(x+16*S,y+12*S);cx.lineTo(x-16*S,y+12*S);cx.closePath();cx.fill();
  cx.fillStyle='#120608';cx.font=`900 ${Math.round(17*S)}px system-ui,sans-serif`;cx.textAlign='center';cx.textBaseline='middle';cx.fillText('!',x,y+3*S);
  cx.fillStyle=`rgb(${col})`;cx.font=`700 ${Math.round(11*S)}px system-ui,sans-serif`;cx.fillText(laser?'LASER':'EMP',x,y+44*S);
  cx.restore();
}
J.attack=()=>atk;
J.stormTick=function(dt){};

function drawDrone(cx,x,y,S,near){
  const t=R.t,ch=DR.charge,s=S*1.15;
  cx.save();cx.translate(x,y);cx.rotate(DR.tilt);
  /* rotor wash haze below */
  const hg=cx.createRadialGradient(0,40*s,0,0,40*s,90*s);hg.addColorStop(0,'rgba(120,130,150,.18)');hg.addColorStop(1,'rgba(120,130,150,0)');
  cx.fillStyle=hg;cx.fillRect(-90*s,-50*s,180*s,180*s);
  /* arms + rotor pods (two in profile, two behind, darker) */
  for(const [ax,ay,back] of[[-58,-14,1],[58,-14,1],[-70,-6,0],[70,-6,0]]){
    cx.fillStyle=back?'#0b0c10':'#15171e';
    cx.beginPath();cx.moveTo(0,0);cx.lineTo(ax*s,(ay-2)*s);cx.lineTo(ax*s,(ay+4)*s);cx.lineTo(0,8*s);cx.closePath();cx.fill();
    cx.fillStyle=back?'#0e0f14':'#1c1f28';cx.fillRect((ax-9)*s,(ay-7)*s,18*s,10*s);
    /* spinning rotor: motion-blurred disc with a red rim */
    const rw=34*s,ph=t*60+ax;
    cx.fillStyle=`rgba(160,170,190,${back?.08:.14})`;cx.beginPath();cx.ellipse(ax*s,(ay-9)*s,rw,3.2*s,0,0,6.283);cx.fill();
    cx.strokeStyle=`rgba(255,40,40,${back?.25:.55})`;cx.lineWidth=1.2*s;cx.beginPath();cx.ellipse(ax*s,(ay-9)*s,rw,3.2*s,0,0,6.283);cx.stroke();
    cx.fillStyle='rgba(220,230,255,.3)';cx.fillRect(ax*s+Math.cos(ph)*rw-6*s,(ay-10)*s,12*s,1.6*s);
  }
  /* stealth hull: faceted gunmetal body */
  const hull=cx.createLinearGradient(0,-26*s,0,22*s);hull.addColorStop(0,'#3a3e4a');hull.addColorStop(.35,'#1c1f27');hull.addColorStop(1,'#07080b');
  cx.fillStyle=hull;cx.beginPath();
  cx.moveTo(-44*s,4*s);cx.lineTo(-30*s,-18*s);cx.lineTo(14*s,-24*s);cx.lineTo(46*s,-10*s);cx.lineTo(52*s,6*s);cx.lineTo(30*s,20*s);cx.lineTo(-26*s,18*s);cx.closePath();cx.fill();
  /* rim light and panel lines */
  cx.strokeStyle='rgba(200,210,235,.45)';cx.lineWidth=1.2*s;cx.beginPath();cx.moveTo(-30*s,-18*s);cx.lineTo(14*s,-24*s);cx.lineTo(46*s,-10*s);cx.stroke();
  cx.strokeStyle='rgba(0,0,0,.6)';cx.lineWidth=1*s;cx.beginPath();cx.moveTo(-20*s,-14*s);cx.lineTo(-14*s,14*s);cx.moveTo(8*s,-20*s);cx.lineTo(12*s,18*s);cx.moveTo(-30*s,2*s);cx.lineTo(40*s,0);cx.stroke();
  /* intake vents */
  cx.fillStyle='#050608';for(let k=0;k<4;k++)cx.fillRect((-24+k*6)*s,-8*s,3*s,10*s);
  /* sensor fin and antenna */
  cx.fillStyle='#14161d';cx.beginPath();cx.moveTo(-8*s,-21*s);cx.lineTo(-2*s,-36*s);cx.lineTo(6*s,-22*s);cx.fill();
  cx.strokeStyle='#2a2e38';cx.lineWidth=1.4*s;cx.beginPath();cx.moveTo(20*s,-22*s);cx.lineTo(26*s,-40*s);cx.stroke();
  const blink=Math.sin(t*9)>.4?1:.15;
  cx.fillStyle=`rgba(255,40,40,${blink})`;cx.beginPath();cx.arc(26*s,-41*s,2*s,0,6.283);cx.fill();
  /* weapon pod under the nose */
  cx.fillStyle='#0c0d12';cx.fillRect(18*s,16*s,26*s,8*s);cx.fillStyle='#262a34';cx.fillRect(40*s,18*s,12*s,4*s);
  /* the eye: armoured lens with a red iris that tracks the board */
  const ex=34*s,ey=-2*s;
  cx.fillStyle='#050506';cx.beginPath();cx.arc(ex,ey,13*s,0,6.283);cx.fill();
  cx.strokeStyle='#3a3f4c';cx.lineWidth=2*s;cx.beginPath();cx.arc(ex,ey,13*s,0,6.283);cx.stroke();
  const ir=cx.createRadialGradient(ex+2*s,ey,0,ex,ey,10*s);ir.addColorStop(0,'rgba(255,240,220,1)');ir.addColorStop(.25,`rgba(255,${60+ch*80|0},40,1)`);ir.addColorStop(.7,'rgba(160,0,10,.9)');ir.addColorStop(1,'rgba(40,0,0,0)');
  cx.fillStyle=ir;cx.beginPath();cx.arc(ex,ey,10*s,0,6.283);cx.fill();
  cx.strokeStyle='rgba(255,120,110,.5)';cx.lineWidth=.8*s;for(let k=0;k<6;k++){const a=k*1.047+t*.6;cx.beginPath();cx.moveTo(ex+Math.cos(a)*4*s,ey+Math.sin(a)*4*s);cx.lineTo(ex+Math.cos(a)*9*s,ey+Math.sin(a)*9*s);cx.stroke()}
  cx.fillStyle='rgba(255,255,255,.8)';cx.beginPath();cx.arc(ex-4*s,ey-4*s,2*s,0,6.283);cx.fill();
  /* LED strip and glow */
  cx.globalCompositeOperation='lighter';
  cx.fillStyle=`rgba(255,30,30,${.5+.3*Math.sin(t*4)})`;cx.fillRect(-36*s,6*s,60*s,1.6*s);
  const gl=cx.createRadialGradient(ex,ey,0,ex,ey,(46+ch*40)*s);gl.addColorStop(0,`rgba(255,40,30,${.45+.35*ch+.2*near})`);gl.addColorStop(1,'rgba(255,40,30,0)');
  cx.fillStyle=gl;cx.fillRect(ex-90*s,ey-90*s,180*s,180*s);
  if(atk&&atk.k==='emp'&&atk.ph==='charge'){
    cx.strokeStyle=`rgba(150,220,255,${.4+.5*Math.random()})`;cx.lineWidth=1.4*s;
    for(let k=0;k<4;k++){cx.beginPath();let px=0,py=0;cx.moveTo(px,py);for(let j=0;j<5;j++){px+=(Math.random()-.5)*30*s;py+=(Math.random()-.5)*30*s;cx.lineTo(px,py)}cx.stroke()}
    const eg=cx.createRadialGradient(0,0,0,0,0,70*s*ch);eg.addColorStop(0,'rgba(150,220,255,.5)');eg.addColorStop(1,'rgba(150,220,255,0)');cx.fillStyle=eg;cx.fillRect(-80*s,-80*s,160*s,160*s);
  }
  cx.restore();
}
J.drawStorm=function(){
  if(R.st!=='play'&&J._roarOn){J._roarOn=false;if(R.audio.roar)R.audio.roar(0,0)}
  if(!(R.st==='play'||R.st==='wait'||R.st==='dying')||J.state==='idle'){if(R.sfx&&DR.hum!==0){DR.hum=0;R.sfx.hum(0,0,1);R.sfx.wind(0)}return}
  DR.hum=1;
  const cx=R.cx,S=R.S*Math.min(1,R.W/900),gy=R.gy,near=clamp(1-J.gap/GAP0,0,1);
  const ex=DR.x+34*S*1.15,ey=DR.y-2*S*1.15,base=gy-floorAt();
  cx.save();
  /* searchlight: a red cone from the eye onto the board */
  cx.globalCompositeOperation='lighter';
  const bx=R.px,by=gy-R.board.jy;
  const sl=cx.createLinearGradient(ex,ey,bx,by);sl.addColorStop(0,`rgba(255,40,30,${.18+.18*near})`);sl.addColorStop(1,'rgba(255,40,30,0)');
  cx.fillStyle=sl;cx.beginPath();cx.moveTo(ex,ey);cx.lineTo(bx-46*S,by+20*S);cx.lineTo(bx+46*S,by-30*S);cx.closePath();cx.fill();
  if(atk&&atk.k==='laser'&&atk.ph!=='warn'){
    if(atk.ph==='aim'){
      /* targeting line flickers onto the route behind the board */
      const flick=Math.random()<.85?1:0;
      cx.strokeStyle=`rgba(255,60,50,${.55*flick})`;cx.lineWidth=1.2*S;cx.setLineDash([6*S,5*S]);cx.beginPath();cx.moveTo(ex,ey);cx.lineTo(DR.x+40*S,base);cx.stroke();cx.setLineDash([]);
      cx.fillStyle=`rgba(255,60,50,${.6+.4*Math.sin(R.t*30)})`;cx.beginPath();cx.arc(DR.x+40*S,base,5*S,0,6.283);cx.fill();
    }else{
      /* the beam: from the eye to a point sweeping along the surface */
      const xs=atk.xs;
      cx.lineCap='round';
      cx.strokeStyle='rgba(255,40,20,.25)';cx.lineWidth=16*S;cx.beginPath();cx.moveTo(ex,ey);cx.lineTo(xs,base);cx.stroke();
      cx.strokeStyle='rgba(255,80,50,.75)';cx.lineWidth=5*S;cx.stroke();
      cx.strokeStyle='rgba(255,240,220,.95)';cx.lineWidth=1.8*S;cx.stroke();
      const hg=cx.createRadialGradient(xs,base,0,xs,base,40*S);hg.addColorStop(0,'rgba(255,200,120,.9)');hg.addColorStop(1,'rgba(255,60,20,0)');
      cx.fillStyle=hg;cx.fillRect(xs-40*S,base-40*S,80*S,80*S);
      /* glowing scorch line it leaves behind */
      const sg=cx.createLinearGradient(DR.x,0,xs,0);sg.addColorStop(0,'rgba(255,80,30,0)');sg.addColorStop(1,'rgba(255,110,40,.7)');
      cx.fillStyle=sg;cx.fillRect(DR.x,base-2*S,Math.max(0,xs-DR.x),3*S);
    }
  }
  if(atk&&atk.k==='emp'&&atk.ph==='wave'){
    /* EMP front rolling along the ground: a bright half-ring with crackling arcs */
    const r=atk.r,ox=atk.ox,fade=clamp(1-r/(R.W*1.4),0,1);
    cx.strokeStyle=`rgba(150,220,255,${.35*fade})`;cx.lineWidth=18*S;cx.beginPath();cx.arc(ox,base,r,Math.PI*1.03,Math.PI*1.97,false);cx.stroke();
    cx.strokeStyle=`rgba(220,245,255,${.9*fade})`;cx.lineWidth=3*S;cx.beginPath();cx.arc(ox,base,r,Math.PI*1.55,Math.PI*1.99,false);cx.stroke();
    const fx=ox+r;cx.strokeStyle=`rgba(200,240,255,${.8*fade})`;cx.lineWidth=1.4*S;
    for(let k=0;k<3;k++){cx.beginPath();let px=fx,py=base;cx.moveTo(px,py);for(let j=0;j<5;j++){px+=(Math.random()-.6)*14*S;py-=6*S+Math.random()*8*S;cx.lineTo(px,py)}cx.stroke()}
    const wg=cx.createRadialGradient(fx,base,0,fx,base,60*S);wg.addColorStop(0,`rgba(160,220,255,${.6*fade})`);wg.addColorStop(1,'rgba(160,220,255,0)');
    cx.fillStyle=wg;cx.fillRect(fx-60*S,base-60*S,120*S,120*S);
  }
  cx.restore();
  drawDrone(cx,DR.x,DR.y,S,near);
  drawWarning(cx,S);
};

/* ---------- journey HUD: DOM pill + canvas progress track + speed lines ---------- */
J.hud=function(){
  const el=J.hudEl||(J.hudEl=document.getElementById('jhud'));if(!el)return;
  if(J.state==='idle'||R.st==='menu'||R.st==='over'){if(el.innerHTML)el.innerHTML='';return}
  const m=Math.max(0,Math.round(J.gap)),pw=Math.round(clamp(J.meter/J.need,0,1)*100),sw=Math.round(clamp(J.gap/GAP0,0,1)*100);
  const h=`<span><i>📖</i>${J.bib}</span><span><i>★</i><span class="pm"><u style="width:${pw}%"></u></span></span>`+
    `<span><i>◉</i><span class="pm st"><u style="width:${sw}%"></u></span> ${m}m</span><span><i>✝</i>${J.vDone}/${J.vTot}</span>`+(J.boostT>0?'<span style="color:#5ff2e6">»</span>':'');
  if(h!==J._h){J._h=h;el.innerHTML=h}
  el.classList.toggle('near',J.gap<14);
};
J.drawHud=function(){
  if(!(R.st==='play'||R.st==='wait'||R.st==='dying'||R.st==='trans')||J.state==='idle')return;
  if(R.vec)R.vec.drawCinema();
  const cx=R.cx,W=R.W,H=R.H,S=Math.max(.8,R.S);
  cx.save();cx.setTransform(R.d,0,0,R.d,0,0);
  /* speed lines while boosting / flowing */
  const sk=J.boostK();
  if(sk>.05){
    cx.globalAlpha=.1+.2*Math.min(1,sk);cx.fillStyle='#cffff6';
    for(let i=0;i<18;i++){
      const yy=H*(.08+((i*61)%89)/89*.7),len=(70+((i*37)%60))*S*(.6+sk),sp=(1400+((i*29)%7)*160)*S,xx=W-((R.t*sp+i*173)%(W+len*2));
      cx.fillRect(xx,yy,len,1.4*S);
    }
    cx.globalAlpha=1;
  }
  /* storm proximity: red edge pulse */
  const near=clamp(1-J.gap/GAP0,0,1);
  if(near>.5){
    const g=cx.createLinearGradient(0,0,W*.35,0);g.addColorStop(0,`rgba(10,12,20,${(near-.5)*.9})`);g.addColorStop(1,'rgba(10,12,20,0)');
    cx.fillStyle=g;cx.fillRect(0,0,W*.35,H);
  }
  /* progress track along the bottom: 🌪 behind you, 🛹 you, 🏁 the end */
  const w=Math.min(W*(W<H?.78:.5),560),x0=(W-w)/2,y=W<H?R.gy+46*S:H*(1-R.lbH)-9*S;
  const dist=J.progS;
  cx.fillStyle='rgba(255,255,255,.16)';cx.fillRect(x0,y-2,w,4);
  cx.fillStyle='rgba(255,217,138,.9)';cx.fillRect(x0,y-2,w*dist,4);
  const sx=x0+w*dist-clamp(J.gap/GAPMAX,0,1)*w*.35;
  cx.fillStyle=`rgba(200,40,80,${.6+.4*near})`;cx.fillRect(x0,y-2,Math.max(0,sx-x0),4);
  cx.font=`${Math.round(13*S)}px system-ui,sans-serif`;cx.textAlign='center';cx.textBaseline='middle';
  cx.fillStyle='#ff4a3a';cx.fillText('◉',Math.max(x0,sx),y-9*S);cx.fillStyle='#fff';cx.fillText('🛹',x0+w*dist,y-9*S);cx.fillText('🏁',x0+w,y-9*S);
  cx.restore();
};

/* ---------- hooks ---------- */
const dob=R.ground.drawObs;R.ground.drawObs=function(){if(R.vec&&R.vec.on())R.vec.drawObs(dob);else dob.apply(this,arguments);J.drawWorld()};
const sd=R.storm.draw;R.storm.draw=function(){sd.apply(this,arguments);J.drawStorm()};
const dr=R.draw;R.draw=function(){dr.apply(this,arguments);J.drawHud()};
J.reset=function(){document.body.classList.remove('vec');if(R.sfx){R.sfx.hum(0,0,1);R.sfx.wind(0)}DR.x=-400;DR.shown=0;J.runId++;J.wx=null;J.wxK=0;J.wxT=30;J.smT=0;J.ts=1;J.atkT=12;J.items.length=0;J.state='idle';J.mul=1;J.boostT=J.slowT=J.autoT=0;J.gap=GAP0;J.inAuto=false;J.hud()};
J.resetRun=function(){J.bib=0;J.meter=0;J.bibTot=0;for(const k in J.stats)J.stats[k]=0;J.log.length=0;J.runSeed=(Math.random()*1e9)|0};
})();
