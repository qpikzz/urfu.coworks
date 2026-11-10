import { createInitialAuditoriums, ROOM_STATUS } from '../data/auditoriums.js'
import { SESSIONS } from '../data/sessions.js'
import { UNIVERSITIES } from '../data/universities.js'
import { DEFAULT_TIME_SPEED } from '../config.js'

export const BLOCKS = Object.freeze({
  FREE: 'free',
  AVAILABLE: 'available',
  BUSY: 'busy',
})

export const ROOM_MODE = Object.freeze({
  AVAILABLE: 'available',
  FULL: 'full',
})

const DEFAULT_UNIVERSITY_ID = UNIVERSITIES[0].id

const DEFAULT_COLLAPSED_BLOCKS = Object.freeze({
  [BLOCKS.FREE]: false,
  [BLOCKS.AVAILABLE]: false,
  [BLOCKS.BUSY]: true,
})

function getRoomMode(status) {
  if (status === ROOM_STATUS.AVAILABLE) return ROOM_MODE.AVAILABLE
  if (status === ROOM_STATUS.BUSY) return ROOM_MODE.FULL
  return null
}

function createSessionState(session) {
  return {
    id: session.id,
    name: session.name,
    universityId: DEFAULT_UNIVERSITY_ID,
    collapsedBlocks: { ...DEFAULT_COLLAPSED_BLOCKS },
    searchQuery: '',
  }
}

export function createInitialState() {
  return {
    time: {
      speed: DEFAULT_TIME_SPEED,
    },
    auditoriums: createInitialAuditoriums().map((auditorium) => ({
      ...auditorium,
      mode: getRoomMode(auditorium.status),
      requests: [],
      fullTimerEndsAt: null,
    })),
    sessions: SESSIONS.map(createSessionState),
  }
}

let state = createInitialState()
const listeners = new Set()

export function getState() {
  return state
}

export function subscribe(listener) {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

export function setState(updater) {
  const nextState = typeof updater === 'function' ? updater(state) : updater

  if (nextState === state) return

  state = nextState
  listeners.forEach((listener) => listener())
}

export function resetState() {
  setState(createInitialState())
}
