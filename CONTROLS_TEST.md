# Controls test — Rain of the Word r5b

Real CDP key / touch / mouse events in headless Chrome (software rendering) on 1280×720. Run: `python3 /workspace/v2/rp5b_ctl.py`.
Latency = fixed 60 Hz physics steps from the keydown event to the state change (0 = changed inside the key handler itself). The target is ≤1 step (≤17 ms of game time).
'Drawn next frame' = the first rendered frame after the change shows it, with wall-clock ms from keydown. At 1× the headless renderer only manages about 20 fps, and at 4× CPU throttle about 5 fps, so a frame takes about 50 ms or about 200 ms.
Buffered rows deliberately wait for the landing or recovery and pop on that exact step, so they are allowed up to 8 steps.

| Action | Input | Normal (1×) | Throttled (4× CPU) | Pass |
|---|---|---|---|---|
| Menu: Enter starts run | Enter | 1 step (17 ms) | 1 step (17 ms) | PASS |
| Keyboard focus after start (canvas) | - | CANVAS | CANVAS | PASS |
| Ollie during title card (intro) | w | 1 step (17 ms); drawn next frame (+27 ms) | 1 step (17 ms); drawn next frame (+140 ms) | PASS |
| Ollie | w | 1 step (17 ms); drawn next frame (+32 ms) | 1 step (17 ms); drawn next frame (+116 ms) | PASS |
| Ollie | ArrowUp | 1 step (17 ms); drawn next frame (+25 ms) | 1 step (17 ms); drawn next frame (+115 ms) | PASS |
| Ollie (AZERTY: physical W = "z" key) | KeyW code/key=z | 1 step (17 ms); drawn next frame (+27 ms) | 1 step (17 ms); drawn next frame (+113 ms) | PASS |
| Ollie (touch ⤒ button) | touch tap #jb | 1 step (17 ms); drawn next frame (+28 ms) | 1 step (17 ms); drawn next frame (+114 ms) | PASS |
| Ollie (mouse ⤒ button) | click #jb | 1 step (17 ms); drawn next frame (+27 ms) | 1 step (17 ms); drawn next frame (+175 ms) | PASS |
| Steer left | a | 1 step (17 ms); drawn next frame (+26 ms) | 1 step (17 ms); drawn next frame (+114 ms) | PASS |
| Steer left | ArrowLeft | 1 step (17 ms); drawn next frame (+68 ms) | 1 step (17 ms); drawn next frame (+114 ms) | PASS |
| Steer right | d | 1 step (17 ms); drawn next frame (+24 ms) | 1 step (17 ms); drawn next frame (+115 ms) | PASS |
| Steer right | ArrowRight | 1 step (17 ms); drawn next frame (+24 ms) | 1 step (17 ms); drawn next frame (+110 ms) | PASS |
| Kickflip (from ground: ollie+trick) | j | 1 step (17 ms); drawn next frame (+26 ms) | 1 step (17 ms); drawn next frame (+177 ms) | PASS |
| Heelflip (from ground: ollie+trick) | k | 1 step (17 ms); drawn next frame (+26 ms) | 1 step (17 ms); drawn next frame (+108 ms) | PASS |
| 360 shove-it (from ground: ollie+trick) | l | 1 step (17 ms); drawn next frame (+21 ms) | 1 step (17 ms); drawn next frame (+119 ms) | PASS |
| Varial (from ground: ollie+trick) | v | 1 step (17 ms); drawn next frame (+27 ms) | 1 step (17 ms); drawn next frame (+116 ms) | PASS |
| 360 flip (from ground: ollie+trick) | t | 1 step (17 ms); drawn next frame (+25 ms) | 1 step (17 ms); drawn next frame (+117 ms) | PASS |
| Hardflip (from ground: ollie+trick) | h | 1 step (17 ms); drawn next frame (+28 ms) | 1 step (17 ms); drawn next frame (+117 ms) | PASS |
| Kickflip (touch ✦) | touch tap #kb | 1 step (17 ms); drawn next frame (+26 ms) | 1 step (17 ms); drawn next frame (+172 ms) | PASS |
| Kickflip (in air) | j | 1 step (17 ms); drawn next frame (+26 ms) | 1 step (17 ms); drawn next frame (+122 ms) | PASS |
| Indy grab (in air) | g | 1 step (17 ms); drawn next frame (+25 ms) | 1 step (17 ms); drawn next frame (+113 ms) | PASS |
| Melon grab (in air) | b | 1 step (17 ms); drawn next frame (+26 ms) | 1 step (17 ms); drawn next frame (+121 ms) | PASS |
| Manual | s | 1 step (17 ms); drawn next frame (+32 ms) | 1 step (17 ms); drawn next frame (+118 ms) | PASS |
| Manual | ArrowDown | 1 step (17 ms); drawn next frame (+26 ms) | 1 step (17 ms); drawn next frame (+112 ms) | PASS |
| Nose manual | e | 1 step (17 ms); drawn next frame (+25 ms) | 1 step (17 ms); drawn next frame (+119 ms) | PASS |
| Focus | Space | 1 step (17 ms); drawn next frame (+28 ms) | 1 step (17 ms); drawn next frame (+124 ms) | PASS |
| Pause | p | 0 steps (0 ms) | 0 steps (0 ms) | PASS |
| Resume | p | 1 step (17 ms); drawn next frame (+37 ms) | 1 step (17 ms); drawn next frame (+119 ms) | PASS |
| Pause | Escape | 0 steps (0 ms) | 0 steps (0 ms) | PASS |
| Resume | Escape | 1 step (17 ms); drawn next frame (+29 ms) | 1 step (17 ms); drawn next frame (+118 ms) | PASS |
| Restart (pause menu) | click Restart | 1 step (17 ms); drawn next frame (+72 ms) | 0 steps (0 ms); drawn next frame (+520 ms) | PASS |
| Ollie on top of a ledge | w | 1 step (17 ms); drawn next frame (+29 ms) | 1 step (17 ms); drawn next frame (+112 ms) | PASS |
| Ollie in coyote time (60 ms after rolling off a ledge) | w | 1 step (17 ms); drawn next frame (+25 ms) | 1 step (17 ms); drawn next frame (+184 ms) | PASS |
| Ollie during big-landing slow-mo | w | 1 step (17 ms); drawn next frame (+25 ms) | 1 step (17 ms); drawn next frame (+122 ms) | PASS |
| Ollie during focus slow-mo | w | 1 step (17 ms); drawn next frame (+29 ms) | 1 step (17 ms); drawn next frame (+127 ms) | PASS |
| Jump buffer: press 80 ms before landing | w | 3 steps (50 ms); drawn next frame (+39 ms) | 3 steps (50 ms); drawn next frame (+123 ms) | PASS |
| Press while mid-trick (air) → buffered, pops on landing if ≤120 ms | w | 2 steps (33 ms); drawn next frame (+26 ms) | 2 steps (33 ms); drawn next frame (+116 ms) | PASS |
| Bail recovery: press ≤120 ms before recovery → buffered | w | 5 steps (83 ms); drawn next frame (+78 ms) | 5 steps (83 ms); drawn next frame (+126 ms) | PASS |
| Bail recovery: press early → ignored + "Recovering…" text | w | ignored (by design) | ignored (by design) | PASS |
| Key auto-repeat (hold W 1 s, 11 keydowns) | w | 1 ollie | 1 ollie | PASS |
| Grind entry (land on rail) | contact | 0 steps (0 ms) | 0 steps (0 ms) | PASS |
| Ollie off a grind | w | 1 step (17 ms); drawn next frame (+27 ms) | 1 step (17 ms); drawn next frame (+130 ms) | PASS |
| Ollie during quake | w | 1 step (17 ms); drawn next frame (+26 ms) | 1 step (17 ms); drawn next frame (+123 ms) | PASS |
| Ollie during tornado | w | 1 step (17 ms); drawn next frame (+32 ms) | 1 step (17 ms); drawn next frame (+114 ms) | PASS |
| Ollie during tsunami | w | 1 step (17 ms); drawn next frame (+30 ms) | 1 step (17 ms); drawn next frame (+113 ms) | PASS |
| Ollie during sandstorm | w | 1 step (17 ms); drawn next frame (+26 ms) | 1 step (17 ms); drawn next frame (+114 ms) | PASS |
| Ollie during strike | w | 1 step (17 ms); drawn next frame (+26 ms) | 1 step (17 ms); drawn next frame (+114 ms) | PASS |
| Ollie during wildfire | w | 1 step (17 ms); drawn next frame (+25 ms) | 1 step (17 ms); drawn next frame (+107 ms) | PASS |
| (rendered fps at this throttle) | - | 23 fps | 5 fps | PASS |

