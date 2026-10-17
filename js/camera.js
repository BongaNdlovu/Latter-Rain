/* Rain of the Word — camera: handheld drift, whip-pan, speed dolly, zoom punch,
   quake shake, impact shake */
window.ROW=window.ROW||{};
(function(){
'use strict';
const R=ROW;
const C=R.cam={
  zm:1,rot:0,sx:0,sy:0,whipX:0,whipV:0,punch:0,quakeAmp:0,smear:0,
  ph:[Math.random()*9,Math.random()*9,Math.random()*9,Math.random()*9,Math.random()*9]
};

/* layered pseudo-noise for handheld drift */
const noise=(t,o)=>Math.sin(t*0.9+o)*0.5+Math.sin(t*1.7+o*2.7)*0.3+Math.sin(t*3.1+o*1.3)*0.2;

C.whip=function(dir){C.whipV+=dir*R.W*3.2};
C.punchFn=function(v){C.punch=Math.max(C.punch,v)};
C.addShake=function(v){R.shake=Math.max(R.shake,v)};

C.update=function(dt){
  C.whipX+=C.whipV*dt;
  C.whipV*=Math.exp(-dt*4.5);
  C.whipX*=Math.exp(-dt*3.2);
  C.punch=Math.max(0,C.punch-dt*2.4);
  if(!R.disasters||!R.disasters.ev||R.disasters.ev.type!=='quake')
    C.quakeAmp=Math.max(0,C.quakeAmp-dt*1.4);
  C.smear=Math.min(1,Math.abs(C.whipV)/(R.W*1.5));
};

C.compute=function(){
  const t=R.t,S=R.S;
  const speed=Math.min(1,Math.abs(R.vel)/R.W);
  /* speed dolly pulls back when hauling, focus/zoom punch pushes in */
  C.zm=1.02
    +Math.sin(t*0.3)*0.010
    +C.punch*0.030
    +R.introT*0.05
    +(1-R.slowF)*0.045
    -speed*0.035;
  C.rot=R.lean*0.011
    +noise(t*0.5,C.ph[0])*0.004
    +Math.sin(t*47)*C.quakeAmp*0.012;
  /* handheld drift, amplified by shake and quakes */
  const drift=(4+R.shake*16+C.quakeAmp*14)*S;
  const hx=noise(t*0.6,C.ph[1])*drift;
  const hy=noise(t*0.55,C.ph[2])*drift*0.6;
  const a=Math.sin(t*63)+Math.sin(t*41+1.7),b=Math.sin(t*57+.6)+Math.sin(t*37+2.9);
  C.sx=hx+a*7*S*R.shake+C.whipX+C.quakeAmp*Math.sin(t*61)*8*S;
  C.sy=hy+b*7*S*R.shake+C.quakeAmp*Math.sin(t*49)*5*S;
};

C.apply=function(){
  const cx=R.cx;
  cx.translate(R.W/2,R.H/2);
  cx.rotate(C.rot);
  cx.scale(C.zm,C.zm);
  cx.translate(-R.W/2+C.sx,-R.H/2+C.sy);
};
})();
