import { useEffect, useRef } from 'react'
import type { Cue } from './coach'

const clipUrl = (clip: Cue['clip']) => `/clips/${clip}.mp3`

// Plays the voice clip for each new cue. A new clip cuts off the one before it.
export function useCoach(cue: Cue | null) {
  const audio = useRef<HTMLAudioElement | null>(null)

  useEffect(() => {
    if (!cue) return
    audio.current?.pause()
    audio.current = new Audio(clipUrl(cue.clip))
    audio.current.play().catch((error) => console.warn(`Coach clip ${cue.clip} did not play:`, error))
  }, [cue])

  useEffect(() => () => audio.current?.pause(), [])
}
