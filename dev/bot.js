/* Dev-only autopilot for the journey mode. Load in the page console / test harness:
     document.head.appendChild(Object.assign(document.createElement('script'),{src:'dev/bot.js'}))
   then:  await ROW.bot.sim({sec:120,know:1,skill:1,start:true})  -> a summary object.
   It drives R.main.update() on a virtual clock (setTimeout is virtualised too), so a 2-minute run takes ~1 s.
   skill 0 = idle player, skill 1 = jumps obstacles that have no trick card and takes gates by the known answer. */
(function(){
const R=ROW,J=R.journey,B=R.bot={};
const press=()=>{R.skate.press();R.skate.release()};
B.decide=function(o){
  const S=R.skate,Bd=R.board,spd=R.ground.roadSpeed();
  if(!o.skill||R.st!=='play'||S.crash)return;
  /* disasters: be airborne when a lightning ring arrives or a tsunami crest passes */
  const ev=R.disasters.ev;
  if(ev&&ev.type==='strike')for(const g of ev.tg){const d=g.x-R.px;if(g.mv&&d>0&&d<spd*.36&&Bd.grounded&&!g._j){g._j=1;press()}}
  if(ev&&ev.type==='tsunami')for(const w of ev.waves){const d=Math.abs(w.x-R.px);if(!w.scored&&d<Math.abs(w.vx)*.3&&Bd.grounded&&!w._j){w._j=1;press()}}
  /* drone attacks: be in the air when the laser sweep or the EMP front reaches the board */
  const at=J.attack&&J.attack();
  if(at&&Bd.grounded){
    if(at.k==='laser'&&at.ph==='fire'){const d=R.px-at.xs;if(d>0&&d<560*R.S*.2){press();return}}
    if(at.k==='emp'&&at.ph==='wave'){const d=R.px-(at.ox+at.r);if(d>0&&d<620*R.S*.2){press();return}}
  }
  /* gates */
  for(const it of J.items){
    if(it.k!=='gate'||it.done)continue;
    if(it.want==null)it.want=o.know?it.ans:(Math.random()<.5?'up':'down');
    const dx=it.x-R.px;
    const tk=it.tko!=null?dx+it.tko:dx-spd*it.T/2;                 /* r9 bridge forks: take off at the JUMP marker */
    if(it.want==='up'&&tk<=8&&dx>0&&Bd.grounded&&!it.jumped){it.jumped=1;press()}
    if(it.want==='down'&&!Bd.grounded&&Bd.jy>10&&dx<spd*.5&&dx>0)S.fall=1;else if(it.want==='down')S.fall=0;
    return;                                   /* a gate ahead owns the decision */
  }
  /* obstacles without a trick card */
  for(const ob of R.ground.obs){
    if(ob.dead||ob.hasCard||ob.type==='kicker'||ob.type==='puddle'||ob.type==='deck')continue;
    if(ob.type==='roof'&&ob.h<=Bd.jy+6)continue;
    const jumpable=ob.kind==='haz'||ob.type==='gap'||ob.type==='pothole'||ob.type==='fissure'||(ob.land&&ob.h>20*R.skate.CM());
    if(!jumpable)continue;
    const e=(ob.x-ob.w/2)-R.px,lead=ob.type==='gap'||ob.type==='fissure'?.12:ob.type==='roof'?.22:.27;
    if(e>0&&e<spd*lead&&Bd.grounded&&!ob._j){ob._j=1;press()}
  }
};
B.release=()=>{if(B.real){R.main.update=B.real;B.real=null}};
B.sim=async function(o){
  o=Object.assign({sec:60,know:1,skill:1,start:false,dt:1/60,lvl:0},o);
  const M=R.main,real=B.real||M.update;B.real=null;
  const origST=window.setTimeout,origCT=window.clearTimeout;
  let vt=0,q=[],id=1;
  window.setTimeout=(fn,ms)=>{const k=id++;q.push({k,t:vt+(ms||0)/1000,fn});return k};
  window.clearTimeout=k=>{q=q.filter(x=>x.k!==k)};
  M.update=()=>{};
  if(o.start){R.diff=o.diff!=null?o.diff:R.diff;M.start(false)}
  if(o.lvl>1){R.lvl=o.lvl-1;M.swapLocation();R.st='play'}
  const sum={levels:[],events:[],minGap:99,hearts0:R.hearts,steps:0};
  let lvlStart=0,lastLvl=R.lvl,stat0=JSON.stringify(J.stats),hp=R.hearts,crashes=0;
  const errs=[];const onerr=e=>errs.push(e.message);addEventListener('error',onerr);
  try{
    for(let i=0;i<o.sec/o.dt;i++){
      vt+=o.dt;
      q.sort((a,b)=>a.t-b.t);while(q.length&&q[0].t<=vt){q.shift().fn()}
      B.decide(o);
      real.call(M,o.dt);
      sum.steps++;
      if(R.st==='play'&&J.gap<sum.minGap)sum.minGap=J.gap;
      if(R.hearts<hp){crashes++;hp=R.hearts;sum.events.push({t:+vt.toFixed(1),lvl:R.lvl,mod:J.mod&&J.mod.n,why:R.skate.lastCrash&&R.skate.lastCrash.why,gap:+J.gap.toFixed(1),jy:Math.round(R.board.jy),st:R.st})}else hp=Math.max(hp,R.hearts);
      if(R.lvl!==lastLvl){
        sum.levels.push({lvl:lastLvl,mod:J.mod&&J.mod.n,place:R.LOC[R.locI].n,secs:+(vt-lvlStart).toFixed(1),hearts:R.hearts,crashes,gatesOk:J.stats.gatesOk,gatesBad:J.stats.gatesBad,bibles:J.stats.bibles,tricks:J.stats.tricks,pads:J.stats.pads,beams:J.stats.beams,minGap:+sum.minGap.toFixed(1)});
        lvlStart=vt;lastLvl=R.lvl;crashes=0;sum.minGap=99;
      }
      if(R.st==='over'){sum.over=true;sum.overAt=+vt.toFixed(1);break}
      if(i%600===0)await new Promise(r=>origST(r,0));
    }
  }finally{
    window.setTimeout=origST;window.clearTimeout=origCT;removeEventListener('error',onerr);
    /* hand still-pending virtual timers (filter resets, verse loads...) back to the real clock */
    for(const p of q)origST(p.fn,Math.max(0,(p.t-vt)*1000));
    if(o.hold){B.real=real}else M.update=real;       /* hold: keep the live loop frozen so a screenshot shows this exact frame */
  }
  sum.errs=errs;sum.lvl=R.lvl;sum.score=R.score;sum.st=R.st;sum.t=+vt.toFixed(1);sum.stats=Object.assign({},J.stats);sum.hearts=R.hearts;
  return sum;
};
})();
