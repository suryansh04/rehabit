import { useEffect, useRef } from 'react'

const BARS = 5
// the shortest bar is as tall as it is wide, so it rests as a round dot
const MIN_LEVEL = 0.19
const GAIN = 1.6
// room hum and small clicks on the microphone stay below this, so the bars rest until the patient really speaks
const NOISE_FLOOR = 0.08
// how fast a bar follows the sound; lower is smoother
const FOLLOW = 0.35

export type VoiceState = 'connecting' | 'listening' | 'speaking'

type Props = {
  state: VoiceState
  // frequency bins (0 to 255): Yash's voice while he speaks, the patient's microphone while he listens
  read: () => Uint8Array
}

function bandLevels(bins: Uint8Array, floor: number) {
  const size = Math.floor(bins.length / BARS)
  return Array.from({ length: BARS }, (_, band) => {
    let sum = 0
    for (let i = band * size; i < (band + 1) * size; i++) sum += bins[i]
    const raw = size ? sum / size / 255 : 0
    const level = Math.max(0, raw - floor) * GAIN
    return Math.max(MIN_LEVEL, Math.min(1, level))
  })
}

// Bars that follow the real audio, in the style of LiveKit's agent bar visualizer.
export function VoiceBars({ state, read }: Props) {
  const bars = useRef<(HTMLSpanElement | null)[]>([])

  useEffect(() => {
    if (state === 'connecting') return
    const shown = Array<number>(BARS).fill(MIN_LEVEL)
    let frame = 0
    const draw = () => {
      bandLevels(read(), state === 'listening' ? NOISE_FLOOR : 0).forEach((target, i) => {
        shown[i] += (target - shown[i]) * FOLLOW
        const bar = bars.current[i]
        if (bar) bar.style.height = `${shown[i] * 100}%`
      })
      frame = requestAnimationFrame(draw)
    }
    draw()
    return () => cancelAnimationFrame(frame)
  }, [state, read])

  const tone = state === 'speaking' ? 'bg-accent' : 'bg-accent/45'
  return (
    <div className="flex h-16 items-center gap-2" aria-hidden>
      {Array.from({ length: BARS }, (_, i) => (
        <span
          key={i}
          ref={(el) => {
            bars.current[i] = el
          }}
          className={`w-3 rounded-full transition-colors duration-300 ${tone} ${
            state === 'connecting' ? 'animate-pulse' : ''
          }`}
          style={{ height: `${MIN_LEVEL * 100}%`, animationDelay: `${i * 120}ms` }}
        />
      ))}
    </div>
  )
}
