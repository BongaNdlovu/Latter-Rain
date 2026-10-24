# Rain of the Word — Storm Edition

A side-scrolling scripture **journey**, Vector-style. Each level is a run from the left of the screen to a finish
line on the right while *the last plague* (a rolling storm wall) chases you from behind. You dodge obstacles, collect
Bibles, ride trick cards and speed pads, and take the right word at each verse gate. Words no longer rain from the sky.

## Run it

Double-click `index.html`, or serve the folder and open it:

```
python -m http.server 8123
# then open http://127.0.0.1:8123/index.html
```

`original.html` is the untouched base version, kept verbatim for reference.

## Controls

The board **runs by itself** (no steering) and travels left → right across the screen as the level progresses.

| Input | Action |
|---|---|
| Space / W / ↑ / tap / ⤒ | Ollie (hold = a little higher). Tap again in the air = a trick |
| S / ↓ / drag down / ⤓ | Fast-fall in the air, manual on the ground — the "stay low" answer |
| J K L H V T, G B, E | Flips, grabs and nose manual (keyboard) · ✦ = kickflip (touch) |
| Shift (or tap the FOCUS meter) | Focus — slow the storm |
| P / Esc · O · M | Pause · snapshot · mute |

## Round 14: 31 places, a proper menu, saves

- **10 new places** (`js/places.js`), spread through the World Tour: Istanbul (Hagia Sophia), Cairo (the pyramids),
  Athens (the Parthenon), Venice (the campanile), Hong Kong, Prague (the castle), Bethlehem (the Church of the
  Nativity), Chicago, Nazareth (the Basilica) and Mumbai (the Gateway of India). 31 stops in all; after the last the
  tour goes round again, faster.
- **Every place fits its setting:** each has a style (London brick and chimney pots, Paris mansards, Rio's hillside of
  pastel houses, pagodas, red canyon mesas, domes and minarets, terracotta roofs, spires...) and a kind of terrain.
  Cities have rooftops, crane-hung girders and rooms; nature places (the Sea of Galilee, Cedar Forest, the Judean Desert,
  Mount Hermon, Canyon Highway) have rock ledges, ravines and rope bridges — the Sea of Galilee is a lakeshore with
  olive groves, a stone village and fishing boats; waterside places have piers on posts, open water in the gaps and
  plank footbridges. Scenery props follow the place too (boats, nets and reeds by the lake, cacti in the canyon).
- **Background and weather:** lit cumulus and an overcast deck that rolls in with rain and flashes with lightning, a
  sun or moon with lens ghosts, two painted building layers at different depths with fire escapes, billboards and
  reflections in the glass, mist banks at three depths, rain in three depths with splashes on every surface, rain
  curtains in a downpour, soft snow with depth of field, wet edges that catch the sky.
- **Bible arcs follow your jump:** they are laid along the real path of the board's jump (the trick-ring hop, or a plain
  ollie from the natural take-off point), so one clean jump collects the whole arc.
- **Menu** (`js/menu.js`): Home (Continue · New journey · Levels · Boards · Settings · Collection · How to play), each
  page with Back. Levels lists all 31 stops; any level you have reached can be started.
- **Saves:** progress is saved at the start of every level (level and the score you had then). Continue, Retry after a
  game over, and Restart level in the pause menu all begin that level from its start. Pause → Exit to menu leaves at any
  time without changing the save.

## Round 12: fair warnings, colour, sound

- **The drone catches up:** each level starts with it out of sight; it arrives 10-18 s in ("The drone has caught up"),
  then flies closer the more you crash or choose wrong.
- **Every attack is announced:** a warning banner, a klaxon and a ⚠ badge with a countdown ring over the board
  (1.2 s), then the lock-on (red aim line, or the EMP charging; 1.1 s), then the shot. Dodging scores +60.
- **Obstacles in colour:** each prop has its real-world colour lit by the scene (green dumpsters, red drums with white
  bands, orange cones, striped barriers, grey AC units, wooden crates and pallets...); the route and buildings stay black.
