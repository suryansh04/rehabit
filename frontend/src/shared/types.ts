export type Hand = 'left' | 'right'

export type DeviceEvent = {
  type: 'tap' | 'hold'
  pad: number
  hand: Hand
  ms: number
}

export type ModeId = 'classic' | 'finger' | 'memory' | 'endurance'

export type SessionResult = {
  mode: ModeId
  hand: Hand
  duration_s: number
  taps: number
  correct: number
  avg_reaction_ms: number
  accuracy: number
  score: number
}

export type Session = SessionResult & {
  id: number
  started_at: string
  mood: number | null
}

export type PublicConfig = {
  patient_name: string
  session_time: string
  reminder_minutes_before: number
  missed_after_minutes: number
  daily_summary_time: string
}
