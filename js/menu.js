/* Rain of the Word — menu (round 14): a paged menu with a proper flow, level-start saves, and exiting mid-game.
   Pages: Home (Continue / New journey / Levels / Boards / Settings / Collection / How to play), each with Back.
   Progress is saved at the START of every level (level, score, difficulty), so Continue — and Retry after a fall,
   and Restart from the pause menu — always begin that level again from its start, never mid-level.
   Loaded last: it wraps main.js's start / level change / menu / game over. */
window.ROW=window.ROW||{};
(function(){
'use strict';
const R=ROW,M=R.main,$=id=>document.getElementById(id);
const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));

/* ---------- saves ---------- */
M.save=()=>{try{return JSON.parse(R.tryGet('rotw-save')||'null')}catch(e){return null}};
M.saveRun=function(){
  if(!(R.st==='play'||R.st==='trans'||R.st==='wait'))return;
  R.trySet('rotw-save',JSON.stringify({lvl:R.lvl,score:R.score,diff:R.diff,place:R.LOC[R.locI].n,pick:R.startPick,t:Date.now()}));
};
const st0=M.start;M.start=function(cont){document.body.classList.remove('inmenu');R.ov.classList.remove('mn');const r=st0.apply(this,arguments);M.saveRun();return r};
const sw0=M.swapLocation;M.swapLocation=function(){const r=sw0.apply(this,arguments);M.saveRun();return r};
/* start any level from its beginning (used by Continue, Retry, Restart and the level picker) */
M.startAt=function(lvl,score){
  lvl=Math.max(1,lvl|0);
  if(lvl<=1){M.start(false);if(score)R.score=score;return}
  R.checkpoint=lvl;R.cpScore=0;R.resumeScore=score||0;M.start(true);
};
M.restartLevel=function(){const s=M.save();if(s&&s.lvl===R.lvl)M.startAt(s.lvl,s.score);else M.startAt(R.lvl,0)};
M.maxLvl=()=>Math.max(1,+R.tryGet('rotw-maxlvl')||1);

/* ---------- pause: Resume · Restart level · Exit to menu ---------- */
$('prn').onclick=()=>{M.setPaused(false);M.restartLevel()};
$('pm').onclick=()=>{M.setPaused(false);M.buildMenu()};   /* the save from this level's start stands */

/* ---------- game over: retry this level from its start ---------- */
const go0=M.gameOver;M.gameOver=function(){
  go0.apply(this,arguments);document.body.classList.add('inmenu');
  const row=R.ov.querySelector('.row');if(!row)return;
  const s=M.save();
  row.innerHTML=(s?`<button id="retry">Retry level ${s.lvl}</button>`:'')+`<button class="ghost" id="newrun">New journey</button><button class="ghost" id="gm">Menu</button>`;
  if(s)$('retry').onclick=()=>M.startAt(s.lvl,s.score);
  $('newrun').onclick=()=>M.start(false);
  $('gm').onclick=()=>M.buildMenu();
};

