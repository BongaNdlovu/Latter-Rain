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
        /* landing: squash, dust/spray, thud */
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
      B.jv=0;B.grounded=true;
    }
  }
  /* Transformer embers */
  if(R.transformT>0&&(R.st==='play'||R.st==='wait'||R.st==='trans')){
    for(let i=0;i<2;i++){
      R.fx.parts.push({
        x:R.px-38*R.S+(Math.random()-0.5)*10*R.S,
        y:R.gy-B.jy-8*R.S+(Math.random()-0.5)*8*R.S,
        vx:-Math.abs(R.vel)*0.25-(30+Math.random()*50),
        vy:-(20+Math.random()*80),
        l:0.45,c:'rgba(255,190,90,0.9)',r:(1+Math.random()*1.8)*R.S
      });
    }
  }
  /* wheel spray droplets (only when rolling near the ground) */
  if((R.st==='play'||R.st==='wait'||R.st==='trans'||R.st==='menu')&&B.jy<10){
    const spd=Math.abs(R.vel);
    const n=spd>R.W*0.15?2:1;
    for(let i=0;i<n;i++){
      R.fx.parts.push({
        x:R.px+(Math.random()<.5?-1:1)*44*R.S+(Math.random()-0.5)*14*R.S,
        y:R.gy+2*R.S,
        vx:(Math.random()-0.5)*200-R.lean*160,
        vy:-70-Math.random()*170,
        l:0.5,c:'rgba(190,232,255,0.85)',r:(1+Math.random()*1.6)*R.S
      });
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
  cx.save();cx.translate(R.px,R.gy);
  /* contact shadow stays on the ground plane, grows and fades with height */
  if(!refl){
    const sf=1/(1+B.jy/(160*R.S));
    cx.save();
    cx.globalAlpha=0.35*(0.4+R.wx.wet*0.6)*Math.max(0.25,sf)*(1-Math.min(0.8,B.jy/(300*R.S)));
    cx.fillStyle='#000';
    cx.scale((1+ (1-sf)*0.8),0.22);
    cx.beginPath();cx.arc(0,0,66*k,0,R.TAU);cx.fill();
    cx.restore();
  }
  cx.translate(0,-B.jy);
  const bob=refl?0:Math.sin(R.t*19)*.35*k*Math.min(1,.5+Math.abs(R.lean)*2);
  cx.translate(0,-bob);cx.rotate(R.lean*.09*(1-Math.min(0.5,B.jy/(280*R.S))));
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

  /* ---- trucks + wheels ---- */
  for(const sx of[-38,38]){
    /* baseplate + hanger */
    cx.fillStyle='#39424e';
    cx.beginPath();
    cx.moveTo((sx-9)*k,-24*k);cx.lineTo((sx+9)*k,-24*k);
    cx.lineTo((sx+6)*k,-16*k);cx.lineTo((sx-6)*k,-16*k);
    cx.closePath();cx.fill();
    cx.fillStyle='#525f6e';
    cx.fillRect((sx-5)*k,-17.5*k,10*k,2*k);
    /* kingpin */
    cx.fillStyle='#2b323b';
    cx.beginPath();cx.arc(sx*k,-19*k,2.2*k,0,R.TAU);cx.fill();
    /* wheel: urethane tinted per board, hub + spinning spokes */
    const wr=9*k;
    let wg=cx.createRadialGradient((sx-2)*k,-9*k,wr*0.15,sx*k,-9*k,wr);
    wg.addColorStop(0,'#f4f8fc');wg.addColorStop(.55,def.wheel);wg.addColorStop(1,'#4a5a6c');
    cx.fillStyle=wg;cx.beginPath();cx.arc(sx*k,-9*k,wr,0,R.TAU);cx.fill();
    cx.strokeStyle='rgba(20,26,34,.8)';cx.lineWidth=1.2*k;
    cx.beginPath();cx.arc(sx*k,-9*k,wr,0,R.TAU);cx.stroke();
    cx.fillStyle='#c9d6e4';
    cx.beginPath();cx.arc(sx*k,-9*k,3.6*k,0,R.TAU);cx.fill();
    cx.fillStyle='#0d141c';
    cx.beginPath();cx.arc(sx*k,-9*k,1.8*k,0,R.TAU);cx.fill();
    cx.save();cx.translate(sx*k,-9*k);cx.rotate(R.wRot);
    cx.strokeStyle='rgba(255,255,255,.65)';cx.lineWidth=1*k;
    for(let a2=0;a2<3;a2++){
      cx.rotate(R.TAU/3);
      cx.beginPath();cx.moveTo(0,2*k);cx.lineTo(0,7.4*k);cx.stroke();
    }
    cx.restore();
  }

  /* ---- deck: wood core, plies, grip tape, board-coloured art ---- */
  const top=()=>{
    cx.beginPath();
    cx.moveTo(-66*k,-37*k);
    cx.quadraticCurveTo(-52*k,-26*k,-40*k,-26*k);
    cx.lineTo(40*k,-26*k);
    cx.quadraticCurveTo(52*k,-26*k,66*k,-37*k);
  };
  const bottom=()=>{
    cx.beginPath();
    cx.moveTo(66*k,-32*k);
    cx.quadraticCurveTo(52*k,-21*k,40*k,-21*k);
    cx.lineTo(-40*k,-21*k);
    cx.quadraticCurveTo(-52*k,-21*k,-66*k,-32*k);
  };
  cx.lineCap='round';cx.lineJoin='round';
  if(!refl&&R.bPulse>0){cx.shadowColor=def.wheel;cx.shadowBlur=26*k*R.bPulse}
  top();
  cx.lineTo(66*k,-32*k);
  bottom();
  cx.closePath();
  const wood=tf
    ?(()=>{const w2=cx.createLinearGradient(0,-37*k,0,-21*k);w2.addColorStop(0,'#ffe2a0');w2.addColorStop(.5,'#ffab4a');w2.addColorStop(1,'#c86a28');return w2})()
    :(()=>{const w2=cx.createLinearGradient(0,-37*k,0,-21*k);w2.addColorStop(0,'#d9b078');w2.addColorStop(.5,'#b98a52');w2.addColorStop(1,'#8a5a34');return w2})();
  cx.fillStyle=wood;cx.fill();cx.shadowBlur=0;
  /* ply lines on the core */
  cx.save();
  top();cx.lineTo(66*k,-32*k);bottom();cx.closePath();cx.clip();
  cx.strokeStyle='rgba(70,40,18,.5)';cx.lineWidth=0.8*k;
  for(let i=1;i<=2;i++){
    cx.beginPath();cx.moveTo(-66*k,-36*k+i*5*k);cx.lineTo(66*k,-36*k+i*5*k);cx.stroke();
  }
  /* deck art stripe in the board's colours */
  const art=cx.createLinearGradient(-64*k,0,64*k,0);
  art.addColorStop(0,def.art[0]);art.addColorStop(.5,def.art[1]);art.addColorStop(1,def.art[2]);
  cx.strokeStyle=art;cx.lineWidth=3*k;
  cx.beginPath();cx.moveTo(-58*k,-27.5*k);cx.quadraticCurveTo(0,-24.5*k,58*k,-27.5*k);cx.stroke();
  if(tf){
    /* molten second stripe */
    cx.strokeStyle='rgba(255,240,190,.8)';cx.lineWidth=1.2*k;
    cx.beginPath();cx.moveTo(-58*k,-25.5*k);cx.quadraticCurveTo(0,-22.5*k,58*k,-25.5*k);cx.stroke();
  }
  cx.restore();
  /* grip tape along the top edge */
  top();
  cx.strokeStyle='#14161c';cx.lineWidth=2.6*k;cx.stroke();
  /* rail highlight */
  top();
  cx.strokeStyle='rgba(255,255,255,.22)';cx.lineWidth=0.9*k;cx.stroke();
  /* neon rim pulse */
  if(!refl&&R.bPulse>0){
    top();
    cx.strokeStyle=`rgba(${def.glow},${0.85*R.bPulse})`;cx.lineWidth=1.4*k;cx.stroke();
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
