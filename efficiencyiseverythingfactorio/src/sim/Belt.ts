/**
 * A belt is a fixed-length array of slots. Items are pushed into slot 0 and
 * slowly advance toward the last slot, where they can be pulled off. The belt
 * does not own the item visuals — the scene reads `slots` each tick to render.
 *
 * This is a deliberate simplification of Factorio belts: each slot is binary,
 * and items advance one slot every `stepMs`. That is enough to visualize
 * transport time as waste without a continuous-space physics simulation.
 */
export class Belt {
  readonly slots: boolean[]
  private accumMs = 0

  constructor(
    public readonly length: number,
    public readonly stepMs: number,
  ) {
    this.slots = new Array(length).fill(false)
  }

  /** Advance items one slot forward per `stepMs`. Items in the last slot are
   * held there until `takeLast()` is called. */
  tick(dtMs: number): void {
    this.accumMs += dtMs
    while (this.accumMs >= this.stepMs) {
      this.accumMs -= this.stepMs
      for (let i = this.slots.length - 1; i > 0; i--) {
        if (!this.slots[i] && this.slots[i - 1]) {
          this.slots[i] = true
          this.slots[i - 1] = false
        }
      }
    }
  }

  /** Try to push an item into slot 0. Returns true if accepted. */
  push(): boolean {
    if (this.slots[0]) return false
    this.slots[0] = true
    return true
  }

  hasLast(): boolean {
    return this.slots[this.slots.length - 1]
  }

  takeLast(): boolean {
    if (!this.hasLast()) return false
    this.slots[this.slots.length - 1] = false
    return true
  }

  fillRatio(): number {
    let count = 0
    for (const s of this.slots) if (s) count++
    return count / this.slots.length
  }
}
