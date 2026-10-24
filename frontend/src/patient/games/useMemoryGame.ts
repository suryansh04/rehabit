import { useEffect } from 'react'
import { FEEDBACK_MS, MEMORY_MAX_MISTAKES, MEMORY_START_LENGTH, MEMORY_STEP_MS } from '../../shared/config'
import type { Flash } from '../../shared/HandBoard'
import { useDeviceEvents } from '../../shared/device'
import type { Hand } from '../../shared/types'
import { playHitSound } from '../tapSound'
import { MODES, type FinishHandler, type GameModel } from './modes'
import { buildResult, END_DELAY_MS, pickPad, START_DELAY_MS, useGameKit } from './useGameKit'

const STEP_GAP_MS = 200
const NEXT_ROUND_MS = 900

type State = {
  sequence: number[]
  showing: boolean
  live: number | null
  flash: Flash | null
  step: number
  mistakes: number
  best: number
  good: number
  presses: number
  reactions: number[]
  lastPressAt: number
  lastMs: number | null
  startedAt: number
  done: boolean
}

const fresh = (): State => ({
  sequence: [], showing: false, live: null, flash: null, step: 0, mistakes: 0, best: 0, good: 0,
  presses: 0, reactions: [], lastPressAt: 0, lastMs: null, startedAt: 0, done: false,
})

function randomSequence(length: number) {
  const sequence: number[] = []
  while (sequence.length < length) sequence.push(pickPad(MODES.memory.pads, sequence.at(-1) ?? null))
  return sequence
}

// Pads glow in order, the patient repeats the order. Each correct round adds one pad.
export function useMemoryGame(hand: Hand, onFinish: FinishHandler): GameModel {
  const { g, bump, later, say, cue } = useGameKit(fresh)

  const play = (sequence: number[]) => {
    g.sequence = sequence
    g.showing = true
    g.step = 0
    g.flash = null
    bump()
    sequence.forEach((pad, i) => {
      const at = i * (MEMORY_STEP_MS + STEP_GAP_MS)
      later(() => { g.live = pad; bump() }, at)
      later(() => { g.live = null; bump() }, at + MEMORY_STEP_MS)
    })
    later(() => {
      g.showing = false
      g.lastPressAt = performance.now()
      bump()
    }, sequence.length * (MEMORY_STEP_MS + STEP_GAP_MS))
  }

  const finish = () => {
    g.done = true
    say('end')
    bump()
    const result = buildResult({ mode: 'memory', hand, ...g, misses: g.mistakes, score: g.best })
    later(() => onFinish(result), END_DELAY_MS)
  }

  useEffect(() => {
    g.startedAt = performance.now()
    say('start')
    bump()
    later(() => play(randomSequence(MEMORY_START_LENGTH)), START_DELAY_MS)
    // once per game: the screen remounts for a new game
  }, [])

  useDeviceEvents((event) => {
    if (event.type !== 'tap' || g.done || g.showing || !g.sequence.length) return
    const now = performance.now()
    g.presses += 1
    g.lastMs = Math.round(now - g.lastPressAt)
    g.lastPressAt = now

    if (event.pad !== g.sequence[g.step]) {
      g.mistakes += 1
      g.flash = { pad: event.pad, kind: 'miss' }
      say('miss')
      bump()
      if (g.mistakes >= MEMORY_MAX_MISTAKES) return finish()
      g.showing = true
      return later(() => play(g.sequence), NEXT_ROUND_MS)
    }

    playHitSound()
    g.good += 1
    g.reactions.push(g.lastMs)
    g.step += 1
    g.flash = { pad: event.pad, kind: 'hit' }
    later(() => { g.flash = null; bump() }, FEEDBACK_MS)
    if (g.step === g.sequence.length) {
      g.best = Math.max(g.best, g.sequence.length)
      say('streak')
      // block taps until the longer order has been shown
      g.showing = true
      later(() => play(randomSequence(g.sequence.length + 1)), NEXT_ROUND_MS)
    }
    bump()
  })

  const yourTurn = !g.showing && !g.done && g.sequence.length > 0

  return {
    live: g.live,
    flash: g.flash,
    ring: { lit: g.step, total: Math.max(g.sequence.length, MEMORY_START_LENGTH) },
    counter: { label: g.showing ? 'Watch the order' : 'Your turn', value: g.sequence.length || MEMORY_START_LENGTH },
    stats: [
      { label: 'Best order', value: g.best, unit: 'pads' },
      { label: 'Mistakes left', value: MEMORY_MAX_MISTAKES - g.mistakes },
      {
        label: 'This tap',
        value: g.lastMs ?? '-',
        unit: g.lastMs ? 'ms' : undefined,
        since: yourTurn ? g.lastPressAt : undefined,
      },
    ],
    cue,
  }
}
