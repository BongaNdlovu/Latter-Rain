/* Rain of the Word — places (round 14): ten more places for the journey. Each reuses one of the skyline generators
   for its distant city, adds a landmark of its own (js/vector.js draws it as a far silhouette) and a building style for
   the painted midground, then joins the World Tour, spread between the existing stops. */
window.ROW=window.ROW||{};
(function(){
'use strict';
const R=ROW;
const NEW=[
  {n:'Istanbul',        ground:'cobble',   sky:'stone',     style:'istanbul', lm:'hagia',     wx:['Golden Dusk','Clear','Drizzle','Fog','Storm'],      fogC:[160,130,120],glow:'255,180,110'},
  {n:'Cairo',           ground:'sand',     sky:'mesa',      style:'cairo',    lm:'pyramids',  wx:['Heatwave','Sunlit','Sandstorm','Golden Dusk'],      fogC:[210,170,120],glow:'255,200,120'},
  {n:'Athens',          ground:'flagstone',sky:'colonnade', style:'athens',   lm:'parthenon', wx:['Sunlit','Clear','Golden Dusk','Drizzle'],          fogC:[180,170,160],glow:'255,200,140'},
  {n:'Venice',          ground:'water',    sky:'stone',     style:'venice',   lm:'campanile', wx:['Fog','Golden Dusk','Drizzle','Clear','Storm'],     fogC:[150,140,150],glow:'255,190,130'},
  {n:'Hong Kong',       ground:'asphalt',  sky:'tokyo',     style:'hongkong', lm:'boc',       wx:['Storm','Downpour','Drizzle','Clear','Fog','Tempest'],fogC:[100,100,150],glow:'255,140,180'},
  {n:'Prague',          ground:'cobble',   sky:'paris',     style:'prague',   lm:'castle',    wx:['Snowfall','Fog','Clear','Drizzle','Golden Dusk'],  fogC:[130,120,140],glow:'255,180,120'},
  {n:'Bethlehem',       ground:'flagstone',sky:'stone',     style:'bethlehem',lm:'nativity',  wx:['Clear','Golden Dusk','Sunlit','Fog'],              fogC:[190,165,135],glow:'255,200,130'},
  {n:'Chicago',         ground:'asphalt',  sky:'newyork',   style:'chicago',  lm:'willis',    wx:['Snowfall','Blizzard','Storm','Clear','Drizzle'],   fogC:[90,100,140], glow:'255,160,110'},
  {n:'Nazareth',        ground:'flagstone',sky:'colonnade', style:'nazareth', lm:'basilica',  wx:['Sunlit','Clear','Golden Dusk','Drizzle'],          fogC:[185,170,145],glow:'255,200,140'},
  {n:'Mumbai',          ground:'water',    sky:'city',      style:'mumbai',   lm:'gateway',   wx:['Downpour','Storm','Golden Dusk','Sunlit','Drizzle'],fogC:[150,130,120],glow:'255,180,110'}
];
for(const P of NEW)R.LOC.push({n:P.n,ground:P.ground,sky:P.sky,wx:P.wx,fogC:P.fogC,glow:P.glow,style:P.style,lm:P.lm,r14:1});
/* spread them through the tour: one new place after every second stop */
const ix=n=>R.LOC.findIndex(L=>L.n===n);
const tour=R.TOUR.slice(),out=[];let k=0;
for(let i=0;i<tour.length;i++){out.push(tour[i]);if(i%2===1&&k<NEW.length)out.push(ix(NEW[k++].n))}
while(k<NEW.length)out.push(ix(NEW[k++].n));
R.TOUR=out;
if(R.TOUR.length!==R.LOC.length)console.error('TOUR mismatch after places.js');
})();
