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

/* ---------- road obstacles (round 5: real-world sizes, measured against the 80 cm deck) ----------
   [width cm, height cm, kind, land]   kind: 'skate' = skateable (points), 'haz' = hazard (costs a heart),
   'flat' = surface feature. 1 cm = 1.95*R.S px (the deck is 80 cm = 156 px). */
const CMP=()=>1.95*R.S;
const OB_DEFS={
  /* skateable street furniture */
  curb:[150,13,'skate',1], ledge:[190,40,'skate',1], bench:[150,45,'skate',1], rail:[230,36,'skate',1],
  stairs:[170,40,'skate',1], kicker:[105,28,'skate',0], gap:[70,0,'skate',0], dock:[180,30,'skate',1],
  /* hazards: ollie them or lose a heart */
  cone:[22,34,'haz',0], crate:[46,36,'haz',0], rock:[44,26,'haz',0], log:[85,22,'haz',0], buoy:[26,34,'haz',0],
  pot:[34,36,'haz',0], block:[44,30,'haz',0], stump:[36,28,'haz',0], barrel:[36,40,'haz',0],
  icerock:[42,28,'haz',0], mound:[70,20,'haz',0], tire:[48,48,'haz',0],
  /* place-themed props */
  bin:[36,42,'haz',0], chair:[40,44,'haz',0], hydrant:[30,40,'haz',0], deskrock:[60,30,'haz',0],
  vend:[0,0,'haz',0], barrier:[90,38,'haz',0], cart:[60,40,'haz',0],
  /* r11 bigger, real rooftop and street plant (landable ones you can ride across the top of) */
  acunit:[90,55,'skate',1], skip:[180,58,'skate',1], pallet:[120,26,'skate',1], tank:[72,60,'haz',0], ventstack:[40,62,'haz',0],
  generator:[110,50,'skate',1],
  /* r11 furniture for the indoor rooms */
  desk:[130,46,'haz',0], sofa:[160,42,'haz',0], boxes:[70,52,'haz',0], cabinet:[60,58,'haz',0],
  /* surface */
  pothole:[60,0,'flat',0], puddle:[120,0,'flat',0],
  /* disaster-made */
  fissure:[75,0,'haz',0], fire:[80,40,'haz',0], debris:[50,30,'haz',0]
};
const OB_TYPES={
  water:['log','buoy','dock','kicker','dock','log'],
  asphalt:['cone','crate','curb','ledge','rail','stairs','kicker','gap','pothole','puddle','bench','acunit','skip','tank','ventstack','generator','pallet'],
  flagstone:['pot','block','curb','ledge','bench','stairs','rail','kicker','puddle','acunit','tank','ventstack','pallet'],
  cobble:['pot','block','curb','ledge','bench','stairs','rail','kicker','puddle','bin','chair','acunit','skip','ventstack'],
  forest:['stump','log','rock','kicker','curb','puddle'],
  sand:['rock','barrel','kicker','curb','deskrock','deskrock'],
  snow:['icerock','mound','kicker','rail','curb']
};
/* the place adds its own street props */
const THEME={london:['bin','bin'],paris:['chair','chair'],newyork:['hydrant','hydrant'],mesa:['deskrock'],
  tokyo:['barrier','barrier'],city:['hydrant','cart'],stone:['cart'],colonnade:['pot']};
