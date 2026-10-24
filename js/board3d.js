/* Rain of the Word — board3d: true-3D skateboard renderer (ported from V2). Defines window.drawSkateboard */
/* ---- 3D skateboard renderer (board.js, inlined) ---- */
/* drawSkateboard(ctx, x, y, scale, opts)
 * Coordinates: (x,y) = canvas point on the GROUND midway between the wheels' contact
 * points when the board is un-rotated. All rotations pivot about the deck centre,
 * which sits at (x, y - 11.5*scale); that point stays fixed while flipping/spinning,
 * so in the air you can treat (x, y-11.5*scale) as the board centre.
 * Board-local axes: +X toward nose (screen right), +Y up, +Z toward viewer.
 * opts: flipAngle (about long X axis), spinAngle (about vertical Y), tilt (pitch, +=nose up),
 *       deckColors:[c1,c2] (underside graphic), gripColor. ~80px long at scale 1.
 */
(function(){
  const SBC={};
  const PIVOT_Y = 13.2, VIEW_PITCH = 0.16, PERSP = 700;
  const L = 40, W = 10, T = 2.6, DECK_Y = 12.2;   /* round 4: Latter-Rain proportions (thicker ply, more ride height) */            // half-length, half-width, thickness
  const WHEEL_R = 5.2, WHEEL_W = 3.6, TRUCK_X = 23;
  function hex(c){ c=c.replace('#',''); if(c.length===3)c=c.split('').map(h=>h+h).join('');
    return [parseInt(c.substr(0,2),16),parseInt(c.substr(2,2),16),parseInt(c.substr(4,2),16)]; }
  function shade(c,k){ const [r,g,b]=hex(c); const f=v=>Math.max(0,Math.min(255,Math.round(v*k)));
    return `rgb(${f(r)},${f(g)},${f(b)})`; }
  // deck centre-line profile: flat middle, short kicks
  function prof(u){ // u in [-L,L] -> y offset of deck bottom
    const a=Math.abs(u), s=29; if(a<=s) return 0;
    const t=(a-s)/(L-s); return 6.2*t*t*0.55 + 6.2*t*0.45*t; }
  function build(o){
    const P=[]; // {pts:[[x,y,z]...], col, ctr:[x,y,z], line}
    const N=24, xs=[]; for(let i=0;i<=N;i++){ const t=i/N; xs.push(-L+2*L*t); }
    const cap=u=>{ const a=Math.abs(u); return a>L-3 ? Math.sqrt(Math.max(0,1-((a-(L-3))/3)**2)) : 1; };
    const lk=o.look||{};
    const grip=lk.grip||o.gripColor||'#262626', [c1,c2]=o.deckColors||['#d23a2a','#f2c230'], ply=lk.side||'#c08d55';   /* wood-ply sides like the Latter-Rain deck */
    const tk=lk.truck||'#a9afb6', whl=lk.wheel||'#efe9d6', k0=lk.c0||grip, k1=lk.c1||k0;
    const mix=(a,b,t)=>{const A=hex(a),B=hex(b);return '#'+A.map((v,j)=>('0'+Math.round(v+(B[j]-v)*t).toString(16)).slice(-2)).join('')};
    /* top-deck graphic: colours per [left,centre,right] lane for each segment */
    const topCols=i=>{
      const k=Math.min(i,N-1-i),g=grip;
      switch(lk.pat){
        case 'stripe': return [g,k0,g];
        case 'rails':  return [k0,g,k0];
        case 'bands':  { const c=(i<3||i>=N-3||i===11)?k0:g; return [c,c,c]; }
        case 'checker':return k<4?[g,g,g]:[0,1,2].map(l=>(i+l)%2?k0:g);
        case 'flame':  return [k<4?(k<2?k1:k0):g,k<7?(k<3?k1:k0):g,k<4?(k<2?k1:k0):g];
        case 'hazard': { const c=k<3?g:(Math.floor(i/2)%2?k0:k1); return [c,c,c]; }
        case 'gradient':{ const c=mix(k0,k1,i/(N-1)); return [c,c,c]; }
        default: return [g,g,g];
      }};
    const dc=[0,DECK_Y+1,0];
    for(let i=0;i<N;i++){
      const a=xs[i], b=xs[i+1], ya=DECK_Y+prof(a), yb=DECK_Y+prof(b);
      const wa=W*(0.35+0.65*cap(a)), wb=W*(0.35+0.65*cap(b));
      const ctr=[(a+b)/2,(ya+yb)/2+T/2,0];
      const tc=topCols(i);
      if(tc[0]===tc[1]&&tc[1]===tc[2])P.push({pts:[[a,ya+T,-wa],[b,yb+T,-wb],[b,yb+T,wb],[a,ya+T,wa]],col:tc[0],ctr,grain:true});
      else for(let l=0;l<3;l++){const f0=[-1,-1/3,1/3][l],f1=[-1/3,1/3,1][l];
        P.push({pts:[[a,ya+T,f0*wa],[b,yb+T,f0*wb],[b,yb+T,f1*wb],[a,ya+T,f1*wa]],col:tc[l],ctr,grain:true})}
      const gc = (Math.floor((i+2)/4)%2)?c1:c2;
      P.push({pts:[[a,ya,-wa],[b,yb,-wb],[b,yb,wb],[a,ya,wa]],col:gc,ctr});
      P.push({pts:[[a,ya,wa],[b,yb,wb],[b,yb+T,wb],[a,ya+T,wa]],col:ply,ctr,edge:true});
      P.push({pts:[[a,ya,-wa],[b,yb,-wb],[b,yb+T,-wb],[a,ya+T,-wa]],col:ply,ctr,edge:true});
    }
    for(const e of [0,N]){ const u=xs[e], y0=DECK_Y+prof(u), w=W*0.35;
      P.push({pts:[[u,y0,-w],[u,y0,w],[u,y0+T,w],[u,y0+T,-w]],col:ply,ctr:[0,DECK_Y+3,0]}); }
    const box=(x0,x1,y0,y1,z0,z1,col)=>{ const c=[(x0+x1)/2,(y0+y1)/2,(z0+z1)/2];
      const v=(i,j,k)=>[[x0,x1][i],[y0,y1][j],[z0,z1][k]];
      [[v(0,0,0),v(1,0,0),v(1,1,0),v(0,1,0)],[v(0,0,1),v(1,0,1),v(1,1,1),v(0,1,1)],
       [v(0,0,0),v(0,1,0),v(0,1,1),v(0,0,1)],[v(1,0,0),v(1,1,0),v(1,1,1),v(1,0,1)],
       [v(0,0,0),v(1,0,0),v(1,0,1),v(0,0,1)],[v(0,1,0),v(1,1,0),v(1,1,1),v(0,1,1)]]
       .forEach(pts=>P.push({pts,col,ctr:c})); };
    const cyl=(cx,cy,z0,z1,r,col,hub)=>{ const n=16, c=[cx,cy,(z0+z1)/2], ring=z=>{const a=[];
        for(let k=0;k<n;k++){const t=k/n*Math.PI*2;a.push([cx+r*Math.cos(t),cy+r*Math.sin(t),z]);}return a;};
      const A=ring(z0),B=ring(z1);
      for(let k=0;k<n;k++){const m=(k+1)%n;P.push({pts:[A[k],A[m],B[m],B[k]],col:shade(col,0.9),ctr:c});}
      P.push({pts:A.slice().reverse(),col,ctr:c,hub:[[cx,cy,z0],r]}); P.push({pts:B,col,ctr:c,hub:[[cx,cy,z1],r]}); };
    for(const s of [-1,1]){ const tx=s*TRUCK_X;
      box(tx-4.2,tx+4.2,DECK_Y-1.3,DECK_Y,-3.2,3.2,shade(tk,.85));              // baseplate
      box(tx-1.6+s*0.6,tx+1.6+s*0.6,DECK_Y-4.6,DECK_Y-1.3,-1.6,1.6,shade(tk,.72)); // kingpin/bushing housing
      box(tx-2.2,tx+2.2,WHEEL_R-1.4,DECK_Y-4.2,-1.4,1.4,tk);          // hanger body
      box(tx-1.3,tx+1.3,WHEEL_R-0.9,WHEEL_R+0.9,-W+1.2,W-1.2,shade(tk,1.1));      // hanger arms/axle
      for(const zs of [-1,1]){ const z0=zs>0?W-3.4:-(W-3.4), z1=z0+zs*WHEEL_W;
        cyl(tx,WHEEL_R,Math.min(z0,z1),Math.max(z0,z1),WHEEL_R,whl); }
    }
    return P;
  }
  function rot(p,o){
    let [x,y,z]=p; y-=PIVOT_Y;
    let c=Math.cos(o.flipAngle||0),s=Math.sin(o.flipAngle||0); [y,z]=[y*c-z*s,y*s+z*c];
    c=Math.cos(o.spinAngle||0); s=Math.sin(o.spinAngle||0); [x,z]=[x*c+z*s,-x*s+z*c];
    c=Math.cos(o.tilt||0); s=Math.sin(o.tilt||0); [x,y]=[x*c-y*s,x*s+y*c];
    y+=PIVOT_Y;
    const VP=(o.vp==null?VIEW_PITCH:o.vp); c=Math.cos(VP); s=Math.sin(VP); const yy=y-PIVOT_Y; [y,z]=[yy*c-z*s+PIVOT_Y,yy*s+z*c];
    return [x,y,z];
  }
  const sub=(a,b)=>[a[0]-b[0],a[1]-b[1],a[2]-b[2]], cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
  const LIGHT=(()=>{const v=[-0.35,0.85,0.55],m=Math.hypot(...v);return v.map(q=>q/m);})();
  window.drawSkateboard=function(ctx,x,y,scale,opts){
    const o=opts||{}, ck=(o.deckColors||[]).join()+(o.gripColor||'')+JSON.stringify(o.look||0), polys=SBC[ck]||(SBC[ck]=build(o)), out=[];
    const proj=p=>{const f=PERSP/(PERSP-p[2]); return [x+p[0]*f*scale, y-((p[1]-PIVOT_Y)*f+PIVOT_Y)*scale];};
    for(const q of polys){
      const r=q.pts.map(p=>rot(p,o)), c=rot(q.ctr,o);
      let n=cross(sub(r[1],r[0]),sub(r[2],r[0])); if(Math.hypot(...n)<1e-9) n=cross(sub(r[2],r[0]),sub(r[3]||r[1],r[0]));
      const m=Math.hypot(...n)||1; n=n.map(v=>v/m);
      const cen=r.reduce((a,p)=>[a[0]+p[0]/r.length,a[1]+p[1]/r.length,a[2]+p[2]/r.length],[0,0,0]);
      const d=sub(cen,c); if(n[0]*d[0]+n[1]*d[1]+n[2]*d[2]<0) n=n.map(v=>-v);
      if(n[2]<-0.02) continue;                                      // back-face cull
      const k=0.5+0.6*Math.max(0,n[0]*LIGHT[0]+n[1]*LIGHT[1]+n[2]*LIGHT[2]);
      out.push({s:r.map(proj),z:cen[2]+(q.hub?0.01:0),col:shade(q.col,k),q,r});
    }
    out.sort((a,b)=>a.z-b.z);
    ctx.save(); ctx.lineJoin='round';
    for(const f of out){
      ctx.beginPath(); f.s.forEach((p,i)=>i?ctx.lineTo(p[0],p[1]):ctx.moveTo(p[0],p[1])); ctx.closePath();
      ctx.fillStyle=f.col; ctx.fill(); ctx.strokeStyle=f.col; ctx.lineWidth=1.2; ctx.stroke();
      if(f.q.edge){ // dark ply laminate line along edge
        ctx.beginPath(); const a=f.s[0],b=f.s[1],c=f.s[2],d=f.s[3];
        ctx.moveTo((a[0]+d[0])/2,(a[1]+d[1])/2); ctx.lineTo((b[0]+c[0])/2,(b[1]+c[1])/2);
        ctx.strokeStyle='rgba(90,55,25,0.55)'; ctx.lineWidth=Math.max(0.5,0.35*scale); ctx.stroke(); }
      if(f.q.hub){ // hub/bearing highlight
        const [hc,hr]=f.q.hub; const C=proj(rot(hc,o)), E=proj(rot([hc[0]+hr*0.42,hc[1],hc[2]],o)), F=proj(rot([hc[0],hc[1]+hr*0.42,hc[2]],o));
        ctx.beginPath(); ctx.ellipse(C[0],C[1],Math.max(0.3,Math.hypot(E[0]-C[0],E[1]-C[1])),Math.max(0.3,Math.hypot(F[0]-C[0],F[1]-C[1])),Math.atan2(E[1]-C[1],E[0]-C[0]),0,Math.PI*2);
        ctx.fillStyle='#9aa0a8'; ctx.fill(); ctx.strokeStyle='#5c6168'; ctx.lineWidth=0.5*scale; ctx.stroke();
        ctx.beginPath(); ctx.arc(C[0]-0.25*scale,C[1]-0.25*scale,0.5*scale,0,7); ctx.fillStyle='#fff'; ctx.fill(); }
    }
    ctx.restore();
  };
})();

