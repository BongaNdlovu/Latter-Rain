# Sound Design — Rain of the Word

Two lists: **World & Gameplay** sounds and **UI** sounds. Each entry has a 3–5 word
description of the feel it should have. "✅ in game" means it already exists in `js/audio.js`;
"➕ needed" means it's a candidate to add later.

## World & gameplay

| Sound | Description (3–5 words) | Status |
|---|---|---|
| Rain bed | Steady hushing rain wash | ✅ in game |
| Wind bed | Low breathing wind gusts | ✅ in game |
| City rumble | Distant rolling urban hum | ✅ in game |
| Drone chord | Somber sustained harmonic drone | ✅ in game |
| Rolling wheels | Rhythmic street drumming pulse | ✅ in game |
| Thunder crack | Sharp close electric snap | ✅ in game |
| Thunder roll | Deep delayed rumbling decay | ✅ in game |
| Rain droplet ticks | Tiny scattered tap impulses | ✅ in game |
| Hail knocks | Hard brittle bouncing clicks | ✅ in game |
| Tornado roar | Breathing low rushing freight-train | ✅ in game |
| Earthquake rumble | Sub-bass trembling ground groan | ✅ in game |
| Gust whoosh | Fast sweeping air burst | ✅ in game |
| Card catch chime | Bright blessed bell bloom | ✅ in game |
| Perfect verse arpeggio | Ascending golden reward sparkle | ✅ in game |
| Hurt stab | Harsh dissonant angry burst | ✅ in game |
| Shield block | Glassy force-field ping | ✅ in game |
| Power-up pickup | Warm rising boon chime | ✅ in game |
| Transformer ignition | Fiery revving power surge | ✅ in game |
| Jump leap | Short airy hop lift | ✅ in game |
| Landing thud | Dusty grounded impact puff | ✅ in game |
| Clean-air bonus | Light nimble whoosh tick | ✅ in game |
| Obstacle crash | Hollow wooden crunch shatter | ✅ in game |
| Puddle splash | Wet slapping water burst | ✅ in game |
| Steam vents | Soft continuous hiss pillows | ➕ needed (visual exists) |
| Place transition sweep | Long rising-falling travel wind | ✅ in game (new) |
| Arrival chime | Gentle two-note welcome bell | ✅ in game (new) |
| Debris scrape | Gritty dragging stone scrape | ➕ needed |
| Water lap | Soft rhythmic shore lapping | ➕ needed (Galilee) |
| Blizzard howl | High keeling icy whistle | ➕ needed |
| Distant church bell | Slow solemn bronze toll | ➕ needed (Old City / Temple) |
| Camel / market murmur | Faint bazaar crowd shimmer | ➕ needed (desert) |
| Night crickets | Sparse chirping meadow ticks | ➕ needed (forest) |
| Card spawn flutter | Quick papery flutter flick | ➕ needed |
| Verse miss whisper | Soft disapproving airy sigh | ➕ needed |
| Low hearts warning | Slow ominous heartbeat pulse | ➕ needed |
| Lightning afterimage hiss | Crackling electric after-spark | ➕ needed |
| Tsunami swell | Deep rising ocean warning roar | ✅ in game |
| Wave crash | Massive breaking water slam | ✅ in game |

## UI sounds

| Sound | Description (3–5 words) | Status |
|---|---|---|
| Menu open | Soft curtain rise swell | ➕ needed |
| Menu close | Reverse quick settle fall | ➕ needed |
| Button hover tick | Tiny neutral wooden tick | ➕ needed |
| Button press click | Crisp decisive latch click | ➕ needed |
| Board select slide | Smooth sliding plank swoosh | ➕ needed |
| Locked board knock | Dull denied heavy knock | ➕ needed |
| Board unlock fanfare | Triumphant short brass flourish | ➕ needed |
| Board equip clack | Confident truck-tighten clack | ➕ needed |
| Pause open | Muffled time-stop vacuum | ➕ needed |
| Pause close | Reversed resume inhale | ➕ needed |
| Warning banner sting | Urgent two-tone alarm hit | ✅ in game |
| Photo shutter | Classic mechanical camera snap | ✅ in game |
| New best jingle | Sparkling four-note celebration | ➕ needed |
| Verse collected chime | Sacred single bell toll | ✅ in game (catch chime) |
| Collection complete flourish | Grand harmonic choir swell | ➕ needed |
| Unlock notification ping | Bright attention-getting ding | ➕ needed |
| (Narration removed) | Speech playback cut for comfort | — removed |

## Notes

- Everything currently "in game" is synthesized live with the Web Audio API — no audio files.
  The reverb is a generated impulse response fed through a `ConvolverNode`, thunder is
  distance-delayed and panned, and the tornado roar / earthquake rumble are looped noise buses
  whose gains follow how close the disaster is.
- The transition uses the new `travel()` sweep (wind rising then falling, sent through the
  reverb) plus a two-note arrival chime when the new place appears.
- When adding file-based sound later, keep the same bed/sweep structure: loops for weather,
  one-shots for impacts, and route all one-shots through the reverb send (`A.toRev`) so the
  storm stays cohesive.
