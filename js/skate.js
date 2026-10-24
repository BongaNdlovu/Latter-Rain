/* Rain of the Word — skate (round 5): momentum steering, pushing, charged ollies with tail pop,
   coyote time + jump buffer, skateable surfaces (curb, ledge, bench, rail, stairs, kicker, gap),
   grinds/slides with balance, physics crashes (board tumbles and bounces), rolling-wheel audio.
   Board-only: no rider is ever drawn. Overrides R.board.jump / R.board.update. */
window.ROW=window.ROW||{};
(function(){
'use strict';
const R=ROW,B=R.board;
const S=R.skate={vx:0,ax:0,push:0,charge:-1,coyote:0,buf:0,grind:null,crash:null,pitch:0,pitchV:0,
  surf:null,sup:0,lastLand:0,sketch:0,airT:0,popT:9,crashes:{slam:0,trip:0,overrot:0,primo:0},grinds:0,ledgeLands:0,lastCrash:null,airMax:0,jumps:[]};
const CM=()=>1.95*R.S;                 /* 1 cm in px: the deck is 80 cm = 156 px at S=1 */
const G_=()=>2450*R.S;                 /* gravity, px/s² (tuned so a full ollie hangs about 0.5-0.75 s) */
S.CM=CM;
/* r8: the auto-run ollie is 30% higher / longer so a tap clears wide hazards with a forgiving timing window */
S.jumpMul=()=>R.journey&&R.journey.locked()?1.3:1;
const active=()=>(R.st==='play'||R.st==='wait'||R.st==='trans')&&!R.paused;
S.scroll=()=>R.ground.roadSpeed();   /* the road's screen speed (ground.js uses the same) */
S.speedN=()=>R.clamp((S.scroll()+Math.abs(S.vx)*.6)/(S.scroll()+R.W*.55),0,1);

/* ---------- surfaces ---------- */
/* support height under x for an obstacle (px above the road), or null if it gives no support there */
S.topAt=function(o,x){
  const L=o.x-o.w/2,Rr=o.x+o.w/2;
  if(x<L||x>Rr)return null;
  if(o.type==='kicker')return o.h*R.clamp((x-L)/o.w,0,1);
  if(o.type==='gap'||o.type==='fissure')return -9999;
  return o.land?o.h:null;
};
/* the highest support at the board's x among surfaces whose top is at or under the board */
S.support=function(jy){
  let best=0,src=null;const x=R.px;
  for(const o of R.ground.obs){
    if(!o.land&&o.type!=='gap'&&o.type!=='fissure'&&o.type!=='kicker')continue;
    const t=S.topAt(o,x);if(t===null)continue;
    if(o.type==='gap'||o.type==='fissure'){ if(o.w<30*R.S)continue; if(Math.abs(o.x-x)<o.w/2-18*R.S&&best<=0){best=-9999;src=o} continue }
    if(t<=jy+(o.type==='kicker'?14*R.S:3*R.S)&&t>=best){best=t;src=o}
  }
  return {h:best,o:src};
};

/* ---------- jumping ---------- */
/* r5b: the ollie fires on KEYDOWN (same physics step). A tap is a full ollie; holding while rising adds a
   little extra height (never delays take-off). Jump buffer 120 ms before landing / bail recovery, coyote 100 ms. */
S.BUF=0.12;S.held=0;S.lastPress=null;S.ignored=0;
S.canPop=()=>active()&&!S.crash&&(B.grounded||S.coyote>0||!!S.grind);
S.press=function(){
  S.held=1;
  if(!active())return 'inactive';
  S.lastPress={t:performance.now(),step:R.main&&R.main.steps};
  if(S.canPop()){S.pop(0.5);return 'pop'}
  S.buf=S.BUF;                                       /* airborne or recovering: buffered for 120 ms */
  if(S.crash&&S.crash.t<S.crashT+0.35-S.BUF){S.ignored++;
    R.fx.flyTexts.push({w:'Recovering…',x:R.px,y:R.gy-110*R.S,t:0,col:'255,200,140',small:1})}
  return 'buffered';
};
S.release=function(){S.held=0};
S.tryPop=function(){return S.canPop()?S.pop(0.5):false};
S.pop=function(c){
  if(!active()||S.crash)return false;
  if(!(B.grounded||S.coyote>0||S.grind))return false;
  const def=B.def();
  const h=(68+42*S.speedN()+55*(c||0))*R.S*def.jump*S.jumpMul();     /* tap = full ollie (~55-75 cm); hold adds up to ~12 cm */
  let v=Math.sqrt(2*G_()*h);
  if(S.surf&&S.surf.type==='kicker'){v+=260*R.S;S.kickLaunch=1}
  if(S.grind)S.endGrind(true);
  if(R.main)R.main.kick=1;B.jv=v;B.grounded=false;S.coyote=0;S.buf=0;B.jy+=Math.min(3*R.S,v/120);S.sup0=B.jy;S.airT=0;S.airMax=B.jy;S.popT=0;S.popC=c||0;S.jl=1;
  /* tail pop: the tail slaps down, the nose rises, then the front foot levels it out */
  S.pitchV=7.5;S.pitch=Math.max(S.pitch,.05);
  const tail=R.px-60*R.S*(S.vx<-5?-1:1);
  R.fx.burst(tail,R.gy-B.jy,'rgba(255,214,150,0.9)',6,160);
  R.fx.burst(R.px,R.gy-B.jy,'rgba(200,220,240,0.6)',6,120);
  /* r6: crisper, louder pop (tail snap + wood knock) — measured 1.6× over the street bed before, too quiet */
  R.audio.noise(1800,'bandpass',0.5,0.05);R.audio.noise(500,'lowpass',0.3,0.09);R.audio.tone(170,'triangle',0.16,0.05);
  R.vibrate(12);
  if(R.tricks)R.tricks.onJump();
  S.jumps.push({h:Math.round(h/CM()),c:+(c||0).toFixed(2)});if(S.jumps.length>30)S.jumps.shift();
  return true;
};
B.jump=function(){const r=S.press();S.held=0;return r};    /* touch button / swipe: same instant pop + buffer */

/* ---------- crashes ---------- */
const BANNER={slam:'Slam!',trip:'Tripped!',overrot:'Over-rotated!',primo:'Primo!'};
S.crashT=1.35;
S.doCrash=function(type,o,why){
  if(S.crash)return;
  if(S.grind)S.endGrind(false,true);
  const fwd=S.vx<-20?-1:1,sp=S.scroll()+Math.abs(S.vx);
  const k=S.crash={type,why:why||type,t:0,x:R.px,y:Math.max(0,B.jy),
    vx:fwd*(type==='slam'?-0.35:0.8)*sp+(Math.random()-.5)*60*R.S,
    vy:(type==='slam'?240:type==='trip'?380:type==='primo'?160:300)*R.S,
    fa:type==='primo'?Math.PI/2:0,sa:R.lean*.35,ti:0,
    faV:(type==='trip'?9:type==='overrot'?3:type==='primo'?1.2:-6)*(Math.random()<.5?-1:1),
    saV:(type==='overrot'?11:type==='slam'?5:3)*(Math.random()<.5?-1:1),
    tiV:(type==='slam'?-8:6),bounces:0,rest:false};
  S.crashes[type]++;S.lastCrash={type,why:k.why,t:R.t};
  B.grounded=true;B.jv=0;B.jy=0;S.charge=-1;S.vx*=0.15;
  if(R.tricks)R.tricks.crashReset();
  R.tricks.slowHold=Math.max(R.tricks.slowHold,0.45);           /* a breath of slow-mo */
  R.shake=Math.max(R.shake,type==='slam'?1.3:0.9);R.CA=Math.max(R.CA,5);R.cam.punchFn(type==='slam'?1.3:0.9);
  const dust=R.LOC[R.locI].ground==='snow'?'rgba(240,248,255,0.85)':R.LOC[R.locI].ground==='sand'?'rgba(210,170,110,0.85)':'rgba(190,190,205,0.8)';
  R.fx.burst(R.px,R.gy-k.y,dust,26,300);
  R.audio.noise(300,'lowpass',.55,.35);R.audio.noise(2400,'highpass',.2,.12);R.audio.tone(80,'sine',.3,.12);
  R.vibrate([50,30,60]);
  R.tricks.banner(BANNER[type]||'Bail!','#ff6a3d');
  R.fx.flyTexts.push({w:BANNER[type],x:R.px,y:R.gy-90*R.S,t:0,col:'255,120,90',small:1});
};
/* obstacle crash: a heart (or the shield) pays for it */
S.obstacleCrash=function(o,type,why){
  if(S.crash)return;
  o.scored=true;
  if(R.shield>0){R.main.hitObstacle(o);B.jv=Math.max(B.jv,300*R.S);B.grounded=false;return}
  R.main.hitObstacle(o);
  S.doCrash(type,o,why);
};
function updCrash(dt){
  const k=S.crash;k.t+=dt;
  const g=G_()*0.9;
  if(!k.rest){
    k.vy-=g*dt;k.y+=k.vy*dt;k.x+=k.vx*dt;
    k.fa+=k.faV*dt;k.sa+=k.saV*dt;k.ti+=k.tiV*dt;
    if(k.y<=0){
      k.y=0;
      if(Math.abs(k.vy)>90*R.S&&k.bounces<4){
        k.bounces++;k.vy=-k.vy*0.38;k.vx*=0.72;k.faV*=-.55;k.saV*=.6;k.tiV*=-.5;
        R.fx.burst(k.x,R.gy,'rgba(255,200,120,0.95)',10+6*(4-k.bounces),260);     /* scrape sparks */
        R.fx.burst(k.x,R.gy,'rgba(180,180,195,0.7)',8,140);
        R.audio.noise(1200,'bandpass',.25/(k.bounces),.08);R.audio.tone(140,'triangle',.12/(k.bounces),.06);
        R.shake=Math.max(R.shake,.35/k.bounces);
      }else{k.vy=0;
        /* slide to rest: deck scrapes, the road carries it back */
        k.vx+=(-S.scroll()*0.5-k.vx)*Math.min(1,dt*2.4);
        k.faV*=Math.exp(-dt*6);k.saV*=Math.exp(-dt*4);k.tiV*=Math.exp(-dt*6);
        if(Math.random()<dt*30)R.fx.add(k.x,R.gy,-k.vx*.2+(Math.random()-.5)*40,-40-Math.random()*60,.35,'rgba(255,190,100,.9)',1.2*R.S);
        /* settle on a face: deck up or wheels up */
        const tgt=Math.round(k.fa/Math.PI)*Math.PI;k.fa+=(tgt-k.fa)*Math.min(1,dt*5);k.ti+=(0-k.ti)*Math.min(1,dt*5);
        if(k.t>0.9)k.rest=true;
      }
    }
  }
  if(k.t>S.crashT){                                          /* recovery: the board is back under you */
    const u=R.smooth((k.t-S.crashT)/0.35);
    k.x+=(R.px-k.x)*u;k.y*=1-u;k.fa*=(1-u);k.sa+=(R.lean*.35-k.sa)*u;k.ti*=(1-u);
    if(k.t>S.crashT+0.35){S.crash=null;R.tricks.mLock=1;if(S.buf>0){S.buf=0;S.pop(0.5)}}
  }
}

/* ---------- grinds ---------- */
S.startGrind=function(o){
  const slide=!!(R.tricks.keys.dn);   /* ↓ held = boardslide */
  S.grind={o,n:slide?'Boardslide':'50-50 Grind',bal:(Math.random()-.5)*.2,t:0,slide};
  S.grinds++;S.vx=0;B.jy=o.h;B.jv=0;B.grounded=true;
  R.audio.noise(3000,'bandpass',.25,.25);
  R.fx.burst(R.px,R.gy-o.h,'rgba(255,210,140,0.95)',16,260);
  R.tricks.banner(S.grind.n,'#5ff2e6');
};
S.endGrind=function(popped,failed){
  const g=S.grind;if(!g)return;S.grind=null;
  if(failed)return;
  const pts=Math.round(150+g.t*420);
  if(g.t>0.25){R.tricks.air.push(g.n);R.tricks.airPts+=pts}
  if(!popped){B.jv=120*R.S;B.grounded=false}   /* rolled off the end */
};
function updGrind(dt){
  const g=S.grind,o=g.o;g.t+=dt;
  /* balance: unstable equilibrium, nudged by the rail; A/D (or the pointer side) correct it */
  const inp=(R.keys.r?1:0)-(R.keys.l?1:0);
  if(R.journey&&R.journey.locked())g.bal*=Math.exp(-dt*2.5);          /* r8: grinds balance themselves on the auto-run */
  else g.bal+=(g.bal*1.5+(Math.random()-.5)*1.6+Math.sin(R.t*3.1)*.25)*dt-inp*2.6*dt;
  B.jy=o.h;B.jv=0;S.vx=0;
  if(Math.random()<dt*40)R.fx.add(R.px+(Math.random()<.5?-45:45)*R.S,R.gy-o.h,-S.scroll()*.4-(Math.random()*120),-60-Math.random()*120,.4,'rgba(255,200,110,.95)',1.3*R.S);
  R.tricks.comboT=Math.max(R.tricks.comboT,.8);
  const off=Math.abs(o.x-R.px)>o.w/2+8*R.S;
  if(Math.abs(g.bal)>1){S.grind=null;S.doCrash('trip',o,'lost balance on '+o.type);return}
  if(off)S.endGrind(false);
}

/* ---------- obstacle contact ---------- */
const HB=()=>34*R.S;                 /* half wheelbase (trucks ~36 cm apart) */
function contact(dt){
  if(R.st!=='play')return;
  const x=R.px,hb=HB(),jy=B.jy;
  for(const o of R.ground.obs){
    if(o.dead||o.scored&&!o.land)continue;
    const dx=Math.abs(o.x-x),ov=dx<o.w/2+hb;
    const wasOv=o.ov;o.ov=ov;
    if(o.type==='puddle'){
      if(ov&&!o.splashed&&B.grounded&&jy<4*R.S){o.splashed=1;R.fx.burst(x,R.gy,'rgba(190,232,255,0.9)',22,300);R.audio.noise(900,'bandpass',0.25,0.25);S.vx*=0.8;R.ts=Math.min(R.ts,.85)}
      continue;
    }
    if(o.type==='pothole'){
      if(dx<o.w/2-6*R.S&&B.grounded&&jy<4*R.S&&!o.scored){S.obstacleCrash(o,'trip','front wheels dropped into a pothole')}
      else if(dx<o.w/2&&!B.grounded&&!o.scored&&jy>4*R.S){o.scored=true;R.main.scoreAir(o)}
      continue;
    }
    if(o.bot!=null){
      /* r9 bridge deck: only its top is solid. The lower route passes under it; a jump under it bonks the
         board back down; reaching the deck edge near its top height lands you on it. */
      if(!ov)continue;
      if(jy>=o.h-2*R.S){if(!B.grounded)o.touchedAir=1;continue}
      if(jy+26*R.S<=o.bot)continue;
      if(jy>o.h-18*R.S){B.jy=o.h;B.jv=0;B.grounded=true;S.landOn(o,true)}
      else{B.jy=Math.max(0,o.bot-26*R.S);B.jv=Math.min(B.jv,0);if(!o._bonk){o._bonk=1;R.audio.tone(140,'triangle',.12,.06)}}
      continue;
    }
    if(o.type==='gap'||o.type==='fissure'||o.type==='kicker'){       /* handled by support(); score a clean clear */
      if(o.type!=='kicker'&&!ov&&wasOv&&!o.scored&&!S.crash){o.scored=true;R.main.scoreAir(o)}
      continue}
    if(!ov){
      /* cleared it in the air */
      if(wasOv&&!o.scored&&o.touchedAir){o.scored=true;R.main.scoreAir(o)}
      continue;
    }
    const top=o.h;
    if(jy>=top-2*R.S){ if(!B.grounded)o.touchedAir=1; continue }   /* above it (or riding on top) */
    if(!wasOv){
      /* first contact with the face: clipping the top edge catches the wheels, otherwise a full slam */
      if(o.land&&jy>top-5*R.S){ B.jy=top;B.jv=0;B.grounded=true;S.landOn(o,true);continue }
      if(jy>top-12*R.S){
        S.obstacleCrash(o,'trip','wheels clipped the '+o.type+' edge');}
      else {const big=top/CM()>=22;S.obstacleCrash(o,big?'slam':'trip',big?'slammed into the '+o.type:'wheels caught the '+o.type)}
      continue;
    }
    /* came down onto something you cannot land on */
    if(!o.land&&!B.grounded&&jy<top){S.obstacleCrash(o,'slam','landed on the '+o.type)}
  }
}

/* ---------- landing ---------- */
S.landOn=function(o,edge){
  /* rails always grind; ledges/benches grind only with ↓ held, otherwise you land and ride on top */
  if(o&&(o.type==='rail'||((o.type==='bench'||o.type==='ledge')&&R.tricks.keys.dn))&&!edge&&R.st==='play'&&Math.abs(o.x-R.px)<o.w/2){S.startGrind(o);return 'grind'}
  if(o&&o.land&&o.type!=='kicker'){S.ledgeLands++;o.touchedAir=1;
    if(!o.scored&&R.st==='play'){o.scored=true;R.main.scoreAir(o)}}
  return 'ride';
};
function land(jv,o){
  const hard=Math.min(1,Math.abs(jv)/(1100*R.S));
  B.jy=S.sup;B.jv=0;B.grounded=true;S.lastLand=R.t;
  S.pitch*=0.3;S.pitchV=0;
  /* trick verdict first (may crash) */
  let v='ok';
  if(R.tricks)v=R.tricks.onLand(jv,S.pitch);
  if(v&&v!=='ok'&&v!=='sketchy'){S.doCrash(v,o,'trick landing');return}
  const mode=S.landOn(o,false);
  /* compression, dust, a little speed scrubbed off */
  B.squash=Math.min(1,.35+hard);
  R.cam.punchFn(.15+hard*.4);
  if(hard>.25)R.shake=Math.max(R.shake,.08+hard*.3);
  const gr=R.LOC[R.locI].ground;
  const dust=gr==='sand'?'rgba(210,170,110,0.8)':gr==='snow'?'rgba(240,248,255,0.85)':'rgba(200,235,255,0.8)';
  R.fx.burst(R.px,R.gy-B.jy,dust,8+hard*16|0,160+hard*160);
  if(hard>.55)R.fx.burst(R.px,R.gy-B.jy,'rgba(255,200,120,.9)',8,220);
  R.audio.noise(260,'lowpass',.18+hard*.3,.12);R.audio.tone(90,'sine',.08,.06+hard*.08);
  S.vx*=0.9-hard*0.1;R.ts=Math.min(R.ts,1-hard*.18);
  if(v==='sketchy'){S.sketch=0.6;S.vx*=.8;R.ts=Math.min(R.ts,.75);R.tricks.banner('Sketchy','#ffd98a')}
  if(S.buf>0&&mode!=='grind'){S.buf=0;S.pop(0.5)}
  R.vibrate(8);
}

/* ---------- per-step ---------- */
B.update=function(dt){
  B.squash=Math.max(0,B.squash-dt*3.2);
  if(S.held&&!B.grounded&&!S.crash&&B.jv>0&&S.airT<0.2)B.jv+=G_()*0.3*dt;   /* hold = a little higher */
  if(S.fall&&!B.grounded&&!S.crash&&!S.grind)B.jv-=G_()*1.5*dt;            /* r8: down in the air = fast-fall (pick the LOWER gate word) */
  if(S.buf>0)S.buf-=dt;
  if(S.coyote>0)S.coyote-=dt;
  S.sketch=Math.max(0,S.sketch-dt);
  if(S.crash){updCrash(dt);}
  else if(S.grind){updGrind(dt)}
  else{
    const sp=S.support(B.jy);S.surf=sp.o;
    if(B.grounded){
      if(sp.h<B.jy-2*R.S){
        /* rolled off an edge (or into a gap): coyote window, then gravity */
        B.grounded=false;B.jv=S.kickLaunch?B.jv:0;S.coyote=0.1;S.sup0=B.jy;
        if(S.prevSurf&&S.prevSurf.type==='kicker'){B.jv=Math.max(B.jv,(S.scroll()+S.vx)*0.9+180*R.S);R.fx.burst(R.px,R.gy-B.jy,'rgba(200,220,240,.6)',8,140)}
      }else{B.jy=Math.max(0,sp.h);B.jv=0}
    }
    if(!B.grounded){
      S.airT+=dt;
      const y0=B.jy;
      B.jv-=G_()*dt;B.jy+=B.jv*dt;S.airMax=Math.max(S.airMax,B.jy);
      /* swept test: any top we passed through this step (between y0 and the new jy) catches the board */
      const sp2=S.support(Math.max(B.jy,y0));
      /* r9: over a gap there is no floor — the board drops out of sight (auto-run: a long visible fall) before it counts */
      if(sp2.h===-9999){if(B.jy<-(R.journey&&R.journey.locked()?R.H*.12:6*R.S))S.obstacleCrash(sp2.o,'slam',sp2.o.type==='fissure'?'fell into the fissure':'fell into the gap')}
      else if(B.jv<=0&&B.jy<=Math.max(0,sp2.h)){S.sup=Math.max(0,sp2.h);const j=B.jv;
        if(S.jumps.length&&S.jl){S.jl=0;const J=S.jumps[S.jumps.length-1];J.air=+S.airT.toFixed(2);J.peak=Math.round((S.airMax-(S.sup0||0))/CM())}
        land(j,sp2.o)}
    }
    S.prevSurf=S.surf;if(B.grounded)S.kickLaunch=0;
    {const sh=S.support(B.jy).h;S.shadowH=sh>0?sh:0}
    contact(dt);
  }
  /* board pitch: tail pop → nose up → levelled by the front foot; follows a kicker's slope */
  S.popT+=dt;
  let pt=0;
  if(B.grounded&&S.surf&&S.surf.type==='kicker'&&!S.crash)pt=Math.atan(S.surf.h/S.surf.w)*(S.vx<-5?-1:1);
  if(!B.grounded&&S.popT<0.3)S.pitchV+=(-S.pitch*90-S.pitchV*12)*dt*(S.popT>0.09?1:0.15);
  else S.pitchV+=((pt-S.pitch)*160-S.pitchV*22)*dt;
  S.pitch+=S.pitchV*dt;S.pitch=R.clamp(S.pitch,-.7,.7);
  /* Transformer embers */
  if(R.transformT>0&&active()&&Math.random()<.9){
    R.fx.add(R.px-38*R.S+(Math.random()-0.5)*10*R.S,R.gy-B.jy-8*R.S+(Math.random()-0.5)*8*R.S,-Math.abs(R.vel)*0.25-(30+Math.random()*50),-(20+Math.random()*80),0.45,'rgba(255,190,90,0.9)',(1+Math.random()*1.8)*R.S);
  }
  /* wheel spray on wet roads */
  if((active()||R.st==='menu')&&B.jy<10&&B.grounded&&!S.crash&&R.wx.wet>.2){
    const n=Math.abs(R.vel)>R.W*0.15?2:1;
    for(let i=0;i<n;i++)if(Math.random()<.8)R.fx.add(R.px+(Math.random()<.5?-1:1)*44*R.S+(Math.random()-0.5)*14*R.S,R.gy+2*R.S,(Math.random()-0.5)*200-R.lean*160,-70-Math.random()*170,0.5,'rgba(190,232,255,0.85)',(1+Math.random()*1.6)*R.S);
  }
  rollAudio();
};

/* ---------- horizontal: momentum, pushing, friction, carving ---------- */
S.ptr=false;
S.move=function(dt){
  R.prevPx=R.px;
  const def=B.def(),spd=def.speed,W=R.W;
  const vmax=W*0.8*spd,ACC=W*1.6*spd;
  let ax=0;
  const JN=R.journey;
  if(JN&&JN.locked()){
    /* r8 auto-run: the board holds its place on screen (no steering, like Vector); crashes, tornadoes and
       boosts shove it and a critically damped spring brings it back */
    ax=(JN.anchorX()-R.px)*70-S.vx*15;
    S.vx=R.clamp(S.vx+ax*dt,-vmax,vmax);
    S.ptr=false;S.push=0;
  }
  else if(S.crash||S.grind||!active()){S.vx*=Math.exp(-dt*8)}
  else{
    const dir=(R.keys.r?1:0)-(R.keys.l?1:0);
    const ctl=B.grounded?1:0.25;                       /* little air control, like real skating */
    if(dir){
      S.ptr=false;
      const braking=Math.sign(S.vx)===-dir&&Math.abs(S.vx)>20;
      if(B.grounded&&!braking&&Math.abs(S.vx)<vmax*.85){
        /* push strokes: the foot kicks in pulses */
        const p0=S.push;S.push+=dt*2.4;
        if((p0%1)>(S.push%1)){R.audio.noise(420,'lowpass',.07,.12);R.fx.burst(R.px-dir*30*R.S,R.gy,'rgba(200,210,225,.45)',3,70)}
        ax=dir*ACC*(0.5+0.9*Math.max(0,Math.sin((S.push%1)*Math.PI)));
      }else ax=dir*ACC*(braking?1.5:.55);
      ax*=ctl;
    }else if(S.ptr){
      /* pointer/touch: critically damped spring toward the finger */
      ax=((R.tx-R.px)*95-S.vx*19.5)*ctl;
      ax=R.clamp(ax,-ACC*1.6,ACC*1.6);
    }
    S.vx+=ax*dt;
    /* rolling friction + air drag */
    const fr=(B.grounded?W*0.42:W*0.05)*dt;
    if(!dir&&!S.ptr)S.vx=Math.abs(S.vx)<=fr?0:S.vx-Math.sign(S.vx)*fr;
    S.vx=R.clamp(S.vx,-vmax,vmax);
  }
  R.px+=S.vx*dt;
  const lo=W*0.07,hi=W*0.93;
  if(R.px<lo){R.px=lo;S.vx=Math.max(0,S.vx)}else if(R.px>hi){R.px=hi;S.vx=Math.min(0,S.vx)}
  if(!S.ptr)R.tx=R.px;
  R.vel=S.vx;S.ax=ax;
  /* carve lean from speed and lateral acceleration */
  const leanT=R.clamp(S.vx/(W*0.9)+ax/(W*9),-1,1)*(S.grind?0:1);
  R.lean+=(leanT-R.lean)*Math.min(1,dt*8);
};
S.knock=function(dx){S.vx=dx*4};

/* ---------- rolling wheel noise (one looping node; gain and pitch track speed) ---------- */
let rn=null;
function rollAudio(){
  const A=R.audio;if(!A.ready()||!A.nb)return;
  const AC=A.AC;
  if(!rn){try{
    const s=AC.createBufferSource();s.buffer=A.nb;s.loop=true;
    const f=AC.createBiquadFilter();f.type='bandpass';f.frequency.value=300;f.Q.value=.7;
    const g=AC.createGain();g.gain.value=0;s.connect(f);f.connect(g);g.connect(A.M);s.start();rn={s,f,g};
  }catch(e){rn={g:null};return}}
  if(!rn.g)return;
  const on=active()&&B.grounded&&!S.crash;
  const v=S.speedN();
  const tgt=on?(S.grind?.10:.035+.06*v):0;
  rn.g.gain.setTargetAtTime(tgt,AC.currentTime,.08);
  rn.f.frequency.setTargetAtTime(S.grind?2600:180+520*v,AC.currentTime,.1);
}

/* ---------- board pose for the renderer ---------- */
S.pose=function(o){
  const k=S.crash;
  if(k){o.flipAngle=k.fa;o.spinAngle=k.sa;o.tilt=k.ti;return o}
  if(S.grind){o.tilt=0;o.spinAngle=S.grind.slide?Math.PI/2*.9:R.lean*.2;o.flipAngle+=S.grind.bal*.25}
  o.tilt=(o.tilt||0)+S.pitch*(S.vx<-5?-1:1);
  
  return o;
};
S.drawX=()=>S.crash?S.crash.x:R.px;
S.drawY=()=>S.crash?S.crash.y:B.jy;

S.reset=function(){
  S.vx=0;S.push=0;S.fall=0;S.charge=-1;S.coyote=0;S.buf=0;S.grind=null;S.crash=null;S.pitch=0;S.pitchV=0;S.surf=null;S.sup=0;S.sketch=0;S.ptr=false;
  B.jy=0;B.jv=0;B.grounded=true;
};
})();
