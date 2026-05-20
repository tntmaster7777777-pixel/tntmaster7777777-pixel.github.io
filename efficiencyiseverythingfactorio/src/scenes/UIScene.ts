import Phaser from 'phaser'
import type { FactoryScene } from './FactoryScene'
import type { LineStats } from '../game/types'
import { CONCEPTS } from '../data/concepts'
import { Synth } from '../audio/Synth'

/**
 * Overlay scene: runs on top of FactoryScene, reads state from it each frame,
 * and renders the HUD, tutorial callouts, Pareto chart, and glossary.
 */
export class UIScene extends Phaser.Scene {
  private factory!: FactoryScene
  private hudText!: Phaser.GameObjects.Text
  private briefingText!: Phaser.GameObjects.Text
  private calloutText!: Phaser.GameObjects.Text
  private pausedBanner!: Phaser.GameObjects.Text
  private paretoG!: Phaser.GameObjects.Graphics
  private paretoLabels: Phaser.GameObjects.Text[] = []
  private glossary?: Phaser.GameObjects.Container
  private lastCalloutMs = 0
  private currentCallout = ''

  constructor() {
    super('UI')
  }

  init(data: { scene: FactoryScene }): void {
    this.factory = data.scene
  }

  create(): void {
    this.buildHud()
    this.buildBriefing()
    this.buildPareto()
    this.buildCallout()
    this.buildPausedBanner()
    this.buildControlsHint()

    this.factory.events.on('paused-changed', (p: boolean) =>
      this.pausedBanner.setVisible(p),
    )

    this.input.keyboard?.on('keydown-TAB', (e: KeyboardEvent) => {
      e.preventDefault()
      this.toggleGlossary()
    })

    this.scale.on('resize', () => this.layout())
    this.layout()
  }

  override update(_t: number, _dt: number): void {
    this.renderHud()
    this.renderPareto()
    this.updateCallout()
  }

  // ---------- HUD ----------

  private buildHud(): void {
    this.hudText = this.add
      .text(20, 20, '', {
        fontFamily: 'Consolas, monospace',
        fontSize: '14px',
        color: '#e8e8e8',
        backgroundColor: '#0e1014cc',
        padding: { left: 12, right: 12, top: 8, bottom: 8 },
      })
      .setDepth(100)
      .setScrollFactor(0)
  }

  private buildBriefing(): void {
    const lv = this.factory.getLevel()
    this.briefingText = this.add
      .text(
        20,
        0,
        [
          `▣ ${lv.title}`,
          `Teaches: ${lv.teaches.map((t) => CONCEPTS[t].title).join(' · ')}`,
          '',
          lv.intro,
        ].join('\n'),
        {
          fontFamily: 'Segoe UI, sans-serif',
          fontSize: '13px',
          color: '#cbd1dc',
          backgroundColor: '#0e1014cc',
          wordWrap: { width: 420 },
          padding: { left: 12, right: 12, top: 10, bottom: 10 },
        },
      )
      .setDepth(100)
  }

  private buildPareto(): void {
    this.paretoG = this.add.graphics().setDepth(100)
  }

  private buildCallout(): void {
    this.calloutText = this.add
      .text(0, 0, '', {
        fontFamily: 'Segoe UI, sans-serif',
        fontSize: '14px',
        color: '#ffd87a',
        backgroundColor: '#20170acc',
        padding: { left: 14, right: 14, top: 10, bottom: 10 },
        wordWrap: { width: 380 },
      })
      .setDepth(100)
      .setAlpha(0)
  }

  private buildPausedBanner(): void {
    this.pausedBanner = this.add
      .text(0, 0, 'PAUSED — press SPACE to resume · click a station to upgrade', {
        fontFamily: 'Consolas, monospace',
        fontSize: '18px',
        color: '#ffd87a',
        backgroundColor: '#20170acc',
        padding: { left: 18, right: 18, top: 10, bottom: 10 },
      })
      .setOrigin(0.5)
      .setDepth(101)
      .setVisible(this.factory.isPaused())
  }

