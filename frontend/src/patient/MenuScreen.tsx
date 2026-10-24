import { HandBoard } from '../shared/HandBoard'
import { Ring } from '../shared/Ring'
import { Pill, TopBar } from '../shared/TopBar'
import { PALM_PAD, TAPS_PER_GAME } from '../shared/config'
import { useDevice, useDeviceEvents } from '../shared/device'
import type { ModeId } from '../shared/types'
import { Button } from '../shared/ui'
import { MODE_ORDER, MODES } from './games/modes'

const RING_SIZE = 500
const HAND_SIZE = 290

type Props = {
  name: string
  sessionTime: string
  streak: number
  mode: ModeId
  onPick: (mode: ModeId) => void
  onStart: () => void
  onTalk: () => void
}

export function MenuScreen({ name, sessionTime, streak, mode, onPick, onStart, onTalk }: Props) {
  const { hand } = useDevice()
  useDeviceEvents((event) => {
    if (event.type === 'hold' && event.pad === PALM_PAD) onTalk()
  })

  return (
    <div className="flex min-h-screen flex-col gap-6 px-10 py-8">
      <TopBar
        right={
          <>
            {streak > 0 && <Pill>Day {streak} streak</Pill>}
            <Pill>{hand === 'left' ? 'Left' : 'Right'} hand</Pill>
          </>
        }
      />
      <main className="grid flex-1 grid-cols-[400px_1fr] gap-5">
        <aside className="flex flex-col gap-3">
          <h1 className="text-[34px] font-bold leading-tight tracking-tight">Namaste, {name} ji</h1>
          <p className="-mt-1 mb-1.5 text-muted">Pick a game. We play together at {sessionTime}.</p>
          {MODE_ORDER.map((id, i) => (
            <button
              key={id}
              onClick={() => onPick(id)}
              className={`flex items-center gap-3.5 rounded-3xl border-2 bg-surface px-5 py-4 text-left transition ${
                id === mode ? 'border-accent shadow-soft' : 'border-transparent hover:border-line'
              }`}
            >
              <span
                className={`grid size-12 place-items-center rounded-2xl font-bold ${
                  id === mode ? 'bg-accent text-white' : 'bg-lilac text-accent'
                }`}
              >
                {i + 1}
              </span>
              <span>
                <b className="block text-lg">{MODES[id].name}</b>
                <span className="text-sm text-muted">{MODES[id].blurb}</span>
              </span>
            </button>
          ))}
          <button onClick={onTalk} className="mt-auto flex items-center gap-3.5 rounded-3xl bg-peach p-5 text-left">
            <span className="grid size-12 place-items-center rounded-full bg-surface font-bold">{PALM_PAD}</span>
            <span>
              <b className="block">Want to talk?</b>
              <span className="text-[15px] text-muted">Hold your palm on coin {PALM_PAD} for 2 seconds</span>
            </span>
          </button>
        </aside>
        <section className="grid grid-rows-[auto_1fr_auto] rounded-card bg-surface px-8 py-7 shadow-soft">
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-bold">{MODES[mode].name}</h2>
            <span className="ml-auto text-[15px] text-muted">{MODES[mode].hint}</span>
          </div>
          <div className="grid place-items-center">
            <Ring lit={0} total={TAPS_PER_GAME} size={RING_SIZE}>
              <HandBoard hand={hand} size={HAND_SIZE} dimPalm={mode === 'finger'} />
            </Ring>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="primary" onClick={onStart}>Start session</Button>
            <span className="ml-auto text-[15px] text-muted">Put your {hand} hand on the board</span>
          </div>
        </section>
      </main>
    </div>
  )
}
