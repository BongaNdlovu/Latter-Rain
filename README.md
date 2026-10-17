# Rain of the Word — Storm Edition

A cinematic side-scrolling scripture-catching game. Skate through seven lands while storms,
disasters and glowing word-cards fall around you. Catch the words that complete each verse;
avoid the decoys.

## Run it

Double-click `index.html`, or serve the folder and open it:

```
python -m http.server 8123
# then open http://127.0.0.1:8123/index.html
```

`original.html` is the untouched base version, kept verbatim for reference.

## Controls

| Input | Action |
|---|---|
| A / D or ← / → or drag | Move the board |
| W / ↑ / swipe up / ⤒ button | Jump — hop road debris, catch high cards |
| Space (or Shift) | Focus — slow the storm, drains the Focus bar |
| P / Esc | Pause |
| O | Photo snapshot (downloads a PNG) |
| M | Mute |

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