- **Slow motion** at the verse bridges now lasts 2 seconds.
- **Sound effects** (`js/sfx.js`, all synthesized): the drone's rotor hum that swells and pans as it closes in, its
  arrival swell, the alarm, laser lock-on and zap and sizzle, EMP charge and blast, dodge and hit stingers, slow-motion
  swell in and out, fire crackle, hail on the roofs and fog wind.

## Round 11: the drone, rooms, weather from above, slow-mo

- **The drone** (the devil's gadget) replaces the storm wall as the chaser: a stealth quadcopter with a red tracking
  eye and searchlight. It closes in when you crash or pick the wrong word, and it attacks: a **red laser** that sweeps
  along the route (jump it) and, from level 2, an **EMP pulse** that rolls along the ground (jump it). Getting hit or
  caught costs a heart. Attacks never come near a verse bridge or indoors.
- **Slow motion at every verse bridge:** as the two words come on screen the whole world eases to a third of its speed
  for 2 real seconds, the verse glows, and the letterbox widens.
- **Indoor sections** from level 3, more often as you go on: ride off a rooftop through a broken facade, drop to the
  floor inside, ride through lit rooms (windows onto the city, hanging lamps, a ceiling over your head, furniture to
  jump), and out the far side.
- **Weather from above** from level 2, at random: a cloud ceiling lowers and either **fog** rolls in (you see a little
  less far ahead) or **hail** falls. Both slow you down a little; neither hurts.
- **Fires** are obstacles now (burning debris piles with smoke and embers), and the street and rooftop plant is bigger
  and more real: AC units, dumpsters, pallets, water tanks, vent stacks, generators.
- Each place has its own colour character over the time-of-day palette, and birds cross the sky.

## Round 10: cinematic pass

- **Palettes:** pastel daylight, golden haze and neon-blue night, blended by the time of day and greyed by rain; sky,
  buildings, decor and light all take their colour from it (`V.pal` in `js/vector.js`).
- **Painted midground:** detailed buildings in each place's style (London brick and chimneys, Paris stone and mansards,
  New York water towers, Tokyo sign boards, stone domes and arches, harbour sheds and cranes, forests, dunes, alpine
  slopes) with floors, windows lit at night, scaffolding and rooftop plant; the place's own skyline and landmarks sit
  behind it as flat atmospheric layers.
- **Storm:** a painted cumulonimbus with a lit crown and a shelf cloud, grey rain shafts, a cold shadow over the scene,
  dust rolled up ahead of it and lightning that lights the cloud from inside.
- **Signs, pickups, obstacles:** verse words are neon lettering in black billboard frames; Bibles are glowing violet
  glyphs (the one accent colour); obstacles are detailed silhouettes; the HUD is quiet white type on smoked glass.

## Round 9: the Vector look

- **Silhouette foreground:** the street and rooftops you ride on are solid black; raised rooftops, wide gaps that
  open onto the hazy city below, and truss bridges hung from cranes make up each course (`js/vector.js`).
- **Verse bridges:** each missing word is a fork. Ollie onto the bridge for the word on the lit sign on top, or roll
  under it for the word on the sign hanging beneath.
- **Falls:** dropping into a gap costs a heart and puts you back on the route just past it; the plague gains meanwhile.
- **Cinematic backdrop:** each of the 21 places keeps its own skyline, now lifted into a bright painted haze that follows
  the time of day (pale day, golden dusk, neon-blue night), with a scrolling midground block, light shafts, dust in the
  light, out-of-focus foreground girders sweeping past the lens, and lit signs that spill light.
- **Trick zones:** trick cards are now glowing half-rings standing on the route.
- Props become black silhouettes; painted mid-tone decor (AC units, water towers, chimneys, domes, palms) is scenery,
  never an obstacle: black means you interact with it.

