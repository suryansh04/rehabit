import { useState } from 'react'
import { Pill, TopBar } from '../shared/TopBar'
import { saveMood } from '../shared/api'
import { FINGER_PADS } from '../shared/config'
import { useDeviceEvents } from '../shared/device'
import { MOOD_LABELS } from '../shared/stats'
import { Ankur } from './ankur/Ankur'

const LOW_MOOD_MAX = 2
const THANKS_MS = 1500

export function MoodScreen({ onDone }: { onDone: () => void }) {
  const [picked, setPicked] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)

  const pick = async (score: number) => {
    if (picked) return
    setPicked(score)
    setError(null)
    try {
      await saveMood(score)
      window.setTimeout(onDone, THANKS_MS)
    } catch (e) {
      setPicked(null)
      setError(e instanceof Error ? e.message : String(e))
    }
  }

  useDeviceEvents((event) => {
    if (event.type === 'tap' && FINGER_PADS.includes(event.pad)) pick(event.pad)
  })

  return (
    <div className="flex min-h-screen flex-col gap-6 px-10 py-8">
      <TopBar left={<Pill><b>Talk time</b></Pill>} />
      <main className="grid flex-1 place-items-center">
        <div className="flex w-full max-w-lg flex-col items-center text-center">
          <Ankur state={picked === null ? 'think' : picked <= LOW_MOOD_MAX ? 'comfort' : 'happy'} size={120} />
          <h1 className="text-[34px] font-bold tracking-tight">{picked ? 'Thank you for telling us.' : 'How do you feel now?'}</h1>
          <p className="text-muted">Tap one fingertip coin. 1 is very low, 5 is very good.</p>
          <div className="mt-6 flex w-full flex-col gap-2.5">
            {MOOD_LABELS.map((label, i) => {
              const score = i + 1
              const on = picked === score
              return (
                <button
                  key={label}
                  onClick={() => pick(score)}
                  className={`flex items-center gap-4 rounded-[20px] border-2 bg-surface px-4 py-3.5 text-left ${
                    on ? 'border-accent shadow-soft' : 'border-transparent'
                  }`}
                >
                  <b className={`grid size-10 place-items-center rounded-full ${on ? 'bg-accent text-white' : 'bg-lilac text-accent-ink'}`}>
                    {score}
                  </b>
                  {label}
                </button>
              )
            })}
          </div>
          {error && <p className="mt-4 text-error">We could not save your answer: {error}</p>}
        </div>
      </main>
    </div>
  )
}
