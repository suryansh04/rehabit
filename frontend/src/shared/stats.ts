import type { ModeId, Session } from './types'

const SCORE_UNITS: Record<ModeId, string> = { classic: '%', finger: '%', memory: 'pads', endurance: 'taps' }

export function scoreUnit(mode: ModeId) {
  return SCORE_UNITS[mode]
}

// "Today, 6:04 PM", "Yesterday, 6:11 PM" or "Mon, 6:02 PM"
export function whenText(iso: string, now = new Date()) {
  const at = new Date(iso)
  const time = at.toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' })
  const day = dayKey(at)
  if (day === dayKey(now)) return `Today, ${time}`
  if (day === dayKey(new Date(now.getTime() - DAY_MS))) return `Yesterday, ${time}`
  return `${at.toLocaleDateString('en-IN', { weekday: 'short' })}, ${time}`
}

export function lastDays(count: number, today = new Date()) {
  return Array.from({ length: count }, (_, i) => new Date(today.getTime() - (count - 1 - i) * DAY_MS))
}

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

export const MOOD_LABELS = ['Very low', 'Low', 'Okay', 'Good', 'Very good']

export function moodLabel(score: number) {
  return MOOD_LABELS[Math.round(score) - 1] ?? '-'
}

export function firstName(fullName: string) {
  return fullName.split(' ')[0] || fullName
}
