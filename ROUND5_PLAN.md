# Round 5 plan: gameplay, realism, smoothness (board-only, Latter-Rain style)

Baseline = r4 (`/workspace/rotw_r4`). Measured headless (software GL, 1280x720, 2 runs of about 9.6 s of play):
avg 21.1 fps, frame time mean 47 ms, sd 12-14 ms, p95 67-83 ms, p99 83-100 ms; JS update+draw cpu mean 33 ms, p95 65 ms.
Profile: update() costs 0.2 ms; nearly all the time is canvas raster, which flushes inside ground.draw (reflection snapshot).

## Weaknesses found (code read + headless play)
1. **Loop**: variable dt is smoothed `raw*.4+fAvg*.6` and clamped to 33 ms, so below 30 fps the game runs in slow motion and motion steps unevenly.
   No fixed step and no interpolation. Physics, spawns and collisions depend on the frame rate.
2. **Steering** is a position lerp (`px += (tx-px)*11dt`): no momentum, accel or friction. Leaning is derived from it. No pushing.
3. **Ollie**: one fixed impulse (640). No pop charge, coyote time or jump buffer; a jump pressed 50 ms before landing is lost.
4. **Tricks**: only 4 flips + manual. No grabs, nose manual, varial/tre, grinds or slides. Bails only check rotation progress, not crooked landings.
5. **Obstacles**: 13 hop-over props of one kind (hit = heart, clear = points). Nothing skateable (rails, ledges, kickers, stairs), no potholes/puddle
   gameplay, and only a weak place theme (per ground type, not per city).
6. **Landscapes**: 2-3 parallax layers and no time-of-day shadowing. The Eiffel Tower is a flat, faint silhouette. The Christ statue is a 6 px cross.
   Ground textures: asphalt/flagstone/forest/sand/snow/water only (no cobbles/boardwalk).
7. **Disasters**: quake = camera shake only (no fissures/debris). Tornado/devil exist with pull. Tsunami has jumpable waves. No lightning-strike
   disaster with scorch, and no wildfire/ash. Telegraphing is a text warning.
8. **Per-frame allocations**: gradients rebuilt every frame (ground base, darkening, vignette, grade), `filter()` arrays every frame, template-string colours.

## Implementation (priority order)
1. Fixed 120 Hz simulation step with an accumulator (max 6 steps/frame, no slow motion down to 20 fps). Render interpolates board x/height between
   the last two sim states. Cached static gradients; in-place array compaction for hot lists. Measure p95/p99 before/after.
2. `js/skate.js` physics: velocity with push acceleration (held direction = push strokes with a kick sound), rolling friction, max speed per board,
   a carving lean from lateral acceleration. Ollie = hold to crouch (charge 0-0.35 s), release to pop (height 70-115%), plus tap support.
   Coyote time 0.1 s and a jump buffer 0.14 s. Gravity arc. Landing compression scaled by impact, with dust/sparks. Board pitch follows
   ramps/rails. Rolling noise whose loudness and pitch track speed (Web Audio, one looping noise node).
3. Tricks: varial kickflip (V), tre flip (T, or kick+shove), indy grab (hold G) and melon (hold H), held for points; nose manual (hold E / ↑+↓);
   grinds: land on a rail/bench = 50-50, on a ledge (or holding ↓) = boardslide. Balance meter with A/D correction; balance lost = bail off.
   Bail if rotation is incomplete, a grab is still held at landing, or the landing is crooked (spin angle off by >35°).
   Trick list in the menu (#tl panel) and the help.
4. Obstacles: grind rail, ledge, bench (skateable: grind or ollie for points), kicker ramp (auto-launch, extra air), stair gap (must ollie over,
   or a heart is lost), cone, pothole (hazard unless jumped), puddle (splash + slight slowdown, no damage), plus themed props: London bin,
   Paris café chairs, NY hydrant, desert rocks, Tokyo vending machine, Rio/Sydney lifeguard flag. Telegraphing: an arrow marker at the right edge
   ~1 s before entry, coloured green (skateable) or red (hazard).
5. Landscapes: an extra far haze layer + atmospheric-perspective gradient per place; a sun/time-of-day ground shadow direction; new cobble and
   boardwalk ground textures; rebuilt Eiffel Tower (four legs, arches, platforms, lit) and Christ the Redeemer (robed figure, outstretched arms,
   pedestal).
6. Disasters: quake magnitude (4.5-7.5) drives shake, ground fissures that open/close (jump them or lose a heart) and falling debris with
   shadows. Tornado: debris in the funnel + suction on board velocity. Tsunami: a telegraphed rising water level. New: lightning strike
   (target ring 1.2 s, strike, scorch decal) and wildfire ash (embers, ash fall, burning brush). All go through the existing D.begin/D.ev, so
   the bomb exclusion holds.

Out of scope / honesty: no human rider (constraint). Software-GL headless numbers are not real-GPU numbers.
