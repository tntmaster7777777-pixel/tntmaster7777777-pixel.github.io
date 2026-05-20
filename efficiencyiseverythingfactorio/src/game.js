/* global Phaser */
/* Zero-build Factori-E — radically simple edition.
 *
 * One screen. One click. One lesson:
 *   "A chain moves at the speed of its slowest link."
 *
 * You see 3 stations. One is slow — items pile up in front of it. You get
 * ONE click. The station you click speeds up. Hit the gear target → win.
 * Miss → lose. Click to play again. That's the whole game.
 */
(() => {
  // ---------------- Game config ----------------
  const CONFIG = {
    targetGears: 18,
    shiftSeconds: 30,
    beltSlots: 5,
    beltStepMs: 180,
    sourceIntervalMs: 900,
    stations: [
      { label: 'Cutter',    cycleMs:  900 },
      { label: 'Stamper',   cycleMs: 1800 }, // ← the slow one (bottleneck)
      { label: 'Assembler', cycleMs: 1000 },
    ],
    upgradeFactor: 0.5, // click halves cycleMs
  }

  // ---------------- Textures ----------------
  const TEX = {
    belt: 'tex-belt', beltArrow: 'tex-belt-arrow',
    station: 'tex-station', stationBusy: 'tex-station-busy',
    stationStarved: 'tex-station-starved', stationBlocked: 'tex-station-blocked',
    source: 'tex-source', sink: 'tex-sink', item: 'tex-item', floor: 'tex-floor',
  }

  // ---------------- Tiny synth ----------------
  const Synth = (() => {
    let ctx = null, master = null
    function ensure() {
      if (!ctx) {
        const Ctor = window.AudioContext || window.webkitAudioContext
        ctx = new Ctor()
        master = ctx.createGain(); master.gain.value = 0.3; master.connect(ctx.destination)
      }
      return ctx
    }
    function beep(freq, durMs, type, sweep, vol) {
      const c = ensure(), osc = c.createOscillator(), g = c.createGain()
      osc.type = type || 'square'
      osc.frequency.setValueAtTime(freq, c.currentTime)
      if (sweep) osc.frequency.exponentialRampToValueAtTime(Math.max(30, freq + sweep), c.currentTime + durMs / 1000)
      g.gain.setValueAtTime(0, c.currentTime)
      g.gain.linearRampToValueAtTime(vol == null ? 0.4 : vol, c.currentTime + 0.005)
      g.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + durMs / 1000)
      osc.connect(g); g.connect(master); osc.start(); osc.stop(c.currentTime + durMs / 1000 + 0.02)
    }
    return {
      play(p) { try {
        if (p === 'click')    beep(660, 40, 'square', -120, 0.3)
        if (p === 'upgrade')  { beep(523, 80, 'square', 0, 0.4); setTimeout(() => beep(784, 120, 'square', 0, 0.4), 60) }
        if (p === 'produced') beep(880, 45, 'triangle', 120, 0.25)
        if (p === 'win')      { beep(523, 120, 'square', 0, 0.45); setTimeout(() => beep(659, 120, 'square', 0, 0.45), 110); setTimeout(() => beep(784, 220, 'square', 0, 0.45), 220) }
        if (p === 'fail')     { beep(220, 180, 'sawtooth', -80, 0.4); setTimeout(() => beep(165, 260, 'sawtooth', -60, 0.4), 140) }
      } catch (_) { /* ignore */ } },
      unlock() { const c = ensure(); if (c.state === 'suspended') c.resume() },
    }
  })()

  // ---------------- Simulation ----------------
  class Belt {
    constructor(length, stepMs) {
      this.length = length; this.stepMs = stepMs
      this.slots = new Array(length).fill(false); this.accumMs = 0
    }
    tick(dtMs) {
      this.accumMs += dtMs
      while (this.accumMs >= this.stepMs) {
        this.accumMs -= this.stepMs
        for (let i = this.slots.length - 1; i > 0; i--) {
          if (!this.slots[i] && this.slots[i - 1]) { this.slots[i] = true; this.slots[i - 1] = false }
        }
      }
    }
    push() { if (this.slots[0]) return false; this.slots[0] = true; return true }
    hasLast() { return this.slots[this.slots.length - 1] }
    takeLast() { if (!this.hasLast()) return false; this.slots[this.slots.length - 1] = false; return true }
  }

  let _nextId = 0
  class Station {
    constructor(label, cycleMs) {
      this.id = 'stn-' + _nextId++
      this.label = label; this.cycleMs = cycleMs
      this.busy = false; this.outputReady = false; this.progressMs = 0
    }
    tick(dtMs) {
      if (this.busy) {
        this.progressMs += dtMs
        if (this.progressMs >= this.cycleMs) {
          this.progressMs = 0; this.busy = false; this.outputReady = true
        }
      }
    }
    tryStart() { if (!this.busy && !this.outputReady) { this.busy = true; this.progressMs = 0; return true } return false }
    tryDrain() { if (!this.outputReady) return false; this.outputReady = false; return true }
    progressRatio() { return Math.min(1, this.progressMs / this.cycleMs) }
    isBlocked() { return this.outputReady }
  }

  class ProductionLine {
    constructor(cfg) {
      this.cfg = cfg
      this.stations = cfg.stations.map(s => new Station(s.label, s.cycleMs))
      this.belts = []
      for (let i = 0; i <= this.stations.length; i++) this.belts.push(new Belt(cfg.beltSlots, cfg.beltStepMs))
      this.elapsedMs = 0; this.produced = 0; this.sourceAccum = 0
      this.running = false; this.onProduced = null
    }
    tick(dtMs) {
      if (!this.running) return
      this.elapsedMs += dtMs
      this.sourceAccum += dtMs
      while (this.sourceAccum >= this.cfg.sourceIntervalMs) { this.sourceAccum -= this.cfg.sourceIntervalMs; this.belts[0].push() }
      for (const b of this.belts) b.tick(dtMs)
      for (let i = 0; i < this.stations.length; i++) {
        const stn = this.stations[i], inBelt = this.belts[i], outBelt = this.belts[i + 1]
        if (stn.outputReady && !outBelt.slots[0]) { outBelt.push(); stn.tryDrain() }
        if (!stn.busy && !stn.outputReady && inBelt.hasLast()) { inBelt.takeLast(); stn.tryStart() }
      }
      for (const s of this.stations) s.tick(dtMs)
      if (this.belts[this.belts.length - 1].takeLast()) { this.produced++; if (this.onProduced) this.onProduced() }
    }
  }

  // ---------------- Texture helpers ----------------
  function generateTextures(scene) {
    if (scene.textures.exists(TEX.floor)) return
    mk(scene, TEX.floor, 32, 32, g => { g.fillStyle(0x1f2228).fillRect(0, 0, 32, 32); g.lineStyle(1, 0x2a2e36).strokeRect(0, 0, 32, 32) })
    mk(scene, TEX.belt,  32, 32, g => { g.fillStyle(0x3a3f48).fillRect(0, 0, 32, 32); g.fillStyle(0x2a2f36).fillRect(0, 0, 32, 4).fillRect(0, 28, 32, 4) })
    mk(scene, TEX.beltArrow, 32, 32, g => { g.fillStyle(0x6a7080).beginPath(); g.moveTo(8, 10); g.lineTo(22, 16); g.lineTo(8, 22); g.closePath(); g.fillPath() })
    mkStation(scene, TEX.station,        0x3a5a7a, 0x6aa3d8)
    mkStation(scene, TEX.stationBusy,    0x2a6a3a, 0x6ae36a)
    mkStation(scene, TEX.stationStarved, 0x1f4a7a, 0x4db1ff)
    mkStation(scene, TEX.stationBlocked, 0x7a4a1f, 0xffa04d)
    mk(scene, TEX.source, 72, 72, g => {
      g.fillStyle(0x14171c).fillRect(0, 0, 72, 72)
      g.fillStyle(0x7a6a3a).fillRect(4, 4, 64, 64)
      g.fillStyle(0xe0c070); for (let y = 12; y < 64; y += 12) for (let x = 12; x < 64; x += 12) g.fillRect(x, y, 8, 8)
    })
    mk(scene, TEX.sink, 72, 72, g => {
      g.fillStyle(0x14171c).fillRect(0, 0, 72, 72)
      g.fillStyle(0x3a3f48).fillRect(4, 4, 64, 64)
      g.fillStyle(0x1a1d22).fillRect(10, 14, 52, 44)
      g.fillStyle(0x6a7080).fillRect(32, 8, 8, 56)
    })
    mk(scene, TEX.item, 16, 16, g => { g.fillStyle(0xe0c070).fillCircle(8, 8, 6); g.fillStyle(0x8a6a20).fillCircle(8, 8, 3) })
  }
  function mk(scene, key, w, h, draw) {
    const g = scene.make.graphics({ x: 0, y: 0 }, false); draw(g); g.generateTexture(key, w, h); g.destroy()
  }
  function mkStation(scene, key, body, accent) {
    mk(scene, key, 72, 72, g => {
      g.fillStyle(0x14171c).fillRect(0, 0, 72, 72)
      g.fillStyle(body).fillRect(4, 4, 64, 64)
      g.fillStyle(accent).fillRect(10, 10, 52, 10).fillRect(18, 32, 36, 6).fillRect(18, 44, 36, 6)
      g.fillStyle(0x14171c).fillRect(14, 28, 44, 28)
    })
  }

  // ---------------- The one and only scene ----------------
  const TILE = 48, STATION_SIZE = 72

  class PlayScene extends Phaser.Scene {
    constructor() { super('Play') }

    init() {
      this.line = new ProductionLine(CONFIG)
      this.clickedStationId = null
      this.finished = false
      this.showWin = null
      this.stationViews = []
      this.beltViews = []
    }

    create() {
      generateTextures(this)
      this.cameras.main.setBackgroundColor('#1a1d22')
      this._floor()
      this._layout()
      this.line.onProduced = () => Synth.play('produced')
      this.line.running = true
      this._buildHud()

      this.input.keyboard.on('keydown-R', () => this.scene.restart())
    }

    update(_t, dtMs) {
      if (this.finished) return
      this.line.tick(dtMs)
      this._render()
      if (this.line.elapsedMs / 1000 >= CONFIG.shiftSeconds) this._end()
    }

    _floor() {
      const W = this.scale.width, H = this.scale.height
      const cols = Math.ceil(W / 32) + 2, rows = Math.ceil(H / 32) + 2
      for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++)
        this.add.image(c * 32, r * 32, TEX.floor).setOrigin(0, 0).setDepth(0)
    }

    _layout() {
      const W = this.scale.width, H = this.scale.height
      const N = this.line.stations.length, bl = CONFIG.beltSlots
      const totalW = STATION_SIZE + bl * TILE + N * (STATION_SIZE + bl * TILE) + STATION_SIZE
      const startX = Math.max(40, (W - totalW) / 2)
      const lineY = H / 2 + 20

      this.add.image(startX + STATION_SIZE / 2, lineY, TEX.source).setDepth(2)
      this.add.text(startX + STATION_SIZE / 2, lineY + STATION_SIZE / 2 + 8, 'INPUT',
        { fontFamily: 'Consolas', fontSize: '12px', color: '#b0b4bc' }).setOrigin(0.5, 0).setDepth(2)

      let cursor = startX + STATION_SIZE
      for (let i = 0; i < this.line.belts.length; i++) {
        const belt = this.line.belts[i]
        this.beltViews.push(this._buildBelt(cursor, lineY, belt.length))
        cursor += belt.length * TILE
        if (i < N) {
          const stn = this.line.stations[i]
          this.stationViews.push(this._buildStation(cursor + STATION_SIZE / 2, lineY, i, stn))
          cursor += STATION_SIZE
        }
      }
      this.add.image(cursor + STATION_SIZE / 2, lineY, TEX.sink).setDepth(2)
      this.add.text(cursor + STATION_SIZE / 2, lineY + STATION_SIZE / 2 + 8, 'GEARS',
        { fontFamily: 'Consolas', fontSize: '12px', color: '#b0b4bc' }).setOrigin(0.5, 0).setDepth(2)
    }

    _buildBelt(x, y, length) {
      const slots = []
      for (let i = 0; i < length; i++) {
        this.add.image(x + i * TILE + TILE / 2, y, TEX.belt).setDepth(1)
        this.add.image(x + i * TILE + TILE / 2, y, TEX.beltArrow).setDepth(1).setAlpha(0.4)
        slots.push(this.add.image(x + i * TILE + TILE / 2, y, TEX.item).setDepth(3).setVisible(false))
      }
      return { slots, length }
    }

    _buildStation(x, y, index, stn) {
      const glow = this.add.rectangle(x, y, STATION_SIZE + 14, STATION_SIZE + 14, 0xffffff, 0).setDepth(2)
      const sprite = this.add.image(x, y, TEX.station).setDepth(3).setInteractive({ useHandCursor: true })
      const labelText = this.add.text(x, y - STATION_SIZE / 2 - 18, stn.label,
        { fontFamily: 'Consolas', fontSize: '14px', color: '#f0d080' }).setOrigin(0.5).setDepth(4)
      const progress = this.add.rectangle(x - STATION_SIZE / 2, y + STATION_SIZE / 2 - 6, 0, 4, 0x6ae36a)
        .setOrigin(0, 0.5).setDepth(4)

      sprite.on('pointerdown', () => this._onClickStation(stn.id))
      return { id: stn.id, sprite, label: labelText, progress, glow, index }
    }

    _onClickStation(id) {
      if (this.finished || this.clickedStationId) return
      Synth.unlock(); Synth.play('upgrade')
      this.clickedStationId = id
      const stn = this.line.stations.find(s => s.id === id)
      stn.cycleMs = Math.max(250, Math.round(stn.cycleMs * CONFIG.upgradeFactor))
      this.instruction.setText('GO! Ship the gears before time runs out.')
      this.instruction.setColor('#6ae36a')
    }

    _buildHud() {
      const W = this.scale.width
      // Big goal number, top centre
      this.goalText = this.add.text(W / 2, 18, '0 / ' + CONFIG.targetGears + '  GEARS',
        { fontFamily: 'Impact, sans-serif', fontSize: '48px', color: '#f0c060' }).setOrigin(0.5, 0).setDepth(100)
      this.timeText = this.add.text(W / 2, 78, CONFIG.shiftSeconds.toFixed(1) + 's left',
        { fontFamily: 'Consolas', fontSize: '18px', color: '#cbd1dc' }).setOrigin(0.5, 0).setDepth(100)

      // Big instruction, under the hud
      this.instruction = this.add.text(W / 2, 120,
        'Click the slowest station to speed it up.',
        { fontFamily: 'Segoe UI, sans-serif', fontSize: '22px', color: '#ffd87a',
          fontStyle: 'bold' }).setOrigin(0.5, 0).setDepth(100)

      // Hint below: "Look for items piling up"
      this.hint = this.add.text(W / 2, 156,
        '(Look for items piling up in front of a station — that\u2019s the slow one.)',
        { fontFamily: 'Segoe UI, sans-serif', fontSize: '13px', color: '#9aa0aa',
          fontStyle: 'italic' }).setOrigin(0.5, 0).setDepth(100)
    }

    _render() {
      for (let i = 0; i < this.beltViews.length; i++) {
        const belt = this.line.belts[i], view = this.beltViews[i]
        for (let s = 0; s < view.length; s++) view.slots[s].setVisible(belt.slots[s])
      }
      for (const view of this.stationViews) {
        const stn = this.line.stations[view.index]
        let tex = TEX.station, glowColor = 0, glowAlpha = 0
        if (stn.busy)            { tex = TEX.stationBusy;    glowColor = 0x6ae36a; glowAlpha = 0.15 }
        else if (stn.outputReady){ tex = TEX.stationBlocked; glowColor = 0xffa04d; glowAlpha = 0.30 }
        else                     { tex = TEX.stationStarved; glowColor = 0x4db1ff; glowAlpha = 0.20 }
        if (view.id === this.clickedStationId) { glowColor = 0xf0c060; glowAlpha = 0.45 }
        view.sprite.setTexture(tex)
        view.glow.setFillStyle(glowColor, glowAlpha)
        view.progress.width = stn.progressRatio() * STATION_SIZE
      }
      const remaining = Math.max(0, CONFIG.shiftSeconds - this.line.elapsedMs / 1000)
      this.timeText.setText(remaining.toFixed(1) + 's left')
      this.goalText.setText(this.line.produced + ' / ' + CONFIG.targetGears + '  GEARS')
    }

    _end() {
      this.finished = true
      this.line.running = false
      const win = this.line.produced >= CONFIG.targetGears
      Synth.play(win ? 'win' : 'fail')

      const W = this.scale.width, H = this.scale.height
      const overlay = this.add.container(0, 0).setDepth(500)
      overlay.add(this.add.rectangle(0, 0, W, H, 0x000000, 0.78).setOrigin(0, 0))
      const panelW = Math.min(640, W - 60), panelH = 360, px = W / 2, py = H / 2
      overlay.add(this.add.rectangle(px, py, panelW, panelH, 0x111820, 0.98)
        .setStrokeStyle(2, win ? 0x6ae36a : 0xff7a4d))

      overlay.add(this.add.text(px, py - panelH / 2 + 30, win ? 'YOU FOUND IT' : 'NOT THE BOTTLENECK',
        { fontFamily: 'Impact, sans-serif', fontSize: '42px', color: win ? '#6ae36a' : '#ff7a4d' }).setOrigin(0.5, 0))

      overlay.add(this.add.text(px, py - panelH / 2 + 90,
        'Shipped ' + this.line.produced + ' / ' + CONFIG.targetGears + ' gears',
        { fontFamily: 'Consolas', fontSize: '20px', color: '#ffffff' }).setOrigin(0.5, 0))

      const msg = win
        ? 'You upgraded the slowest station. Everything downstream stopped waiting; the whole line sped up.\n\nThat\u2019s the whole lesson: a line moves at the speed of its bottleneck — so upgrades only pay off on the bottleneck.'
        : 'You upgraded a station that wasn\u2019t the bottleneck. The slow one is still the chokepoint, so throughput didn\u2019t change.\n\nThat\u2019s the lesson: upgrading a non-bottleneck buys you nothing. Find where items pile up.'
      overlay.add(this.add.text(px, py - 30, msg,
        { fontFamily: 'Segoe UI, sans-serif', fontSize: '15px', color: '#cbd1dc',
          wordWrap: { width: panelW - 60 }, align: 'center', lineSpacing: 4 }).setOrigin(0.5, 0))

      const btn = this.add.text(px, py + panelH / 2 - 50, '\u25B6  PLAY AGAIN  \u25C0', {
        fontFamily: 'Consolas, monospace', fontSize: '22px', color: '#0f1115',
        backgroundColor: '#f0c060', padding: { left: 24, right: 24, top: 12, bottom: 12 },
      }).setOrigin(0.5).setInteractive({ useHandCursor: true })
      btn.on('pointerover', () => btn.setStyle({ backgroundColor: '#ffd87a' }))
      btn.on('pointerout',  () => btn.setStyle({ backgroundColor: '#f0c060' }))
      btn.on('pointerdown', () => { Synth.play('click'); this.scene.restart() })
      overlay.add(btn)
      overlay.add(this.add.text(px, py + panelH / 2 - 14, '(or press R)',
        { fontFamily: 'Consolas', fontSize: '11px', color: '#6a7080' }).setOrigin(0.5))
    }
  }

  // ---------------- Boot ----------------
  window.addEventListener('load', () => {
    const loading = document.getElementById('loading'); if (loading) loading.remove()
    const game = new Phaser.Game({
      type: Phaser.CANVAS,
      parent: 'game',
      backgroundColor: '#0f1115',
      scale: { mode: Phaser.Scale.RESIZE, width: window.innerWidth, height: window.innerHeight },
      scene: [PlayScene],
      fps: { target: 60, forceSetTimeOut: true },
      disableContextMenu: true,
    })
    window.__factoriE = { game }
  })
})()