/* ---- pose sprite cache (Rain of the Word perf) ----
   Riding poses (no flip, small spin from lean, small pitch) are quantised and rendered once into an
   offscreen sprite; afterwards each board draw (main + reflection) is a single drawImage instead of
   ~40 filled+stroked polygons. Trick poses (flip/large spin) still draw live. */
(function(){
  const cache=new Map(),CAP=72;
  window.drawSkateboardFast=function(ctx,x,y,scale,opts,dpr){
    const o=opts||{};
    if(Math.abs(o.flipAngle||0)>1e-3||Math.abs(o.spinAngle||0)>0.6||Math.abs(o.tilt||0)>0.28){window.drawSkateboard(ctx,x,y,scale,o);return}
    const qs=Math.round((o.spinAngle||0)*100),qt=Math.round((o.tilt||0)*100);
    const key=(o.deckColors||[]).join()+(o.gripColor||'')+JSON.stringify(o.look||0)+'|'+(o.vp==null?'':o.vp)+'|'+qs+'|'+qt+'|'+scale.toFixed(3)+'|'+dpr;
    let sp=cache.get(key);
    if(!sp){
      const W=Math.ceil(120*scale*dpr),H=Math.ceil(80*scale*dpr),ox=60*scale,oy=58*scale;
      const c=document.createElement('canvas');c.width=W;c.height=H;
      const g=c.getContext('2d');g.scale(dpr,dpr);
      window.drawSkateboard(g,ox,oy,scale,{flipAngle:0,spinAngle:qs/100,tilt:qt/100,deckColors:o.deckColors,gripColor:o.gripColor,look:o.look,vp:o.vp});
      sp={c,ox,oy,w:W/dpr,h:H/dpr};
      cache.set(key,sp);
      if(cache.size>CAP)cache.delete(cache.keys().next().value);
    }
    ctx.drawImage(sp.c,x-sp.ox,y-sp.oy,sp.w,sp.h);
  };
  window.drawSkateboardCacheSize=()=>cache.size;
})();
