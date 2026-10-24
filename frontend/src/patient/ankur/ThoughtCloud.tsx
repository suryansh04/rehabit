import { Ankur, type AnkurState } from './Ankur'

const PUFFS = 10

const puffs = Array.from({ length: PUFFS }, (_, i) => {
  const a = (2 * Math.PI * i) / PUFFS
  const size = i % 2 ? 52 : 62
  return { left: `${50 + 47 * Math.cos(a)}%`, top: `${50 + 44 * Math.sin(a)}%`, width: size, height: size }
})

// text null shows thinking dots. A new lineKey replays the pop-in for the next line.
export function ThoughtCloud({ text, lineKey }: { text: string | null; lineKey?: string | number }) {
  return (
    <div className="ank-cloud" role="status">
      {puffs.map((style, i) => (
        <span key={i} className="ank-puff" style={style} />
      ))}
      {text === null ? (
        <span className="ank-dots" aria-label="Ankur is thinking">
          <i />
          <i />
          <i />
        </span>
      ) : (
        <span key={lineKey ?? text} className="ank-line">
          {text}
        </span>
      )}
      <span className="ank-trail ank-trail-1" />
      <span className="ank-trail ank-trail-2" />
    </div>
  )
}

// text undefined hides the cloud, null shows thinking dots, a string shows the line.
type SaysProps = { state: AnkurState; size: number; text?: string | null; lineKey?: string | number }

export function AnkurSays({ state, size, text, lineKey }: SaysProps) {
  return (
    <div className="flex items-start">
      <Ankur state={state} size={size} />
      {text !== undefined && (
        <div className="-mt-5 ml-2">
          <ThoughtCloud text={text} lineKey={lineKey} />
        </div>
      )}
    </div>
  )
}
