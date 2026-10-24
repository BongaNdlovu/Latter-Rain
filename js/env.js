/* Rain of the Word — env: sky, per-location skylines (form-shaded, rim-lit, detailed),
   god rays (sun & lightning), volumetric lamp cones, anamorphic flares,
   living details: birds, blinking antennas, chimney smoke, sweeping searchlight */
window.ROW=window.ROW||{};
(function(){
'use strict';
const R=ROW;
const E=R.env={};

/* lighten (+) / darken (−) a hex colour by amt */
const shade=(col,amt)=>{
  const n=parseInt(col.slice(1),16);
  return `rgb(${R.clamp((n>>16&255)+amt,0,255)},${R.clamp((n>>8&255)+amt,0,255)},${R.clamp((n&255)+amt,0,255)})`;
};

const mkmotes=()=>Array.from({length:6},()=>({u:Math.random(),sp:0.05+Math.random()*0.12,ph:Math.random()*6.3,sz:0.7+Math.random()*1.3}));

/* per-skytype layer definitions: colour, height range, parallax, blur (distance haze) */
const PAL={
city:[{col:'#181f46',h:[.20,.44],win:.2,wa:.4,par:.012,gap:[2,10],w:[70,150],blur:2.5},
      {col:'#0f1434',h:[.12,.36],win:.3,wa:.7,par:.03,gap:[4,14],w:[60,140],blur:1.2},
      {col:'#080a1f',h:[.08,.26],win:.26,wa:.85,par:.06,gap:[16,60],w:[80,170],blur:0}],
hills:[{col:'#1c3050',h:[.34,.52],par:.012,blur:2.5},
       {col:'#12233c',h:[.22,.38],par:.03,blur:1.2},
       {col:'#0a1626',h:[.10,.22],par:.06,blur:0}],
stone:[{col:'#2a2440',h:[.20,.42],win:.34,wa:.55,par:.012,gap:[8,24],w:[80,170],blur:2.5},
       {col:'#1c1830',h:[.14,.34],win:.4,wa:.7,par:.03,gap:[6,20],w:[70,150],blur:1.2},
       {col:'#121020',h:[.10,.28],win:.42,wa:.85,par:.06,gap:[10,34],w:[80,160],blur:0}],
colonnade:[{col:'#241f3a',h:[.34,.5],par:.012,blur:2.5},
       {col:'#181430',h:[.24,.4],par:.03,blur:1.2},
       {col:'#0e0c1e',h:[.16,.3],par:.06,blur:0}],
forest:[{col:'#16281e',h:[.34,.54],par:.012,blur:2.5},
       {col:'#0e1c14',h:[.24,.42],par:.03,blur:1.2},
       {col:'#070f0b',h:[.14,.3],par:.06,blur:0}],
mesa:[{col:'#3a2438',h:[.24,.44],par:.012,blur:2.5},
       {col:'#2a1830',h:[.16,.34],par:.03,blur:1.2},
       {col:'#1a0f22',h:[.10,.26],par:.06,blur:0}],
alpine:[{col:'#26304e',h:[.3,.5],par:.012,blur:2.5},
       {col:'#1a2240',h:[.2,.38],par:.03,blur:1.2},
       {col:'#101428',h:[.12,.28],par:.06,blur:0}],
london:[{col:'#232c52',h:[.10,.20],par:.012,blur:2.5,gap:[6,20],w:[60,130],win:.18,wa:.5},
       {col:'#171d3e',h:[.08,.16],par:.03,blur:1.2,gap:[4,16],w:[50,120],win:.22,wa:.6},
       {col:'#0e1228',h:[.06,.13],par:.06,blur:0,gap:[8,24],w:[60,140],win:.26,wa:.7}],
paris:[{col:'#2c2440',h:[.14,.20],par:.012,blur:2.5,gap:[6,18],w:[70,150],win:.20,wa:.5},
       {col:'#1e1930',h:[.10,.16],par:.03,blur:1.2,gap:[4,14],w:[60,130],win:.24,wa:.6},
       {col:'#12101f',h:[.07,.13],par:.06,blur:0,gap:[8,22],w:[70,140],win:.28,wa:.7}],
newyork:[{col:'#1a2148',h:[.18,.40],par:.012,blur:2.5,gap:[2,8],w:[60,140],win:.20,wa:.5},
       {col:'#121736',h:[.12,.30],par:.03,blur:1.2,gap:[2,8],w:[50,130],win:.26,wa:.65},
       {col:'#0a0e24',h:[.08,.22],par:.06,blur:0,gap:[4,14],w:[60,150],win:.3,wa:.8}],
tokyo:[{col:'#261c46',h:[.10,.28],par:.012,blur:2.5,gap:[2,8],w:[50,120],win:.22,wa:.55},
       {col:'#1a1436',h:[.08,.22],par:.03,blur:1.2,gap:[2,8],w:[45,110],win:.28,wa:.7},
       {col:'#100c26',h:[.06,.16],par:.06,blur:0,gap:[4,14],w:[50,120],win:.32,wa:.85}]
};

/* ---- skyline generators (draw one full layer strip) ---- */
const GEN={
city(g,df,li,LW,rnd){
  let x=-40;
  while(x<LW+40){
    const w=rnd(df.w[0],df.w[1])*R.S,h=R.H*rnd(df.h[0],df.h[1]),top=R.gy+4-h;
    /* form shading: lighter crown, darker base */
    const bg2=g.createLinearGradient(0,top,0,R.gy);
    bg2.addColorStop(0,shade(df.col,16));bg2.addColorStop(1,shade(df.col,-12));
    g.fillStyle=bg2;g.fillRect(x,top,w,h+6);
    /* parapet + rim light */
    g.fillStyle=shade(df.col,26);g.fillRect(x-2,top,w+4,3*R.S);
    g.fillStyle='rgba(255,255,255,.05)';g.fillRect(x-2,top,w+4,1);
    /* rooftop life: water towers, stair blocks, antennas with blinkers */
    if(Math.random()<.38){
      const tx0=x+w*rnd(.2,.7);
      g.fillStyle=shade(df.col,-20);
      g.fillRect(tx0-4*R.S,top-7*R.S,1.4*R.S,7*R.S);g.fillRect(tx0+2.6*R.S,top-7*R.S,1.4*R.S,7*R.S);
      g.fillRect(tx0-5*R.S,top-13*R.S,10*R.S,6.5*R.S);
      g.beginPath();g.moveTo(tx0-5.6*R.S,top-13*R.S);g.lineTo(tx0,top-17*R.S);g.lineTo(tx0+5.6*R.S,top-13*R.S);g.closePath();g.fill();
    }
    if(Math.random()<.4){
      const sx0=x+w*rnd(.15,.8),sw=rnd(8,16)*R.S;
      g.fillStyle=shade(df.col,-14);g.fillRect(sx0,top-sw*0.5,sw,sw*0.5);
    }
    if(Math.random()<.55){
      const ax=x+w*rnd(.2,.8),ah=rnd(10,26)*R.S;
      g.strokeStyle=shade(df.col,-16);g.lineWidth=1.1;
      g.beginPath();g.moveTo(ax,top);g.lineTo(ax,top-ah);g.stroke();
      R.blinkers.push({x:ax,y:top-ah,li,ph:Math.random()*6.3});
    }
    /* windows: per-building colour temperature, bright ones glow, one dark floor */
    const tone=Math.random()<.72?'#ffc46e':'#7fe8e3';
    const cols=Math.max(2,Math.round(w/(22*R.S))),rows=Math.max(3,Math.round(h/(26*R.S))),cw=(w-14*R.S)/cols,ch=(h-18*R.S)/rows;
    const darkFloor=Math.random()<.25?(Math.random()*rows|0):-1;
    for(let r2=0;r2<rows;r2++)for(let q=0;q<cols;q++){
      if(r2===darkFloor)continue;
      if(Math.random()<df.win){
        const wx0=x+7*R.S+q*cw,wy0=top+9*R.S+r2*ch,ww=Math.max(2,cw-6*R.S),wh=Math.max(2,ch-8*R.S);
        const bright=Math.random()<.09;
        g.globalAlpha=df.wa*(.35+Math.random()*.65)*(bright?1:0.8);
        g.fillStyle=tone;
        if(bright){g.shadowColor=tone;g.shadowBlur=7}
        g.fillRect(wx0,wy0,ww,wh);
        g.shadowBlur=0;
        if(Math.random()<.3){g.fillStyle='rgba(0,0,0,.35)';g.fillRect(wx0,wy0,ww,wh*0.4)}
      }
    }
    g.globalAlpha=1;
    if(li>0&&Math.random()<.45){
      const n={x:x+w*rnd(.3,.7),y:top+rnd(16,h*.4),w:rnd(5,10)*R.S,h:rnd(34,90)*R.S,c:R.NEON[Math.random()*R.NEON.length|0],ph:Math.random()*6.3,li};
      g.save();g.shadowColor=n.c;g.shadowBlur=16*R.S;g.fillStyle=n.c;g.fillRect(n.x-n.w/2,n.y,n.w,n.h);g.restore();R.neons.push(n);
    }
    if(li===2&&Math.random()<.55){
      const ph=R.H*rnd(.13,.2),lx=x+w*0.5;
      g.fillStyle='#05060f';g.fillRect(lx-1.6*R.S,R.gy-ph,3.2*R.S,ph);g.fillRect(lx-6*R.S,R.gy-ph-4*R.S,12*R.S,4*R.S);
      R.lamps.push({x:lx,y:R.gy-ph-3*R.S,ph:Math.random()*6.3,kind:'street',li,motes:mkmotes()});
    }
    /* far layer: container cranes; farthest: a cargo ship */
    if(li===1&&Math.random()<.2){
      const cx0=x+w*0.5,chh=h*rnd(.55,.85),jib=rnd(50,90)*R.S;
      g.strokeStyle=shade(df.col,-8);g.lineWidth=2.2*R.S;
      g.beginPath();g.moveTo(cx0,R.gy);g.lineTo(cx0,R.gy-chh);g.stroke();
      g.lineWidth=1.6*R.S;
      g.beginPath();g.moveTo(cx0-jib*0.35,R.gy-chh);g.lineTo(cx0+jib,R.gy-chh);g.stroke();
      g.beginPath();g.moveTo(cx0,R.gy-chh-14*R.S);g.lineTo(cx0+jib*0.9,R.gy-chh);g.stroke();
      R.blinkers.push({x:cx0+jib,y:R.gy-chh,li,ph:Math.random()*6.3});
    }
    if(li===0&&Math.random()<.22){
      const sx0=x,w2=w*1.4;
      g.fillStyle=shade(df.col,-8);
      g.beginPath();g.moveTo(sx0,R.gy);g.lineTo(sx0+w2*0.08,R.gy-9*R.S);g.lineTo(sx0+w2*0.86,R.gy-9*R.S);g.lineTo(sx0+w2,R.gy);g.closePath();g.fill();
      g.fillRect(sx0+w2*0.4,R.gy-24*R.S,1.4*R.S,16*R.S);
      g.fillRect(sx0+w2*0.62,R.gy-19*R.S,1.4*R.S,11*R.S);
    }
    x+=w+rnd(df.gap[0],df.gap[1])*R.S;
  }
},
stone(g,df,li,LW,rnd){
  let x=-40;
  while(x<LW+40){
    const w=rnd(df.w[0],df.w[1])*R.S,h=R.H*rnd(df.h[0],df.h[1]);let top=R.gy+4-h;
    const bg2=g.createLinearGradient(0,top,0,R.gy);
    bg2.addColorStop(0,shade(df.col,14));bg2.addColorStop(1,shade(df.col,-10));
    g.fillStyle=bg2;g.fillRect(x,top,w,h+6);
    /* ashlar stone courses + staggered joints */
    g.strokeStyle='rgba(0,0,0,.20)';g.lineWidth=0.7;
    for(let cy0=top+8*R.S;cy0<R.gy;cy0+=8.5*R.S){
      g.beginPath();g.moveTo(x,cy0);g.lineTo(x+w,cy0);g.stroke();
      for(let jx=x+((cy0/(8.5*R.S))%2)*6*R.S;jx<x+w;jx+=rnd(9,16)*R.S){
        g.beginPath();g.moveTo(jx,cy0-8.5*R.S);g.lineTo(jx,cy0);g.stroke();
      }
    }
    /* weathering streaks */
    for(let s2=0;s2<3;s2++){
      g.fillStyle='rgba(0,0,0,.10)';
      g.fillRect(x+w*rnd(.1,.9),top,rnd(1.2,2.6)*R.S,h*rnd(.4,.9));
    }
    /* cornice + rim */
    g.fillStyle=shade(df.col,22);g.fillRect(x-4,top,w+8,4*R.S);
    g.fillStyle='rgba(255,255,255,.06)';g.fillRect(x-4,top,w+8,1);
    if(Math.random()<.3){
      const dr=w*rnd(.22,.34);
      const dg=g.createLinearGradient(x,top-dr,0,top);
      dg.addColorStop(0,shade(df.col,20));dg.addColorStop(1,shade(df.col,-8));
      g.fillStyle=dg;
      g.beginPath();g.arc(x+w/2,top,dr,Math.PI,0);g.fill();
      g.strokeStyle='rgba(255,235,190,.10)';g.lineWidth=1;
      g.beginPath();g.arc(x+w/2,top,dr,Math.PI,0);g.stroke();
      g.strokeStyle=shade(df.col,26);g.lineWidth=1.2;
      g.beginPath();g.moveTo(x+w/2,top-dr);g.lineTo(x+w/2,top-dr-5*R.S);g.stroke();
      top-=dr*0.55;
    }else if(Math.random()<.25){
      const tw=w*0.16;
      g.fillStyle=shade(df.col,-6);g.fillRect(x+w*0.42,top-tw*2.1,tw,tw*2.1);
      g.beginPath();g.arc(x+w*0.42+tw/2,top-tw*2.1,tw*0.7,Math.PI,0);g.fill();
    }else if(Math.random()<.35){
      /* rooftop stair room */
      const rw=w*rnd(.2,.32);
      g.fillStyle=shade(df.col,-10);g.fillRect(x+w*rnd(.15,.6),top-rw*0.6,rw,rw*0.6);
    }
    const cols=Math.max(2,Math.round(w/(26*R.S))),rows=Math.max(2,Math.round(h/(34*R.S))),cw=(w-16*R.S)/cols,ch=(h-20*R.S)/rows;
    for(let r2=0;r2<rows;r2++)for(let q=0;q<cols;q++){
      const wx0=x+9*R.S+q*cw,wy0=top+11*R.S+r2*ch,ww=Math.max(3,cw-9*R.S),wh=Math.max(5,ch-12*R.S);
      if(Math.random()<df.win){
        g.globalAlpha=df.wa*(.4+Math.random()*.6);g.fillStyle='#ffbe78';
        g.fillRect(wx0,wy0+ww*0.28,ww,wh-ww*0.28);
        g.beginPath();g.arc(wx0+ww/2,wy0+ww*0.28,ww/2,Math.PI,0);g.fill();
        if(Math.random()<.22){g.fillStyle='rgba(255,235,180,.5)';g.fillRect(wx0-1,wy0+wh*0.8,ww+2,1.2)}
      }else{
        g.globalAlpha=.5;g.fillStyle='rgba(12,10,24,.9)';
        g.fillRect(wx0,wy0+ww*0.28,ww,wh-ww*0.28);
        g.beginPath();g.arc(wx0+ww/2,wy0+ww*0.28,ww/2,Math.PI,0);g.fill();
      }
      g.globalAlpha=1;
    }
    /* street-level arched door with warm interior */
    if(li===2&&Math.random()<.55){
      const dw=rnd(12,18)*R.S,dh=rnd(22,32)*R.S,dx0=x+w*rnd(.2,.8);
      g.fillStyle='rgba(255,170,90,.30)';
      g.fillRect(dx0-dw/2,R.gy-dh,dw,dh);
      g.beginPath();g.arc(dx0,R.gy-dh,dw/2,Math.PI,0);g.fill();
      g.strokeStyle='rgba(0,0,0,.5)';g.lineWidth=1.4;
      g.beginPath();g.moveTo(dx0-dw/2,R.gy);g.lineTo(dx0-dw/2,R.gy-dh);g.arc(dx0,R.gy-dh,dw/2,Math.PI,0);g.lineTo(dx0+dw/2,R.gy);g.stroke();
    }
    if(li===2&&Math.random()<.5){
      const lx=x+w*rnd(.2,.8),ly=top+h*rnd(.25,.6);
      g.fillStyle='#0a0918';g.fillRect(lx-2*R.S,ly,4*R.S,7*R.S);
      R.lamps.push({x:lx,y:ly+8*R.S,ph:Math.random()*6.3,kind:'lantern',li,motes:mkmotes()});
    }
    if(li===2&&Math.random()<.3){
      /* striped awning over a window */
      const ax0=x+w*rnd(.25,.75),ay0=top+h*rnd(.2,.4),aw=rnd(14,22)*R.S;
      for(let s2=0;s2<5;s2++){
        g.fillStyle=s2%2?'rgba(190,80,80,.75)':'rgba(230,225,215,.75)';
        g.beginPath();g.moveTo(ax0-aw/2+s2*aw/5,ay0);g.lineTo(ax0-aw/2+(s2+1)*aw/5,ay0);g.lineTo(ax0-aw/2+(s2+1)*aw/5-2*R.S,ay0+5*R.S);g.lineTo(ax0-aw/2+s2*aw/5-2*R.S,ay0+5*R.S);g.closePath();g.fill();
      }
    }
    x+=w+rnd(df.gap[0],df.gap[1])*R.S;
  }
},
hills(g,df,li,LW,rnd){
  const base=R.H*rnd(df.h[0],df.h[1]);
  const ridge=x=>R.gy-base-(Math.sin(x*0.004+li*7)*R.H*0.05+Math.sin(x*0.011+li*3)*R.H*0.028+Math.sin(x*0.027+li*1.7)*R.H*0.012);
  /* form-shaded ridge */
  const rg2=g.createLinearGradient(0,R.gy-base*1.35,0,R.gy);
  rg2.addColorStop(0,shade(df.col,16));rg2.addColorStop(1,shade(df.col,-14));
  g.fillStyle=rg2;
  g.beginPath();g.moveTo(-40,R.gy+8);
  g.lineTo(-40,ridge(-40));
  for(let x=-40;x<=LW+40;x+=48){
    const y0=ridge(x),y1=ridge(x+48);
    g.quadraticCurveTo(x+24,(y0+y1)/2,x+48,y1);
  }
  g.lineTo(LW+40,R.gy+8);g.closePath();g.fill();
  /* rim light along the crest */
  g.strokeStyle='rgba(255,255,255,.09)';g.lineWidth=1.2;
  g.beginPath();g.moveTo(-40,ridge(-40));
  for(let x=-40;x<=LW+40;x+=48){
    const y0=ridge(x),y1=ridge(x+48);
    g.quadraticCurveTo(x+24,(y0+y1)/2,x+48,y1);
  }
  g.stroke();
  /* olive groves clinging to the slopes */
  for(let x=-20;x<LW+20;x+=rnd(46,110)){
    if(Math.random()<.6){
      const y=ridge(x)+3;
      for(let k=0;k<3+(Math.random()*3|0);k++){
        g.fillStyle='rgba(8,14,12,.85)';
        g.beginPath();g.ellipse(x+rnd(-9,9)*R.S,y+rnd(-2,4)*R.S,rnd(2.2,4.6)*R.S,rnd(1.5,3)*R.S,0,0,R.TAU);g.fill();
      }
    }
  }
  /* distant village on the far shore */
  if(li===0&&Math.random()<.8){
    const vx=LW*rnd(.15,.85),n=6+(Math.random()*6|0);
    let bx=vx;
    for(let i=0;i<n;i++){
      const bw=rnd(5,10)*R.S,bh=rnd(5,12)*R.S,by=ridge(bx)+2*R.S;
      g.fillStyle=shade(df.col,-18);
      g.fillRect(bx,by-bh,bw,bh);
      if(Math.random()<.4){g.fillStyle='rgba(255,200,120,.8)';g.fillRect(bx+bw*0.3,by-bh*0.6,1.4,1.4)}
      if(i===n/2|0){g.fillStyle=shade(df.col,-10);g.fillRect(bx+bw*0.4,by-bh-7*R.S,2.2*R.S,7*R.S)}
      bx+=bw+rnd(3,9)*R.S;
    }
  }
  if(li===2){
    for(let i=0;i<3;i++){
      const lx=LW*rnd(.1,.9),ly=ridge(lx)+6*R.S;
      g.fillStyle='#05060f';g.fillRect(lx-1.4*R.S,ly-16*R.S,2.8*R.S,16*R.S);
      R.lamps.push({x:lx,y:ly-17*R.S,ph:Math.random()*6.3,kind:'lantern',li,motes:mkmotes()});
    }
  }
},
colonnade(g,df,li,LW,rnd){
  const ph=R.H*df.h[1],wallTop=R.gy-ph*1.12;
  /* temple dome rising behind the colonnade on distant layers */
  if(li<2){
    const dx0=LW*rnd(.3,.7),dr=R.W*rnd(.1,.16);
    const dg=g.createLinearGradient(0,wallTop-dr,0,wallTop);
    dg.addColorStop(0,shade(df.col,14));dg.addColorStop(1,shade(df.col,-6));
    g.fillStyle=dg;
    g.beginPath();g.arc(dx0,wallTop+dr*0.15,dr,Math.PI,0);g.fill();
    g.strokeStyle='rgba(255,235,190,.12)';g.lineWidth=1.2;
    g.beginPath();g.arc(dx0,wallTop+dr*0.15,dr,Math.PI,0);g.stroke();
    g.fillRect(dx0-1,R.gy-ph*1.12-dr*0.88-8*R.S,2,R.S*8);
  }
  /* shaded wall */
  const wg2=g.createLinearGradient(0,wallTop,0,R.gy);
  wg2.addColorStop(0,shade(df.col,10));wg2.addColorStop(1,shade(df.col,-12));
  g.fillStyle=wg2;g.fillRect(0,wallTop,LW,R.gy-wallTop+8);
  g.fillStyle='rgba(0,0,0,.35)';g.fillRect(0,wallTop,LW,4*R.S);
  /* glowing doorway arches in the wall behind */
  for(let i=0;i<LW/(240*R.S);i++){
    const dx=rnd(30,LW-60),dw=rnd(26,40)*R.S,dh=rnd(50,90)*R.S;
    const dg2=g.createLinearGradient(0,R.gy-dh,0,R.gy);
    dg2.addColorStop(0,'rgba(255,190,110,.16)');dg2.addColorStop(1,'rgba(255,170,90,.07)');
    g.fillStyle=dg2;
    g.fillRect(dx,R.gy-dh,dw,dh);
    g.beginPath();g.arc(dx+dw/2,R.gy-dh,dw/2,Math.PI,0);g.fill();
  }
  /* fluted, cylindrical pillars */
  const pw=rnd(34,50)*R.S*(1+li*0.25),pwid=(9+li*4)*R.S;
  for(let x=-pw;x<LW+pw;x+=pw){
    const pg=g.createLinearGradient(x,0,x+pwid,0);
    pg.addColorStop(0,shade(df.col,20));pg.addColorStop(.35,shade(df.col,2));pg.addColorStop(1,shade(df.col,-18));
    g.fillStyle=pg;g.fillRect(x,R.gy-ph,pwid,ph+8);
    /* fluting */
    g.strokeStyle='rgba(0,0,0,.22)';g.lineWidth=0.7;
    for(let f=1;f<=3;f++){
      const fx=x+pwid*f/4;
      g.beginPath();g.moveTo(fx,R.gy-ph+7*R.S);g.lineTo(fx,R.gy-6*R.S);g.stroke();
    }
    /* capital: two-step + base */
    g.fillStyle=shade(df.col,24);
    g.fillRect(x-2.5*R.S,R.gy-ph-5*R.S,pwid+5*R.S,5*R.S);
    g.fillRect(x-1.5*R.S,R.gy-ph-8*R.S,pwid+3*R.S,3*R.S);
    g.fillRect(x-2.5*R.S,R.gy-4*R.S,pwid+5*R.S,4*R.S);
  }
  /* entablature with triglyph frieze */
  g.fillStyle=shade(df.col,6);g.fillRect(0,R.gy-ph-9*R.S,LW,6*R.S);
  g.fillStyle='rgba(0,0,0,.28)';
  for(let x=4;x<LW;x+=9*R.S)g.fillRect(x,R.gy-ph-8.2*R.S,2.6*R.S,4.4*R.S);
  g.fillStyle=shade(df.col,26);g.fillRect(0,R.gy-ph-11*R.S,LW,2.4*R.S);
  g.fillStyle='rgba(255,255,255,.05)';g.fillRect(0,R.gy-ph-11*R.S,LW,1);
  if(li===2){
    for(let i=0;i<3;i++){
      const bx=LW*(0.18+0.32*i)+rnd(-20,20);
      g.fillStyle='#0a0912';g.fillRect(bx-7*R.S,R.gy-26*R.S,14*R.S,4*R.S);g.fillRect(bx-1.4*R.S,R.gy-22*R.S,2.8*R.S,22*R.S);
      R.lamps.push({x:bx,y:R.gy-28*R.S,ph:Math.random()*6.3,kind:'brazier',li,motes:mkmotes()});
    }
  }
},
forest(g,df,li,LW,rnd){
  const cols=['#16281c','#101f16','#0b170f'];
  const spacing=(90-li*22)*R.S;
  /* misty shafts between the far trees */
  if(li<2){
    for(let i=0;i<LW/(300*R.S);i++){
      const mx=rnd(0,LW),mw=rnd(40,90)*R.S;
      const mg=g.createLinearGradient(0,R.gy-ph0(li),0,R.gy);
      mg.addColorStop(0,'rgba(190,235,210,0)');mg.addColorStop(.7,'rgba(190,235,210,.06)');mg.addColorStop(1,'rgba(190,235,210,0)');
      g.fillStyle=mg;g.fillRect(mx,R.gy-R.H*df.h[1],mw,R.H*df.h[1]);
    }
  }
  for(let x=-30;x<LW+30;x+=rnd(spacing*0.7,spacing*1.4)){
    const tw=(4+li*7)*R.S,th=R.H*rnd(df.h[0],df.h[1]);
    /* trunk: cylindrical shading + bark streaks + root flare */
    const tg=g.createLinearGradient(x-tw/2,0,x+tw/2,0);
    tg.addColorStop(0,'#181009');tg.addColorStop(.4,'#241812');tg.addColorStop(1,'#0c0805');
    g.fillStyle=tg;
    g.fillRect(x-tw/2,R.gy-th,tw,th+8);
    g.fillStyle='#0c0805';
    g.beginPath();g.moveTo(x-tw*0.9,R.gy+8);g.lineTo(x-tw*0.4,R.gy-th*0.06);g.lineTo(x+tw*0.4,R.gy-th*0.06);g.lineTo(x+tw*0.9,R.gy+8);g.closePath();g.fill();
    g.strokeStyle='rgba(0,0,0,.35)';g.lineWidth=0.8;
    for(let b=0;b<3;b++){
      const bx=x-tw/2+tw*(0.25+b*0.25);
      g.beginPath();g.moveTo(bx,R.gy-th*0.9);g.lineTo(bx+rnd(-1.5,1.5)*R.S,R.gy);g.stroke();
    }
    /* canopy: dark under-blob, lit upper crown */
    const cs=cols[li];
    g.fillStyle=cs;
    g.beginPath();
    g.ellipse(x,R.gy-th+8*R.S,tw*rnd(3.4,5),tw*rnd(1.7,2.6),0,0,R.TAU);
    g.ellipse(x-tw*.8,R.gy-th+22*R.S,tw*rnd(2.4,3.6),tw*rnd(1.4,2),0,0,R.TAU);
    g.ellipse(x+tw*.9,R.gy-th+30*R.S,tw*rnd(2.2,3.2),tw*rnd(1.3,1.9),0,0,R.TAU);
    g.fill();
    g.fillStyle='rgba(255,255,255,.05)';
    g.beginPath();g.ellipse(x-tw*0.6,R.gy-th+2*R.S,tw*2.2,tw*0.9,-0.25,0,R.TAU);g.fill();
    if(Math.random()<.3){g.fillStyle='rgba(255,255,255,.03)';g.beginPath();g.ellipse(x-tw*.5,R.gy-th+10*R.S,tw*1.6,tw*.7,-.3,0,R.TAU);g.fill()}
  }
  if(li===2){
    /* ferns + bushes on the forest floor */
    for(let x=-20;x<LW+20;x+=rnd(26,60)){
      g.strokeStyle='rgba(10,20,12,.9)';g.lineWidth=1;
      const fx=x,fy=R.gy+rnd(-2,3),fr=rnd(4,8)*R.S;
      for(let f=0;f<5;f++){
        const a=-Math.PI*0.15-f*0.18;
        g.beginPath();g.moveTo(fx,fy);g.quadraticCurveTo(fx+Math.cos(a)*fr*0.6,fy+Math.sin(a)*fr*0.8,fx+Math.cos(a)*fr,fy+Math.sin(a)*fr*0.4);g.stroke();
      }
    }
    for(let i=0;i<9;i++)R.lamps.push({x:LW*rnd(0,1),y:R.gy-rnd(30,170)*R.S,ph:Math.random()*6.3,kind:'firefly',li});
  }
},
mesa(g,df,li,LW,rnd){
  /* distant dunes on the far layer */
  if(li===0){
    const duneY=R.gy-R.H*rnd(.06,.1);
    const dg=g.createLinearGradient(0,duneY,0,R.gy);
    dg.addColorStop(0,shade(df.col,10));dg.addColorStop(1,shade(df.col,-6));
    g.fillStyle=dg;
    g.beginPath();g.moveTo(-40,R.gy+8);g.lineTo(-40,duneY);
    for(let x=-40;x<=LW+40;x+=60)g.quadraticCurveTo(x+30,duneY+Math.sin(x*0.013)*9*R.S,x+60,duneY+Math.sin(x*0.008)*5*R.S);
    g.lineTo(LW+40,R.gy+8);g.closePath();g.fill();
  }
  let x=-60;
  while(x<LW+60){
    const w=rnd(120,260)*R.S,h=R.H*rnd(df.h[0],df.h[1]),top=R.gy+4-h;
    const mg=g.createLinearGradient(0,top,0,R.gy);
    mg.addColorStop(0,shade(df.col,18));mg.addColorStop(1,shade(df.col,-12));
    g.fillStyle=mg;
    g.beginPath();
    g.moveTo(x,R.gy+8);g.lineTo(x+w*0.08,top+h*0.18);g.lineTo(x+w*0.14,top);
    g.lineTo(x+w*0.86,top);g.lineTo(x+w*0.92,top+h*0.18);g.lineTo(x+w,R.gy+8);
    g.closePath();g.fill();
    /* sediment strata + cracks */
    for(let s2=1;s2<=5;s2++){
      g.fillStyle=s2%2?'rgba(255,220,170,.05)':'rgba(0,0,0,.10)';
      g.fillRect(x+w*0.14,top+h*0.16*s2,w*0.72,h*0.045);
    }
    g.strokeStyle='rgba(0,0,0,.28)';g.lineWidth=0.9;
    for(let c2=0;c2<3;c2++){
      const cx0=x+w*rnd(.2,.8);
      g.beginPath();g.moveTo(cx0,top+h*rnd(.05,.2));g.lineTo(cx0+rnd(-8,8)*R.S,top+h*rnd(.5,.8));g.stroke();
    }
    /* sunlit rim along the flat top */
    g.fillStyle='rgba(255,215,160,.16)';g.fillRect(x+w*0.14,top,w*0.72,1.4*R.S);
    /* scree slopes at the base */
    g.fillStyle='rgba(0,0,0,.28)';
    g.beginPath();g.moveTo(x,R.gy+8);g.lineTo(x+w*0.08,top+h*0.18);g.lineTo(x+w*0.2,R.gy+8);g.closePath();g.fill();
    g.beginPath();g.moveTo(x+w,R.gy+8);g.lineTo(x+w*0.92,top+h*0.18);g.lineTo(x+w*0.8,R.gy+8);g.closePath();g.fill();
    x+=w+rnd(30,120)*R.S;
  }
  if(li===2){
    g.fillStyle='#0d060a';
    for(let x=-20;x<LW+20;x+=rnd(50,140)){g.beginPath();g.ellipse(x,R.gy+rnd(-2,4),rnd(3,7)*R.S,rnd(1.5,3)*R.S,0,0,R.TAU);g.fill()}
    const bx=LW*rnd(.3,.7);
    g.fillStyle='#0a0912';g.fillRect(bx-8*R.S,R.gy-20*R.S,16*R.S,4*R.S);g.fillRect(bx-1.4*R.S,R.gy-16*R.S,2.8*R.S,16*R.S);
    R.lamps.push({x:bx,y:R.gy-22*R.S,ph:Math.random()*6.3,kind:'brazier',li,motes:mkmotes()});
  }
},
alpine(g,df,li,LW,rnd){
  const base=R.H*df.h[1];
  /* rock faces with snow caps and an irregular snowline */
  g.fillStyle=df.col;
  g.beginPath();g.moveTo(-40,R.gy+8);
  const peaks=[];
  for(let x=-40;x<=LW+40;x+=rnd(60,130)){
    const pk=R.gy-base*(rnd(0,1)<.6?rnd(.8,1.15):rnd(.45,.7));
    peaks.push({x:x+30,y:pk});
    g.lineTo(x+30,pk);
  }
  g.lineTo(LW+40,R.gy+8);g.closePath();g.fill();
  const snowAlpha=.42-li*0.1;
  g.fillStyle=`rgba(222,236,255,${snowAlpha})`;
  for(const p of peaks){
    const cw2=rnd(26,40)*R.S,dh2=rnd(22,34)*R.S;
    g.beginPath();
    g.moveTo(p.x,p.y);
    g.lineTo(p.x+cw2,p.y+dh2);
    g.lineTo(p.x+cw2*0.55,p.y+dh2*rnd(.55,.8));
    g.lineTo(p.x+cw2*0.3,p.y+dh2*0.62);
    g.lineTo(p.x+cw2*0.12,p.y+dh2*0.9);
    g.lineTo(p.x-cw2*0.15,p.y+dh2*0.55);
    g.lineTo(p.x-cw2*0.35,p.y+dh2*0.75);
    g.closePath();g.fill();
    /* crest highlight */
    g.fillStyle=`rgba(255,255,255,${snowAlpha*0.35})`;
    g.fillRect(p.x-cw2*0.08,p.y+1,cw2*0.16,1.4);
  }
  /* snow-dusted pines */
  if(li>=1){
    g.fillStyle='rgba(4,8,8,.95)';
    for(let x=-20;x<LW+20;x+=rnd(12,22)*R.S){
      const th=rnd(10,24)*R.S*(li===2?1.7:1),bx=R.gy+rnd(-2,4);
      g.beginPath();g.moveTo(x,bx-th);g.lineTo(x+th*0.32,bx);g.lineTo(x-th*0.32,bx);g.closePath();g.fill();
      if(Math.random()<.5){g.strokeStyle='rgba(225,238,255,.5)';g.lineWidth=1.1;
        g.beginPath();g.moveTo(x-th*0.14,bx-th*0.55);g.lineTo(x+th*0.14,bx-th*0.55);g.stroke()}
    }
  }
  if(li===2){
    const cx0=LW*rnd(.2,.8),cw=64*R.S,ch=40*R.S;
    g.fillStyle='#0b0a14';g.fillRect(cx0-cw/2,R.gy-ch,cw,ch);
    g.beginPath();g.moveTo(cx0-cw/2-6*R.S,R.gy-ch);g.lineTo(cx0,R.gy-ch-22*R.S);g.lineTo(cx0+cw/2+6*R.S,R.gy-ch);g.closePath();g.fill();
    /* chimney with smoking fire */
    g.fillStyle='#0b0a14';g.fillRect(cx0+cw*0.24,R.gy-ch-14*R.S,7*R.S,14*R.S);
    R.chimneys.push({x:cx0+cw*0.24+3.5*R.S,y:R.gy-ch-15*R.S,li:2});
    g.fillStyle='#ffc98a';g.fillRect(cx0-cw*0.28,R.gy-ch*0.62,10*R.S,9*R.S);g.fillRect(cx0+cw*0.14,R.gy-ch*0.62,10*R.S,9*R.S);
    g.fillStyle='rgba(255,220,150,.25)';g.fillRect(cx0-cw*0.28-1,R.gy-ch*0.62-1,12*R.S,11*R.S);
    R.lamps.push({x:cx0-cw*0.28+5*R.S,y:R.gy-ch*0.62+4*R.S,ph:Math.random()*6.3,kind:'lantern',li,motes:mkmotes()});
    R.lamps.push({x:cx0+cw*0.14+5*R.S,y:R.gy-ch*0.62+4*R.S,ph:Math.random()*6.3,kind:'lantern',li,motes:mkmotes()});
  }
},

/* ---- Westminster, London: Big Ben, the Eye, Tower Bridge ---- */
london(g,df,li,LW,rnd){
  const drawBigBen=(x,h)=>{
    const w=22*R.S,top=R.gy-h;
    const bg=g.createLinearGradient(0,top,0,R.gy);
    bg.addColorStop(0,shade(df.col,20));bg.addColorStop(1,shade(df.col,-10));
    g.fillStyle=bg;g.fillRect(x-w/2,top,w,h);
    g.fillStyle=shade(df.col,26);
    g.fillRect(x-w/2-2*R.S,top+8*R.S,2*R.S,h*0.6);
    g.fillRect(x+w/2,top+8*R.S,2*R.S,h*0.6);
    /* belfry stage + spire */
    const cw=w*1.5,ch=h*0.15,cy0=top+h*0.17;
    g.fillStyle=shade(df.col,10);g.fillRect(x-cw/2,cy0,cw,ch);
    g.beginPath();g.moveTo(x-cw/2,cy0);g.lineTo(x,cy0-h*0.13);g.lineTo(x+cw/2,cy0);g.closePath();g.fill();
    g.fillStyle=shade(df.col,30);g.fillRect(x-1,cy0-h*0.13-6*R.S,2*R.S,6*R.S);
    /* glowing clock face */
    const r=w*0.62,cyr=cy0+ch*0.52;
    g.fillStyle='rgba(255,224,150,.95)';
    g.beginPath();g.arc(x,cyr,r,0,R.TAU);g.fill();
    g.strokeStyle='rgba(110,80,40,.9)';g.lineWidth=1.4;
    g.beginPath();g.arc(x,cyr,r,0,R.TAU);g.stroke();
    g.lineWidth=1;
    for(let a=0;a<12;a++){const an=a/12*R.TAU;
      g.beginPath();g.moveTo(x+Math.cos(an)*r*0.78,cyr+Math.sin(an)*r*0.78);g.lineTo(x+Math.cos(an)*r*0.92,cyr+Math.sin(an)*r*0.92);g.stroke()}
    g.beginPath();g.moveTo(x,cyr);g.lineTo(x+Math.cos(-1.2)*r*0.5,cyr+Math.sin(-1.2)*r*0.5);
    g.moveTo(x,cyr);g.lineTo(x+Math.cos(0.5)*r*0.7,cyr+Math.sin(0.5)*r*0.7);g.stroke();
    R.clockFaces.push({x,y:cyr,r:r*1.9,li});
    /* lit windows down the shaft */
    for(let wy=top+h*0.42;wy<R.gy-10*R.S;wy+=10*R.S){
      if(Math.random()<.4){g.fillStyle='rgba(255,200,120,.7)';g.fillRect(x-2*R.S,wy,4*R.S,5*R.S)}
    }
  };
  /* filler rows: gothic roofline with pinnacles + tall arched windows */
  let x=-40;
  while(x<LW+40){
    const w=rnd(df.w[0],df.w[1])*R.S,h=R.H*rnd(df.h[0],df.h[1]),top=R.gy+4-h;
    const bg2=g.createLinearGradient(0,top,0,R.gy);
    bg2.addColorStop(0,shade(df.col,14));bg2.addColorStop(1,shade(df.col,-10));
    g.fillStyle=bg2;g.fillRect(x,top,w,h+6);
    for(let px2=x+4;px2<x+w-4;px2+=rnd(7,12)*R.S){
      const ph2=rnd(4,9)*R.S;
      g.fillStyle=shade(df.col,20);g.fillRect(px2,top-ph2,1.6*R.S,ph2);
    }
    g.fillStyle=shade(df.col,24);g.fillRect(x-2,top,w+4,1.6*R.S);
    const cols=Math.max(2,Math.round(w/(18*R.S))),cw=(w-10*R.S)/cols;
    for(let q=0;q<cols;q++)if(Math.random()<df.win){
      const wx0=x+5*R.S+q*cw,ww=Math.max(2.5,cw*0.4),wh=ww*2;
      g.globalAlpha=df.wa*(.4+Math.random()*.6);g.fillStyle='#ffc98a';
      g.fillRect(wx0,top+8*R.S,ww,wh);
      g.beginPath();g.arc(wx0+ww/2,top+8*R.S,ww/2,Math.PI,0);g.fill();
      g.globalAlpha=1;
    }
    x+=w+rnd(df.gap[0],df.gap[1])*R.S;
  }
  /* landmarks */
  if(li===1){
    drawBigBen(LW*0.36,R.H*0.46);
    /* the London Eye: static legs; rotating rim drawn per-frame */
    const ex=LW*0.76,er=R.H*0.20,ey=R.gy-er-12*R.S;
    R.londonEye={x:ex,y:ey,r:er,li:1};
    g.strokeStyle=shade(df.col,6);g.lineWidth=3*R.S;
    g.beginPath();g.moveTo(ex-er*0.42,R.gy);g.lineTo(ex,ey);g.moveTo(ex+er*0.42,R.gy);g.lineTo(ex,ey);g.stroke();
  }
  if(li===2){
    /* Tower Bridge */
    const bx=LW*0.52,bw=R.W*0.30,tw=15*R.S,th=R.H*0.2;
    g.fillStyle=shade(df.col,12);
    for(const s2 of[-1,1]){
      const tx0=bx+s2*bw*0.32;
      g.fillRect(tx0-tw/2,R.gy-th,tw,th);
      g.beginPath();g.moveTo(tx0-tw/2-3*R.S,R.gy-th);g.lineTo(tx0,R.gy-th-13*R.S);g.lineTo(tx0+tw/2+3*R.S,R.gy-th);g.closePath();g.fill();
      g.fillStyle='rgba(255,205,130,.75)';
      g.fillRect(tx0-2.5*R.S,R.gy-th*0.55,5*R.S,6*R.S);
      g.fillStyle=shade(df.col,12);
    }
    g.fillRect(bx-bw/2,R.gy-24*R.S,bw,4.5*R.S);
    g.fillRect(bx-bw*0.32,R.gy-th-14*R.S,bw*0.64,3.5*R.S);
    g.strokeStyle=shade(df.col,20);g.lineWidth=1.4;
    g.beginPath();g.moveTo(bx-bw/2,R.gy-30*R.S);g.quadraticCurveTo(bx-bw*0.16,R.gy-th*0.55,bx-bw*0.32+tw/2,R.gy-th);g.stroke();
    g.beginPath();g.moveTo(bx+bw/2,R.gy-30*R.S);g.quadraticCurveTo(bx+bw*0.16,R.gy-th*0.55,bx+bw*0.32-tw/2,R.gy-th);g.stroke();
  }
},

/* ---- Paris: Eiffel Tower with rotating beacon, Haussmann rows ---- */
paris(g,df,li,LW,rnd){
  /* r5: solid, readable Eiffel Tower — four splayed legs, the great arch, three platforms,
     tapering iron lattice lit gold, antenna. Same palette, just structure that reads at a glance. */
  const drawEiffel=(x,h)=>{
    const S=R.S,gy=R.gy,top=gy-h,bw=h*0.40;
    const halfW=u=>{ /* half-width of the silhouette at height fraction u (0 base → 1 top), concave curve */
      return bw/2*Math.pow(1-u,1.9)+h*0.012};
    const iron=shade(df.col,30),ironD=shade(df.col,10);
    /* silhouette */
    g.fillStyle=ironD;g.beginPath();
    g.moveTo(x-halfW(0),gy);
    for(let u=0;u<=1.0001;u+=0.05)g.lineTo(x-halfW(u),gy-h*u*0.9);
    g.lineTo(x,top+h*0.02);
    for(let u=1;u>=-0.0001;u-=0.05)g.lineTo(x+halfW(u),gy-h*u*0.9);
    /* the great arch between the legs */
    const ah=h*0.17,aw=halfW(0)*0.62;
    g.lineTo(x+aw,gy);g.quadraticCurveTo(x+aw*0.9,gy-ah*1.25,x,gy-ah*1.2);g.quadraticCurveTo(x-aw*0.9,gy-ah*1.25,x-aw,gy);
    g.closePath();g.fill();
    /* lit lattice inside the silhouette */
    g.save();g.clip();
    g.strokeStyle='rgba(255,196,100,.55)';g.lineWidth=0.9*S;
    for(let d2=-h;d2<h;d2+=6*S){
      g.beginPath();g.moveTo(x+d2,gy);g.lineTo(x+d2+h*0.35,gy-h);g.moveTo(x+d2,gy);g.lineTo(x+d2-h*0.35,gy-h);g.stroke();
    }
    g.restore();
    /* leg edges (bright iron) */
    g.strokeStyle=iron;g.lineWidth=2*S;
    for(const sg of[-1,1]){g.beginPath();g.moveTo(x+sg*halfW(0),gy);
      for(let u=0;u<=0.9;u+=0.05)g.lineTo(x+sg*halfW(u),gy-h*u*0.9);g.stroke()}
    /* platforms */
    for(const u of[0.19,0.43,0.80]){
      const py=gy-h*u*0.9,pw2=halfW(u)*2+10*S;
      g.fillStyle=shade(df.col,36);g.fillRect(x-pw2/2,py-2.6*S,pw2,4.2*S);
      g.fillStyle='rgba(255,210,130,.75)';for(let q=-pw2/2+3*S;q<pw2/2-2*S;q+=5*S)g.fillRect(x+q,py-1.6*S,1.6*S,1.6*S);
    }
    /* antenna and top lantern */
    g.fillStyle=iron;g.fillRect(x-1.4*S,top-10*S,2.8*S,h*0.12);
    g.fillStyle='rgba(255,236,190,.95)';g.fillRect(x-3*S,top+h*0.06,6*S,4*S);
    /* golden night glow */
    g.save();g.globalCompositeOperation='lighter';
    const gl=g.createRadialGradient(x,gy-h*0.45,0,x,gy-h*0.45,h*0.55);
    gl.addColorStop(0,'rgba(255,170,70,.20)');gl.addColorStop(1,'rgba(255,170,70,0)');
    g.fillStyle=gl;g.fillRect(x-h*0.6,gy-h*1.05,h*1.2,h*1.1);g.restore();
    R.beacon={x,y:top-10*S,li:1};
  };
  /* Haussmann rows: uniform cornices, mansard roofs, balconies, chimneys */
  let x=-40;
  while(x<LW+40){
    const w=rnd(df.w[0],df.w[1])*R.S,h=R.H*rnd(df.h[0],df.h[1]),top=R.gy+4-h;
    const bg2=g.createLinearGradient(0,top,0,R.gy);
    bg2.addColorStop(0,shade(df.col,14));bg2.addColorStop(1,shade(df.col,-10));
    g.fillStyle=bg2;g.fillRect(x,top,w,h+6);
    /* mansard roof */
    g.fillStyle=shade(df.col,-14);
    g.beginPath();g.moveTo(x+2,top+6*R.S);g.lineTo(x+w*0.16,top);g.lineTo(x+w*0.84,top);g.lineTo(x+w-2,top+6*R.S);g.closePath();g.fill();
    g.fillStyle=shade(df.col,24);g.fillRect(x-2,top+5*R.S,w+4,1.6*R.S);
    /* balconies with posts */
    for(let by=top+h*0.3;by<R.gy-8*R.S;by+=h*0.26){
      g.strokeStyle='rgba(0,0,0,.4)';g.lineWidth=1;
      g.beginPath();g.moveTo(x+3*R.S,by);g.lineTo(x+w-3*R.S,by);g.stroke();
      g.fillStyle='rgba(255,215,150,.6)';
      for(let px2=x+6*R.S;px2<x+w-5*R.S;px2+=rnd(8,13)*R.S){
        if(Math.random()<.5)g.fillRect(px2,by-3.5*R.S,2.6*R.S,3.5*R.S);
      }
    }
    g.fillStyle=shade(df.col,-16);
    g.fillRect(x+w*0.2,top-8*R.S,2.4*R.S,8*R.S);
    g.fillRect(x+w*0.7,top-6*R.S,2.4*R.S,6*R.S);
    x+=w+rnd(df.gap[0],df.gap[1])*R.S;
  }
  if(li===1)drawEiffel(LW*0.5,R.H*0.55);
},

/* ---- Manhattan, New York: setback towers, spires, Lady Liberty ---- */
newyork(g,df,li,LW,rnd){
  const drawTower=(x,w,h)=>{
    const top=R.gy-h;
    const bg2=g.createLinearGradient(0,top,0,R.gy);
    bg2.addColorStop(0,shade(df.col,18));bg2.addColorStop(1,shade(df.col,-12));
    g.fillStyle=bg2;g.fillRect(x-w/2,top,w,h+6);
    g.fillStyle=shade(df.col,26);g.fillRect(x-w/2-1.5,top,w+3,2.2*R.S);
    const cols=Math.max(2,Math.round(w/(14*R.S))),rows=Math.max(3,Math.round(h/(18*R.S))),cw=(w-8*R.S)/cols,ch=(h-10*R.S)/rows;
    for(let r2=0;r2<rows;r2++)for(let q=0;q<cols;q++)if(Math.random()<df.win){
      g.globalAlpha=df.wa*(.35+Math.random()*.65);
      g.fillStyle=Math.random()<.3?'#9fd8ff':'#ffd9a0';
      g.fillRect(x-w/2+4*R.S+q*cw,top+6*R.S+r2*ch,Math.max(1.6,cw*0.5),Math.max(2,ch*0.55));
    }
    g.globalAlpha=1;
  };
  let x=-40;
  while(x<LW+40){
    const w=rnd(df.w[0],df.w[1])*R.S,h=R.H*rnd(df.h[0],df.h[1]);
    /* setbacks: stacked slimmer boxes */
    const h1=h*0.68;
    drawTower(x,w,h);
    const w2=w*0.62,h2=h*0.24;
    drawTower(x,w2,h1+h2);
    if(Math.random()<.5){
      drawTower(x,w2*0.5,h1+h2+h*0.12);
      R.blinkers.push({x,y:R.gy-(h1+h2+h*0.12)-4*R.S,li,ph:Math.random()*6.3});
    }
    x+=w+rnd(df.gap[0],df.gap[1])*R.S;
  }
  /* Empire-style spire on the mid layer */
  if(li===1){
    const sx=LW*0.3,sw=34*R.S;
    let yy=R.gy;
    for(const[fw,fh]of[[1,0.16],[0.72,0.14],[0.5,0.12],[0.32,0.1]]){
      drawTower(sx,sw*fw,fh*R.H);
      yy-=fh*R.H;
    }
    g.strokeStyle=shade(df.col,30);g.lineWidth=1.6;
    g.beginPath();g.moveTo(sx,yy);g.lineTo(sx,yy-26*R.S);g.stroke();
    R.blinkers.push({x:sx,y:yy-26*R.S,li:1,ph:Math.random()*6.3});
  }
  /* Lady Liberty on the near layer */
  if(li===2){
    const lx=LW*0.1,lh=R.H*0.3,top=R.gy-lh;
    g.fillStyle=shade(df.col,16);
    g.beginPath();g.moveTo(lx-14*R.S,R.gy);g.lineTo(lx-10*R.S,top+lh*0.72);g.lineTo(lx+10*R.S,top+lh*0.72);g.lineTo(lx+14*R.S,R.gy);g.closePath();g.fill();
    /* robe */
    g.beginPath();g.moveTo(lx-8*R.S,top+lh*0.72);
    g.quadraticCurveTo(lx-9*R.S,top+lh*0.3,lx,top+lh*0.22);
    g.quadraticCurveTo(lx+9*R.S,top+lh*0.3,lx+8*R.S,top+lh*0.72);
    g.closePath();g.fill();
    /* head + crown spikes */
    g.beginPath();g.arc(lx,top+lh*0.18,4.5*R.S,0,R.TAU);g.fill();
    for(let c2=0;c2<5;c2++){
      const a=-Math.PI*0.5+(c2-2)*0.4;
      g.beginPath();g.moveTo(lx+Math.cos(a)*4.5*R.S,top+lh*0.18+Math.sin(a)*4.5*R.S);
      g.lineTo(lx+Math.cos(a)*9*R.S,top+lh*0.18+Math.sin(a)*9*R.S);
      g.lineTo(lx+Math.cos(a+0.22)*4.5*R.S,top+lh*0.18+Math.sin(a+0.22)*4.5*R.S);
      g.closePath();g.fill();
    }
    /* raised arm + torch */
    g.strokeStyle=shade(df.col,16);g.lineWidth=3*R.S;
    g.beginPath();g.moveTo(lx+4*R.S,top+lh*0.34);g.lineTo(lx+13*R.S,top+lh*0.08);g.stroke();
    R.torches.push({x:lx+13*R.S,y:top+lh*0.04,li:2});
  }
},

/* ---- Tokyo: red-lit lattice tower, skytree needle, neon sign stacks ---- */
tokyo(g,df,li,LW,rnd){
  const drawTTower=(x,h)=>{
    const baseW=h*0.3,top=R.gy-h;
    g.strokeStyle='rgba(225,240,255,.5)';g.lineWidth=2*R.S;
    g.beginPath();g.moveTo(x-baseW/2,R.gy);g.quadraticCurveTo(x-baseW*0.14,R.gy-h*0.6,x,top);g.stroke();
    g.beginPath();g.moveTo(x+baseW/2,R.gy);g.quadraticCurveTo(x+baseW*0.14,R.gy-h*0.6,x,top);g.stroke();
    g.save();
    g.beginPath();
    g.moveTo(x-baseW/2,R.gy);g.quadraticCurveTo(x-baseW*0.14,R.gy-h*0.6,x,top);
    g.lineTo(x,R.gy);
    g.quadraticCurveTo(x+baseW*0.14,R.gy-h*0.6,x+baseW/2,R.gy);
    g.closePath();g.clip();
    for(let u=0;u<1;u+=0.09){
      g.fillStyle=u%0.18<0.09?'rgba(225,80,60,.5)':'rgba(235,240,248,.4)';
      g.fillRect(x-baseW/2,R.gy-h*u,baseW,h*0.045);
    }
    g.strokeStyle='rgba(255,255,255,.12)';g.lineWidth=0.8;
    for(let d2=-baseW;d2<baseW;d2+=8*R.S){
      g.beginPath();g.moveTo(x+d2,R.gy);g.lineTo(x+d2*0.4,top);g.stroke();
    }
    g.restore();
    g.fillStyle='rgba(255,120,100,.9)';
    g.beginPath();g.arc(x,top-3*R.S,3*R.S,0,R.TAU);g.fill();
    R.blinkers.push({x,y:top-3*R.S,li:1,ph:Math.random()*6.3});
  };
  let x=-40;
  while(x<LW+40){
    const w=rnd(df.w[0],df.w[1])*R.S,h=R.H*rnd(df.h[0],df.h[1]),top=R.gy+4-h;
    const bg2=g.createLinearGradient(0,top,0,R.gy);
    bg2.addColorStop(0,shade(df.col,16));bg2.addColorStop(1,shade(df.col,-12));
    g.fillStyle=bg2;g.fillRect(x,top,w,h+6);
    /* stacked vertical neon sign boards */
    if(li>=1&&Math.random()<.7){
      const sx0=x+w*rnd(.25,.75),sy0=top+h*rnd(.15,.4);
      const nc2=R.NEON[Math.random()*R.NEON.length|0];
      const nbn=2+(Math.random()*3|0);
      for(let b2=0;b2<nbn;b2++){
        g.save();g.shadowColor=nc2;g.shadowBlur=8;
        g.globalAlpha=.85;g.fillStyle=nc2;
        g.fillRect(sx0,sy0+b2*11*R.S,7*R.S,8.5*R.S);
        g.restore();
      }
      R.neons.push({x:sx0+3.5*R.S,y:sy0+nbn*5.5*R.S,w:4*R.S,h:nbn*11*R.S,c:nc2,ph:Math.random()*6.3,li});
    }
    const cols=Math.max(2,Math.round(w/(12*R.S))),rows=Math.max(3,Math.round(h/(14*R.S))),cw=(w-8*R.S)/cols,ch=(h-8*R.S)/rows;
    for(let r2=0;r2<rows;r2++)for(let q=0;q<cols;q++)if(Math.random()<df.win){
      g.globalAlpha=df.wa*(.3+Math.random()*.7);
      g.fillStyle=Math.random()<.6?'#ffd9a0':'#8fe8ff';
      g.fillRect(x+4*R.S+q*cw,top+4*R.S+r2*ch,Math.max(1.5,cw*0.45),Math.max(2,ch*0.5));
    }
    g.globalAlpha=1;
    x+=w+rnd(df.gap[0],df.gap[1])*R.S;
  }
  if(li===1)drawTTower(LW*0.62,R.H*0.5);
  if(li===0){
    /* skytree needle on the horizon */
    const sx=LW*0.8,sh=R.H*0.34;
    g.fillStyle=shade(df.col,14);
    g.fillRect(sx-1.6*R.S,R.gy-sh,3.2*R.S,sh);
    g.fillStyle=shade(df.col,24);
    g.fillRect(sx-6*R.S,R.gy-sh*0.66,12*R.S,4*R.S);
    g.fillRect(sx-4*R.S,R.gy-sh*0.4,8*R.S,3*R.S);
    g.fillStyle=shade(df.col,30);g.fillRect(sx-0.8*R.S,R.gy-sh-8*R.S,1.6*R.S,8*R.S);
  }
}
};
/* exposed so world.js can register more place types */
E.GEN=GEN;E.PAL=PAL;
function ph0(li){return R.H*(PAL[R.LOC[R.locI].sky][li].h[1]||0.4)}

/* ---- build all static scenery ---- */
E.buildAll=function(){
  if(!R.W||!R.H)return;
  const L=R.LOC[R.locI],type=L.sky,defs=PAL[type];
  /* r8: strips are 1.8× the screen so the scenery can drift with the journey (see E.lox) */
  const sd=Math.min(2,R.d),LW=Math.ceil(R.W*(R.journey?1.8:1.12)),LH=Math.ceil(R.gy+8);
  const rnd=(a,b)=>a+Math.random()*(b-a);
  R.layers=[];R.neons=[];R.lamps=[];R.blinkers=[];R.chimneys=[];R.searchlight=null;
  R.clockFaces=[];R.londonEye=null;R.beacon=null;R.torches=[];
  defs.forEach((df,li)=>{
    const c=document.createElement('canvas');
    c.width=Math.max(2,LW*sd);c.height=Math.max(2,LH*sd);
    const g=c.getContext('2d');g.scale(sd,sd);
    GEN[type](g,df,li,LW,rnd);
    if(df.blur&&R.filterOK){
      const tmp=document.createElement('canvas');tmp.width=c.width;tmp.height=c.height;
      tmp.getContext('2d').drawImage(c,0,0);
      g.save();g.setTransform(1,0,0,1,0,0);g.clearRect(0,0,c.width,c.height);
      g.filter='blur('+(df.blur*sd)+'px)';g.drawImage(tmp,0,0);g.filter='none';g.restore();
    }
    R.layers.push({c,par:df.par});
  });
  /* one sweeping searchlight from the harbor rooftops */
  if(type==='city'&&R.layers[2]){
    const sd2=Math.min(2,R.d),w2=R.layers[2].c.width/sd2;
    R.searchlight={x:w2*rnd(.15,.85),y:R.gy-R.H*rnd(.14,.24),li:2,ph:Math.random()*6.3};
  }
  /* stars, clouds */
  R.stars=[];
  for(let i=0;i<130;i++)R.stars.push({x:Math.random()*R.W,y:Math.random()*R.gy*.62,r:(1+Math.random()*1.2)*R.S,a:.4+Math.random()*.6,sp:1+Math.random()*2.5,ph:Math.random()*6.3});
  const fc=L.fogC;
  const mk=(w,h,n,a)=>{
    const c=document.createElement('canvas');c.width=w;c.height=h;
    const g=c.getContext('2d');
    for(let i=0;i<n;i++){
      const x=Math.random()*w,y=h*(.25+Math.random()*.5),r=R.rnd(40,120);
      for(const o of[-w,0,w]){
        const rg=g.createRadialGradient(x+o,y,0,x+o,y,r);
        rg.addColorStop(0,`rgba(${fc[0]*0.45|0},${fc[1]*0.45|0},${fc[2]*0.55|0},${a})`);
        rg.addColorStop(1,'rgba(0,0,0,0)');
        g.fillStyle=rg;g.fillRect(x+o-r,y-r,r*2,r*2);
      }
    }
    return c;
  };
  R.clouds=[{c:mk(1200,260,70,.22),w:R.W*1.6},{c:mk(1200,260,55,.17),w:R.W*1.9}];
  /* steam vents: only on paved grounds */
  R.vents=[];
  const gr=L.ground;
  if(gr==='asphalt')[0.18,0.5,0.82].forEach(u=>R.vents.push({x:R.W*u+(Math.random()-0.5)*R.W*0.08,t:Math.random()*1.2}));
  else if(gr==='flagstone'||gr==='cobble')[0.35,0.72].forEach(u=>R.vents.push({x:R.W*u+(Math.random()-0.5)*R.W*0.06,t:Math.random()*1.5}));
  /* film grain pattern */
  const nc=document.createElement('canvas');nc.width=nc.height=96;
  const ng=nc.getContext('2d'),id=ng.createImageData(96,96);
  for(let i=0;i<id.data.length;i+=4){const v=Math.random()*255;id.data[i]=id.data[i+1]=id.data[i+2]=v;id.data[i+3]=255}
  ng.putImageData(id,0,0);R.noisePat=R.cx.createPattern(nc,'repeat');
  /* hex pattern for the shield dome */
  const hs=14,hc=document.createElement('canvas');hc.width=hs*3;hc.height=Math.ceil(Math.sqrt(3)*hs);
  const hg=hc.getContext('2d');hg.strokeStyle='rgba(170,235,255,1)';hg.globalAlpha=0.5;hg.lineWidth=1;
  const hh=Math.sqrt(3)*hs;
  for(let i=-1;i<=3;i++)for(let j=-1;j<=3;j++){
    const cxp=i*hs*1.5,cyp=j*hh+(i%2?hh/2:0);
    hg.beginPath();
    for(let a=0;a<6;a++){const ang=Math.PI/3*a,hxp=cxp+Math.cos(ang)*hs,hyp=cyp+Math.sin(ang)*hs;a?hg.lineTo(hxp,hyp):hg.moveTo(hxp,hyp)}
    hg.closePath();hg.stroke();
  }
  R.hexPat=R.cx.createPattern(hc,'repeat');
};

/* ---- living details: birds crossing the sky ---- */
let birdT=6;
E.update=function(dt){
  birdT-=dt;
  if(birdT<=0&&(R.st==='play'||R.st==='wait'||R.st==='menu')){
    birdT=10+Math.random()*16;
    const dir=Math.random()<.5?-1:1;
    const by=R.H*(0.08+Math.random()*0.22);
    const n=2+(Math.random()*3|0);
    for(let i=0;i<n;i++)R.birds.push({
      x:dir>0?-30-i*26*R.S:R.W+30+i*26*R.S,
      y:by+(Math.random()-0.5)*26*R.S,
      vx:dir*R.W*(0.045+Math.random()*0.02),
      ph:Math.random()*6.3,s:Math.random()
    });
  }
  for(const b of R.birds){b.x+=b.vx*dt;b.y+=Math.sin(R.t*0.7+b.ph)*7*dt}
  R.fx.compact(R.birds,b=>b.x>-60&&b.x<R.W+60);
};

/* ---- sky ---- */
E.drawSky=function(){
  const cx=R.cx,f=R.flash,gy=R.gy;
  const g=cx.createLinearGradient(0,0,0,gy+10);
  /* r6 time of day: the weather's sky colours are pulled toward the hour's sky (less so under heavy cloud,
     sand or fog, which keep their own colour) */
  const T=R._tod,sk=E._sk||(E._sk=[[0,0,0],[0,0,0],[0,0,0]]),src=[R.wx.top,R.wx.mid,R.wx.bot];
  const ww=T?T.sw*(1-Math.min(.7,R.wx.cloud*.45+R.wx.sand*.7+R.wx.fog*.3)):0;
  for(let r=0;r<3;r++)for(let j=0;j<3;j++)sk[r][j]=src[r][j]+((T?T.sky[r][j]:src[r][j])-src[r][j])*ww;
  g.addColorStop(0,R.rgb(sk[0],f));g.addColorStop(.5,R.rgb(sk[1],f*.8));g.addColorStop(1,R.rgb(sk[2],f*.5));
  cx.fillStyle=g;cx.fillRect(-80,-80,R.W+160,gy+100);
  const nt=R._tod?R._tod.night:0;
  const dy=R._tod?R._tod.day:0;
  const sv=Math.max(R.wx.stars*(1-dy*.95),nt*.9)*(1-R.wx.cloud*.75);
  if(sv>.02){
    cx.fillStyle='#fff';
    for(const s of R.stars){cx.globalAlpha=sv*s.a*(.35+.65*Math.abs(Math.sin(R.t*s.sp+s.ph)));cx.fillRect(s.x,s.y,s.r,s.r)}
    const mx=R.W*.78,my=R.H*.17,mr=26*R.S;
    let rg=cx.createRadialGradient(mx,my,mr*.5,mx,my,mr*5);rg.addColorStop(0,'rgba(200,215,255,.35)');rg.addColorStop(1,'rgba(200,215,255,0)');
    cx.globalAlpha=sv;cx.fillStyle=rg;cx.fillRect(mx-mr*5,my-mr*5,mr*10,mr*10);
    rg=cx.createRadialGradient(mx-mr*.3,my-mr*.3,0,mx,my,mr);rg.addColorStop(0,'#fffef6');rg.addColorStop(1,'#cdd7ee');
    cx.globalAlpha=Math.min(1,sv*1.3);cx.fillStyle=rg;cx.beginPath();cx.arc(mx,my,mr,0,R.TAU);cx.fill();cx.globalAlpha=1;
  }
  /* sun disc + glow */
  const sunA=Math.max(R.wx.sun,dy*.8);
  if(sunA>0.35&&nt<.5&&(R.wx.stars<0.5||dy>.6)){
    const sx=R.W*0.74,sy=R.H*0.16,sr=30*R.S,a=sunA*(1-R.wx.cloud*0.8)*(1-nt);
    let sg=cx.createRadialGradient(sx,sy,0,sx,sy,sr*7);
    sg.addColorStop(0,`rgba(255,225,170,${.5*a})`);sg.addColorStop(.25,`rgba(255,200,130,${.2*a})`);sg.addColorStop(1,'rgba(255,190,120,0)');
    cx.fillStyle=sg;cx.fillRect(sx-sr*7,sy-sr*7,sr*14,sr*14);
    cx.globalAlpha=a;cx.fillStyle='#fff4dc';cx.beginPath();cx.arc(sx,sy,sr,0,R.TAU);cx.fill();cx.globalAlpha=1;
  }
  if(R.wx.cloud>.03){
    R.clouds.forEach((c,i)=>{
      const ox=-((R.t*(i?14:8)*(.5+R.wx.wind))%c.w),y=gy*(.02+.1*i),h=gy*.55;
      cx.globalAlpha=Math.min(1,R.wx.cloud*(i?.7:.9));
      cx.drawImage(c.c,ox,y,c.w,h);cx.drawImage(c.c,ox+c.w,y,c.w,h);
      if(f>.02){cx.globalCompositeOperation='lighter';cx.globalAlpha=Math.min(1,f*.55*R.wx.cloud);cx.drawImage(c.c,ox,y,c.w,h);cx.drawImage(c.c,ox+c.w,y,c.w,h);cx.globalCompositeOperation='source-over'}
    });cx.globalAlpha=1;
  }
  /* birds */
  if(R.birds.length&&R.wx.sand<0.3){
    cx.strokeStyle='rgba(22,26,46,0.55)';
    cx.lineWidth=1.2;
    for(const b of R.birds){
      const flap=Math.sin(R.t*9+b.ph);
      const s=(3+b.s*3.5)*R.S;
      cx.beginPath();
      cx.moveTo(b.x-s,b.y-flap*s*0.6);
      cx.quadraticCurveTo(b.x-s*0.35,b.y+flap*s*0.2,b.x,b.y);
      cx.quadraticCurveTo(b.x+s*0.35,b.y+flap*s*0.2,b.x+s,b.y-flap*s*0.6);
      cx.stroke();
    }
  }
  E.sunRays();
  E.lightningRays();
  /* warm horizon glow (fills the whole sky so no cutoff edge shows) */
  const L=R.LOC[R.locI];
  const rg=cx.createRadialGradient(R.W/2,gy,0,R.W/2,gy,R.W*.6);
  rg.addColorStop(0,`rgba(${L.glow},.30)`);rg.addColorStop(1,`rgba(${L.glow},0)`);
  cx.fillStyle=rg;cx.fillRect(-80,-80,R.W+160,gy+180);
};

E.sunRays=function(){
  const s=R.wx.sun*(1-R.wx.cloud*0.75)*(1-R.wx.fog*0.3);
  if(s<0.04)return;
  const cx=R.cx,sx=R.W*0.74,sy=R.H*0.14;
  cx.save();cx.globalCompositeOperation='lighter';
  for(let i=0;i<6;i++){
    const ang=Math.PI*0.35+i*0.16+Math.sin(R.t*0.05+i)*0.03;
    const len=R.gy*1.6,wTop=8*R.S+i*2*R.S,wBot=R.W*0.05+i*R.W*0.008;
    const ex=sx+Math.cos(ang+Math.PI)*len*0.1,ey=sy+Math.abs(Math.sin(ang))*len;
    const alpha=0.05*s*(0.7+0.3*Math.sin(R.t*0.4+i*2));
    const gg=cx.createLinearGradient(sx,sy,ex,ey);
    gg.addColorStop(0,`rgba(255,220,160,${alpha})`);gg.addColorStop(1,'rgba(255,220,160,0)');
    cx.fillStyle=gg;
    cx.beginPath();
    cx.moveTo(sx-Math.cos(ang)*wTop,sy-Math.sin(ang)*wTop);
    cx.lineTo(sx+Math.cos(ang)*wTop,sy+Math.sin(ang)*wTop);
    cx.lineTo(ex+Math.cos(ang)*wBot,ey+wBot);cx.lineTo(ex-Math.cos(ang)*wBot,ey-wBot);
    cx.closePath();cx.fill();
  }
  cx.restore();
};

E.lightningRays=function(){
  if(R.flash<0.12)return;
  const cx=R.cx,lx=R.storm.lightX||R.W/2,ly=-30;
  cx.save();cx.globalCompositeOperation='lighter';
  for(let i=0;i<7;i++){
    const dir=(i-3)/3;
    const bx=lx+dir*R.W*0.42;
    const wTop=6*R.S,wBot=R.W*0.06;
    const alpha=R.flash*0.10*(0.6+0.4*Math.abs(Math.sin(R.t*31+i*2.3)));
    if(alpha<0.01)continue;
    const gg=cx.createLinearGradient(lx,ly,bx,R.gy);
    gg.addColorStop(0,`rgba(200,225,255,${alpha})`);gg.addColorStop(1,'rgba(200,225,255,0)');
    cx.fillStyle=gg;
    cx.beginPath();
    cx.moveTo(lx-wTop,ly);cx.lineTo(lx+wTop,ly);
    cx.lineTo(bx+wBot,R.gy);cx.lineTo(bx-wBot,R.gy);
    cx.closePath();cx.fill();
  }
  cx.restore();
};

/* ---- city / skyline layers + lights ---- */
/* r5: extra far parallax layer — distant ridge/hills lost in atmospheric haze (cached per place & size) */
E.drawRidge=function(cx,L,fc){
  const key=R.locI+'|'+R.W+'|'+R.gy+'|'+fc;
  if(!E._ridge||E._ridge.key!==key){
    const c=E._ridge&&E._ridge.c||document.createElement('canvas');
    const w=Math.ceil(R.W*1.2),h=Math.ceil(R.gy);c.width=w;c.height=h;
    const g=c.getContext('2d');g.clearRect(0,0,w,h);
    const flat=L.ground==='water'||L.sky==='city'||L.sky==='newyork'||L.sky==='tokyo';
    let seed=R.locI*977+13;const rr=()=>{seed=(seed*16807)%2147483647;return seed/2147483647};
    for(let band=0;band<2;band++){
      const amp=h*(flat?0.05:0.13)*(band?0.7:1),base=h*(band?0.80:0.74),ph=rr()*6,ph2=rr()*6;
      g.beginPath();g.moveTo(0,h);
      for(let x=0;x<=w;x+=8){const y=base-amp*(0.55+0.3*Math.sin(x/w*6.3*1.3+ph)+0.15*Math.sin(x/w*6.3*4.1+ph2)+0.05*Math.sin(x/w*6.3*13+ph));g.lineTo(x,y)}
      g.lineTo(w,h);g.closePath();
      g.fillStyle=`rgba(${fc},${band?0.34:0.22})`;g.fill();
    }
    /* haze wash over the ridge base */
    const hz=g.createLinearGradient(0,h*0.55,0,h);hz.addColorStop(0,`rgba(${fc},0)`);hz.addColorStop(1,`rgba(${fc},0.35)`);
    g.fillStyle=hz;g.fillRect(0,h*0.55,w,h*0.45);
    E._ridge={key,c};
  }
  const r=E._ridge,Jr=R.journey,ox=Jr&&Jr.locked()?-(r.c.width-R.W)*(.15+.7*Jr.progS):-(r.c.width-R.W)/2-(R.px-R.W/2)*0.004;
  cx.drawImage(r.c,ox,0);
};
/* r8 journey travel: each layer slides left as the board crosses the level (far layers slower). Outside a run the
   old px parallax is used. */
const LAYER_F=[.45,.75,1];
E.lox=function(La,i){
  const sd=Math.min(2,R.d),w=La.c.width/sd,J=R.journey;
  if(J&&J.locked()&&w>R.W*1.4)return (w-R.W)*((LAYER_F[i]==null?1:LAYER_F[i])*(.5-J.progS)-.5);
  return -(w-R.W)/2-(R.px-R.W/2)*La.par;
};
E.drawCity=function(){
  const cx=R.cx;
  R.lightsS.length=0;
  const L=R.LOC[R.locI],fc=`${L.fogC[0]},${L.fogC[1]},${L.fogC[2]}`;
  const sd=Math.min(2,R.d);
  const layerOx=i=>{const La=R.layers[i];if(!La)return 0;return E.lox(La,i)};
  E.drawRidge(cx,L,fc);
  R.layers.forEach((La,i)=>{
    const w=La.c.width/sd,ox=E.lox(La,i);
    cx.drawImage(La.c,ox,0,w,R.gy+8);
    if(R.flash>.03){cx.globalCompositeOperation='lighter';cx.globalAlpha=R.flash*.3;cx.drawImage(La.c,ox,0,w,R.gy+8);cx.globalCompositeOperation='source-over';cx.globalAlpha=1}
    if(i<2){
      const a=Math.min(.85,(.14+R.wx.fog*.55)*(i?.65:1));
      const g=cx.createLinearGradient(0,R.gy*.35,0,R.gy+8);
      g.addColorStop(0,`rgba(${fc},0)`);g.addColorStop(1,`rgba(${fc},${a})`);
      cx.fillStyle=g;cx.fillRect(0,R.gy*.35,R.W,R.gy*.65+8);
    }
    cx.globalCompositeOperation='lighter';
    for(const n of R.neons)if(n.li===i){
      let p=.62+.38*Math.sin(R.t*4+n.ph);if(Math.sin(R.t*37+n.ph*91)>.985)p*=.25;
      const x=ox+n.x,y=n.y+n.h/2,r=n.h*(1.1+R.wx.fog*.9);
      const rg=cx.createRadialGradient(x,y,0,x,y,r);
      rg.addColorStop(0,n.c);rg.addColorStop(1,'rgba(0,0,0,0)');
      cx.globalAlpha=p*(.2+R.wx.fog*.18);cx.fillStyle=rg;cx.fillRect(x-r,y-r,r*2,r*2);
      R.lightsS.push({x,y,c:n.c,a:p,kind:'neon'});
    }
    cx.globalAlpha=1;cx.globalCompositeOperation='source-over';
  });
  /* lamps with volumetric cones */
  for(const l of R.lamps){
    const La=R.layers[l.li];if(!La)continue;
    const w=La.c.width/sd,ox=E.lox(La,l.li);
    E.drawLamp(l,ox+l.x,l.y);
  }
  /* blinking antenna + crane lights */
  for(const b of R.blinkers){
    const x=layerOx(b.li)+b.x;
    const a=Math.pow(Math.max(0,Math.sin(R.t*1.4+b.ph)),3);
    if(a<0.06)continue;
    cx.save();cx.globalCompositeOperation='lighter';
    cx.fillStyle=`rgba(255,90,70,${a*0.9})`;
    cx.beginPath();cx.arc(x,b.y,1.5*R.S,0,R.TAU);cx.fill();
    const g=cx.createRadialGradient(x,b.y,0,x,b.y,8*R.S);
    g.addColorStop(0,`rgba(255,90,70,${a*0.45})`);g.addColorStop(1,'rgba(255,90,70,0)');
    cx.fillStyle=g;cx.fillRect(x-8*R.S,b.y-8*R.S,16*R.S,16*R.S);
    cx.restore();
  }
  /* Big Ben clock faces: warm shimmer */
  for(const c of R.clockFaces){
    const x=layerOx(c.li)+c.x;
    const a=0.5+0.2*Math.sin(R.t*1.1);
    cx.save();cx.globalCompositeOperation='lighter';
    const g=cx.createRadialGradient(x,c.y,0,x,c.y,c.r);
    g.addColorStop(0,`rgba(255,220,150,${a*0.5})`);g.addColorStop(1,'rgba(255,220,150,0)');
    cx.fillStyle=g;cx.fillRect(x-c.r,c.y-c.r,c.r*2,c.r*2);
    cx.restore();
  }
  /* the London Eye: rotating rim, spokes and capsules */
  if(R.londonEye){
    const x=layerOx(R.londonEye.li)+R.londonEye.x;
    const e=R.londonEye;
    cx.save();cx.globalCompositeOperation='lighter';
    cx.strokeStyle='rgba(150,190,255,0.4)';cx.lineWidth=1.6;
    cx.beginPath();cx.arc(x,e.y,e.r,0,R.TAU);cx.stroke();
    cx.strokeStyle='rgba(150,190,255,0.22)';cx.lineWidth=1;
    for(let s2=0;s2<10;s2++){
      const a2=R.t*0.15+s2/10*R.TAU;
      cx.beginPath();cx.moveTo(x,e.y);cx.lineTo(x+Math.cos(a2)*e.r,e.y+Math.sin(a2)*e.r);cx.stroke();
    }
    cx.fillStyle='rgba(190,220,255,0.55)';
    for(let s2=0;s2<12;s2++){
      const a2=R.t*0.15+s2/12*R.TAU+R.TAU/24;
      cx.beginPath();cx.arc(x+Math.cos(a2)*e.r,e.y+Math.sin(a2)*e.r,2.2*R.S,0,R.TAU);cx.fill();
    }
    const hg=cx.createRadialGradient(x,e.y,0,x,e.y,10*R.S);
    hg.addColorStop(0,'rgba(180,210,255,.6)');hg.addColorStop(1,'rgba(180,210,255,0)');
    cx.fillStyle=hg;cx.fillRect(x-10*R.S,e.y-10*R.S,20*R.S,20*R.S);
    cx.restore();
  }
  /* Eiffel beacon: slowly rotating double searchlight */
  if(R.beacon){
    const x=layerOx(R.beacon.li)+R.beacon.x,y=R.beacon.y;
    cx.save();cx.globalCompositeOperation='lighter';
    for(const off of[0,Math.PI]){
      const a2=R.t*0.3+off;
      const dx=Math.cos(a2),dy=Math.sin(a2);
      const len=R.W*0.4,px3=-dy,py3=dx;
      const g2=cx.createLinearGradient(x,y,x+dx*len,y+dy*len);
      g2.addColorStop(0,'rgba(255,240,200,0.28)');g2.addColorStop(1,'rgba(255,240,200,0)');
      cx.fillStyle=g2;
      cx.beginPath();
      cx.moveTo(x+px3*2.5*R.S,y+py3*2.5*R.S);
      cx.lineTo(x-px3*2.5*R.S,y-py3*2.5*R.S);
      cx.lineTo(x+dx*len+px3*24*R.S,y+dy*len+py3*24*R.S);
      cx.lineTo(x+dx*len-px3*24*R.S,y+dy*len-py3*24*R.S);
      cx.closePath();cx.fill();
    }
    const hg2=cx.createRadialGradient(x,y,0,x,y,12*R.S);
    hg2.addColorStop(0,'rgba(255,245,210,.9)');hg2.addColorStop(1,'rgba(255,245,210,0)');
    cx.fillStyle=hg2;cx.fillRect(x-12*R.S,y-12*R.S,24*R.S,24*R.S);
    cx.restore();
  }
  /* Lady Liberty's torch flame */
  for(const t of R.torches){
    const x=layerOx(t.li)+t.x;
    const fl=0.7+0.3*Math.sin(R.t*9+x);
    cx.save();cx.globalCompositeOperation='lighter';
    const g=cx.createRadialGradient(x,t.y,0,x,t.y,26*R.S);
    g.addColorStop(0,`rgba(255,210,120,${0.5*fl})`);g.addColorStop(0.4,`rgba(255,160,70,${0.2*fl})`);g.addColorStop(1,'rgba(255,160,70,0)');
    cx.fillStyle=g;cx.fillRect(x-26*R.S,t.y-26*R.S,52*R.S,52*R.S);
    cx.fillStyle=`rgba(255,235,170,${0.85*fl})`;
    cx.beginPath();
    cx.moveTo(x,t.y-7*R.S);
    cx.quadraticCurveTo(x+3.5*R.S,t.y-2*R.S,x,t.y+3*R.S);
    cx.quadraticCurveTo(x-3.5*R.S,t.y-2*R.S,x,t.y-7*R.S);
    cx.fill();
    cx.restore();
  }
  /* chimney smoke (Hermon cabin) */
  for(const c of R.chimneys){
    const x=layerOx(c.li)+c.x;
    for(let i=0;i<6;i++){
      const u=((R.t*0.22)+i/6)%1;
      const px2=x+Math.sin(R.t*0.7+i*2)*3*R.S+u*11*R.S;
      const py=c.y-u*48*R.S;
      const r=(2.5+u*7)*R.S;
      cx.fillStyle=`rgba(195,205,225,${(1-u)*0.14})`;
      cx.beginPath();cx.arc(px2,py,r,0,R.TAU);cx.fill();
    }
  }
  /* sweeping harbor searchlight */
  if(R.searchlight){
    const sx=layerOx(R.searchlight.li)+R.searchlight.x,sy=R.searchlight.y;
    const a=-Math.PI*0.62+Math.sin(R.t*0.13+R.searchlight.ph)*0.5;
    const dx=Math.cos(a),dy=Math.sin(a);
    const len=R.gy*1.35;
    const ex=sx+dx*len,ey=sy+dy*len;
    const px3=-dy,py3=dx;
    cx.save();cx.globalCompositeOperation='lighter';
    const g2=cx.createLinearGradient(sx,sy,ex,ey);
    g2.addColorStop(0,'rgba(200,220,255,0.20)');g2.addColorStop(0.65,'rgba(200,220,255,0.05)');g2.addColorStop(1,'rgba(200,220,255,0)');
    cx.fillStyle=g2;
    cx.beginPath();
    cx.moveTo(sx+px3*5*R.S,sy+py3*5*R.S);
    cx.lineTo(sx-px3*5*R.S,sy-py3*5*R.S);
    cx.lineTo(ex+px3*70*R.S,ey+py3*70*R.S);
    cx.lineTo(ex-px3*70*R.S,ey-py3*70*R.S);
    cx.closePath();cx.fill();
    cx.restore();
  }
  /* anamorphic lens flares */
  if(R.Q>=1){
    cx.save();cx.globalCompositeOperation='lighter';
    for(const li of R.lightsS){
      const a=li.a*(0.22+R.wx.fog*0.45+R.wx.rain*0.3);
      if(a<0.08)continue;
      const len=(30+90*li.a)*R.S;
      const fg=cx.createLinearGradient(li.x-len,li.y,li.x+len,li.y);
      fg.addColorStop(0,R.hexA(li.c.startsWith('rgb')?'#ffb45a':li.c,0));
      fg.addColorStop(.5,R.hexA(li.c.startsWith('rgb')?'#ffb45a':li.c,Math.min(0.5,a)));
      fg.addColorStop(1,R.hexA(li.c.startsWith('rgb')?'#ffb45a':li.c,0));
      cx.fillStyle=fg;cx.fillRect(li.x-len,li.y-0.9*R.S,len*2,1.8*R.S);
      const cg=cx.createRadialGradient(li.x,li.y,0,li.x,li.y,10*R.S);
      cg.addColorStop(0,R.hexA(li.c.startsWith('rgb')?'#ffb45a':li.c,Math.min(0.6,a)));
      cg.addColorStop(1,R.hexA(li.c.startsWith('rgb')?'#ffb45a':li.c,0));
      cx.fillStyle=cg;cx.fillRect(li.x-10*R.S,li.y-10*R.S,20*R.S,20*R.S);
    }
    cx.restore();
  }
  /* lightning directional light wash */
  if(R.flash>0.03){
    const lx=R.storm.lightX||R.W/2;
    cx.save();cx.globalCompositeOperation='lighter';
    const dg=cx.createRadialGradient(lx,R.gy*0.2,0,lx,R.gy*0.2,R.W*0.75);
    dg.addColorStop(0,`rgba(205,228,255,${R.flash*0.24})`);dg.addColorStop(1,'rgba(205,228,255,0)');
    cx.fillStyle=dg;cx.fillRect(0,0,R.W,R.gy+40);
    cx.restore();
  }
};

E.drawLamp=function(l,x,y){
  const cx=R.cx,k=R.S;
  if(l.kind==='firefly'){
    const fx=x+Math.sin(R.t*0.7+l.ph)*40*R.S,fy=y+Math.sin(R.t*1.31+l.ph*2)*24*R.S;
    const tw=.4+.6*Math.abs(Math.sin(R.t*2.2+l.ph*3));
    const rg=cx.createRadialGradient(fx,fy,0,fx,fy,14*R.S);
    rg.addColorStop(0,`rgba(212,255,150,${.8*tw})`);rg.addColorStop(1,'rgba(212,255,150,0)');
    cx.save();cx.globalCompositeOperation='lighter';cx.fillStyle=rg;cx.fillRect(fx-14*R.S,fy-14*R.S,28*R.S,28*R.S);cx.restore();
    R.lightsS.push({x:fx,y:fy,c:'#d4ff96',a:tw*0.6,kind:'firefly'});
    return;
  }
  const warm=l.kind==='brazier'?'255,150,60':l.kind==='lantern'?'255,200,120':'255,190,110';
  const fl=l.kind==='brazier'?(0.75+0.25*Math.sin(R.t*11+l.ph)+0.1*Math.sin(R.t*23+l.ph*2)):(0.9+0.1*Math.sin(R.t*23+l.ph));
  const r=(70+R.wx.fog*70)*R.S;
  cx.save();cx.globalCompositeOperation='lighter';
  /* head glow */
  let rg=cx.createRadialGradient(x,y,0,x,y,r);
  rg.addColorStop(0,`rgba(${warm},1)`);rg.addColorStop(.3,`rgba(${warm},.35)`);rg.addColorStop(1,`rgba(${warm},0)`);
  cx.globalAlpha=fl*.8;cx.fillStyle=rg;cx.fillRect(x-r,y-r,r*2,r*2);
  /* volumetric cone: wide soft shell + bright core */
  const spread=(l.kind==='brazier'?46:60)*k*(1+R.wx.fog*0.35);
  const cg=cx.createLinearGradient(0,y,0,R.gy);
  cg.addColorStop(0,`rgba(${warm},.20)`);cg.addColorStop(1,`rgba(${warm},0)`);
  cx.globalAlpha=fl*(.5+R.wx.rain*.6+R.wx.fog*.5+R.wx.snow*.4);
  cx.fillStyle=cg;
  cx.beginPath();cx.moveTo(x-4*k,y);cx.lineTo(x+4*k,y);cx.lineTo(x+spread,R.gy);cx.lineTo(x-spread,R.gy);cx.closePath();cx.fill();
  const cg2=cx.createLinearGradient(0,y,0,R.gy);
  cg2.addColorStop(0,`rgba(${warm},.28)`);cg2.addColorStop(1,`rgba(${warm},0)`);
  cx.globalAlpha=fl*.55;cx.fillStyle=cg2;
  cx.beginPath();cx.moveTo(x-2*k,y);cx.lineTo(x+2*k,y);cx.lineTo(x+spread*0.45,R.gy);cx.lineTo(x-spread*0.45,R.gy);cx.closePath();cx.fill();
  /* dust motes drifting inside the cone */
  if(l.motes){
    cx.globalAlpha=1;
    for(const m of l.motes){
      const u=(m.u+R.t*m.sp)%1;
      const mx=x+Math.sin(u*9+m.ph)*spread*u*0.5;
      const my=y+(R.gy-y)*u;
      const ma=fl*0.3*(1-u)*(0.5+0.5*Math.sin(R.t*3+m.ph*5));
      cx.fillStyle=`rgba(255,230,180,${ma})`;
      cx.beginPath();cx.arc(mx,my,m.sz*k,0,R.TAU);cx.fill();
    }
  }
  cx.restore();
  R.lightsS.push({x,y,c:`rgb(${warm})`,a:fl,kind:l.kind});
};
R.onResize.push(()=>E.buildAll());
})();