G.OB_DEFS=OB_DEFS;
G.resetObs=function(){G.obs.length=0;G.obsT=4;G.medkit=null;G.medkitUsed=false};
/* r8: run speed grows with the level; narrow (portrait) screens are slowed so an obstacle still takes ~1.2 s to arrive */
G.roadSpeed=()=>(600+R.lvl*22)*R.S*Math.max(.5,Math.min(1,R.W/(1000*R.S)))*(0.4+0.6*R.slowF);
G.OB_TYPES=OB_TYPES;G.THEME=THEME;
const OB_KEYS=['x','type','w','h','kind','land','scored','roll','a','seed','dead'];G.opool=[];
G.spawnOb=function(force){
  const L=R.LOC[R.locI];
  let types=(OB_TYPES[L.ground]||['rock']).concat(THEME[L.sky]||[]);
  /* r5b fair ramp: level 1 = low props only (no gaps/stairs/rails, nothing taller than 40 cm);
     level 2 adds rails + stairs; tall/wide props (tire, barrier, bin, chair, cart) from level 3 */
  if(!force&&R.lvl<=2){
    const hard1=['gap','stairs','rail','dock','tire','barrier','bin','chair','cart','barrel'],hard2=['gap','tire','barrier','chair'];
    const f=types.filter(t=>(R.lvl<=1?hard1:hard2).indexOf(t)<0);if(f.length)types=f;
  }
  let type=force||((R.lvl>=3&&Math.random()<0.18)?'tire':types[Math.random()*types.length|0]);
  if(type==='vend')type='barrier';
  const d=OB_DEFS[type],c=CMP();
  /* r6 pool: reuse a retired obstacle object (stale per-run flags are cleared) */
  let o=G.opool.pop();
  if(o){for(const k in o)if(OB_KEYS.indexOf(k)<0)o[k]=undefined}else o={};
  o.x=0;o.type=type;o.w=d[0]*c;o.h=d[1]*c;o.kind=d[2];o.land=!!d[3];o.scored=false;o.roll=type==='tire'?1.35:1;o.a=0;o.seed=Math.random();o.dead=false;
  o.x=R.W+o.w/2+60*R.S;
  G.obs.push(o);return o;
};
G.updateObs=function(dt){
  if(R.st==='play'){
    G.obsT-=dt;
    /* fair spacing: never spawn while the last obstacle is still close to the right edge */
    const lastO=G.obs[G.obs.length-1];
    const roomy=!lastO||lastO.x+lastO.w/2<R.W-260*R.S;
    if(G.obsT<=0&&roomy&&!(R.journey&&R.journey.blockObs())){
      G.spawnOb();
      G.obsT=(R.lvl<=1?4.4:R.lvl===2?3.8:1.6+1.8*Math.exp(-(R.lvl-3)/10))*(0.75+Math.random()*0.5);   /* r5b: roomier early levels */
    }
    const critical=R.hearts<=Math.max(1,Math.round(R.maxHearts/3))&&R.hearts>0;
    if(!G.medkitUsed&&!G.medkit&&critical&&R.hearts<R.maxHearts){
      G.medkit={x:R.W+70};
      if(R.main)R.main.showWarn('⚕ A medical kit drops ahead — drive through it!');
      R.audio.arp([523,659],0.3,0.07);
    }
    if(G.medkit){
      G.medkit.x-=dt*(R.journey&&R.journey.active()?G.roadSpeed():(120+R.lvl*8)*R.S*(0.4+0.6*R.slowF));
      if(Math.abs(G.medkit.x-R.px)<32*R.S&&R.board.jy<22*R.S){
        G.medkit=null;G.medkitUsed=true;
        R.main.useMedkit();
      }else if(G.medkit.x<-60){
        G.medkit=null;G.medkitUsed=true;
      }
    }
  }
  const spd=G.roadSpeed();
  /* collision, landing and grinding are resolved by skate.js (solid tops, faces, gaps) */
  let n=0;const A=G.obs;
  for(let i=0;i<A.length;i++){
    const o=A[i];
    const mv=spd*dt*(o.roll||1);
    o.x-=mv;if(o.roll>1)o.a-=mv/(o.w*0.5);
    if(o.x<-o.w/2-90)o.dead=true;
    if(!o.dead)A[n++]=o;else if(G.opool.length<40&&o.type!=='fissure'&&o.type!=='fire'&&o.type!=='debris')G.opool.push(o);
  }
  A.length=n;   /* in-place compaction, no per-frame garbage */
};

const OB_LABEL={fissure:'FISSURE',fire:'FIRE',debris:'debris',curb:'curb',ledge:'ledge',bench:'bench',rail:'rail',stairs:'stairs',kicker:'kicker',gap:'gap',dock:'dock',
  pothole:'pothole',puddle:'puddle',bin:'bin',chair:'café chair',hydrant:'hydrant',deskrock:'rock',barrier:'barrier',cart:'cart',tire:'tyre!'};
