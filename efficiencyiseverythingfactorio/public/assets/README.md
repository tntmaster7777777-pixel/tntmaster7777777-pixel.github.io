# Assets

This directory is where external art and audio go. The game ships with
procedurally generated placeholder graphics and a WebAudio synth, so it runs
with this folder empty — but here is how to upgrade.

## Kenney.nl sprites

Drop PNGs into `public/assets/sprites/` and update `src/scenes/BootScene.ts`:
replace the `makeStation()` / `makeBelt()` calls with `this.load.image()` calls
in `preload()`.

Recommended free packs:
- Top-Down Tanks Redux (factory feel, 64px tiles)
- Industrial Zone Platformer Art (gears, pipes, crates)
- Roguelike/Top-Down Modern City (conveyors)

Texture keys the game expects are declared in `src/game/types.ts` under `TEX`.

## sfxr / ChipTone audio

Drop .wav files into `public/assets/audio/` and preload them in BootScene:

```ts
this.load.audio('sfx-upgrade', 'assets/audio/upgrade.wav')
```

Then in `src/audio/Synth.ts`, route `Synth.play('upgrade')` to
`scene.sound.play('sfx-upgrade')`. Preset names are declared in `SFX` in
`src/game/types.ts`.

## LDTk maps (future)

`public/assets/maps/` is reserved for LDTk exports. Nothing uses it yet — the
production line is code-driven from `src/data/levels.ts`. When you move to
hand-authored factories, a sibling `src/sim/LdtkLoader.ts` will parse the
exported `.ldtk` JSON.

## Tweakpane (future)

Tweakpane is not loaded by default. When you want live-tuning, add it to
`devDependencies` and instantiate it inside a new `src/debug/Tweakpane.ts`
module that reaches into `window.game` (already exposed in `main.ts`).
