/* Rain of the Word — weather: interpolation, per-location storms, overlays, gust scheduler */
window.ROW=window.ROW||{};
(function(){
'use strict';
const R=ROW;
const WS=R.wxSys={hailBoost:0,sandBoost:0,gustT:5};

const KEYS=['rain','bolt','hail','sand','cloud','fog','stars','snow','wind','wet','sun','heat'];

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
  WS.tickAcc(dt);
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

let _sg=null,_sgk='',_sw=null;
function G_SAND(cx,gy){const k=gy+'|'+R.H;if(_sg&&_sgk===k)return _sg;_sgk=k;
  const g=cx.createLinearGradient(0,0,0,R.H);
  g.addColorStop(0,'rgba(120,110,98,.30)');g.addColorStop(gy*0.55/R.H,'rgba(140,128,110,.55)');
  g.addColorStop(gy*0.98/R.H,'rgba(150,138,118,.62)');g.addColorStop(Math.min(1,(gy+(R.H-gy)*0.35)/R.H),'rgba(140,128,110,.22)');
  g.addColorStop(1,'rgba(120,110,96,.08)');return _sg=g}
function SAND_WALL(cx){if(_sw)return _sw;const g=cx.createRadialGradient(0,0,0,0,0,200);g.addColorStop(0,'rgba(150,138,118,.45)');g.addColorStop(1,'rgba(150,138,118,0)');return _sw=g}
WS.overlays=function(){
  const cx=R.cx,L=R.LOC[R.locI],sd=Math.min(1,R.wx.sand*1.2);
  /* r6: in a sandstorm the fog takes the dust colour (brown-grey) instead of the place's warm tint */
  const fc=sd>.02?(WS._fc=WS._fc||[0,0,0],WS._fc[0]=L.fogC[0]+(150-L.fogC[0])*sd|0,WS._fc[1]=L.fogC[1]+(140-L.fogC[1])*sd|0,WS._fc[2]=L.fogC[2]+(124-L.fogC[2])*sd|0,WS._fc):L.fogC;
  /* ground fog (ramps from the very top so no banding edge shows) */
  if(R.wx.fog>.02){
    const g=cx.createLinearGradient(0,0,0,R.H);
    g.addColorStop(0,`rgba(${fc[0]},${fc[1]},${fc[2]},0)`);
    g.addColorStop(.45,`rgba(${fc[0]},${fc[1]},${fc[2]},${R.wx.fog*.10})`);
    g.addColorStop(.75,`rgba(${fc[0]},${fc[1]},${fc[2]},${R.wx.fog*.28})`);
    g.addColorStop(1,`rgba(${fc[0]},${fc[1]},${fc[2]},${R.wx.fog*.12})`);
    cx.fillStyle=g;cx.fillRect(-80,-80,R.W+160,R.H+160);
  }
  /* sandstorm haze (r6): dusty brown-grey with a visibility falloff — the far distance (horizon band)
     is almost swallowed, mid-ground veiled, the foreground stays readable; drifting denser walls of dust */
  if(R.wx.sand>0.05){
    const s=R.wx.sand,gy=R.gy;
    const g=G_SAND(cx,gy);
    cx.globalAlpha=Math.min(1,s);cx.fillStyle=g;cx.fillRect(-80,-80,R.W+160,R.H+160);
    cx.globalAlpha=s*0.55;
    for(let i=0;i<4;i++){
      const y=gy*(0.45+0.14*i)+Math.sin(R.t*0.9+i*2.4)*10;
      const w=R.W*0.5,sx=((R.t*(140+i*70)+i*500)%(R.W+w*2))-w;
      cx.fillStyle=SAND_WALL(cx);
      cx.save();cx.translate(sx,y);cx.scale(w/200,(30+i*10)*R.S/20);cx.fillRect(-200,-20,400,40);cx.restore();
    }
    cx.globalAlpha=1;
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

/* ================= V2 weather realism additions ================= */
/* snow accumulation: builds while it snows, melts quickly once it stops */
WS.snowAcc=0;
WS.tickAcc=function(dt){
  WS.snowAcc=R.clamp(WS.snowAcc+(R.wx.snow>.3?dt*.09*R.wx.snow:-dt*.35),0,1);
};
WS.drawSnowAcc=function(){
  if(WS.snowAcc<.01)return;
  const cx=R.cx,W=R.W,gy=R.gy,h=(.2+WS.snowAcc)*R.H*.03;
  const g=cx.createLinearGradient(0,gy-h,0,gy+h*1.6);
  g.addColorStop(0,'rgba(240,246,255,.95)');g.addColorStop(.5,'rgba(205,220,245,.75)');g.addColorStop(1,'rgba(180,200,235,0)');
  cx.fillStyle=g;cx.beginPath();cx.moveTo(-80,gy+h*1.6);
  for(let x=-80;x<=W+80;x+=24)cx.lineTo(x,gy-h*(.6+.4*Math.sin(x*.021)*Math.sin(x*.007+1)));
  cx.lineTo(W+80,gy+h*1.6);cx.closePath();cx.globalAlpha=Math.min(1,WS.snowAcc*1.4);cx.fill();cx.globalAlpha=1;
};
/* layered volumetric fog banks drifting with the wind (one cached texture) */
let fogTex=null;
const fogT=()=>{
  if(fogTex)return fogTex;
  const c=document.createElement('canvas');c.width=1024;c.height=200;const g=c.getContext('2d');
  for(let i=0;i<90;i++){const x=Math.random()*1024,y=100+(Math.random()-.5)*90,r=R.rnd(40,110);
    for(const o of[-1024,0,1024]){const rg=g.createRadialGradient(x+o,y,0,x+o,y,r);
      rg.addColorStop(0,'rgba(200,208,228,.16)');rg.addColorStop(1,'rgba(200,208,228,0)');g.fillStyle=rg;g.fillRect(x+o-r,y-r,r*2,r*2)}}
  return fogTex=c;
};
WS.drawFogBanks=function(front){
  /* only where it reads as fog (fog/mist/snow); rain has the project's own haze — saves 7 large fills in storms */
  const wx=R.wx,f=Math.max(wx.fog,wx.snow*.3);if(f<.3||(R.Q<1&&!front&&f<.6))return;
  const cx=R.cx,W=R.W,H=R.H,gy=R.gy,Tx=fogT();
  const L=front?[[gy+H*.06,H*.22,26,.35]]:[[gy*.6,H*.22,6,.45],[gy*.82,H*.26,11,.6],[gy*.98,H*.2,18,.75]];
  for(const b of L){
    const w=W*1.6,ox=-((R.t*b[2]*(1+wx.wind*1.5)+(R.px-W/2)*.04*b[2]/10)%w+w)%w;
    cx.globalAlpha=Math.min(1,f*b[3]*(front?.7:1));
    cx.drawImage(Tx,ox,b[0]-b[1]/2,w,b[1]);cx.drawImage(Tx,ox+w,b[0]-b[1]/2,w,b[1]);
  }
  cx.globalAlpha=1;
};
/* heat haze: shimmer the horizon band (Heatwave / Sunlit sand, Canyon, Dubai, Judean Desert) */
const RC=document.createElement('canvas'),RCX=RC.getContext('2d');
WS.heatLevel=function(){
  const L=R.LOC[R.locI],wx=R.wx;
  const base=Math.max(wx.heat||0,(L.ground==='sand'||L.sky==='canyon'||L.sky==='mesa')?wx.sun*.7:0);
  return base*(1-Math.min(1,wx.rain))*(1-Math.min(1,wx.snow));
};
WS.drawHeatHaze=function(){
  if(R.Q<1)return;
  const s=WS.heatLevel();if(s<.15)return;
  const cx=R.cx,cv=R.cv,d=R.d,gy=R.gy,H=R.H;
  cx.save();cx.setTransform(1,0,0,1,0,0);
  const y0=Math.max(0,((gy-H*.2)*d)|0),y1=(gy*d)|0,st=Math.max(3,4*d|0);
  if(y1-y0<4){cx.restore();return}
  if(RC.width!==cv.width||RC.height!==y1-y0){RC.width=cv.width;RC.height=Math.max(1,y1-y0)}
  RCX.clearRect(0,0,RC.width,RC.height);
  RCX.drawImage(cv,0,y0,cv.width,y1-y0,0,0,cv.width,y1-y0);
  for(let y=y0;y<y1;y+=st){const k=(y-y0)/(y1-y0),off=Math.sin(R.t*5+y*.09)*s*k*2.6*d;
    cx.drawImage(RC,0,y-y0,cv.width,st,off,y,cv.width,st);}
  /* warm shimmer tint low on the horizon */
  cx.globalAlpha=.10*s;cx.fillStyle='rgb(255,200,140)';cx.fillRect(0,y0+(y1-y0)*.6,cv.width,(y1-y0)*.4);
  cx.restore();
};
})();
