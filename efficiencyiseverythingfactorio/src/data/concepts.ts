import type { Concept, ConceptId } from '../game/types'

export const CONCEPTS: Record<ConceptId, Concept> = {
  'process-flow': {
    id: 'process-flow',
    title: 'Process Flow',
    blurb:
      'Every product moves through a sequence of steps. Some add value, most do not. Reducing the time it takes to complete anything starts with seeing those non-value-added steps.',
    factorioFraming:
      'Watch your items travel belt → station → belt → station. Time on the belt is transport waste. Time sitting in a buffer is inventory waste. Only time inside a processing station is value-added.',
    source: 'efficiencyiseverything.com/time',
  },
  bottleneck: {
    id: 'bottleneck',
    title: 'The Bottleneck',
    blurb:
      'A chain moves at the speed of its slowest link. Speeding up any non-bottleneck station does nothing for total throughput — only the bottleneck matters.',
    factorioFraming:
      'The station with items piling up in front of it is your bottleneck. Upgrade THAT one. Upgrading a station that is already starved is spending money for zero throughput gain.',
    source: 'Theory of Constraints — Goldratt',
  },
  'seven-wastes': {
    id: 'seven-wastes',
    title: '7 Forms of Waste (TIMWOOD)',
    blurb:
      'Transportation, Inventory, Motion, Waiting, Over-production, Over-processing, Defects. Every industrial process leaks throughput into one of these buckets.',
    factorioFraming:
      'Your HUD colors each lost second by waste type. Red bars = Waiting. Amber bars = Blocked (Over-production). The goal is to shrink both.',
    source: 'Lean / Toyota Production System',
  },
  waiting: {
    id: 'waiting',
    title: 'Waiting (Starvation)',
    blurb:
      'A station with nothing to do is a pure loss. Waiting is the easiest waste to see and the easiest to fix — feed the station.',
    factorioFraming:
      'When a station glows blue, it is STARVED — the belt upstream is empty. Speed up upstream, or shorten the transport path.',
    source: 'efficiencyiseverything.com/time',
  },
  overproduction: {
    id: 'overproduction',
    title: 'Over-production (Blocking)',
    blurb:
      'Making more than the next step can accept piles up work-in-process inventory. That inventory hides problems and wastes space.',
    factorioFraming:
      'When a station glows orange, it is BLOCKED — its output belt is full. Slowing upstream or speeding downstream both fix it; one is cheaper.',
    source: 'Lean / TPS',
  },
  pareto: {
    id: 'pareto',
    title: 'Pareto Principle (80/20)',
    blurb:
      'Roughly 80% of losses come from 20% of causes. Rank your stations by waste contribution and attack the top bar first.',
    factorioFraming:
      'The Pareto chart in the bottom-right ranks every station by time lost to waste. Fix the tallest bar; ignore the short ones.',
    source: 'efficiencyiseverything.com/time',
  },
  'poka-yoke': {
    id: 'poka-yoke',
    title: 'Poka-Yoke (Error-Proofing)',
    blurb:
      'Design the process so the wrong action is impossible — not merely discouraged. A shower valve that cannot scald is a poka-yoke.',
    factorioFraming:
      'Future levels add defect sources. Guards on stations will make it impossible to pass a bad item downstream rather than catching it at the sink.',
    source: 'efficiencyiseverything.com/time',
  },
  checklist: {
    id: 'checklist',
    title: 'Checklists',
    blurb:
      'A process is only repeatable if the operator cannot forget a step. A simple checklist outperforms memory under stress.',
    factorioFraming:
      'Each shift briefing is your checklist: target, budget, concept in play. Do not skip the briefing.',
    source: 'efficiencyiseverything.com/time',
  },
}
