// Same lines as CLAUDE.md. Each one is recorded once on ElevenLabs as public/clips/<id>.mp3.
export const COACH_LINES = {
  start: 'Chaliye shuru karte hain!',
  streak: 'Bohot badhiya!',
  miss: 'Koi baat nahi, agla try karo.',
  last5: 'Almost done! Aap toh superstar ho!',
  end: 'Wohoo! Session done! Kal phir milte hain!',
} as const

export type ClipId = keyof typeof COACH_LINES

// n changes on every cue, so the same clip can play twice in a row.
export type Cue = { clip: ClipId; n: number }

export const STREAK_EVERY = 5
export const LAST_STRETCH = 5
export const MISS_CUE_GAP_MS = 4000
