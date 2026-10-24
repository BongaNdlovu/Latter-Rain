/* Rain of the Word — vector (round 10): the cinematic Vector look for the journey.
   · Palette: one tight palette per moment, blended by the time of day — pastel daylight, golden haze, neon-blue night —
     and greyed by rain. Everything (sky, buildings, decor, light) is coloured from it.
   · Backdrop, far → near: painted sky with a big back-light, the place's own skyline + landmarks (env.js/world.js)
     re-coloured as flat atmospheric layers, haze, then a detailed painted midground of buildings (floors, windows,
     scaffolding, rooftop plant) in the place's style, scrolling at 45% of the road.
   · Foreground: pure black silhouettes — the route, rooftops, crane-hung girders, and obstacles drawn as detailed
     silhouettes (fan grilles, slats, ribs) with faint inner detail and a thin back-light rim.
   Loaded after journey.js; active only while a journey run is locked in. */
window.ROW=window.ROW||{};
(function(){
'use strict';
const R=ROW,J=R.journey,G=R.ground;
const V=R.vec={};
V.on=()=>!!(J&&J.locked());
const BLACK='#030305';
const mix=(a,b,t)=>[a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t,a[2]+(b[2]-a[2])*t];
const rgb=(c,al)=>al==null?`rgb(${c[0]|0},${c[1]|0},${c[2]|0})`:`rgba(${c[0]|0},${c[1]|0},${c[2]|0},${al})`;
const clamp=(v,a,b)=>v<a?a:v>b?b:v;

/* ---------- palettes ---------- */
const PAL={
  day:  {top:[96,160,222],hor:[222,236,250],sun:[255,252,242],far:[200,214,238],mid:[226,232,246],sh:[176,188,216],win:[132,178,214],lit:[255,238,196],haze:[226,236,250],acc:[160,110,255]},
  gold: {top:[146,192,224],hor:[252,228,182],sun:[255,244,212],far:[234,212,172],mid:[226,200,154],sh:[184,152,110],win:[166,176,168],lit:[255,212,138],haze:[250,232,194],acc:[170,100,255]},
  night:{top:[4,20,56],hor:[34,100,172],sun:[196,230,255],far:[28,80,148],mid:[22,66,132],sh:[12,42,94],win:[110,206,255],lit:[176,238,255],haze:[38,106,178],acc:[190,120,255]}};
const STORMY={top:[92,100,116],hor:[176,184,196],sun:[226,230,238],far:[150,158,172],mid:[170,176,188],sh:[120,128,144],win:[110,126,146],lit:[255,214,150],haze:[172,180,192],acc:[160,110,255]};
const KEYS=['top','hor','sun','far','mid','sh','win','lit','haze','acc'];
const P={},W3={day:1,gold:0,night:0};
V.pal=function(){
  const t=R._tod||{day:1,night:0};
  let wd=clamp(t.day,0,1),wn=clamp(t.night,0,1),wg=Math.max(0,1-wd-wn);
  const s=wd+wn+wg||1;wd/=s;wn/=s;wg/=s;W3.day=wd;W3.gold=wg;W3.night=wn;
  const wet=clamp(((R.wx&&R.wx.rain)||0)*.6+((R.wx&&R.wx.fog)||0)*.3,0,.55)*(1-wn*.5);
  for(const k of KEYS){
    const a=PAL.day[k],b=PAL.gold[k],c=PAL.night[k];
    let v=[a[0]*wd+b[0]*wg+c[0]*wn,a[1]*wd+b[1]*wg+c[1]*wn,a[2]*wd+b[2]*wg+c[2]*wn];
    if(k!=='lit'&&k!=='acc')v=mix(v,STORMY[k],wet);
    P[k]=v;
  }
  const tint=TINT[styleOf()];
  if(tint)for(const k of['top','hor','far','mid','sh','haze','win']){const v=P[k],tt=tint[wn>.5?1:0];P[k]=[Math.min(255,v[0]*tt[0]),Math.min(255,v[1]*tt[1]),Math.min(255,v[2]*tt[2])]}
  P.wet=wet;P.night=wn;
  return P;
};
V.mood=V.pal;
/* each place's colour character: [day/dusk multiplier, night multiplier] */
const TINT={village:[[1,1.02,.97],[.9,.98,1.05]],canyon:[[1.12,.95,.82],[1,.88,.9]],rio:[[1,1.03,.98],[.95,.95,1.06]],cape:[[1,1,1.02],[.92,.96,1.06]],
  sydney:[[.96,1.01,1.05],[.9,.98,1.08]],dubai:[[1.08,1,.86],[1.02,.92,.95]],rome:[[1.08,1,.9],[1,.9,.92]],pagoda:[[1.04,.98,.96],[1.12,.86,.9]],
  istanbul:[[1.06,1,.92],[1,.9,.98]],cairo:[[1.1,1,.84],[1.02,.92,.92]],athens:[[1,1.01,1.03],[.94,.96,1.06]],venice:[[1.04,1,.95],[.96,.94,1.04]],
  hongkong:[[.98,1,1.02],[1.12,.86,1.12]],prague:[[1.02,.99,.98],[.94,.94,1.06]],bethlehem:[[1.08,1.01,.9],[.98,.94,.96]],chicago:[[.97,1,1.03],[.92,.98,1.08]],
  nazareth:[[1.07,1.02,.9],[.98,.94,.96]],mumbai:[[1.06,1,.92],[1.04,.92,.98]],london:[[.95,.98,1.04],[.9,.95,1.05]],paris:[[1.04,1,.94],[1.05,.92,1.05]],newyork:[[1,1,1],[.95,1,1.08]],
  tokyo:[[1,.96,1.02],[1.18,.85,1.12]],stone:[[1.07,1.0,.88],[1.0,.92,.95]],city:[[.98,1,1.02],[.92,1,1.06]],
  harbour:[[.92,1.02,1.03],[.85,1.02,1.05]],forest:[[.94,1.05,.94],[.85,1.02,.95]],desert:[[1.1,1,.82],[1.05,.9,.9]],alpine:[[.94,1,1.08],[.9,.98,1.1]]};

/* ---------- sky (r13): gradient, sun or moon disc with glare, lit cumulus in two layers, an overcast deck that
   rolls in with cloud and rain and lights up with lightning ---------- */
const skyDraw=R.env.drawSky;
const CL={};
function bucket(){const b=W3.day>=W3.gold&&W3.day>=W3.night?'day':W3.night>=W3.gold?'night':'gold';return b+((P.wet||0)>.25?'w':'')}
function cloudSprite(key,v,p){
  const k=key+v;if(CL[k])return CL[k];
  const w=520,h=230,cv=document.createElement('canvas');cv.width=w;cv.height=h;const g=cv.getContext('2d');
  let sd=77+v*991;const rr=()=>{sd=(sd*16807)%2147483647;return sd/2147483647};
  const lit=mix(p.sun,p.hor,.25),dark=mix(mix(p.sh,p.top,.45),[96,102,116],(p.wet||0)*.6);
  const n=30+v*6;
  for(let i=0;i<n;i++){
    const x=w*(.12+.76*rr()),cxr=1-Math.abs(x/w-.5)*1.6,y=h*(.62-.34*cxr*rr())+rr()*h*.12,r=(26+rr()*58)*(.5+.6*cxr);
    const col=mix(dark,lit,clamp((1-y/h)*1.5-.15+rr()*.15,0,1));
    const gr=g.createRadialGradient(x-r*.2,y-r*.35,r*.08,x,y,r);
    gr.addColorStop(0,rgb(mix(col,lit,.35),.95));gr.addColorStop(.55,rgb(col,.7));gr.addColorStop(1,rgb(col,0));
    g.fillStyle=gr;g.fillRect(x-r,y-r,r*2,r*2);
  }
  g.globalCompositeOperation='destination-out';
  const fb=g.createLinearGradient(0,h*.66,0,h);fb.addColorStop(0,'rgba(0,0,0,0)');fb.addColorStop(1,'rgba(0,0,0,1)');g.fillStyle=fb;g.fillRect(0,0,w,h);
  CL[k]=cv;return cv;
}
function deckSprite(key,p){
  const k='deck'+key;if(CL[k])return CL[k];
  const w=1024,h=380,cv=document.createElement('canvas');cv.width=w;cv.height=h;const g=cv.getContext('2d');
  let sd=4242;const rr=()=>{sd=(sd*16807)%2147483647;return sd/2147483647};
  const base=mix(mix(p.sh,p.top,.35),[64,70,84],.55),lit=mix(base,p.hor,.4),dark=mix(base,[18,20,28],.45);
  g.fillStyle=rgb(base);g.fillRect(0,0,w,h*.45);
  for(let i=0;i<150;i++){
    const x=rr()*w,y=h*(.08+.62*rr()),r=30+rr()*80,col=mix(dark,lit,clamp(1-y/(h*.75)+rr()*.25-.2,0,1));
    for(const ox of[x,x-w,x+w]){const gr=g.createRadialGradient(ox,y,r*.1,ox,y,r);gr.addColorStop(0,rgb(col,.85));gr.addColorStop(1,rgb(col,0));g.fillStyle=gr;g.fillRect(ox-r,y-r,r*2,r*2)}
  }
  g.globalCompositeOperation='destination-out';
  const fb=g.createLinearGradient(0,h*.5,0,h);fb.addColorStop(0,'rgba(0,0,0,0)');fb.addColorStop(1,'rgba(0,0,0,1)');g.fillStyle=fb;g.fillRect(0,0,w,h);
  CL[k]=cv;return cv;
}
V.cover=()=>clamp(((R.wx&&R.wx.cloud)||0)*1.1+((R.wx&&R.wx.rain)||0)*.55+(J.wx?J.wxK*(J.wx.type==='hail'?.7:.35):0),0,1);
R.env.drawSky=function(){
  if(!V.on())return skyDraw.apply(this,arguments);
  const cx=R.cx,W=R.W,H=R.H,p=V.pal(),gy=R.gy,S=R.S,key=bucket(),cover=V.cover();
  const g=cx.createLinearGradient(0,-80,0,gy);
  g.addColorStop(0,rgb(p.top));g.addColorStop(.62,rgb(mix(p.top,p.hor,.7)));g.addColorStop(1,rgb(p.hor));
  cx.fillStyle=g;cx.fillRect(-120,-120,W+240,H+240);
  const sx=W*.6,sy=gy*.5,rr=Math.max(W,H)*.75;
  const sg=cx.createRadialGradient(sx,sy,0,sx,sy,rr);
  sg.addColorStop(0,rgb(p.sun,.8*(1-.6*cover)));sg.addColorStop(.1,rgb(p.sun,.38*(1-.6*cover)));sg.addColorStop(.45,rgb(p.hor,.12));sg.addColorStop(1,rgb(p.hor,0));
  cx.fillStyle=sg;cx.fillRect(-120,-120,W+240,H+240);
  if(p.night>.3){cx.fillStyle=rgb([230,240,255],.5*p.night*(1-cover));for(let i=0;i<70;i++){const x=(i*163.7)%W,y=((i*97.1)%(gy*.55));cx.fillRect(x,y,1.3,1.3)}}
  /* the disc itself */
  if(cover<.95){
    cx.save();cx.globalAlpha=1-cover;
    if(p.night>.5){
      const r=22*S;cx.fillStyle='rgb(232,238,250)';cx.beginPath();cx.arc(sx,sy,r,0,6.283);cx.fill();
      cx.fillStyle='rgba(160,170,190,.25)';for(const [a,b,c] of[[-.3,-.2,.25],[.25,.1,.18],[-.05,.35,.14]]){cx.beginPath();cx.arc(sx+a*r,sy+b*r,c*r,0,6.283);cx.fill()}
      const mg=cx.createRadialGradient(sx,sy,r,sx,sy,r*5);mg.addColorStop(0,'rgba(200,220,255,.3)');mg.addColorStop(1,'rgba(200,220,255,0)');cx.fillStyle=mg;cx.fillRect(sx-r*5,sy-r*5,r*10,r*10);
    }else{
      const r=(18+16*W3.gold)*S,dg=cx.createRadialGradient(sx,sy,0,sx,sy,r);
      dg.addColorStop(0,'rgba(255,255,250,1)');dg.addColorStop(.7,rgb(mix(p.sun,[255,255,255],.5),1));dg.addColorStop(1,rgb(p.sun,0));
      cx.fillStyle=dg;cx.beginPath();cx.arc(sx,sy,r,0,6.283);cx.fill();
    }
    cx.restore();
  }
  /* cumulus, two layers, drifting with the wind and the journey */
  const drift=R.t*(4+((R.wx&&R.wx.wind)||0)*22)+(J.dist||0)*S*10;
  for(let layer=0;layer<2;layer++){
    const n=layer?3:5,sc=layer?1.3:.7,y0=gy*(layer?.26:.12),sp=layer?1:.5;
    cx.globalAlpha=(layer?.92:.6)*(1-cover*.7);
    for(let i=0;i<n;i++){
      const cw=520*S*sc,ch=230*S*sc,span=W+cw*2,x=((i*span/n-drift*sp)%span+span)%span-cw,y=y0+((i*53)%46)*S;
      cx.drawImage(cloudSprite(key,(i+layer)%3,p),x,y,cw,ch);
    }
  }
  cx.globalAlpha=1;
  /* overcast deck */
  if(cover>.05){
    const d=deckSprite(key,p),dw=W*1.5,dh=gy*.66,o=(drift*.4)%dw;
    cx.globalAlpha=cover;for(const k of[0,1,2])cx.drawImage(d,-o+k*dw-dw*.25,-24*S,dw,dh);
    if(R.flash>.05){cx.globalCompositeOperation='lighter';cx.globalAlpha=Math.min(1,R.flash)*.55*cover;for(const k of[0,1,2])cx.drawImage(d,-o+k*dw-dw*.25,-24*S,dw,dh);cx.globalCompositeOperation='source-over'}
    cx.globalAlpha=1;
  }
  /* lens ghosts from the sun toward the centre of frame */
  if(cover<.6&&p.night<.5&&R.qLv>=1){
    cx.save();cx.globalCompositeOperation='screen';
    const vx=W/2-sx,vy=H/2-sy;
    for(const [f,r,a] of[[.4,18,.08],[.75,34,.05],[1.25,12,.08],[1.6,52,.04]]){
      const px=sx+vx*f,py=sy+vy*f,rg2=cx.createRadialGradient(px,py,0,px,py,r*S);rg2.addColorStop(0,rgb(p.sun,a*(1-cover)));rg2.addColorStop(1,rgb(p.sun,0));
      cx.fillStyle=rg2;cx.fillRect(px-r*S,py-r*S,r*2*S,r*2*S);
    }
    cx.restore();
  }
};

/* ---------- backdrop: recoloured skyline layers + painted midground ---------- */
let scr=null,sx=null;
function tintLayer(cx,img,ox,w,h,cTop,cBot,yTop){
  const tc=cx.canvas;
  if(!scr){scr=document.createElement('canvas');sx=scr.getContext('2d')}
  if(scr.width!==tc.width||scr.height!==tc.height){scr.width=tc.width;scr.height=tc.height}
  sx.setTransform(1,0,0,1,0,0);sx.globalCompositeOperation='source-over';sx.clearRect(0,0,scr.width,scr.height);
  sx.setTransform(cx.getTransform());
  sx.drawImage(img,ox,0,w,h);
  sx.globalCompositeOperation='source-in';
  const g=sx.createLinearGradient(0,yTop,0,h);g.addColorStop(0,cTop);g.addColorStop(1,cBot);
  sx.fillStyle=g;sx.fillRect(-300,-300,R.W+600,R.H+600);
  cx.save();cx.setTransform(1,0,0,1,0,0);cx.drawImage(scr,0,0);cx.restore();
}
const cityDraw=R.env.drawCity;
R.env.drawCity=function(){
  if(!V.on())return cityDraw.apply(this,arguments);
  R.lightsS.length=0;
  const cx=R.cx,W=R.W,H=R.H,gy=R.gy,p=V.pal(),sd=Math.min(2,R.d);
  /* the place's skyline and landmarks as flat layers, lighter with distance */
  const depth=[.38,.58,.78],deep=mix(p.far,p.sh,.55);
  R.layers.forEach((La,i)=>{
    const w=La.c.width/sd,ox=R.env.lox?R.env.lox(La,i):-(w-W)/2;
    const c=mix(p.hor,deep,depth[i]||.6);
    tintLayer(cx,La.c,ox,w,gy+8,rgb(mix(c,p.sun,.08)),rgb(mix(c,p.haze,.45)),gy*.2);
  });
  /* haze between the skyline and the midground */
  const hg=cx.createLinearGradient(0,gy*.35,0,gy);hg.addColorStop(0,rgb(p.haze,0));hg.addColorStop(1,rgb(p.haze,.38));
  cx.fillStyle=hg;cx.fillRect(-80,gy*.35,W+160,gy*.65+4);
  drawLandmark(cx,p);
  drawMid(cx,p);
  drawBirds(cx,p);
  /* a last breath of haze over the midground's feet, and the light shafts */
  const fg=cx.createLinearGradient(0,gy*.55,0,H);fg.addColorStop(0,rgb(p.haze,0));fg.addColorStop(1,rgb(p.haze,.14));
  cx.fillStyle=fg;cx.fillRect(-80,gy*.55,W+160,H-gy*.55+80);
  drawRays(cx,p);
};
/* the time-of-day multiply tint is replaced by the palette during a run */
const todDraw=R.drawTod;R.drawTod=function(){if(V.on())return;return todDraw.apply(this,arguments)};

/* ---------- painted midground (r13): two strips per palette — a far block at 45% of the road speed and a near block
   at 70%, darker and more detailed — blended between palettes, with ground haze between them ---------- */
const STRIP={key:''};
/* ---------- r14 context: every place has a style, and every style a kind of terrain ---------- */
const SKYSTYLE={london:'london',paris:'paris',newyork:'newyork',tokyo:'tokyo',stone:'stone',colonnade:'stone',city:'city',park:'city',
  harbor:'harbour',pagoda:'pagoda',canyon:'canyon',rio:'rio',cape:'cape',sydney:'sydney',dubai:'dubai',rome:'rome',jerusalem:'stone',
  hills:'village',forest:'forest',mesa:'desert',alpine:'alpine'};
function styleOf(){const L=R.LOC[R.locI];return L.style||SKYSTYLE[L.sky]||'city'}
/* nature: rock ledges and ravines · water: piers and open water · city: rooftops, girders, rooms */
const NATURE={village:1,forest:1,desert:1,alpine:1,canyon:1};
V.kind=()=>{const s=styleOf();if(NATURE[s])return 'nature';if(s==='harbour'||s==='venice'||R.LOC[R.locI].ground==='water'&&s!=='london'&&s!=='sydney'&&s!=='mumbai')return 'water';return 'city'};
/* building modifiers per style; `as` names the base facade painter */
const STY={
  rome:{as:'stone',terra:.6,dome:.25},cape:{as:'stone',white:.6,low:1},sydney:{as:'city',glass:.6},dubai:{as:'newyork',glass:.7,sand:.3,tall:1},
  istanbul:{as:'stone',dome:.4,minaret:.35},cairo:{as:'stone',sand:.5,low:1,palm:.3},athens:{as:'stone',white:.7,low:1},
  venice:{as:'paris',terra:.5,low:1},hongkong:{as:'tokyo',glass:.45,tall:1},prague:{as:'paris',terra:.7,spire:.3},
  bethlehem:{as:'stone',low:1,dome:.15},chicago:{as:'newyork'},nazareth:{as:'stone',low:1,dome:.1},mumbai:{as:'stone',dome:.2,palm:.25,low:1}};
function stripFor(name,near){
  const key=R.locI+'|'+R.W+'|'+R.H;
  if(STRIP.key!==key){for(const k in STRIP)if(k!=='key')delete STRIP[k];STRIP.key=key}
  const id=name+(near?'N':'F');
  if(!STRIP[id])STRIP[id]=paintStrip(PAL[name],name==='night',near);
  return STRIP[id];
}
function paintStrip(pal,night,near){
  const W=R.W,H=R.H,gy=R.gy,S=R.S*(near?1.25:1),w=Math.ceil(W*(near?1.7:1.9));
  const y0=Math.floor(near?gy*.36:0),h=Math.ceil(H-y0);
  const c=document.createElement('canvas');c.width=w;c.height=h;const g=c.getContext('2d');g.translate(0,-y0);
  let seed=R.locI*9301+(near?7919:49297);const rr=()=>{seed=(seed*16807)%2147483647;return seed/2147483647};
  const style=styleOf();
  const B={g,S,rr,pal:near?nearPal(pal):pal,night,h:H,gy,near};
  if(NATURE[style])paintNature(B,style,w);
  else if(style==='rio')paintRio(B,w);
  else{
    const st=STY[style]||{},bs=st.as||style;B.st=st;
    let x=-20*S;
    while(x<w){
      const bw=(bs==='harbour'?140+rr()*220:(st.low?70:90)+rr()*(st.low?120:170))*S;
      let top=bs==='harbour'?gy*(.62+rr()*.14):gy*(.18+rr()*.42)+(bs==='newyork'||st.tall?-gy*.12:0);
      if(st.low)top=gy*(.42+rr()*.26);
      if(near)top=gy*(.46+rr()*.3);
      if(style==='pagoda')paintPagoda(B,Math.min(bw,w-x+40*S),x,Math.max(gy*.04,top));
      else paintBuilding(B,bs,Math.min(bw,w-x+40*S),x,Math.max(gy*.04,top));
      if(st.palm&&rr()<st.palm)palmAt(B,x+bw+4*S);
      x+=bw+(rr()<.3?(6+rr()*26)*S:0);
    }
  }
  return {c,w,h,y0};
}
/* the near block is closer: a little darker and less hazed */
function nearPal(p){const o={};for(const k of KEYS)o[k]=p[k];o.mid=mix(p.mid,p.sh,.38);o.far=mix(p.far,p.sh,.3);o.sh=shade(p.sh,.82);return o}
function shade(col,f){return [col[0]*f,col[1]*f,col[2]*f]}
function paintBuilding(B,style,bw,x,top){
  const {g,S,rr,pal,night,h,gy,near}=B;
  const tone=.92+rr()*.12;
  let base=shade(mix(pal.mid,pal.far,rr()*.35),tone);
  if(style==='london'&&rr()<.6)base=mix(base,[168,96,74],night?.15:.38);
  if(style==='paris')base=mix(base,[236,222,196],night?.1:.35);
  if(style==='stone')base=mix(base,[226,198,150],night?.1:.4);
  const st=B.st||{};
  if(st.white)base=mix(base,[240,236,226],night?.12:st.white);
  if(st.sand)base=mix(base,[222,190,140],night?.1:st.sand);
  const glass=st.glass!=null?rr()<st.glass:(style==='newyork'||style==='city'||style==='tokyo')&&rr()<.35;
  const scaffold=(style==='city'||style==='london'||style==='newyork')&&!glass&&rr()<.28;
  const escape=(style==='newyork'||style==='city'||style==='london')&&!glass&&!scaffold&&rr()<.4;
  if(glass)base=mix(base,pal.win,.45);
  const shadeW=bw*.16,fh=(20+rr()*10)*S;
  /* body, shaded side, cornice, back-light rim on the edge facing the light */
  g.fillStyle=rgb(base);g.fillRect(x,top,bw,h-top);
  g.fillStyle=rgb(mix(base,pal.sh,.55));g.fillRect(x+bw-shadeW,top,shadeW,h-top);
  g.fillStyle=rgb(mix(base,pal.sun,.4));g.fillRect(x-2*S,top-3*S,bw+4*S,4*S);
  g.fillStyle=rgb(mix(base,pal.sun,.55),.7);g.fillRect(x,top,1.6*S,h-top);
  /* glass reflects the sky: one gradient per building */
  const sky=g.createLinearGradient(0,top,0,gy);sky.addColorStop(0,rgb(mix(pal.top,pal.sun,.25)));sky.addColorStop(.6,rgb(pal.win));sky.addColorStop(1,rgb(mix(pal.win,pal.sh,.4)));
  const ww=(glass?bw/Math.max(3,Math.round(bw/(26*S))):(10+rr()*6)*S),gap=glass?0:(7+rr()*6)*S;
  for(let y=top+fh*.6,f=0;y<h;y+=fh,f++){
    g.fillStyle=rgb(shade(base,.9));g.fillRect(x,y+fh*.78,bw,2*S);
    if(glass){
      for(let k=0;k*ww<bw-shadeW;k++){const lit=night&&rr()<.35;g.fillStyle=lit?rgb(pal.lit,.9):sky;g.globalAlpha=lit?1:.7;g.fillRect(x+k*ww+1.5*S,y,ww-3*S,fh*.72);g.globalAlpha=1}
      continue;
    }
    for(let wx=x+gap;wx+ww<x+bw-shadeW*.4;wx+=ww+gap){
      const lit=night?rr()<.42:rr()<.06,wy=y+fh*.12,wh=fh*.55;
      g.fillStyle=lit?rgb(pal.lit,night?.95:.6):sky;
      if(style==='stone'&&rr()<.6){g.beginPath();g.moveTo(wx,wy+wh);g.lineTo(wx,wy+ww*.5);g.arc(wx+ww/2,wy+ww*.5,ww/2,Math.PI,0);g.lineTo(wx+ww,wy+wh);g.closePath();g.fill()}
      else g.fillRect(wx,wy,ww,wh);
      if(!lit&&rr()<.25){g.fillStyle=rgb(mix(base,pal.sun,.35),.55);g.fillRect(wx,wy,ww*.35,wh)}                 /* drawn curtain */
      g.fillStyle=rgb(pal.sun,lit?.25:.2);g.fillRect(wx,wy,ww,1.4*S);
      if(style==='london'||style==='paris'){g.fillStyle=rgb(mix(base,pal.sun,.5));g.fillRect(wx+ww/2-.7*S,wy,1.4*S,wh)}
      if(style==='paris'&&f%2===0){g.fillStyle=rgb(shade(base,.55));g.fillRect(wx-2*S,wy+wh-1*S,ww+4*S,1.6*S)}
      if((style==='newyork'||style==='city'||style==='tokyo')&&rr()<.06){g.fillStyle=rgb(mix(base,pal.sh,.6));g.fillRect(wx+ww*.15,wy+wh,ww*.7,5*S)}   /* window AC */
    }
  }
  /* ambient occlusion: darker toward the street, a touch of light at the crown */
  const ao=g.createLinearGradient(0,top,0,h);ao.addColorStop(0,'rgba(255,255,255,.05)');ao.addColorStop(.6,'rgba(0,0,0,0)');ao.addColorStop(1,`rgba(0,0,0,${near?.32:.2})`);
  g.fillStyle=ao;g.fillRect(x,top,bw,h-top);
  /* fire escape: landings and stair runs zig-zagging down the facade */
  if(escape){
    const ex=x+bw*(.18+rr()*.3),ew=bw*.32,ec=rgb(shade(mix(base,pal.sh,.7),.75));
    g.strokeStyle=ec;g.fillStyle=ec;g.lineWidth=1.2*S;
    for(let y=top+fh*1.4,k=0;y<h-fh;y+=fh,k++){
      g.fillRect(ex,y,ew,1.8*S);
      g.beginPath();for(let r=0;r<=6;r++){g.moveTo(ex+ew*r/6,y);g.lineTo(ex+ew*r/6,y-fh*.3)}g.moveTo(ex,y-fh*.3);g.lineTo(ex+ew,y-fh*.3);g.stroke();
      g.beginPath();if(k%2){g.moveTo(ex+2*S,y);g.lineTo(ex+ew*.6,y+fh)}else{g.moveTo(ex+ew-2*S,y);g.lineTo(ex+ew*.4,y+fh)}g.stroke();
    }
  }
  /* roof crowns and plant */
  const plant=rgb(mix(base,pal.sh,.75));
  g.fillStyle=plant;
  if(style==='paris'){g.fillStyle=rgb(mix(pal.sh,pal.top,.35));g.beginPath();g.moveTo(x-2*S,top);g.lineTo(x+10*S,top-26*S);g.lineTo(x+bw-10*S,top-26*S);g.lineTo(x+bw+2*S,top);g.closePath();g.fill();
    g.fillStyle=rgb(mix(base,pal.sun,.2));for(let dx=x+16*S;dx<x+bw-24*S;dx+=34*S){g.fillRect(dx,top-20*S,10*S,14*S)}}
  else if(style==='london'){for(let k=0;k<2;k++){const cxp=x+bw*(.2+k*.55);g.fillRect(cxp,top-22*S,18*S,22*S);g.fillRect(cxp+2*S,top-30*S,5*S,8*S);g.fillRect(cxp+10*S,top-28*S,5*S,6*S)}}
  else if(style==='stone'&&rr()<.5){g.beginPath();g.arc(x+bw/2,top,bw*.22,Math.PI,0);g.fill();g.fillRect(x+bw/2-1.5*S,top-bw*.22-14*S,3*S,14*S)}
  else{
    if(rr()<.55){const ax=x+bw*(.15+rr()*.3);g.fillRect(ax,top-18*S,30*S,18*S);g.fillStyle=rgb(mix(base,pal.sh,.4));g.beginPath();g.arc(ax+10*S,top-9*S,6*S,0,6.283);g.fill();g.fillStyle=plant}
    if(rr()<.45||style==='newyork'){const tx=x+bw*(.55+rr()*.3);g.fillRect(tx,top-46*S,26*S,30*S);g.beginPath();g.moveTo(tx-2*S,top-46*S);g.lineTo(tx+13*S,top-58*S);g.lineTo(tx+28*S,top-46*S);g.fill();
      for(const lx of[3,12,21])g.fillRect(tx+lx*S,top-16*S,2*S,16*S)}
    if(rr()<.4){const ah=(50+rr()*40)*S;g.fillRect(x+bw*rr(),top-ah,2*S,ah)}
    if(rr()<.35){g.fillRect(x+4*S,top-12*S,bw*.5,2*S);for(let k=0;k<6;k++)g.fillRect(x+4*S+k*bw*.1,top-12*S,1.6*S,12*S)}
    if((style==='city'||style==='newyork')&&rr()<.25){
      /* a rooftop billboard on its frame */
      const bx=x+bw*.2,bwid=bw*.6,bh=bwid*.32;
      g.fillStyle=plant;g.fillRect(bx+bwid*.15,top-14*S,2.5*S,14*S);g.fillRect(bx+bwid*.85,top-14*S,2.5*S,14*S);
      g.fillStyle=night?rgb(mix(pal.lit,[255,120,200],rr()*.6)):rgb(mix(base,pal.sun,.45));g.fillRect(bx,top-14*S-bh,bwid,bh);
      g.fillStyle=rgb(shade(base,.6),.6);for(let k=0;k<3;k++)g.fillRect(bx+bwid*.1,top-14*S-bh+bh*(.25+k*.22),bwid*(.4+rr()*.4),bh*.1);
    }
  }
  if(st.terra&&rr()<st.terra){g.fillStyle=rgb(night?[70,40,36]:mix([176,92,62],pal.sh,.25));g.beginPath();g.moveTo(x-3*S,top);g.lineTo(x+bw/2,top-bw*.22);g.lineTo(x+bw+3*S,top);g.closePath();g.fill()}
  if(st.dome&&rr()<st.dome){g.fillStyle=rgb(mix(base,pal.sh,.3));g.beginPath();g.arc(x+bw/2,top,bw*.24,Math.PI,0);g.fill();g.fillRect(x+bw/2-1.5*S,top-bw*.24-12*S,3*S,12*S)}
  if(st.minaret&&rr()<st.minaret){const mx=x+bw*(rr()<.5?.12:.88),mh=gy*.32;g.fillStyle=rgb(mix(base,pal.sh,.35));g.fillRect(mx-4*S,top-mh,8*S,mh);g.fillRect(mx-6*S,top-mh*.7,12*S,3*S);g.beginPath();g.moveTo(mx-5*S,top-mh);g.lineTo(mx,top-mh-26*S);g.lineTo(mx+5*S,top-mh);g.fill()}
  if(st.spire&&rr()<st.spire){const sx2=x+bw*.5;g.fillStyle=rgb(mix(base,pal.sh,.5));g.beginPath();g.moveTo(sx2-10*S,top);g.lineTo(sx2,top-gy*.22);g.lineTo(sx2+10*S,top);g.fill()}
  if(style==='tokyo'){
    const n=1+(rr()*2|0);
    for(let k=0;k<n;k++){const sxp=x+bw*(.1+rr()*.7),sy=top+fh*(1+rr()*3),sh=fh*(3+rr()*3);
      const hue=[[255,90,170],[90,220,255],[255,200,90]][rr()*3|0];
      g.fillStyle=rgb(night?hue:mix(hue,base,.55),night?.95:.9);g.fillRect(sxp,sy,16*S,sh);
      g.fillStyle=rgb(shade(base,.5));for(let j=0;j<4;j++)g.fillRect(sxp+5*S,sy+6*S+j*sh/4,6*S,sh/6)}
  }
  if(style==='harbour'){
    g.fillStyle=rgb(shade(base,.86));for(let k=x;k<x+bw;k+=6*S)g.fillRect(k,top+4*S,1.4*S,h-top);
    if(rr()<.5){const kx=x+bw*.6;g.fillStyle=rgb(mix(pal.sh,pal.far,.3));g.fillRect(kx,top-140*S,6*S,140*S);g.fillRect(kx-70*S,top-140*S,150*S,5*S);g.fillRect(kx+70*S,top-140*S,2*S,60*S)}
  }
  if(scaffold){
    const sc=rgb(mix(pal.sh,[60,60,70],.35),.9);g.strokeStyle=sc;g.lineWidth=1.3*S;g.beginPath();
    const sx0=x-6*S,sx1=x+bw*.7;
    for(let k=sx0;k<=sx1;k+=22*S){g.moveTo(k,top-6*S);g.lineTo(k,h)}
    for(let y=top+fh*.6;y<h;y+=fh){g.moveTo(sx0,y);g.lineTo(sx1,y)}
    for(let k=sx0,i=0;k<sx1;k+=22*S,i++){const y0=top+fh*.6+(i%3)*fh;g.moveTo(k,y0);g.lineTo(k+22*S,y0+fh)}
    g.stroke();
    g.fillStyle=rgb(night?[60,120,110]:mix(base,[150,190,150],.35),.28);g.fillRect(sx0,top+fh*2,sx1-sx0,fh*3);
  }
}
function palmAt(B,x){
  const {g,S,pal,gy}=B,c=rgb(mix(pal.sh,[40,60,40],.3));
  g.strokeStyle=c;g.fillStyle=c;g.lineWidth=5*S;g.beginPath();g.moveTo(x,gy);g.quadraticCurveTo(x+14*S,gy-50*S,x+6*S,gy-100*S);g.stroke();
  for(let i=0;i<6;i++){const a=-Math.PI*.95+i*.38;g.lineWidth=3.4*S;g.beginPath();g.moveTo(x+6*S,gy-100*S);g.quadraticCurveTo(x+6*S+Math.cos(a)*26*S,gy-110*S+Math.sin(a)*8*S,x+6*S+Math.cos(a)*48*S,gy-86*S+Math.sin(a)*22*S);g.stroke()}
}
/* Rio: pastel houses climbing a green hillside */
function paintRio(B,w){
  const {g,S,rr,pal,night,h,gy}=B;
  const hill=mix(mix(pal.mid,[90,130,90],night?.1:.35),pal.far,.2);
  const yAt=x=>gy*(.42+.18*Math.sin(x/w*Math.PI*3+1))+gy*.1;
  g.fillStyle=rgb(hill);g.beginPath();g.moveTo(0,h);for(let x=0;x<=w;x+=8*S)g.lineTo(x,yAt(x));g.lineTo(w,h);g.closePath();g.fill();
  const cols=[[226,120,90],[240,200,110],[120,170,210],[150,200,140],[230,160,180],[240,236,226]];
  for(let x=0;x<w;x+=(22+rr()*20)*S){
    const y0=yAt(x);
    for(let y=y0+8*S;y<h;y+=(20+rr()*8)*S){
      const c=mix(cols[rr()*cols.length|0],pal.sh,night?.6:.22),hw=(18+rr()*16)*S,hh=(16+rr()*8)*S,xx=x+rr()*6*S;
      g.fillStyle=rgb(c);g.fillRect(xx,y,hw,hh);g.fillStyle=rgb(shade(c,.75));g.fillRect(xx,y,hw,2*S);
      g.fillStyle=night&&rr()<.45?rgb(pal.lit,.9):rgb(shade(c,.55));g.fillRect(xx+hw*.35,y+hh*.35,4*S,5*S);
    }
  }
}
/* pagodas: tiered, upswept roofs, lanterns at night */
function paintPagoda(B,bw,x,top){
  const {g,S,rr,pal,night,h}=B;
  const base=mix(pal.mid,[150,70,60],night?.1:.3),roof=mix(pal.sh,[40,36,40],.4);
  g.fillStyle=rgb(base);g.fillRect(x+bw*.15,top,bw*.7,h-top);
  g.fillStyle=night?rgb(pal.lit,.75):rgb(shade(base,.6));
  for(let y=top+18*S;y<h;y+=26*S)for(let k=0;k<3;k++)g.fillRect(x+bw*(.25+k*.2),y,6*S,10*S);
  const tiers=2+(rr()*3|0);
  for(let k=0;k<tiers;k++){
    const ty=top+k*Math.min(60*S,(h-top)*.14),tw=bw*(1-k*.08);
    g.fillStyle=rgb(roof);g.beginPath();g.moveTo(x+(bw-tw)/2-12*S,ty+2*S);g.quadraticCurveTo(x+bw/2,ty-16*S,x+(bw+tw)/2+12*S,ty+2*S);g.lineTo(x+(bw+tw)/2,ty+9*S);g.lineTo(x+(bw-tw)/2,ty+9*S);g.closePath();g.fill();
    if(night){g.fillStyle='rgba(255,120,70,.85)';g.beginPath();g.arc(x+bw*.28,ty+20*S,4*S,0,6.283);g.arc(x+bw*.72,ty+20*S,4*S,0,6.283);g.fill()}
  }
  g.fillStyle=rgb(roof);g.fillRect(x+bw/2-1.5*S,top-30*S,3*S,30*S);
}
function paintNature(B,style,w){
  const {g,S,rr,pal,night,h,gy,near}=B;
  const green=style==='forest'||style==='village',sandy=style==='desert'||style==='canyon',canyon=style==='canyon';
  for(let layer=near?1:0;layer<2;layer++){
    const tint=style==='village'?[150,160,110]:green?[96,140,96]:canyon?[200,110,70]:sandy?[220,186,130]:[236,244,252];
    const col=mix(mix(pal.mid,tint,night?.12:.42),pal.far,layer?0:.35);
    const base=gy*(layer?.7:.56)+(near?gy*.08:0),amp=gy*(layer?.08:.12)*(canyon?1.6:1),ph=rr()*6;
    const yAt=canyon
      ?x=>base-amp*(Math.sin(x/w*Math.PI*5+ph)>0?1:.35)          /* flat-topped mesas with sheer sides */
      :x=>base-amp*(.55+.45*Math.sin(x/w*Math.PI*6+ph))*(.7+.3*Math.sin(x/w*Math.PI*14+ph*2));
    g.fillStyle=rgb(col);g.beginPath();g.moveTo(0,h);for(let x=0;x<=w;x+=canyon?3*S:6*S)g.lineTo(x,yAt(x));g.lineTo(w,h);g.closePath();g.fill();
    if(canyon){g.fillStyle=rgb(shade(col,.85),.6);for(let y=base-amp;y<h;y+=14*S)g.fillRect(0,y,w,2*S)}      /* rock strata */
    const tc=rgb(mix(col,pal.sh,.45));g.fillStyle=tc;
    for(let x=0;x<w;x+=(layer?18:30)*S*(.6+rr())){
      const y=yAt(x);
      if(style==='village'){
        const r=rr();
        if(r<.45){const rad=(7+rr()*7)*S*(layer?1.3:1);g.fillRect(x-1*S,y-rad,2.4*S,rad);g.beginPath();g.arc(x,y-rad*1.4,rad,0,6.283);g.fill()}     /* olive trees */
        else if(r<.62){const hw=(22+rr()*20)*S,hh=(16+rr()*10)*S;g.fillStyle=rgb(mix(col,[226,214,190],night?.1:.55));g.fillRect(x,y-hh,hw,hh+3);
          g.fillStyle=night?rgb(pal.lit,.9):rgb(shade(col,.55));g.fillRect(x+hw*.3,y-hh*.6,4*S,6*S);g.fillStyle=tc}                            /* flat-roofed stone houses */
        else if(r<.7){g.fillRect(x,y-54*S,3*S,54*S);for(let k=0;k<6;k++){g.beginPath();g.ellipse(x+1.5*S,y-54*S,20*S,4*S,-1+k*.4,0,6.283);g.fill()}}
      }else if(green||style==='alpine'){const th=(layer?60:36)*S*(.7+rr()*.6);
        g.beginPath();g.moveTo(x-th*.28,y+2);g.lineTo(x,y-th);g.lineTo(x+th*.28,y+2);g.fill();
        if(style==='alpine'){g.fillStyle=rgb(mix(pal.sun,[255,255,255],.5),.7);g.beginPath();g.moveTo(x-th*.09,y-th*.66);g.lineTo(x,y-th);g.lineTo(x+th*.09,y-th*.66);g.fill();g.fillStyle=tc}}
      else if(canyon){if(rr()<.2){g.fillRect(x,y-26*S,5*S,26*S);g.fillRect(x-8*S,y-18*S,8*S,4*S);g.fillRect(x+5*S,y-22*S,7*S,4*S)}}   /* saguaro */
      else if(rr()<.3){g.fillRect(x,y-58*S,3*S,58*S);for(let k=0;k<6;k++){g.beginPath();g.ellipse(x+1.5*S,y-58*S,22*S,4*S,-1+k*.4,0,6.283);g.fill()}}
      else if(rr()<.25){const hw=(30+rr()*40)*S,hh=(22+rr()*16)*S;g.fillRect(x,y-hh,hw,hh+4);g.fillStyle=rgb(mix(col,pal.lit,night?.8:.1));g.fillRect(x+hw*.3,y-hh*.6,5*S,7*S);g.fillStyle=tc}
    }
  }
  if(style==='village'){
    /* the lake: open water with fishing boats, right behind the shore path */
    const ly=gy*(near?.86:.8),lc=mix(mix(pal.haze,[60,110,140],.45),pal.sh,night?.4:0);
    const lg=g.createLinearGradient(0,ly,0,h);lg.addColorStop(0,rgb(mix(lc,pal.sun,.25)));lg.addColorStop(1,rgb(shade(lc,.7)));
    g.fillStyle=lg;g.fillRect(0,ly,w,h-ly);
    g.fillStyle=rgb(mix(lc,pal.sun,.6),.5);for(let k=0;k<160;k++)g.fillRect(rr()*w,ly+rr()*(gy-ly),(6+rr()*20)*S,1.2*S);
    const bc=rgb(mix(pal.sh,[30,26,24],.5));g.fillStyle=bc;g.strokeStyle=bc;g.lineWidth=1.4*S;
    for(let k=0;k<5;k++){const bx=rr()*w,by=ly+(gy-ly)*(.2+rr()*.5),bl=(30+rr()*24)*S*(near?1.4:1);
      g.beginPath();g.moveTo(bx,by);g.lineTo(bx+bl,by);g.lineTo(bx+bl*.85,by+bl*.16);g.lineTo(bx+bl*.12,by+bl*.16);g.closePath();g.fill();
      g.beginPath();g.moveTo(bx+bl*.45,by);g.lineTo(bx+bl*.45,by-bl*.9);g.stroke();
      g.globalAlpha=.75;g.beginPath();g.moveTo(bx+bl*.45,by-bl*.85);g.lineTo(bx+bl*.95,by-bl*.12);g.lineTo(bx+bl*.45,by-bl*.12);g.closePath();g.fill();g.globalAlpha=1}
  }
}
function drawMid(cx,p){
  const order=[['day',W3.day],['gold',W3.gold],['night',W3.night]].sort((a,b)=>b[1]-a[1]);
  const d=(J.dist||0)*100*R.S;
  const blit=(st,off,a)=>{const o=off%st.w;cx.globalAlpha=a;for(const k of[0,1]){const x=-o+k*st.w;if(x>R.W||x+st.w<0)continue;cx.drawImage(st.c,x,st.y0,st.w,st.h)}cx.globalAlpha=1};
  const layer=(near,speed)=>{
    blit(stripFor(order[0][0],near),d*speed,1);
    if(order[1][1]>.08)blit(stripFor(order[1][0],near),d*speed,order[1][1]/(order[0][1]+order[1][1]));
  };
  layer(false,.45);
  /* haze between the two blocks, thicker at street level */
  const hz=cx.createLinearGradient(0,R.gy*.4,0,R.gy);hz.addColorStop(0,rgb(p.haze,0));hz.addColorStop(1,rgb(p.haze,.32+p.wet*.25));
  cx.fillStyle=hz;cx.fillRect(-80,R.gy*.4,R.W+160,R.gy*.6+4);
  if(R.qLv>=1)layer(true,.7);
  if(p.wet>.05){cx.fillStyle=rgb(p.haze,p.wet*.35);cx.fillRect(-80,0,R.W+160,R.H)}
  /* low ground mist at the foot of the near block */
  const gm=cx.createLinearGradient(0,R.gy-60*R.S,0,R.gy);gm.addColorStop(0,rgb(p.haze,0));gm.addColorStop(1,rgb(p.haze,.3+.2*p.wet));
  cx.fillStyle=gm;cx.fillRect(-80,R.gy-60*R.S,R.W+160,60*R.S+4);
}
/* volumetric shafts of light from the back-light */
function drawRays(cx,p){
  if(R.qLv<1)return;
  const W=R.W,gy=R.gy,ox=W*.6,oy=gy*.5,a=.16*(1-p.night*.6)*(1-p.wet);
  if(a<.01)return;
  cx.save();cx.globalCompositeOperation='screen';
  for(let i=0;i<6;i++){
    const ang=1.25+i*.24+Math.sin(R.t*.05+i*1.7)*.025,len=R.H*1.3,sp=.03+.018*((i*37)%3);
    const ex=ox+Math.cos(ang)*len,ey=oy+Math.sin(ang)*len;
    const g=cx.createLinearGradient(ox,oy,ex,ey);g.addColorStop(0,rgb(p.sun,a*(.6+.4*Math.sin(R.t*.25+i))));g.addColorStop(1,rgb(p.sun,0));
    cx.fillStyle=g;cx.beginPath();cx.moveTo(ox,oy);
    cx.lineTo(ox+Math.cos(ang-sp)*len,oy+Math.sin(ang-sp)*len);cx.lineTo(ox+Math.cos(ang+sp)*len,oy+Math.sin(ang+sp)*len);cx.closePath();cx.fill();
  }
  cx.restore();
}

/* ---------- weather (r13): during a run the rain module's simulation is kept but drawn here — rain in three depths
   that takes the scene's colour, light catching the near drops, splashes on every surface, mist banks drifting at
   three depths, rain curtains in a downpour, soft snow with depth of field, hail and blowing sand ---------- */
const rainBack=R.rain.drawBack,rainFront=R.rain.drawFront;
function surfAt(x){
  let h=0;
  for(const o of G.obs){const L=o.x-o.w/2,Rr=o.x+o.w/2;if(x<L||x>Rr)continue;
    if(o.type==='gap'||o.type==='fissure'||o.type==='room')return null;
    if(o.type==='roof'||o.type==='deck')h=Math.max(h,o.h)}
  return h;
}
let flk=null;
function flake(){if(flk)return flk;const c=document.createElement('canvas');c.width=c.height=32;const g=c.getContext('2d');
  const r=g.createRadialGradient(16,16,0,16,16,16);r.addColorStop(0,'rgba(255,255,255,1)');r.addColorStop(.35,'rgba(244,248,255,.75)');r.addColorStop(1,'rgba(244,248,255,0)');
  g.fillStyle=r;g.fillRect(0,0,32,32);return flk=c}
const spl=[];
R.rain.drawBack=function(){
  if(!V.on())return rainBack.apply(this,arguments);
  const cx=R.cx,wx=R.wx,p=V.pal(),W=R.W,gy=R.gy,S=R.S;
  /* mist banks at three depths, drifting with the wind and the journey */
  const fog=clamp((wx.fog||0)*1.4+(wx.rain||0)*.22+(J.wx&&J.wx.type==='fog'?J.wxK*.6:0),0,1);
  if(fog>.03){
    for(let d=0;d<3;d++){
      const y=gy*(.5+d*.14),hh=gy*(.1+d*.05),a=fog*(.14+d*.06),span=W*1.6,off=((R.t*(5+d*6)+(J.dist||0)*S*(6+d*12))%span+span)%span;
      for(let k=0;k<3;k++){
        const x=-off+k*span*.5,cxp=x+W*.4,mg=cx.createRadialGradient(cxp,y,0,cxp,y,W*.42);
        mg.addColorStop(0,rgb(mix(p.haze,[255,255,255],.15),a));mg.addColorStop(1,rgb(p.haze,0));
        cx.save();cx.translate(cxp,y);cx.scale(1,hh/(W*.42));cx.translate(-cxp,-y);cx.fillStyle=mg;cx.fillRect(cxp-W*.42,y-W*.42,W*.84,W*.84);cx.restore();
      }
    }
  }
  /* far and mid rain */
  const n=Math.floor(R.drops.length*Math.min(1,wx.rain/1.3)*R.Q),sl=.12+(wx.wind||0)*.18;
  if(n>0){
    cx.lineCap='round';
    for(const pass of[0,1]){
      cx.beginPath();
      for(let i=0;i<n;i++){const dr=R.drops[i],s=dr.z<.33?0:dr.z<.66?1:2;if(s!==pass)continue;const l=dr.l*(.55+dr.z);cx.moveTo(dr.x,dr.y);cx.lineTo(dr.x-l*sl,dr.y+l)}
      cx.strokeStyle=rgb(mix(p.haze,[255,255,255],pass?.45:.25),pass?.22:.14);cx.lineWidth=(pass?1.2:.85)*Math.max(.8,S);cx.stroke();
    }
  }
  /* a downpour hangs in curtains over the city */
  if(wx.rain>.55){
    const a=clamp((wx.rain-.55)*2,0,1)*.16;
    for(let k=0;k<4;k++){
      const x=((k*W*.37-R.t*24)%(W*1.3)+W*1.3)%(W*1.3)-W*.15,cg=cx.createLinearGradient(0,gy*.15,0,gy);
      cg.addColorStop(0,rgb(mix(p.sh,p.haze,.5),0));cg.addColorStop(1,rgb(mix(p.sh,p.haze,.5),a));
      cx.fillStyle=cg;cx.beginPath();cx.moveTo(x,gy*.15);cx.lineTo(x+W*.16,gy*.15);cx.lineTo(x+W*.12,gy);cx.lineTo(x-W*.04,gy);cx.closePath();cx.fill();
    }
  }
  /* far snow */
  if(wx.snow>.02){
    const n2=Math.floor(R.flakes.length*Math.min(1,wx.snow)*R.Q);
    for(let i=0;i<n2;i++){const f=R.flakes[i];if(f.z>.55)continue;cx.globalAlpha=(.25+f.z*.5)*Math.min(1,wx.snow*1.3);const sz=f.r*S*(1+f.z*1.6)*2.2;cx.drawImage(flake(),f.x-sz/2,f.y-sz/2,sz,sz)}
    cx.globalAlpha=1;
  }
};
R.rain.drawFront=function(){
  if(!V.on())return rainFront.apply(this,arguments);
  const cx=R.cx,wx=R.wx,p=V.pal(),W=R.W,gy=R.gy,S=R.S,dt=R.dt||.016;
  const n=Math.floor(R.drops.length*Math.min(1,wx.rain/1.3)*R.Q),sl=.12+(wx.wind||0)*.18;
  if(n>0){
    /* near rain: longer, thicker, a few streaks catch the light */
    cx.lineCap='round';cx.beginPath();
    for(let i=0;i<n;i++){const dr=R.drops[i];if(dr.z<=.66)continue;const l=dr.l*(.7+dr.z)*1.15;cx.moveTo(dr.x,dr.y);cx.lineTo(dr.x-l*sl,dr.y+l)}
    cx.strokeStyle=rgb(mix(p.haze,[255,255,255],.6),.3);cx.lineWidth=1.7*Math.max(.8,S);cx.stroke();
    cx.save();cx.globalCompositeOperation='lighter';cx.beginPath();
    for(let i=0;i<n;i+=7){const dr=R.drops[i];if(dr.z<=.66)continue;const l=dr.l*(.7+dr.z)*1.15;cx.moveTo(dr.x,dr.y);cx.lineTo(dr.x-l*sl,dr.y+l)}
    cx.strokeStyle=rgb(mix(p.sun,[255,255,255],.4),.28);cx.lineWidth=1.2*Math.max(.8,S);cx.stroke();cx.restore();
    /* splashes on the route, the rooftops and the bridges */
    const k=Math.min(10,wx.rain*R.Q*7);
    for(let i=0;i<k;i++){if(Math.random()>k/10)continue;const x=Math.random()*W,s=surfAt(x);if(s!=null&&spl.length<140)spl.push({x,y:gy-s,t:0,r:.6+Math.random()*.8})}
  }
  if(spl.length){
    cx.save();cx.strokeStyle=rgb(mix(p.haze,[255,255,255],.6),.7);cx.lineWidth=1*Math.max(.8,S);cx.beginPath();
    for(let i=spl.length-1;i>=0;i--){
      const s=spl[i];s.t+=dt;const u=s.t/.2;if(u>=1){spl.splice(i,1);continue}
      const r=(3+7*u)*S*s.r,hh=(1-u)*6*S*s.r;
      cx.moveTo(s.x-r,s.y-hh*.4);cx.lineTo(s.x-r*.5,s.y-hh);cx.moveTo(s.x+r,s.y-hh*.4);cx.lineTo(s.x+r*.5,s.y-hh);cx.moveTo(s.x,s.y-hh*1.2);cx.lineTo(s.x,s.y-hh*.2);
    }
    cx.globalAlpha=1;cx.stroke();cx.restore();
  }
  /* near snow: big soft flakes, the nearest ones out of focus */
  if(wx.snow>.02){
    const n2=Math.floor(R.flakes.length*Math.min(1,wx.snow)*R.Q);
    for(let i=0;i<n2;i++){const f=R.flakes[i];if(f.z<=.55)continue;const near=f.z>.88;cx.globalAlpha=(near?.25:.4+f.z*.5)*Math.min(1,wx.snow*1.3);
      const sz=f.r*S*(2.2+f.z*3.4)*(near?3.2:1.6);cx.drawImage(flake(),f.x-sz/2,f.y-sz/2,sz,sz)}
    cx.globalAlpha=1;
  }
  /* blowing sand */
  if(wx.sand>.03){
    cx.strokeStyle=rgb(mix([196,170,130],p.haze,.3),.25*wx.sand);cx.lineWidth=1;cx.beginPath();
    const n3=Math.floor(R.sands.length*Math.min(1,wx.sand)*R.Q);
    for(let i=0;i<n3;i++){const s2=R.sands[i];cx.moveTo(s2.x,s2.y);cx.lineTo(s2.x-s2.l*(.4+s2.z),s2.y+2)}
    cx.stroke();
  }
  /* hail: white stones with a short motion trail */
  if(wx.hail>.06){
    for(const hs of R.hail){
      cx.strokeStyle='rgba(225,236,255,.35)';cx.lineWidth=1;cx.beginPath();cx.moveTo(hs.x,hs.y);cx.lineTo(hs.x-hs.vx*.025,hs.y-hs.vy*.025);cx.stroke();
      cx.fillStyle='rgba(240,247,255,.9)';cx.beginPath();cx.arc(hs.x,hs.y,(1.4+hs.z*1.8)*S,0,6.283);cx.fill();
    }
  }
  R.fx.drawSplashes();
};

/* ---------- the route: solid black; gaps reveal the painted city below ---------- */
const groundDraw=G.draw;
G.draw=function(){
  if(!V.on())return groundDraw.apply(this,arguments);
  G.refl.a=0;
  const cx=R.cx,W=R.W,H=R.H,gy=R.gy;
  const holes=G.obs.filter(o=>(o.type==='gap'||o.type==='fissure')&&o.w>2).map(o=>[o.x-o.w/2,o.x+o.w/2,o]).sort((a,b)=>a[0]-b[0]);
  cx.fillStyle=BLACK;
  let x=-80;
  for(const hl of holes){if(hl[0]>x)cx.fillRect(x,gy,hl[0]-x,H-gy+80);x=Math.max(x,hl[1])}
  if(x<W+80)cx.fillRect(x,gy,W+80-x,H-gy+80);
  /* wet surfaces catch the sky along their edge */
  const wet=clamp((R.wx&&R.wx.wet)||0,0,1),pp=V.pal();
  if(wet>.05){
    cx.fillStyle=rgb(mix(pp.haze,pp.sun,.4),.32*wet);
    x=-80;for(const hl of holes){if(hl[0]>x)cx.fillRect(x,gy-1,hl[0]-x,1.4*R.S);x=Math.max(x,hl[1])}if(x<W+80)cx.fillRect(x,gy-1,W+80-x,1.4*R.S);
    const sh=cx.createLinearGradient(0,gy,0,gy+14*R.S);sh.addColorStop(0,rgb(mix(pp.haze,pp.sun,.3),.12*wet));sh.addColorStop(1,rgb(pp.haze,0));
    cx.fillStyle=sh;cx.fillRect(-80,gy,W+160,14*R.S);
  }
  /* gap edges: broken slab lips and a cool fall-off of light into the depth */
  const p=V.pal(),S=R.S;
  for(const hl of holes){
    const L=hl[0],Rr=hl[1];
    const kind=V.kind();
    if(kind==='water'){
      const wy=gy+22*S,wg=cx.createLinearGradient(0,wy,0,H);wg.addColorStop(0,rgb(mix(p.haze,[60,100,130],.4)));wg.addColorStop(1,rgb(mix(p.sh,[10,20,30],.6)));
      cx.fillStyle=wg;cx.fillRect(L,wy,Rr-L,H-wy+80);
      cx.fillStyle=rgb(mix(p.haze,p.sun,.5),.5);for(let k=0;k<6;k++){const yy=wy+((k*13)%40)*S+3*S,ww=(10+(k*29)%30)*S,xx=L+(((k*41+R.t*30)%((Rr-L)||1)));cx.fillRect(xx,yy,ww,1.2*S)}
    }else{
      const dg=cx.createLinearGradient(0,gy,0,H);dg.addColorStop(0,rgb(p.haze,0));dg.addColorStop(1,rgb(shade(p.sh,.5),.55));
      cx.fillStyle=dg;cx.fillRect(L,gy,Rr-L,H-gy+80);
    }
    cx.fillStyle=BLACK;
    if(kind==='nature'){cx.beginPath();cx.moveTo(L,gy);cx.lineTo(L+10*S,gy+30*S);cx.lineTo(L+4*S,gy+70*S);cx.lineTo(L+14*S,H+80);cx.lineTo(L-2,H+80);cx.closePath();cx.fill();
      cx.beginPath();cx.moveTo(Rr,gy);cx.lineTo(Rr-12*S,gy+36*S);cx.lineTo(Rr-6*S,gy+80*S);cx.lineTo(Rr-16*S,H+80);cx.lineTo(Rr+2,H+80);cx.closePath();cx.fill()}
    else{cx.fillRect(L-2*S,gy,6*S,14*S);cx.fillRect(Rr-4*S,gy,6*S,14*S)}
    if(hl[2].type==='fissure'){cx.strokeStyle='rgba(255,140,60,.6)';cx.lineWidth=2*S;cx.beginPath();cx.moveTo(L,gy+2);cx.lineTo(L+(Rr-L)*.35,gy+14*S);cx.lineTo(Rr,gy+2);cx.stroke()}
  }
};

/* ---------- structures, obstacles and decor (replaces ground.drawObs during a run) ---------- */
const STRUCT={roof:1,deck:1,gap:1,fissure:1,room:1};
V.drawObs=function(dob){
  const cx=R.cx,gy=R.gy,S=R.S,p=V.pal();
  for(const it of J.items)if(it.k==='decor'&&it.kind!=='crane')drawDecor(cx,it,gy,S,p);
  for(const o of G.obs){
    if(o.x+o.w/2<-80||o.x-o.w/2>R.W+80)continue;
    if(o.type==='roof')drawRoof(cx,o,gy,S,p);
    else if(o.type==='deck')drawDeck(cx,o,gy,S,p);
    else if(o.type==='room')drawRoom(cx,o,gy,S,p);
  }
  const rest=[],all=G.obs,mk=G.medkit;
  for(const o of all){
    if(STRUCT[o.type])continue;
    if(o.x+o.w/2<-60||o.x-o.w/2>R.W+60)continue;
    if(o.type==='fire'){drawFire(cx,o,gy,S,p);continue}
    if(!drawProp(cx,o,gy,S,p))rest.push(o);
  }
  if(rest.length||mk){G.noMarkers=true;try{G.obs=rest;dob.call(G)}finally{G.obs=all;G.noMarkers=false}}
  for(const it of J.items)if(it.k==='decor'&&it.kind==='crane')drawCrane(cx,it,S);
  drawMotes(cx,gy,S,p);
};
/* a faint inner detail colour and a back-light rim for black silhouettes */
const det=p=>rgb(mix([10,10,14],p.haze,.16));
const rim=(p,a)=>rgb(mix(p.haze,p.sun,.5),a);

/* r12: obstacles carry their real-world colour (lit by the scene's light, darker at the foot) so you can tell at a
   glance what they are; the route and buildings stay black */
const PROPC={crate:[150,104,62],cart:[120,124,132],barrel:[178,44,36],cone:[244,112,30],block:[172,170,162],barrier:[206,62,52],
  bin:[52,112,72],hydrant:[196,42,38],pot:[176,92,58],buoy:[214,62,52],chair:[112,114,122],rock:[122,114,106],deskrock:[156,124,92],
  icerock:[192,222,242],debris:[132,126,118],log:[112,76,46],stump:[112,76,46],mound:[232,238,248],tire:[44,44,48],curb:[166,164,158],
  ledge:[156,154,150],dock:[124,94,64],bench:[136,94,58],rail:[156,162,176],stairs:[156,154,150],kicker:[146,114,82],
  acunit:[198,202,208],generator:[222,182,42],skip:[62,132,92],pallet:[176,134,82],tank:[112,132,152],ventstack:[152,156,164],
  desk:[146,104,66],sofa:[136,48,58],boxes:[194,154,104],cabinet:[112,122,112]};
function drawProp(cx,o,gy,S,p){
  const t=o.type,x=o.x,w=o.w,h=o.h,L=x-w/2,T=gy-h;
  const c0=PROPC[t]||[60,60,66],lt=.5+.5*clamp(W3.day+.7*W3.gold,0,1);
  const top=mix(shade(c0,lt),p.sun,.1),foot=shade(c0,.38*lt+.08);
  const body=cx.createLinearGradient(0,T,0,gy);body.addColorStop(0,rgb(top));body.addColorStop(1,rgb(mix(foot,p.haze,.06)));
  const D=rgb(shade(c0,.32),.85);
  cx.save();cx.fillStyle=body;cx.strokeStyle=D;cx.lineWidth=1.3*S;
  const rimTop=(x0,x1,y)=>{cx.fillStyle=rgb(mix(top,p.sun,.55),.9);cx.fillRect(x0,y-1*S,x1-x0,1.4*S);cx.fillStyle=body};
  const band=(y,hh)=>{cx.fillStyle='rgba(245,245,240,.92)';cx.fillRect(L,y,w,hh);cx.fillStyle=body};
  const R4=(a,b,c,d)=>cx.fillRect(a,b,c,d);
  let ok=true;
  switch(t){
    case 'crate':case 'cart':
      R4(L,T,w,h);cx.beginPath();for(let k=1;k<4;k++){cx.moveTo(L+2*S,T+h*k/4);cx.lineTo(L+w-2*S,T+h*k/4)}cx.moveTo(L+3*S,T+3*S);cx.lineTo(L+w-3*S,T+h-3*S);cx.stroke();
      cx.strokeRect(L+1.5*S,T+1.5*S,w-3*S,h-3*S);rimTop(L,L+w,T);break;
    case 'barrel':
      cx.beginPath();cx.roundRect?cx.roundRect(L,T,w,h,4*S):cx.rect(L,T,w,h);cx.fill();
      cx.beginPath();for(const f of[.18,.5,.82]){cx.moveTo(L+1*S,T+h*f);cx.lineTo(L+w-1*S,T+h*f)}cx.stroke();band(T+h*.3,h*.08);rimTop(L+2*S,L+w-2*S,T);break;
    case 'cone':
      cx.beginPath();cx.moveTo(x-w*.18,T);cx.lineTo(x+w*.18,T);cx.lineTo(x+w*.45,gy-3*S);cx.lineTo(x-w*.45,gy-3*S);cx.closePath();cx.fill();R4(x-w*.6,gy-3*S,w*1.2,3*S);
      cx.fillStyle='rgba(245,245,240,.95)';cx.beginPath();cx.moveTo(x-w*.27,T+h*.42);cx.lineTo(x+w*.27,T+h*.42);cx.lineTo(x+w*.31,T+h*.56);cx.lineTo(x-w*.31,T+h*.56);cx.closePath();cx.fill();cx.fillStyle=body;break;
    case 'block':case 'barrier':
      /* concrete jersey barrier with a lifting slot */
      cx.beginPath();cx.moveTo(L,gy);cx.lineTo(L+w*.12,gy-h*.3);cx.lineTo(L+w*.28,T);cx.lineTo(L+w*.72,T);cx.lineTo(L+w*.88,gy-h*.3);cx.lineTo(L+w,gy);cx.closePath();cx.fill();
      if(t==='barrier'){cx.save();cx.clip();cx.fillStyle='rgba(245,245,240,.9)';for(let k=-2;k<8;k++){cx.beginPath();cx.moveTo(L+k*w/6,gy);cx.lineTo(L+k*w/6+w/12,gy);cx.lineTo(L+k*w/6+w/12+h,T);cx.lineTo(L+k*w/6+h,T);cx.closePath();cx.fill()}cx.restore()}
      cx.beginPath();cx.moveTo(L+w*.35,T+h*.35);cx.lineTo(L+w*.65,T+h*.35);cx.stroke();rimTop(L+w*.28,L+w*.72,T);break;
    case 'bin':
      R4(L+2*S,T+4*S,w-4*S,h-8*S);R4(L,T,w,5*S);cx.beginPath();cx.arc(L+5*S,gy-4*S,4*S,0,6.283);cx.arc(L+w-5*S,gy-4*S,4*S,0,6.283);cx.fill();
      cx.beginPath();cx.moveTo(L+w*.3,T+h*.3);cx.lineTo(L+w*.3,T+h*.8);cx.moveTo(L+w*.7,T+h*.3);cx.lineTo(L+w*.7,T+h*.8);cx.stroke();rimTop(L,L+w,T);break;
    case 'hydrant':case 'pot':case 'buoy':
      cx.beginPath();cx.roundRect?cx.roundRect(x-w*.3,T+h*.22,w*.6,h*.78,3*S):cx.rect(x-w*.3,T+h*.22,w*.6,h*.78);cx.fill();
      cx.beginPath();cx.arc(x,T+h*.24,w*.3,Math.PI,0);cx.fill();R4(x-w*.5,T+h*.45,w,h*.12);R4(x-w*.4,gy-4*S,w*.8,4*S);rimTop(x-w*.2,x+w*.2,T+h*.02);break;
    case 'chair':
      for(const dx of[-w*.25,w*.25]){R4(x+dx-w*.2,T+h*.5,w*.4,3*S);R4(x+dx-w*.2,T,3*S,h);R4(x+dx+w*.18,T+h*.5,3*S,h*.5)}break;
    case 'rock':case 'deskrock':case 'icerock':case 'debris':
      cx.beginPath();cx.moveTo(L,gy);cx.lineTo(L+w*.12,T+h*.35);cx.lineTo(L+w*.42,T);cx.lineTo(L+w*.78,T+h*.22);cx.lineTo(L+w,gy);cx.closePath();cx.fill();
      cx.beginPath();cx.moveTo(L+w*.42,T+h*.1);cx.lineTo(L+w*.5,T+h*.6);cx.stroke();rimTop(L+w*.3,L+w*.6,T+h*.05);break;
    case 'log':case 'stump':
      cx.beginPath();cx.roundRect?cx.roundRect(L,T,w,h,h/2):cx.rect(L,T,w,h);cx.fill();
      cx.beginPath();cx.ellipse(L+w-h*.35,T+h/2,h*.25,h*.38,0,0,6.283);cx.stroke();rimTop(L+h/2,L+w-h/2,T);break;
    case 'mound':
      cx.beginPath();cx.moveTo(L,gy);cx.quadraticCurveTo(x,T-h*.3,L+w,gy);cx.closePath();cx.fill();break;
    case 'tire':
      cx.beginPath();cx.arc(x,gy-h/2,h/2,0,6.283);cx.fill();cx.beginPath();cx.arc(x,gy-h/2,h*.22,0,6.283);cx.stroke();break;
    case 'curb':case 'ledge':case 'dock':
      R4(L,T,w,h);R4(L-3*S,T,w+6*S,4*S);cx.beginPath();for(let k=1;k<4;k++){cx.moveTo(L+w*k/4,T+5*S);cx.lineTo(L+w*k/4,gy)}cx.stroke();rimTop(L-3*S,L+w+3*S,T);break;
    case 'bench':
      R4(L,T,w,4*S);R4(L,T+8*S,w,3*S);R4(L+w*.1,T,4*S,h);R4(L+w*.9-4*S,T,4*S,h);rimTop(L,L+w,T);break;
    case 'rail':
      R4(L,T,w,4*S);for(let k=0;k<=4;k++)R4(L+w*k/4-1.5*S,T,3*S,h);rimTop(L,L+w,T);break;
    case 'stairs':{
      const n=5;cx.beginPath();cx.moveTo(L,gy);for(let k=0;k<n;k++){cx.lineTo(L+w*k/n,gy-h*(k+1)/n);cx.lineTo(L+w*(k+1)/n,gy-h*(k+1)/n)}cx.lineTo(L+w,gy);cx.closePath();cx.fill();
      R4(L+w*.1,T-26*S,2.5*S,26*S+h*.2);cx.fillRect(L+w*.1,T-26*S,w*.85,2.5*S);rimTop(L+w*.8,L+w,T);break}
    case 'kicker':
      cx.beginPath();cx.moveTo(L,gy);cx.lineTo(L+w,T);cx.lineTo(L+w,gy);cx.closePath();cx.fill();
      cx.strokeStyle=rim(p,.45);cx.beginPath();cx.moveTo(L,gy-1);cx.lineTo(L+w,T);cx.stroke();break;
    case 'acunit':case 'generator':
      R4(L,T,w,h);R4(L+4*S,gy-4*S,6*S,4*S);R4(L+w-10*S,gy-4*S,6*S,4*S);
      cx.beginPath();cx.arc(L+w*.66,T+h*.5,Math.min(w,h)*.32,0,6.283);cx.stroke();
      cx.beginPath();cx.arc(L+w*.66,T+h*.5,Math.min(w,h)*.08,0,6.283);cx.stroke();
      for(let a=0;a<4;a++){const an=a*1.571+R.t*(t==='acunit'?8:0);cx.beginPath();cx.moveTo(L+w*.66,T+h*.5);cx.lineTo(L+w*.66+Math.cos(an)*Math.min(w,h)*.3,T+h*.5+Math.sin(an)*Math.min(w,h)*.3);cx.stroke()}
      cx.beginPath();for(let k=0;k<5;k++){cx.moveTo(L+5*S,T+h*(.2+k*.14));cx.lineTo(L+w*.36,T+h*(.2+k*.14))}cx.stroke();
      if(t==='generator'){cx.save();cx.beginPath();cx.rect(L,gy-9*S,w,7*S);cx.clip();cx.fillStyle='#15151a';for(let k=0;k<w/(9*S);k++)cx.fillRect(L+k*18*S,gy-9*S,9*S,7*S);cx.restore();cx.fillStyle=body;R4(L+w*.8,T-22*S,5*S,22*S);cx.fillStyle=rgb(mix(p.haze,[90,90,100],.6),.25);cx.beginPath();cx.arc(L+w*.82,T-30*S-Math.sin(R.t*2)*4*S,7*S,0,6.283);cx.fill();cx.fillStyle=body}
      rimTop(L,L+w,T);break;
    case 'skip':
      cx.beginPath();cx.moveTo(L,T);cx.lineTo(L+w,T);cx.lineTo(L+w*.92,gy-8*S);cx.lineTo(L+w*.08,gy-8*S);cx.closePath();cx.fill();
      R4(L-3*S,T,w+6*S,5*S);cx.beginPath();cx.arc(L+w*.18,gy-5*S,5*S,0,6.283);cx.arc(L+w*.82,gy-5*S,5*S,0,6.283);cx.fill();
      cx.beginPath();for(let k=1;k<6;k++){cx.moveTo(L+w*k/6,T+7*S);cx.lineTo(L+w*k/6-(k-3)*1.5*S,gy-10*S)}cx.stroke();rimTop(L-3*S,L+w+3*S,T);break;
    case 'pallet':
      R4(L,T,w,5*S);R4(L,gy-5*S,w,5*S);for(const f of[.04,.47,.9])R4(L+w*f,T,w*.06,h);
      cx.beginPath();for(let k=1;k<8;k++){cx.moveTo(L+w*k/8,T+1*S);cx.lineTo(L+w*k/8,T+4*S)}cx.stroke();rimTop(L,L+w,T);break;
    case 'tank':
      for(const f of[.15,.85])R4(L+w*f-2*S,gy-h*.35,4*S,h*.35);
      cx.beginPath();cx.roundRect?cx.roundRect(L,T,w,h*.68,8*S):cx.rect(L,T,w,h*.68);cx.fill();
      cx.beginPath();for(const f of[.25,.5]){cx.moveTo(L+3*S,T+h*.68*f);cx.lineTo(L+w-3*S,T+h*.68*f)}cx.stroke();
      R4(L+w*.9,T-6*S,2*S,h*.68+6*S);rimTop(L+6*S,L+w-6*S,T);break;
    case 'ventstack':
      R4(x-w*.25,T+10*S,w*.5,h-10*S);cx.beginPath();cx.moveTo(x-w*.55,T+12*S);cx.quadraticCurveTo(x,T-6*S,x+w*.55,T+12*S);cx.closePath();cx.fill();
      cx.strokeStyle=rgb(mix(p.haze,[0,0,0],.6),.5);cx.beginPath();cx.moveTo(x,T+18*S);cx.lineTo(x-w*1.3,gy);cx.moveTo(x,T+18*S);cx.lineTo(x+w*1.3,gy);cx.stroke();rimTop(x-w*.4,x+w*.4,T+4*S);break;
    case 'desk':
      R4(L,T,w,5*S);R4(L+4*S,T,5*S,h);R4(L+w-9*S,T,5*S,h);R4(L+w*.55,T+5*S,w*.4,h*.45);
      cx.beginPath();for(let k=1;k<3;k++){cx.moveTo(L+w*.57,T+5*S+h*.15*k);cx.lineTo(L+w*.93,T+5*S+h*.15*k)}cx.stroke();
      R4(L+w*.2,T-30*S,36*S,24*S);R4(L+w*.2+16*S,T-6*S,4*S,6*S);
      cx.fillStyle=rgb(mix(p.win,p.sun,.3),.35);cx.fillRect(L+w*.2+3*S,T-27*S,30*S,18*S);cx.fillStyle=body;rimTop(L,L+w,T);break;
    case 'sofa':
      cx.beginPath();cx.roundRect?cx.roundRect(L,T,w,h,6*S):cx.rect(L,T,w,h);cx.fill();R4(L-4*S,T+h*.3,12*S,h*.7);R4(L+w-8*S,T+h*.3,12*S,h*.7);
      cx.beginPath();cx.moveTo(L+w*.33,T+h*.45);cx.lineTo(L+w*.33,gy-6*S);cx.moveTo(L+w*.66,T+h*.45);cx.lineTo(L+w*.66,gy-6*S);cx.moveTo(L+8*S,T+h*.45);cx.lineTo(L+w-8*S,T+h*.45);cx.stroke();rimTop(L+4*S,L+w-4*S,T);break;
    case 'boxes':
      R4(L,T+h*.45,w*.55,h*.55);R4(L+w*.5,T+h*.3,w*.5,h*.7);R4(L+w*.18,T,w*.5,h*.45);
      cx.beginPath();cx.moveTo(L+w*.27,T+h*.45);cx.lineTo(L+w*.27,gy);cx.moveTo(L+w*.75,T+h*.3);cx.lineTo(L+w*.75,gy);cx.moveTo(L+w*.43,T);cx.lineTo(L+w*.43,T+h*.45);cx.stroke();rimTop(L+w*.18,L+w*.68,T);break;
    case 'cabinet':
      R4(L,T,w,h);cx.beginPath();for(let k=1;k<4;k++){cx.moveTo(L+3*S,T+h*k/4);cx.lineTo(L+w-3*S,T+h*k/4)}cx.stroke();
      for(let k=0;k<4;k++)cx.strokeRect(x-6*S,T+h*(k+.5)/4-1.5*S,12*S,3*S);rimTop(L,L+w,T);break;
    case 'pothole':case 'puddle':
      cx.fillStyle=rgb(mix(p.haze,[0,0,0],.75),.6);cx.beginPath();cx.ellipse(x,gy+2*S,w/2,4*S,0,0,6.283);cx.fill();break;
    default:ok=false;
  }
  if(ok&&t!=='pothole'&&t!=='puddle'&&t!=='kicker'){
    /* AC-unit style fan grille on boxy props reads the scale instantly */
    if((t==='crate'||t==='cart'||t==='bin')&&w>40*S){cx.strokeStyle=D;cx.beginPath();cx.arc(x,T+h*.5,Math.min(w,h)*.28,0,6.283);cx.stroke()}
  }
  cx.restore();
  return ok;
}
/* r14 terrain by place: cities get rooftops and crane-hung girders; nature gets rock ledges and rope bridges; waterside
   places get piers on posts and plank footbridges. */
function drawRoof(cx,o,gy,S,p){
  const L=o.x-o.w/2,w=o.w,top=gy-o.h,sd=o.seed||.5,kind=V.kind(),wet=clamp((R.wx&&R.wx.wet)||0,0,1);
  cx.fillStyle=BLACK;
  if(kind==='nature'){
    /* a rock ledge: broken outline, rounded shoulders, tufts on top */
    cx.beginPath();cx.moveTo(L-6*S,gy);cx.lineTo(L-2*S,top+10*S);cx.quadraticCurveTo(L,top-2*S,L+14*S,top-1*S);
    for(let k=1;k<8;k++){const xx=L+w*k/8;cx.lineTo(xx,top-((k*37+sd*90)%6)*S)}
    cx.quadraticCurveTo(L+w,top-1*S,L+w+2*S,top+12*S);cx.lineTo(L+w+8*S,gy);cx.closePath();cx.fill();
    for(let k=0;k<5;k++){const xx=L+w*(.1+.2*k+sd*.05);cx.beginPath();cx.moveTo(xx,top);cx.lineTo(xx+3*S,top-8*S);cx.lineTo(xx+6*S,top);cx.fill()}
    cx.fillStyle=rim(p,.3+.3*wet);cx.fillRect(L+8*S,top-1*S,w-16*S,1.1*S);
    return;
  }
  if(kind==='water'){
    /* a pier: plank deck on posts, the water shows between them */
    cx.fillRect(L,top,w,9*S);
    for(let x=L+6*S;x<L+w;x+=36*S)cx.fillRect(x,top,6*S,gy-top);
    cx.lineWidth=2*S;cx.strokeStyle=BLACK;cx.beginPath();for(let x=L+6*S;x+36*S<L+w;x+=36*S){cx.moveTo(x+6*S,top+12*S);cx.lineTo(x+36*S,gy-6*S)}cx.stroke();
    cx.fillRect(L+4*S,top-14*S,3*S,14*S);cx.fillRect(L+w-7*S,top-14*S,3*S,14*S);
    cx.fillStyle=rim(p,.35+.35*wet);cx.fillRect(L,top-1*S,w,1.1*S);
    return;
  }
  cx.fillRect(L,top,w,gy-top+2);
  cx.fillRect(L-4*S,top-3*S,w+8*S,5*S);
  cx.fillRect(L+2*S,top-12*S,8*S,10*S);cx.fillRect(L+w-10*S,top-12*S,8*S,10*S);
  if(w>300*S){const px=L+w*(.55+sd*.3);cx.fillRect(px,top-9*S,34*S,7*S)}
  cx.strokeStyle=det(p);cx.lineWidth=1.2*S;cx.beginPath();
  cx.moveTo(L+10*S,top+6*S);cx.lineTo(L+10*S,gy);cx.moveTo(L+w*(.3+sd*.4),top+10*S);cx.lineTo(L+w*(.3+sd*.4),gy);
  for(let y=top+40*S;y<gy;y+=46*S){cx.moveTo(L+14*S,y);cx.lineTo(L+w-14*S,y)}
  cx.stroke();
  cx.fillStyle=rim(p,.4+.35*wet);cx.fillRect(L-4*S,top-3*S,w+8*S,1.1*S);
}
function drawDeck(cx,o,gy,S,p){
  const kind=V.kind();
  if(kind==='city')return drawGirder(cx,o,gy,S,p);
  const L=o.x-o.w/2,w=o.w,top=gy-o.h,bot=gy-o.bot;
  cx.save();cx.fillStyle=BLACK;cx.strokeStyle=BLACK;
  /* tall end posts the bridge hangs from */
  const ph=110*S;
  cx.fillRect(L-6*S,top-ph,7*S,ph+(bot-top));cx.fillRect(L+w-1*S,top-ph,7*S,ph+(bot-top));
  if(kind==='nature'){
    /* rope bridge: planks, two sagging hand ropes and the hangers between them */
    cx.fillRect(L,top,w,5*S);for(let x=L;x<L+w;x+=11*S)cx.fillRect(x,top+5*S,8*S,3*S);   /* plank deck seen edge-on */
    cx.lineWidth=2*S;
    for(const dy of[0,-34*S]){cx.beginPath();cx.moveTo(L-3*S,top-ph+12*S-dy*0);cx.quadraticCurveTo(L+w/2,top+dy+16*S,L+w+3*S,top-ph+12*S);cx.stroke()}
    cx.lineWidth=1*S;cx.beginPath();for(let x=L+20*S;x<L+w-10*S;x+=26*S){const u=(x-L)/w,sag=top-ph+12*S+(top+16*S-(top-ph+12*S))*4*u*(1-u)*.98;cx.moveTo(x,sag);cx.lineTo(x,top)}cx.stroke();
  }else{
    /* plank footbridge with a rail */
    cx.fillRect(L,top,w,bot-top);
    cx.fillRect(L,top-26*S,w,3*S);for(let x=L;x<=L+w;x+=30*S)cx.fillRect(x,top-26*S,3*S,26*S);
    cx.lineWidth=2*S;cx.beginPath();cx.moveTo(L,top-ph+10*S);cx.lineTo(L+w*.35,top);cx.moveTo(L+w,top-ph+10*S);cx.lineTo(L+w*.65,top);cx.stroke();
  }
  cx.fillStyle=rim(p,.35);cx.fillRect(L,top,w,1.1*S);
  cx.restore();
}
function drawGirder(cx,o,gy,S,p){
  const L=o.x-o.w/2,w=o.w,top=gy-o.h,bot=gy-o.bot,th=bot-top;
  cx.save();cx.fillStyle=BLACK;cx.strokeStyle=BLACK;
  const hx=o.x,hy=top-130*S;
  cx.lineWidth=2*S;cx.beginPath();cx.moveTo(L+w*.18,top);cx.lineTo(hx,hy);cx.lineTo(L+w*.82,top);cx.moveTo(hx,hy);cx.lineTo(hx,-60);cx.stroke();
  /* hazard-striped hook block, like a real crane */
  cx.fillStyle='#e8b923';cx.beginPath();cx.moveTo(hx-12*S,hy-20*S);cx.lineTo(hx+12*S,hy-20*S);cx.lineTo(hx+9*S,hy+4*S);cx.lineTo(hx-9*S,hy+4*S);cx.closePath();cx.fill();
  cx.save();cx.clip();cx.fillStyle=BLACK;for(let k=-3;k<4;k++){cx.beginPath();cx.moveTo(hx+k*8*S,hy-20*S);cx.lineTo(hx+k*8*S+5*S,hy-20*S);cx.lineTo(hx+k*8*S-5*S,hy+4*S);cx.lineTo(hx+k*8*S-10*S,hy+4*S);cx.closePath();cx.fill()}cx.restore();
  cx.fillStyle=BLACK;cx.lineWidth=3.5*S;cx.beginPath();cx.arc(hx,hy+13*S,7*S,0,Math.PI);cx.stroke();
  /* truss girder */
  cx.fillRect(L,top,w,5*S);cx.fillRect(L,bot-5*S,w,5*S);
  const n=Math.max(3,Math.round(w/(th*1.3)));cx.lineWidth=3.2*S;cx.beginPath();
  for(let i=0;i<=n;i++){const x=L+w*i/n;cx.moveTo(x,top);cx.lineTo(x,bot);if(i<n){const x2=L+w*(i+1)/n;cx.moveTo(x,i%2?top:bot);cx.lineTo(x2,i%2?bot:top)}}
  cx.stroke();
  cx.fillStyle=rim(p,.4);cx.fillRect(L,top,w,1.1*S);
  cx.restore();
}
function drawCrane(cx,it,S){
  const x=it.x,y=R.H*.06+((it.seed||.3)*40)*S,len=360*S;
  cx.save();cx.fillStyle=BLACK;cx.strokeStyle=BLACK;
  cx.fillRect(x-len*.6,y,len,5*S);cx.fillRect(x-len*.6,y+30*S,len,5*S);
  cx.lineWidth=3*S;cx.beginPath();
  for(let i=0;i<=12;i++){const xx=x-len*.6+len*i/12;cx.moveTo(xx,y);cx.lineTo(xx,y+34*S);if(i<12){cx.moveTo(xx,y+(i%2?0:34*S));cx.lineTo(xx+len/12,y+(i%2?34*S:0))}}
  cx.stroke();
  /* catenary cable under the jib with work lamps */
  cx.lineWidth=1.6*S;cx.beginPath();cx.moveTo(x-len*.6,y+36*S);cx.quadraticCurveTo(x-len*.3,y+70*S,x,y+36*S);cx.quadraticCurveTo(x+len*.2,y+66*S,x+len*.4,y+36*S);cx.stroke();
  const hx=x+len*.25,hl=R.gy*.32+(it.seed||.3)*60*S;
  cx.lineWidth=2*S;cx.beginPath();cx.moveTo(hx,y+34*S);cx.lineTo(hx,y+hl);cx.stroke();
  cx.fillRect(hx-10*S,y+hl,20*S,26*S);
  cx.beginPath();cx.lineWidth=4*S;cx.arc(hx,y+hl+36*S,8*S,-Math.PI*.1,Math.PI*1.05);cx.stroke();
  cx.restore();
}
function drawMotes(cx,gy,S,p){
  if(R.qLv<1)return;
  cx.save();cx.globalCompositeOperation='lighter';
  const W=R.W,sc=(J.dist||0)*100*S;
  for(let i=0;i<26;i++){
    const px=((i*397.3-sc*.9-R.t*14*(1+i%3))%(W+40)+W+40)%(W+40)-20,py=gy*(.25+((i*53)%71)/71*.72)+Math.sin(R.t*.8+i)*12*S;
    const tw=.5+.5*Math.sin(R.t*2+i*1.3);
    cx.fillStyle=rgb(p.sun,.08+.14*tw);cx.beginPath();cx.arc(px,py,(.8+(i%3)*.5)*S,0,6.283);cx.fill();
  }
  cx.restore();
}

/* ---------- cinema layer (screen space, after bloom): out-of-focus foreground silhouettes past the lens ---------- */
const near=[];let nearT=2;
V.drawCinema=function(){
  if(!V.on())return;
  const cx=R.cx,W=R.W,H=R.H,S=R.S,dt=R.dt||.016,spd=G.roadSpeed();
  cx.save();cx.setTransform(R.d,0,0,R.d,0,0);drawSkyEvent(cx,W,H,S);cx.restore();
  if(R.st==='play'){nearT-=dt;if(nearT<=0){nearT=4+Math.random()*6;
    const gr=R.LOC[R.locI].ground,nat=gr==='forest'||gr==='snow';
    const k=nat?(Math.random()<.6?'branch':'post'):['post','girder','pipe','wire'][Math.random()*4|0];
    near.push({x:W+220*S,k,s:.8+Math.random()*.6})}}
  for(const n of near)n.x-=spd*1.9*dt;
  for(let i=near.length-1;i>=0;i--)if(near[i].x<-400*S)near.splice(i,1);
  if(!near.length)return;
  cx.save();cx.setTransform(R.d,0,0,R.d,0,0);
  if(R.filterOK&&R.qLv>=1)cx.filter=`blur(${(4*S).toFixed(1)}px)`;
  cx.fillStyle='rgba(2,2,4,.93)';cx.strokeStyle='rgba(2,2,4,.93)';
  for(const n of near){
    const x=n.x,s=n.s*S;
    if(n.k==='post'){cx.fillRect(x,-20,46*s,H+40);cx.fillRect(x-14*s,H*.62,74*s,12*s)}
    else if(n.k==='girder'){cx.lineWidth=10*s;cx.beginPath();cx.moveTo(x-40*s,-20);cx.lineTo(x+260*s,H*.22);cx.stroke();
      cx.lineWidth=6*s;cx.beginPath();for(let k=0;k<5;k++){const u=k/5;cx.moveTo(x-40*s+300*s*u,-20+(H*.22+20)*u);cx.lineTo(x-40*s+300*s*u+30*s,-20)}cx.stroke()}
    else if(n.k==='pipe'){cx.fillRect(x-200*s,H-58*s,560*s,26*s);cx.fillRect(x+40*s,H-80*s,30*s,70*s)}
    else if(n.k==='wire'){cx.lineWidth=3*s;cx.beginPath();cx.moveTo(x-300*s,H*.04);cx.quadraticCurveTo(x+60*s,H*.2,x+420*s,H*.02);cx.stroke()}
    else{cx.lineWidth=8*s;cx.beginPath();cx.moveTo(x+300*s,-10);cx.quadraticCurveTo(x+120*s,H*.12,x-60*s,H*.18);cx.stroke();
      for(let k=0;k<9;k++){const u=k/9;cx.beginPath();cx.ellipse(x+300*s-360*s*u,H*(.02+.14*u)+((k%2)?14:-10)*s,26*s,9*s,(k%2?.6:-.5),0,6.283);cx.fill()}}
  }
  cx.restore();
};

/* ---------- r11 indoor rooms: a cutaway of the building — lit back wall, windows onto the city, lamps, ducts,
   black floor slabs and the building's mass above the ceiling ---------- */
function drawRoom(cx,o,gy,S,p){
  const L=o.x-o.w/2,w=o.w,cb=gy-o.bot,top=gy-o.h,sd=o.seed||.5,night=p.night;
  const wall=mix(mix(p.sh,[44,36,32],.55),[18,16,18],night*.55);
  cx.save();
  cx.beginPath();cx.rect(L,cb,w,gy-cb);cx.clip();
  cx.fillStyle=rgb(wall);cx.fillRect(L,cb,w,gy-cb);
  /* wallpaper stripes, skirting and dado rail */
  cx.fillStyle=rgb(shade(wall,.93));for(let x=L;x<L+w;x+=18*S)cx.fillRect(x,cb,7*S,gy-cb);
  cx.fillStyle=rgb(shade(wall,.72));cx.fillRect(L,gy-34*S,w,34*S);
  cx.fillStyle=rgb(shade(wall,1.2));cx.fillRect(L,gy-35*S,w,1.6*S);
  /* windows onto the city, with blinds and light falling into the room */
  const ww=78*S,wh=(gy-cb)*.5,wy=cb+(gy-cb)*.16;
  for(let wx=L+50*S+sd*60*S;wx+ww<L+w-30*S;wx+=ww+110*S){
    cx.save();cx.beginPath();cx.rect(wx,wy,ww,wh);cx.clip();
    const gl=cx.createLinearGradient(0,wy,0,wy+wh);gl.addColorStop(0,rgb(mix(p.top,p.hor,.6)));gl.addColorStop(1,rgb(mix(p.hor,p.sun,.3)));
    cx.fillStyle=gl;cx.fillRect(wx,wy,ww,wh);
    cx.fillStyle=rgb(mix(p.far,p.hor,.35));
    for(let k=0;k<5;k++)cx.fillRect(wx+k*ww/5,wy+wh*(.35+((k*37+sd*90)%40)/100),ww/5-2*S,wh);
    if(night>.3){cx.fillStyle=rgb(p.lit,.8);for(let k=0;k<6;k++)cx.fillRect(wx+((k*29)%70)*S*.9,wy+wh*(.55+((k*13)%30)/100),2*S,3*S)}
    cx.fillStyle=rgb(shade(wall,.55),.6);for(let y=wy;y<wy+wh*.3;y+=5*S)cx.fillRect(wx,y,ww,2.2*S);
    cx.restore();
    cx.strokeStyle=rgb(shade(wall,.35));cx.lineWidth=3*S;cx.strokeRect(wx,wy,ww,wh);
    cx.beginPath();cx.moveTo(wx+ww/2,wy);cx.lineTo(wx+ww/2,wy+wh);cx.stroke();
    cx.save();cx.globalCompositeOperation='screen';
    const spl=cx.createLinearGradient(0,wy+wh,0,gy);spl.addColorStop(0,rgb(p.sun,.2*(1-night*.7)));spl.addColorStop(1,rgb(p.sun,0));
    cx.fillStyle=spl;cx.beginPath();cx.moveTo(wx,wy+wh);cx.lineTo(wx+ww,wy+wh);cx.lineTo(wx+ww+50*S,gy);cx.lineTo(wx+30*S,gy);cx.closePath();cx.fill();
    cx.restore();
  }
  /* framed pictures and a doorway */
  cx.fillStyle=rgb(shade(wall,.5));
  for(let x=L+200*S;x<L+w-80*S;x+=330*S){cx.fillRect(x,cb+(gy-cb)*.24,34*S,26*S);cx.fillStyle=rgb(mix(wall,p.sun,.15));cx.fillRect(x+3*S,cb+(gy-cb)*.24+3*S,28*S,20*S);cx.fillStyle=rgb(shade(wall,.5))}
  cx.fillStyle=rgb(shade(wall,.45));cx.fillRect(L+w*.62,gy-(gy-cb)*.72,40*S,(gy-cb)*.72);
  /* hanging lamps with warm cones of light */
  for(let lx=L+140*S;lx<L+w-60*S;lx+=240*S){
    cx.fillStyle=BLACK;cx.fillRect(lx-.8*S,cb,1.6*S,26*S);
    cx.beginPath();cx.moveTo(lx-12*S,cb+36*S);cx.lineTo(lx+12*S,cb+36*S);cx.lineTo(lx+6*S,cb+24*S);cx.lineTo(lx-6*S,cb+24*S);cx.closePath();cx.fill();
    cx.save();cx.globalCompositeOperation='screen';
    const lg=cx.createLinearGradient(0,cb+36*S,0,gy);lg.addColorStop(0,`rgba(255,214,150,${.35+.25*night})`);lg.addColorStop(1,'rgba(255,214,150,0)');
    cx.fillStyle=lg;cx.beginPath();cx.moveTo(lx-12*S,cb+36*S);cx.lineTo(lx+12*S,cb+36*S);cx.lineTo(lx+70*S,gy);cx.lineTo(lx-70*S,gy);cx.closePath();cx.fill();
    const bulb=cx.createRadialGradient(lx,cb+37*S,0,lx,cb+37*S,22*S);bulb.addColorStop(0,'rgba(255,236,190,.9)');bulb.addColorStop(1,'rgba(255,236,190,0)');
    cx.fillStyle=bulb;cx.fillRect(lx-22*S,cb+15*S,44*S,44*S);
    cx.restore();
  }
  /* the room is darker at its ends, away from the light */
  const ag=cx.createLinearGradient(L,0,L+w,0);ag.addColorStop(0,'rgba(0,0,0,.5)');ag.addColorStop(.15,'rgba(0,0,0,0)');ag.addColorStop(.85,'rgba(0,0,0,0)');ag.addColorStop(1,'rgba(0,0,0,.5)');
  cx.fillStyle=ag;cx.fillRect(L,cb,w,gy-cb);
  cx.restore();
  /* the building above: ceiling slab, ducts, facade piers, parapet; upper-floor windows glow at night */
  cx.fillStyle=BLACK;cx.fillRect(L-8*S,top,w+16*S,cb-top+6*S);
  cx.fillRect(L,cb+6*S,w,10*S);for(let x=L+30*S;x<L+w;x+=90*S)cx.fillRect(x,cb+16*S,3*S,8*S);
  cx.fillRect(L-14*S,top,16*S,cb-top+(gy-cb)*.18);cx.fillRect(L+w-2*S,top,16*S,cb-top+(gy-cb)*.18);
  cx.fillRect(L-14*S,top-10*S,w+28*S,10*S);
  if(night>.2){cx.fillStyle=rgb(p.lit,.35*night);for(let y=top+30*S;y<cb-30*S;y+=46*S)for(let x=L+24*S;x<L+w-30*S;x+=54*S)if(((x*7+y*3)|0)%5<2)cx.fillRect(x,y,14*S,18*S)}
  cx.fillStyle=rim(p,.4);cx.fillRect(L-14*S,top-10*S,w+28*S,1.1*S);
}

/* ---------- r11 fire: a burning debris pile — layered flame tongues, embers, smoke, glow on the ground ---------- */
function drawFire(cx,o,gy,S,p){
  const x=o.x,w=o.w,h=o.h,L=x-w/2,t=R.t+(o.seed||0)*10;
  cx.save();
  /* smoke rising and leaning back with the wind */
  for(let i=0;i<7;i++){
    const ph=(t*.35+i/7)%1,sx=x-ph*80*S+Math.sin(t+i)*6*S,sy=gy-h-ph*170*S,r=(14+ph*40)*S;
    const sg=cx.createRadialGradient(sx,sy,0,sx,sy,r);sg.addColorStop(0,`rgba(30,28,30,${.32*(1-ph)})`);sg.addColorStop(1,'rgba(30,28,30,0)');
    cx.fillStyle=sg;cx.fillRect(sx-r,sy-r,r*2,r*2);
  }
  /* charred planks and a scorched barrel */
  cx.fillStyle=BLACK;
  cx.beginPath();cx.moveTo(L,gy);cx.lineTo(L+w*.18,gy-h*.42);cx.lineTo(L+w*.42,gy-h*.3);cx.lineTo(L+w*.6,gy-h*.55);cx.lineTo(L+w*.84,gy-h*.28);cx.lineTo(L+w,gy);cx.closePath();cx.fill();
  cx.save();cx.translate(L+w*.35,gy-h*.3);cx.rotate(-.5);cx.fillRect(-w*.32,-3*S,w*.64,6*S);cx.restore();
  /* flames */
  cx.globalCompositeOperation='lighter';
  const n=7,fh=h*1.45;
  for(let i=0;i<n;i++){
    const u=(i+.5)/n,bx=L+w*(.1+.8*u),wob=Math.sin(t*9+i*1.7)*.12,hh=fh*(.55+.45*Math.sin(u*Math.PI))*(.85+.25*Math.sin(t*7+i*2.3));
    const fw=w*.17;
    const fg=cx.createLinearGradient(0,gy,0,gy-hh);
    fg.addColorStop(0,'rgba(255,236,190,.75)');fg.addColorStop(.22,'rgba(255,160,60,.6)');fg.addColorStop(.6,'rgba(220,70,20,.38)');fg.addColorStop(1,'rgba(160,30,10,0)');
    cx.fillStyle=fg;cx.beginPath();
    cx.moveTo(bx-fw,gy-h*.15);
    cx.quadraticCurveTo(bx-fw*1.1,gy-hh*.5,bx+hh*wob,gy-hh);
    cx.quadraticCurveTo(bx+fw*1.1,gy-hh*.45,bx+fw,gy-h*.15);
    cx.closePath();cx.fill();
  }
  /* glow on the ground and the air */
  const gl=cx.createRadialGradient(x,gy-h*.2,0,x,gy-h*.2,w*1.1);gl.addColorStop(0,`rgba(255,120,40,${.22+.06*Math.sin(t*13)})`);gl.addColorStop(1,'rgba(255,90,30,0)');
  cx.fillStyle=gl;cx.fillRect(x-w*1.1,gy-h*.2-w*1.1,w*2.2,w*2.2);
  /* embers */
  for(let i=0;i<10;i++){const ph=(t*.8+i*.137)%1,ex=x+Math.sin(i*2.1+t*2)*w*.4-ph*30*S,ey=gy-h*.4-ph*fh*1.4;
    cx.fillStyle=`rgba(255,${180-ph*100|0},80,${1-ph})`;cx.fillRect(ex,ey,1.8*S,1.8*S)}
  cx.restore();
}

/* ---------- r11 weather from above: a cloud ceiling lowers over the scene; fog thickens toward the horizon ahead ---------- */
function drawSkyEvent(cx,W,H,S){
  const w=J.wx,k=J.wxK;if(!w||k<=0)return;
  const p=V.pal(),hail=w.type==='hail';
  const cc=hail?[46,50,62]:mix(p.haze,[206,210,220],.55);
  const ch=H*(hail?.16+.16*k:.1+.1*k),ca=hail?.92:.5;
  cx.save();
  const g=cx.createLinearGradient(0,0,0,ch*1.5);g.addColorStop(0,rgb(cc,ca*k));g.addColorStop(.6,rgb(cc,ca*.6*k));g.addColorStop(1,rgb(cc,0));
  cx.fillStyle=g;cx.fillRect(0,0,W,ch*1.5);
  for(let i=0;i<12;i++){
    const x=((i*173-R.t*(18+i%4*6))%(W+300)+W+300)%(W+300)-150,y=ch*(.75+.2*Math.sin(i*1.9)),r=(60+(i*37)%70)*S;
    const pg=cx.createRadialGradient(x,y,0,x,y,r);pg.addColorStop(0,rgb(mix(cc,[255,255,255],hail?.12:.25),(hail?.55:.3)*k));pg.addColorStop(1,rgb(cc,0));
    cx.fillStyle=pg;cx.fillRect(x-r,y-r,r*2,r*2);
  }
  if(!hail){
    /* you see a little less far ahead */
    const fg=cx.createLinearGradient(W*.45,0,W,0);fg.addColorStop(0,rgb(cc,0));fg.addColorStop(1,rgb(cc,.3*k));
    cx.fillStyle=fg;cx.fillRect(0,0,W,R.gy+4);
    for(let i=0;i<6;i++){
      const x=((i*311-R.t*(30+i*7))%(W+500)+W+500)%(W+500)-250,y=R.gy*(.55+.12*Math.sin(i*2.3)),r=(130+(i*53)%90)*S;
      const pg=cx.createRadialGradient(x,y,0,x,y,r);pg.addColorStop(0,rgb(cc,.16*k));pg.addColorStop(1,rgb(cc,0));
      cx.save();cx.translate(x,y);cx.scale(1.8,.5);cx.translate(-x,-y);cx.fillStyle=pg;cx.fillRect(x-r,y-r,r*2,r*2);cx.restore();
    }
  }else{
    /* hail: white streaks driven by the wind, on top of the weather system's bouncing stones */
    cx.strokeStyle=`rgba(235,242,255,${.55*k})`;cx.lineWidth=1.6*S;cx.beginPath();
    for(let i=0;i<70;i++){const ph=(R.t*(1.6+(i%5)*.2)+i*.13)%1,x=((i*97)%W)+ph*60*S,y=ph*H;cx.moveTo(x,y);cx.lineTo(x-4*S,y-12*S)}
    cx.stroke();
  }
  cx.restore();
}

/* ---------- r11 birds: a small flock crossing the back of the scene now and then ---------- */
function drawBirds(cx,p){
  const W=R.W,ph=(R.t*.035)%1;if(ph>.45)return;
  const x0=W*(1.1-ph*2.6),y0=R.gy*(.28+.06*Math.sin(R.t*.3));
  cx.strokeStyle=rgb(mix(p.sh,[20,20,30],.6),.75);cx.lineWidth=1.3*R.S;cx.beginPath();
  for(let i=0;i<9;i++){const bx=x0+((i*37)%90)*R.S+i*12*R.S,by=y0+((i*23)%40)*R.S,f=Math.sin(R.t*9+i)*3*R.S;
    cx.moveTo(bx-5*R.S,by-f);cx.lineTo(bx,by);cx.lineTo(bx+5*R.S,by-f)}
  cx.stroke();
}

/* ---------- r14 landmarks for the new places: a far silhouette that drifts slowly across the level ---------- */
function drawLandmark(cx,p){
  const L=R.LOC[R.locI];if(!L.lm)return;
  const W=R.W,gy=R.gy,S=Math.max(.8,R.S)*Math.min(1.4,W/1100+.3),x=W*(.72-.4*(J.progS||0)),b=gy*.66;
  const c=mix(p.hor,mix(p.far,p.sh,.55),.5);
  cx.save();cx.fillStyle=rgb(c);cx.strokeStyle=rgb(c);
  const R4=(a,y,w,h)=>cx.fillRect(x+a*S,b-(y+h)*S,w*S,h*S);
  const tri=(a,b2,c2)=>{cx.beginPath();cx.moveTo(x+a[0]*S,b-a[1]*S);cx.lineTo(x+b2[0]*S,b-b2[1]*S);cx.lineTo(x+c2[0]*S,b-c2[1]*S);cx.closePath();cx.fill()};
  const dome=(cx0,y,r)=>{cx.beginPath();cx.arc(x+cx0*S,b-y*S,r*S,Math.PI,0);cx.fill()};
  switch(L.lm){
    case 'hagia':R4(-110,0,220,70);dome(0,70,62);for(const d of[-80,80])dome(d,70,26);
      for(const m of[-150,-128,128,150]){R4(m-4,0,8,200);tri([m-6,200],[m+6,200],[m,236])}break;
    case 'pyramids':tri([-260,0],[-20,0],[-140,150]);tri([-40,0],[240,0],[100,178]);tri([200,0],[340,0],[270,80]);break;
    case 'parthenon':cx.beginPath();cx.moveTo(x-260*S,b);cx.quadraticCurveTo(x,b-80*S,x+260*S,b);cx.fill();
      R4(-120,70,240,10);for(let k=0;k<9;k++)R4(-114+k*28,80,10,70);R4(-126,150,252,12);tri([-126,162],[126,162],[0,192]);break;
    case 'campanile':R4(-20,0,40,240);R4(-26,240,52,14);tri([-22,254],[22,254],[0,300]);dome(110,60,48);R4(62,0,96,60);break;
    case 'boc':tri([-40,0],[40,0],[0,380]);R4(-40,0,80,240);R4(-3,370,6,40);R4(80,0,60,200);R4(-140,0,70,170);break;
    case 'castle':R4(-260,0,520,60);for(let k=0;k<14;k++)R4(-250+k*38,60,20,14);R4(-30,0,60,150);tri([-34,150],[34,150],[0,250]);tri([40,150],[60,150],[50,230]);tri([-60,150],[-40,150],[-50,230]);break;
    case 'nativity':R4(-140,0,280,70);R4(60,0,50,140);tri([56,140],[114,140],[85,170]);for(let k=0;k<5;k++)R4(-130+k*30,70,14,10);break;
    case 'willis':for(const [a,w,h] of[[-60,40,300],[-20,40,360],[20,40,330],[60,30,240]])R4(a,0,w,h);R4(-12,360,3,60);R4(8,360,3,50);R4(140,0,50,190);R4(-160,0,60,220);break;
    case 'basilica':R4(-120,0,240,90);tri([-50,90],[50,90],[0,250]);R4(-4,250,8,24);break;
    case 'gateway':R4(-110,0,220,120);dome(-70,120,22);dome(70,120,22);dome(0,120,36);
      cx.fillStyle=rgb(mix(p.hor,p.haze,.4));cx.beginPath();cx.moveTo(x-34*S,b);cx.lineTo(x-34*S,b-62*S);cx.arc(x,b-62*S,34*S,Math.PI,0);cx.lineTo(x+34*S,b);cx.fill();break;
  }
  cx.restore();
}

/* ---------- rooftop decor: painted in the midground's own colours, so it reads as scenery ---------- */
const DECOR={
  city:['ac','vent','antenna','dish','tower','rail','hut','pipes','crates','billboard'],
  water:['bollard','post','crates','lamp','mast','rail'],
  forest:['pine','oak','bush','fence','lamp'],
  sand:['palm','rock','tent','dome','post'],
  snow:['pine','rock','cabin','fence']};
const SKYX={london:['chimney','chimney','ac'],paris:['chimney','mansard'],tokyo:['billboard','billboard','ac'],newyork:['tower','tower','vent'],
  stone:['dome','arch'],colonnade:['arch','dome'],city:['billboard','tower']};
V.decorFor=function(onRoof,rn){
  const L=R.LOC[R.locI],gr=L.ground,sty=styleOf();
  if(sty==='village'){const vl=['boat','nets','reeds','rock','olive','post','boat'];return vl[rn()*vl.length|0]}
  if(sty==='canyon'){const cl=['rock','cactus','post','rock'];return cl[rn()*cl.length|0]}
  const base=gr==='water'?DECOR.water:gr==='forest'?DECOR.forest:gr==='sand'?DECOR.sand:gr==='snow'?DECOR.snow:DECOR.city;
  const list=base.concat(SKYX[L.sky]||[]);
  let k=list[rn()*list.length|0];
  if(onRoof&&(k==='tower'||k==='oak'||k==='pine'||k==='palm'))k=gr==='forest'||gr==='snow'?'bush':'ac';
  return k;
};
V.fill=function(x0,x1,rn){
  const S=R.S,span=x1-x0;if(span<160*S)return;
  const n=span>520*S?2:1;
  for(let i=0;i<n;i++){
    const x=x0+80*S+(span-160*S)*(n===1?rn():(i+rn()*.8)/n);
    J.add({k:'decor',x,base:0,kind:V.decorFor(false,rn),seed:rn()});
  }
  if(rn()<.16)J.add({k:'decor',x:x0+span*.5,base:0,kind:'crane',seed:rn()});
};
function drawDecor(cx,it,gy,S,p){
  const x=it.x;if(x<-260*S||x>R.W+260*S)return;
  const y=gy-(it.base||0),sd=it.seed||.5,k=it.kind;
  const body=mix(p.sh,p.mid,.25),dark=mix(p.sh,[20,20,30],.35),hi=mix(p.mid,p.sun,.35);
  cx.save();cx.fillStyle=rgb(body);cx.strokeStyle=rgb(body);
  const box=(bx,by,bw,bh)=>cx.fillRect(x+bx*S,y-(by+bh)*S,bw*S,bh*S);
  const line=(x1,y1,x2,y2,lw)=>{cx.lineWidth=(lw||2)*S;cx.beginPath();cx.moveTo(x+x1*S,y-y1*S);cx.lineTo(x+x2*S,y-y2*S);cx.stroke()};
  const tri=(a,b,c)=>{cx.beginPath();cx.moveTo(x+a[0]*S,y-a[1]*S);cx.lineTo(x+b[0]*S,y-b[1]*S);cx.lineTo(x+c[0]*S,y-c[1]*S);cx.closePath();cx.fill()};
  const circ=(cxx,cyy,r)=>{cx.beginPath();cx.arc(x+cxx*S,y-cyy*S,r*S,0,6.283);cx.fill()};
  const edge=(bx,by,bw)=>{cx.fillStyle=rgb(hi);box(bx,by,bw,1.4);cx.fillStyle=rgb(body)};
  switch(k){
    case 'ac':box(-26,4,52,34);box(-22,0,4,4);box(18,0,4,4);edge(-26,37,52);
      cx.strokeStyle=rgb(dark);cx.lineWidth=1.6*S;cx.beginPath();cx.arc(x+8*S,y-21*S,11*S,0,6.283);cx.stroke();
      for(let a=0;a<3;a++){cx.beginPath();cx.moveTo(x+8*S,y-21*S);cx.lineTo(x+8*S+Math.cos(a*2.1+R.t*6)*10*S,y-21*S+Math.sin(a*2.1+R.t*6)*10*S);cx.stroke()}
      cx.fillStyle=rgb(dark);for(let r=0;r<4;r++)box(-22,10+r*6,14,2);break;
    case 'vent':box(-4,0,8,34);box(-12,34,24,7);edge(-12,40,24);break;
    case 'antenna':line(0,0,0,120,3);line(-16,92,16,92,2);line(-11,106,11,106,2);line(-20,72,20,72,2);break;
    case 'dish':box(-3,0,6,30);cx.beginPath();cx.ellipse(x+4*S,y-44*S,20*S,9*S,-.5,0,6.283);cx.fill();line(4,44,22,58,1.5);break;
    case 'tower':for(const lx of[-24,-10,10,24])line(lx,0,lx*.8,92,3);line(-24,30,24,62,1.6);line(24,30,-24,62,1.6);
      box(-30,92,60,64);cx.fillStyle=rgb(dark);for(let r=0;r<4;r++)box(-30,100+r*14,60,1.6);cx.fillStyle=rgb(body);tri([-34,156],[34,156],[0,180]);break;
    case 'rail':box(-90,26,180,3);for(let i=-90;i<=90;i+=22)box(i,0,3,28);break;
    case 'hut':box(-30,0,60,58);box(-34,58,68,5);edge(-34,62,68);cx.fillStyle=rgb(dark);box(-10,0,20,40);break;
    case 'pipes':box(-60,8,120,7);box(-60,22,120,6);for(const px of[-50,0,50])box(px,0,6,30);break;
    case 'crates':box(-36,0,34,34);box(-1,0,34,34);box(-20,34,34,30);cx.strokeStyle=rgb(dark);cx.lineWidth=1.2*S;
      cx.beginPath();for(const [bx,by] of[[-36,0],[-1,0],[-20,34]]){cx.moveTo(x+bx*S,y-by*S);cx.lineTo(x+(bx+34)*S,y-(by+32)*S)}cx.stroke();break;
    case 'billboard':box(-46,0,6,74);box(40,0,6,74);box(-62,74,124,62);
      if(R.LOC[R.locI].sky==='tokyo'||p.night>.4){cx.fillStyle=`rgba(255,${120+(sd*100|0)},${180+(sd*60|0)},.65)`;box(-56,80,112,50)}else{cx.fillStyle=rgb(hi);box(-56,80,112,50)}break;
    case 'chimney':box(-14,0,28,56);box(-18,56,36,6);box(-10,62,7,14);box(3,62,7,12);edge(-18,61,36);break;
    case 'mansard':cx.beginPath();cx.moveTo(x-70*S,y);cx.lineTo(x-56*S,y-60*S);cx.lineTo(x+56*S,y-60*S);cx.lineTo(x+70*S,y);cx.closePath();cx.fill();
      cx.fillStyle=rgb(hi);for(const wx of[-36,-6,24])box(wx,20,14,22);break;
    case 'dome':box(-34,0,68,40);cx.beginPath();cx.arc(x,y-40*S,34*S,Math.PI,0);cx.fill();line(0,74,0,92,2.4);break;
    case 'arch':box(-80,0,160,70);cx.fillStyle=rgb(p.haze,.8);for(const ax of[-54,-14,26]){cx.beginPath();cx.moveTo(x+ax*S,y);cx.lineTo(x+ax*S,y-38*S);cx.arc(x+(ax+14)*S,y-38*S,14*S,Math.PI,0);cx.lineTo(x+(ax+28)*S,y);cx.closePath();cx.fill()}break;
    case 'bollard':box(-7,0,14,30);box(-10,30,20,6);break;
    case 'post':box(-5,0,10,70);break;
    case 'lamp':box(-2,0,4,96);box(-2,94,26,3);box(18,84,10,10);
      if(p.night>.3){cx.fillStyle=rgb(p.lit,.7);circ(23,86,8)}break;
    case 'mast':line(0,0,0,150,3);line(0,140,46,40,1.2);line(0,140,-40,40,1.2);break;
    case 'pine':box(-4,0,8,26);tri([-34,22],[34,22],[0,80]);tri([-26,56],[26,56],[0,110]);tri([-18,90],[18,90],[0,136]);break;
    case 'oak':box(-6,0,12,46);circ(0,70,34);circ(-28,56,22);circ(28,58,24);break;
    case 'bush':circ(-14,14,16);circ(10,16,20);circ(28,10,12);break;
    case 'fence':box(-80,20,160,4);box(-80,8,160,4);for(let i=-80;i<=80;i+=20)box(i,0,4,30);break;
    case 'palm':cx.lineWidth=7*S;cx.beginPath();cx.moveTo(x,y);cx.quadraticCurveTo(x+18*S,y-60*S,x+8*S,y-120*S);cx.stroke();
      for(let i=0;i<6;i++){const a=-Math.PI*.95+i*.38;cx.lineWidth=4*S;cx.beginPath();cx.moveTo(x+8*S,y-120*S);cx.quadraticCurveTo(x+8*S+Math.cos(a)*30*S,y-130*S+Math.sin(a)*10*S,x+8*S+Math.cos(a)*56*S,y-104*S+Math.sin(a)*24*S);cx.stroke()}break;
    case 'rock':cx.beginPath();cx.moveTo(x-40*S,y);cx.lineTo(x-26*S,y-30*S);cx.lineTo(x+4*S,y-40*S);cx.lineTo(x+34*S,y-18*S);cx.lineTo(x+42*S,y);cx.closePath();cx.fill();break;
    case 'tent':tri([-46,0],[46,0],[0,56]);line(0,56,0,70,2);break;
    case 'cabin':box(-44,0,88,48);tri([-52,48],[52,48],[0,84]);box(20,62,10,24);break;
    case 'boat':cx.beginPath();cx.moveTo(x-50*S,y-14*S);cx.lineTo(x+50*S,y-14*S);cx.lineTo(x+40*S,y);cx.lineTo(x-42*S,y);cx.closePath();cx.fill();line(0,14,0,90,2);
      cx.globalAlpha=.8;tri([2,86],[42,22],[2,22]);cx.globalAlpha=1;break;
    case 'nets':line(-40,0,-40,60,2.4);line(40,0,40,60,2.4);line(-40,58,40,58,1.6);cx.globalAlpha=.55;cx.lineWidth=.8*S;cx.beginPath();
      for(let i=-40;i<=40;i+=8){cx.moveTo(x+i*S,y-58*S);cx.lineTo(x+(i+6)*S,y-4*S)}for(let j=8;j<58;j+=8){cx.moveTo(x-40*S,y-j*S);cx.lineTo(x+40*S,y-j*S)}cx.stroke();cx.globalAlpha=1;break;
    case 'reeds':cx.lineWidth=1.6*S;cx.beginPath();for(let i=-30;i<=30;i+=6){const hh=36+((i*7+sd*50)%30);cx.moveTo(x+i*S,y);cx.quadraticCurveTo(x+(i+4)*S,y-hh*.6*S,x+(i+8)*S,y-hh*S)}cx.stroke();break;
    case 'olive':box(-3,0,6,30);circ(0,44,22);circ(-18,36,14);circ(18,38,15);break;
    case 'cactus':box(-5,0,10,64);box(-20,26,8,26);box(-20,26,20,6);box(12,34,8,22);box(5,34,15,6);break;
  }
  cx.restore();
}
})();