/* ---------- pages ---------- */
const base0=M.buildMenu;   /* resets the world and run state; its page is replaced below */
let page='home';
M.buildMenu=function(p){
  base0.apply(this,arguments);
  R.ov.classList.add('mn');document.body.classList.add('inmenu');
  M.page(typeof p==='string'?p:'home');
};
const head=(title,sub)=>`<div class="mh"><button class="ghost back" id="back">‹ Back</button><h2>${title}</h2>${sub?`<p class="tag">${sub}</p>`:''}</div>`;
M.page=function(p){
  page=p;
  const ov=R.ov;ov.scrollTop=0;
  const fn=PAGES[p]||PAGES.home;ov.innerHTML=fn();
  const b=$('back');if(b)b.onclick=()=>M.page('home');
  (WIRE[p]||(()=>{}))();
};
const PAGES={
  home(){
    const s=M.save();
    return `<div class="mhome"><h1>Rain of the Word</h1><p class="tag">Ride the journey · outrun the drone · complete the verse</p>`+
      `<div class="mnav">`+
      (s?`<button id="m-cont" class="big">Continue<small>Level ${s.lvl} · ${esc(s.place||'')} · score ${s.score}</small></button>`:'')+
      `<button id="m-new" class="${s?'ghost ':''}big">${s?'New journey':'Begin the journey'}<small>Level 1 · ${esc(R.LOC[M.locFor(1)].n)}</small></button>`+
      `<div class="mgrid"><button class="ghost" data-p="levels">Levels</button><button class="ghost" data-p="boards">Boards</button>`+
      `<button class="ghost" data-p="settings">Settings</button><button class="ghost" data-p="collection">Collection</button>`+
      `<button class="ghost" data-p="how">How to play</button></div></div>`+
      `<p class="mfoot">${R.DIFFS[R.diff].n} · best ${R.best} · ${R.col.filter(Boolean).length}/${R.V.length} verses</p></div>`;
  },
  levels(){
    const max=M.maxLvl(),n=R.TOUR.length;
    let cards='';
    for(let l=1;l<=n;l++){
      const loc=R.LOC[M.locFor(l)],open=l<=max,tag=R.journey.tagFor(l);
      cards+=`<button class="lv${open?'':' lk'}" data-l="${l}"${open?'':' disabled'}><b>${l}</b><span>${esc(loc.n)}</span><small>${open?esc(tag):'🔒 reach level '+l}</small></button>`;
    }
    return head('Levels',`Reached level ${max}. Pick any level you have reached — it starts from its beginning. After level ${n} the tour goes round again, faster.`)+`<div class="lvgrid">${cards}</div>`;
  },
  boards(){
    const bPills=R.BOARDS.map((b,i)=>{const un=M.boardUnlocked(i);
      return `<button class="db bd${i===R.boardI?' on':''}${un?'':' lk'}" data-b="${i}"${un?'':' disabled'}><canvas class="bth" data-bt="${i}" width="132" height="56"></canvas>${un?'':'🔒 '}${b.n}<small>${un?b.desc:b.req.text}</small></button>`}).join('');
    const tU=M.boardUnlocked(R.BOARDS.length);
    const tr=`<button class="db bd${R.boardI===R.BOARDS.length?' on':''}${tU?'':' lk'}" data-b="${R.BOARDS.length}"${tU?'':' disabled'}><canvas class="bth" data-bt="${R.BOARDS.length}" width="132" height="56"></canvas>${tU?'⚡':'🔒 ⚡'} Transformer<small>${tU?R.TRANSFORM.desc:R.TRANSFORM.req.text}</small></button>`;
    return head('Boards','Unlock boards by travelling further, collecting verses and setting records.')+
      `<div class="bpv"><canvas id="bprev" width="440" height="150"></canvas><span id="bpn"></span></div><div class="row">${bPills}${tr}</div>`;
  },
  settings(){
    const diff=R.DIFFS.map((d,i)=>`<button class="db${i===R.diff?' on':''}" data-d="${i}">${d.n}<small>${d.hearts} ♥ · ×${d.mul} score</small></button>`).join('');
    const q=[['auto','Auto','adapts to your device'],['high','High','full detail'],['medium','Medium','balanced'],['low','Low','fastest']].map(([k,n,d])=>`<button class="db${R.qualSet===k?' on':''}" data-q="${k}">${n}<small>${d}</small></button>`).join('');
    const ord=[[-2,'World Tour','London first'],[-1,'Random','a new order every journey']].map(([v,n,d])=>`<button class="db${R.startPick===v?' on':''}" data-o="${v}">${n}<small>${d}</small></button>`).join('');
    return head('Settings')+
      `<div class="msec"><b>Difficulty</b><div class="row">${diff}</div></div>`+
      `<div class="msec"><b>Graphics</b><div class="row">${q}</div></div>`+
      `<div class="msec"><b>Journey order</b><div class="row">${ord}</div></div>`+
      `<div class="msec"><b>Sound</b><div class="row"><button class="db${R.muted?'':' on'}" id="snd">${R.muted?'Off':'On'}<small>music and effects</small></button></div></div>`+
      `<div class="msec"><b>Progress</b><div class="row"><button class="db" id="reset">Reset progress<small>levels, save, best scores, collection</small></button></div></div>`;
  },
  collection(){
    const c=R.col.filter(Boolean).length,pct=Math.round(c/R.V.length*100);
    const pills=R.V.map((vv,i)=>R.col[i]?`<span class="cv on">${esc(vv[1])}</span>`:'').join('');
    return head('Scripture collection',`${c} of ${R.V.length} verses completed · ${pct}%`)+
      `<div class="msec"><div class="cbar"><i style="width:${pct}%"></i></div><div class="cvs">${pills||'<span class="mline sub">Complete a verse at the bridges to add it here.</span>'}</div></div>`;
  },
  how(){
    return head('How to play')+
      `<div class="msec"><b>The journey</b><div class="mline">Your board runs by itself, left to right, to the finish line. A drone hunts you from behind; it catches up early in each level and closes in when you crash or choose wrong.</div></div>`+
      `<div class="msec"><b>Controls</b><div class="mline">Jump: <i>Space · W · ↑ · tap</i> (hold for a little higher). Trick: tap again in the air. Stay low / fast-fall: <i>S · ↓ · drag down</i>. Pause: <i>P · Esc · ⏸</i>. Focus (slow time): <i>Shift</i> or tap the Focus meter.</div></div>`+
      `<div class="msec"><b>Verse bridges</b><div class="mline">Each missing word is a bridge: jump onto it for the word on top, or roll underneath for the word hanging below. Time slows for 2 seconds so you can read both.</div></div>`+
      `<div class="msec"><b>The drone</b><div class="mline">Every attack is announced: a banner, an alarm and a ⚠ badge over your board. Jump the red laser as it sweeps to you, and the EMP pulse as it rolls past.</div></div>`+
      `<div class="msec"><b>On the route</b><div class="mline">Glowing rings carry you over the obstacle after them with a trick. Bibles hang along your jump — one clean jump collects the arc — and fill the ★ meter for a power card. Speed pads and trick landings pull you away from the drone. Fog and hail roll in from above, fires burn on the route, and from level 3 you ride through buildings.</div></div>`+
      `<div class="msec"><b>Saving</b><div class="mline">Your progress is saved at the start of every level. Continue, Retry and Restart always begin that level again from its start. Pause → Exit to menu leaves at any time.</div></div>`;
  }
};
const WIRE={
  home(){
    const s=M.save();
    if(s&&$('m-cont'))$('m-cont').onclick=()=>{if(s.diff!=null)R.diff=s.diff;M.startAt(s.lvl,s.score)};
    $('m-new').onclick=()=>M.start(false);
    R.ov.querySelectorAll('[data-p]').forEach(b=>b.onclick=()=>M.page(b.dataset.p));
  },
  levels(){R.ov.querySelectorAll('.lv[data-l]').forEach(b=>b.onclick=()=>{if(!b.disabled)M.startAt(+b.dataset.l,0)})},
  boards(){
    R.ov.querySelectorAll('.db[data-b]').forEach(b=>b.onclick=()=>{if(b.disabled)return;R.boardI=+b.dataset.b;R.trySet('rotw-board',R.boardI);M.page('boards')});
    M.drawBoardPreviews();
  },
  settings(){
    R.ov.querySelectorAll('[data-d]').forEach(b=>b.onclick=()=>{R.diff=+b.dataset.d;R.trySet('rotw-diff',R.diff);R.best=+R.tryGet('rotw-best-'+R.diff)||0;R.maxHearts=R.DIFFS[R.diff].hearts;R.hearts=R.maxHearts;M.page('settings')});
    R.ov.querySelectorAll('[data-q]').forEach(b=>b.onclick=()=>{R.setQuality(b.dataset.q);M.page('settings')});
    R.ov.querySelectorAll('[data-o]').forEach(b=>b.onclick=()=>{R.startPick=+b.dataset.o;R.trySet('rotw-start',String(R.startPick));M.rndOrder=null;M.page('settings')});
    $('snd').onclick=()=>{M.setMute(!R.muted);M.page('settings')};
    $('reset').onclick=()=>{
      if(!confirm('Reset all progress? Levels reached, saved game, best scores and your verse collection will be cleared.'))return;
      for(const k of['rotw-save','rotw-maxlvl','rotw-col','rotw-xp','rotw-vbag','rotw-seen-boards','rotw-best-0','rotw-best-1','rotw-best-2'])R.trySet(k,'');
      R.col=[];R.xp=0;R.best=0;M.buildMenu('settings');
    };
  }
};
M.buildMenu();
})();
