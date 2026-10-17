/* Rain of the Word — fx: particles, rings, splashes, fly text, trail, vents, lens droplets */
window.ROW=window.ROW||{};
(function(){
'use strict';
const R=ROW;
const F=R.fx={
  parts:[],rings:[],splashes:[],flyTexts:[],trailPts:[],shieldRipples:[],lensDrops:[]
};
F.reset=function(){F.parts.length=0;F.rings.length=0;F.splashes.length=0;F.flyTexts.length=0;F.trailPts.length=0;F.shieldRipples.length=0};

F.burst=function(x,y,c,n,v){
  n=n||38;v=v||420;
  for(let i=0;i<n;i++){
    const a=Math.random()*R.TAU,s=Math.random()*v;
    F.parts.push({x,y,vx:Math.cos(a)*s,vy:Math.sin(a)*s-v*0.32,l:1,c,r:(1+Math.random()*3.4)*R.S});
  }
};
F.flashScreen=function(c){
  const el=R.fxEl;if(!el)return;
  el.style.transition='none';el.style.background=c;el.style.opacity=1;
  requestAnimationFrame(()=>requestAnimationFrame(()=>{el.style.transition='opacity .45s';el.style.opacity=0}));
};
F.hitStop=s=>{R.hitStop=Math.max(R.hitStop,s)};

F.update=function(dt){
  for(const p of F.parts){
    p.x+=p.vx*dt;p.y+=p.vy*dt;p.vy+=560*dt;
    if(p.gr){p.r+=p.gr*dt;p.vy*=Math.max(0,1-dt*0.6)}
    p.l-=dt*1.35;
  }
  F.parts=F.parts.filter(p=>p.l>0);
  for(const r of F.rings){r.r+=dt*620;r.a-=dt*2.1}
  F.rings=F.rings.filter(r=>r.a>0);
  for(const s of F.splashes){s.r+=dt*90*R.S;s.a-=dt*2.0}
  F.splashes=F.splashes.filter(s=>s.a>0);
  for(const f of F.flyTexts)f.t+=dt/0.62;
  F.flyTexts=F.flyTexts.filter(f=>f.t<1);
  /* text spam cap: keep the glow affordable */
  if(F.flyTexts.length>20)F.flyTexts.splice(0,F.flyTexts.length-20);
  if(F.rings.length>48)F.rings.splice(0,F.rings.length-48);
  for(const rp of F.shieldRipples){rp.r+=dt*300*R.S;rp.a-=dt*2.4}
  F.shieldRipples=F.shieldRipples.filter(rp=>rp.a>0);
  /* lens droplets */
  if(R.wx&&R.wx.rain>0.25&&F.lensDrops.length<30&&Math.random()<dt*R.wx.rain*3.2){
    F.lensDrops.push({x:Math.random()*R.W,y:Math.random()*R.H*0.8,r:(2+Math.random()*7)*R.S,vy:8+Math.random()*26,life:0,wob:Math.random()*6.3});
  }
  for(const D of F.lensDrops){D.life=Math.min(1,D.life+dt*1.2);D.y+=D.vy*dt*(0.4+D.r*0.06)*R.ts;D.x+=Math.sin(R.t*2+D.wob)*6*dt}
  F.lensDrops=F.lensDrops.filter(D=>D.y<R.H+12&&(R.wx.rain>=0.2||((D.life-=dt*1.6)>0)));
  /* streak trail */
  if(R.streak>=6&&(R.st==='play'||R.st==='wait'||R.st==='trans')){
    F.trailPts.push({x:R.px,y:R.gy});
    if(F.trailPts.length>22)F.trailPts.shift();
  }else if(F.trailPts.length)F.trailPts.shift();
  /* steam vents */
  for(const v of R.vents){
    v.t-=dt;
    if(v.t<=0){
      v.t=0.5+Math.random()*0.9;
      F.parts.push({x:v.x+(Math.random()-0.5)*20*R.S,y:R.gy+4,
        vx:(Math.random()-0.5)*14+R.lean*10,vy:-(20+Math.random()*26),
        l:1.6,gr:(26+Math.random()*20)*R.S,c:'rgba(185,195,215,0.07)',r:(8+Math.random()*8)*R.S});
    }
  }
};

F.drawTrail=function(){
  const cx=R.cx,t=F.trailPts;
  if(t.length<2)return;
  cx.save();cx.globalCompositeOperation='lighter';cx.lineCap='round';
  for(let i=1;i<t.length;i++){
    const p0=t[i-1],p1=t[i],u=i/t.length;
    cx.strokeStyle=R.streak>=12
      ?`hsla(${(R.t*220+i*14)%360},100%,65%,${u*.5})`
      :`hsla(45,100%,65%,${u*.4})`;
    cx.lineWidth=u*9*R.S;
    cx.beginPath();cx.moveTo(p0.x,p0.y-14*R.S);cx.lineTo(p1.x,p1.y-14*R.S);cx.stroke();
  }
  cx.restore();
};
F.drawParticles=function(){
  const cx=R.cx;
  cx.globalCompositeOperation='lighter';
  for(const r of F.rings){
    cx.strokeStyle=`rgba(255,217,138,${r.a})`;
    cx.lineWidth=3.5*r.a*R.S;
    cx.beginPath();cx.arc(r.x,r.y,r.r,0,R.TAU);cx.stroke();
  }
  for(const p of F.parts){
    cx.globalAlpha=Math.max(0,p.l);
    cx.fillStyle=p.c;
    cx.beginPath();cx.arc(p.x,p.y,p.r,0,R.TAU);cx.fill();
  }
  cx.globalAlpha=1;
  cx.globalCompositeOperation='source-over';
};
F.drawSplashes=function(){
  const cx=R.cx;cx.lineWidth=1.2;
  for(const s of F.splashes){
    cx.strokeStyle=`rgba(190,232,255,${s.a*0.6})`;
    cx.beginPath();
    cx.ellipse(s.x,s.y,s.mx*(1-s.a)+3,2.2,0,0,R.TAU);
    cx.stroke();
  }
};
F.drawFlyTexts=function(){
  const cx=R.cx;
  for(const f of F.flyTexts){
    const e=1-Math.pow(1-f.t,3);
    const x=f.x+(R.W/2-f.x)*e;
    const y=f.y+(R.H*0.085-f.y)*e;
    const sz=R.F()*(1.15-0.35*e)*(f.small?0.72:1);
    cx.font=`bold ${sz}px Georgia`;
    cx.textAlign='center';cx.textBaseline='middle';
    cx.shadowColor=f.col?`rgba(${f.col},.9)`:'#ffb347';cx.shadowBlur=16;
    cx.fillStyle=`rgba(${f.col||'255,230,155'},${1-f.t*0.35})`;
    cx.fillText(f.w,x,y);
    cx.shadowBlur=0;
  }
};
F.drawDroplets=function(){
  if(!F.lensDrops.length)return;
  const cx=R.cx;cx.save();
  for(const D of F.lensDrops){
    const a=Math.min(0.55,D.life);
    const g=cx.createRadialGradient(D.x-D.r*0.35,D.y-D.r*0.4,D.r*0.1,D.x,D.y,D.r);
    g.addColorStop(0,`rgba(255,255,255,${0.28*a})`);
    g.addColorStop(0.55,`rgba(170,200,235,${0.10*a})`);
    g.addColorStop(0.9,`rgba(20,30,55,${0.25*a})`);
    g.addColorStop(1,`rgba(255,255,255,${0.12*a})`);
    cx.fillStyle=g;cx.beginPath();cx.arc(D.x,D.y,D.r,0,R.TAU);cx.fill();
    cx.fillStyle=`rgba(255,255,255,${0.5*a})`;
    cx.beginPath();cx.arc(D.x-D.r*0.35,D.y-D.r*0.45,Math.max(0.6,D.r*0.16),0,R.TAU);cx.fill();
  }
  cx.restore();
};
})();
