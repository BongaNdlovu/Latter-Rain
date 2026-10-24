/* Rain of the Word — rain: per-drop depth strata, snow, sand grains, hail, mist, gusts,
   ground-hit ticks (visual rings + audio impulses) */
window.ROW=window.ROW||{};
(function(){
'use strict';
const R=ROW;
const RN=R.rain={};

R.drops=[];R.flakes=[];R.sands=[];R.hail=[];R.mist=[];R.gusts=[];

RN.build=function(){
  if(!R.W||!R.H)return;
  const W=R.W,H=R.H;
  R.drops=[];
  /* heavier rain: pool sized for the heaviest weather; draw count scales with intensity */
  const n=Math.min(1300,Math.round(W*H/2700*1.25));
  for(let i=0;i<n;i++){
    const z=Math.random();
    R.drops.push({x:Math.random()*W,y:Math.random()*H,l:11+Math.random()*30,z,gy:0,sp:520+Math.random()*900});
  }
  R.flakes=[];
  for(let i=0;i<170;i++)R.flakes.push({x:Math.random()*W,y:Math.random()*H,r:1+Math.random()*2.2,sp:30+Math.random()*60,fr:.8+Math.random()*1.6,ph:Math.random()*6.3,z:Math.random()});
  R.sands=[];
  for(let i=0;i<150;i++)R.sands.push({x:Math.random()*W,y:H*(0.35+Math.random()*0.65),l:20+Math.random()*50,z:Math.random(),sp:300+Math.random()*500});
  R.hail=[];
  R.mist=[];
  for(let i=0;i<5;i++){
    R.mist.push({x:Math.random(),y:0.30+Math.random()*0.22,r:W*(0.28+Math.random()*0.3),
      v:(Math.random()-0.5)*0.012,a:0.05+Math.random()*0.07});
  }
};
R.onResize.push(()=>RN.build());

RN.spawnGust=function(){
  const dir=Math.random()<.5?-1:1;
  R.gusts.push({x:dir<0?R.W+160:-160,v:dir*R.W*(0.9+Math.random()*0.5),a:1});
  R.audio.whoosh();R.shake=Math.max(R.shake,0.16);
  R.lean+=(dir>0?1:-1)*0.12;
};

let tickAcc=0,hailAcc=0;

RN.update=function(dt){
  const W=R.W,H=R.H,gy=R.gy,wx=R.wx;
  /* rain strata */
  const windSlant=0.12+wx.wind*0.14;
  const tornado=R.disasters&&R.disasters.funnelX?R.disasters:null;
  for(const dr of R.drops){
    const s=dr.z<0.33?0:dr.z<0.66?1:2;
    const spd=[0.45,0.75,1.12][s];
    dr.y+=dr.sp*spd*dt*R.ts*(1+R.lvl*0.012);
    dr.x-=dr.l*windSlant*dt*20*(0.2+wx.wind*0.8);
    if(tornado&&tornado.ev&&tornado.ev.type!=='quake'){
      const fx=tornado.funnelX(Math.min(1,dr.y/gy));
      const dx=dr.x-fx;
      if(Math.abs(dx)<W*0.3)dr.x-=dx*dt*1.4;
    }
    if(dr.y>H+30){
      /* near strata hits the visible ground plane: tick + reset below horizon */
      if(s===2&&dr.gy>0&&R.st!=='menu'){
        RN.groundTick(dr.x);
      }
      dr.y=-30-Math.random()*90;
      dr.x=Math.random()*W*1.15;
      dr.gy=gy+Math.random()*(H-gy)*0.55;
    }
    if(dr.x<-40){dr.x=W+30;dr.y=Math.random()*H}
  }
  /* audio droplet impulses: rate scales with rain intensity */
  if(R.audio.ready()&&!R.muted&&wx.rain>0.15){
    tickAcc+=dt*wx.rain*13;
    while(tickAcc>=1){tickAcc-=1;if(Math.random()<0.6)R.audio.tickRain()}
  }
  /* snow */
  if(wx.snow>.02)for(const f of R.flakes){
    f.y+=f.sp*dt*R.ts;f.x+=(Math.sin(R.t*f.fr+f.ph)*16+wx.wind*60)*dt;
    if(f.y>H+10){f.y=-10;f.x=Math.random()*W}if(f.x>W+10)f.x=-10;
  }
  /* sand grains */
  if(wx.sand>.03)for(const s2 of R.sands){
    s2.x+=s2.sp*(0.4+s2.z*0.8)*dt*(0.5+wx.wind);
    s2.y+=Math.sin(R.t*3+s2.z*9)*20*dt;
    if(s2.x>W+60){s2.x=-60;s2.y=H*(0.35+Math.random()*0.65)}
  }
  /* hail: gravity + bounce + impulses */
  if(wx.hail>0.08){
    if(R.hail.length<130)for(let i=0;i<Math.ceil(wx.hail*3);i++)
      R.hail.push({x:Math.random()*W,y:-10-Math.random()*H*0.3,vx:-(60+wx.wind*160)*Math.random(),vy:120+Math.random()*260,z:Math.random(),b:0,gy:gy+Math.random()*(H-gy)*0.6});
    for(const h of R.hail){
      h.vy+=1500*dt;h.x+=h.vx*dt*R.ts;h.y+=h.vy*dt*R.ts;
      if(h.y>h.gy){
        h.y=h.gy;h.vy*=-0.38;h.vx*=0.6;h.b++;
        if(h.b<3&&R.audio.ready()&&!R.muted){hailAcc+=1;if(hailAcc>=1){hailAcc-=1;R.audio.tickHail()}}
        if(h.b===1)G_().addTick(h.x,h.gy);
      }
    }
    R.hail=R.hail.filter(h=>h.b<3&&h.x>-40);
  }else if(R.hail.length)R.hail.length=Math.max(0,R.hail.length-6);
  /* mist drift */
  for(const m of R.mist){
    m.x+=m.v*dt;
    if(m.x<-0.4)m.x=1.4;if(m.x>1.4)m.x=-0.4;
  }
  /* gusts push cards, drops and debris */
  for(const g of R.gusts){
    g.x+=g.v*dt;
    for(const c of R.cards){
      if(!c.dead&&Math.abs(c.x-g.x)<170)c.x+=g.v*dt*0.38;
    }
    for(const dr of R.drops)if(Math.abs(dr.x-g.x)<320)dr.x+=g.v*dt*0.22;
    if(Math.random()<0.5)R.fx.add(g.x-Math.sign(g.v)*60+(Math.random()-0.5)*100,gy*(0.3+Math.random()*0.6),g.v*0.25,(Math.random()-0.5)*60,0.35,'rgba(200,225,250,0.35)',(1+Math.random()*2)*R.S);
  }
  R.gusts=R.gusts.filter(g=>g.x>-220&&g.x<W+220);
  /* rain splashing on the ground plane */
  if(Math.random()<0.7*wx.rain&&R.fx){
    R.fx.splashes.push({x:Math.random()*W,y:gy+Math.random()*(H-gy)*0.55,r:2,a:0.35,mx:22*R.S});
  }
};
function G_(){return R.ground}

RN.groundTick=function(x){
  const gy=R.gy,H=R.H;
  const y=gy+Math.random()*(H-gy)*0.45;
  R.ground.addTick(x,y);
};

/* strata colours, mixed toward the fog colour in the distance */
RN.colFor=function(s,front){
  const fc=R.LOC[R.locI].fogC;
  if(s===0)return `rgba(${fc[0]+120|0},${fc[1]+130|0},${fc[2]+140|0},0.13)`;
  if(s===1)return 'rgba(160,205,235,0.20)';
  return front?'rgba(214,238,255,0.36)':'rgba(150,200,228,0.18)';
};

RN.drawBack=function(){
  const cx=R.cx,wx=R.wx;
  /* mist blobs behind the world */
  for(const m of R.mist){
    const rg=cx.createRadialGradient(m.x*R.W,m.y*R.H,0,m.x*R.W,m.y*R.H,m.r);
    const fc=R.LOC[R.locI].fogC;
    rg.addColorStop(0,`rgba(${fc[0]},${fc[1]},${fc[2]},${Math.min(.5,m.a*(.5+wx.fog*3)+R.flash*0.14)})`);
    rg.addColorStop(1,`rgba(${fc[0]},${fc[1]},${fc[2]},0)`);
    cx.fillStyle=rg;cx.fillRect(0,0,R.W,R.H);
  }
  const n=Math.floor(R.drops.length*Math.min(1,wx.rain/1.3)*R.Q);
  /* far + mid strata (occluded by the ground plane) */
  cx.lineCap='round';
  for(const pass of[0,1]){
    cx.beginPath();
    for(let i=0;i<n;i++){
      const dr=R.drops[i];
      const s=dr.z<0.33?0:dr.z<0.66?1:2;
      if(s!==(pass?1:0))continue;
      const l=dr.l*(0.55+dr.z);
      const par=(R.px-R.W/2)*(dr.z-0.5)*0.14;
      const sl=0.12+wx.wind*0.14;
      cx.moveTo(dr.x+par,dr.y);cx.lineTo(dr.x+par-l*sl,dr.y+l);
    }
    cx.strokeStyle=RN.colFor(pass?1:0,false);
    cx.lineWidth=pass?1.4:1.1;
    cx.stroke();
  }
  /* far snow */
  if(wx.snow>.02){
    const n2=Math.floor(R.flakes.length*Math.min(1,wx.snow)*R.Q);
    cx.fillStyle='#fff';
    for(let i=0;i<n2;i++){
      const f=R.flakes[i];
      if(f.z>0.55)continue;
      cx.globalAlpha=(.3+f.z*.5)*Math.min(1,wx.snow*1.3);
      /* V2 soft flake sprite instead of a hard disc */
      const sz=f.r*R.S*(1+f.z*1.6)*2.2;cx.drawImage(flakeS(),f.x-sz/2,f.y-sz/2,sz,sz);
    }
    cx.globalAlpha=1;
  }
};

/* cached soft snowflake sprite (V2) */
let flakeSpr=null;
function flakeS(){
  if(flakeSpr)return flakeSpr;
  const c=document.createElement('canvas');c.width=c.height=32;const g=c.getContext('2d');
  const r=g.createRadialGradient(16,16,0,16,16,16);
  r.addColorStop(0,'rgba(255,255,255,1)');r.addColorStop(.35,'rgba(240,246,255,.7)');r.addColorStop(1,'rgba(240,246,255,0)');
  g.fillStyle=r;g.fillRect(0,0,32,32);return flakeSpr=c;
}
RN.drawFront=function(){
  const cx=R.cx,wx=R.wx;
  /* near strata — heavier: thicker, faster drops */
  const n=Math.floor(R.drops.length*Math.min(1,wx.rain/1.3)*R.Q);
  cx.lineCap='round';
  cx.beginPath();
  for(let i=0;i<n;i++){
    const dr=R.drops[i];
    if(dr.z<=0.66)continue;
    const l=dr.l*(0.68+dr.z);
    const par=(R.px-R.W/2)*(dr.z-0.5)*0.14;
    const sl=0.12+wx.wind*0.14;
    cx.moveTo(dr.x+par,dr.y);cx.lineTo(dr.x+par-l*sl,dr.y+l);
  }
  cx.strokeStyle=RN.colFor(2,true);
  cx.lineWidth=1.8;
  cx.stroke();
  /* near snow */
  if(wx.snow>.02){
    const n2=Math.floor(R.flakes.length*Math.min(1,wx.snow)*R.Q);
    cx.fillStyle='#fff';
    for(let i=0;i<n2;i++){
      const f=R.flakes[i];
      if(f.z<=0.55)continue;
      cx.globalAlpha=(.35+f.z*.55)*Math.min(1,wx.snow*1.3);
      const sz=f.r*R.S*(2.2+f.z*3.4)*1.6;cx.drawImage(flakeS(),f.x-sz/2,f.y-sz/2,sz,sz);
    }
    cx.globalAlpha=1;
  }
  /* sand grains */
  if(wx.sand>.03){
    cx.strokeStyle=`rgba(176,162,140,${0.2*wx.sand})`;
    cx.lineWidth=1;
    cx.beginPath();
    const n3=Math.floor(R.sands.length*Math.min(1,wx.sand)*R.Q);
    for(let i=0;i<n3;i++){
      const s2=R.sands[i];
      const par=(R.px-R.W/2)*(s2.z-0.5)*0.1;
      cx.moveTo(s2.x+par,s2.y);cx.lineTo(s2.x+par-s2.l*(0.4+s2.z),s2.y+2);
    }
    cx.stroke();
  }
  /* hail */
  if(wx.hail>0.06){
    cx.fillStyle='rgba(235,245,255,0.85)';
    for(const h of R.hail){
      cx.beginPath();cx.arc(h.x,h.y,(1.4+h.z*1.6)*R.S,0,R.TAU);cx.fill();
      cx.strokeStyle='rgba(220,235,255,0.3)';cx.lineWidth=1;
      cx.beginPath();cx.moveTo(h.x,h.y);cx.lineTo(h.x-h.vx*0.02,h.y-h.vy*0.02);cx.stroke();
    }
  }
  /* gusts */
  for(const g of R.gusts){
    cx.save();cx.globalCompositeOperation='lighter';
    const bg=cx.createLinearGradient(g.x-110,0,g.x+110,0);
    bg.addColorStop(0,'rgba(200,225,255,0)');
    bg.addColorStop(.5,`rgba(200,225,255,${0.09*g.a})`);
    bg.addColorStop(1,'rgba(200,225,255,0)');
    cx.fillStyle=bg;cx.fillRect(g.x-110,0,220,R.gy);
    cx.strokeStyle=`rgba(220,240,255,${0.16*g.a})`;cx.lineWidth=1;
    for(let i=0;i<5;i++){
      const y=R.gy*(0.15+0.16*i)+Math.sin(R.t*9+i*3)*8,x0=g.x-50+((R.t*300+i*77)%100);
      cx.beginPath();cx.moveTo(x0,y);cx.lineTo(x0+40,y+3);cx.stroke();
    }
    cx.restore();
  }
  R.fx.drawSplashes();
};
})();
