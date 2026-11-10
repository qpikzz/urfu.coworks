const MINUTE_MS = 60 * 1000

export { MINUTE_MS }

export const SESSION_DURATION_MS = 2 * 60 * MINUTE_MS
export const EXTENSION_DURATION_MS = 2 * 60 * MINUTE_MS
export const EXTENSION_WINDOW_MS = 30 * MINUTE_MS
export const FULL_ROOM_CONFIRMATION_MS = 5 * MINUTE_MS
export const FULL_ROOM_MIN_OCCUPANTS = 2
export const DUMMY_JOIN_MAX_AGE_MS = 115 * MINUTE_MS
export const DUMMY_EXTEND_CHANCE = 0.45

export const TIME_SPEEDS = Object.freeze([1, 5, 200])
export const DEFAULT_TIME_SPEED = 1
export const CLOCK_TICK_MS = 250
export const ROOM_TIMER_UPDATE_MS = 100
