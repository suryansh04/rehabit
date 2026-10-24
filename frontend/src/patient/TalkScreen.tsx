import { useEffect, useRef, useState } from 'react'
import { AgentState, BrowserAudioInterface, ConversationAgent, InteractionType } from 'sarvam-conv-ai-sdk/browser'
import { HandBoard } from '../shared/HandBoard'
import { Ring } from '../shared/Ring'
import { Pill, TopBar } from '../shared/TopBar'
import { PALM_PAD, TAPS_PER_GAME } from '../shared/config'
import { useDevice } from '../shared/device'
import type { PublicConfig } from '../shared/types'
import { Bubble, Button } from '../shared/ui'

// The SDK asks our backend for a signed URL; the backend adds the Sarvam key.
const PROXY_BASE_URL = '/api/sarvam/'
const SAMPLE_RATE = 16000
const CONNECT_TIMEOUT_S = 10
const WAVE = [18, 34, 56, 40, 70, 48, 28, 60, 36, 22, 44, 30]

type Line = { from: 'user' | 'bot'; text: string }

const STATUS: Partial<Record<AgentState, string>> = {
  [AgentState.CONNECTING]: 'Connecting...',
  [AgentState.LISTENING]: 'We are listening.',
  [AgentState.SPEAKING]: 'Your companion is speaking.',
}

export function TalkScreen({ config, onEnd }: { config: PublicConfig | null; onEnd: () => void }) {
  const { hand } = useDevice()
  const agent = useRef<ConversationAgent | null>(null)
  const [state, setState] = useState<AgentState>(AgentState.IDLE)
  const [lines, setLines] = useState<Line[]>([])
  const [error, setError] = useState<string | null>(null)
  const ended = useRef(false)

  const finish = () => {
    if (ended.current) return
    ended.current = true
    onEnd()
  }

  useEffect(() => {
    if (!config?.companion_app_id) {
      setError('The companion is not set up yet. Add the Sarvam ids to .env.')
      return
    }
    const talk = new ConversationAgent({
      apiKey: '',
      baseUrl: PROXY_BASE_URL,
      config: {
        org_id: config.org_id,
        workspace_id: config.workspace_id,
        app_id: config.companion_app_id,
        user_identifier: 'patient',
        user_identifier_type: 'custom',
        interaction_type: InteractionType.CALL,
        input_sample_rate: SAMPLE_RATE,
        output_sample_rate: SAMPLE_RATE,
      },
      audioInterface: new BrowserAudioInterface(),
      stateCallback: (next) => setState(next),
      transcriptCallback: async (msg) => {
        setLines((all) => [...all, { from: msg.role === 'user' ? 'user' : 'bot', text: msg.content }])
      },
      endCallback: async () => finish(),
    })
    agent.current = talk
    talk
      .start()
      .then(() => talk.waitForConnect(CONNECT_TIMEOUT_S))
      .catch((e: unknown) => setError(e instanceof Error ? e.message : String(e)))
    return () => {
      talk.stop()
    }
    // a new companion session only when the config arrives
  }, [config])

  const end = async () => {
    await agent.current?.stop()
    finish()
  }

  const active = state === AgentState.LISTENING || state === AgentState.SPEAKING
  const recent = lines.slice(-4)

  return (
    <div className="flex min-h-screen flex-col gap-6 px-10 py-8">
      <TopBar left={<Pill><b>Talk time</b></Pill>} right={<Button small onClick={end}>End talk</Button>} />
      <main className="grid flex-1 grid-cols-[auto_1fr] items-center gap-12">
        <Ring lit={0} total={TAPS_PER_GAME} size={560} showTicks={false}>
          <HandBoard hand={hand} size={320} live={PALM_PAD} />
        </Ring>
        <div className="flex max-w-lg flex-col gap-3.5">
          <h1 className="text-[34px] font-bold tracking-tight">{STATUS[state] ?? 'Getting ready...'}</h1>
          <p className="text-muted">Speak in Hindi or English. Take your time.</p>
          {recent.map((line, i) =>
            line.from === 'bot' ? (
              <Bubble key={i} text={line.text} from="Your companion" />
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
                className={`w-2 rounded-full bg-accent ${active ? 'animate-pulse' : 'opacity-30'}`}
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
