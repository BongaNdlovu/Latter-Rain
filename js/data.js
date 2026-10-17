/* Rain of the Word — data: verses, decoys, difficulties, weathers, locations */
window.ROW=window.ROW||{};
(function(){
'use strict';
const R=ROW;

R.V=[
["The Lord is my [shepherd]; I shall not [want].","Psalm 23:1"],
["I can do all things through [Christ] which [strengtheneth] me.","Philippians 4:13"],
["Trust in the [Lord] with all thine [heart].","Proverbs 3:5"],
["Jesus Christ the same [yesterday], and to day, and for [ever].","Hebrews 13:8"],
["Thy word is a [lamp] unto my feet, and a [light] unto my path.","Psalm 119:105"],
["Be [still], and know that I am [God].","Psalm 46:10"],
["The Lord is my [light] and my [salvation]; whom shall I fear?","Psalm 27:1"],
["In the beginning was the [Word], and the Word was with [God].","John 1:1"],
["The Lord is my [strength] and my [shield]; my heart trusted in him.","Psalm 28:7"],
["Come unto me, all ye that [labour] and are heavy laden, and I will give you [rest].","Matthew 11:28"],
["The light shineth in [darkness]; and the darkness comprehended it [not].","John 1:5"],
["He maketh me to lie down in green [pastures]: he leadeth me beside the still [waters].","Psalm 23:2"],
["For God so [loved] the world, that he gave his only begotten [Son].","John 3:16"],
["The Lord is my [rock], and my [fortress], and my deliverer.","Psalm 18:2"],
["Thy [word] have I hid in mine [heart], that I might not sin against thee.","Psalm 119:11"],
["A merry [heart] doeth good like a [medicine].","Proverbs 17:22"],
["The [fear] of the Lord is the beginning of [wisdom].","Proverbs 9:10"],
["Draw nigh to [God], and he will draw nigh to [you].","James 4:8"],
["I am the [way], the [truth], and the [life].","John 14:6"],
["We love him, because he [first] loved [us].","1 John 4:19"],
["Cast thy [burden] upon the Lord, and he shall [sustain] thee.","Psalm 55:22"],
["The [steps] of a good man are ordered by the [Lord].","Psalm 37:23"],
["Commit thy [works] unto the Lord, and thy [thoughts] shall be established.","Proverbs 16:3"],
["Pride goeth before [destruction], and an haughty spirit before a [fall].","Proverbs 16:18"],
["In the [beginning] God created the [heaven] and the earth.","Genesis 1:1"],
["And he shall be like a [tree] planted by the [rivers] of water, that bringeth forth his fruit in his season.","Psalm 1:3"],
["The [heavens] declare the [glory] of God; and the firmament sheweth his handywork.","Psalm 19:1"],
["Yea, though I walk through the [valley] of the shadow of death, I will fear no [evil]: for thou art with me.","Psalm 23:4"],
["[Wait] on the Lord: be of good [courage], and he shall strengthen thine heart.","Psalm 27:14"],
["Weeping may [endure] for a night, but [joy] cometh in the morning.","Psalm 30:5"],
["O taste and see that the Lord is [good]: [blessed] is the man that trusteth in him.","Psalm 34:8"],
["[Delight] thyself also in the Lord; and he shall give thee the [desires] of thine heart.","Psalm 37:4"],
["[Commit] thy way unto the Lord; [trust] also in him; and he shall bring it to pass.","Psalm 37:5"],
["As the hart [panteth] after the water [brooks], so panteth my soul after thee, O God.","Psalm 42:1"],
["God is our [refuge] and [strength], a very present help in trouble.","Psalm 46:1"],
["Create in me a clean [heart], O God; and renew a right [spirit] within me.","Psalm 51:10"],
["What time I am [afraid], I will [trust] in thee.","Psalm 56:3"],
["He that dwelleth in the [secret] place of the most High shall abide under the [shadow] of the Almighty.","Psalm 91:1"],
["I will say of the Lord, He is my [refuge] and my [fortress]: my God; in him will I [trust].","Psalm 91:2"],
["[Bless] the Lord, O my soul: and all that is within me, [bless] his holy name.","Psalm 103:1"],
["This is the [day] which the Lord hath made; we will [rejoice] and be glad in it.","Psalm 118:24"],
["I will lift up mine [eyes] unto the [hills], from whence cometh my help.","Psalm 121:1"],
["My [help] cometh from the Lord, which made [heaven] and earth.","Psalm 121:2"],
["Wherewithal shall a young man cleanse his [way]? by taking heed thereto according to thy [word].","Psalm 119:9"],
["Behold, how [good] and how pleasant it is for brethren to dwell together in [unity]!","Psalm 133:1"],
["I will praise thee; for I am [fearfully] and wonderfully [made]: marvellous are thy works.","Psalm 139:14"],
["[Great] is our Lord, and of great [power]: his understanding is infinite.","Psalm 147:5"],
["In all thy [ways] acknowledge him, and he shall [direct] thy paths.","Proverbs 3:6"],
["Keep thy [heart] with all diligence; for out of it are the issues of [life].","Proverbs 4:23"],
["The name of the Lord is a [strong tower]: the [righteous] runneth into it, and is safe.","Proverbs 18:10"],
["Train up a [child] in the way he should [go]: and when he is old, he will not depart from it.","Proverbs 22:6"],
["For unto us a [child] is born, unto us a [son] is given.","Isaiah 9:6"],
["Thou wilt keep him in [perfect peace], whose [mind] is stayed on thee: because he trusteth in thee.","Isaiah 26:3"],
["The grass [withereth], the flower fadeth: but the [word] of our God shall stand for ever.","Isaiah 40:8"],
["But they that [wait] upon the Lord shall renew their [strength]; they shall mount up with wings as eagles.","Isaiah 40:31"],
["[Fear] thou not; for I am [with] thee: be not dismayed; for I am thy God.","Isaiah 41:10"],
["When thou passest through the [waters], I will be [with] thee; and through the rivers, they shall not overflow thee.","Isaiah 43:2"],
["But he was [wounded] for our [transgressions], he was bruised for our iniquities.","Isaiah 53:5"],
["For I know the [thoughts] that I think toward you, thoughts of [peace], and not of evil.","Jeremiah 29:11"],
["They are new every [morning]: great is thy [faithfulness].","Lamentations 3:23"],
["A new [heart] also will I give you, and a new [spirit] will I put within you.","Ezekiel 36:26"],
["He hath shewed thee, O man, what is [good]; and what doth the Lord [require] of thee, but to do justly, and to love mercy.","Micah 6:8"],
["The Lord is [good], a strong hold in the day of [trouble]; and he knoweth them that trust in him.","Nahum 1:7"],
["Not by [might], nor by [power], but by my [spirit], saith the Lord of hosts.","Zechariah 4:6"],
["Man shall not live by [bread] alone, but by every [word] that proceedeth out of the mouth of God.","Matthew 4:4"],
["[Blessed] are the peacemakers: for they shall be called the [children] of God.","Matthew 5:9"],
["Ye are the [light] of the world. A [city] that is set on an hill cannot be hid.","Matthew 5:14"],
["Let your light so [shine] before men, that they may see your good [works].","Matthew 5:16"],
["For where your [treasure] is, there will your [heart] be also.","Matthew 6:21"],
["But seek ye [first] the kingdom of [God], and his righteousness; and all these things shall be added unto you.","Matthew 6:33"],
["[Ask], and it shall be given [you]; seek, and ye shall find; knock, and it shall be opened unto you.","Matthew 7:7"],
["Take my [yoke] upon you, and [learn] of me; for I am meek and lowly in heart.","Matthew 11:29"],
["And as ye would that men should do to [you], do ye also to [them] likewise.","Luke 6:31"],
["I am the [light] of the world: he that [followeth] me shall not walk in darkness.","John 8:12"],
["And ye shall [know] the [truth], and the truth shall make you free.","John 8:32"],
["I am come that they might have [life], and that they might have it more [abundantly].","John 10:10"],
["I am the good [shepherd]: the good shepherd giveth his [life] for the sheep.","John 10:11"],
["I am the [resurrection], and the [life]: he that believeth in me, though he were dead, yet shall he live.","John 11:25"],
["[Peace] I leave with you, my [peace] I give unto you: not as the world giveth, give I unto you.","John 14:27"],
["I am the [vine], ye are the [branches]: He that abideth in me, and I in him, the same bringeth forth much fruit.","John 15:5"],
["And we know that all things [work] together for [good] to them that love God, to them who are the called according to his purpose.","Romans 8:28"],
["What shall we then say to these things? If God be [for] us, who can be [against] us?","Romans 8:31"],
["And be not [conformed] to this world: but be ye [transformed] by the renewing of your mind.","Romans 12:2"],
["[Rejoicing] in hope; [patient] in tribulation; continuing instant in prayer.","Romans 12:12"],
["Now the God of [hope] fill you with all [joy] and peace in believing, that ye may abound in hope.","Romans 15:13"],
["[Charity] suffereth long, and is [kind]; charity envieth not; charity vaunteth not itself.","1 Corinthians 13:4"],
["And now abideth [faith], [hope], [charity], these three; but the greatest of these is charity.","1 Corinthians 13:13"],
["We are [troubled] on every side, yet not [distressed]; we are perplexed, but not in despair.","2 Corinthians 4:8"],
["Therefore if any man be in [Christ], he is a new [creature]: old things are passed away; behold, all things are become new.","2 Corinthians 5:17"],
["And he said unto me, My [grace] is sufficient for thee: for my [strength] is made perfect in weakness.","2 Corinthians 12:9"],
["But the fruit of the [Spirit] is [love], joy, peace, longsuffering, gentleness, goodness, faith.","Galatians 5:22"],
["And let us not be [weary] in well [doing]: for in due season we shall reap, if we faint not.","Galatians 6:9"],
["For by [grace] are ye saved through [faith]; and that not of yourselves: it is the gift of God.","Ephesians 2:8"],
["And be ye [kind] one to another, [tenderhearted], forgiving one another, even as God for Christ's sake hath forgiven you.","Ephesians 4:32"],
["[Rejoice] in the Lord [alway]: and again I say, Rejoice.","Philippians 4:4"],
["Be [careful] for nothing; but in every thing by [prayer] and supplication with thanksgiving let your requests be made known unto God.","Philippians 4:6"],
["And the [peace] of God, which passeth all [understanding], shall keep your hearts and minds through Christ Jesus.","Philippians 4:7"],
["Finally, brethren, whatsoever things are [true], whatsoever things are [honest], whatsoever things are [just], think on these things.","Philippians 4:8"],
["Set your [affection] on things [above], not on things on the earth.","Colossians 3:2"],
["And whatsoever ye do, do it [heartily], as to the [Lord], and not unto men.","Colossians 3:23"]
];

R.DECOY=["fear","storm","sword","stone","gold","river","night","mountain","silver","thunder",
"crown","fire","wind","bread","valley","king","sea","dust","anger","pride","sleep","fame","iron",
"blood","cloud","harvest","tower","flame","shadow","morning","vine","wheat","oil","honey","sand",
"chaos","doubt","idols","vanity","dross","haste","noise","wrath","envy","sloth"];

R.NEON=['#ff3d9a','#38f2e0','#ffb347','#8a7bff','#ff6a3d'];

/* weather types: rain, bolt, hail, sand, cloud, fog, stars, snow, wind, wet, sun + sky palette */
R.WXN=[
{n:'Storm',    rain:1,  bolt:1,  hail:0,sand:0,cloud:.95,fog:.22,stars:0,  snow:0,  wind:1,  wet:1,  sun:0,  top:[5,7,22],   mid:[18,14,50], bot:[70,34,92]},
{n:'Downpour', rain:1.5,bolt:.25,hail:0,sand:0,cloud:1,  fog:.34,stars:0,  snow:0,  wind:.55,wet:1,  sun:0,  top:[3,5,14],   mid:[12,12,34], bot:[46,26,64]},
{n:'Tempest',  rain:1.1,bolt:1.5,hail:0,sand:0,cloud:1,  fog:.30,stars:0,  snow:0,  wind:1.4,wet:1,  sun:0,  top:[7,10,16],  mid:[24,26,38], bot:[66,54,74]},
{n:'Drizzle',  rain:.35,bolt:0,  hail:0,sand:0,cloud:.7, fog:.40,stars:0,  snow:0,  wind:.25,wet:.85,sun:.12,top:[8,16,36],  mid:[22,40,74], bot:[80,92,128]},
{n:'Fog',      rain:.05,bolt:0,  hail:0,sand:0,cloud:.5, fog:1,  stars:0,  snow:0,  wind:.08,wet:.65,sun:.25,top:[26,34,52], mid:[62,76,98], bot:[128,140,160]},
{n:'Clear',    rain:0,  bolt:0,  hail:0,sand:0,cloud:.12,fog:.05,stars:1,  snow:0,  wind:.05,wet:.45,sun:.85,top:[2,5,18],   mid:[10,18,54], bot:[64,50,104]},
{n:'Snowfall', rain:0,  bolt:0,  hail:0,sand:0,cloud:.6, fog:.40,stars:.2, snow:1,  wind:.2, wet:.3, sun:.2, top:[14,20,42], mid:[44,56,92], bot:[134,134,176]},
{n:'Blizzard', rain:0,  bolt:0,  hail:0,sand:0,cloud:.9, fog:.55,stars:0,  snow:1.5,wind:1.3,wet:.3, sun:0,  top:[20,26,48], mid:[60,72,110],bot:[150,158,196]},
{n:'Sandstorm',rain:0,  bolt:0,  hail:0,sand:1,cloud:.4, fog:.55,stars:0,  snow:0,  wind:1.5,wet:0,  sun:.1, top:[48,30,18], mid:[128,82,44],bot:[196,140,84]},
{n:'Hailstorm',rain:.55,bolt:.5, hail:1,sand:0,cloud:.95,fog:.30,stars:0,  snow:0,  wind:.9, wet:1,  sun:0,  top:[8,10,24],  mid:[24,24,52], bot:[76,56,88]}
];

/* locations: ground type, skyline generator, allowed weathers, fog colour, horizon glow */
R.LOC=[
{n:'Sea of Galilee',  ground:'water',    sky:'hills',    wx:['Storm','Downpour','Tempest','Drizzle','Fog','Clear'],        fogC:[70,110,150], glow:'255,170,110'},
{n:'Old City Street', ground:'asphalt',  sky:'stone',    wx:['Storm','Downpour','Hailstorm','Drizzle','Fog','Clear'],      fogC:[95,85,120],  glow:'255,150,90'},
{n:'Temple Court',    ground:'flagstone',sky:'colonnade',wx:['Drizzle','Clear','Fog','Snowfall','Storm'],                  fogC:[115,105,140],glow:'255,190,120'},
{n:'Cedar Forest',    ground:'forest',   sky:'forest',   wx:['Drizzle','Fog','Snowfall','Storm','Clear'],                  fogC:[70,115,90],  glow:'190,255,170'},
{n:'Judean Desert',   ground:'sand',     sky:'mesa',     wx:['Clear','Sandstorm','Downpour','Drizzle'],                    fogC:[195,140,90], glow:'255,200,130'},
{n:'Mount Hermon',    ground:'snow',     sky:'alpine',   wx:['Snowfall','Blizzard','Clear','Fog'],                         fogC:[175,195,225],glow:'220,235,255'},
{n:'Neon Harbor',     ground:'asphalt',  sky:'city',     wx:['Storm','Downpour','Tempest','Hailstorm','Drizzle','Fog','Clear'],fogC:[85,95,150],glow:'255,140,160'},
{n:'Westminster, London', ground:'water',sky:'london',   wx:['Storm','Downpour','Drizzle','Fog','Clear'],                  fogC:[90,100,135], glow:'255,190,120'},
{n:'Paris',           ground:'flagstone',sky:'paris',    wx:['Drizzle','Clear','Fog','Storm','Snowfall'],                  fogC:[110,95,130],  glow:'255,185,140'},
{n:'Manhattan, New York', ground:'asphalt',sky:'newyork', wx:['Storm','Downpour','Snowfall','Clear','Hailstorm','Tempest'], fogC:[80,90,140],   glow:'255,150,100'},
{n:'Tokyo',           ground:'asphalt',  sky:'tokyo',    wx:['Storm','Tempest','Downpour','Drizzle','Clear','Fog'],        fogC:[130,80,140],  glow:'255,120,180'}
];

R.wxIdx=function(name){for(let i=0;i<R.WXN.length;i++)if(R.WXN[i].n===name)return i;return 0};

R.DIFFS=[
{n:'Gentle', hearts:3, fs:0.85, sp:1.18, cc:0.10, mul:0.8},
{n:'Storm',  hearts:2, fs:1.00, sp:1.00, cc:0,    mul:1.0},
{n:'Tempest',hearts:1, fs:1.16, sp:0.86, cc:-0.07,mul:1.5}
];

R.POWC={shield:'127,232,255',slow:'179,157,255',wide:'255,217,138',heart:'255,122,158',transform:'255,170,60',seek:'184,255,138'};

/* selectable boards: art colours, wheel tint, aura rgb, stat multipliers.
   everything but the Drifter is earned — req gates the unlock */
R.BOARDS=[
{n:'Drifter',     desc:'Balanced ride',            art:['#ff3d9a','#ffb347','#38f2e0'], wheel:'#9fc2d8', glow:'120,230,255', speed:1.0,  reach:1.0,  jump:1.0},
{n:'Zealot',      desc:'Speed ×1.25',              art:['#ff6a3d','#ffd98a','#ff4fa3'], wheel:'#e8d8b0', glow:'255,170,90',  speed:1.25, reach:0.95, jump:1.05,
 req:{kind:'level',v:4,text:'Reach level 4'}},
{n:'Cornerstone', desc:'Catch reach ×1.3',         art:['#8a7bff','#5ff2e6','#38f2e0'], wheel:'#b8c8e0', glow:'150,180,255', speed:0.9,  reach:1.3,  jump:1.0,
 req:{kind:'verses',v:8,text:'Collect 8 verses'}},
{n:'Olivet',      desc:'Jump ×1.3',                art:['#38f2e0','#a8ffb0','#ffd98a'], wheel:'#cfe8d8', glow:'170,255,190', speed:1.0,  reach:1.0,  jump:1.3,
 req:{kind:'level',v:7,text:'Reach level 7'}},
{n:'Torch',       desc:'Speed ×1.4 · Reach ×0.9',  art:['#ff4f2a','#ffb347','#ffe7a3'], wheel:'#f0d8c0', glow:'255,120,60',  speed:1.4,  reach:0.9,  jump:1.1,
 req:{kind:'score',v:3000,text:'Score 3,000 in one run'}}
];
/* unlocked by catching a Transformer card; selectable afterwards */
R.TRANSFORM={n:'Transformer', desc:'Speed ×1.6 · Jump ×1.2', art:['#ffe7a3','#ff8a2a','#ff3d2a'], wheel:'#ffe0a0', glow:'255,190,80', speed:1.6, reach:1.05, jump:1.2,
 req:{kind:'card',text:'Catch a ⚡ Transformer card'}};
})();
