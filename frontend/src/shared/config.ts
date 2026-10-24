// The Vite proxy forwards /api and /ws to the backend, so paths stay relative.
export const API_URL = ''
export const WS_URL = `${location.protocol === 'https:' ? 'wss' : 'ws'}://${location.host}/ws/game`

export const PALM_PAD = 6
export const FINGER_PADS = [1, 2, 3, 4, 5]
export const ALL_PADS = [...FINGER_PADS, PALM_PAD]

export const HOLD_MS = 2000
export const RECONNECT_MS = 1000

export const TAPS_PER_GAME = 20
export const TAP_TIMEOUT_MS = 3000
export const ENDURANCE_SECONDS = 60
export const MEMORY_START_LENGTH = 3
export const MEMORY_MAX_MISTAKES = 2
export const MEMORY_STEP_MS = 600
export const FEEDBACK_MS = 350
