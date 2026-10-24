// Same lines as CLAUDE.md. make_clips.py turns each one into public/clips/<id>.wav.
export const COACH_LINES = {
  start: 'Chaliye shuru karte hain!',
  streak: 'Bahut badhiya! Aise hi karte raho.',
  miss: 'Koi baat nahi, agla try karo.',
  last5: 'Bas 5 aur! Aap kar sakte ho.',
  end: 'Shabash! Aaj ka session poora hua.',
} as const

export type ClipId = keyof typeof COACH_LINES

// n changes on every cue, so the same clip can play twice in a row.
export type Cue = { clip: ClipId; n: number }

export const STREAK_EVERY = 5
export const LAST_STRETCH = 5
export const MISS_CUE_GAP_MS = 4000
