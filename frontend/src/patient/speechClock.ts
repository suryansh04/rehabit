import type { AudioAlignmentEvent } from '@elevenlabs/react'

// The audio track plays a little after its timing data arrives.
const PLAYBACK_DELAY_MS = 150

// ElevenLabs sends the start time of every character Yash says, one audio chunk at a time.
// Chunks play back to back, so we lay them on one timeline and can ask how much he has said.
export class SpeechClock {
  private starts: number[] = []
  private end = 0

  reset() {
    this.starts = []
    this.end = 0
  }

  add({ char_start_times_ms, char_durations_ms }: AudioAlignmentEvent) {
    if (!char_start_times_ms.length) return
    const begin = Math.max(performance.now() + PLAYBACK_DELAY_MS, this.end)
    char_start_times_ms.forEach((ms) => this.starts.push(begin + ms))
    this.end = begin + (char_start_times_ms.at(-1) ?? 0) + (char_durations_ms.at(-1) ?? 0)
  }

  // characters spoken so far, and whether the last queued audio has finished
  read(now: number) {
    let spoken = 0
    while (spoken < this.starts.length && this.starts[spoken] <= now) spoken++
    return { spoken, started: this.starts.length > 0, finished: this.starts.length > 0 && now >= this.end }
  }
}
