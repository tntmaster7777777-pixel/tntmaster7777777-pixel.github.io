import Phaser from 'phaser'
import { LEVELS } from '../data/levels'
import type { LevelDef } from '../game/types'
import { TEX } from '../game/types'
import { ProductionLine } from '../sim/ProductionLine'
import { Synth } from '../audio/Synth'

const TILE = 48
const BELT_H = 48
const STATION_SIZE = 72

interface StationView {
  id: string
  container: Phaser.GameObjects.Container
  sprite: Phaser.GameObjects.Image
  label: Phaser.GameObjects.Text
  cycleText: Phaser.GameObjects.Text
  progress: Phaser.GameObjects.Rectangle
  glow: Phaser.GameObjects.Rectangle
  costTag: Phaser.GameObjects.Text
  index: number
}

interface BeltView {
  container: Phaser.GameObjects.Container
  slots: Phaser.GameObjects.Image[]
  x: number
  y: number
  length: number
}

export class FactoryScene extends Phaser.Scene {
  private line!: ProductionLine
  private level!: LevelDef
  private stationViews: StationView[] = []
  private beltViews: BeltView[] = []
  private budget = 0
  private paused = false
  private finished = false
  private sourceSprite!: Phaser.GameObjects.Image
  private sinkSprite!: Phaser.GameObjects.Image

  constructor() {
    super('Factory')
  }

  init(data: { levelId?: string }): void {
    const id = data.levelId ?? LEVELS[0].id
    const def = LEVELS.find((l) => l.id === id) ?? LEVELS[0]
    this.level = def
    this.line = new ProductionLine(def)
    this.budget = def.startingBudget
    this.paused = true
    this.finished = false
    this.stationViews = []
    this.beltViews = []
  }

  create(): void {
    this.cameras.main.setBackgroundColor('#1a1d22')
    this.drawFloor()
    this.layout()

    this.line.onItemSinked = () => Synth.play('produced')
    this.line.running = true

    this.scene.launch('UI', { scene: this })
    this.scene.bringToTop('UI')

    this.input.keyboard?.on('keydown-SPACE', () => this.togglePause())
    this.input.keyboard?.on('keydown-ESC', () => this.exitToMenu())

    this.time.delayedCall(400, () => {
      this.paused = false
      this.events.emit('paused-changed', this.paused)
    })
  }

  override update(_t: number, dtMs: number): void {
    if (this.paused || this.finished) return
    this.line.tick(dtMs)
    this.render()
    if (this.line.elapsedMs / 1000 >= this.level.shiftSeconds) this.endShift()
    else if (this.line.produced >= this.level.targetProduced) this.endShift()
  }

  // ---------- layout ----------

  private layout(): void {
    const { width, height } = this.scale
    const stationCount = this.level.stations.length
    const beltLen = this.level.beltSlotsBetween
    const totalWidth =
      STATION_SIZE + beltLen * TILE + stationCount * (STATION_SIZE + beltLen * TILE) + STATION_SIZE
    const startX = Math.max(40, (width - totalWidth) / 2)
    const lineY = height / 2

    this.sourceSprite = this.add
      .image(startX + STATION_SIZE / 2, lineY, TEX.source)
      .setDepth(2)
    this.add
      .text(startX + STATION_SIZE / 2, lineY + STATION_SIZE / 2 + 8, 'SOURCE', {
        fontFamily: 'Consolas',
        fontSize: '12px',
        color: '#b0b4bc',
      })
      .setOrigin(0.5, 0)
      .setDepth(2)

    let cursor = startX + STATION_SIZE

    for (let i = 0; i < this.line.belts.length; i++) {
      const belt = this.line.belts[i]
      const view = this.buildBelt(cursor, lineY, belt.length)
      this.beltViews.push(view)
      cursor += belt.length * TILE

      if (i < stationCount) {
        const stn = this.line.stations[i]
        const view2 = this.buildStation(
          cursor + STATION_SIZE / 2,
          lineY,
          i,
          stn.id,
          stn.label,
          stn.cycleMs,
        )
        this.stationViews.push(view2)
        cursor += STATION_SIZE
      }
    }

    this.sinkSprite = this.add.image(cursor + STATION_SIZE / 2, lineY, TEX.sink).setDepth(2)
    this.add
      .text(cursor + STATION_SIZE / 2, lineY + STATION_SIZE / 2 + 8, 'SINK', {
        fontFamily: 'Consolas',
        fontSize: '12px',
        color: '#b0b4bc',
      })
      .setOrigin(0.5, 0)
      .setDepth(2)
  }

