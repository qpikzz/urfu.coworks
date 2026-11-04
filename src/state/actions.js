import { getState, setState } from './store.js'
import { syncTime } from './timeEngine.js'
import {
  acceptRequest,
  confirmStay as confirmStayTransition,
  joinAvailable,
  leave,
  occupy,
  rejectRequest,
  requestJoin,
} from './transitions.js'

function run(transition, ...args) {
  syncTime()

  const nextState = transition(getState(), ...args)

  if (!nextState) return false

  setState(nextState)
  return true
}

export function occupyRoom(sessionId, roomId, mode) {
  return run(occupy, sessionId, roomId, mode)
}

export function joinAvailableRoom(sessionId, roomId) {
  return run(joinAvailable, sessionId, roomId)
}

export function requestJoinRoom(sessionId, roomId) {
  return run(requestJoin, sessionId, roomId)
}

export function acceptJoinRequest(sessionId, roomId, requestUserId) {
  return run(acceptRequest, sessionId, roomId, requestUserId)
}

export function rejectJoinRequest(sessionId, roomId, requestUserId) {
  return run(rejectRequest, sessionId, roomId, requestUserId)
}

export function leaveRoom(sessionId) {
  return run(leave, sessionId)
}

export function continueWork(sessionId) {
  return run(confirmStayTransition, sessionId)
}