**49/49 checks pass at both throttles. Console errors: 0.**

## Rules
- **Ollie:** W, ↑, the ⤒ button (fires on pointerdown, for touch or mouse) and swipe-up all pop on keydown. A tap is a full ollie (about 62 cm). Holding while rising adds up to about 12 cm, and take-off is never delayed.
- **Keyboard layouts:** keys are read by `e.code` (the physical key) with `e.key` as a fallback, so AZERTY, QWERTZ and Dvorak work. Space stays **Focus**, as in Latter-Rain.
- **Jump buffer (120 ms):** a press while airborne or during the last 120 ms of a bail recovery pops on the step the board lands or recovers. An earlier press during a bail is ignored and shows a 'Recovering…' text.
- **Coyote time:** you can still ollie up to 100 ms after rolling off a ledge, kicker or stairs.
- **Grinds:** an ollie off a grind works.
- **Key repeat:** auto-repeat never double-jumps.
- **Slow-mo and hit-stop:** physics runs in real time, and an ollie cancels any hit-stop freeze and forces a sim step plus an un-interpolated draw.
- **Trick keys on the ground:** pressing one does an instant ollie plus the trick (before, it waited for a separate jump).
- **Tricks and focus during level transitions:** these now work (before, keys were swallowed in the 'trans' state).
- **Focus on start:** the canvas takes keyboard focus on load, on start and on any click.

Frame strip: `jump_strip_normal.png` and `jump_strip_throttled4x.png` (the first rendered frame after keydown already shows the board in the air).
## 5-minute autoplay (rp5b_play.py, competent-player bot with ±40 ms reaction jitter, hearts refilled to count every hit)
- **Played:** 283 s of game time, reaching level 35. 39 verses completed, 25 ollies over obstacles, score 39544.
- **Hearts lost:** 32 in total. By cause: wrong word card ×29, obstacle: debris ×1, obstacle: tire ×1, bomb (blast) ×1.
- **Levels 1–5:** 2 hearts lost, both to wrong-word cards (the bot's simple card dodging): L1 wrong word card: wrath; L5 wrong word card: prison. There were 0 obstacle deaths at levels 1–5.
- **Board crashes over the whole run:** {'slam': 1, 'trip': 1, 'overrot': 0, 'primo': 0}. Stuck states: 0. Console errors: 0.
- **Early-level tuning:**
  - Level 1 uses only low props (no gaps, stairs, rails, tyres or barriers) and spaces obstacles about 4.4 s apart.
  - Level 2 adds rails and stairs, about 3.8 s apart.
  - From level 3 the full mix comes in, including tyres.