## Round 8: the journey (this edition's core loop)

- **Verse gates:** every missing word is a gate with two words, one **upper** (jump through it) and one **lower**
  (stay low). Pick the word that completes the verse *and* the matching direction. A glowing arc shows the take-off
  point and jump line; a dotted line shows the low route. 2 verses in the first levels, up to 6 later.
- **Trick cards (✦)** sit just before most obstacles and gaps: roll through one and the board auto-tricks over (or
  onto) it. A clean landing feeds *flow* (a short speed boost).
- **Low beams:** hazard-striped beams you must pass *under* — don't jump.
- **Speed pads (»)** give a boost; **Bibles** give points (the ones in the air need a jump) and charge the ★ meter;
  **power cards** (shield, be still, lamp, seek, mercy, transformer) must be earned: full meter or a perfect verse.
- **The last plague** always gains on you; crashes and wrong words let it close in, pads and flow pull you away.
  If it catches you it costs a heart.
- **A level director** lays each level out in patterns (single, pair, trio, gap run, beam, Bible arcs, kicker, pad,
  gate), spaced from jump air-time and run speed, seeded per level, with a level theme (Open road, Rail yard, Gap run,
  Boost run, Low bridge, Obstacle course, Skate park). Every level is a new place with its own weather and scenery,
  which now drifts past as you travel.