  private drawFloor(): void {
    const { width, height } = this.scale
    const cols = Math.ceil(width / 32) + 2
    const rows = Math.ceil(height / 32) + 2
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        this.add.image(c * 32, r * 32, TEX.floor).setOrigin(0, 0).setDepth(0)
      }
    }
  }

  private buildBelt(x: number, y: number, length: number): BeltView {
    const slots: Phaser.GameObjects.Image[] = []
    for (let i = 0; i < length; i++) {
      this.add.image(x + i * TILE + TILE / 2, y, TEX.belt).setDepth(1)
      this.add
        .image(x + i * TILE + TILE / 2, y, TEX.beltArrow)
        .setDepth(1)
        .setAlpha(0.4)
      const itemSpr = this.add
        .image(x + i * TILE + TILE / 2, y, TEX.item)
        .setDepth(3)
        .setVisible(false)
      slots.push(itemSpr)
    }
    return { container: this.add.container(), slots, x, y, length }
  }

  private buildStation(
    x: number,
    y: number,
    index: number,
    id: string,
    label: string,
    cycleMs: number,
  ): StationView {
    const glow = this.add
      .rectangle(x, y, STATION_SIZE + 12, STATION_SIZE + 12, 0xffffff, 0.0)
      .setDepth(2)
    const sprite = this.add.image(x, y, TEX.station).setDepth(3).setInteractive({ useHandCursor: true })
    const labelText = this.add
      .text(x, y - STATION_SIZE / 2 - 18, label, {
        fontFamily: 'Consolas',
        fontSize: '13px',
        color: '#f0d080',
      })
      .setOrigin(0.5, 0.5)
      .setDepth(4)
    const cycleText = this.add
      .text(x, y + STATION_SIZE / 2 + 8, `${cycleMs}ms`, {
        fontFamily: 'Consolas',
        fontSize: '12px',
        color: '#b0b4bc',
      })
      .setOrigin(0.5, 0)
      .setDepth(4)
    const progress = this.add
      .rectangle(x - STATION_SIZE / 2, y + STATION_SIZE / 2 - 6, 0, 4, 0x6ae36a)
      .setOrigin(0, 0.5)
      .setDepth(4)
    const costTag = this.add
      .text(x, y - STATION_SIZE / 2 - 36, `-$${this.level.upgradeCost} upgrade`, {
        fontFamily: 'Consolas',
        fontSize: '11px',
        color: '#7aa7ff',
      })
      .setOrigin(0.5, 0.5)
      .setDepth(4)
      .setAlpha(0)

    sprite.on('pointerover', () => costTag.setAlpha(1))
    sprite.on('pointerout', () => costTag.setAlpha(0))
    sprite.on('pointerdown', () => this.tryUpgrade(id))

    return {
      id,
      container: this.add.container(),
      sprite,
      label: labelText,
      cycleText,
      progress,
      glow,
      costTag,
      index,
    }
  }

  // ---------- runtime ----------

  private render(): void {
    for (let i = 0; i < this.beltViews.length; i++) {
      const belt = this.line.belts[i]
      const view = this.beltViews[i]
      for (let s = 0; s < view.length; s++) {
        view.slots[s].setVisible(belt.slots[s])
      }
    }

    for (const view of this.stationViews) {
      const stn = this.line.stations[view.index]
      let tex: string = TEX.station
      let glowColor = 0x000000
      let glowAlpha = 0
      switch (stn.state) {
        case 'PROCESSING':
          tex = TEX.stationBusy
          glowColor = 0x6ae36a
          glowAlpha = 0.15
          break
        case 'STARVED':
          tex = TEX.stationStarved
          glowColor = 0x4db1ff
          glowAlpha = 0.25
          break
        case 'BLOCKED':
          tex = TEX.stationBlocked
          glowColor = 0xffa04d
          glowAlpha = 0.25
          break
        case 'IDLE':
          tex = TEX.station
          break
      }
      view.sprite.setTexture(tex)
      view.glow.setFillStyle(glowColor, glowAlpha)
      view.progress.width = stn.progressRatio() * STATION_SIZE
      view.cycleText.setText(`${stn.cycleMs}ms`)
    }
  }

  private tryUpgrade(stationId: string): void {
    if (this.paused || this.finished) return
    if (this.budget < this.level.upgradeCost) {
      Synth.play('fail')
      return
    }
    const ok = this.line.upgrade(stationId, this.level.upgradeMsDelta)
    if (!ok) {
      Synth.play('fail')
      return
    }
    this.budget -= this.level.upgradeCost
    Synth.play('upgrade')
    this.events.emit('budget-changed', this.budget)
  }

  togglePause(): void {
    if (this.finished) return
    this.paused = !this.paused
    this.events.emit('paused-changed', this.paused)
    Synth.play('click')
  }

  getBudget(): number {
    return this.budget
  }

  getLevel(): LevelDef {
    return this.level
  }

  getLine(): ProductionLine {
    return this.line
  }

  isPaused(): boolean {
    return this.paused
  }

  private endShift(): void {
    if (this.finished) return
    this.finished = true
    this.line.running = false
    const win = this.line.produced >= this.level.targetProduced
    Synth.play(win ? 'win' : 'fail')
    this.time.delayedCall(600, () => {
      this.scene.stop('UI')
      this.scene.start('Report', {
        levelId: this.level.id,
        stats: this.line.stats(),
        win,
      })
    })
  }

  private exitToMenu(): void {
    this.scene.stop('UI')
    this.scene.start('Menu')
  }
}
