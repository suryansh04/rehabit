import { useEffect } from 'react'
import type { ClipId, Cue } from './coach'

const clipUrl = (clip: ClipId) => `/clips/${clip}.mp3`

// One player for the whole app, so a clip keeps playing when the screen changes
// (the end line runs on into the Done screen).
let playing: HTMLAudioElement | null = null
let waiting: ClipId | null = null

function start(clip: ClipId) {
  const audio = new Audio(clipUrl(clip))
  playing = audio
  audio.onended = () => {
    playing = null
    const next = waiting
    waiting = null
    if (next) start(next)
  }
  audio.play().catch((error) => {
    playing = null
    console.warn(`Coach clip ${clip} did not play:`, error)
  })
}

// Never cut a line short. A cue that comes mid-line waits for it to finish;
// only the newest waiting cue is kept, so lines do not pile up.
function playClip(clip: ClipId) {
  if (playing) {
    waiting = clip
    return
  }
  start(clip)
}

export function useCoach(cue: Cue | null) {
  useEffect(() => {
    if (cue) playClip(cue.clip)
  }, [cue])
}