- **Disasters** (tornado, dust devil, quake, sandstorm, lightning strike, wildfire, hail, barrage, tsunami every 10th
  level) are kept and adapted: quake chunks land ahead and roll in, lightning arrives as you do (be airborne), hazards
  get trick cards. Bombs are gone (they can't be dodged on an auto-run).
- Code: `js/journey.js` (director, gates, items, storm, HUD), `js/skate.js` (auto-run lock, fast-fall),
  `js/env.js` (`E.lox` scenery travel), `js/disasters.js` (auto-run rules).
- Dev: `python dev/serve_nocache.py 8131` serves the game with no caching; `dev/bot.js` is an autopilot that
  simulates whole runs on a virtual clock (`await ROW.bot.sim({sec:600,skill:1,know:1,start:true})`).

## What's new in this edition

**Depth & atmosphere** — every card carries a depth-z: it spawns in a blurred, haze-tinted far
band and gains sharpness and size as it falls toward your plane (atmospheric perspective).
Rain is rendered in three depth strata with per-strata speed, slant and parallax that shifts
as you move.

**Eleven locations** — Sea of Galilee, Old City Street, Temple Court, Cedar Forest, Judean
Desert, Mount Hermon, Neon Harbor — and four modern cities: **Westminster, London** (Big Ben's
glowing clock, Tower Bridge, the rotating London Eye), **Paris** (Eiffel Tower with a rotating
double beacon, Haussmann rows on a flagstone plaza), **Manhattan, New York** (setback
skyscrapers, Empire spire, Lady Liberty's torch), and **Tokyo** (red-lit lattice tower,
skytree needle, stacked neon signs). Every skyline is form-shaded with rim light, birds cross
the sky, and each level travels somewhere new with its own weather table.

**Ground realism** — per-place terrain with wet sheen, puddles that ripple in rain and splash
when you skate through, scrolling road markings, shimmering water reflections, snow tracks,
sand ridges that drift with the wind, and rain-hitting-ground tick rings backed by audio
impulses.

**Storms & disasters** — ten weather types (Storm, Downpour, Tempest, Drizzle, Fog, Clear,
Snowfall, Blizzard, Sandstorm, Hailstorm) interpolated smoothly per level. Lightning is a
multi-pulse strobe with an afterimage buffer, directional scene lighting and god rays, and
thunder that arrives delayed by strike distance through a generated convolution reverb.
From level 3 the sky fights back: **tornadoes** (funnel that drags cards and rider, flinging
them skyward), **dust devils** in the desert, **earthquakes**, **hailstorms** and
**lightning barrages** — each announced by a warning banner.

**Boards & jumping** — Start on the **Drifter** and earn the rest: **Zealot** (reach level 4),
**Cornerstone** (collect 8 verses), **Olivet** (reach level 7), **Torch** (score 3,000 in one
run), and the **Transformer** (catch the rare ⚡ Transformer card). Each has its own deck art,
wheel tint, glow and stats. Jump with W / ↑ / swipe up / the ⤒ button — leap over road debris
for a "Clean!" bonus, and the card catch band rises with you, so jumping also grabs
high-falling words. Landing kicks up dust/spray with a squash.

**Road debris** — Cones, crates and rocks on the street, pots and blocks on flagstones, logs,
stumps and buoys in forest and water, barrels and rocks in the desert, ice rocks and snow
mounds on Hermon. They drift toward you faster each level; hit one and you crash (lose a
heart — your Shield absorbs it), clear it airborne and score.

**Transformer reward** — From level 4 a rare ⚡ Transformer card can fall. Catch it and your
board transforms for 12 seconds: molten gold deck, ember trail, speed ×1.6, jump ×1.2 — and
the Transformer becomes permanently selectable in the menu.

**What you're catching** — 100 KJV verses (Genesis to Colossians), one per level; after
level 100 they cycle randomly. Progress fills the Scripture Collection in the menu.

**The tsunami summit** — every 10th level the sea rises: a scripted **tsunami simulation**
with five escalating waves (76–100px) that sweep across the road. Jump each crest as it
breaks — cleared waves score "Rode the wave!", getting caught costs a heart. A guaranteed
🛡 Shield card opens the level, and Focus slow-mo widens your jump window, so it's hard but
humanly beatable. The transition title card announces it: *Level 10 · TSUNAMI SURVIVAL*.

**Care & progression** — ⛒ **medical kits** drop on the road once per level when your hearts
are critical — drive through the green cross to restore one heart. Flawless verses build a
**verse chain** (up to ×2 score, shown in the HUD; damage breaks it). **Checkpoints** every
5th level unlock a *Continue* button on the game-over screen (level kept, score −25%). The
game-over **stats card** tracks time, distance, verses, best chain, waves ridden, obstacles
cleared and medkits used. Rain is heavier overall — the pool scales with weather intensity.

**Difficulty** — every verse now has **two or more missing words** to catch. False decoy
words outnumber true ones from the start (53% at level 1, 74% by level 20); cards fall
faster and spawn tighter each level; road debris speeds up; disasters strike more often.
From level 5, **bombs** rain down among the cards — dark spheres with sparking fuses and a
red danger glow. Catch one (or let one burst near you) and you lose **every heart** — a
shield absorbs it, and they're dodgeable: they fall dead-straight, so just move away.
The jump was also fixed to apply the same frame you press it, so well-timed jumps now
reliably clear obstacles. Cards fall dead-straight — the only sideways forces are the
telegraphed ones (wind gusts, tornadoes). Obstacle collision is symmetric: drive into debris
from either direction and it bites; jump it with the raised leap (110px apex) and it scores.

**Menu** — a single professional column: boards, difficulty, the journey list, and a compact
Scripture Collection progress bar (the full verse list hides behind a *view* toggle).

**Performance & memory** — `stress.html` auto-runs **20 performance scenarios** (particle/card
floods, weather maximum, tornado, tsunami, lightning barrage, post-FX, depth blur, camera
chaos, HUD churn, fast-forward marathon, kitchen sink…) plus a **10-test memory suite** (heap
soak, sprite-vocabulary bound, audio-node churn, DOM churn, array-cap audits, level-cycle
heap checks). Every scenario passed: ≥154 fps-equivalent CPU frame cost and zero heap growth
across sustained churn. See `SOUNDS.md` for the sound-design lists.

**Cinematic camera** — handheld drift (layered noise), whip-pan with motion smear on level
changes, speed dolly that widens at pace, zoom punch and hit-stop (freeze-frame) on catches
and hits, impact shake, chromatic aberration.

**The board** — layered deck with visible plies, grip tape, deck-art stripe, trucks with
kingpins, wheels with hubs and spinning spokes, suspension squash on landings, contact
shadow, and wheel-spray sheets on wet ground.

## Architecture

```
index.html          shell: CSS, HUD, loads modules in order
original.html       the original single-file game, unmodified
SOUNDS.md           sound design: world/gameplay + UI cue lists
js/
  data.js     verses, decoys, 10 weather types, 7 locations, difficulties
  core.js     shared state (ROW), canvases, resize, master draw pipeline
  fx.js       particles, rings, splashes, fly text, lens droplets, hit-stop
  audio.js    convolution reverb, distance-delayed thunder, droplet/hail impulses,
              tornado roar + earthquake rumble buses, weather beds
  env.js      sky, sun/moon/stars, god rays (sun + lightning), 7 skyline generators,
              volumetric lamp cones with dust motes, anamorphic flares
  ground.js   6 terrain types, puddles, sheen, rain-tick ripples, light pools
  weather.js  weather interpolation, overlays (fog/sand/flash/slow-mo), gust scheduler
  rain.js     rain strata, snow, sand, bouncing hail, mist, gusts
  storm.js    multi-pulse lightning, afterimage buffer, sheet lightning
  disasters.js tornado, dust devil, earthquake, hail, lightning barrage
  entities.js depth-z cards, sprites, power-ups
  board.js    the skateboard, shield dome, wheel spray
  camera.js   handheld drift, whip-pan, dolly, punch, quake shake
  main.js     flow, verse logic, HUD, input, game loop
```

All modules attach to a single `window.ROW` namespace; `main.js` boots the loop after
everything registers. No build step, no dependencies — plain canvas 2D and Web Audio.

## V2 integration (tricks, 3D board, world tour)
- **Tricks:** J/Z kickflip · K/X heelflip · L/C 360 shove-it · press a flip and a shove together for a hardflip · hold S/↓ for a manual. The ✦ touch button does a kickflip. Landing mid-trick is a bail, which loses the combo. Combos bank about 2.4 s after the last landing.
- **XP and ranks:** six ranks, Grom → Legend. XP is saved in `rotw-xp`. The Aurora Veil (25k) and Midnight Chrome (60k) boards unlock with XP.
- **Journey picker:** World Tour (starts in London), Random, or start at any of the 21 places. Saved in `rotw-start`.
- **New places (`js/world.js`):** Rooftop Bowl, Midnight Harbor, Lantern Temple, Canyon Highway, Rio, Cape Town, Sydney, Dubai, Rome, Jerusalem.
- **New weather:** Sunlit, Golden Dusk and Heatwave; fog banks, heat haze, snow accumulation and soft snow sprites (`js/weather.js`, `js/rain.js`).
- See INTEGRATION_PLAN.md for what was kept and what was ported.

## Round 3 changes
- **Hazard exclusion** (`js/disasters.js`, `entities.js`, `main.js`): bombs and disasters (quake, tornado, dust devil, hail, barrage, tsunami) never overlap. No bomb spawns while a disaster is active or scheduled, nor for 4 s after one ends; a scheduled disaster (and its warning) is held until no bomb is in the air and 4 s after the last one landed. Only one disaster exists at a time.
- **Boards are visibly different in game and menu**: each deck has a `look` (grip colour, top-graphic pattern, edge colour, wheel and truck colours) in `js/data.js`, rendered by `js/board3d.js`. The menu shows a thumbnail on every board button (locked ones dimmed) and a large spinning preview of the selected one.
- **Verses**: 448 (was 100). The 348 new KJV verses are appended, so saved collections stay valid. Selection uses a persistent shuffle-bag (`rotw-vbag`), so every verse appears before any repeats; short verses come first at low levels. Run `node validate_verses.js` to validate the data.
