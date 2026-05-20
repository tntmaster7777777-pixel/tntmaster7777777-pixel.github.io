import Phaser from 'phaser'
import type { LineStats } from '../game/types'
import { LEVELS } from '../data/levels'
import { CONCEPTS } from '../data/concepts'
import { Synth } from '../audio/Synth'

export class ReportScene extends Phaser.Scene {
  private stats!: LineStats
  private levelId!: string
  private win!: boolean

  constructor() {
    super('Report')
  }

  init(data: { levelId: string; stats: LineStats; win: boolean }): void {
    this.stats = data.stats
    this.levelId = data.levelId
    this.win = data.win
  }

  create(): void {
    const { width, height } = this.scale
    const cx = width / 2
    const lv = LEVELS.find((l) => l.id === this.levelId)!

    this.add
      .text(cx, 60, this.win ? 'SHIFT COMPLETE' : 'SHIFT FELL SHORT', {
        fontFamily: 'Impact',
        fontSize: '48px',
        color: this.win ? '#6ae36a' : '#ff7a4d',
      })
      .setOrigin(0.5)

    this.add
      .text(cx, 120, lv.title, {
        fontFamily: 'Segoe UI',
        fontSize: '18px',
        color: '#cbd1dc',
      })
      .setOrigin(0.5)

    const lines = [
      `PRODUCED:   ${this.stats.produced} / ${this.stats.target}`,
      `THROUGHPUT: ${this.stats.throughputPerMin.toFixed(1)} / min`,
      `WASTE:      ${Math.round(this.stats.wastePct * 100)}% of station-time lost to waiting + blocking`,
      '',
      `WHAT HAPPENED ON YOUR LINE:`,
      ...this.stats.stations.map((s) => {
        const total =
          s.stateTimes.PROCESSING +
          s.stateTimes.STARVED +
          s.stateTimes.BLOCKED +
          s.stateTimes.IDLE || 1
        const util = Math.round((s.stateTimes.PROCESSING / total) * 100)
        const star = Math.round((s.stateTimes.STARVED / total) * 100)
        const blk = Math.round((s.stateTimes.BLOCKED / total) * 100)
        return `   ${s.label.padEnd(10)} util ${String(util).padStart(3)}%  waiting ${String(star).padStart(3)}%  blocked ${String(blk).padStart(3)}%`
      }),
    ].join('\n')

    this.add
      .text(cx, 170, lines, {
        fontFamily: 'Consolas',
        fontSize: '14px',
        color: '#e8e8e8',
        align: 'left',
      })
      .setOrigin(0.5, 0)

    const takeaway = this.pickTakeaway(lv.teaches)
    this.add
      .text(cx, height - 200, `LESSON\n${takeaway}`, {
        fontFamily: 'Segoe UI',
        fontSize: '14px',
        color: '#ffd87a',
        align: 'center',
        wordWrap: { width: Math.min(720, width - 80) },
      })
      .setOrigin(0.5)

    const retry = this.mkBtn(cx - 140, height - 80, 'RETRY SHIFT', () => {
      Synth.play('click')
      this.scene.start('Factory', { levelId: this.levelId })
    })
    const menu = this.mkBtn(cx + 140, height - 80, 'MENU', () => {
      Synth.play('click')
      this.scene.start('Menu')
    })
    retry.setOrigin(0.5)
    menu.setOrigin(0.5)
  }

  private pickTakeaway(teaches: string[]): string {
    const first = teaches[0] as keyof typeof CONCEPTS
    const c = CONCEPTS[first]
    if (!c) return 'Every second a station is not processing is money on the floor.'
    return `${c.title}: ${c.blurb}`
  }

  private mkBtn(x: number, y: number, label: string, cb: () => void): Phaser.GameObjects.Text {
    const t = this.add
      .text(x, y, label, {
        fontFamily: 'Consolas',
        fontSize: '18px',
        color: '#e8e8e8',
        backgroundColor: '#2a3440',
        padding: { left: 20, right: 20, top: 8, bottom: 8 },
      })
      .setInteractive({ useHandCursor: true })
    t.on('pointerover', () => t.setStyle({ color: '#f0c060' }))
    t.on('pointerout', () => t.setStyle({ color: '#e8e8e8' }))
    t.on('pointerdown', cb)
    return t
  }
}