/* round 5 obstacle art: concrete, steel and wood at real scale, same painterly palette */
function drawSkateOb(cx,o,x,w,h,L,T,gy){
  const S=R.S,t=o.type;
  if(t==='curb'||t==='ledge'||t==='dock'){
    const top=t==='dock'?'#8a6844':'#9a96a6',face=t==='dock'?'#5e4428':'#6c6878';
    cx.fillStyle=face;cx.fillRect(L,T,w,h);
    cx.fillStyle=top;cx.fillRect(L,T,w,Math.max(3*S,h*0.16));
    /* waxed, worn steel coping on the ledge edge */
    if(t==='ledge'){cx.fillStyle='rgba(220,230,240,.55)';cx.fillRect(L,T,w,2*S)}
    cx.strokeStyle='rgba(0,0,0,.25)';cx.lineWidth=1;
    for(let k=1;k<4;k++){const xx=L+w*k/4;cx.beginPath();cx.moveTo(xx,T+3*S);cx.lineTo(xx,gy);cx.stroke()}
    if(t==='dock'){cx.fillStyle='rgba(40,28,16,.7)';cx.fillRect(L+4*S,gy-2*S,w-8*S,4*S)}
    return true;
  }
  if(t==='bench'){
    const legW=6*S;
    cx.fillStyle='#3a3a44';cx.fillRect(L+w*0.08,T,legW,h);cx.fillRect(L+w*0.92-legW,T,legW,h);
    cx.fillStyle='#8a5c34';cx.fillRect(L,T,w,6*S);
    cx.fillStyle='#a06c40';cx.fillRect(L,T,w,2.4*S);
    cx.fillStyle='rgba(0,0,0,.3)';cx.fillRect(L,T+6*S,w,1.5*S);
    return true;
  }
  if(t==='rail'){
    cx.strokeStyle='#c8ccd6';cx.lineWidth=3.2*S;cx.lineCap='round';
    cx.beginPath();cx.moveTo(L,T);cx.lineTo(L+w,T);cx.stroke();
    cx.strokeStyle='#7a7e8a';cx.lineWidth=2.6*S;
    cx.beginPath();cx.moveTo(L+8*S,T);cx.lineTo(L+8*S,gy);cx.moveTo(L+w-8*S,T);cx.lineTo(L+w-8*S,gy);cx.moveTo(x,T);cx.lineTo(x,gy);cx.stroke();
    cx.strokeStyle='rgba(255,255,255,.6)';cx.lineWidth=1;cx.beginPath();cx.moveTo(L,T-1);cx.lineTo(L+w,T-1);cx.stroke();
    cx.lineCap='butt';return true;
  }
  if(t==='stairs'){
    /* steps on the approach side, landing on top, drop on the far side */
    const n=4,sw=w*0.45/n;
    cx.fillStyle='#7c7888';
    cx.beginPath();cx.moveTo(L,gy);
    for(let k=0;k<n;k++){cx.lineTo(L+k*sw,gy-h*(k+1)/n);cx.lineTo(L+(k+1)*sw,gy-h*(k+1)/n)}
    cx.lineTo(L+w,T);cx.lineTo(L+w,gy);cx.closePath();cx.fill();
    cx.fillStyle='rgba(255,255,255,.16)';
    for(let k=0;k<n;k++)cx.fillRect(L+k*sw,gy-h*(k+1)/n,sw,2*S);
    cx.fillRect(L+n*sw,T,w-n*sw,2.5*S);
    /* handrail */
    cx.strokeStyle='rgba(200,205,215,.75)';cx.lineWidth=2*S;
    cx.beginPath();cx.moveTo(L,gy-26*S);cx.lineTo(L+n*sw,T-26*S);cx.lineTo(L+w,T-26*S);cx.stroke();
    return true;
  }
  if(t==='kicker'){
    cx.fillStyle='#6e5034';cx.beginPath();cx.moveTo(L,gy);cx.lineTo(L+w,T);cx.lineTo(L+w,gy);cx.closePath();cx.fill();
    cx.strokeStyle='#c9cfd8';cx.lineWidth=2*S;cx.beginPath();cx.moveTo(L,gy);cx.lineTo(L+w,T);cx.stroke();
    cx.fillStyle='rgba(255,255,255,.12)';cx.fillRect(L+w-3*S,T,3*S,h);
    return true;
  }
  if(t==='gap'){
    cx.fillStyle='#07070c';cx.fillRect(L,gy-1,w,R.H-gy+2);
    const g=cx.createLinearGradient(0,gy,0,gy+40*S);g.addColorStop(0,'rgba(60,60,80,.5)');g.addColorStop(1,'rgba(0,0,0,0)');
    cx.fillStyle=g;cx.fillRect(L,gy,6*S,40*S);cx.fillRect(L+w-6*S,gy,6*S,40*S);
    cx.fillStyle='rgba(255,210,60,.8)';
    for(let k=0;k<2;k++){const ex=k?L+w:L;cx.fillRect(ex-3*S,gy-2*S,6*S,3*S)}
    return true;
  }
  if(t==='fissure'){
    /* earthquake crack: opens over ~0.8 s (o.open 0→1), jagged lips, dust */
    const op=Math.min(1,o.open==null?1:o.open),ww=w*op;
    cx.fillStyle='#050508';cx.beginPath();cx.moveTo(x-ww/2,gy-1);
    for(let k=0;k<=6;k++){const xx=x-ww/2+ww*k/6;cx.lineTo(xx+(k%2?3:-3)*S*op,gy+(k%2?4:10)*S)}
    cx.lineTo(x+ww/2,gy-1);cx.lineTo(x+ww*0.3,R.H);cx.lineTo(x-ww*0.3,R.H);cx.closePath();cx.fill();
    cx.strokeStyle='rgba(30,26,22,.9)';cx.lineWidth=1.4*S;cx.beginPath();
    cx.moveTo(x-ww/2-24*S,gy+2*S);cx.lineTo(x-ww/2,gy);cx.moveTo(x+ww/2,gy);cx.lineTo(x+ww/2+30*S,gy+3*S);cx.stroke();
    return true;
  }
  if(t==='fire'){
    /* burning brush: embers base + flickering tongues */
    cx.fillStyle='#2a1208';cx.fillRect(L,gy-5*S,w,5*S);
    cx.save();cx.globalCompositeOperation='lighter';
    for(let k=0;k<6;k++){
      const fx=L+w*(k+.5)/6,fh=h*(0.6+0.4*Math.sin(R.t*13+k*1.7+o.seed*9));
      cx.fillStyle=k%2?'rgba(255,120,30,.75)':'rgba(255,190,60,.7)';
      cx.beginPath();cx.moveTo(fx-w/10,gy-3*S);cx.quadraticCurveTo(fx-w/14,gy-fh*0.6,fx,gy-fh);cx.quadraticCurveTo(fx+w/14,gy-fh*0.6,fx+w/10,gy-3*S);cx.closePath();cx.fill();
    }
    cx.restore();
    if(Math.random()<.5)R.fx.add(L+Math.random()*w,gy-h*0.8,(Math.random()-.5)*40,-60-Math.random()*90,.8,'rgba(255,170,70,.9)',(1+Math.random()*1.5)*S);
    return true;
  }
  if(t==='debris'){
    cx.fillStyle='#4e4a50';cx.beginPath();cx.moveTo(L,gy);cx.lineTo(L+w*.2,T+h*.2);cx.lineTo(L+w*.6,T);cx.lineTo(L+w,T+h*.4);cx.lineTo(L+w,gy);cx.closePath();cx.fill();
    cx.fillStyle='rgba(255,255,255,.12)';cx.fillRect(L+w*.25,T+h*.15,w*.3,2*S);
    return true;
  }
  if(t==='pothole'){
    cx.fillStyle='rgba(8,8,12,.92)';cx.beginPath();cx.ellipse(x,gy+3*S,w/2,5*S,0,0,R.TAU);cx.fill();
    cx.strokeStyle='rgba(150,150,160,.35)';cx.lineWidth=1.2;cx.beginPath();cx.ellipse(x,gy+3*S,w/2+2*S,6*S,0,Math.PI,R.TAU);cx.stroke();
    return true;
  }
  if(t==='puddle'){
    cx.fillStyle='rgba(120,170,220,.32)';cx.beginPath();cx.ellipse(x,gy+3*S,w/2,5*S,0,0,R.TAU);cx.fill();
    cx.fillStyle='rgba(255,255,255,.25)';cx.beginPath();cx.ellipse(x-w*.15,gy+2*S,w*.18,1.4*S,0,0,R.TAU);cx.fill();
    return true;
  }
  if(t==='bin'){   /* London litter bin: black, gold band */
    cx.fillStyle='#16161c';cx.beginPath();cx.roundRect(L,T+4*S,w,h-4*S,3*S);cx.fill();
    cx.fillStyle='#202028';cx.fillRect(L-2*S,T,w+4*S,6*S);
    cx.fillStyle='#c9a24a';cx.fillRect(L,T+h*0.35,w,3*S);
    return true;
  }
  if(t==='chair'){ /* Paris bistro chair: rattan seat, bent legs, back */
    cx.strokeStyle='#2a2420';cx.lineWidth=2.2*S;
    cx.beginPath();cx.moveTo(L+3*S,gy);cx.lineTo(L+6*S,T);cx.moveTo(L+w-3*S,gy);cx.lineTo(L+w-6*S,T);
    cx.moveTo(L+w-6*S,T);cx.lineTo(L+w-4*S,T-26*S);cx.stroke();
    cx.fillStyle='#b5874a';cx.fillRect(L,T-2*S,w,5*S);
    cx.fillStyle='#d9b07a';cx.fillRect(L+w-12*S,T-26*S,10*S,14*S);
    return true;
  }
  if(t==='hydrant'){
    cx.fillStyle='#c8322a';cx.beginPath();cx.roundRect(L+w*0.18,T+6*S,w*0.64,h-6*S,3*S);cx.fill();
    cx.beginPath();cx.arc(x,T+7*S,w*0.32,Math.PI,0);cx.fill();
    cx.fillRect(L,T+h*0.4,w,6*S);
    cx.fillStyle='rgba(255,255,255,.2)';cx.fillRect(L+w*0.28,T+8*S,2.5*S,h-12*S);
    return true;
  }
  if(t==='deskrock'){
    cx.fillStyle='#a26a42';
    cx.beginPath();cx.moveTo(L,gy);cx.lineTo(L+w*0.12,T+h*0.35);cx.lineTo(L+w*0.45,T);cx.lineTo(L+w*0.8,T+h*0.18);cx.lineTo(L+w,gy);cx.closePath();cx.fill();
    cx.fillStyle='rgba(255,220,170,.22)';cx.beginPath();cx.moveTo(L+w*0.12,T+h*0.35);cx.lineTo(L+w*0.45,T);cx.lineTo(L+w*0.5,T+h*0.5);cx.closePath();cx.fill();
    return true;
  }
  if(t==='barrier'){ /* Tokyo road-works barrier */
    cx.fillStyle='#e8e2d4';cx.fillRect(L,T,w,h*0.4);
    cx.fillStyle='#e0a020';for(let k=0;k<5;k++)cx.fillRect(L+k*w/5,T,w/10,h*0.4);
    cx.fillStyle='#444';cx.fillRect(L+4*S,T,3*S,h);cx.fillRect(L+w-7*S,T,3*S,h);
    return true;
  }
  if(t==='cart'){
    cx.fillStyle='#5a6070';cx.fillRect(L,T,w,h*0.7);
    cx.fillStyle='#262a32';cx.beginPath();cx.arc(L+8*S,gy-5*S,5*S,0,R.TAU);cx.arc(L+w-8*S,gy-5*S,5*S,0,R.TAU);cx.fill();
    cx.fillStyle='rgba(255,255,255,.15)';cx.fillRect(L,T,w,2*S);
    return true;
  }
  return false;
}
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
    if(x+w/2<-20||x-w/2>R.W+20){continue}
    /* ground shadow (sun-side offset) */
    if(o.kind!=='flat'&&o.type!=='gap'){
      cx.fillStyle='rgba(0,0,0,0.32)';
      cx.beginPath();cx.ellipse(x+h*0.18,gy+2,w*0.6+h*0.12,3*R.S,0,0,R.TAU);cx.fill();
    }
    const L=x-w/2,T=gy-h;
    if(drawSkateOb(cx,o,x,w,h,L,T,gy)){}
    else if(o.type==='tire'){
      /* rolling tyre: rubber ring, tread blocks, spinning hub */
      const r=h/2;
      cx.save();cx.translate(x,gy-r);cx.rotate(o.a);
      cx.fillStyle='#1b1d22';cx.beginPath();cx.arc(0,0,r,0,R.TAU);cx.fill();
      cx.fillStyle='#2c2f37';
      for(let i=0;i<10;i++){cx.rotate(R.TAU/10);cx.fillRect(-2*R.S,-r,4*R.S,4*R.S)}
      cx.fillStyle='#8a929e';cx.beginPath();cx.arc(0,0,r*0.45,0,R.TAU);cx.fill();
      cx.fillStyle='#4a515c';cx.fillRect(-r*0.42,-1.5*R.S,r*0.84,3*R.S);cx.fillRect(-1.5*R.S,-r*0.42,3*R.S,r*0.84);
      cx.strokeStyle='rgba(255,255,255,.18)';cx.lineWidth=1.2;cx.beginPath();cx.arc(0,0,r*0.8,-2.2,-1.2);cx.stroke();
      cx.restore();
      /* QA fix: the right-hand touch buttons cover the spawn lane — warn while the tyre is behind them */
      const cl=G.ctlLeft();
      if(x-r<R.W&&x+r>cl-6){
        const bx=cl-30*R.S,by=gy-r,p=.65+.35*Math.sin(R.t*14);
        cx.save();cx.globalAlpha=p;cx.fillStyle='rgba(255,90,60,.92)';
        cx.beginPath();cx.moveTo(bx-16*R.S,by);cx.lineTo(bx+4*R.S,by-13*R.S);cx.lineTo(bx+4*R.S,by+13*R.S);cx.closePath();cx.fill();
        cx.fillStyle='#fff';cx.font='bold '+(13*R.S|0)+'px sans-serif';cx.textAlign='center';cx.textBaseline='middle';cx.fillText('!',bx-2*R.S,by+1);
        cx.restore();
      }
    }else if(o.type==='cone'){
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
  /* fair telegraphing: a chevron at the right edge before anything enters the screen
     (green = skateable, red = hazard, blue = surface), with the height in cm */
  if(!G.noMarkers)for(const o of G.obs){
    const ent=o.x-o.w/2;
    if(ent<R.W-4||ent>R.W+70*R.S+o.w)continue;
    const col=o.kind==='skate'?'110,240,160':o.kind==='haz'?'255,96,70':'130,200,255';
    const bx=R.W-26*R.S,by=gy-Math.max(18*R.S,o.h*0.6),p=.7+.3*Math.sin(R.t*12);
    cx.save();cx.globalAlpha=p;cx.fillStyle='rgba('+col+',.92)';
    cx.beginPath();cx.moveTo(bx-14*R.S,by);cx.lineTo(bx+4*R.S,by-12*R.S);cx.lineTo(bx+4*R.S,by+12*R.S);cx.closePath();cx.fill();
    cx.font='bold '+(10*R.S|0)+'px sans-serif';cx.textAlign='right';cx.textBaseline='middle';
    const lab=(OB_LABEL[o.type]||o.type)+(o.h>0?' '+Math.round(o.h/CMP())+'cm':'');
    cx.fillStyle='rgba(0,0,0,.55)';cx.fillText(lab,bx-17*R.S+1,by+1);
    cx.fillStyle='rgba('+col+',1)';cx.fillText(lab,bx-17*R.S,by);
    cx.restore();
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
  /* r6 cobblestone (Paris, Rome): granite setts laid in perspective rows, each stone a rounded,
     individually tinted block with a lit crown and a shadowed lower lip, dark sand joints between */
  if(gr==='cobble'){
    const c=document.createElement('canvas');c.width=Math.max(2,W|0);c.height=Math.max(2,(H-gy0())|0||2);
    const g=c.getContext('2d');
    g.fillStyle='#0b0a0d';g.fillRect(0,0,c.width,c.height);
    let y=0,row=0;
    while(y<c.height){
      const u=y/c.height,rowH=R.lerp(3.2,30,Math.pow(u,1.6));
      const sw=rowH*R.rnd(1.25,1.45);
      let x=-(row%2)*sw*0.5-Math.random()*sw*0.3;
      while(x<c.width){
        const w=sw*R.rnd(0.82,1.18),gap=Math.max(0.6,rowH*0.09);
        const base=R.rnd(46,78),warm=R.rnd(-6,10),blu=R.rnd(-4,8);
        const r0=base+warm|0,g0=base+warm*0.4|0,b0=base+blu|0;
        const rx=x+gap,ry=y+gap,rw=w-gap*2,rh=rowH-gap*2;
        if(rw>0.8&&rh>0.8){
          const rr=Math.min(rw,rh)*0.32;
          const gr2=g.createLinearGradient(0,ry,0,ry+rh);
          gr2.addColorStop(0,`rgb(${r0+26},${g0+24},${b0+26})`);gr2.addColorStop(.45,`rgb(${r0},${g0},${b0})`);gr2.addColorStop(1,`rgb(${r0*.55|0},${g0*.55|0},${b0*.6|0})`);
          g.fillStyle=gr2;g.beginPath();g.roundRect(rx+R.rnd(-.4,.4)*gap,ry,rw,rh,rr);g.fill();
          if(rh>4){g.fillStyle='rgba(255,250,240,.10)';g.beginPath();g.ellipse(rx+rw*.45,ry+rh*.3,rw*.3,rh*.16,0,0,R.TAU);g.fill()}
          if(Math.random()<.18){g.fillStyle='rgba(0,0,0,.18)';g.fillRect(rx+rw*Math.random()*.6,ry+rh*.3,rw*.3,rh*.4)}
        }
        x+=w;
      }
      y+=rowH;row++;
    }
    /* grime and moss in the joints, worn path down the middle */
    for(let i=0;i<1800;i++){g.fillStyle=`rgba(${Math.random()<.2?'40,60,30':'0,0,0'},${Math.random()*.25})`;g.fillRect(Math.random()*c.width,Math.random()*c.height,1.2,1.2)}
    const wp=g.createLinearGradient(0,0,c.width,0);
    wp.addColorStop(0,'rgba(0,0,0,.18)');wp.addColorStop(.5,'rgba(255,240,220,.04)');wp.addColorStop(1,'rgba(0,0,0,.18)');
    g.fillStyle=wp;g.fillRect(0,0,c.width,c.height);
    G.tex.cobble=c;
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
  R.fx.compact(G.ticks,t=>t.a>0);
  if(gr==='asphalt'){
    const raining=R.wx.rain>0.3;
    for(const p of G.puddles){
      p.cd=Math.max(0,p.cd-dt);
      for(const r of p.rip){r.r+=dt*60*R.S;r.a-=dt*1.6}
      R.fx.compact(p.rip,r=>r.a>0);
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
    R.fx.compact(G.tracks,t=>t.age<2.4);
    if(G.tracks.length>70)G.tracks.shift();
  }
  if(gr==='forest'){
    G.leaves-=dt;
    if(G.leaves<=0){
      G.leaves=1.4+Math.random()*2;
      R.fx.add(Math.random()*R.W,-10,(Math.random()-0.5)*30,40+Math.random()*30,3,'rgba(180,110,50,0.75)',2.2*R.S);
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

const BASES={
    water:['#0a2036','#071626','#040c18'],
    asphalt:['#16161f','#0c0c15','#05050c'],
    flagstone:['#1c1a26','#100e18','#07060c'],
    cobble:['#24222a','#141218','#08070a'],
    forest:['#171208','#0e0b05','#060503'],
    sand:['#4a3018','#2c1c0c','#140c06'],
    snow:['#7e8cb4','#46507a','#1c2240']};
/* gradient cache keyed by name + geometry (gradients are recreated only on resize) */
G._gc=new Map();
G.cgrad=function(k,a,b,mk){const key=k+'|'+a+'|'+b;let g=G._gc.get(key);if(!g){g=mk();G._gc.set(key,g);if(G._gc.size>64)G._gc.delete(G._gc.keys().next().value)}return g};
G._pat={};
G.pat=function(k){const t=G.tex[k];if(!t)return null;let p=G._pat[k];if(!p||p.src!==t){p={src:t,p:R.cx.createPattern(t,'repeat')};G._pat[k]=p}return p.p};
G.draw=function(){
  const cx=R.cx,L=R.LOC[R.locI],gr=L.ground,gy=R.gy,W=R.W,H=R.H;
  /* reflection parameters per ground */
  const wet=R.wx.wet,rain=R.wx.rain;
  /* perf (r5): no per-frame object literals or gradients — values written into one object, gradients cached */
  const refl=G.refl;
  if(gr==='water'){refl.a=Math.min(.7,.4+.3*wet+rain*.08);refl.wob=2.2+rain*2.4;refl.rows=16}
  else if(gr==='asphalt'){refl.a=.14+.3*wet;refl.wob=1.1;refl.rows=12}
  else if(gr==='flagstone'){refl.a=.08+.18*wet;refl.wob=.7;refl.rows=12}
  else if(gr==='cobble'){refl.a=.06+.2*wet;refl.wob=.9;refl.rows=12}
  else if(gr==='forest'){refl.a=.07+.06*wet;refl.wob=.45;refl.rows=8}
  else if(gr==='sand'){refl.a=.05;refl.wob=.35;refl.rows=6}
  else if(gr==='snow'){refl.a=.1+.08*wet;refl.wob=.5;refl.rows=8}
  else{refl.a=.2;refl.wob=1;refl.rows=12}

  /* base gradient */
  const bases=BASES[gr];
  const BASES_UNUSED={
    water:['#0a2036','#071626','#040c18'],
    asphalt:['#16161f','#0c0c15','#05050c'],
    flagstone:['#1c1a26','#100e18','#07060c'],
    cobble:['#24222a','#141218','#08070a'],
    forest:['#171208','#0e0b05','#060503'],
    sand:['#4a3018','#2c1c0c','#140c06'],
    snow:['#7e8cb4','#46507a','#1c2240']
  };
  const bg=G.cgrad('base'+gr,gy,H,()=>{const g=cx.createLinearGradient(0,gy,0,H);
    g.addColorStop(0,bases[0]);g.addColorStop(.4,bases[1]);g.addColorStop(1,bases[2]);return g});
  cx.fillStyle=bg;cx.fillRect(-80,gy,W+160,H-gy+80);

  const hz=((gy-H/2+R.cam.sy)*R.cam.zm+H/2)*R.d,gh=(H-gy)*R.cam.zm*R.d;

  /* screen-space reflection strips (samples what has already been drawn) */
  if(refl.a>0.04){
    const N=refl.rows,sh=gh/N;
    /* perf: snapshot the sampled band ONCE into an offscreen canvas, then cut strips from it.
       Drawing the live canvas into itself forced a full-canvas copy per strip (12×/frame). */
    const top=Math.max(0,Math.floor(hz-N*sh)),bh=Math.max(1,Math.ceil(hz-top));
    /* r6: the snapshot is taken at reduced resolution (½ on medium/low) and refreshed every 2nd frame
       on low quality — reflections are blurred by ripples anyway */
    const rs=R.qLv>=2?1:0.5,rw=Math.max(2,R.cv.width*rs|0),rh=Math.max(1,Math.ceil(bh*rs));
    const rc=G.reflC||(G.reflC=document.createElement('canvas')),rx=G.reflX||(G.reflX=rc.getContext('2d'));
    let fresh=false;
    if(rc.width!==rw||rc.height<rh||G.reflTop!==top){rc.width=rw;rc.height=rh;G.reflTop=top;fresh=true}
    if(fresh||R.qLv>=1||(R.frameN&1)===0){
      rx.clearRect(0,0,rc.width,rh);
      rx.drawImage(R.cv,0,top,R.cv.width,bh,0,0,rw,rh);
    }
    cx.save();cx.setTransform(1,0,0,1,0,0);cx.globalAlpha=refl.a;
    for(let j=0;j<N;j++){
      const sy=hz-(j+1)*sh;if(sy<0)break;
      const rip=Math.sin(R.t*2.2+j*.9)*(1+j*.3)*refl.wob*(0.3+rain+.2*wet)*R.d;
      cx.drawImage(rc,0,(sy-top)*rs,rw,sh*rs,rip,hz+j*sh,R.cv.width,sh+1);
    }
    cx.restore();
  }

  /* per-ground detail */
  if(gr==='water')G.drawWater(cx);
  else if(gr==='asphalt')G.drawAsphalt(cx);
  else if(gr==='flagstone')G.drawFlag(cx);
  else if(gr==='cobble')G.drawCobble(cx);
  else if(gr==='forest')G.drawForest(cx);
  else if(gr==='sand')G.drawSand(cx);
  else if(gr==='snow')G.drawSnow(cx);

  /* darkening toward the viewer */
  cx.fillStyle=G.cgrad('dark',gy,H,()=>{const g=cx.createLinearGradient(0,gy,0,H);
    g.addColorStop(0,'rgba(4,4,15,0)');g.addColorStop(1,'rgba(4,4,15,.92)');return g});cx.fillRect(-80,gy,W+160,H-gy+80);

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
    const p=G.pat('asphalt');
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

G.drawCobble=function(cx){
  const gy=R.gy,H=R.H,W=R.W;
  if(G.tex.cobble)cx.drawImage(G.tex.cobble,(R.px-W/2)*0.05,gy,W,H-gy);
  /* rain beads on the stone crowns */
  if(R.wx.wet>0.25){
    cx.save();cx.globalCompositeOperation='lighter';
    for(let i=0;i<5;i++){
      const u=(i/5+R.zs*0.012)%1,y=gy+(H-gy)*Math.pow(u,1.6);
      cx.fillStyle=`rgba(200,220,255,${0.045*R.wx.wet*(0.3+u)})`;
      cx.fillRect(-80,y,W+160,1+u*2);
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
/* left edge (css px == canvas px in R units) of the #ctl column, refreshed ~2x/s */
G._cl=0;G._clT=-1;
G.ctlLeft=function(){
  if(R.t-G._clT>0.5||G._clT<0){G._clT=R.t;const e=document.getElementById('ctl');
    const b=e&&e.getBoundingClientRect();G._cl=(b&&b.width&&getComputedStyle(e).opacity!=='0')?b.left:R.W+999}
  return G._cl;
};
})();
