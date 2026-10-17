/* Rain of the Word — performance stress harness (20 scenarios) + memory-leak suite (10 tests).
   Perf scenarios drive real update+draw frames and report CPU frame cost.
   Memory tests check JS heap growth and per-system array caps over sustained churn. */
(function(){
'use strict';
const R=window.ROW;

/* ---------- shared helpers ---------- */
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const heapMB=()=>performance.memory?performance.memory.usedJSHeapSize/1048576:null;
function census(){
  const ev=R.disasters.ev;
  return {
    parts:R.fx.parts.length, cards:R.cards.length, debris:ev&&ev.debris?ev.debris.length:0,
    hail:R.hail.length, ticks:R.ground.ticks.length, drops:R.fx.lensDrops.length,
    tracks:R.ground.tracks.length, gusts:R.gusts.length, birds:R.birds.length,
    rings:R.fx.rings.length, splashes:R.fx.splashes.length, fly:R.fx.flyTexts.length,
    trail:R.fx.trailPts.length, ripples:R.fx.shieldRipples.length, neons:R.neons.length,
    sprites:Object.keys(R.ent.spr).length, obs:R.ground.obs.length
  };
}
function stats(times){
  const sorted=[...times].sort((a,b)=>a-b);
  const avg=times.reduce((a,b)=>a+b,0)/times.length;
  return {avgFps:1000/avg, lowFps:1000/sorted[sorted.length-1], p95:sorted[Math.floor(sorted.length*0.95)]};
}
async function measure(steps,s){
  const times=[];
  for(let i=0;i<steps;i++){
    const t0=performance.now();
    R.main.update(1/60);
    if(s.tick)s.tick(1/60);
    R.draw();
    times.push(performance.now()-t0);
    if(i%15===14)await sleep(0);
  }
  return stats(times);
}
function spawnCardAt(x,y,word){
  R.cx.font=`bold ${R.F()}px Georgia`;
  const tw=R.cx.measureText(word||'shepherd').width;
  R.cards.push({x,y:y||R.rnd(40,R.gy*0.8),w:Math.round(tw+R.F()*1.5),h:Math.round(R.F()*1.95),
    word:word||'shepherd',vy:0.85,r:0,spin:1,sway:1,swayPh:R.rnd(0,6.28),swayAmp:8,
    age:R.rnd(0,5),trail:[],dead:false,fling:0});
}
function particles(n){
  for(let i=0;i<n;i++)R.fx.parts.push({x:R.rnd(0,R.W),y:R.rnd(0,R.gy),
    vx:R.rnd(-90,90),vy:R.rnd(-140,60),l:R.rnd(1,3),c:'rgba(190,232,255,0.8)',r:R.rnd(1,3.4)*R.S});
}

/* ---------- 20 performance scenarios ---------- */
const PERF=[
  {name:'1 · Baseline storm', setup(){
    R.main.start(); R.hearts=99; R.wxSys.setW('Storm'); R.wx.rain=1; R.wx.bolt=0.6;
    R.locI=6; R.env.buildAll(); R.ground.build();
  }},
  {name:'2 · Particle flood ×1800', setup(){
    R.main.start(); R.hearts=99; R.wx.rain=1; particles(1800);
  }},
  {name:'3 · Card flood ×36', setup(){
    R.main.start(); R.hearts=99; R.wx.rain=0.8; R.cards=[];
    for(let i=0;i<36;i++)spawnCardAt(60+(i%(R.W-120))+60,R.rnd(30,R.gy*0.82));
  }},
  {name:'4 · Weather maximum', setup(){
    R.main.start(); R.hearts=99;
    Object.assign(R.wx,{rain:1.5,snow:1.5,hail:1,sand:1,wind:1.5,fog:0.6,bolt:0.5});
    R.rain.build();
  }},
  {name:'5 · Tornado + debris ×90', setup(){
    R.main.start(); R.hearts=99; R.wx.rain=1; R.wx.wind=1.4;
    R.locI=1; R.env.buildAll(); R.ground.build();
    R.disasters.begin('tornado'); R.disasters.ev.x=R.W*0.5; R.disasters.ev.t=99;
    for(let i=0;i<90;i++)R.disasters.debris.push({ang:R.rnd(0,6.28),rad:R.rnd(8,70)*R.S,
      h:R.rnd(0,R.gy*0.6),vh:R.rnd(60,200),c:'rgba(70,74,96,0.8)',s:R.rnd(1.5,3.5)*R.S});
  }, tick(){ R.disasters.ev.t=99; }},
  {name:'6 · Tsunami + storm', setup(){
    R.main.start(); R.hearts=99; R.wx.rain=1.2; R.wx.wind=1.3;
    R.disasters.begin('tsunami');
    R.disasters.ev.waves=[0,1,2,3].map(i=>({x:R.W*0.2+i*R.W*0.3,vx:R.W/3.6,h:76+i*6,scored:false}));
    R.disasters.ev.count=4; R.disasters.ev.next=99;
  }, tick(dt){
    R.disasters.ev.t=99;
    for(const w of R.disasters.ev.waves){ w.x+=w.vx*dt; if(w.x>R.W+220||w.x<-220)w.x=-150; }
  }},
  {name:'7 · Lightning barrage', setup(){
    R.main.start(); R.hearts=99; R.wx.rain=1; R.wx.bolt=1.5;
    R.locI=6; R.env.buildAll(); R.ground.build();
  }, tick(dt){ R.storm.timer-=dt*2.6; }},
  {name:'8 · Post-FX maximum', setup(){
    R.main.start(); R.hearts=99; R.wx.rain=1; R.wx.fog=0.5;
  }, tick(){ R.CA=8; R.cam.whipV=R.W*1.4; R.kick_=1; }},
  {name:'9 · Depth blur + droplets', setup(){
    R.main.start(); R.hearts=99; R.wx.rain=1; R.wx.fog=0.85;
    R.cards=[];
    for(let i=0;i<20;i++)spawnCardAt(60+(i%(R.W-120))+60,R.rnd(20,R.gy*0.5),'mountain');
    R.fx.lensDrops=[];
    for(let i=0;i<30;i++)R.fx.lensDrops.push({x:R.rnd(0,R.W),y:R.rnd(0,R.H*0.8),
      r:R.rnd(2,8)*R.S,vy:R.rnd(6,26),life:1,wob:R.rnd(0,6.3)});
  }},
  {name:'10 · Kitchen sink', setup(){
    R.main.start(); R.hearts=99;
    Object.assign(R.wx,{rain:1.5,snow:1.2,hail:1,sand:0,wind:1.4,fog:0.5,bolt:1});
    R.rain.build();
    R.locI=1; R.env.buildAll(); R.ground.build();
    R.disasters.begin('tsunami');
    R.disasters.ev.waves=[0,1,2].map(i=>({x:R.W*0.15+i*R.W*0.35,vx:R.W/3.6,h:76+i*6,scored:false}));
    R.disasters.ev.count=3; R.disasters.ev.next=99;
    particles(1200);
    for(let i=0;i<20;i++)spawnCardAt(60+(i%(R.W-120))+60,R.rnd(30,R.gy*0.8));
  }, tick(dt){
    R.disasters.ev.t=99; R.CA=6; R.storm.timer-=dt*2;
    for(const w of R.disasters.ev.waves){ w.x+=w.vx*dt; if(w.x>R.W+220||w.x<-220)w.x=-150; }
  }},
  {name:'11 · Fly-text & ring storm', setup(){
    R.main.start(); R.hearts=99; R.wx.rain=0.6;
  }, tick(){
    for(let i=0;i<2;i++)R.fx.flyTexts.push({w:'glory',x:R.rnd(0,R.W),y:R.rnd(60,R.gy),t:0,col:'255,217,138'});
    for(let i=0;i<3;i++)R.fx.rings.push({x:R.rnd(0,R.W),y:R.rnd(60,R.gy),r:6,a:1});
    for(let i=0;i<3;i++)R.fx.splashes.push({x:R.rnd(0,R.W),y:R.rnd(R.gy,R.H),r:3,a:1,mx:30*R.S});
  }},
  {name:'12 · Obstacle rush ×15', setup(){
    R.main.start(); R.hearts=99; R.locI=1; R.env.buildAll(); R.ground.build(); R.wx.rain=0.8;
    const types=['cone','crate','rock'];
    for(let i=0;i<15;i++)R.ground.obs.push({x:R.W*(i+1)/16,type:types[i%3],
      w:30*R.S,h:24*R.S,scored:false});
  }, tick(dt){
    for(const o of R.ground.obs){ o.x-=dt*160; if(o.x<-60)o.x=R.W+50; }
  }},
  {name:'13 · Shield dome + ripples', setup(){
    R.main.start(); R.hearts=99; R.wx.rain=1; R.shield=1; R.wideT=99; R.bPulse=1;
    R.fx.shieldRipples=[];
    for(let i=0;i<10;i++)R.fx.shieldRipples.push({ox:R.rnd(-40,40),oy:-40,r:R.rnd(10,80)*R.S,a:1});
  }, tick(){
    R.fx.shieldRipples.forEach(r2=>{r2.r+=1.5;r2.a=Math.max(0.3,r2.a)});
    R.bPulse=1;
  }},
  {name:'14 · Gust train + lens blizzard', setup(){
    R.main.start(); R.hearts=99; R.wx.rain=1; R.wx.wind=1.5;
    for(let i=0;i<6;i++)R.gusts.push({x:R.W*(i+1)/7,vx:R.W*0.6,a:1,v:R.W*0.6});
    for(let i=0;i<30;i++)R.fx.lensDrops.push({x:R.rnd(0,R.W),y:R.rnd(0,R.H*0.8),
      r:R.rnd(2,8)*R.S,vy:R.rnd(6,26),life:1,wob:R.rnd(0,6.3)});
  }, tick(dt){
    for(const g2 of R.gusts){ g2.x+=g2.v*dt; if(g2.x>R.W+220)g2.x=-220; }
    R.wx.wind=1.5;
  }},
  {name:'15 · Warp transition hold', setup(){
    R.main.start(); R.hearts=99;
    R.st='trans'; R.transT=0.8; R.swapped=true;
    if(R.transEl){R.transLoc.textContent='Westminster, London';R.transSub.textContent='Level 8 · Storm';R.transEl.classList.add('show')}
  }, tick(){ R.transT=0.8; }},
  {name:'16 · Camera chaos', setup(){
    R.main.start(); R.hearts=99; R.wx.rain=1; R.wx.fog=0.4;
  }, tick(dt){
    R.CA=8; R.kick_=1; R.shake=0.8; R.lbH=0.1+0.12*Math.abs(Math.sin(R.t*3));
    R.cam.whipV=Math.sin(R.t*4)*R.W*1.6;
    R.slowF=0.4; R.flash=Math.max(R.flash,0.3);
  }},
  {name:'17 · Neon jungle (Tokyo)', setup(){
    R.main.start(); R.hearts=99; R.locI=10; R.wxSys.setW('Storm');
    R.wx.rain=1; R.wx.fog=0.7; R.wx.bolt=0.3;
    R.env.buildAll(); R.ground.build();
    for(let i=0;i<40;i++)R.neons.push({x:R.rnd(0,R.W*1.1),y:R.rnd(R.gy*0.3,R.gy*0.85),
      w:R.rnd(4,9)*R.S,h:R.rnd(30,90)*R.S,c:R.NEON[i%5],ph:R.rnd(0,6.3),li:i%3});
  }},
  {name:'18 · Board max strain', setup(){
    R.main.start(); R.hearts=99; R.wx.rain=1; R.wx.wet=1; R.shield=1;
    R.transformT=999; R.wideT=99; R.streak=8;
    R.board.jv=0; R.board.jy=0;
  }, tick(){
    R.transformT=999; R.wideT=99; R.shield=1;
    R.vel=R.W*0.9; R.lean=0.6; R.wRot+=0.5; R.bPulse=0.8;
    R.board.jy=Math.abs(Math.sin(R.t*2.2))*90;
  }},
  {name:'19 · HUD churn', setup(){
    R.main.start(); R.hearts=99; R.wx.rain=0.6; R.streak=3;
  }, tick(){
    R.main.renderVerse();
    R.score+=1;
    if(Math.random()<0.2)R.hEl.innerHTML='<span>'+R.hearts+'</span>';
  }},
  {name:'20 · Fast-forward marathon', setup(){
    R.main.start(); R.hearts=99;
    Object.assign(R.wx,{rain:1.2,snow:0.8,hail:0.6,sand:0,wind:1.2,fog:0.4,bolt:0.8});
    R.rain.build();
    R.locI=1; R.env.buildAll(); R.ground.build();
    R.disasters.begin('tornado'); R.disasters.ev.x=R.W*0.5; R.disasters.ev.t=99;
  }, tick(){
    if(R.disasters.ev)R.disasters.ev.t=99;
    R.CA=4;
    for(let k=0;k<3;k++)R.main.update(0.016);
  }}
];

/* ---------- 10 memory-leak tests ---------- */
const MEM=[
  {name:'M1 · Heap soak — storm 14s', dur:14000,
   setup(){ R.main.start(); R.hearts=99; R.wx.rain=1; R.wx.bolt=0.5; R.locI=6; R.env.buildAll(); R.ground.build(); },
   caps:{parts:2500}, heapBudget:6},
  {name:'M2 · Sprite vocabulary bound', dur:8000,
   setup(){
     R.main.start(); R.hearts=99; R.ent.spr={}; R.cards=[]; R.st='menu';
     const words=new Set();
     for(const v of R.V){ const m=v[0].match(/\[(.+?)\]/g)||[]; m.forEach(w=>words.add(w.slice(1,-1))); }
     R.DECOY.forEach(w=>words.add(w));
     R.__words=[...words];
   },
   tick(){
     if(R.__words.length){ const w=R.__words.pop(); spawnCardAt(R.rnd(60,R.W-60),R.rnd(40,R.gy*0.7),w); }
   },
   verify(){
     R.draw();
     const n=Object.keys(R.ent.spr).length;
     return {pass:n<=180, detail:`sprites cached: ${n} (vocabulary-bounded)`};
   }},
  {name:'M3 · Particle churn 14s', dur:14000,
   setup(){ R.main.start(); R.hearts=99; R.wx.rain=1; },
   tick(){ R.fx.burst(R.rnd(0,R.W),R.rnd(60,R.gy),'rgba(190,232,255,0.8)',8,300); },
   caps:{parts:2500}, heapBudget:5},
  {name:'M4 · Audio node churn', dur:10000,
   setup(){ R.audio.init(); R.hearts=99; },
   tick(){
     const a=Math.random();
     if(a<0.4)R.audio.tone(R.rnd(200,900),'sine',0.15,0.05);
     else if(a<0.7)R.audio.noise(R.rnd(300,3000),'bandpass',0.05,0.12);
     else if(a<0.85)R.audio.chime();
     else R.audio.thunder(Math.random(),0.5,R.rnd(0,R.W));
   },
   heapBudget:5},
  {name:'M5 · DOM churn — menus', dur:10000,
   setup(){},
   tick(){ for(let i=0;i<2;i++)R.main.buildMenu(); },
   verify(){
     const nodes=document.getElementsByTagName('*').length;
     return {pass:nodes<1400, detail:`DOM nodes: ${nodes}`};
   }},
  {name:'M6 · Timeout + speech churn', dur:10000,
   setup(){ R.main.start(); R.hearts=999; R.wx.rain=0.8; },
   tick(){ if(Math.random()<0.15)R.main.narrate('memory probe '+(Math.random())); },
   verify(){ return {pass:true, detail:'timeout/speech churn completed'}; }},
  {name:'M7 · Array caps audit', dur:14000,
   setup(){
     R.main.start(); R.hearts=999;
     Object.assign(R.wx,{rain:1.5,snow:1.5,hail:1,sand:0,wind:1.5,fog:0.5});
     R.rain.build();
     R.locI=5; R.env.buildAll(); R.ground.build();
     R.disasters.begin('tornado'); R.disasters.ev.x=R.W*0.5; R.disasters.ev.t=9999;
   },
   tick(){ if(Math.random()<0.25){ R.disasters.debris.push({ang:R.rnd(0,6.28),rad:R.rnd(8,60)*R.S,h:R.rnd(0,20),vh:R.rnd(60,200),c:'#888',s:2}); } },
   verify(){
     const c=census();
     const fails=[];
     if(c.debris>110)fails.push('debris '+c.debris);
     if(c.hail>160)fails.push('hail '+c.hail);
     if(c.ticks>50)fails.push('ticks '+c.ticks);
     if(c.drops>35)fails.push('drops '+c.drops);
     if(c.tracks>80)fails.push('tracks '+c.tracks);
     if(c.gusts>10)fails.push('gusts '+c.gusts);
     if(c.birds>14)fails.push('birds '+c.birds);
     if(c.parts>2500)fails.push('parts '+c.parts);
     return {pass:fails.length===0, detail: fails.length?('CAP VIOLATIONS: '+fails.join(', ')):`all caps held (debris ${c.debris}, hail ${c.hail}, parts ${c.parts})`};
   }},
  {name:'M8 · Level-cycle heap ×many', dur:16000,
   setup(){
     R.main.start(); R.hearts=99;
     R.lvl=2; R.locI=1; R.env.buildAll(); R.ground.build(); R.env.buildAll(); /* warm */
   },
   tick(){
     R.lvl++; R.locI=(R.lvl-1)%R.LOC.length;
     R.env.buildAll(); R.ground.build(); R.rain.build();
   },
   heapBudget:8},
  {name:'M9 · Weather warp soak', dur:14000,
   setup(){ R.main.start(); R.hearts=99; R.__wxIdx=0; },
   tick(){
     if(Math.random()<0.02){ R.__wxIdx=(R.__wxIdx+1)%R.WXN.length; R.wxSys.setW(R.__wxIdx); }
     if(Math.random()<0.01)R.main.narrate('weather warp');
   },
   heapBudget:4},
  {name:'M10 · Idle menu soak 14s', dur:14000,
   setup(){ R.main.buildMenu(); },
   heapBudget:4}
];

/* ---------- runner ---------- */
const panel=document.createElement('div');
panel.style.cssText='position:fixed;top:10px;left:10px;z-index:99;background:rgba(6,8,20,.92);border:1px solid rgba(255,217,138,.4);border-radius:12px;padding:12px 16px;font:12px/1.5 monospace;color:#f3f6ff;max-width:470px;box-shadow:0 10px 40px rgba(0,0,0,.6)';
panel.innerHTML='<b style="color:#ffd98a;letter-spacing:.2em">STRESS + MEMORY SUITE</b><div id="slog" style="margin-top:6px;white-space:pre-wrap">initialising…</div>';
document.body.appendChild(panel);
const log=document.getElementById('slog');
const say=t=>{log.textContent=t};

let cur=0;
const results=[];
async function runPerf(){
  R.paused=true;R.Q=1;R.hitStop=0;
  for(cur=0;cur<PERF.length;cur++){
    const s=PERF[cur];
    say(`perf ${cur+1}/${PERF.length}: ${s.name} …`);
    await sleep(100);
    try{
      s.setup();
      R.hitStop=0;
      const st=await measure(200,s);
      results.push({name:s.name,...st});
    }catch(e){
      results.push({name:s.name,error:e.message});
    }
    R.disasters.ev=null;R.disasters.pending=null;R.CA=0;
    await sleep(80);
  }
}
async function runMem(){
  R.paused=true;R.hitStop=0;
  const memOut=[];
  for(let i=0;i<MEM.length;i++){
    const m=MEM[i];
    say(`memory ${i+1}/${MEM.length}: ${m.name} …`);
    await sleep(100);
    try{
      m.setup();
      R.hitStop=0;
      const startH=heapMB(); const startC=census();
      const t0=performance.now();
      while(performance.now()-t0<m.dur){
        R.main.update(1/60);
        if(m.tick)m.tick();
        await sleep(14);
      }
      await sleep(1200);
      let tail=[]; for(let k=0;k<6;k++){ tail.push(heapMB()); await sleep(220); }
      const endH=tail.every(x=>x==null)?null:Math.min(...tail.filter(x=>x!=null));
      let verdict={pass:true,detail:''};
      if(m.verify)verdict=m.verify();
      let heapDelta=null;
      if(startH!=null&&endH!=null){ heapDelta=endH-startH; }
      const c=census();
      let capFail=false;
      if(m.caps){ for(const k in m.caps){ if(c[k]>m.caps[k])capFail=true; } }
      const budget=m.heapBudget||6;
      const pass=(heapDelta==null||heapDelta<budget)&&!capFail&&verdict.pass;
      memOut.push({name:m.name,pass,
        detail:`heap ${startH==null?'n/a':startH.toFixed(1)+'→'+endH.toFixed(1)+'MB (Δ'+(heapDelta==null?'?':heapDelta.toFixed(1))+')'} · ${verdict.detail||''}${capFail?' CAP OVERRUN':''}`});
    }catch(e){
      memOut.push({name:m.name,pass:false,detail:'ERROR '+e.message});
    }
    R.disasters.ev=null;R.disasters.pending=null;
    await sleep(100);
  }
  return memOut;
}
async function runAll(){
  await runPerf();
  const memOut=await runMem();
  let txt='';
  txt+='PERFORMANCE — CPU frame cost, 200 frames each\n';
  let sum=0,n=0;
  for(const r of results){
    if(r.error){txt+=`✗ ${r.name}: ERROR ${r.error}\n`;continue}
    const pass=r.avgFps>=60?'✓✓':r.avgFps>=30?'✓':'✗';
    txt+=`${pass} ${r.name}: ${r.avgFps.toFixed(0)} fps · worst ${r.lowFps.toFixed(0)} · p95 ${r.p95.toFixed(1)}ms\n`;
    sum+=r.avgFps;n++;
  }
  txt+=`PERF OVERALL: ${(sum/n).toFixed(0)} fps-equiv avg across ${n} scenarios\n\n`;
  txt+='MEMORY — heap growth + array caps over sustained churn\n';
  let memPass=0;
  for(const m of memOut){
    txt+=`${m.pass?'✓':'✗'} ${m.name}: ${m.detail}\n`;
    if(m.pass)memPass++;
  }
  txt+=`MEM OVERALL: ${memPass}/${memOut.length} tests passed`;
  say(txt);
  window.__stressResults=results;
  window.__memResults=memOut;
  window.__stressDone=true;
}
setTimeout(runAll,600);
})();
