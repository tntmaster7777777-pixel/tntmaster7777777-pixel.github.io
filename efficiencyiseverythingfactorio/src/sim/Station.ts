import type { StationState } from '../game/types'

let nextId = 0

/**
 * Two-slot model: `busy` means an input is being processed, `outputReady`
 * means a finished item is waiting to be drained downstream. Splitting these
 * prevents the flow system from accepting an input in the same tick that the
 * station finishes a cycle (which previously overwrote the new input and lost
 * it).
 */
export class Station {
  readonly id: string
  readonly label: string
  cycleMs: number

  state: StationState = 'STARVED'
  progressMs = 0
  busy = false
  outputReady = false
  processedCount = 0

  readonly stateTimes: Record<StationState, number> = {
    IDLE: 0,
    PROCESSING: 0,
    STARVED: 0,
    BLOCKED: 0,
  }

  onItemProduced?: () => void

  constructor(label: string, cycleMs: number) {
    this.id = `stn-${nextId++}`
    this.label = label
    this.cycleMs = cycleMs
  }

  tick(dtMs: number): boolean {
    if (this.busy) {
      this.progressMs += dtMs
      if (this.progressMs >= this.cycleMs) {
        this.progressMs = 0
        this.busy = false
        this.outputReady = true
        this.processedCount++
        this.onItemProduced?.()
      }
    }

    if (this.busy) this.state = 'PROCESSING'
    else if (this.outputReady) this.state = 'BLOCKED'
    else this.state = 'STARVED'

    this.stateTimes[this.state] += dtMs
    return this.outputReady
  }

  /** Begin a cycle. Caller guarantees an input has just been consumed from
   *  the upstream belt. Returns true if the station actually started. */
  tryStart(): boolean {
    if (this.busy || this.outputReady) return false
    this.busy = true
    this.progressMs = 0
    return true
  }

  /** Caller pushed the finished item downstream; clear the output slot. */
  tryDrainOutput(): boolean {
    if (!this.outputReady) return false
    this.outputReady = false
    return true
  }

  progressRatio(): number {
    return Math.min(1, this.progressMs / this.cycleMs)
  }
}
