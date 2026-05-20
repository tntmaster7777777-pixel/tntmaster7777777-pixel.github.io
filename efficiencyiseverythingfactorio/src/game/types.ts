export type StationState = 'IDLE' | 'PROCESSING' | 'STARVED' | 'BLOCKED'

export const WASTE_STATES: StationState[] = ['IDLE', 'STARVED', 'BLOCKED']

export interface StationStats {
  id: string
  label: string
  cycleMs: number
  stateTimes: Record<StationState, number>
  processedCount: number
}

export interface LineStats {
  elapsedMs: number
  produced: number
  target: number
  throughputPerMin: number
  bottleneckId: string | null
  wastePct: number
  stations: StationStats[]
}

export interface LevelDef {
  id: string
  title: string
  teaches: ConceptId[]
  targetProduced: number
  shiftSeconds: number
  startingBudget: number
  upgradeCost: number
  upgradeMsDelta: number
  intro: string
  stations: { label: string; cycleMs: number }[]
  beltSlotsBetween: number
  sourceIntervalMs: number
}

export type ConceptId =
  | 'process-flow'
  | 'bottleneck'
  | 'seven-wastes'
  | 'waiting'
  | 'overproduction'
  | 'pareto'
  | 'poka-yoke'
  | 'checklist'

export interface Concept {
  id: ConceptId
  title: string
  blurb: string
  factorioFraming: string
  source: string
}

export const TEX = {
  belt: 'tex-belt',
  beltArrow: 'tex-belt-arrow',
  station: 'tex-station',
  stationBusy: 'tex-station-busy',
  stationStarved: 'tex-station-starved',
  stationBlocked: 'tex-station-blocked',
  source: 'tex-source',
  sink: 'tex-sink',
  item: 'tex-item',
  floor: 'tex-floor',
  pixel: 'tex-pixel',
} as const

export const SFX = {
  click: 'sfx-click',
  upgrade: 'sfx-upgrade',
  produced: 'sfx-produced',
  win: 'sfx-win',
  fail: 'sfx-fail',
  tick: 'sfx-tick',
} as const
