import { HandBoard } from '../shared/HandBoard'
import { Ring } from '../shared/Ring'
import { Pill, TopBar } from '../shared/TopBar'
import { useDevice } from '../shared/device'
import type { Hand, ModeId } from '../shared/types'
import { Button, StatTile } from '../shared/ui'
import { AnkurSays } from './ankur/ThoughtCloud'
import { useGameAnkur } from './ankur/useGameAnkur'
import { COACH_LINES } from './coach'
import { MODES, type FinishHandler, type GameModel } from './games/modes'
import { useMemoryGame } from './games/useMemoryGame'
import { useTapGame } from './games/useTapGame'
import { useCoach, type Voice } from './useCoach'

const RING_SIZE = 600
const HAND_SIZE = 320
const TONES = ['mint', 'peach', 'lilac'] as const

type Props = { mode: ModeId; onFinish: FinishHandler; onStop: () => void }

// The cloud follows the audio: dots while a line waits, the text once it is spoken.
function cloudText({ speaking, waiting }: Voice) {
  if (waiting) return null
  return speaking ? COACH_LINES[speaking] : undefined
}

export function GameScreen(props: Props) {
  const { hand } = useDevice()
  return MODES[props.mode].kind === 'sequence' ? <MemoryGame {...props} hand={hand} /> : <TapGame {...props} hand={hand} />
}

type GameProps = Props & { hand: Hand }

function TapGame({ mode, hand, onFinish, onStop }: GameProps) {
  return <GameView mode={mode} hand={hand} model={useTapGame(mode, hand, onFinish)} onStop={onStop} />
}

function MemoryGame({ mode, hand, onFinish, onStop }: GameProps) {
  return <GameView mode={mode} hand={hand} model={useMemoryGame(hand, onFinish)} onStop={onStop} />
}

function GameView({ mode, hand, model, onStop }: { mode: ModeId; hand: Hand; model: GameModel; onStop: () => void }) {
  const voice = useCoach(model.cue)
  const ankur = useGameAnkur(model)
  const { counter } = model

  return (
    <div className="flex min-h-screen flex-col gap-6 px-10 py-8">
      <TopBar
        left={<Pill><b>{MODES[mode].name}</b> · {hand === 'left' ? 'Left' : 'Right'} hand</Pill>}
        right={<Button small onClick={onStop}>Stop</Button>}
      />
      <main className="grid flex-1 grid-cols-[1fr_auto_1fr] items-center gap-8">
        <div className="flex flex-col gap-4">
          <span className="text-muted">{counter.label}</span>
          <span className="num text-[88px] font-bold leading-none tracking-tighter">
            {counter.value}
            {counter.total && <small className="text-3xl font-medium text-muted"> / {counter.total}</small>}
          </span>
          <div className="mt-8">
            <AnkurSays state={ankur} size={150} text={cloudText(voice)} lineKey={voice.key} />
          </div>
        </div>
        <Ring lit={model.ring.lit} total={model.ring.total} size={RING_SIZE}>
          <HandBoard hand={hand} size={HAND_SIZE} live={model.live} flash={model.flash} />
        </Ring>
        <div className="flex flex-col gap-3.5">
          {model.stats.map((stat, i) => (
            <StatTile key={stat.label} tone={TONES[i]} {...stat} />
          ))}
        </div>
      </main>
    </div>
  )
}
