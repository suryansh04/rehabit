import { useEffect, useState } from 'react'
import type { ClipId } from '../coach'
import type { GameModel } from '../games/modes'
import type { AnkurState } from './Ankur'

const REACT_MS = 1600

const REACTION: Record<ClipId, AnkurState> = {
  start: 'happy',
  streak: 'cheer',
  miss: 'encourage',
  last5: 'push',
  end: 'celebrate',
}

// Ankur reacts to each coach cue for a moment, then goes back to quietly watching the coin.
export function useGameAnkur({ cue, flash, live }: GameModel): AnkurState {
  const [reacting, setReacting] = useState<ClipId | null>(null)

  useEffect(() => {
    if (!cue) return
    setReacting(cue.clip)
    if (cue.clip === 'end') return
    const timer = window.setTimeout(() => setReacting(null), REACT_MS)
    return () => window.clearTimeout(timer)
  }, [cue])

  if (reacting) return REACTION[reacting]
  if (flash?.kind === 'hit') return 'happy'
  return live === null ? 'idle' : 'watch'
}
