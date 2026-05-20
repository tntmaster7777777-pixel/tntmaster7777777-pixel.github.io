import type { LevelDef } from '../game/types'

export const LEVELS: LevelDef[] = [
  {
    id: 'L1-bottleneck',
    title: 'Shift 1 — Find the Bottleneck',
    teaches: ['process-flow', 'bottleneck'],
    intro:
      'Three stations. One iron plate becomes a gear. One station is far slower than the others — find it, upgrade it. Do not waste money upgrading the wrong one.',
    targetProduced: 20,
    shiftSeconds: 60,
    startingBudget: 9,
    upgradeCost: 3,
    upgradeMsDelta: 400,
    sourceIntervalMs: 900,
    beltSlotsBetween: 4,
    stations: [
      { label: 'Cutter', cycleMs: 900 },
      { label: 'Stamper', cycleMs: 1800 },
      { label: 'Assembler', cycleMs: 1000 },
    ],
  },
  {
    id: 'L2-waiting-vs-blocking',
    title: 'Shift 2 — Waiting vs. Over-production',
    teaches: ['seven-wastes', 'waiting', 'overproduction'],
    intro:
      'Blue glow = starved (waiting). Orange glow = blocked (over-production). Both are waste. Balance the line — the fastest stations are not always the best.',
    targetProduced: 25,
    shiftSeconds: 70,
    startingBudget: 12,
    upgradeCost: 3,
    upgradeMsDelta: 350,
    sourceIntervalMs: 700,
    beltSlotsBetween: 5,
    stations: [
      { label: 'Cutter', cycleMs: 700 },
      { label: 'Stamper', cycleMs: 1400 },
      { label: 'Polisher', cycleMs: 900 },
      { label: 'Assembler', cycleMs: 1500 },
    ],
  },
  {
    id: 'L3-pareto',
    title: 'Shift 3 — Pareto the Line',
    teaches: ['pareto', 'bottleneck'],
    intro:
      'Five stations, limited budget. The Pareto chart ranks stations by time lost to waste. Attack the tallest bar first and stop when diminishing returns kick in.',
    targetProduced: 30,
    shiftSeconds: 75,
    startingBudget: 12,
    upgradeCost: 3,
    upgradeMsDelta: 300,
    sourceIntervalMs: 600,
    beltSlotsBetween: 3,
    stations: [
      { label: 'Cutter', cycleMs: 700 },
      { label: 'Stamper', cycleMs: 1100 },
      { label: 'Polisher', cycleMs: 900 },
      { label: 'Welder', cycleMs: 1600 },
      { label: 'Assembler', cycleMs: 1000 },
    ],
  },
]
