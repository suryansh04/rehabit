import { ALL_PADS, ENDURANCE_SECONDS, FINGER_PADS, TAPS_PER_GAME } from '../../shared/config'
import type { Flash } from '../../shared/HandBoard'
import type { ModeId, SessionResult } from '../../shared/types'
import type { Cue } from '../coach'

export type Mode = {
  name: string
  blurb: string
  hint: string
  kind: 'taps' | 'timed' | 'sequence'
  pads: number[]
}

export const MODES: Record<ModeId, Mode> = {
  classic: { name: 'Classic', blurb: 'Tap the coin that glows', hint: `${TAPS_PER_GAME} taps · about 2 minutes`, kind: 'taps', pads: ALL_PADS },
  finger: { name: 'Finger isolation', blurb: 'Fingertips only, no palm', hint: `${TAPS_PER_GAME} taps · fingertips only`, kind: 'taps', pads: FINGER_PADS },
  memory: { name: 'Memory', blurb: 'Repeat the glowing order', hint: 'Watch, then repeat the order', kind: 'sequence', pads: ALL_PADS },
  endurance: { name: 'Endurance', blurb: `Most taps in ${ENDURANCE_SECONDS} seconds`, hint: `${ENDURANCE_SECONDS} seconds · as many as you can`, kind: 'timed', pads: ALL_PADS },
}

export const MODE_ORDER: ModeId[] = ['classic', 'finger', 'memory', 'endurance']

// since: a clock is running from this moment, so the tile counts up live in ms
export type StatView = { label: string; value: string | number; unit?: string; since?: number }

// What every game hands to the shared game screen.
export type GameModel = {
  live: number | null
  flash: Flash | null
  ring: { lit: number; total: number }
  counter: { label: string; value: number; total?: number }
  stats: [StatView, StatView, StatView]
  cue: Cue | null
}

export type FinishHandler = (result: SessionResult) => void
