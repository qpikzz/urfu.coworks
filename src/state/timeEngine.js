import { ROOM_STATUS } from '../data/auditoriums.js'
import { ROOM_MODE, getState, setState } from './store.js'
import { leave } from './transitions.js'
import { THIRTY_MINUTES, TIME_SPEEDS, TWO_HOURS } from './timers.js'

const TICK_INTERVAL = 100

let intervalId = null
let lastRealNow = Date.now()

function findSessionRoom(state, sessionId) {
  return state.auditoriums.find((room) =>
    room.occupantIds.includes(sessionId),
  )
}

function updateSession(state, sessionId, update) {
  return {
    ...state,
    sessions: state.sessions.map((session) =>
      session.id === sessionId ? { ...session, ...update } : session,
    ),
  }
}

function processRoomTimers(state, now) {
  let changed = false

  const auditoriums = state.auditoriums.map((room) => {
    if (room.fullTimerEndsAt == null || now < room.fullTimerEndsAt) return room

    changed = true

    if (room.status !== ROOM_STATUS.BUSY || room.occupantIds.length >= 2) {
      return { ...room, fullTimerEndsAt: null }
    }

    return {
      ...room,
      status: ROOM_STATUS.AVAILABLE,
      mode: ROOM_MODE.AVAILABLE,
      fullTimerEndsAt: null,
    }
  })

  return changed ? { ...state, auditoriums } : state
}

function processSessionTimers(state, now) {
  const sessionIds = state.sessions.map((session) => session.id)
  let nextState = state

  sessionIds.forEach((sessionId) => {
    const session = nextState.sessions.find((item) => item.id === sessionId)

    if (!session) return

    const room = findSessionRoom(nextState, sessionId)

    if (!room) {
      if (session.workStartedAt != null || session.stayPromptAt != null) {
        nextState = updateSession(nextState, sessionId, {
          workStartedAt: null,
          stayPromptAt: null,
        })
      }
      return
    }

    if (session.stayPromptAt != null) {
      if (now >= session.stayPromptAt + THIRTY_MINUTES) {
        const leftState = leave(nextState, sessionId)
        if (leftState) nextState = leftState
      }
      return
    }

    if (session.workStartedAt == null) return

    const promptAt = session.workStartedAt + TWO_HOURS

    if (now < promptAt) return

    nextState = updateSession(nextState, sessionId, { stayPromptAt: promptAt })

    if (now >= promptAt + THIRTY_MINUTES) {
      const leftState = leave(nextState, sessionId)
      if (leftState) nextState = leftState
    }
  })

  return nextState
}

export function tick() {
  const realNow = Date.now()
  const realDelta = realNow - lastRealNow
  lastRealNow = realNow

  if (realDelta <= 0) return

  const state = getState()
  const now = state.time.now + realDelta * state.time.speed

  let nextState = {
    ...state,
    time: { ...state.time, now },
  }

  nextState = processRoomTimers(nextState, now)
  nextState = processSessionTimers(nextState, now)

  setState(nextState)
}

export function syncTime() {
  if (intervalId === null) return
  tick()
}

export function setTimeSpeed(speed) {
  if (!TIME_SPEEDS.includes(speed)) return false

  lastRealNow = Date.now()
  setState((state) =>
    state.time.speed === speed
      ? state
      : { ...state, time: { ...state.time, speed } },
  )

  return true
}

export function startTimeEngine() {
  if (intervalId !== null) return

  lastRealNow = Date.now()
  intervalId = setInterval(tick, TICK_INTERVAL)
}

export function stopTimeEngine() {
  if (intervalId === null) return

  clearInterval(intervalId)
  intervalId = null
}
