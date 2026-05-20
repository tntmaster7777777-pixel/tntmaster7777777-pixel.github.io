import { Belt } from './Belt'
import { Station } from './Station'
import type { LevelDef, LineStats, StationStats } from '../game/types'
import { WASTE_STATES } from '../game/types'

export class ProductionLine {
  readonly stations: Station[] = []
  readonly belts: Belt[] = []
  readonly level: LevelDef

  elapsedMs = 0
  produced = 0
  sourceAccum = 0
  running = false

  onItemSinked?: () => void

  constructor(level: LevelDef) {
    this.level = level
    for (const s of level.stations) {
      this.stations.push(new Station(s.label, s.cycleMs))
    }
    // N stations means N+1 belts: source→s0, s0→s1, …, sN-1→sink.
    for (let i = 0; i <= this.stations.length; i++) {
      this.belts.push(new Belt(level.beltSlotsBetween, 180))
    }
  }

  tick(dtMs: number): void {
    if (!this.running) return
    this.elapsedMs += dtMs

    // 1. Source emits onto belts[0] at a fixed interval.
    this.sourceAccum += dtMs
    while (this.sourceAccum >= this.level.sourceIntervalMs) {
      this.sourceAccum -= this.level.sourceIntervalMs
      this.belts[0].push()
    }

    // 2. All belts advance.
    for (const b of this.belts) b.tick(dtMs)

    // 3. Pull items from belts into stations, and push station output onto
    //    downstream belts. Do this station-by-station so backpressure forms
    //    naturally.
    for (let i = 0; i < this.stations.length; i++) {
      const stn = this.stations[i]
      const inBelt = this.belts[i]
      const outBelt = this.belts[i + 1]

      if (stn.outputReady && !outBelt.slots[0]) {
        outBelt.push()
        stn.tryDrainOutput()
      }
      if (!stn.busy && !stn.outputReady && inBelt.hasLast()) {
        inBelt.takeLast()
        stn.tryStart()
      }
    }

    // 4. Stations process.
    for (const stn of this.stations) stn.tick(dtMs)

    // 5. Sink drains the final belt.
    const finalBelt = this.belts[this.belts.length - 1]
    if (finalBelt.takeLast()) {
      this.produced++
      this.onItemSinked?.()
    }
  }

  stats(): LineStats {
    const stationStats: StationStats[] = this.stations.map((s) => ({
      id: s.id,
      label: s.label,
      cycleMs: s.cycleMs,
      stateTimes: { ...s.stateTimes },
      processedCount: s.processedCount,
    }))

    let totalWaste = 0
    let totalTime = 0
    for (const s of stationStats) {
      for (const k of Object.keys(s.stateTimes) as Array<keyof typeof s.stateTimes>) {
        totalTime += s.stateTimes[k]
        if (WASTE_STATES.includes(k)) totalWaste += s.stateTimes[k]
      }
    }

    const throughputPerMin =
      this.elapsedMs > 0 ? (this.produced / this.elapsedMs) * 60000 : 0

    return {
      elapsedMs: this.elapsedMs,
      produced: this.produced,
      target: this.level.targetProduced,
      throughputPerMin,
      bottleneckId: this.findBottleneck(stationStats),
      wastePct: totalTime > 0 ? totalWaste / totalTime : 0,
      stations: stationStats,
    }
  }

  /** Bottleneck = station spending the largest share of time PROCESSING
   * (equivalently: highest utilization). In a balanced line every station is
   * ~equal; in an unbalanced line the bottleneck stands out. */
  private findBottleneck(stations: StationStats[]): string | null {
    let bestId: string | null = null
    let bestPct = -1
    for (const s of stations) {
      const total =
        s.stateTimes.IDLE +
        s.stateTimes.PROCESSING +
        s.stateTimes.STARVED +
        s.stateTimes.BLOCKED
      if (total <= 0) continue
      const pct = s.stateTimes.PROCESSING / total
      if (pct > bestPct) {
        bestPct = pct
        bestId = s.id
      }
    }
    return bestId
  }

  upgrade(stationId: string, msDelta: number): boolean {
    const s = this.stations.find((x) => x.id === stationId)
    if (!s) return false
    const floor = 250
    const next = Math.max(floor, s.cycleMs - msDelta)
    if (next === s.cycleMs) return false
    s.cycleMs = next
    return true
  }
}
