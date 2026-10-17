/* Rain of the Word — audio: convolution reverb, distance-delayed thunder, droplet impulses,
   tornado roar + earthquake rumble buses, weather beds */
window.ROW=window.ROW||{};
(function(){
'use strict';
const R=ROW;
const A=R.audio={AC:null,M:null,nb:null};

let AC=null,M=null,REV=null,RG=null,UG=null,WG=null,roarG=null,roarP=null,quakeG=null;

A.ready=()=>!!AC;

A.init=function(){
  if(AC)return;
  try{AC=new (window.AudioContext||window.webkitAudioContext)()}catch(e){return}
  M=AC.createGain();M.gain.value=R.muted?0:0.65;M.connect(AC.destination);
  A.AC=AC;A.M=M;
  /* convolution reverb: generated exponentially-decaying stereo impulse response */
  const secs=2.6,L=Math.floor(AC.sampleRate*secs),ir=AC.createBuffer(2,L,AC.sampleRate);
  for(let ch=0;ch<2;ch++){
    const dd=ir.getChannelData(ch);
    for(let i=0;i<L;i++){
      const u=i/L;
      dd[i]=(Math.random()*2-1)*Math.pow(1-u,2.4)*(i<600?i/600:1);
    }
  }
  REV=AC.createConvolver();REV.buffer=ir;
  const rret=AC.createGain();rret.gain.value=0.85;REV.connect(rret);rret.connect(M);
  /* shared white-noise buffer */
  const NL=AC.sampleRate*2,nb=AC.createBuffer(1,NL,AC.sampleRate),nd=nb.getChannelData(0);
  for(let i=0;i<NL;i++)nd[i]=Math.random()*2-1;
  A.nb=nb;
  const bed=(ty,fr,q,gn)=>{
    const n=AC.createBufferSource();n.buffer=nb;n.loop=true;
    const f=AC.createBiquadFilter();f.type=ty;f.frequency.value=fr;f.Q.value=q;
    const g=AC.createGain();g.gain.value=gn;
    n.connect(f);f.connect(g);g.connect(M);A.toRev(g,0.12);n.start();return g;
  };
  RG=bed('bandpass',1900,0.4,0.13);
  UG=bed('lowpass',360,0.7,0.06);
  WG=bed('bandpass',420,0.9,0.02);
  [55,82.4,110.5,164.8].forEach(fr=>{
    const o=AC.createOscillator(),g=AC.createGain(),f=AC.createBiquadFilter();
    o.type='sawtooth';o.frequency.value=fr;g.gain.value=0.016;f.frequency.value=280;
    o.connect(f);f.connect(g);g.connect(M);o.start();
  });
  /* tornado roar bus: filtered noise with a slow LFO breathing on the cutoff */
  const rn=AC.createBufferSource();rn.buffer=nb;rn.loop=true;
  const rf=AC.createBiquadFilter();rf.type='lowpass';rf.frequency.value=140;rf.Q.value=1.2;
  roarG=AC.createGain();roarG.gain.value=0;
  const lfo=AC.createOscillator(),lg=AC.createGain();lfo.frequency.value=0.6;lg.gain.value=55;
  lfo.connect(lg);lg.connect(rf.frequency);lfo.start();
  roarP=AC.createStereoPanner?AC.createStereoPanner():null;
  rn.connect(rf);rf.connect(roarG);
  if(roarP){roarG.connect(roarP);roarP.connect(M)}else roarG.connect(M);
  A.toRev(roarG,0.5);
  rn.start();
  /* earthquake rumble bus */
  const qo=AC.createOscillator();qo.type='sine';qo.frequency.value=27;
  const qn=AC.createBufferSource();qn.buffer=nb;qn.loop=true;
  const qf=AC.createBiquadFilter();qf.type='lowpass';qf.frequency.value=55;
  quakeG=AC.createGain();quakeG.gain.value=0;
  qo.connect(quakeG);qn.connect(qf);qf.connect(quakeG);quakeG.connect(M);
  qo.start();qn.start();
};
A.toRev=function(node,amt){
  if(!AC||!REV)return;
  const g=AC.createGain();g.gain.value=amt;node.connect(g);g.connect(REV);
};
A.setMute=v=>{if(M)M.gain.value=v?0:0.65};
A.resume=()=>{if(AC&&AC.state==='suspended')AC.resume()};
A.suspend=()=>{if(AC&&AC.state==='running')AC.suspend()};

function tone(f,ty,dur,v,dl){
  if(!AC)return;dl=dl||0;
  const o=AC.createOscillator(),g=AC.createGain(),a=AC.currentTime+dl;
  o.type=ty;o.frequency.value=f;
  g.gain.setValueAtTime(0.0001,a);
  g.gain.exponentialRampToValueAtTime(Math.max(0.0002,v),a+0.012);
  g.gain.exponentialRampToValueAtTime(0.0001,a+dur);
  o.connect(g);g.connect(M);o.start(a);o.stop(a+dur+0.02);
}
A.tone=tone;
function noise(fr,ty,v,dur){
  if(!AC)return;
  const n=AC.createBufferSource();n.buffer=A.nb;
  const f=AC.createBiquadFilter();f.type=ty;f.frequency.value=fr;
  const g=AC.createGain(),a=AC.currentTime;
  g.gain.setValueAtTime(v,a);
  g.gain.exponentialRampToValueAtTime(0.0001,a+dur);
  n.connect(f);f.connect(g);g.connect(M);n.start();n.stop(a+dur+0.05);
}
A.noise=noise;
A.arp=function(fs,dur,v){(fs||[]).forEach((f,i)=>tone(f,'sine',dur,v,i*0.08))};
A.whoosh=function(){
  if(!AC)return;
  const n=AC.createBufferSource();n.buffer=A.nb;
  const f=AC.createBiquadFilter();f.type='bandpass';f.Q.value=1.1;
  const a=AC.currentTime;
  f.frequency.setValueAtTime(240,a);f.frequency.exponentialRampToValueAtTime(1300,a+0.5);
  const g=AC.createGain();
  g.gain.setValueAtTime(0.0001,a);g.gain.exponentialRampToValueAtTime(0.15,a+0.15);g.gain.exponentialRampToValueAtTime(0.0001,a+0.72);
  n.connect(f);f.connect(g);g.connect(M);A.toRev(g,0.2);n.start();n.stop(a+0.78);
};
A.kick=function(){
  if(!AC)return;
  const o=AC.createOscillator(),g=AC.createGain(),a=AC.currentTime;
  o.frequency.setValueAtTime(120,a);o.frequency.exponentialRampToValueAtTime(42,a+0.22);
  g.gain.setValueAtTime(0.26,a);g.gain.exponentialRampToValueAtTime(0.0001,a+0.28);
  o.connect(g);g.connect(M);o.start(a);o.stop(a+0.3);
};
A.chime=function(){tone(659,'sine',1.3,0.20);tone(988,'sine',1.5,0.14,0.08);tone(1318,'triangle',1.1,0.06,0.17)};
A.stab=function(){tone(196,'sawtooth',0.55,0.18);tone(207,'sawtooth',0.55,0.16);noise(150,'lowpass',0.5,2.4);noise(70,'lowpass',0.35,3.0)};
/* place transition: long rising-falling wind sweep, drenched in reverb */
A.travel=function(){
  if(!AC)return;
  const n=AC.createBufferSource();n.buffer=A.nb;
  const f=AC.createBiquadFilter();f.type='bandpass';f.Q.value=0.8;
  const a=AC.currentTime;
  f.frequency.setValueAtTime(170,a);
  f.frequency.exponentialRampToValueAtTime(1400,a+0.7);
  f.frequency.exponentialRampToValueAtTime(150,a+1.3);
  const g=AC.createGain();
  g.gain.setValueAtTime(0.0001,a);
  g.gain.exponentialRampToValueAtTime(0.16,a+0.5);
  g.gain.exponentialRampToValueAtTime(0.0001,a+1.35);
  n.connect(f);f.connect(g);g.connect(M);A.toRev(g,0.6);
  n.start();n.stop(a+1.4);
};

/* distance-delayed thunder: crack arrives almost instantly when close, rumble rolls in late
   from far strikes; everything drenched in the convolution reverb, panned to the bolt */
A.thunder=function(dist01,pow,x){
  if(!AC)return;
  dist01=R.clamp(dist01||0,0,1);pow=pow==null?0.6:pow;
  const delay=0.10+dist01*2.7,a=AC.currentTime+delay;
  let dst=M;
  if(AC.createStereoPanner){
    const pan=AC.createStereoPanner();
    const pv=R.clamp(((x==null?R.W*0.5:x)-(R.px||R.W/2))/(R.W||1)*1.7,-1,1);
    pan.pan.value=isFinite(pv)?pv:0;
    pan.connect(M);A.toRev(pan,0.9);dst=pan;
  }
  /* sharp crack */
  const cr=AC.createBufferSource();cr.buffer=A.nb;
  const cf=AC.createBiquadFilter();cf.type='highpass';cf.frequency.value=Math.max(200,900-dist01*600);
  const cg=AC.createGain();
  cg.gain.setValueAtTime(0.0001,a);
  cg.gain.exponentialRampToValueAtTime(Math.max(0.001,0.5*pow/(1+dist01*1.4)),a+0.012);
  cg.gain.exponentialRampToValueAtTime(0.0001,a+0.22+0.25*(1-dist01));
  cr.connect(cf);cf.connect(cg);cg.connect(dst);cr.start(a);cr.stop(a+0.7);
  /* rolling rumble */
  const ru=AC.createBufferSource();ru.buffer=A.nb;ru.loop=true;
  const rf=AC.createBiquadFilter();rf.type='lowpass';rf.frequency.value=Math.max(50,190-dist01*130);
  const rg=AC.createGain();const r0=a+0.05,dur=2.2+pow*1.6+dist01*1.2;
  rg.gain.setValueAtTime(0.0001,r0);
  rg.gain.exponentialRampToValueAtTime(Math.max(0.001,0.42*pow/(1+dist01*1.2)),r0+0.09);
  rg.gain.exponentialRampToValueAtTime(0.0001,r0+dur);
  ru.connect(rf);rf.connect(rg);rg.connect(dst);ru.start(r0);ru.stop(r0+dur+0.1);
};

/* rain droplet impulse: tiny bandpassed blip */
A.tickRain=function(){
  if(!AC)return;
  const n=AC.createBufferSource();n.buffer=A.nb;
  const f=AC.createBiquadFilter();f.type='bandpass';f.frequency.value=2600+Math.random()*2600;f.Q.value=6;
  const g=AC.createGain(),a=AC.currentTime,v=0.012+Math.random()*0.02;
  g.gain.setValueAtTime(v,a);g.gain.exponentialRampToValueAtTime(0.0001,a+0.045);
  let dst=M;
  if(AC.createStereoPanner){const p=AC.createStereoPanner();p.pan.value=Math.random()*1.6-0.8;p.connect(M);A.toRev(p,0.25);dst=p}
  n.connect(f);f.connect(g);g.connect(dst);n.start(a);n.stop(a+0.06);
};
/* hail impulse: harder, sharper knock */
A.tickHail=function(){
  if(!AC)return;
  const n=AC.createBufferSource();n.buffer=A.nb;
  const f=AC.createBiquadFilter();f.type='bandpass';f.frequency.value=1400+Math.random()*1800;f.Q.value=3;
  const g=AC.createGain(),a=AC.currentTime,v=0.03+Math.random()*0.035;
  g.gain.setValueAtTime(v,a);g.gain.exponentialRampToValueAtTime(0.0001,a+0.05);
  let dst=M;
  if(AC.createStereoPanner){const p=AC.createStereoPanner();p.pan.value=Math.random()*1.6-0.8;p.connect(M);A.toRev(p,0.3);dst=p}
  n.connect(f);f.connect(g);g.connect(dst);n.start(a);n.stop(a+0.07);
};
A.roar=function(v,pan){
  if(!AC||!roarG)return;
  roarG.gain.setTargetAtTime(R.clamp(v,0,1)*0.55,AC.currentTime,0.25);
  if(roarP&&pan!=null)roarP.pan.setTargetAtTime(R.clamp(pan,-1,1),AC.currentTime,0.3);
};
A.quake=function(v){
  if(!AC||!quakeG)return;
  quakeG.gain.setTargetAtTime(R.clamp(v,0,1)*0.4,AC.currentTime,0.3);
};
A.setBeds=function(wx){
  if(!AC||!RG)return;
  const n=AC.currentTime;
  RG.gain.setTargetAtTime(0.01+0.14*Math.min(1.5,wx.rain),n,0.4);
  UG.gain.setTargetAtTime(0.01+0.06*wx.rain,n,0.4);
  WG.gain.setTargetAtTime(0.01+0.09*wx.wind+0.03*wx.snow+0.05*wx.sand,n,0.5);
};
})();
