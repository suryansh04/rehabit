import { Ring } from '../shared/Ring'
import { Pill, TopBar } from '../shared/TopBar'
import { TAPS_PER_GAME } from '../shared/config'
import type { SessionResult } from '../shared/types'
import { Button, StatTile } from '../shared/ui'
import { COACH_LINES } from './coach'
import { MODES } from './games/modes'

const RING_SIZE = 600

type Props = { result: SessionResult; streak: number; saveError: string | null; onAgain: () => void; onMenu: () => void }

// The big number is whatever the mode is scored on: good taps, pads remembered or taps in time.
function headline({ mode, correct, score }: SessionResult) {
  if (mode === 'memory') return { value: score, of: null, label: 'pads in a row' }
  if (mode === 'endurance') return { value: score, of: null, label: 'good taps' }
  return { value: correct, of: TAPS_PER_GAME, label: 'good taps' }
}

export function DoneScreen({ result, streak, saveError, onAgain, onMenu }: Props) {
  const big = headline(result)
  const lit = big.of ? big.value : TAPS_PER_GAME

  return (
    <div className="flex min-h-screen flex-col gap-6 px-10 py-8">
      <TopBar
        left={<Pill><b>{MODES[result.mode].name}</b> · {result.hand === 'left' ? 'Left' : 'Right'} hand</Pill>}
        right={streak > 0 && <Pill>Day {streak} streak</Pill>}
      />
      <main className="grid flex-1 grid-cols-[auto_1fr] items-center gap-12">
        <Ring lit={lit} total={TAPS_PER_GAME} size={RING_SIZE}>
          <div className="text-center">
            <span className="num text-[110px] font-bold leading-none tracking-tighter">
              {big.value}
              {big.of && <small className="text-3xl font-medium text-muted">/ {big.of}</small>}
            </span>
            <h2 className="mt-2 text-2xl font-bold">{big.label}</h2>
          </div>
        </Ring>
        <div className="max-w-xl">
          <h1 className="text-[44px] font-bold leading-[1.1] tracking-tight">{COACH_LINES.end}</h1>
          <div className="my-6 grid grid-cols-2 gap-3.5">
            <StatTile tone="mint" label="Avg reaction" value={result.avg_reaction_ms || '-'} unit="ms" />
            <StatTile tone="peach" label="Accuracy" value={Math.round(result.accuracy)} unit="%" />
          </div>
          {saveError && <p className="mb-4 text-miss">We could not save this game: {saveError}</p>}
          <div className="flex gap-3">
            <Button variant="primary" onClick={onAgain}>Play again</Button>
            <Button onClick={onMenu}>Back to games</Button>
          </div>
        </div>
      </main>
    </div>
  )
}