  private buildControlsHint(): void {
    this.add
      .text(20, 0, 'SPACE pause · click station to upgrade · TAB concepts · ESC menu', {
        fontFamily: 'Consolas, monospace',
        fontSize: '11px',
        color: '#6a7080',
      })
      .setDepth(100)
      .setName('controlsHint')
  }

  private layout(): void {
    const { width, height } = this.scale
    this.briefingText.setPosition(20, 20)
    this.hudText.setPosition(width - 260, 20)
    this.pausedBanner.setPosition(width / 2, height / 2 - 220)
    this.calloutText.setPosition(width / 2 - 190, height - 140)
    const hint = this.children.getByName('controlsHint') as
      | Phaser.GameObjects.Text
      | undefined
    if (hint) hint.setPosition(20, height - 22)
  }

  // ---------- render ----------

  private renderHud(): void {
    const line = this.factory.getLine()
    const lv = this.factory.getLevel()
    const stats = line.stats()
    const remaining = Math.max(0, lv.shiftSeconds - stats.elapsedMs / 1000)
    const pct = Math.round(stats.wastePct * 100)
    const tp = stats.throughputPerMin.toFixed(1)
    const bottleneck =
      stats.stations.find((s) => s.id === stats.bottleneckId)?.label ?? '—'
    this.hudText.setText(
      [
        `TIME     ${remaining.toFixed(1)}s`,
        `PRODUCED ${stats.produced} / ${lv.targetProduced}`,
        `THROUGHPUT ${tp}/min`,
        `BUDGET   $${this.factory.getBudget()}`,
        `BOTTLE-  ${bottleneck}`,
        `WASTE    ${pct}%`,
      ].join('\n'),
    )
  }

  private renderPareto(): void {
    const line = this.factory.getLine()
    const stats = line.stats()
    const entries = stats.stations
      .map((s) => ({
        id: s.id,
        label: s.label,
        waste: s.stateTimes.STARVED + s.stateTimes.BLOCKED + s.stateTimes.IDLE,
      }))
      .sort((a, b) => b.waste - a.waste)

    const { width, height } = this.scale
    const panelW = 320
    const panelH = 200
    const x = width - panelW - 20
    const y = height - panelH - 20

    this.paretoG.clear()
    this.paretoG.fillStyle(0x0e1014, 0.8)
    this.paretoG.fillRect(x, y, panelW, panelH)
    this.paretoG.lineStyle(1, 0x3a3f48, 1)
    this.paretoG.strokeRect(x, y, panelW, panelH)

    for (const t of this.paretoLabels) t.destroy()
    this.paretoLabels = []

    const header = this.add
      .text(x + 10, y + 8, 'PARETO — waste time by station', {
        fontFamily: 'Consolas',
        fontSize: '12px',
        color: '#ffd87a',
      })
      .setDepth(101)
    this.paretoLabels.push(header)

    const max = Math.max(...entries.map((e) => e.waste), 1)
    const barAreaTop = y + 32
    const barAreaH = panelH - 48
    const barW = (panelW - 30) / Math.max(1, entries.length)

    entries.forEach((e, i) => {
      const h = (e.waste / max) * barAreaH
      const bx = x + 15 + i * barW
      const by = barAreaTop + (barAreaH - h)
      this.paretoG.fillStyle(i === 0 ? 0xff7a4d : 0x4a7ab0, 1)
      this.paretoG.fillRect(bx, by, barW - 6, h)
      const lbl = this.add
        .text(bx + (barW - 6) / 2, barAreaTop + barAreaH + 2, e.label, {
          fontFamily: 'Consolas',
          fontSize: '10px',
          color: '#b0b4bc',
        })
        .setOrigin(0.5, 0)
        .setDepth(101)
      this.paretoLabels.push(lbl)
    })

    // Cumulative line (the classic Pareto 80% line).
    const total = entries.reduce((a, b) => a + b.waste, 0) || 1
    let cum = 0
    this.paretoG.lineStyle(2, 0xffd87a, 0.9)
    this.paretoG.beginPath()
    entries.forEach((e, i) => {
      cum += e.waste
      const px = x + 15 + i * barW + (barW - 6) / 2
      const py = barAreaTop + barAreaH - (cum / total) * barAreaH
      if (i === 0) this.paretoG.moveTo(px, py)
      else this.paretoG.lineTo(px, py)
    })
    this.paretoG.strokePath()
  }

