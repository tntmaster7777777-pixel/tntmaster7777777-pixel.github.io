# Factori-E — Efficiency Is Everything

A Factorio-themed browser game that teaches the industrial-engineering ideas
from [efficiencyiseverything.com/time](https://efficiencyiseverything.com/time/):
process flow, bottlenecks, the 7 wastes (TIMWOOD), the Pareto principle, and
poka-yoke — by making you run a production line against a throughput deadline.

## Run it

There are two supported paths. Pick whichever matches your toolchain.

### A. Zero-build (no Node, no install)

`index.html` loads Phaser 3.80.1 from jsDelivr and boots `src/game.js`
directly — a single-file JS port of the TS sources. Serve the repo root
over HTTP:

```bash
python -m http.server 5173
# or:  npx http-server . -p 5173
```

Then open `http://localhost:5173`. This is the path the bundled
`.claude/launch.json` `static` preview uses.

### B. Vite + TypeScript (dev-friendly)

Prerequisite: Node 18+. Vite 5 and the bundled Phaser typings both fail
under older Node (esbuild's post-install script uses syntax that `v9.x`
can't parse — purely environmental, not a code problem). Check with:

```bash
node --version
```

Then:

```bash
npm install
npm run dev
```

The Vite dev server opens `http://localhost:5173` and live-reloads on edits.

> The TS sources (`src/main.ts`, `src/scenes/*.ts`, `src/sim/*.ts`) and the
> zero-build `src/game.js` implement the same simulation. When touching
> gameplay logic (station state machine, belt push/pull, pareto math), keep
> them in sync.

## The loop

1. Pick a shift from the menu. Each shift teaches a specific IE concept.
2. Watch your line run. The HUD updates throughput, waste %, and the Pareto
   chart live.
3. **Pause with SPACE**, click a station to spend budget upgrading its cycle
   time, resume.
4. Hit the target before time runs out. The end-of-shift report explains what
   your data actually taught about the concept.

Keys: `SPACE` pause · click station = upgrade · `TAB` concept glossary · `ESC`
back to menu.

## What each shift teaches

| Shift | Concept | Why it matters |
| --- | --- | --- |
| 1 | Process Flow + Bottleneck | Speeding a non-bottleneck station does nothing for throughput. |
| 2 | Waiting vs. Over-production | Both appear as glowing stations; both are waste; fixes differ. |
| 3 | Pareto | 80% of throughput loss lives in ~20% of stations. |

More concepts (poka-yoke, checklists) have slots in `src/data/concepts.ts` but
do not yet drive gameplay.

## Stack

- **Phaser 3** — rendering, scenes, input.
- **TypeScript** (strict) — simulation, entities, UI.
- **Vite** — dev server + build.
- **WebAudio synth** — sfxr-flavored SFX in code (no external .wavs shipped).
- **Placeholder art** — generated in `BootScene` as colored rectangles.

Slots are reserved for these without being installed:

- **Kenney.nl** sprites → `public/assets/sprites/` (see that folder's README).
- **ChipTone / sfxr .wav** → `public/assets/audio/`.
- **LDTk** → `public/assets/maps/`. Not loaded yet; levels are code-driven.
- **Tweakpane** → add to `devDependencies` when you want live-tuning; mount
  against `window.game`.

## Layout

```
index.html               # Zero-build entry — loads Phaser from CDN + src/game.js
src/
  game.js                # Zero-build bundle: all scenes + sim inlined (no build step)
  main.ts                # Vite/TS entry: Phaser.Game boot
  audio/Synth.ts         # WebAudio sfxr synth (replace with real .wavs later)
  data/
    concepts.ts          # IE concept glossary (seed for lessons + report)
    levels.ts            # Shift definitions
  game/types.ts          # Shared types + texture/audio keys
  scenes/
    MenuScene.ts         # Shift picker (also lazily generates placeholder textures)
    FactoryScene.ts      # Draws the line; runs the sim each frame
    UIScene.ts           # HUD, Pareto chart, callouts, concept glossary
    ReportScene.ts       # End-of-shift breakdown + takeaway
  sim/
    Belt.ts              # Slot-based belt with backpressure
    Station.ts           # busy/outputReady two-slot state machine
    ProductionLine.ts    # Ticks source → belts → stations → sink each frame
public/
  assets/                # Kenney sprites, audio, LDTk maps go here
```

## How the simulation teaches

The simulation deliberately reifies the academic terms:

- Each `Station` records millisecond totals in `PROCESSING`, `STARVED`,
  `BLOCKED`, and `IDLE`. `PROCESSING` is value-added time; the other three are
  the waste buckets from Lean.
- `ProductionLine.findBottleneck()` returns the station with the highest
  processing-time share — this is utilization, and the bottleneck is the
  highest-utilization station by definition.
- The Pareto chart in the HUD ranks all stations by non-value-added time. You
  can literally watch the 80/20 curve form.
- The tutorial callouts in `UIScene.pickCallout()` watch for specific
  conditions (over-starved station, over-blocked station, high global waste)
  and raise the matching named-concept tip. That is how the game transfers
  mechanical intuition into vocabulary.

## License

Code: MIT.
Placeholder art: generated at runtime from primitives, no third-party license.
Any assets you drop into `public/assets/` carry their own licenses — most
Kenney packs are CC0, but confirm per pack.
