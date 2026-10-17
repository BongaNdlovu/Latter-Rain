/* Rain of the Word — storm: multi-pulse lightning strobe, afterimage buffer,
   directional light, distance-delayed thunder, sheet lightning */
window.ROW=window.ROW||{};
(function(){
'use strict';
const R=ROW;
const S=R.storm={
  bolt:null,boltT:0,timer:2.5,pulses:[],lightX:0,lastSheet:false
};

/* build a jagged bolt geometry from (x0,-20) down to the horizon */
S.makeBolt=function(x0){
  let x=x0,y=-20;
  const stop=R.gy-R.H*0.12;
  const a=[[x,y]],br=[];
  while(y<stop){
    x+=(Math.random()-0.5)*60*R.S;y+=16+Math.random()*34;
    a.push([x,y]);
    if(Math.random()<0.16){
      let bx=x,by=y;const b=[[bx,by]];
      for(let i=0;i<5;i++){bx+=(Math.random()-0.35)*46*R.S;by+=14+Math.random()*26;b.push([bx,by])}
      br.push(b);
    }
  }
  return {a,br,endX:x,endY:stop};
};
/* jitter an existing geometry slightly (per strobe pulse) */
const jitter=geo=>{
  const j=p=>[p[0]+(Math.random()-0.5)*7,p[1]+(Math.random()-0.5)*4];
  return {a:geo.a.map(j),br:geo.br.map(b=>b.map(j)),endX:geo.endX,endY:geo.endY};
};

S.stampAfter=function(geo){
  const ax=R.afterx;
  ax.setTransform(1,0,0,1,0,0);
  ax.clearRect(0,0,R.after.width,R.after.height);
  ax.globalCompositeOperation='lighter';
  ax.strokeStyle='rgba(190,220,255,0.75)';
  ax.lineWidth=2.4;ax.lineJoin='round';ax.lineCap='round';
  [geo.a,...geo.br].forEach(b=>{
    ax.beginPath();b.forEach((p,i)=>i?ax.lineTo(p[0],p[1]):ax.moveTo(p[0],p[1]));ax.stroke();
  });
};

S.strike=function(power){
  const x0=R.W*(0.10+Math.random()*0.80);
  const geo=S.makeBolt(x0);
  S.geo=geo;S.bolt=geo;S.lightX=x0;S.born=R.t;
  S.pulses=[];
  const np=2+(Math.random()*3|0);
  let t0=R.t;
  for(let i=0;i<np;i++){
    S.pulses.push({t0,i:0.55+Math.random()*0.45});
    t0+=0.05+Math.random()*0.09;
  }
  S.stampAfter(geo);
  const dist01=Math.abs(x0-R.px)/R.W;
  R.audio.thunder(dist01,power==null?0.6+Math.random()*0.4:power,x0);
  /* shake lands with the sound */
  setTimeout(()=>{R.shake=Math.max(R.shake,0.85)},(120+dist01*1400));
};

S.sheet=function(){
  S.lightX=R.W*Math.random();
  R.flash=Math.max(R.flash,0.5+Math.random()*0.3);
  R.audio.thunder(Math.random(),0.3,S.lightX);
};

S.update=function(dt){
  const wx=R.wx;
  const barrage=R.disasters&&R.disasters.ev&&R.disasters.ev.type==='barrage';
  S.timer-=dt*(wx.bolt+(barrage?2.4:0));
  if(S.timer<=0){
    if(wx.bolt>0.35){
      if(Math.random()<0.3)S.sheet();
      else S.strike();
    }
    S.timer=(3+Math.random()*6)/(1+R.lvl*0.09);
    if(barrage)S.timer=Math.min(S.timer,0.55+Math.random()*0.4);
  }
  /* strobe envelope from the pulse train */
  let f=0;
  for(const p of S.pulses){
    const age=R.t-p.t0;
    if(age>=0&&age<0.5){
      f+=p.i*Math.exp(-age*16);
      /* each new pulse re-jitters the channel and refreshes the afterimage */
      if(!p.hit&&age<0.02){
        p.hit=true;
        S.geo=jitter(S.geo);S.bolt=S.geo;
        S.stampAfter(S.geo);
      }
    }
  }
  S.pulses=S.pulses.filter(p=>R.t-p.t0<0.6);
  R.flash=Math.max(R.flash-dt*2.4,Math.min(1.2,f));
  S.boltT=f;
  /* fade the afterimage buffer */
  const ax=R.afterx;
  ax.setTransform(1,0,0,1,0,0);
  ax.globalCompositeOperation='destination-out';
  ax.fillStyle=`rgba(0,0,0,${Math.min(1,dt*5)})`;
  ax.fillRect(0,0,R.after.width,R.after.height);
  ax.globalCompositeOperation='lighter';
};

S.draw=function(){
  const cx=R.cx,f=S.boltT;
  /* afterimage ghost */
  if(f>0.03){
    cx.save();cx.setTransform(R.d,0,0,R.d,0,0);
    cx.globalCompositeOperation='lighter';
    cx.globalAlpha=Math.min(1,f)*0.55;
    cx.drawImage(R.after,0,0,R.W,R.H);
    cx.restore();
  }
  if(!S.bolt||f<=0.04)return;
  const al=Math.min(1,f*1.4);
  cx.save();
  cx.globalCompositeOperation='lighter';
  cx.shadowColor='#bfe6ff';cx.shadowBlur=26;
  cx.lineJoin='round';cx.lineCap='round';
  [S.bolt.a,...S.bolt.br].forEach((b,i)=>{
    cx.strokeStyle=`rgba(255,255,255,${al*(i?0.6:1)})`;
    cx.lineWidth=(i?1.4:3.2)*R.S;
    cx.beginPath();b.forEach((p,j)=>j?cx.lineTo(p[0],p[1]):cx.moveTo(p[0],p[1]));cx.stroke();
    if(!i){
      cx.lineWidth=1.2*R.S;
      cx.beginPath();b.forEach((p,j)=>j?cx.lineTo(p[0],p[1]):cx.moveTo(p[0],p[1]));cx.stroke();
    }
  });
  /* ground impact bloom */
  const g=cx.createRadialGradient(S.bolt.endX,R.gy,0,S.bolt.endX,R.gy,90*R.S);
  g.addColorStop(0,`rgba(200,230,255,${al*0.5})`);g.addColorStop(1,'rgba(200,230,255,0)');
  cx.fillStyle=g;cx.fillRect(S.bolt.endX-90*R.S,R.gy-90*R.S,180*R.S,180*R.S);
  cx.restore();
};
})();
