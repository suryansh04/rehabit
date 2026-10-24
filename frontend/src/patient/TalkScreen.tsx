import { ConversationProvider, useConversation, type MessagePayload } from '@elevenlabs/react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { getCompanionToken } from '../shared/api'
import { Pill, TopBar } from '../shared/TopBar'
import { Button } from '../shared/ui'
import { Ankur } from './ankur/Ankur'
import { SpeechClock } from './speechClock'
import { VoiceBars } from './VoiceBars'

const COMPANION = 'Yash'
// with no timing data from ElevenLabs, show the whole line after this long
const NO_TIMING_MS = 2500
// voice tags like [happy] steer the voice; the patient should not read them
const VOICE_TAG = /\[[a-z ]+\]\s*/gi
const BUBBLE = 'msg-in max-w-[80%] rounded-[24px] px-6 py-4 text-lg leading-relaxed font-normal'

type Line = { id: number; from: 'user' | 'bot'; text: string }

// Shows each word of Yash's newest line the moment he says it. Older lines show in full.
function YashLine({ text, active, clock }: { text: string; active: boolean; clock: SpeechClock }) {
  const words = text.replace(VOICE_TAG, '').trim().split(' ')
  const [count, setCount] = useState(0)

  useEffect(() => {
    if (!active) return
    // where each word begins in the line, counted in characters
    const wordStarts = words.map((_, i) => words.slice(0, i).join(' ').length + (i ? 1 : 0))
    const shownAt = performance.now()
    let frame = 0
    const tick = () => {
      const now = performance.now()
      const { spoken, started, finished } = clock.read(now)
      const all = finished || (!started && now - shownAt > NO_TIMING_MS)
      setCount(all ? words.length : wordStarts.filter((start) => start < spoken).length)
      if (!all) frame = requestAnimationFrame(tick)
    }
    tick()
    return () => cancelAnimationFrame(frame)
    // the words only change with the text
  }, [active, text, clock])

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
  const [lines, setLines] = useState<Line[]>([])
  const [clock] = useState(() => new SpeechClock())
  const [error, setError] = useState<string | null>(null)
  const ended = useRef(false)
  const { scroller, content } = useStickToBottom()

  const finish = () => {
    if (ended.current) return
    ended.current = true
    onEnd()
  }

  const conversation = useConversation({
    onMessage: ({ role, message }: MessagePayload) => {
      // Yash's text arrives just before his audio, so a new line starts a fresh timeline
      if (role !== 'user') clock.reset()
      setLines((all) => [...all, { id: all.length, from: role === 'user' ? 'user' : 'bot', text: message }])
    },
    onAudioAlignment: (alignment) => clock.add(alignment),
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
    <div className="flex h-screen flex-col gap-4 px-10 py-8">
      <TopBar left={<Pill><b>Talk time</b></Pill>} right={<Button small onClick={end}>End talk</Button>} />
      <main className="mx-auto flex min-h-0 w-full max-w-3xl flex-1 flex-col gap-5">
        <div ref={scroller} className="chat-fade no-scrollbar min-h-0 flex-1 overflow-y-auto">
          <div ref={content} className="flex min-h-full flex-col justify-end gap-3 pt-12 pb-2">
            {lines.length === 0 && (
              <div className="msg-in m-auto flex flex-col items-center gap-3 text-center">
                <Ankur state="listen" size={140} />
                <p className="text-lg text-muted">{COMPANION} will say namaste in a moment.</p>
              </div>
            )}
            {lines.map((line) =>
              line.from === 'bot' ? (
                <YashLine key={line.id} text={line.text} active={line.id === lastBot} clock={clock} />
              ) : (
                <p key={line.id} className={`${BUBBLE} self-end rounded-br-md bg-lilac text-accent-ink`}>
                  {line.text}
                </p>
              ),
            )}
          </div>
        </div>
        {/* Yash is the voice; Ankur only listens along */}
        <footer className="flex items-center gap-5 rounded-card bg-surface px-6 py-4 shadow-soft">
          <Ankur state="listen" size={64} />
          <div className="min-w-0 flex-1">
            <h1 className="text-2xl font-bold tracking-tight">{heading}</h1>
            <p className="text-muted">
              {error ? <span className="text-error">{error}</span> : 'Speak in Hindi or English. Take your time.'}
            </p>
          </div>
          <VoiceBars state={voice} read={read} />
        </footer>
      </main>
    </div>
  )
}
