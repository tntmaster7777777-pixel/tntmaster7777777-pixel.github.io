import Phaser from 'phaser'
import { LEVELS } from '../data/levels'
import { Synth } from '../audio/Synth'

export class MenuScene extends Phaser.Scene {
  constructor() {
    super('Menu')
  }

  create(): void {
    const { width, height } = this.scale
    const cx = width / 2

    this.add
      .text(cx, height * 0.18, 'FACTORI-E', {
        fontFamily: 'Impact, sans-serif',
        fontSize: '72px',
        color: '#f0c060',
      })
      .setOrigin(0.5)

    this.add
      .text(cx, height * 0.26, 'Efficiency Is Everything', {
        fontFamily: 'Segoe UI, sans-serif',
        fontSize: '22px',
        color: '#d0d4dc',
      })
      .setOrigin(0.5)

    this.add
      .text(
        cx,
        height * 0.33,
        'Find the bottleneck. Kill the waste. Ship the gears.',
        {
          fontFamily: 'Segoe UI, sans-serif',
          fontSize: '16px',
          color: '#9aa0aa',
          fontStyle: 'italic',
        },
      )
      .setOrigin(0.5)

    LEVELS.forEach((lv, i) => {
      const y = height * 0.48 + i * 70
      const btn = this.add
        .text(cx, y, `▶  ${lv.title}`, {
          fontFamily: 'Consolas, monospace',
          fontSize: '22px',
          color: '#e8e8e8',
          backgroundColor: '#2a3440',
          padding: { left: 20, right: 20, top: 10, bottom: 10 },
        })
        .setOrigin(0.5)
        .setInteractive({ useHandCursor: true })

      btn.on('pointerover', () => btn.setStyle({ color: '#f0c060' }))
      btn.on('pointerout', () => btn.setStyle({ color: '#e8e8e8' }))
      btn.on('pointerdown', () => {
        Synth.unlock()
        Synth.play('click')
        this.scene.start('Factory', { levelId: lv.id })
      })
    })

    this.add
      .text(
        cx,
        height - 40,
        'SPACE pause · click a station to upgrade · TAB concepts · teaches concepts from efficiencyiseverything.com/time',
        {
          fontFamily: 'Consolas, monospace',
          fontSize: '12px',
          color: '#6a7080',
        },
      )
      .setOrigin(0.5)
  }
}
