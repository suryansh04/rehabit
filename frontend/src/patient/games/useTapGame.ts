import { useEffect } from 'react'
import { ENDURANCE_SECONDS, FEEDBACK_MS, TAP_TIMEOUT_MS, TAPS_PER_GAME } from '../../shared/config'
import type { Flash } from '../../shared/HandBoard'
import { useDeviceEvents } from '../../shared/device'
import type { Hand, ModeId } from '../../shared/types'
import { LAST_STRETCH, STREAK_EVERY } from '../coach'
import { MODES, type FinishHandler, type GameModel } from './modes'
import { buildResult, END_DELAY_MS, pickPad, START_DELAY_MS, useGameKit } from './useGameKit'

const CLOCK_TICK_MS = 250

type State = {
  target: number | null
  shownAt: number
  previous: number | null
  flash: Flash | null
  resolved: number
  good: number
  misses: number
  presses: number
  streak: number
  best: number
  lastMs: number | null
  reactions: number[]
  startedAt: number
  done: boolean
}

const fresh = (): State => ({
  target: null, shownAt: 0, previous: null, flash: null, resolved: 0, good: 0, misses: 0, presses: 0,
  streak: 0, best: 0, lastMs: null, reactions: [], startedAt: 0, done: false,
})

// Classic, Finger isolation (fixed number of targets) and Endurance (against the clock).
export function useTapGame(id: ModeId, hand: Hand, onFinish: FinishHandler): GameModel {
  const mode = MODES[id]
  const timed = mode.kind === 'timed'
  const { g, bump, later, say, cue } = useGameKit(fresh)

  const secondsLeft = () => Math.max(0, ENDURANCE_SECONDS - (performance.now() - g.startedAt) / 1000)
  const gameOver = () => (timed ? secondsLeft() <= 0 : g.resolved >= TAPS_PER_GAME)

  const finish = () => {
    if (g.done) return
    g.done = true
    g.target = null
    say('end')
    bump()
    const score = timed ? g.good : Math.round((g.good / Math.max(1, g.good + g.misses)) * 100)
    const result = buildResult({ mode: id, hand, ...g, score })
    later(() => onFinish(result), END_DELAY_MS)
  }

  const showNext = () => {
    if (gameOver()) return finish()
    g.target = pickPad(mode.pads, g.previous)
    g.previous = g.target
    g.shownAt = performance.now()
    g.flash = null
    bump()
  }

  const settle = (flash: Flash) => {
    g.flash = flash
    g.target = null
    bump()
    later(showNext, FEEDBACK_MS)
  }

  const miss = () => {
    g.misses += 1
    g.streak = 0
    say('miss')
  }

  useEffect(() => {
    g.startedAt = performance.now()
    say('start')
    bump()
    later(showNext, START_DELAY_MS)
    // once per game: the screen remounts for a new game
  }, [])

  // A target left alone for too long counts as a miss.
  useEffect(() => {
    if (timed || g.target === null) return
    const pad = g.target
    const waitMs = TAP_TIMEOUT_MS - (performance.now() - g.shownAt)
    const timer = window.setTimeout(() => {
      g.resolved += 1
      miss()
      settle({ pad, kind: 'miss' })
    }, waitMs)
    return () => window.clearTimeout(timer)
  })

  useEffect(() => {
    if (!timed) return
    const clock = window.setInterval(() => (secondsLeft() <= 0 ? finish() : bump()), CLOCK_TICK_MS)
    return () => window.clearInterval(clock)
  })

  useDeviceEvents((event) => {
    if (event.type !== 'tap' || g.done || g.target === null) return
    g.presses += 1
    if (event.pad !== g.target) {
      miss()
      g.flash = { pad: event.pad, kind: 'miss' }
      bump()
      return
    }
    g.lastMs = Math.round(performance.now() - g.shownAt)
    g.reactions.push(g.lastMs)
    g.good += 1
    g.resolved += 1
    g.streak += 1
    g.best = Math.max(g.best, g.streak)
    if (g.streak % STREAK_EVERY === 0) say('streak')
    if (!timed && TAPS_PER_GAME - g.resolved === LAST_STRETCH) say('last5')
    settle({ pad: event.pad, kind: 'hit' })
  })

  return {
    live: g.target,
    flash: g.flash,
    ring: timed
      ? { lit: Math.round((1 - secondsLeft() / ENDURANCE_SECONDS) * TAPS_PER_GAME), total: TAPS_PER_GAME }
      : { lit: g.good, total: TAPS_PER_GAME },
    counter: timed
      ? { label: 'Seconds left', value: Math.ceil(g.startedAt ? secondsLeft() : ENDURANCE_SECONDS) }
      : { label: 'Good taps', value: g.good, total: TAPS_PER_GAME },
    stats: [
      { label: 'This tap', value: g.lastMs ?? '-', unit: g.lastMs ? 'ms' : undefined },
      { label: timed ? 'Good taps' : 'In a row', value: timed ? g.good : g.streak },
      { label: 'Misses', value: g.misses },
    ],
    cue,
  }
}
