/* Rain of the Word — board: selectable boards (palettes + stats), jumping,
   Transformer reward mode, trucks/wheels, shield dome, wheel spray */
window.ROW=window.ROW||{};
(function(){
'use strict';
const R=ROW;
const B=R.board={squash:0,jy:0,jv:0,grounded:true};

/* the active board definition — Transformer card temporarily overrides the choice */
B.def=function(){
  if(R.transformT>0||R.boardI===R.BOARDS.length)return R.TRANSFORM;
  return R.BOARDS[R.boardI]||R.BOARDS[0];
};
B.speedMult=()=>B.def().speed;

/* ---------- jumping ---------- */
B.jump=function(){
  if(R.paused)return;
  if(B.jy>0||B.jv>0)return;
  if(!(R.st==='play'||R.st==='wait'||R.st==='trans'))return;
  B.jv=640*B.def().jump;
  B.grounded=false;
  if(R.tricks)R.tricks.onJump();
  R.audio.noise(700,'bandpass',0.12,0.12);
  R.audio.tone(240,'sine',0.1,0.05);
  R.vibrate(12);
  /* little dust kick-off */
  R.fx.burst(R.px,R.gy,'rgba(200,220,240,0.7)',8,140);
};

B.update=function(dt){
  B.squash=Math.max(0,B.squash-dt*3.2);
  /* jump physics */
  if(B.jy>0||B.jv!==0){
    B.jv-=1600*R.S*dt;
    B.jy+=B.jv*dt;
    if(B.jy<=0){
      B.jy=0;
      if(B.jv<-140){
        /* landing: squash, dust/spray, thud (any trick verdict is made in R.tricks.onLand) */
        B.squash=1;
        R.cam.punchFn(0.25);
        const dust=R.LOC[R.locI].ground==='sand'?'rgba(210,170,110,0.8)'
          :R.LOC[R.locI].ground==='snow'?'rgba(240,248,255,0.85)'
          :'rgba(200,235,255,0.8)';
        R.fx.burst(R.px,R.gy,dust,10,180);
        R.audio.noise(260,'lowpass',0.22,0.12);
        R.audio.tone(90,'sine',0.08,0.1);
        R.vibrate(10);
      }
      if(R.tricks)R.tricks.onLand(B.jv);
      B.jv=0;B.grounded=true;
    }
  }
  /* Transformer embers */
  if(R.transformT>0&&(R.st==='play'||R.st==='wait'||R.st==='trans')){
    for(let i=0;i<2;i++){
      R.fx.add(R.px-38*R.S+(Math.random()-0.5)*10*R.S,R.gy-B.jy-8*R.S+(Math.random()-0.5)*8*R.S,-Math.abs(R.vel)*0.25-(30+Math.random()*50),-(20+Math.random()*80),0.45,'rgba(255,190,90,0.9)',(1+Math.random()*1.8)*R.S);
    }
  }
  /* wheel spray droplets (only when rolling near the ground) */
  if((R.st==='play'||R.st==='wait'||R.st==='trans'||R.st==='menu')&&B.jy<10){
    const spd=Math.abs(R.vel);
    const n=spd>R.W*0.15?2:1;
    for(let i=0;i<n;i++){
      R.fx.add(R.px+(Math.random()<.5?-1:1)*44*R.S+(Math.random()-0.5)*14*R.S,R.gy+2*R.S,(Math.random()-0.5)*200-R.lean*160,-70-Math.random()*170,0.5,'rgba(190,232,255,0.85)',(1+Math.random()*1.6)*R.S);
    }
  }
};

B.drawSpray=function(){
  /* sheet of spray kicked up behind the wheels at speed on wet ground */
  const spd=Math.abs(R.vel),wet=R.wx.wet;
  if(spd<R.W*0.1||wet<0.25||B.jy>10||R.st==='over'||R.st==='dying')return;
  const cx=R.cx,a=Math.min(1,spd/(R.W*0.7))*wet;
  const dir=-Math.sign(R.vel||1);
  const x0=R.px+dir*38*R.S;
  cx.save();cx.globalCompositeOperation='lighter';
  const g=cx.createLinearGradient(x0,0,x0+dir*130*R.S,0);
  g.addColorStop(0,`rgba(190,232,255,${0.16*a})`);
  g.addColorStop(1,'rgba(190,232,255,0)');
  cx.fillStyle=g;
  cx.beginPath();
  cx.moveTo(x0,R.gy-2);
  cx.lineTo(x0+dir*130*R.S,R.gy-34*R.S);
  cx.lineTo(x0+dir*150*R.S,R.gy+2);
  cx.closePath();cx.fill();
  /* mist cushion under the deck */
  const m=cx.createRadialGradient(R.px,R.gy-4,0,R.px,R.gy-4,60*R.S);
  m.addColorStop(0,`rgba(200,235,255,${0.10*a})`);m.addColorStop(1,'rgba(200,235,255,0)');
  cx.fillStyle=m;
  cx.save();cx.scale(1,0.25);cx.beginPath();cx.arc(R.px,(R.gy-4)/0.25,60*R.S,0,R.TAU);cx.fill();cx.restore();
  cx.restore();
};

B.draw=function(refl){
  const cx=R.cx,k=R.S*1.15,pw=1+R.bPulse*.05;
  const def=B.def();
  const tf=R.transformT>0;
  const SK=R.skate,bxp=SK?SK.drawX():R.px,byp=SK?SK.drawY():B.jy;
  /* shadow falls on the surface under the board (a ledge top or the road) */
  const shH=SK&&!SK.crash?Math.max(0,Math.min(byp,SK.shadowH||0)):0;
  cx.save();cx.translate(bxp,R.gy-shH);
  if(!refl){
    const hgt=Math.max(0,byp-shH),sf=1/(1+hgt/(160*R.S));
    cx.save();
    cx.globalAlpha=0.35*(0.4+R.wx.wet*0.6)*Math.max(0.25,sf)*(1-Math.min(0.8,hgt/(300*R.S)));
    cx.fillStyle='#000';
    cx.scale((1+ (1-sf)*0.8),0.22);
    cx.beginPath();cx.arc(0,0,66*k,0,R.TAU);cx.fill();
    cx.restore();
  }
  cx.translate(0,-(byp-shH));
  const bob=(refl||(SK&&(SK.crash||!B.grounded)))?0:Math.sin(R.t*19)*.35*k*Math.min(1,.5+Math.abs(R.lean)*2);
  cx.translate(0,-bob);cx.rotate(SK&&SK.crash?0:R.lean*.09*(1-Math.min(0.5,B.jy/(280*R.S))));
  const sq=refl?0:B.squash;
  cx.scale(pw*(1+0.08*sq),pw*(1-0.12*sq));

  if(!refl){
    /* underglow aura — board colour, rainbow on streaks, blazing when transformed */
    cx.globalCompositeOperation='lighter';
    const aur=tf
      ?`rgba(255,190,80,${0.34+0.14*Math.sin(R.t*6)})`
      :R.shield
        ?`rgba(120,225,255,${0.24+0.10*Math.sin(R.t*3)})`
        :(R.streak>=6&&!R.bRed)
          ?`hsla(${(R.t*130)%360},100%,68%,${.3+.3*Math.min(1,R.streak/14)})`
          :(R.bRed>0?`rgba(255,70,70,${.3+.3*R.bRed})`:`rgba(${def.glow},${.26+.32*R.bPulse})`);
    const ar=86*k*(R.streak>=6?1.25:1)*(tf?1.2:1);
    const rg=cx.createRadialGradient(0,0,0,0,0,ar);
    rg.addColorStop(0,aur);rg.addColorStop(1,'rgba(90,120,255,0)');
    cx.save();cx.scale(1,.2);cx.fillStyle=rg;cx.beginPath();cx.arc(0,0,ar,0,R.TAU);cx.fill();cx.restore();
    if(R.wideT>0){
      const a=(0.10+0.05*Math.sin(R.t*5))*Math.min(1,R.wideT);
      const rg2=cx.createRadialGradient(0,-6*k,0,0,-6*k,150*k);
      rg2.addColorStop(0,`rgba(255,210,130,${a})`);rg2.addColorStop(1,'rgba(255,210,130,0)');
      cx.fillStyle=rg2;cx.fillRect(-160*k,-160*k,320*k,320*k);
    }
    cx.globalCompositeOperation='source-over';
  }

  /* ---- 3D board (board3d.js): flips / shove-its / manual pitch come from R.tricks ---- */
  {
    const o=R.tricks?R.tricks.boardOpts(def,tf):{flipAngle:0,spinAngle:R.lean*.35,tilt:0,deckColors:[def.art[1],def.art[2]],gripColor:'#1d1d22',look:def.look,vp:.26};
    /* sprite-cached when riding; live polygons only during flips (perf) */
    window.drawSkateboardFast(cx,0,0,1.95*R.S,o,Math.min(2,R.d));
    /* neon rim pulse on catches, now as a glow line under the deck */
    if(!refl&&R.bPulse>0){
      cx.save();cx.globalCompositeOperation='lighter';
      cx.strokeStyle=`rgba(${def.glow},${0.7*R.bPulse})`;cx.lineWidth=1.6*k;
      cx.beginPath();cx.moveTo(-60*k,-24*k);cx.quadraticCurveTo(0,-20*k,60*k,-24*k);cx.stroke();cx.restore();
    }
  }

  /* ---- energy dome shield ---- */
  if(!refl&&R.shield){
    const cy0=-30*k,rx=95*k,ry=82*k;
    const dome=()=>{cx.beginPath();cx.ellipse(0,cy0,rx,ry,0,Math.PI,Math.PI*2);cx.closePath()};
    cx.save();
    dome();
    let sg=cx.createRadialGradient(0,cy0+ry*0.35,10,0,cy0,ry*1.05);
    sg.addColorStop(0,'rgba(120,225,255,0.02)');
    sg.addColorStop(0.72,'rgba(120,210,255,0.05)');
    sg.addColorStop(0.95,'rgba(150,230,255,0.16)');
    sg.addColorStop(1,'rgba(180,240,255,0.02)');
    cx.fillStyle=sg;cx.fill();
    dome();cx.clip();
    if(R.hexPat){
      cx.globalAlpha=0.14+0.05*Math.sin(R.t*2.1);
      cx.fillStyle=R.hexPat;
      cx.save();cx.translate(-((R.t*6)%42),-((R.t*9)%37));cx.fillRect(-rx-60,cy0-ry-60,rx*2+120,ry+120);cx.restore();
      cx.globalAlpha=1;
    }
    for(const rp of R.fx.shieldRipples){
      cx.globalAlpha=Math.max(0,rp.a)*0.85;
      cx.strokeStyle='rgba(190,245,255,0.9)';cx.lineWidth=2.4*k;
      cx.beginPath();cx.arc(rp.ox,rp.oy,rp.r,0,R.TAU);cx.stroke();
      cx.strokeStyle='rgba(255,255,255,0.5)';cx.lineWidth=1;
      cx.beginPath();cx.arc(rp.ox,rp.oy,rp.r*0.7,0,R.TAU);cx.stroke();
    }
    cx.globalAlpha=1;
    const sxp=((R.t*40)%(rx*2.4))-rx*1.2;
    const hg=cx.createLinearGradient(sxp-30*k,cy0-ry,sxp+30*k,cy0);
    hg.addColorStop(0,'rgba(255,255,255,0)');hg.addColorStop(.5,'rgba(220,250,255,0.10)');hg.addColorStop(1,'rgba(255,255,255,0)');
    cx.fillStyle=hg;cx.fillRect(-rx,cy0-ry,rx*2,ry*1.5);
    cx.restore();
    dome();
    const rg2=cx.createLinearGradient(0,cy0-ry,0,cy0+ry*0.3);
    rg2.addColorStop(0,'rgba(210,250,255,0.95)');
    rg2.addColorStop(0.6,'rgba(120,220,255,0.35)');
    rg2.addColorStop(1,'rgba(120,220,255,0.08)');
    cx.strokeStyle=rg2;cx.lineWidth=2.2*k;
    cx.shadowColor='rgba(140,230,255,0.9)';cx.shadowBlur=14*k;
    cx.stroke();cx.shadowBlur=0;
    cx.strokeStyle='rgba(255,255,255,0.85)';cx.lineWidth=3*k;
    cx.beginPath();cx.ellipse(0,cy0,rx,ry,0,Math.PI*1.32,Math.PI*1.68);cx.stroke();
  }
  cx.restore();
};
})();
