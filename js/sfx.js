/* Rain of the Word — sfx (round 12): synthesized sound effects for the journey, built on audio.js's context, master
   bus, noise buffer and reverb send. Everything is generated (no files): the drone's rotor hum, alarms, laser lock and
   zap, EMP charge and blast, slow-motion swells, fire crackle, hail and fog-wind beds, dodge stingers. */
window.ROW=window.ROW||{};
(function(){
'use strict';
const R=ROW,A=R.audio;
const X=R.sfx={};
const ok=()=>A.ready()&&A.AC&&A.M;
const now=()=>A.AC.currentTime;

/* one-shot helpers */
function osc(type,f0,f1,dur,vol,dl,pan){
  if(!ok())return;const AC=A.AC,a=now()+(dl||0);
  const o=AC.createOscillator(),g=AC.createGain();o.type=type;
  o.frequency.setValueAtTime(f0,a);if(f1!==f0)o.frequency.exponentialRampToValueAtTime(Math.max(20,f1),a+dur);
  g.gain.setValueAtTime(.0001,a);g.gain.exponentialRampToValueAtTime(Math.max(.0002,vol),a+Math.min(.03,dur*.2));g.gain.exponentialRampToValueAtTime(.0001,a+dur);
  let out=g;if(pan!=null&&AC.createStereoPanner){const p=AC.createStereoPanner();p.pan.value=pan;g.connect(p);out=p}
  o.connect(g);out.connect(A.M);o.start(a);o.stop(a+dur+.05);return g;
}
function nz(type,f0,f1,q,dur,vol,dl,rev){
  if(!ok())return;const AC=A.AC,a=now()+(dl||0);
  const n=AC.createBufferSource();n.buffer=A.nb;
  const f=AC.createBiquadFilter();f.type=type;f.Q.value=q||1;f.frequency.setValueAtTime(f0,a);if(f1!==f0)f.frequency.exponentialRampToValueAtTime(Math.max(20,f1),a+dur);
  const g=AC.createGain();g.gain.setValueAtTime(.0001,a);g.gain.exponentialRampToValueAtTime(Math.max(.0002,vol),a+Math.min(.02,dur*.2));g.gain.exponentialRampToValueAtTime(.0001,a+dur);
  n.connect(f);f.connect(g);g.connect(A.M);if(rev)A.toRev(g,rev);n.start(a,Math.random()*1.5);n.stop(a+dur+.05);
}

/* ---------- the drone's rotor hum: a persistent bus whose level, pitch and pan follow the drone ---------- */
let hum=null;
function makeHum(){
  const AC=A.AC;
  const g=AC.createGain();g.gain.value=0;
  const pan=AC.createStereoPanner?AC.createStereoPanner():null;
  const lp=AC.createBiquadFilter();lp.type='lowpass';lp.frequency.value=900;lp.Q.value=.8;
  const o1=AC.createOscillator(),o2=AC.createOscillator();o1.type='sawtooth';o2.type='sawtooth';o1.frequency.value=96;o2.frequency.value=98.7;
  const og=AC.createGain();og.gain.value=.5;
  /* rotor chop: amplitude modulation on a band of noise */
  const n=AC.createBufferSource();n.buffer=A.nb;n.loop=true;
  const bp=AC.createBiquadFilter();bp.type='bandpass';bp.frequency.value=1500;bp.Q.value=1.4;
  const chop=AC.createGain();chop.gain.value=.4;
  const lfo=AC.createOscillator(),lg=AC.createGain();lfo.frequency.value=36;lg.gain.value=.35;lfo.connect(lg);lg.connect(chop.gain);
  o1.connect(og);o2.connect(og);og.connect(lp);n.connect(bp);bp.connect(chop);chop.connect(lp);lp.connect(g);
  if(pan){g.connect(pan);pan.connect(A.M)}else g.connect(A.M);
  A.toRev(g,.15);
  o1.start();o2.start();n.start();lfo.start();
  hum={g,pan,o1,o2,lfo,lp};
}
X.hum=function(level,panV,pitch){
  if(!ok())return;if(!hum)makeHum();
  const t=now();
  hum.g.gain.setTargetAtTime(Math.max(0,level)*.22,t,.15);
  if(hum.pan)hum.pan.pan.setTargetAtTime(Math.max(-1,Math.min(1,panV)),t,.2);
  const p=pitch||1;hum.o1.frequency.setTargetAtTime(96*p,t,.2);hum.o2.frequency.setTargetAtTime(98.7*p,t,.2);hum.lfo.frequency.setTargetAtTime(36*p,t,.2);
  hum.lp.frequency.setTargetAtTime(700+600*level,t,.2);
};

/* ---------- weather beds (fog wind, hail on roofs) ---------- */
let wind=null;
X.wind=function(level){
  if(!ok())return;
  if(!wind){const AC=A.AC,n=AC.createBufferSource();n.buffer=A.nb;n.loop=true;const f=AC.createBiquadFilter();f.type='bandpass';f.frequency.value=520;f.Q.value=2.2;
    const g=AC.createGain();g.gain.value=0;const l=AC.createOscillator(),lg=AC.createGain();l.frequency.value=.25;lg.gain.value=220;l.connect(lg);lg.connect(f.frequency);
    n.connect(f);f.connect(g);g.connect(A.M);A.toRev(g,.4);n.start();l.start();wind={g}}
  wind.g.gain.setTargetAtTime(level*.12,now(),.4);
};
X.hailTick=function(){if(!ok())return;const f=2600+Math.random()*3000;nz('bandpass',f,f,6,.05,.05+Math.random()*.05);if(Math.random()<.3)osc('triangle',1800+Math.random()*1200,1400,.06,.02)};

/* ---------- drone attacks ---------- */
X.alarm=function(){
  /* a two-tone klaxon, three times */
  for(let i=0;i<3;i++){osc('square',880,880,.16,.07,i*.32,-.4);osc('square',660,660,.16,.07,i*.32+.16,-.4)}
};
X.laserLock=function(dur){
  if(!ok())return;
  osc('sine',420,1900,dur,.07,0,-.5);
  for(let k=0;k<6;k++)osc('square',1600+k*140,1600+k*140,.04,.035,dur*k/6,-.5);
};
X.laserFire=function(){
  osc('sawtooth',2600,160,.42,.13,0,-.3);osc('square',1300,90,.35,.06,0,-.3);
  nz('highpass',3000,6000,.7,.55,.09,0,.25);nz('bandpass',900,300,2,.4,.08);
};
X.laserSizzle=function(){nz('highpass',5200,5200,.8,.08,.035)};
X.empCharge=function(dur){
  osc('sine',48,190,dur,.12,0,-.4);osc('triangle',96,380,dur,.04,0,-.4);
  for(let k=0;k<8;k++)nz('highpass',4000,4000,1,.05,.05,Math.random()*dur);
};
X.empBlast=function(){
  osc('sine',95,26,.9,.32);nz('lowpass',600,80,.8,.9,.26,0,.4);
  for(let k=0;k<10;k++)nz('bandpass',2400+Math.random()*3000,1800,4,.07,.06,.05+k*.06);
};
X.dodge=function(){osc('triangle',880,1320,.18,.07,0);osc('sine',1320,1760,.22,.05,.06)};
X.hit=function(kind){
  if(kind==='laser'){nz('highpass',2500,800,.8,.5,.16);osc('sawtooth',300,60,.5,.12)}
  else{osc('square',180,40,.5,.1);nz('bandpass',1800,400,2,.6,.12)}
};
X.droneAppear=function(){
  /* ominous swell as the drone breaks into view */
  osc('sawtooth',55,82,1.6,.08,0,-.7);osc('sawtooth',55.6,83,1.6,.07,0,-.7);nz('lowpass',200,900,1,1.4,.06,0,.5);
};

/* ---------- slow motion ---------- */
X.slowIn=function(){
  nz('bandpass',1600,180,1.2,.9,.16,0,.5);osc('sine',240,62,.9,.16);osc('sine',480,124,.7,.05);
};
X.slowOut=function(){nz('bandpass',220,1500,1.2,.5,.1,0,.3);osc('sine',90,260,.45,.07)};

/* ---------- fire ---------- */
X.crackle=function(vol){
  const n=2+(Math.random()*3|0);
  for(let i=0;i<n;i++)nz('bandpass',1200+Math.random()*2400,900,3,.03+Math.random()*.04,(.04+Math.random()*.06)*(vol||1),Math.random()*.25);
  nz('lowpass',300,200,1,.4,.03*(vol||1));
};
})();
