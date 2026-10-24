import { ConversationProvider, useConversation, type MessagePayload } from '@elevenlabs/react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { getCompanionToken } from '../shared/api'
import { HandBoard } from '../shared/HandBoard'
import { Ring } from '../shared/Ring'
import { Pill, TopBar } from '../shared/TopBar'
import { PALM_PAD, TAPS_PER_GAME } from '../shared/config'
import { useDevice } from '../shared/device'
import { Button } from '../shared/ui'
import { Ankur } from './ankur/Ankur'
import { VoiceBars } from './VoiceBars'

const COMPANION = 'Yash'
// about the pace of Yash's Hindi speech, so the words appear as he says them
const WORD_MS = 330
// voice tags like [happy] steer the voice; the patient should not read them
const VOICE_TAG = /\[[a-z ]+\]\s*/gi
const BUBBLE = 'msg-in max-w-[85%] rounded-[22px] px-5 py-3.5 text-[17px] leading-relaxed font-normal'

type Line = { id: number; from: 'user' | 'bot'; text: string }

// Shows Yash's newest line word by word at his speaking pace. Older lines show in full.
function YashLine({ text, active }: { text: string; active: boolean }) {
  const words = text.replace(VOICE_TAG, '').trim().split(' ')
  const [count, setCount] = useState(1)

  useEffect(() => {
    if (!active) return
    const timer = setInterval(() => setCount((c) => Math.min(words.length, c + 1)), WORD_MS)
    return () => clearInterval(timer)
  }, [active, words.length])

  return (
    <p className={`${BUBBLE} self-start rounded-bl-md bg-surface text-ink/80 shadow-[0_2px_10px_rgb(27_21_48/0.05)]`}>
      {words.slice(0, active ? count : words.length).map((word, i) => (
        <span key={i} className="word-in">
          {word}{' '}
        </span>
      ))}
    </p>
  )
}

// Keeps the newest message in view, also while Yash's line is still growing.
function useStickToBottom() {
  const scroller = useRef<HTMLDivElement>(null)
  const content = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const box = scroller.current
    if (!box || !content.current) return
    const follow = new ResizeObserver(() => box.scrollTo({ top: box.scrollHeight, behavior: 'smooth' }))
    follow.observe(content.current)
    return () => follow.disconnect()
  }, [])

  return { scroller, content }
}

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
  const { scroller, content } = useStickToBottom()

  const finish = () => {
    if (ended.current) return
    ended.current = true
    onEnd()
  }

  const conversation = useConversation({
    onMessage: ({ role, message }: MessagePayload) =>
      setLines((all) => [...all, { id: all.length, from: role === 'user' ? 'user' : 'bot', text: message }]),
    onError: (message) => setError(message),
    // Yash hangs up himself (End call tool or the 3 minute cap). Our own endSession is reason "user".
    onDisconnect: (details) => {
      if (details.reason === 'agent') finish()
      if (details.reason === 'error') setError(details.message)
    },
  })
  const { startSession, endSession, status, isSpeaking, getInputByteFrequencyData, getOutputByteFrequencyData } =
    conversation

  useEffect(() => {
    let cancelled = false
    // Each token takes one of the plan's few talk slots. The timer lets React's dev
    // double mount cancel the first run before it asks for a token.
    const timer = setTimeout(() => {
      getCompanionToken()
        .then(({ token }) => {
          if (!cancelled) startSession({ conversationToken: token })
        })
        .catch((e: unknown) => setError(e instanceof Error ? e.message : String(e)))
    })
    return () => {
      cancelled = true
      clearTimeout(timer)
      endSession()
    }
  }, [startSession, endSession])

  const end = () => {
    endSession()
    finish()
  }

  const read = useCallback(
    () => (isSpeaking ? getOutputByteFrequencyData() : getInputByteFrequencyData()),
    [isSpeaking, getInputByteFrequencyData, getOutputByteFrequencyData],
  )

  const voice = status !== 'connected' ? 'connecting' : isSpeaking ? 'speaking' : 'listening'
  const heading = {
    connecting: 'Connecting...',
    speaking: `${COMPANION} is speaking.`,
    listening: `${COMPANION} is listening.`,
  }[voice]
  const lastBot = lines.findLast((line) => line.from === 'bot')?.id

  return (
    <div className="flex h-screen flex-col gap-6 px-10 py-8">
      <TopBar left={<Pill><b>Talk time</b></Pill>} right={<Button small onClick={end}>End talk</Button>} />
      <main className="grid min-h-0 flex-1 grid-cols-[auto_1fr] items-center gap-12">
        <Ring lit={0} total={TAPS_PER_GAME} size={560} showTicks={false}>
          <HandBoard hand={hand} size={320} live={PALM_PAD} />
        </Ring>
        <div className="flex h-[78vh] max-w-xl flex-col gap-4">
          <div className="flex items-center gap-4">
            {/* Yash is the voice; Ankur only listens along */}
            <Ankur state="listen" size={72} />
            <div>
              <h1 className="text-[30px] font-bold tracking-tight">{heading}</h1>
              <p className="text-muted">Speak in Hindi or English. Take your time.</p>
            </div>
          </div>
          <div ref={scroller} className="chat-fade min-h-0 flex-1 overflow-y-auto">
            <div ref={content} className="flex min-h-full flex-col justify-end gap-3 pt-10 pb-2">
              {lines.map((line) =>
                line.from === 'bot' ? (
                  <YashLine key={line.id} text={line.text} active={line.id === lastBot} />
                ) : (
                  <p key={line.id} className={`${BUBBLE} self-end rounded-br-md bg-lilac text-accent-ink`}>
                    {line.text}
                  </p>
                ),
              )}
            </div>
          </div>
          <VoiceBars state={voice} read={read} />
          {error && <p className="text-error">{error}</p>}
        </div>
      </main>
    </div>
  )
}
