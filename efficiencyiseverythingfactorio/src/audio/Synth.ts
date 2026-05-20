/**
 * A tiny sfxr/ChipTone-flavored WebAudio synth. This lets the game ship sound
 * effects without shipping audio files. Each preset is a short
 * oscillator + envelope burst. Replace with real sfxr .wav files by loading
 * them in BootScene and calling scene.sound.play() instead.
 */

type Preset = 'click' | 'upgrade' | 'produced' | 'win' | 'fail' | 'tick'

let ctx: AudioContext | null = null
let masterGain: GainNode | null = null

function ensure(): AudioContext {
  if (!ctx) {
    const Ctor =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext })
        .webkitAudioContext
    ctx = new Ctor()
    masterGain = ctx.createGain()
    masterGain.gain.value = 0.35
    masterGain.connect(ctx.destination)
  }
  return ctx
}

function beep(
  freq: number,
  durMs: number,
  type: OscillatorType = 'square',
  sweep = 0,
  vol = 0.5,
): void {
  const c = ensure()
  const osc = c.createOscillator()
  const g = c.createGain()
  osc.type = type
  osc.frequency.setValueAtTime(freq, c.currentTime)
  if (sweep !== 0) {
    osc.frequency.exponentialRampToValueAtTime(
      Math.max(30, freq + sweep),
      c.currentTime + durMs / 1000,
    )
  }
  g.gain.setValueAtTime(0, c.currentTime)
  g.gain.linearRampToValueAtTime(vol, c.currentTime + 0.005)
  g.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + durMs / 1000)
  osc.connect(g)
  if (masterGain) g.connect(masterGain)
  osc.start()
  osc.stop(c.currentTime + durMs / 1000 + 0.02)
}

export const Synth = {
  play(preset: Preset): void {
    try {
      switch (preset) {
        case 'click':
          beep(660, 40, 'square', -120, 0.3)
          break
        case 'upgrade':
          beep(523, 80, 'square', 0, 0.4)
          setTimeout(() => beep(784, 120, 'square', 0, 0.4), 60)
          break
        case 'produced':
          beep(880, 45, 'triangle', 120, 0.25)
          break
        case 'win':
          beep(523, 120, 'square', 0, 0.45)
          setTimeout(() => beep(659, 120, 'square', 0, 0.45), 110)
          setTimeout(() => beep(784, 220, 'square', 0, 0.45), 220)
          break
        case 'fail':
          beep(220, 180, 'sawtooth', -80, 0.4)
          setTimeout(() => beep(165, 260, 'sawtooth', -60, 0.4), 140)
          break
        case 'tick':
          beep(1200, 25, 'square', 0, 0.15)
          break
      }
    } catch {
      // AudioContext may be blocked until first user interaction — silent ok.
    }
  },

  unlock(): void {
    const c = ensure()
    if (c.state === 'suspended') void c.resume()
  },
}
