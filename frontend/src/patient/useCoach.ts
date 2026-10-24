import { useEffect, useState } from 'react'
import type { ClipId, Cue } from './coach'

const clipUrl = (clip: ClipId) => `/clips/${clip}.mp3`

// What Ankur's cloud shows: the line being spoken, or thinking dots while a line waits.
export type Voice = { speaking: ClipId | null; key: number; waiting: boolean }

// One player for the whole app, so a clip keeps playing when the screen changes
// (the end line runs on into the Done screen).
let playing: HTMLAudioElement | null = null
let waiting: ClipId | null = null
let voice: Voice = { speaking: null, key: 0, waiting: false }
const listeners = new Set<(voice: Voice) => void>()

function publish(next: Voice) {
  voice = next
  listeners.forEach((listener) => listener(voice))
}

function finished() {
  playing = null
  const next = waiting
  waiting = null
  if (next) start(next)
}

function start(clip: ClipId) {
  const audio = new Audio(clipUrl(clip))
  playing = audio
  publish({ speaking: clip, key: voice.key + 1, waiting: false })
  audio.onended = finished
  audio.play().catch((error) => {
    // the line still shows in the cloud, so the game never gets stuck on a silent clip
    console.warn(`Coach clip ${clip} did not play:`, error)
    finished()
  })
}

// Never cut a line short. A cue that comes mid-line waits for it to finish;
// only the newest waiting cue is kept, so lines do not pile up.
function playClip(clip: ClipId) {
  if (!playing) return start(clip)
  waiting = clip
  publish({ ...voice, waiting: true })
}

export function useCoach(cue: Cue | null): Voice {
  const [current, setCurrent] = useState(voice)

  useEffect(() => {
    listeners.add(setCurrent)
    return () => {
      listeners.delete(setCurrent)
    }
  }, [])

  useEffect(() => {
    if (cue) playClip(cue.clip)
  }, [cue])

  return current
}
