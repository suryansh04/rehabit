import { useEffect, useReducer, useRef } from 'react'
import { average } from '../../shared/stats'
import type { Hand, ModeId, SessionResult } from '../../shared/types'
import { MISS_CUE_GAP_MS, type ClipId, type Cue } from '../coach'

export const START_DELAY_MS = 1200
export const END_DELAY_MS = 1500

// Game state lives in a ref so timers and tap handlers never read a stale copy.
// bump() re-renders after a change.
export function useGameKit<T extends object>(initial: () => T) {
  const state = useRef<T | null>(null)
  if (state.current === null) state.current = initial()
  const [, bump] = useReducer((n: number) => n + 1, 0)
  const timers = useRef(new Set<number>())
  const cue = useRef<Cue | null>(null)
  const lastMissCue = useRef(0)

  useEffect(() => {
    const pending = timers.current
    return () => {
      pending.forEach((id) => window.clearTimeout(id))
      pending.clear()
    }
  }, [])

  const later = (fn: () => void, ms: number) => {
    const id = window.setTimeout(() => {
      timers.current.delete(id)
      fn()
    }, ms)
    timers.current.add(id)
  }

  const say = (clip: ClipId) => {
    // a run of misses should not turn into a lecture
    if (clip === 'miss') {
      if (performance.now() - lastMissCue.current < MISS_CUE_GAP_MS) return
      lastMissCue.current = performance.now()
    }
    cue.current = { clip, n: (cue.current?.n ?? 0) + 1 }
  }

  return { g: state.current, bump, later, say, cue: cue.current }
}

export function pickPad(pads: number[], previous: number | null) {
  const options = pads.filter((p) => p !== previous)
  return options[Math.floor(Math.random() * options.length)]
}

type Tally = { mode: ModeId; hand: Hand; startedAt: number; presses: number; good: number; misses: number; reactions: number[]; score: number }

export function buildResult({ mode, hand, startedAt, presses, good, misses, reactions, score }: Tally): SessionResult {
  const attempts = good + misses
  return {
    mode,
    hand,
    duration_s: Math.round((performance.now() - startedAt) / 100) / 10,
    taps: presses,
    correct: good,
    avg_reaction_ms: Math.round(average(reactions)),
    accuracy: attempts ? Math.round((good / attempts) * 1000) / 10 : 0,
    score,
  }
}
