/* Rain of the Word — verse data validator.   Run:  node validate_verses.js
   Checks every entry of ROW.V (and ROW.DECOY) in js/data.js:
   - [text, reference] shape, text is a non-empty string
   - brackets balanced, 1–3 blanks, each blank non-empty and appears as a whole word in the text
   - reference format  "<Book> <chapter>:<verse>"  with a known canonical book name and plausible numbers
   - no duplicate references, no duplicate texts
   - decoy words: lowercase, unique, and no decoy equals a blank word of the *same* verse (entities.js also filters at runtime) */
const fs=require('fs'),vm=require('vm'),path=require('path');
const ctx={window:{},localStorage:{getItem(){return null},setItem(){}},ROW:undefined};ctx.window=ctx;
vm.createContext(ctx);vm.runInContext(fs.readFileSync(path.join(__dirname,'..','js','data.js'),'utf8'),ctx);
const R=ctx.ROW;
const BOOKS="Genesis,Exodus,Leviticus,Numbers,Deuteronomy,Joshua,Judges,Ruth,1 Samuel,2 Samuel,1 Kings,2 Kings,1 Chronicles,2 Chronicles,Ezra,Nehemiah,Esther,Job,Psalm,Proverbs,Ecclesiastes,Song of Solomon,Isaiah,Jeremiah,Lamentations,Ezekiel,Daniel,Hosea,Joel,Amos,Obadiah,Jonah,Micah,Nahum,Habakkuk,Zephaniah,Haggai,Zechariah,Malachi,Matthew,Mark,Luke,John,Acts,Romans,1 Corinthians,2 Corinthians,Galatians,Ephesians,Philippians,Colossians,1 Thessalonians,2 Thessalonians,1 Timothy,2 Timothy,Titus,Philemon,Hebrews,James,1 Peter,2 Peter,1 John,2 John,3 John,Jude,Revelation".split(',');
const REF=/^((?:[123] )?[A-Z][a-z]+(?: of [A-Z][a-z]+)?) (\d{1,3}):(\d{1,3})$/;
const errs=[],refs=new Map(),texts=new Map();let blanks=0,tiers=[0,0,0];
R.V.forEach((v,i)=>{
  const at=`#${i} ${Array.isArray(v)?v[1]:'?'}`,e=m=>errs.push(at+': '+m);
  if(!Array.isArray(v)||v.length!==2||typeof v[0]!=='string'||typeof v[1]!=='string'){e('bad shape');return}
  const [t,r]=v;
  const m=REF.exec(r);
  if(!m)e('reference format "'+r+'"');
  else{if(!BOOKS.includes(m[1]))e('unknown book '+m[1]);if(+m[2]<1||+m[2]>150||+m[3]<1||+m[3]>176)e('chapter/verse out of range')}
  if((t.match(/\[/g)||[]).length!==(t.match(/\]/g)||[]).length)e('unbalanced brackets');
  const bl=[...t.matchAll(/\[([^\]]+)\]/g)].map(x=>x[1]);
  if(bl.length<1||bl.length>3)e('blank count '+bl.length);
  const plain=t.replace(/[\[\]]/g,'');
  bl.forEach(w=>{
    blanks++;
    if(!w.trim()||w!==w.trim())e('empty/padded blank "'+w+'"');
    if(!new RegExp("(^|[^A-Za-z'])"+w.replace(/[.*+?^${}()|\\]/g,'\\$&')+"($|[^A-Za-z'])").test(plain))e('blank "'+w+'" not found as a whole word in the text');
  });
  if(/\s[,;:.!?]|\s{2,}|^\s|\s$/.test(plain))e('spacing problem in text');
  if(refs.has(r))e('duplicate reference (also #'+refs.get(r)+')');refs.set(r,i);
  const key=plain.toLowerCase();if(texts.has(key))e('duplicate text (also #'+texts.get(key)+')');texts.set(key,i);
  tiers[plain.length<80?0:plain.length<125?1:2]++;
});
const dseen=new Set();
R.DECOY.forEach(w=>{if(w!==w.toLowerCase()||!/^[a-z]+$/.test(w))errs.push('decoy "'+w+'" not a lowercase word');if(dseen.has(w))errs.push('duplicate decoy '+w);dseen.add(w)});
/* every verse must have at least 10 usable decoys (decoy list minus the verse's own words) */
R.V.forEach((v,i)=>{const words=new Set((v[0].toLowerCase().match(/[a-z']+/g)||[]));const n=R.DECOY.filter(w=>!words.has(w)).length;if(n<10)errs.push('#'+i+' only '+n+' decoys available')});
console.log(`verses: ${R.V.length}   blanks: ${blanks}   decoys: ${R.DECOY.length}   tiers short/medium/long: ${tiers.join('/')}`);
console.log(`unique references: ${refs.size}   unique texts: ${texts.size}`);
if(errs.length){console.log('FAIL — '+errs.length+' problem(s):');errs.forEach(x=>console.log('  '+x));process.exit(1)}
console.log('PASS — every blank word appears in its verse, every reference is well-formed, no duplicates');