  // ---------- callouts ----------

  /**
   * Teach concepts reactively. Every ~3.5s the scene inspects the current
   * metrics and raises a single context-appropriate callout. Rate-limited
   * so players are not spammed.
   */
  private updateCallout(): void {
    const now = this.time.now
    if (now - this.lastCalloutMs < 3500) return
    const line = this.factory.getLine()
    if (!line.running && !this.factory.isPaused()) return
    const stats = line.stats()
    if (stats.elapsedMs < 1500) return

    const msg = this.pickCallout(stats)
    if (!msg || msg === this.currentCallout) return
    this.currentCallout = msg
    this.lastCalloutMs = now
    this.calloutText.setText(msg)
    this.tweens.killTweensOf(this.calloutText)
    this.calloutText.setAlpha(0)
    this.tweens.add({ targets: this.calloutText, alpha: 1, duration: 250 })
    this.tweens.add({
      targets: this.calloutText,
      alpha: 0,
      delay: 3200,
      duration: 400,
    })
    Synth.play('tick')
  }

  private pickCallout(stats: LineStats): string | null {
    const mostBlocked = [...stats.stations].sort(
      (a, b) => b.stateTimes.BLOCKED - a.stateTimes.BLOCKED,
    )[0]
    const mostStarved = [...stats.stations].sort(
      (a, b) => b.stateTimes.STARVED - a.stateTimes.STARVED,
    )[0]
    const bottleneck = stats.stations.find((s) => s.id === stats.bottleneckId)

    if (stats.wastePct > 0.4 && bottleneck) {
      return `▣ BOTTLENECK: "${bottleneck.label}" runs near 100% utilization while others wait. Upgrading non-bottlenecks buys nothing — fix this one.`
    }
    if (mostStarved && mostStarved.stateTimes.STARVED > 2500) {
      return `▣ WAITING waste at "${mostStarved.label}": belt upstream is empty. Speed up the upstream station or shorten the belt.`
    }
    if (mostBlocked && mostBlocked.stateTimes.BLOCKED > 2500) {
      return `▣ OVER-PRODUCTION at "${mostBlocked.label}": its output has nowhere to go. Upstream is faster than it needs to be.`
    }
    if (stats.wastePct < 0.15 && stats.produced > 5) {
      return `▣ Line is well-balanced. Waste below 15% — ship it.`
    }
    return null
  }

  // ---------- glossary ----------

  private toggleGlossary(): void {
    if (this.glossary) {
      this.glossary.destroy()
      this.glossary = undefined
      return
    }
    const { width, height } = this.scale
    const c = this.add.container(0, 0).setDepth(200)
    const bg = this.add
      .rectangle(width / 2, height / 2, Math.min(720, width - 40), height - 80, 0x0e1014, 0.95)
      .setStrokeStyle(1, 0x3a3f48)
    c.add(bg)
    const title = this.add
      .text(width / 2, 60, 'CONCEPTS (TAB to close)', {
        fontFamily: 'Consolas',
        fontSize: '18px',
        color: '#ffd87a',
      })
      .setOrigin(0.5, 0)
    c.add(title)
    let y = 100
    for (const concept of Object.values(CONCEPTS)) {
      const t = this.add
        .text(
          60,
          y,
          `▣ ${concept.title}\n   ${concept.blurb}\n   → ${concept.factorioFraming}`,
          {
            fontFamily: 'Segoe UI',
            fontSize: '12px',
            color: '#cbd1dc',
            wordWrap: { width: Math.min(680, width - 80) },
          },
        )
        .setDepth(201)
      c.add(t)
      y += t.height + 14
    }
    this.glossary = c
  }
}
