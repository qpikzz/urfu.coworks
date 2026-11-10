import { FULL_ROOM_MIN_OCCUPANTS } from '../config.js'
import { ROOM_STATUS } from '../data/auditoriums.js'
import { applyDummyDecision, getParticipantEventAt } from './sessionModel.js'
import { ROOM_MODE, getState, setState, subscribe } from './store.js'
import { leave } from './transitions.js'
import {
  getNow,
  getSpeed,
  setSpeed as setClockSpeed,
  startClock,
  stopClock,
} from './virtualClock.js'

let eventTimeoutId = null
let unsubscribeStore = null
let started = false

function decideDueDummies(state, now) {
  let changed = false

  const auditoriums = state.auditoriums.map((room) => {
    let roomChanged = false

    const occupants = room.occupants.map((participant) => {
      const nextParticipant = applyDummyDecision(participant, now)

      if (nextParticipant !== participant) roomChanged = true

      return nextParticipant
    })

    if (!roomChanged) return room

    changed = true
    return { ...room, occupants }
  })

  return changed ? { ...state, auditoriums } : state
}

function confirmFullTimers(state, now) {
  let changed = false

  const auditoriums = state.auditoriums.map((room) => {
    if (room.fullTimerEndsAt == null || now < room.fullTimerEndsAt) return room

    changed = true

    if (
      room.status === ROOM_STATUS.BUSY &&
      room.occupants.length < FULL_ROOM_MIN_OCCUPANTS
    ) {
      return {
        ...room,
        status: ROOM_STATUS.AVAILABLE,
        mode: ROOM_MODE.AVAILABLE,
        fullTimerEndsAt: null,
      }
    }

    return { ...room, fullTimerEndsAt: null }
  })

  return changed ? { ...state, auditoriums } : state
}

function exitExpiredParticipants(state, now) {
  let nextState = state
  let changed = false
  const expiredIds = []

  state.auditoriums.forEach((room) => {
    room.occupants.forEach((participant) => {
      if (now >= participant.endsAt) expiredIds.push(participant.id)
    })
  })

  expiredIds.forEach((participantId) => {
    const leftState = leave(nextState, participantId)

    if (leftState) {
      nextState = leftState
      changed = true
    }
  })

  return changed ? nextState : state
}

export function processDueEvents(state, now) {
  let nextState = decideDueDummies(state, now)

  nextState = confirmFullTimers(nextState, now)
  nextState = exitExpiredParticipants(nextState, now)

  return nextState
}

function getNextEventAt(state, now) {
  let nextAt = Number.POSITIVE_INFINITY

  state.auditoriums.forEach((room) => {
    if (room.fullTimerEndsAt != null) {
      nextAt = Math.min(nextAt, room.fullTimerEndsAt)
    }

    room.occupants.forEach((participant) => {
      nextAt = Math.min(nextAt, getParticipantEventAt(participant))
    })
  })

  if (nextAt === Number.POSITIVE_INFINITY) return null

  return Math.max(nextAt, now)
}

function clearEventTimeout() {
  if (eventTimeoutId === null) return

  clearTimeout(eventTimeoutId)
  eventTimeoutId = null
}

function scheduleNextEvent() {
  if (!started) return

  clearEventTimeout()

  const state = getState()
  const now = getNow()
  const nextAt = getNextEventAt(state, now)

  if (nextAt === null) return

  const delay = Math.max(0, (nextAt - now) / getSpeed())
  eventTimeoutId = setTimeout(handleScheduledEvent, delay)
}

function handleScheduledEvent() {
  eventTimeoutId = null

  if (!started) return

  const now = getNow()
  const state = getState()
  const nextState = processDueEvents(state, now)

  if (nextState !== state) setState(nextState)

  scheduleNextEvent()
}

export function syncTime() {
  const now = getNow()
  const state = getState()
  const nextState = processDueEvents(state, now)

  if (nextState !== state) setState(nextState)

  scheduleNextEvent()
}

export function setTimeSpeed(speed) {
  if (!setClockSpeed(speed)) return false

  setState((state) =>
    state.time.speed === speed
      ? state
      : { ...state, time: { ...state.time, speed } },
  )
  scheduleNextEvent()

  return true
}

export function startTimeEngine() {
  if (started) return

  started = true
  startClock()
  unsubscribeStore = subscribe(scheduleNextEvent)
  syncTime()
}

export function stopTimeEngine() {
  if (!started) return

  started = false
  clearEventTimeout()

  if (unsubscribeStore) {
    unsubscribeStore()
    unsubscribeStore = null
  }

  stopClock()
}
