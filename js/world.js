/* Rain of the Word — world: the V2 places this project lacked.
   4 fantasy places (Rooftop Bowl, Midnight Harbor, Lantern Temple, Canyon Highway) and
   6 real cities with landmarks (Rio, Cape Town, Sydney, Dubai, Rome, Jerusalem).
   London / Paris / Manhattan / Tokyo keep the project's own (animated) versions.
   Registers skyline generators via R.env.GEN / R.env.PAL and appends to R.LOC,
   then defines R.TOUR (World Tour order, London first). */
window.ROW=window.ROW||{};
(function(){
'use strict';
const R=ROW;
const E=R.env;

/* per-place definitions: silhouette colours per layer (far→near) + gameplay data */
const NEW=[
 {n:'Rooftop Bowl',    t:'park',     cols:['#22244a','#171936','#0a0b1e'], ground:'asphalt',  wx:['Clear','Golden Dusk','Drizzle','Storm'],      fogC:[90,85,140],  glow:'255,150,200'},
 {n:'Midnight Harbor', t:'harbor',   cols:['#1a2c44','#112036','#06101e'], ground:'water',    wx:['Storm','Downpour','Fog','Drizzle'],           fogC:[70,100,140], glow:'255,170,110'},
 {n:'Lantern Temple',  t:'pagoda',   cols:['#3a1e2e','#2a1422','#140810'], ground:'flagstone',wx:['Snowfall','Fog','Drizzle','Clear'],           fogC:[130,95,120], glow:'255,140,90'},
 {n:'Canyon Highway',  t:'canyon',   cols:['#5a2e22','#3e1e16','#1c0c08'], ground:'asphalt',  wx:['Heatwave','Sunlit','Golden Dusk','Sandstorm'],fogC:[200,140,100],glow:'255,180,110'},
 {n:'Rio de Janeiro',  t:'rio',      real:1, cols:['#3a4a5a','#2a3448','#141a26'], ground:'sand',     wx:['Sunlit','Golden Dusk','Drizzle','Storm'],  fogC:[150,170,190],glow:'255,200,140'},
 {n:'Cape Town',       t:'cape',     real:1, cols:['#3a3446','#2a2438','#141020'], ground:'flagstone',wx:['Sunlit','Golden Dusk','Fog','Tempest'],     fogC:[160,160,180],glow:'255,190,130'},
 {n:'Sydney',          t:'sydney',   real:1, cols:['#34486a','#22304e','#0e1426'], ground:'water',    wx:['Sunlit','Clear','Golden Dusk','Storm'],     fogC:[110,140,180],glow:'255,190,140'},
 {n:'Dubai',           t:'dubai',    real:1, cols:['#5a4a44','#3e3030','#1c1414'], ground:'sand',     wx:['Heatwave','Sunlit','Sandstorm','Clear'],    fogC:[210,170,120],glow:'255,200,120'},
 {n:'Rome',            t:'rome',     real:1, cols:['#4a3640','#33242e','#180e16'], ground:'cobble',wx:['Golden Dusk','Sunlit','Clear','Storm'],     fogC:[170,130,120],glow:'255,170,100'},
 {n:'Jerusalem',       t:'jerusalem',real:1, cols:['#5a4a46','#3e3234','#1c1418'], ground:'flagstone',wx:['Sunlit','Golden Dusk','Clear','Fog'],       fogC:[190,160,130],glow:'255,200,130'}
];
const DEFS=[
  {h:[.20,.44],win:.2, wa:.4, par:.012,gap:[2,10], w:[70,150],blur:2.5},
  {h:[.12,.36],win:.3, wa:.7, par:.03, gap:[4,14], w:[60,140],blur:1.2},
  {h:[.08,.26],win:.26,wa:.85,par:.06, gap:[16,60],w:[80,170],blur:0}
];

/* V2 code below uses these short names; they are bound per layer build */
let S=1,H=1,W=1,gy=0,LI=0;
const NEON=R.NEON;
const rnd=R.rnd;
const mkmotes=()=>Array.from({length:6},()=>({u:Math.random(),sp:0.05+Math.random()*0.12,ph:Math.random()*6.3,sz:0.7+Math.random()*1.3}));
const lamps={push:o=>R.lamps.push({x:o.x,y:o.y,ph:o.ph||0,kind:'street',li:LI,motes:mkmotes()})};
const neons={push:n=>R.neons.push(n)};

/* ---- V2 landmark + street-prop painters (verbatim) ---- */
function streetProps(g,T,x,base,col){
  const s=S;
  if(T==='london'&&Math.random()<.25){g.fillStyle='#7a1418';g.fillRect(x,base-26*s,9*s,26*s);g.fillStyle='rgba(255,210,140,.5)';g.fillRect(x+2*s,base-20*s,5*s,9*s)}
  else if(T==='nyc'&&Math.random()<.3){g.fillStyle='#6a5410';g.beginPath();g.roundRect(x,base-11*s,28*s,8*s,3*s);g.fill();g.fillRect(x+6*s,base-16*s,14*s,6*s)}
  else if(T==='tokyo'&&Math.random()<.35){const c=NEON[Math.random()*NEON.length|0];g.save();g.shadowColor=c;g.shadowBlur=10*s;g.fillStyle=c;g.globalAlpha=.7;g.fillRect(x,base-22*s,10*s,20*s);g.restore()}
  else if((T==='rio'||T==='sydney'||T==='dubai')&&Math.random()<.3){g.strokeStyle=col;g.lineWidth=3*s;g.beginPath();g.moveTo(x,base);g.quadraticCurveTo(x+4*s,base-30*s,x+2*s,base-56*s);g.stroke();
    for(let k=0;k<6;k++){const a=-1.57+(k-2.5)*.45;g.lineWidth=2*s;g.beginPath();g.moveTo(x+2*s,base-56*s);g.quadraticCurveTo(x+2*s+Math.cos(a)*16*s,base-56*s+Math.sin(a)*12*s,x+2*s+Math.cos(a)*26*s,base-50*s+Math.sin(a)*14*s);g.stroke()}}
  else if((T==='rome'||T==='jerusalem')&&Math.random()<.3){g.fillRect(x+6*s,base-34*s,3*s,34*s);g.beginPath();g.ellipse(x+7*s,base-36*s,20*s,8*s,0,0,6.283);g.fill()}
  else if(T==='paris'&&Math.random()<.3){g.fillStyle='#5a1a22';g.beginPath();g.moveTo(x,base-22*s);g.lineTo(x+40*s,base-22*s);g.lineTo(x+44*s,base-15*s);g.lineTo(x-4*s,base-15*s);g.fill()}
  g.fillStyle=col;
}
function lmGlow(g,x,y,r,c,a){const rg=g.createRadialGradient(x,y,0,x,y,r);rg.addColorStop(0,c.replace('A',a));rg.addColorStop(1,c.replace('A',0));g.fillStyle=rg;g.fillRect(x-r,y-r,r*2,r*2)}
function drawLandmarks(g,T,li,LW,base,col){
  const s=S,cxL=LW/2;g.save();g.fillStyle=col;g.strokeStyle=col;
  const lit='rgba(255,200,120,A)';
  if(T==='london'&&li===1){
    /* Palace of Westminster */
    const wx0=cxL-260*s,ww=230*s,wh=H*.1;
    g.fillRect(wx0,base-wh,ww,wh);
    for(let q=0;q<ww;q+=13*s){g.beginPath();g.moveTo(q+wx0,base-wh);g.lineTo(q+wx0+3*s,base-wh-14*s);g.lineTo(q+wx0+6*s,base-wh);g.fill()}
    for(let q=0;q<ww;q+=10*s){g.fillStyle='rgba(255,200,120,.35)';g.fillRect(wx0+q+2*s,base-wh+10*s,3*s,wh*.5);g.fillStyle=col}
    /* Victoria Tower */
    const vt=wx0-10*s,vh=H*.25;g.fillRect(vt,base-vh,34*s,vh);
    for(const o of[0,30])g.fillRect(vt+o*s,base-vh-14*s,4*s,14*s);
    /* Big Ben (Elizabeth Tower) */
    const bx=cxL-14*s,bw=28*s,bh=H*.33;
    g.fillRect(bx,base-bh,bw,bh);
    g.fillRect(bx-4*s,base-bh-6*s,bw+8*s,40*s);
    g.fillRect(bx+2*s,base-bh-24*s,bw-4*s,18*s);
    g.beginPath();g.moveTo(bx-1*s,base-bh-24*s);g.lineTo(bx+bw/2,base-bh-70*s);g.lineTo(bx+bw+1*s,base-bh-24*s);g.fill();
    g.fillRect(bx+bw/2-1*s,base-bh-88*s,2*s,20*s);
    for(let q=0;q<5;q++)g.fillRect(bx+3*s+q*5.5*s,base-bh+40*s,2*s,bh-60*s);
    const cy=base-bh+14*s;lmGlow(g,bx+bw/2,cy,40*s,'rgba(255,225,160,A)',.55);
    g.fillStyle='#fff0c4';g.beginPath();g.arc(bx+bw/2,cy,10*s,0,6.283);g.fill();
    g.strokeStyle='#3a2c18';g.lineWidth=1.4*s;g.beginPath();g.moveTo(bx+bw/2,cy);g.lineTo(bx+bw/2,cy-7*s);g.moveTo(bx+bw/2,cy);g.lineTo(bx+bw/2+5*s,cy+2*s);g.stroke();
    g.fillStyle=col;g.strokeStyle=col;
    /* London Eye */
    const ex=cxL+230*s,R=H*.18,ey=base-R-12*s;
    g.lineWidth=3.2*s;g.beginPath();g.arc(ex,ey,R,0,6.283);g.stroke();
    g.lineWidth=1.4*s;g.beginPath();g.arc(ex,ey,R*.94,0,6.283);g.stroke();
    g.lineWidth=.8*s;for(let k=0;k<32;k++){const a=k/32*6.283;g.beginPath();g.moveTo(ex,ey);g.lineTo(ex+Math.cos(a)*R,ey+Math.sin(a)*R);g.stroke()}
    for(let k=0;k<32;k++){const a=k/32*6.283;g.beginPath();g.ellipse(ex+Math.cos(a)*R*1.03,ey+Math.sin(a)*R*1.03,4*s,2.6*s,0,0,6.283);g.fill()}
    g.beginPath();g.arc(ex,ey,6*s,0,6.283);g.fill();
    g.lineWidth=4*s;g.beginPath();g.moveTo(ex,ey);g.lineTo(ex-R*.45,base);g.moveTo(ex,ey);g.lineTo(ex+R*.12,base);g.stroke();
    g.save();g.globalCompositeOperation='lighter';g.strokeStyle='rgba(120,170,255,.35)';g.lineWidth=2*s;g.beginPath();g.arc(ex,ey,R,0,6.283);g.stroke();g.restore();
  }
  if(T==='paris'&&li===1){
    const cx0=cxL,h=H*.56,bw=H*.25;
    g.beginPath();g.moveTo(cx0-bw/2,base);g.quadraticCurveTo(cx0-bw*.16,base-h*.32,cx0-5*s,base-h*.86);
    g.lineTo(cx0+5*s,base-h*.86);g.quadraticCurveTo(cx0+bw*.16,base-h*.32,cx0+bw/2,base);
    g.lineTo(cx0+bw*.3,base);g.quadraticCurveTo(cx0,base-h*.3,cx0-bw*.3,base);g.closePath();g.fill();
    g.fillRect(cx0-bw*.36,base-h*.2,bw*.72,6*s);g.fillRect(cx0-bw*.17,base-h*.46,bw*.34,5*s);
    g.fillRect(cx0-8*s,base-h*.88,16*s,8*s);g.fillRect(cx0-1.5*s,base-h,3*s,h*.13);
    /* golden night illumination lattice */
    g.save();g.beginPath();g.moveTo(cx0-bw/2,base);g.quadraticCurveTo(cx0-bw*.16,base-h*.32,cx0-5*s,base-h*.86);
    g.lineTo(cx0+5*s,base-h*.86);g.quadraticCurveTo(cx0+bw*.16,base-h*.32,cx0+bw/2,base);g.closePath();g.clip();
    g.strokeStyle='rgba(255,196,100,.75)';g.lineWidth=1.1*s;
    for(let q=-h;q<h;q+=9*s){g.beginPath();g.moveTo(cx0-bw,base-q);g.lineTo(cx0+bw,base-q-bw*1.2);g.moveTo(cx0+bw,base-q);g.lineTo(cx0-bw,base-q-bw*1.2);g.stroke()}
    g.restore();
    g.save();g.globalCompositeOperation='lighter';lmGlow(g,cx0,base-h*.4,h*.5,'rgba(255,170,70,A)',.18);g.restore();
    lamps.push({x:cx0,y:base-h*.995,ph:0});
    /* Haussmann mansards & Sacre-Coeur hint */
    const sc=cxL+300*s;g.fillStyle=col;g.fillRect(sc-40*s,base-H*.12,80*s,H*.12);g.beginPath();g.ellipse(sc,base-H*.12,24*s,30*s,0,Math.PI,0);g.fill();
    for(const o of[-34,34]){g.beginPath();g.ellipse(sc+o*s,base-H*.12,9*s,14*s,0,Math.PI,0);g.fill()}
    g.fillRect(sc-1.5*s,base-H*.12-44*s,3*s,14*s);
  }
  if(T==='nyc'&&li===1){
    const ex=cxL-40*s;const tiers=[[90,.2],[70,.12],[52,.12],[36,.05],[22,.03],[10,.03]];let y=base;
    for(const tr of tiers){const w=tr[0]*s,hh=H*tr[1];g.fillRect(ex-w/2,y-hh,w,hh+1);
      g.fillStyle='rgba(255,210,140,.45)';for(let q=-w/2+4*s;q<w/2-3*s;q+=6*s)for(let r=y-hh+4*s;r<y-4*s;r+=7*s)if(Math.random()<.45)g.fillRect(ex+q,r,2.4*s,3*s);g.fillStyle=col;y-=hh}
    g.fillRect(ex-2*s,y-H*.07,4*s,H*.07);g.fillRect(ex-.8*s,y-H*.1,1.6*s,H*.03);
    g.save();g.globalCompositeOperation='lighter';lmGlow(g,ex,y+H*.03,60*s,'rgba(255,90,110,A)',.35);lmGlow(g,ex,y+H*.08,70*s,'rgba(90,140,255,A)',.25);g.restore();
    /* Chrysler */
    const cxr=cxL+160*s,ch=H*.38;g.fillStyle=col;g.fillRect(cxr-26*s,base-ch,52*s,ch);
    let r0=24*s,yy=base-ch;for(let k=0;k<6;k++){g.beginPath();g.arc(cxr,yy,r0,Math.PI,0);g.fill();
      g.save();g.globalCompositeOperation='lighter';g.strokeStyle='rgba(230,240,255,.5)';g.lineWidth=1*s;g.beginPath();g.arc(cxr,yy,r0-2*s,Math.PI,0);g.stroke();g.restore();
      yy-=r0*.55;r0*=.72}
    g.fillRect(cxr-1*s,yy-H*.07,2*s,H*.07+4*s);
    /* water towers */
    for(const wxp of[cxL-300*s,cxL+320*s]){g.fillRect(wxp,base-H*.2-20*s,18*s,16*s);g.beginPath();g.moveTo(wxp-2*s,base-H*.2-20*s);g.lineTo(wxp+9*s,base-H*.2-30*s);g.lineTo(wxp+20*s,base-H*.2-20*s);g.fill();g.fillRect(wxp+2*s,base-H*.2-4*s,14*s,H*.2+4*s)}
  }
  if(T==='tokyo'&&li===1){
    const cx0=cxL,h=H*.5,bw=H*.2;
    g.save();g.beginPath();g.moveTo(cx0-bw/2,base);g.lineTo(cx0-6*s,base-h*.8);g.lineTo(cx0+6*s,base-h*.8);g.lineTo(cx0+bw/2,base);
    g.lineTo(cx0+bw*.3,base);g.quadraticCurveTo(cx0,base-h*.22,cx0-bw*.3,base);g.closePath();
    const tg=g.createLinearGradient(0,base,0,base-h);tg.addColorStop(0,'#c23a1c');tg.addColorStop(1,'#ff6a3a');g.fillStyle=tg;g.fill();g.clip();
    g.fillStyle='rgba(255,240,230,.85)';for(const f of[.12,.36,.58,.76])g.fillRect(cx0-bw,base-h*f,bw*2,h*.04);
    g.strokeStyle='rgba(255,220,180,.45)';g.lineWidth=.8*s;for(let q=0;q<h;q+=8*s){g.beginPath();g.moveTo(cx0-bw,base-q);g.lineTo(cx0+bw,base-q-bw);g.stroke()}
    g.restore();
    g.fillStyle='#ff7a4a';g.fillRect(cx0-bw*.26,base-h*.36,bw*.52,12*s);g.fillRect(cx0-bw*.1,base-h*.66,bw*.2,7*s);
    g.fillStyle='#ffd0b0';g.fillRect(cx0-1.6*s,base-h,3.2*s,h*.2);
    g.save();g.globalCompositeOperation='lighter';lmGlow(g,cx0,base-h*.45,h*.55,'rgba(255,110,60,A)',.28);g.restore();
    lamps.push({x:cx0,y:base-h,ph:1});
  }
  if(T==='rio'&&li===0){
    /* Corcovado + Christ the Redeemer */
    const kx=cxL-200*s,kh=H*.4;g.beginPath();g.moveTo(kx-260*s,base);g.quadraticCurveTo(kx-80*s,base-kh*.5,kx-12*s,base-kh);g.lineTo(kx+12*s,base-kh);g.quadraticCurveTo(kx+60*s,base-kh*.6,kx+200*s,base);g.fill();
    /* r5: Christ the Redeemer as a robed statue (not a cross): Art-Deco robe tapering to the feet,
       arms outstretched with hanging sleeves, head, plinth on the chapel base */
    const sy=base-kh;g.fillStyle='#e9ecf4';
    const u=s*1.25;
    g.fillRect(kx-7*u,sy-6*u,14*u,6*u);                       /* chapel plinth */
    g.fillRect(kx-4.5*u,sy-12*u,9*u,6*u);
    g.beginPath();                                            /* robe: narrow at feet, broad at shoulders */
    g.moveTo(kx-3.2*u,sy-12*u);g.lineTo(kx-5.2*u,sy-40*u);g.lineTo(kx+5.2*u,sy-40*u);g.lineTo(kx+3.2*u,sy-12*u);g.closePath();g.fill();
    g.beginPath();                                            /* outstretched arms with drooping sleeves */
    g.moveTo(kx-5.2*u,sy-40*u);g.lineTo(kx-26*u,sy-41.5*u);g.lineTo(kx-27*u,sy-38.5*u);
    g.quadraticCurveTo(kx-16*u,sy-35.5*u,kx-5*u,sy-31*u);
    g.lineTo(kx+5*u,sy-31*u);g.quadraticCurveTo(kx+16*u,sy-35.5*u,kx+27*u,sy-38.5*u);
    g.lineTo(kx+26*u,sy-41.5*u);g.lineTo(kx+5.2*u,sy-40*u);g.closePath();g.fill();
    g.beginPath();g.arc(kx,sy-43.5*u,3*u,0,6.283);g.fill();   /* head */
    g.fillStyle='rgba(120,130,150,.45)';                      /* robe fold shading */
    g.fillRect(kx+0.6*u,sy-38*u,1.2*u,25*u);g.fillRect(kx-2.6*u,sy-36*u,0.9*u,22*u);
    g.save();g.globalCompositeOperation='lighter';lmGlow(g,kx,sy-30*u,58*s,'rgba(255,240,210,A)',.42);g.restore();
    /* Sugarloaf */
    g.fillStyle=col;const sx=cxL+250*s,sh=H*.3;
    g.beginPath();g.moveTo(sx-90*s,base);g.bezierCurveTo(sx-80*s,base-sh*1.05,sx+40*s,base-sh*1.15,sx+70*s,base);g.fill();
    g.beginPath();g.moveTo(sx-200*s,base);g.bezierCurveTo(sx-190*s,base-sh*.55,sx-120*s,base-sh*.6,sx-100*s,base);g.fill();
    g.strokeStyle='rgba(220,220,230,.5)';g.lineWidth=.8*s;g.beginPath();g.moveTo(sx-150*s,base-sh*.43);g.lineTo(sx-20*s,base-sh*.84);g.stroke();
  }
  if(T==='cape'&&li===0){
    const x0=cxL-330*s,x1=cxL+180*s,ty=base-H*.34;
    g.beginPath();g.moveTo(x0-120*s,base);g.lineTo(x0-60*s,base-H*.18);g.lineTo(x0-20*s,base-H*.3);/* Devil's Peak */g.lineTo(x0+10*s,base-H*.4);g.lineTo(x0+40*s,ty);
    for(let q=x0+40*s;q<x1;q+=14*s)g.lineTo(q,ty+rnd(-1.5,1.5)*s);g.lineTo(x1,ty);g.lineTo(x1+50*s,base-H*.2);g.lineTo(x1+110*s,base-H*.12);
    /* Lion's Head */g.quadraticCurveTo(x1+150*s,base-H*.26,x1+175*s,base-H*.27);g.quadraticCurveTo(x1+200*s,base-H*.2,x1+250*s,base-H*.1);g.lineTo(x1+340*s,base-H*.05);g.lineTo(x1+380*s,base);g.closePath();g.fill();
    g.save();g.globalAlpha=.16;g.fillStyle='#ffd0a0';for(let q=0;q<9;q++)g.fillRect(x0+60*s+q*48*s,ty+8*s,2*s,H*.25);g.restore();
    /* table-cloth cloud */
    g.save();for(let q=0;q<26;q++){const cx1=x0+40*s+q*(x1-x0-40*s)/26;const rg=g.createRadialGradient(cx1,ty-2*s,0,cx1,ty-2*s,26*s);rg.addColorStop(0,'rgba(240,240,250,.42)');rg.addColorStop(1,'rgba(240,240,250,0)');g.fillStyle=rg;g.fillRect(cx1-26*s,ty-28*s,52*s,52*s)}g.restore();
  }
  if(T==='sydney'&&li===1){
    /* Harbour Bridge */
    const b0=cxL+40*s,b1=cxL+380*s,dk=base-H*.07,ap=base-H*.22;
    g.fillRect(b0-26*s,base-H*.14,24*s,H*.14);g.fillRect(b1+2*s,base-H*.14,24*s,H*.14);
    g.lineWidth=5*s;g.beginPath();g.moveTo(b0,dk);g.quadraticCurveTo((b0+b1)/2,ap-H*.12,b1,dk);g.stroke();
    g.lineWidth=3*s;g.beginPath();g.moveTo(b0,dk-H*.03);g.quadraticCurveTo((b0+b1)/2,ap-H*.18,b1,dk-H*.03);g.stroke();
    g.fillRect(b0-60*s,dk,b1-b0+120*s,4*s);
    g.lineWidth=1.2*s;for(let q=1;q<16;q++){const u=q/16,x=b0+(b1-b0)*u,y=dk-(1-(2*u-1)**2)*(dk-(ap-H*.06))*1.0;g.beginPath();g.moveTo(x,dk);g.lineTo(x,y);g.stroke()}
    /* Opera House */
    const ox=cxL-330*s,bp=base-14*s;g.fillRect(ox-20*s,bp,260*s,14*s);
    const shell=(x0,ws,hs,c)=>{g.fillStyle=c;g.beginPath();g.moveTo(x0,bp);g.quadraticCurveTo(x0+ws*.12,bp-hs*.95,x0+ws*.62,bp-hs);g.quadraticCurveTo(x0+ws*.5,bp-hs*.4,x0+ws*.55,bp);g.closePath();g.fill()};
    const cA='#e8e2d2',cB='#c9c2b2';
    [[0,70,58],[40,80,74],[95,70,60],[150,58,46],[195,46,34]].forEach((p,i)=>shell(ox+p[0]*s,p[1]*s,p[2]*s,i%2?cB:cA));
    [[60,50,44],[130,44,36]].forEach(p=>shell(ox+p[0]*s,p[1]*s,p[2]*s,cB));
    g.fillStyle=col;
  }
  if(T==='dubai'&&li===1){
    const bx=cxL,hT=H*.74;let y=base,w=96*s;
    for(let k=0;k<11;k++){const hh=hT*.07;g.fillRect(bx-w/2+(k%2?3*s:-3*s)*(k>2?1:0),y-hh,w,hh+1);y-=hh;w*=.85}
    g.beginPath();g.moveTo(bx-w/2,y);g.lineTo(bx,y-hT*.25);g.lineTo(bx+w/2,y);g.fill();
    g.save();g.globalCompositeOperation='lighter';const lg=g.createLinearGradient(0,base,0,y);lg.addColorStop(0,'rgba(140,190,255,.35)');lg.addColorStop(1,'rgba(140,190,255,0)');g.fillStyle=lg;g.fillRect(bx-2*s,y,4*s,base-y);g.restore();
    lamps.push({x:bx,y:y-hT*.24,ph:2});
    /* twisted Cayan-like tower + Emirates-style twin */
    g.fillStyle=col;const t2=cxL-260*s;g.beginPath();g.moveTo(t2,base);g.lineTo(t2+4*s,base-H*.32);g.lineTo(t2+20*s,base-H*.4);g.lineTo(t2+36*s,base-H*.32);g.lineTo(t2+40*s,base);g.fill();
    const t3=cxL+220*s;g.beginPath();g.moveTo(t3,base);g.lineTo(t3,base-H*.34);g.lineTo(t3+38*s,base-H*.42);g.lineTo(t3+38*s,base);g.fill();
  }
  if(T==='rome'&&li===1){
    const cx0=cxL-60*s,wC=300*s,hC=H*.17,x0=cx0-wC/2;
    /* broken outer ring profile */
    g.beginPath();g.moveTo(x0,base);g.lineTo(x0,base-hC);g.lineTo(x0+wC*.55,base-hC);g.lineTo(x0+wC*.62,base-hC*.82);g.lineTo(x0+wC*.75,base-hC*.75);g.lineTo(x0+wC*.85,base-hC*.55);g.lineTo(x0+wC,base-hC*.5);g.lineTo(x0+wC,base);g.closePath();
    g.fillStyle='#4a3424';g.fill();g.save();g.clip();
    const rows=3,n=16,rh=hC*.26;
    for(let r=0;r<rows;r++)for(let q=0;q<n;q++){const ax=x0+(q+.5)*wC/n,ay=base-r*rh-6*s,aw=wC/n*.55,ah=rh*.66;
      g.fillStyle='rgba(255,170,80,.7)';g.beginPath();g.moveTo(ax-aw/2,ay);g.lineTo(ax-aw/2,ay-ah+aw/2);g.arc(ax,ay-ah+aw/2,aw/2,Math.PI,0);g.lineTo(ax+aw/2,ay);g.fill()}
    for(let q=0;q<n*2;q++){g.fillStyle='rgba(255,170,80,.45)';g.fillRect(x0+(q+.4)*wC/(n*2),base-hC+6*s,wC/(n*2)*.3,8*s)}
    g.fillStyle='rgba(0,0,0,.25)';for(let r=1;r<=3;r++)g.fillRect(x0,base-r*rh-2*s,wC,2*s);
    g.restore();g.fillStyle=col;
    g.save();g.globalCompositeOperation='lighter';lmGlow(g,cx0,base-hC*.5,wC*.6,'rgba(255,150,60,A)',.15);g.restore();
  }
  if(T==='rome'&&li===0){
    const dx=cxL+330*s,dy=base-H*.2;g.fillRect(dx-70*s,dy,140*s,H*.2);g.fillRect(dx-34*s,dy-24*s,68*s,24*s);
    g.beginPath();g.ellipse(dx,dy-24*s,34*s,44*s,0,Math.PI,0);g.fill();g.fillRect(dx-5*s,dy-78*s,10*s,12*s);g.fillRect(dx-1*s,dy-90*s,2*s,12*s);
  }
  if(T==='jerusalem'&&li===1){
    /* Old City walls with crenellations */
    const wy=base-42*s;g.fillRect(-40,wy,LW+80,46*s);
    for(let q=-40;q<LW+40;q+=12*s)g.fillRect(q,wy-8*s,7*s,8*s);
    g.fillStyle='rgba(0,0,0,.18)';for(let q=-40;q<LW+40;q+=24*s)g.fillRect(q,wy+8*s,1*s,30*s);g.fillStyle=col;
    /* Damascus-style gate */
    const gx=cxL-120*s;g.fillRect(gx-30*s,wy-26*s,60*s,26*s);g.fillStyle='rgba(255,190,110,.55)';g.beginPath();g.moveTo(gx-9*s,base);g.lineTo(gx-9*s,wy+6*s);g.arc(gx,wy+6*s,9*s,Math.PI,0);g.lineTo(gx+9*s,base);g.fill();g.fillStyle=col;
    /* Tower of David */
    const td=cxL-300*s;g.fillRect(td,wy-H*.16,30*s,H*.16);g.fillRect(td-3*s,wy-H*.16-6*s,36*s,6*s);g.beginPath();g.ellipse(td+15*s,wy-H*.16-6*s,9*s,12*s,0,Math.PI,0);g.fill();
    /* Dome of the Rock */
    const dx=cxL+60*s,oy=wy-6*s,ow=130*s,oh=34*s;
    g.fillStyle='#2a3a6a';g.fillRect(dx-ow/2,oy-oh,ow,oh);
    g.fillStyle='rgba(120,170,255,.45)';for(let q=0;q<7;q++){const ax=dx-ow/2+10*s+q*(ow-20*s)/6;g.beginPath();g.moveTo(ax-4*s,oy-6*s);g.lineTo(ax-4*s,oy-22*s);g.arc(ax,oy-22*s,4*s,Math.PI,0);g.lineTo(ax+4*s,oy-6*s);g.fill()}
    g.fillStyle='#22305a';g.fillRect(dx-ow/2-3*s,oy-oh-4*s,ow+6*s,4*s);g.fillRect(dx-34*s,oy-oh-20*s,68*s,16*s);
    const dg=g.createLinearGradient(dx-36*s,0,dx+36*s,0);dg.addColorStop(0,'#a8741c');dg.addColorStop(.4,'#ffe08a');dg.addColorStop(.6,'#ffd060');dg.addColorStop(1,'#8a5a10');
    g.fillStyle=dg;g.beginPath();g.moveTo(dx-36*s,oy-oh-20*s);g.bezierCurveTo(dx-38*s,oy-oh-62*s,dx-6*s,oy-oh-70*s,dx,oy-oh-74*s);g.bezierCurveTo(dx+6*s,oy-oh-70*s,dx+38*s,oy-oh-62*s,dx+36*s,oy-oh-20*s);g.closePath();g.fill();
    g.fillStyle='#ffd060';g.fillRect(dx-1*s,oy-oh-86*s,2*s,13*s);g.beginPath();g.arc(dx,oy-oh-88*s,3*s,Math.PI*.2,Math.PI*1.8);g.fill();
    g.save();g.globalCompositeOperation='lighter';lmGlow(g,dx,oy-oh-40*s,90*s,'rgba(255,200,90,A)',.3);g.restore();
    /* bell tower */
    g.fillStyle=col;const bt=cxL+300*s;g.fillRect(bt,wy-H*.18,20*s,H*.18);g.beginPath();g.moveTo(bt-2*s,wy-H*.18);g.lineTo(bt+10*s,wy-H*.18-30*s);g.lineTo(bt+22*s,wy-H*.18);g.fill();
  }
  g.restore();
}

/* ---- V2 layer painter for one place type (verbatim loop body) ---- */
function v2Layer(g,P,df,li,LW,rnd){
  S=R.S;H=R.H;W=R.W;gy=R.gy;LI=li;
  const T=P.t,base=gy+4;
  let x=-40;
    while(x<LW+40){
      const col=P.cols[li];g.fillStyle=col;
      let w=rnd(df.w[0],df.w[1])*S,h=H*rnd(df.h[0],df.h[1]),top=base-h;
      /* --- per-type silhouettes --- */
      if(P.real){
        const nat=T==='rio'||T==='cape';
        if(li===2&&T==='jerusalem'){streetProps(g,T,x,base,col);if(Math.random()<.3){g.fillRect(x+20*S,base-60*S,3*S,60*S);lamps.push({x:x+21*S,y:base-60*S,ph:rnd(0,6.3)})}x+=rnd(60,120)*S;continue;}
        if(li===2){const sw=rnd(40,90)*S,sh=rnd(16,34)*S;g.fillRect(x,base-sh,sw,sh);
          g.fillStyle='rgba(255,196,110,.45)';g.fillRect(x+5*S,base-sh+5*S,sw*.5,sh*.45);g.fillStyle=col;
          streetProps(g,T,x+sw+4*S,base,col);
          if(Math.random()<.3){const lx=x+sw+2*S,ph=rnd(70,100)*S;g.fillRect(lx,base-ph,3*S,ph);g.fillRect(lx,base-ph,12*S,2.5*S);lamps.push({x:lx+12*S,y:base-ph+3*S,ph:rnd(0,6.3)})}
          x+=sw+rnd(14,50)*S;continue;}
        if(nat&&li===0){x+=w;continue;}
        h*=T==='dubai'?(li?.45:.6):(T==='nyc'||T==='tokyo')?(li?.9:1.05):(nat?.35:li?.5:.6);top=base-h;
        g.fillRect(x,top,w,h+6);
        if(T==='paris'||T==='london'){g.beginPath();g.moveTo(x-2*S,top);g.lineTo(x+6*S,top-12*S);g.lineTo(x+w-6*S,top-12*S);g.lineTo(x+w+2*S,top);g.fill()}
        if(T==='tokyo'&&li>0&&Math.random()<.6){const n={x:x+w*rnd(.3,.7),y:top+rnd(10,h*.4),w:rnd(5,9)*S,h:rnd(30,80)*S,c:NEON[Math.random()*NEON.length|0],ph:Math.random()*6.3,li};
          g.save();g.shadowColor=n.c;g.shadowBlur=16*S;g.fillStyle=n.c;g.fillRect(n.x-n.w/2,n.y,n.w,n.h);g.restore();neons.push(n);}
      } else if(T==='park'){
        if(li===2){
          /* quarter pipes, rails, chain-link fence */
          const rw=rnd(70,130)*S,rh=rnd(40,80)*S;
          if(Math.random()<.5){
            g.beginPath();g.moveTo(x,base);g.lineTo(x,base-rh);g.quadraticCurveTo(x,base,x+rw,base);g.closePath();g.fill();
            g.fillRect(x-4*S,base-rh-4*S,rw*.35,4*S);
            g.save();g.strokeStyle='rgba(255,180,90,.5)';g.lineWidth=1.5*S;g.beginPath();g.moveTo(x-4*S,base-rh-4*S);g.lineTo(x+rw*.35-4*S,base-rh-4*S);g.stroke();g.restore();
          } else {
            g.save();g.strokeStyle=col;g.lineWidth=1*S;g.globalAlpha=.8;
            for(let fx=0;fx<rw;fx+=8*S){g.beginPath();g.moveTo(x+fx,base);g.lineTo(x+fx+8*S,base-46*S);g.moveTo(x+fx+8*S,base);g.lineTo(x+fx,base-46*S);g.stroke()}
            g.restore();g.fillRect(x,base-48*S,rw,3*S);
            g.fillRect(x+rw*.3,base-16*S,rw*.5,3*S);g.fillRect(x+rw*.35,base-16*S,3*S,16*S);g.fillRect(x+rw*.75,base-16*S,3*S,16*S);
          }
          if(Math.random()<.35){const lx=x+rw*.5,ph=rnd(90,130)*S;g.fillRect(lx,base-ph,3*S,ph);lamps.push({x:lx+1.5*S,y:base-ph,ph:rnd(0,6.3)})}
          x+=rw+rnd(10,40)*S;continue;
        }
        g.fillRect(x,top,w,h+6);
        if(Math.random()<.3){g.fillRect(x+w*.1,top-24*S,w*.25,24*S);g.fillRect(x+w*.1-4*S,top-30*S,w*.25+8*S,6*S)}
        if(li===1&&Math.random()<.4){const n={x:x+w*rnd(.3,.7),y:top+rnd(10,h*.3),w:rnd(16,30)*S,h:rnd(5,9)*S,
          c:NEON[Math.random()*NEON.length|0],ph:Math.random()*6.3,li};
          g.save();g.shadowColor=n.c;g.shadowBlur=14*S;g.fillStyle=n.c;g.fillRect(n.x-n.w/2,n.y,n.w,n.h);g.restore();neons.push(n);}
      } else if(T==='harbor'){
        if(li===1&&Math.random()<.45){
          /* gantry crane */
          const ch=rnd(.3,.46)*H,cw=rnd(90,150)*S;
          g.save();g.strokeStyle=col;g.lineWidth=4*S;g.beginPath();
          g.moveTo(x,base);g.lineTo(x+8*S,base-ch);g.moveTo(x+30*S,base);g.lineTo(x+22*S,base-ch);
          g.moveTo(x-cw*.3,base-ch);g.lineTo(x+cw,base-ch);g.stroke();
          g.lineWidth=1.4*S;for(let q=0;q<6;q++){g.beginPath();g.moveTo(x+(q%2?8:22)*S,base-ch*q/6);g.lineTo(x+(q%2?22:8)*S,base-ch*(q+1)/6);g.stroke()}
          g.beginPath();g.moveTo(x+cw*.75,base-ch);g.lineTo(x+cw*.75,base-ch*.55);g.stroke();g.restore();
          g.fillRect(x+cw*.75-8*S,base-ch*.55,16*S,10*S);
          lamps.push({x:x+cw,y:base-ch,ph:rnd(0,6.3)});
          x+=cw+rnd(20,60)*S;continue;
        }
        if(li===2){
          /* stacked shipping containers */
          const cw=rnd(60,110)*S,chh=16*S,stack=1+(Math.random()*3|0);
          const CC=['#3a1820','#14303a','#3a2c10','#1e1e3a','#2a3a18'];
          for(let s=0;s<stack;s++){g.fillStyle=CC[Math.random()*CC.length|0];g.fillRect(x+rnd(-6,6)*S,base-chh*(s+1),cw,chh-1);
            g.fillStyle='rgba(0,0,0,.25)';for(let r=0;r<cw;r+=6*S)g.fillRect(x+r,base-chh*(s+1),2*S,chh-1)}
          g.fillStyle=col;
          if(Math.random()<.25)lamps.push({x:x+cw/2,y:base-chh*stack-4*S,ph:rnd(0,6.3)});
          x+=cw+rnd(4,30)*S;continue;
        }
        g.fillRect(x,top+h*.3,w,h*.7+6);top=top+h*.3;h=h*.7;
      } else if(T==='pagoda'){
        if(Math.random()<(li===2?.45:.6)){
          /* tiered pagoda */
          const tiers=li===0?5:3+(Math.random()*2|0),pw=rnd(50,90)*S,th=rnd(16,26)*S;
          let yy=base;
          for(let q=0;q<tiers;q++){const ww=pw*(1-q*.14);
            g.fillRect(x+pw/2-ww*.32,yy-th,ww*.64,th);
            g.beginPath();g.moveTo(x+pw/2-ww*.62,yy-th+2*S);g.quadraticCurveTo(x+pw/2-ww*.4,yy-th-6*S,x+pw/2,yy-th-8*S);
            g.quadraticCurveTo(x+pw/2+ww*.4,yy-th-6*S,x+pw/2+ww*.62,yy-th+2*S);g.closePath();g.fill();
            if(li>0&&Math.random()<.35)lamps.push({x:x+pw/2+ww*.55,y:yy-th+6*S,ph:rnd(0,6.3)});
            yy-=th+6*S;}
          g.fillRect(x+pw/2-1.5*S,yy-24*S,3*S,24*S);
          x+=pw+rnd(20,70)*S;continue;
        } else {
          /* bamboo grove */
          const n=3+(Math.random()*5|0);
          for(let q=0;q<n;q++){const bh=rnd(.15,.4)*H,bx0=x+q*rnd(6,12)*S;
            g.fillRect(bx0,base-bh,3*S,bh);
            for(let s=1;s<6;s++)g.fillRect(bx0-1*S,base-bh*s/6,5*S,1.5*S);
            g.beginPath();g.ellipse(bx0+8*S,base-bh+4*S,10*S,2.5*S,-.4,0,6.283);g.fill();}
          x+=n*10*S+rnd(20,50)*S;continue;
        }
      } else if(T==='canyon'){
        if(li<2){
          /* mesas */
          w*=1.8;h*=li?.7:1.0;top=base-h;
          g.beginPath();g.moveTo(x,base);g.lineTo(x+w*.12,top+h*.08);g.lineTo(x+w*.1,top);g.lineTo(x+w*.9,top);
          g.lineTo(x+w*.88,top+h*.1);g.lineTo(x+w,base);g.closePath();g.fill();
          g.save();g.globalAlpha=.18;g.fillStyle='#ffb070';
          for(let s=1;s<4;s++)g.fillRect(x+w*.12,top+h*s/4,w*.76,2*S);g.restore();
          x+=w*rnd(.7,1.1);continue;
        } else {
          if(Math.random()<.4){/* highway sign */
            const sw=rnd(50,80)*S,sh2=rnd(70,100)*S;
            g.fillRect(x,base-sh2,3*S,sh2);g.fillRect(x+sw,base-sh2,3*S,sh2);
            g.fillStyle='#103a24';g.fillRect(x-4*S,base-sh2-22*S,sw+11*S,24*S);
            g.fillStyle='rgba(255,255,255,.6)';g.fillRect(x+4*S,base-sh2-14*S,sw*.7,2*S);g.fillRect(x+4*S,base-sh2-8*S,sw*.45,2*S);
            g.fillStyle=col;
          } else if(Math.random()<.5){
            const bx0=x+10*S,cw=8*S,chh=rnd(26,50)*S;
            g.fillRect(bx0,base-chh,cw,chh);g.fillRect(bx0-7*S,base-chh*.6,7*S,4*S);g.fillRect(bx0-7*S,base-chh*.6-10*S,4*S,12*S);
          } else {
            const lx=x,ph=rnd(100,150)*S;g.fillRect(lx,base-ph,3*S,ph);g.fillRect(lx,base-ph,22*S,3*S);
            lamps.push({x:lx+22*S,y:base-ph+3*S,ph:rnd(0,6.3)});
          }
          x+=rnd(80,160)*S;continue;
        }
      }

      /* windows (only for built structures) */
      const cols=Math.max(2,Math.round(w/(22*S))),rows=Math.max(3,Math.round(h/(26*S))),
            cw=(w-14*S)/cols,ch=(h-18*S)/rows,
            wp=df.win*((T==='city'||T==='park'||T==='harbor'||P.real)?1:.55);
      for(let r=0;r<rows;r++)for(let q=0;q<cols;q++)if(Math.random()<wp){
        g.globalAlpha=df.wa*(.35+Math.random()*.65);
        g.fillStyle=(Math.random()<.72||T!=='city')?'#ffc46e':'#7fe8e3';
        g.fillRect(x+7*S+q*cw,top+9*S+r*ch,Math.max(2,cw-6*S),Math.max(2,ch-8*S));
      }
      g.globalAlpha=1;
      if(T==='city'&&li>0&&Math.random()<.45){
        const n={x:x+w*rnd(.3,.7),y:top+rnd(16,h*.4),w:rnd(5,10)*S,h:rnd(34,90)*S,
                 c:NEON[Math.random()*NEON.length|0],ph:Math.random()*6.3,li};
        g.save();g.shadowColor=n.c;g.shadowBlur=16*S;g.fillStyle=n.c;
        g.fillRect(n.x-n.w/2,n.y,n.w,n.h);g.restore();neons.push(n);
      }
      x+=w+rnd(df.gap[0],df.gap[1])*S;
    }
  if(P.real){g.fillStyle=P.cols[li];drawLandmarks(g,T,li,LW,base,P.cols[li]);}
}

/* ---- register with env.js ---- */
NEW.forEach(P=>{
  E.PAL[P.t]=DEFS.map((d,li)=>Object.assign({col:P.cols[li]},d));
  E.GEN[P.t]=function(g,df,li,LW,rnd){v2Layer(g,P,df,li,LW,rnd)};
  R.LOC.push({n:P.n,ground:P.ground,sky:P.t,wx:P.wx,fogC:P.fogC,glow:P.glow,real:!!P.real,v2:1});
});
/* every weather a place names must exist */
R.LOC.forEach(L=>L.wx.forEach(n=>{if(R.wxIdx(n)===0&&n!==R.WXN[0].n)console.warn('unknown weather',n,L.n)}));

/* World Tour: London first, then interleave cities / fantasy / original places */
const ix=n=>R.LOC.findIndex(L=>L.n===n);
R.TOUR=['Westminster, London','Sea of Galilee','Paris','Rooftop Bowl','Manhattan, New York','Old City Street',
  'Tokyo','Midnight Harbor','Rio de Janeiro','Temple Court','Cape Town','Lantern Temple','Sydney','Cedar Forest',
  'Dubai','Canyon Highway','Rome','Judean Desert','Jerusalem','Mount Hermon','Neon Harbor'].map(ix);
if(R.TOUR.some(i=>i<0)||R.TOUR.length!==R.LOC.length)console.error('TOUR mismatch');
})();
