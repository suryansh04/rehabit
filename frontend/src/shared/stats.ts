import type { Session } from './types'

const DAY_MS = 24 * 60 * 60 * 1000

// Local calendar day, matching the naive local timestamps the backend stores.
export function dayKey(date: Date) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export function average(values: number[]) {
  return values.length ? values.reduce((a, b) => a + b, 0) / values.length : 0
}

// Days in a row with at least one session. Today counts if played, otherwise we start from yesterday.
export function streakDays(sessions: Session[], today = new Date()) {
  const played = new Set(sessions.map((s) => s.started_at.slice(0, 10)))
  let day = played.has(dayKey(today)) ? today : new Date(today.getTime() - DAY_MS)
  let streak = 0
  while (played.has(dayKey(day))) {
    streak += 1
    day = new Date(day.getTime() - DAY_MS)
  }
  return streak
}

// "18:00" from .env reads better as "6:00 PM" for the patient.
export function clockTime(hhmm: string) {
  const [h, m] = hhmm.split(':').map(Number)
  if (Number.isNaN(h) || Number.isNaN(m)) return hhmm
  return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${h < 12 ? 'AM' : 'PM'}`
}

export function firstName(fullName: string) {
  return fullName.split(' ')[0] || fullName
}
