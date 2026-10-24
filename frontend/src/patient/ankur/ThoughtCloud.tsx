import { useEffect, useState } from 'react'
import { Ankur, type AnkurState } from './Ankur'

const PUFFS = 10
const THINK_MS = 600

const puffs = Array.from({ length: PUFFS }, (_, i) => {
  const a = (2 * Math.PI * i) / PUFFS
  const size = i % 2 ? 52 : 62
  return { left: `${50 + 47 * Math.cos(a)}%`, top: `${50 + 44 * Math.sin(a)}%`, width: size, height: size }
})

// Ankur thinks for a moment, then the line appears. Give it a new key to replay.
export function ThoughtCloud({ text }: { text: string }) {
  const [thinking, setThinking] = useState(true)

  useEffect(() => {
    const timer = window.setTimeout(() => setThinking(false), THINK_MS)
    return () => window.clearTimeout(timer)
  }, [])

  return (
    <div className="ank-cloud" role="status">
      {puffs.map((style, i) => (
        <span key={i} className="ank-puff" style={style} />
      ))}
      {thinking ? (
        <span className="ank-dots" aria-label="Ankur is thinking">
          <i />
          <i />
          <i />
        </span>
      ) : (
        <span className="ank-line">{text}</span>
      )}
      <span className="ank-trail ank-trail-1" />
      <span className="ank-trail ank-trail-2" />
    </div>
  )
}

type SaysProps = { state: AnkurState; size: number; text: string | null; sayKey?: string | number }

// Ankur with his cloud. A new sayKey replays the thinking dots for the same text.
export function AnkurSays({ state, size, text, sayKey }: SaysProps) {
  return (
    <div className="flex items-start">
      <Ankur state={state} size={size} />
      {text && (
        <div className="-mt-5 ml-2">
          <ThoughtCloud key={sayKey ?? text} text={text} />
        </div>
      )}
    </div>
  )
}
