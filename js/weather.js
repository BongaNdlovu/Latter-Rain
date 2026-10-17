/* Rain of the Word — weather: interpolation, per-location storms, overlays, gust scheduler */
window.ROW=window.ROW||{};
(function(){
'use strict';
const R=ROW;
const WS=R.wxSys={hailBoost:0,sandBoost:0,gustT:5};

const KEYS=['rain','bolt','hail','sand','cloud','fog','stars','snow','wind','wet','sun'];

/* live interpolated weather */
R.wx={};
WS.init=function(){
  const T=R.WXN[0];
  KEYS.forEach(k=>R.wx[k]=T[k]);
  ['top','mid','bot'].forEach(k=>R.wx[k]=T[k].slice());
};
WS.init();

WS.name=()=>R.WXN[R.wxI].n;

WS.setW=function(w){
  const i=typeof w==='number'?w:R.wxIdx(w);
  R.wxI=R.clamp(i,0,R.WXN.length-1);
  if(R.wxEl){
    R.wxEl.style.opacity=0;
    setTimeout(()=>{R.wxEl.textContent=R.WXN[R.wxI].n;R.wxEl.style.opacity=.75},400);
  }
};

WS.update=function(dt){
  const T=R.WXN[R.wxI],k=1-Math.exp(-dt/1.7);
  KEYS.forEach(q=>{
    let tgt=T[q];
    if(q==='hail')tgt=Math.max(tgt,WS.hailBoost>0?1:0);
    if(q==='sand')tgt=Math.max(tgt,WS.sandBoost>0?1:0);
    R.wx[q]+=(tgt-R.wx[q])*k;
  });
  ['top','mid','bot'].forEach(q=>{for(let i=0;i<3;i++)R.wx[q][i]+=(T[q][i]-R.wx[q][i])*k});
  WS.hailBoost=Math.max(0,WS.hailBoost-dt);
  WS.sandBoost=Math.max(0,WS.sandBoost-dt);
  R.audio.setBeds(R.wx);
  /* menu ambience: cycle the weather every 11s */
  if(R.st==='menu'){
    R.menuT-=dt;
    if(R.menuT<=0){R.menuT=11;WS.setW((R.wxI+1)%R.WXN.length)}
  }
  /* wind gusts */
  WS.gustT-=dt;
  if(WS.gustT<=0){
    if((R.wx.wind>0.45||R.wx.bolt>0.4)&&R.st!=='over'&&R.st!=='dying')R.rain.spawnGust();
    WS.gustT=4+Math.random()*6;
  }
};

WS.overlays=function(){
  const cx=R.cx,L=R.LOC[R.locI],fc=L.fogC;
  /* ground fog (ramps from the very top so no banding edge shows) */
  if(R.wx.fog>.02){
    const g=cx.createLinearGradient(0,0,0,R.H);
    g.addColorStop(0,`rgba(${fc[0]},${fc[1]},${fc[2]},0)`);
    g.addColorStop(.45,`rgba(${fc[0]},${fc[1]},${fc[2]},${R.wx.fog*.10})`);
    g.addColorStop(.75,`rgba(${fc[0]},${fc[1]},${fc[2]},${R.wx.fog*.28})`);
    g.addColorStop(1,`rgba(${fc[0]},${fc[1]},${fc[2]},${R.wx.fog*.12})`);
    cx.fillStyle=g;cx.fillRect(-80,-80,R.W+160,R.H+160);
  }
  /* sandstorm haze */
  if(R.wx.sand>0.05){
    const a=R.wx.sand*0.24;
    const g=cx.createLinearGradient(0,R.gy*0.3,0,R.H);
    g.addColorStop(0,`rgba(196,140,80,0)`);g.addColorStop(1,`rgba(196,140,80,${a})`);
    cx.fillStyle=g;cx.fillRect(-80,-80,R.W+160,R.H+160);
    cx.save();cx.globalAlpha=R.wx.sand*0.5;
    for(let i=0;i<4;i++){
      const y=R.gy*(0.5+0.14*i)+Math.sin(R.t*0.9+i*2.4)*10;
      const sx=((R.t*(120+i*60)+i*500)%(R.W+400))-200;
      const sg=cx.createLinearGradient(sx-140,0,sx+140,0);
      sg.addColorStop(0,'rgba(210,160,100,0)');sg.addColorStop(.5,`rgba(210,160,100,${0.1*R.wx.sand})`);sg.addColorStop(1,'rgba(210,160,100,0)');
      cx.fillStyle=sg;cx.fillRect(sx-140,y-8,280,16);
    }
    cx.restore();
  }
  /* lightning veil */
  if(R.flash>0){
    cx.fillStyle=`rgba(220,240,255,${R.flash*0.2})`;cx.fillRect(-80,-80,R.W+160,R.H+160);
  }
  /* slow-mo tint */
  if(R.slowF<0.97){
    cx.fillStyle=`rgba(130,170,255,${(1-R.slowF)*0.12})`;cx.fillRect(-80,-80,R.W+160,R.H+160);
  }
};
})();
