/* Rain of the Word — core: shared state, canvases, resize, master draw pipeline */
window.ROW=window.ROW||{};
(function(){
'use strict';
const R=ROW;

R.TAU=6.28318;
R.tryGet=k=>{try{return localStorage.getItem(k)}catch(e){return null}};
R.trySet=(k,v)=>{try{localStorage.setItem(k,v)}catch(e){}};
R.hexA=(h,a)=>{const n=parseInt(h.slice(1),16);return `rgba(${n>>16&255},${n>>8&255},${n&255},${a})`};
R.clamp=(v,a,b)=>v<a?a:v>b?b:v;
R.lerp=(a,b,k)=>a+(b-a)*k;
R.rnd=(a,b)=>a+Math.random()*(b-a);
R.smooth=x=>{x=R.clamp(x,0,1);return x*x*(3-2*x)};
R.vibrate=p=>{if(navigator.vibrate)try{navigator.vibrate(p)}catch(e){}};
if(!CanvasRenderingContext2D.prototype.roundRect){
  CanvasRenderingContext2D.prototype.roundRect=function(x,y,w,h,r){
    r=Math.min(r,Math.abs(w)/2,Math.abs(h)/2);
    this.moveTo(x+r,y);this.arcTo(x+w,y,x+w,y+h,r);this.arcTo(x+w,y+h,x,y+h,r);
    this.arcTo(x,y+h,x,y,r);this.arcTo(x,y,x+w,y,r);this.closePath();return this;};
}
R.filterOK=(()=>{try{return typeof document.createElement('canvas').getContext('2d').filter==='string'}catch(e){return false}})();

/* ---- canvases ---- */
const cv=document.getElementById('c');R.cv=cv;R.cx=cv.getContext('2d');
R.bc=document.createElement('canvas');R.bx=R.bc.getContext('2d');
R.b2=document.createElement('canvas');R.b2x=R.b2.getContext('2d');
R.after=document.createElement('canvas');R.afterx=R.after.getContext('2d');

/* ---- world / flow state ---- */
R.W=0;R.H=0;R.d=1;R.S=1;R.gy=0;
R.t=0;R.dt=0;R.Q=1;R.fAvg=1/60;R.qt=0;R.menuT=10;
R.st='menu';R.lvl=1;R.done=0;R.hearts=2;R.maxHearts=2;
R.score=0;R.sShown=0;R.sLast=-1;R.streak=0;R.best=0;R.runBest=false;
R.diff=Math.min(2,Math.max(0,+R.tryGet('rotw-diff')||1));
R.fMul=1;R.sMul=1;R.ccAdj=0;R.scoreMul=1;
R.shield=0;R.slowT=0;R.slowF=1;R.wideT=0;R.seekT=0;R.verseMiss=0;R.forceShield=false;
R.paused=false;R.muted=false;
R.focusM=1;R.focusOn=false;R.focusT=0;
R.px=0;R.tx=0;R.prevPx=0;R.lean=0;R.vel=0;R.keys={l:0,r:0};
R.verse=null;R.waitT=0;R.spawnT=0;R.ts=1;
R.shake=0;R.flash=0;R.kick_=0;R.overT=0;R.lastIdx=-1;
R.introT=0;R.lbH=0.035;R.CA=0;R.hitStop=0;
R.zs=0;R.wRot=0;R.bPulse=0;R.bRed=0;R.step=0;R.stepT=0;
R.wxI=0;R.locI=0;R.boardI=0;R.transformT=0;
R.transT=0;R.transDur=1.6;R.swapped=false;
R.chain=0;R.checkpoint=1;R.cpScore=0;
R.stats={waves:0,obst:0,med:0,chainBest:0,time:0,dist:0};
R.cards=[];R.bombs=[];
R.layers=[];R.neons=[];R.lamps=[];R.stars=[];R.clouds=[];R.vents=[];R.lightsS=[];R.birds=[];R.blinkers=[];R.chimneys=[];
R.clockFaces=[];R.londonEye=null;R.beacon=null;R.torches=[];
R.noisePat=null;R.hexPat=null;
let col=[];try{col=JSON.parse(R.tryGet('rotw-col')||'[]')}catch(e){}
R.col=col;
R.newCol=false;R.photoBusy=false;

R.rgb=(a,f)=>`rgb(${Math.min(255,a[0]+f*130)|0},${Math.min(255,a[1]+f*150)|0},${Math.min(255,a[2]+f*165)|0})`;
R.F=()=>Math.max(21,27*R.S);

/* ---- resize ---- */
R.onResize=[];
R.resize=function(){
  /* ignore degenerate viewport events (minimised / occluded windows) */
  if(!(innerWidth>10)||!(innerHeight>10))return;
  R.d=Math.min(devicePixelRatio||1,2);
  R.W=innerWidth;R.H=innerHeight;
  cv.width=Math.max(1,R.W*R.d|0);cv.height=Math.max(1,R.H*R.d|0);
  R.cx.setTransform(R.d,0,0,R.d,0,0);
  R.bc.width=Math.max(2,R.W/4|0);R.bc.height=Math.max(2,R.H/4|0);
  R.b2.width=Math.max(2,R.W/10|0);R.b2.height=Math.max(2,R.H/10|0);
  R.after.width=Math.max(2,R.W|0);R.after.height=Math.max(2,R.H|0);
  R.S=Math.max(.72,Math.min(1.35,Math.min(R.W,R.H)/650));
  R.gy=R.H*0.76;
  if(!R.px){R.px=R.tx=R.W/2}
  R.px=R.clamp(R.px,R.W*.07,R.W*.93);
  R.tx=R.clamp(R.tx,R.W*.07,R.W*.93);
  for(const f of R.onResize)f();
};
addEventListener('resize',R.resize,{passive:true});
R.clearWorld=function(){
  R.cards.length=0;
  R.bombs.length=0;
  if(R.fx)R.fx.reset();
};

/* ---- r6 time of day: independent of weather. Each place starts at its own hour and the clock
   runs one full dawn→day→dusk→night cycle every 4 minutes spent there. A lighting tint is laid
   over the scenery (sky, city, ground) — cards, board and HUD stay untinted for readability. ---- */
R.TOD=[ /* phase start, name, scene tint (multiply), soft glow, sky target (top/mid/bot) + how far the sky moves to it */
  {p:0,   n:'Dawn', c:[255,196,176],m:.16,gl:[255,160,130,.05],sky:[[74,70,120],[196,138,140],[250,190,150]],sw:.55,day:.4},
  {p:.14, n:'Day',  c:[255,255,255],m:0,  gl:[0,0,0,0],        sky:[[62,104,166],[128,164,206],[196,206,216]],sw:.7, day:1},
  {p:.50, n:'Dusk', c:[255,180,140],m:.20,gl:[255,130,70,.05], sky:[[40,36,84],[170,90,90],[246,150,90]],sw:.6,day:.3},
  {p:.64, n:'Night',c:[90,104,170], m:.42,gl:[40,60,140,.03],  sky:[[6,8,22],[16,20,46],[30,34,70]],sw:.55,day:0}];
R.todClock=0;R.todBase=0;
R.todSet=function(locI){R.todBase=((locI*0.37+0.15)%1);R.todClock=0};
R.todPhase=()=>(R.todBase+R.todClock/240)%1;
R.todNow=function(){
  const p=R.todPhase(),T=R.TOD;let i=T.length-1;for(let k=0;k<T.length;k++)if(p>=T[k].p)i=k;
  const a=T[i],b=T[(i+1)%T.length],end=i+1<T.length?b.p:1,len=end-a.p,u=(p-a.p)/len;
  /* blend into the next phase over the last 25% of each phase */
  const k=Math.max(0,(u-.75)/.25),o=R._tod||(R._tod={c:[0,0,0],m:0,gl:[0,0,0,0],n:'',night:0,day:0,sw:0,sky:[[0,0,0],[0,0,0],[0,0,0]]});
  for(let j=0;j<3;j++)o.c[j]=a.c[j]+(b.c[j]-a.c[j])*k;
  for(let j=0;j<4;j++)o.gl[j]=a.gl[j]+(b.gl[j]-a.gl[j])*k;
  for(let r=0;r<3;r++)for(let j=0;j<3;j++)o.sky[r][j]=a.sky[r][j]+(b.sky[r][j]-a.sky[r][j])*k;
  o.m=a.m+(b.m-a.m)*k;o.sw=a.sw+(b.sw-a.sw)*k;o.day=a.day+(b.day-a.day)*k;o.n=a.n;
  o.night=(a.n==='Night'?1-k:0)+(b.n==='Night'?k:0);return o;
};
R.drawTod=function(cx,y0,y1,s){
  const t=R._tod;if(!t||t.m<.01)return;
  cx.save();cx.globalCompositeOperation='multiply';
  cx.fillStyle=`rgba(${t.c[0]|0},${t.c[1]|0},${t.c[2]|0},${t.m*s})`;cx.fillRect(-80,y0,R.W+160,y1-y0);
  if(t.gl[3]>.01){cx.globalCompositeOperation='soft-light';cx.fillStyle=`rgba(${t.gl[0]|0},${t.gl[1]|0},${t.gl[2]|0},${t.gl[3]*s*2})`;cx.fillRect(-80,y0,R.W+160,y1-y0)}
  cx.restore();
};
/* ---- r6 quality: user setting (auto/high/medium/low) + adaptive level for auto ---- */
R.QP=[
  {n:'Low',   bg:.5, every:2,bloom2:false,grade:false,grain:false,rain:.55,parts:.5},
  {n:'Medium',bg:.72,every:1,bloom2:false,grade:true, grain:false,rain:.8, parts:.8},
  {n:'High',  bg:1,  every:1,bloom2:true, grade:true, grain:true, rain:1,  parts:1}];
R.qualSet=R.tryGet?(R.tryGet('rotw-quality')||'auto'):'auto';
R.qLv=R.qualSet==='high'?2:R.qualSet==='low'?0:1;
R.qp=()=>R.QP[R.qLv];
R.qOver=0;R.qUnder=0;R.qLog=[];
/* called once per rendered frame with the real frame time: drop a level after 1.5 s over budget (>28 ms),
   climb back after 6 s comfortably under it (<18 ms). Only in auto. */
R.qAdapt=function(ft){
  if(R.qualSet!=='auto')return;
  if(ft>0.028){R.qOver+=ft;R.qUnder=0}else if(ft<0.018){R.qUnder+=ft;R.qOver=Math.max(0,R.qOver-ft*.5)}else{R.qOver=Math.max(0,R.qOver-ft*.25);R.qUnder=0}
  if(R.qOver>1.5&&R.qLv>0){R.qLv--;R.qOver=0;R.qUnder=0;R.bgDirty=true;R.qLog.push({t:+R.t.toFixed(1),lv:R.qLv});if(R.qLog.length>50)R.qLog.shift()}
  else if(R.qUnder>6&&R.qLv<2){R.qLv++;R.qUnder=0;R.qOver=0;R.bgDirty=true;R.qLog.push({t:+R.t.toFixed(1),lv:R.qLv});if(R.qLog.length>50)R.qLog.shift()}
  R.Q=R.qLv>=1?1:0.6;
};
R.setQuality=function(v){R.qualSet=v;R.trySet&&R.trySet('rotw-quality',v);R.qLv=v==='high'?2:v==='low'?0:v==='medium'?1:Math.min(R.qLv,1);R.Q=R.qLv>=1?1:0.6;R.bgDirty=true};
/* ---- master draw pipeline ---- */
R.draw=function(){
  const cx=R.cx,cv2=R.cv,W=R.W,H=R.H,gy=R.gy,d=R.d;
  cx.setTransform(d,0,0,d,0,0);
  cx.save();
  R.cam.compute();R.cam.apply();

  /* r6 perf: the far stack (sky, parallax city, landmarks, back fog, back disasters, far rain) is soft and hazy,
     so at medium/low quality it renders into an offscreen canvas at reduced resolution (low: every 2nd frame)
     and is blitted once. High quality draws it directly at full resolution, exactly as before. */
  R.todNow();
  const q=R.qp();
  R.frameN=(R.frameN||0)+1;
  if(q.bg>=1){
    R.env.drawSky();R.env.drawCity();R.wxSys.drawFogBanks(false);R.disasters.drawBack();R.rain.drawBack();
  }else{
    const bw=Math.max(2,cv2.width*q.bg|0),bh=Math.max(2,cv2.height*q.bg|0);
    if(!R.bgc){R.bgc=document.createElement('canvas');R.bgx=R.bgc.getContext('2d',{alpha:false})}
    let fresh=false;
    if(R.bgc.width!==bw||R.bgc.height!==bh){R.bgc.width=bw;R.bgc.height=bh;fresh=true}
    if(fresh||R.bgDirty||q.every<2||R.frameN%q.every===0||R.flash>.03){
      R.bgDirty=false;
      const main=R.cx,bx2=R.bgx;R.cx=bx2;
      try{bx2.setTransform(d*q.bg,0,0,d*q.bg,0,0);bx2.save();R.cam.apply();
        R.env.drawSky();R.env.drawCity();R.wxSys.drawFogBanks(false);R.disasters.drawBack();R.rain.drawBack();
        bx2.restore();}
      finally{R.cx=main}
    }
    cx.save();cx.setTransform(1,0,0,1,0,0);cx.imageSmoothingEnabled=true;cx.drawImage(R.bgc,0,0,cv2.width,cv2.height);cx.restore();
  }
  R.drawTod(cx,-80,R.gy+2,1);
  R.wxSys.drawHeatHaze();
  R.ground.draw();
  R.drawTod(cx,R.gy,R.H+80,.8);
  R.wxSys.drawSnowAcc();

  R.board.drawSpray();

  /* reflections (parameters come from the active ground) */
  cx.save();cx.beginPath();cx.rect(-80,gy,W+160,H-gy+80);cx.clip();
  const rf=R.ground.refl;
  cx.globalAlpha=rf.a;
  cx.translate(0,2*gy);cx.scale(1,-1);
  for(const c of R.cards)R.ent.drawFace(c,true);
  R.board.draw(true);
  cx.restore();

  R.ground.drawObs();
  R.ent.drawGlows();
  R.ent.drawBombs();
  R.fx.drawTrail();
  R.board.draw(false);
  R.fx.drawParticles();
  R.disasters.drawFront();
  R.rain.drawFront();
  R.wxSys.drawFogBanks(true);
  R.storm.draw();
  R.wxSys.overlays();
  cx.restore();

  /* bloom */
  const bx=R.bx;
  bx.setTransform(1,0,0,1,0,0);bx.globalCompositeOperation='source-over';bx.clearRect(0,0,R.bc.width,R.bc.height);
  bx.drawImage(cv2,0,0,R.bc.width,R.bc.height);
  bx.globalCompositeOperation='multiply';bx.drawImage(R.bc,0,0);bx.globalCompositeOperation='source-over';
  /* r9: the Vector look keeps its silhouettes crisp black, so bloom is held well down during a journey run */
  const vecOn=R.vec&&R.vec.on();
  cx.setTransform(1,0,0,1,0,0);cx.globalCompositeOperation='lighter';cx.imageSmoothingEnabled=true;cx.globalAlpha=vecOn?0.08:0.5;
  cx.drawImage(R.bc,0,0,cv2.width,cv2.height);
  if(R.Q>=1&&q.bloom2&&!vecOn){
    R.b2x.setTransform(1,0,0,1,0,0);R.b2x.clearRect(0,0,R.b2.width,R.b2.height);
    R.b2x.drawImage(R.bc,0,0,R.b2.width,R.b2.height);
    cx.globalAlpha=0.36;cx.drawImage(R.b2,0,0,cv2.width,cv2.height);
  }
  /* whip-pan smear */
  const sm=R.cam.smear;
  if(sm>0.02&&R.Q>=1){
    cx.globalAlpha=0.22*Math.min(1,sm*2);
    cx.drawImage(R.bc,-sm*70,0,cv2.width,cv2.height);
    cx.drawImage(R.bc, sm*70,0,cv2.width,cv2.height);
  }
  /* chromatic aberration on impacts */
  if(R.CA>0.05&&R.Q>=1){
    cx.globalAlpha=0.28*Math.min(1,R.CA/6);
    cx.drawImage(R.bc,-R.CA,0,cv2.width,cv2.height);
    cx.drawImage(R.bc, R.CA,0,cv2.width,cv2.height);
  }
  cx.globalAlpha=1;cx.globalCompositeOperation='source-over';

  /* crisp cards (drawn after bloom so words stay readable) */
  cx.setTransform(d,0,0,d,0,0);
  cx.save();R.cam.apply();
  R.ent.drawFaces();
  R.fx.drawFlyTexts();
  cx.restore();

  /* place-transition: dramatic purple-blue warp wash + light-speed streaks */
  if(R.st==='trans'){
    const p=1-R.transT/R.transDur;
    const a=Math.min(1,p<0.5?p*2:(1-p)*2);
    const g=cx.createLinearGradient(0,0,0,H);
    g.addColorStop(0,`rgba(12,16,52,${a*0.92})`);
    g.addColorStop(0.42,`rgba(46,26,100,${a*0.9})`);
    g.addColorStop(0.72,`rgba(22,18,62,${a*0.9})`);
    g.addColorStop(1,`rgba(8,10,34,${a*0.86})`);
    cx.fillStyle=g;cx.fillRect(0,0,W,H);
    /* violet-cyan bloom behind the title card */
    const bl=cx.createRadialGradient(W/2,H*0.42,0,W/2,H*0.42,W*0.55);
    bl.addColorStop(0,`rgba(124,92,255,${a*0.44})`);
    bl.addColorStop(0.45,`rgba(64,210,235,${a*0.16})`);
    bl.addColorStop(1,'rgba(0,0,0,0)');
    cx.fillStyle=bl;cx.fillRect(0,0,W,H);
    /* light-speed streaks in the game's neon palette */
    if(a>0.12){
      cx.save();cx.globalCompositeOperation='lighter';cx.lineCap='round';
      const cols2=['95,242,230','138,123,255','255,79,163'];
      for(let i=0;i<22;i++){
        const sp=0.35+((i*37)%10)*0.09;
        const u=((R.t*sp)+i*0.618)%1;
        const y=H*(0.12+((i*97)%76)/100);
        const len=W*(0.10+((i*53)%22)/100);
        const x=u*(W+len*2)-len;
        const c2=cols2[i%3];
        const sg=cx.createLinearGradient(x-len,y,x,y);
        sg.addColorStop(0,`rgba(${c2},0)`);
        sg.addColorStop(1,`rgba(${c2},${0.32*a*(0.4+0.6*((i*29)%10)/10)})`);
        cx.strokeStyle=sg;cx.lineWidth=1.4+((i*13)%3)*0.7;
        cx.beginPath();cx.moveTo(x-len,y);cx.lineTo(x,y);cx.stroke();
      }
      cx.restore();
    }
  }

  /* vignette */
  /* r5 perf: vignette and grade gradients are cached per screen size */
  cx.fillStyle=R.ground.cgrad('vig',W,H,()=>{const vg=cx.createRadialGradient(W/2,H/2,Math.min(W,H)*0.32,W/2,H/2,Math.max(W,H)*0.78);
  vg.addColorStop(0,'rgba(0,0,0,0)');vg.addColorStop(1,'rgba(0,0,0,0.7)');return vg});cx.fillRect(0,0,W,H);
  /* filmic grade: warm highlights, cool shadows */
  if(q.grade){cx.globalCompositeOperation='soft-light';
  cx.fillStyle=R.ground.cgrad('grade',W,H,()=>{const cg=cx.createLinearGradient(0,0,0,H);
  cg.addColorStop(0,'rgba(255,190,120,0.10)');cg.addColorStop(0.55,'rgba(128,128,128,0)');cg.addColorStop(1,'rgba(60,110,190,0.16)');return cg});cx.fillRect(0,0,W,H);
  cx.globalCompositeOperation='source-over';}
  if(R.noisePat&&q.grain){
    cx.save();cx.setTransform(1,0,0,1,0,0);cx.globalAlpha=0.045;cx.fillStyle=R.noisePat;
    cx.translate((Math.random()*96)|0,(Math.random()*96)|0);cx.fillRect(-96,-96,cv2.width+96,cv2.height+96);cx.restore();
  }
  R.fx.drawDroplets();
  /* cinematic letterbox */
  cx.fillStyle='#000';cx.fillRect(0,0,W,H*R.lbH);cx.fillRect(0,H*(1-R.lbH),W,H*R.lbH);
  if(R.st==='dying'){cx.fillStyle=`rgba(0,0,0,${Math.min(1,1-R.overT/1.2)})`;cx.fillRect(0,0,W,H)}
  if(R.st==='over'){cx.fillStyle='rgba(0,0,0,0.6)';cx.fillRect(0,0,W,H)}
};
})();
