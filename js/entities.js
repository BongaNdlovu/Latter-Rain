/* Rain of the Word — cards: depth-z with blurred far band, atmospheric perspective,
   word + power-up sprites, catching */
window.ROW=window.ROW||{};
(function(){
'use strict';
const R=ROW;
const C=R.ent={spr:{},sprQ:[]};
/* r6: eased ramp (fast early, flattening past level 5) instead of a straight line that kept steepening to 25 */
C.fallSpeed=()=>R.H*(0.32+0.50*(1-Math.exp(-(R.lvl-1)/11)))*R.fMul;

C.spawnCard=function(){
  /* a guaranteed shield opens every tsunami summit */
  if(R.forceShield){
    R.forceShield=false;
    const w=Math.round(R.F()*2.3),h=Math.round(R.F()*1.85);
    const margin=w*0.5+14;
    R.cards.push({x:margin+Math.random()*Math.max(1,R.W-margin*2),y:-h-10,w,h,pow:'shield',
      vy:0.8,r:0,spin:0.8,sway:1,swayPh:Math.random()*6.28,swayAmp:10+Math.random()*18,
      age:0,trail:[],dead:false,fling:0});
    return;
  }
  if(R.lvl>=2&&Math.random()<0.085){
    const pool=R.lvl>=4?['shield','slow','wide','wide','heart','seek','transform']:['shield','slow','wide','wide','heart','seek'];
    const pow=pool[Math.random()*pool.length|0];
    const w=Math.round(R.F()*2.3),h=Math.round(R.F()*1.85);
    const margin=w*0.5+14;
    R.cards.push({x:margin+Math.random()*Math.max(1,R.W-margin*2),y:-h-10,w,h,pow,
      vy:0.8+Math.random()*0.2,r:0,spin:(Math.random()<0.5?-1:1)*(0.7+Math.random()*1.0),
      sway:0.6+Math.random()*1.4,swayPh:Math.random()*6.28,swayAmp:10+Math.random()*22,
      age:0,trail:[],dead:false,fling:0});
    if(!R.tryGet('rotw-h2')){R.main.showHint('Special cards grant boons — catch them!',5500);R.trySet('rotw-h2','1')}
    return;
  }
  const need=R.verse.parts.filter(p=>p.b&&!p.f).map(p=>p.w);
  const verseWords=new Set((R.verse.txt||'').toLowerCase().match(/[a-z']+/g)||[]);
  const decoys=R.DECOY.filter(w=>!verseWords.has(w.toLowerCase()));
  const hasCorrect=R.cards.some(c=>!c.dead&&need.indexOf(c.word)>=0);
  let word;
  const correctChance=Math.max(0.30,0.50-R.lvl*0.012+R.ccAdj);
  if(need.length&&(!hasCorrect||Math.random()<correctChance)){
    word=need[Math.random()*need.length|0];
  }else{
    const pool=decoys.length?decoys:R.DECOY;
    word=pool[Math.random()*pool.length|0];
  }
  R.cx.font=`bold ${R.F()}px Georgia`;
  const tw=R.cx.measureText(word).width;
  const w=Math.round(tw+R.F()*1.5),h=Math.round(R.F()*1.95);
  const margin=w*0.5+14;
  /* r6 fair spacing: a wrong word never spawns right beside a card still in the upper sky, so
     the right word is never shadowed by a decoy you cannot steer around */
  const bad=need.indexOf(word)<0;
  let x=margin+Math.random()*Math.max(1,(R.W-margin*2));
  if(bad){for(let k=0;k<8;k++){let ok=true;for(const o of R.cards){if(o.dead||o.y>R.gy*0.55)continue;if(Math.abs(o.x-x)<(o.w+w)*0.5+90*R.S){ok=false;break}}
    if(ok)break;x=margin+Math.random()*Math.max(1,(R.W-margin*2))}}
  R.cards.push({x,y:-h-10,w,h,word,bad,vy:0.86+Math.random()*0.28,
    r:0,spin:(Math.random()<0.5?-1:1)*(0.7+Math.random()*1.1),
    sway:0.6+Math.random()*1.6,swayPh:Math.random()*6.28,swayAmp:10+Math.random()*26,
    age:0,trail:[],dead:false,fling:0});
};

const needSet=new Set();
C.update=function(dt){
  const fs=C.fallSpeed();
  needSet.clear();if(R.verse)for(const p of R.verse.parts)if(p.b&&!p.f)needSet.add(p.w);
  for(const c of R.cards){
    c.bad=!c.pow&&!needSet.has(c.word);
    c.age+=dt*R.ts;
    c.y+=c.vy*fs*dt*R.ts*R.slowF;
    if(c.fling){
      c.x+=c.fling*2400*dt;c.y-=180*dt;c.r+=dt*14*c.fling;
      if(c.x<-120||c.x>R.W+120)c.dead=true;
      continue;
    }
    const e=C.depth(c);
    c.x+=Math.sin(c.age*c.sway+c.swayPh)*c.swayAmp*e*dt;
    c.x=R.clamp(c.x,c.w*0.5+6,R.W-c.w*0.5-6);
    c.r=Math.sin(c.age*c.spin*1.6)*0.05;
    if(R.seekT>0&&!c.pow&&R.verse&&R.verse.parts.some(p=>p.b&&!p.f&&p.w===c.word)&&c.y>R.gy-420*R.S&&c.y<R.gy-20*R.S){
      c.x+=(R.px-c.x)*Math.min(1,dt*3.0*(.7+e*.6));
    }
    if(e>0.55){
      c.trail.push([c.x,c.y]);
      if(c.trail.length>11)c.trail.shift();
    }else if(c.trail.length)c.trail.shift();
    if(c.dead)continue;
    if(R.st==='play'){
      const cy=R.gy-R.board.jy;
      const top=cy-120*R.S,bot=cy-30*R.S;
      const reach=(c.w*0.35+70*R.S)*(R.wideT>0?1.55:1)*R.board.def().reach;
      if(c.y>top&&c.y<bot&&Math.abs(c.x-R.px)<reach){
        R.main.catchCard(c);
        continue;
      }
    }
    if(c.y>R.gy-6){
      c.dead=true;
      R.fx.splashes.push({x:c.x,y:R.gy,r:4,a:0.8,mx:34*R.S});
      R.fx.burst(c.x,R.gy-4,'rgba(170,225,255,0.9)',14,220);
      if(!c.pow&&R.st==='play'){
        const needPart=R.verse.parts.find(p=>p.b&&!p.f&&p.w===c.word);
        if(needPart){
          needPart.m=1;R.main.renderVerse();
          const vp=needPart;
          setTimeout(()=>{if(R.verse&&R.verse.parts.indexOf(vp)>=0){vp.m=0;R.main.renderVerse()}},650);
          R.fx.flyTexts.push({w:'✗',x:c.x,y:R.gy-34*R.S,t:0,col:'255,110,110',small:1});
        }
      }
    }
  }
  /* dead cards are removed at once — their effects already fired.
     the old rule (keep dead until offscreen) let ground-missed cards
     pile up in the array forever */
  R.fx.compact(R.cards,c=>!c.dead);
};

/* ---------- bombs: rare falling hazards that cost every heart ---------- */
C.spawnBomb=function(){
  if(R.disasters&&!R.disasters.bombsAllowed())return;   /* hazard exclusion: no bombs during/near a disaster */
  let bx=R.rnd(80,R.W-80);
  if(Math.abs(bx-R.px)<140)bx=R.clamp(R.px+140*Math.sign(bx-R.px||1),60,R.W-60);
  R.bombs.push({x:bx,y:-40,w:26*R.S,h:30*R.S,rot:R.rnd(-0.4,0.4),rotV:R.rnd(-1.5,1.5),dead:false});
};
C.updateBombs=function(dt){
  for(const b of R.bombs){
    b.y+=C.fallSpeed()*0.8*dt*R.ts*R.slowF;
    b.rot+=b.rotV*dt;
    const cy=R.gy-R.board.jy;
    if(R.st==='play'&&Math.abs(b.y-cy)<34*R.S&&Math.abs(b.x-R.px)<b.w*0.5+26*R.S){
      b.dead=true;
      R.main.bombHit(b.x,true);
    }else if(b.y>=R.gy-8*R.S){
      b.dead=true;
      R.main.bombHit(b.x,false);
    }
  }
  R.fx.compact(R.bombs,b=>!b.dead);
};
C.drawBombs=function(){
  if(!R.bombs.length)return;
  const cx=R.cx;
  for(const b of R.bombs){
    const e=R.smooth(C.depth(b));
    const sc=0.55+0.45*e;
    const r=b.w*0.5*sc;
    const pulse=0.5+0.5*Math.sin(R.t*7+b.x*0.01);
    cx.save();cx.translate(b.x,b.y);cx.rotate(b.rot);
    cx.globalAlpha=0.45+0.55*e;
    /* danger glow */
    cx.save();cx.globalCompositeOperation='lighter';
    const gr=cx.createRadialGradient(0,0,0,0,0,r*2.6);
    gr.addColorStop(0,`rgba(255,70,40,${0.32+0.26*pulse})`);
    gr.addColorStop(1,'rgba(255,70,40,0)');
    cx.fillStyle=gr;cx.fillRect(-r*2.6,-r*2.6,r*5.2,r*5.2);
    cx.restore();
    /* body */
    let bg=cx.createRadialGradient(-r*0.35,-r*0.4,r*0.15,0,0,r);
    bg.addColorStop(0,'#4a4f5c');bg.addColorStop(.55,'#23262f');bg.addColorStop(1,'#0c0d12');
    cx.fillStyle=bg;cx.beginPath();cx.arc(0,0,r,0,R.TAU);cx.fill();
    cx.strokeStyle='rgba(255,120,80,.5)';cx.lineWidth=1.2;cx.stroke();
    cx.fillStyle='rgba(255,255,255,.25)';
    cx.beginPath();cx.arc(-r*0.35,-r*0.4,r*0.22,0,R.TAU);cx.fill();
    /* fuse + spark */
    cx.strokeStyle='#8a6a3a';cx.lineWidth=1.6;
    cx.beginPath();cx.moveTo(0,-r);cx.quadraticCurveTo(r*0.3,-r*1.5,r*0.1,-r*1.9);cx.stroke();
    const sp=1+0.6*Math.sin(R.t*21+b.x);
    cx.fillStyle='rgba(255,200,80,.95)';
    cx.beginPath();cx.arc(r*0.1,-r*1.9,2.2*R.S*sp,0,R.TAU);cx.fill();
    cx.restore();
  }
};

/* depth from fall position: 0 = far (hazy, blurred), 1 = at the play plane */
C.depth=c=>R.clamp(c.y/(R.gy*0.9),0,1);

function powSprite(c){
  const key='pow_'+c.pow;
  if(C.spr[key])return C.spr[key];
  const sd=Math.max(2,Math.ceil(R.d)),w=c.w,h=c.h,P=6,k=h/60;
  const cv2=document.createElement('canvas');
  cv2.width=Math.ceil((w+P*2)*sd);cv2.height=Math.ceil((h+P*2)*sd);
  const g=cv2.getContext('2d');g.scale(sd,sd);g.translate(P+w/2,P+h/2);
  const col=R.POWC[c.pow];
  let gr=g.createLinearGradient(0,-h/2,0,h/2);
  gr.addColorStop(0,'#141a33');gr.addColorStop(1,'#0a0e22');
  g.fillStyle=gr;g.beginPath();g.roundRect(-w/2,-h/2,w,h,14*k);g.fill();
  g.strokeStyle=`rgba(${col},1)`;g.lineWidth=3*k;g.shadowColor=`rgba(${col},1)`;g.shadowBlur=12;
  g.beginPath();g.roundRect(-w/2+1.5*k,-h/2+1.5*k,w-3*k,h-3*k,12*k);g.stroke();g.shadowBlur=0;
  g.strokeStyle='rgba(255,255,255,.25)';g.lineWidth=1;
  g.beginPath();g.roundRect(-w/2+6*k,-h/2+6*k,w-12*k,h-12*k,9*k);g.stroke();
  g.strokeStyle=`rgba(${col},1)`;g.fillStyle=`rgba(${col},1)`;g.lineWidth=2.6*k;g.lineCap='round';g.lineJoin='round';
  const u=h*0.16;
  if(c.pow==='shield'){
    g.beginPath();g.moveTo(0,-2.2*u);g.lineTo(1.6*u,-1.4*u);g.lineTo(1.6*u,.4*u);
    g.quadraticCurveTo(1.6*u,1.6*u,0,2.3*u);g.quadraticCurveTo(-1.6*u,1.6*u,-1.6*u,.4*u);
    g.lineTo(-1.6*u,-1.4*u);g.closePath();g.globalAlpha=.35;g.fill();g.globalAlpha=1;g.stroke();
  }else if(c.pow==='slow'){
    g.beginPath();g.arc(0,0,1.9*u,0,R.TAU);g.stroke();
    g.beginPath();g.moveTo(0,0);g.lineTo(0,-1.3*u);g.moveTo(0,0);g.lineTo(.95*u,.45*u);g.stroke();
  }else if(c.pow==='wide'){
    for(let i=1;i<=3;i++){g.globalAlpha=.3+.18*i;g.beginPath();g.arc(0,.9*u,i*1.05*u,Math.PI*1.15,Math.PI*1.85);g.stroke()}
    g.globalAlpha=1;g.beginPath();g.arc(0,.9*u,.4*u,0,R.TAU);g.fill();
  }else if(c.pow==='heart'){
    g.beginPath();g.moveTo(0,1.7*u);
    g.bezierCurveTo(-2.4*u,-.2*u,-1.2*u,-2.1*u,0,-.8*u);
    g.bezierCurveTo(1.2*u,-2.1*u,2.4*u,-.2*u,0,1.7*u);
    g.globalAlpha=.4;g.fill();g.globalAlpha=1;g.stroke();
  }else if(c.pow==='seek'){
    g.beginPath();g.arc(0,-.15*u,1.15*u,0,R.TAU);g.stroke();
    g.beginPath();g.moveTo(.8*u,.7*u);g.lineTo(1.7*u,1.7*u);g.stroke();
  }else if(c.pow==='transform'){
    g.lineWidth=3*k;
    g.beginPath();g.moveTo(-1.5*u,.6*u);g.lineTo(0,-.6*u);g.lineTo(1.5*u,.6*u);g.stroke();
    g.beginPath();g.moveTo(-1.5*u,1.9*u);g.lineTo(0,.7*u);g.lineTo(1.5*u,1.9*u);g.stroke();
    g.globalAlpha=.5;
    g.beginPath();g.moveTo(.35*u,-1.4*u);g.lineTo(-.35*u,-.2*u);g.lineTo(.1*u,-.2*u);g.lineTo(-.35*u,1*u);
    g.stroke();g.globalAlpha=1;
  }
  return C.spr[key]={cv:cv2,P};
}

function sprite(c){
  if(c.pow)return powSprite(c);
  if(C.spr[c.word])return C.spr[c.word];
  const sd=Math.max(2,Math.ceil(R.d)),w=c.w,h=c.h,P=6,k=h/60;
  const cv2=document.createElement('canvas');
  cv2.width=Math.ceil((w+P*2)*sd);cv2.height=Math.ceil((h+P*2)*sd);
  const g=cv2.getContext('2d');g.scale(sd,sd);g.translate(P+w/2,P+h/2);
  const rr=(x,y,ww,hh,r)=>{g.beginPath();g.roundRect(x,y,ww,hh,r)};
  g.save();rr(-w/2,-h/2,w,h,10*k);g.clip();
  let gr=g.createLinearGradient(0,-h/2,0,h/2);
  gr.addColorStop(0,'#f6ead0');gr.addColorStop(.38,'#ead4a8');gr.addColorStop(.72,'#d8b57a');gr.addColorStop(1,'#c49a58');
  g.fillStyle=gr;g.fillRect(-w/2,-h/2,w,h);
  for(let i=0;i<Math.round(w*h/18);i++){
    g.fillStyle=`rgba(${90+Math.random()*70|0},${50+Math.random()*40|0},${18+Math.random()*20|0},${0.04+Math.random()*0.08})`;
    g.fillRect(-w/2+Math.random()*w,-h/2+Math.random()*h,0.8+Math.random()*1.8,0.6+Math.random()*1.4);
  }
  g.strokeStyle='rgba(110,70,28,.12)';g.lineWidth=.55;
  for(let i=0;i<8;i++){
    const fx=-w/2+Math.random()*w,fy=-h/2+Math.random()*h;
    g.beginPath();g.moveTo(fx,fy);
    g.quadraticCurveTo(fx+(Math.random()-.5)*14,fy+(Math.random()-.5)*10,fx+(Math.random()-.5)*22,fy+(Math.random()-.5)*12);
    g.stroke();
  }
  const vg=g.createRadialGradient(0,0,h*.2,0,0,Math.max(w,h)*.72);
  vg.addColorStop(0,'rgba(90,50,16,0)');vg.addColorStop(1,'rgba(70,38,10,.38)');
  g.fillStyle=vg;g.fillRect(-w/2,-h/2,w,h);
  g.fillStyle='rgba(255,248,230,.22)';
  g.beginPath();g.roundRect(-w/2+3*k,-h/2+3*k,w-6*k,h*.28,[8*k,8*k,2,2]);g.fill();
  g.restore();
  gr=g.createLinearGradient(-w/2,-h/2,w/2,h/2);
  gr.addColorStop(0,'#f3d48a');gr.addColorStop(.45,'#b8862c');gr.addColorStop(1,'#f0c56a');
  g.strokeStyle=gr;g.lineWidth=3.2*k;rr(-w/2+1.6*k,-h/2+1.6*k,w-3.2*k,h-3.2*k,9*k);g.stroke();
  g.strokeStyle='rgba(70,42,12,.45)';g.lineWidth=.7*k;rr(-w/2+4.2*k,-h/2+4.2*k,w-8.4*k,h-8.4*k,7*k);g.stroke();
  g.strokeStyle='rgba(255,255,255,.28)';g.lineWidth=.8;
  rr(-w/2+6.5*k,-h/2+6.5*k,w-13*k,h-13*k,6*k);g.stroke();
  g.font=`bold ${R.F()}px Georgia`;g.textAlign='center';g.textBaseline='middle';
  g.fillStyle='rgba(80,46,12,.28)';g.fillText(c.word,0.6,R.F()*.05+1.4);
  g.fillStyle='#2a1608';g.fillText(c.word,0,R.F()*.05);
  /* r6: bounded sprite cache — oldest word sprites are evicted beyond 120 (verses rotate through ~1000 words) */
  C.sprQ.push(c.word);
  while(C.sprQ.length>120){const old=C.sprQ.shift();const sp=C.spr[old];if(sp){sp.cv.width=sp.cv.height=0;delete C.spr[old]}}
  return C.spr[c.word]={cv:cv2,P};
}
/* sprites are baked at the current font scale — drop them when the viewport changes */
R.onResize.push(()=>{C.spr={};C.sprQ.length=0});

C.drawGlows=function(){
  const cx=R.cx;
  for(const c of R.cards){
    if(c.dead)continue;
    const e=C.depth(c);
    const w=c.w,col=c.pow?R.POWC[c.pow]:'255,200,110';
    cx.save();cx.translate(c.x,c.y);cx.globalCompositeOperation='lighter';
    cx.globalAlpha=0.4+0.6*e;
    const sl=cx.createLinearGradient(0,-c.h*2.4,0,0);
    sl.addColorStop(0,`rgba(${col},0)`);sl.addColorStop(1,`rgba(${col},.28)`);
    cx.fillStyle=sl;cx.fillRect(-w*.3,-c.h*2.4,w*.6,c.h*2.4);
    const rg=cx.createRadialGradient(0,0,0,0,0,w*.8);
    rg.addColorStop(0,`rgba(${col},.36)`);rg.addColorStop(1,`rgba(${col},0)`);
    cx.fillStyle=rg;cx.fillRect(-w,-w,w*2,w*2);
    cx.restore();
  }
};

C.drawFaces=function(){for(const c of R.cards)C.drawFace(c,false)};

C.drawFace=function(c,refl){
  const s=sprite(c);
  const e=R.smooth(C.depth(c));
  const sc=0.55+0.45*e;
  const w=c.w*sc,h=c.h*sc;
  const cx=R.cx;
  cx.save();cx.translate(c.x,c.y);cx.rotate(c.r);
  if(!refl){
    if(e<0.97&&R.filterOK&&R.qLv>=2)cx.filter=`blur(${((1-e)*2.6).toFixed(2)}px)`;
    /* atmospheric perspective: distant cards sink into the haze */
    cx.globalAlpha=0.45+0.55*e;
    if(R.qLv>=1){cx.shadowColor=c.bad&&e>.45?'rgba(255,70,60,.8)':'rgba(255,200,100,.75)';cx.shadowBlur=(R.qLv>=2?20:10)*R.S*e}
  }
  cx.drawImage(s.cv,-w/2-s.P*sc,-h/2-s.P*sc,w+s.P*2*sc,h+s.P*2*sc);
  cx.filter='none';cx.shadowBlur=0;cx.globalAlpha=1;
  if(!refl){
    cx.beginPath();cx.roundRect(-w/2,-h/2,w,h,14*h/60);cx.clip();
    const xs=(((c.age*.6+c.swayPh)%2)-.5)*w*1.6-w*.2;
    const sg=cx.createLinearGradient(xs-34,-h/2,xs+34,h/2);
    sg.addColorStop(0,'rgba(255,255,255,0)');sg.addColorStop(.5,'rgba(255,255,255,.32)');sg.addColorStop(1,'rgba(255,255,255,0)');
    cx.fillStyle=sg;cx.fillRect(-w/2,-h/2,w,h);
    /* r6 telegraph: once a wrong word reaches the lower sky it gains a red wash and a dashed red rim
       (a fixed cue, never colour-only: the dashes read without colour vision too) */
    if(c.bad&&e>.45){
      const k=Math.min(1,(e-.45)/.3);
      cx.fillStyle=`rgba(200,30,30,${.20*k})`;cx.fillRect(-w/2,-h/2,w,h);
      cx.setLineDash([7*R.S,5*R.S]);cx.lineWidth=3.2*R.S;cx.strokeStyle=`rgba(255,80,70,${.95*k})`;
      cx.beginPath();cx.roundRect(-w/2+1.6*R.S,-h/2+1.6*R.S,w-3.2*R.S,h-3.2*R.S,14*h/60);cx.stroke();cx.setLineDash([]);
    }
  }
  cx.restore();
};
})();
