import { ConversationProvider, useConversation, type MessagePayload } from '@elevenlabs/react'
import { useEffect, useRef, useState } from 'react'
import { getCompanionToken } from '../shared/api'
import { HandBoard } from '../shared/HandBoard'
import { Ring } from '../shared/Ring'
import { Pill, TopBar } from '../shared/TopBar'
import { PALM_PAD, TAPS_PER_GAME } from '../shared/config'
import { useDevice } from '../shared/device'
import { Bubble, Button } from '../shared/ui'
import { Ankur } from './ankur/Ankur'

const COMPANION = 'Mitra'
const WAVE = [18, 34, 56, 40, 70, 48, 28, 60, 36, 22, 44, 30]

type Line = { from: 'user' | 'bot'; text: string }

export function TalkScreen({ onEnd }: { onEnd: () => void }) {
  return (
    <ConversationProvider>
      <Talk onEnd={onEnd} />
    </ConversationProvider>
  )
}

function Talk({ onEnd }: { onEnd: () => void }) {
  const { hand } = useDevice()
  const [lines, setLines] = useState<Line[]>([])
  const [error, setError] = useState<string | null>(null)
  const ended = useRef(false)

  const finish = () => {
    if (ended.current) return
    ended.current = true
    onEnd()
  }

  const { startSession, endSession, status, isSpeaking } = useConversation({
    onMessage: ({ role, message }: MessagePayload) =>
      setLines((all) => [...all, { from: role === 'user' ? 'user' : 'bot', text: message }]),
    onError: (message) => setError(message),
    // Mitra hangs up himself (End call tool or the 3 minute cap). Our own endSession is reason "user".
    onDisconnect: (details) => {
      if (details.reason === 'agent') finish()
      if (details.reason === 'error') setError(details.message)
    },
  })

  useEffect(() => {
    let cancelled = false
    getCompanionToken()
      .then(({ token }) => {
        if (!cancelled) startSession({ conversationToken: token })
      })
      .catch((e: unknown) => setError(e instanceof Error ? e.message : String(e)))
    return () => {
      cancelled = true
      endSession()
    }
  }, [startSession, endSession])

  const end = () => {
    endSession()
    finish()
  }

  const live = status === 'connected'
  const heading = !live ? 'Connecting...' : isSpeaking ? `${COMPANION} is speaking.` : `${COMPANION} is listening.`
  const recent = lines.slice(-4)

  return (
    <div className="flex min-h-screen flex-col gap-6 px-10 py-8">
      <TopBar left={<Pill><b>Talk time</b></Pill>} right={<Button small onClick={end}>End talk</Button>} />
      <main className="grid flex-1 grid-cols-[auto_1fr] items-center gap-12">
        <Ring lit={0} total={TAPS_PER_GAME} size={560} showTicks={false}>
          <HandBoard hand={hand} size={320} live={PALM_PAD} />
        </Ring>
        <div className="flex max-w-lg flex-col gap-3.5">
          {/* Mitra is the voice; Ankur only listens along */}
          <Ankur state="listen" size={110} />
          <h1 className="text-[34px] font-bold tracking-tight">{heading}</h1>
          <p className="text-muted">Speak in Hindi or English. Take your time.</p>
          {recent.map((line, i) =>
            line.from === 'bot' ? (
              <Bubble key={i} text={line.text} from={COMPANION} />
            ) : (
              <div key={i} className="self-end rounded-[22px] rounded-br-md bg-accent px-5 py-3.5 text-white">
                {line.text}
              </div>
            ),
          )}
          <div className="flex h-20 items-center gap-1.5" aria-hidden>
            {WAVE.map((h, i) => (
              <i
                key={i}
                className={`w-2 rounded-full bg-accent ${live ? 'animate-pulse' : 'opacity-30'}`}
                style={{ height: h, animationDelay: `${i * 90}ms` }}
              />
            ))}
          </div>
          {error && <p className="text-error">{error}</p>}
        </div>
      </main>
    </div>
  )
}
