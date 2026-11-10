import { FULL_ROOM_CONFIRMATION_MS } from '../config.js'
import { ROOM_STATUS } from '../data/auditoriums.js'
import {
  createParticipant,
  extendParticipant,
  isExtensionAvailable,
} from './sessionModel.js'
import { ROOM_MODE } from './store.js'
import { getNow } from './virtualClock.js'

function findRoom(state, roomId) {
  return state.auditoriums.find((room) => room.id === roomId)
}

function findParticipant(state, sessionId) {
  for (const room of state.auditoriums) {
    const participant = room.occupants.find((item) => item.id === sessionId)

    if (participant) return { room, participant }
  }

  return null
}

function isSessionInAnyRoom(state, sessionId) {
  return state.auditoriums.some((room) =>
    room.occupants.some((participant) => participant.id === sessionId),
  )
}

function isRoomFull(room) {
  return room.occupants.length >= room.capacity
}

function updateRoom(state, roomId, update) {
  return {
    ...state,
    auditoriums: state.auditoriums.map((room) =>
      room.id === roomId ? { ...room, ...update } : room,
    ),
  }
}

function pickMainUserId(occupants) {
  if (occupants.length === 0) return null

  return occupants.reduce((earliest, participant) =>
    participant.joinedAt < earliest.joinedAt ? participant : earliest,
  ).id
}

function createSessionParticipant(state, sessionId) {
  const session = state.sessions.find((item) => item.id === sessionId)

  return createParticipant({
    id: sessionId,
    name: session ? session.name : sessionId,
    joinedAt: getNow(),
  })
}

export function occupy(state, sessionId, roomId, mode) {
  const room = findRoom(state, roomId)

  if (!room || room.status !== ROOM_STATUS.FREE) return null
  if (room.occupants.length > 0) return null
  if (isSessionInAnyRoom(state, sessionId)) return null
  if (mode !== ROOM_MODE.AVAILABLE && mode !== ROOM_MODE.FULL) return null

  const isFull = mode === ROOM_MODE.FULL

  return updateRoom(state, roomId, {
    status: isFull ? ROOM_STATUS.BUSY : ROOM_STATUS.AVAILABLE,
    mode,
    occupants: [createSessionParticipant(state, sessionId)],
    mainUserId: sessionId,
    requests: [],
    fullTimerEndsAt: isFull ? getNow() + FULL_ROOM_CONFIRMATION_MS : null,
  })
}

export function joinAvailable(state, sessionId, roomId) {
  const room = findRoom(state, roomId)

  if (!room || room.status !== ROOM_STATUS.AVAILABLE) return null
  if (isRoomFull(room)) return null
  if (isSessionInAnyRoom(state, sessionId)) return null

  return updateRoom(state, roomId, {
    occupants: [...room.occupants, createSessionParticipant(state, sessionId)],
  })
}

export function requestJoin(state, sessionId, roomId) {
  const room = findRoom(state, roomId)

  if (!room || room.status !== ROOM_STATUS.BUSY) return null
  if (isRoomFull(room)) return null
  if (isSessionInAnyRoom(state, sessionId)) return null
  if (room.requests.includes(sessionId)) return null

  return updateRoom(state, roomId, {
    requests: [...room.requests, sessionId],
  })
}

export function acceptRequest(state, sessionId, roomId, requestUserId) {
  const room = findRoom(state, roomId)

  if (!room || room.status !== ROOM_STATUS.BUSY) return null
  if (room.mainUserId !== sessionId) return null
  if (!room.requests.includes(requestUserId)) return null
  if (isRoomFull(room)) return null
  if (isSessionInAnyRoom(state, requestUserId)) return null

  return updateRoom(state, roomId, {
    occupants: [...room.occupants, createSessionParticipant(state, requestUserId)],
    requests: room.requests.filter((id) => id !== requestUserId),
  })
}

export function rejectRequest(state, sessionId, roomId, requestUserId) {
  const room = findRoom(state, roomId)

  if (!room || room.mainUserId !== sessionId) return null
  if (!room.requests.includes(requestUserId)) return null

  return updateRoom(state, roomId, {
    requests: room.requests.filter((id) => id !== requestUserId),
  })
}

export function extendSession(state, sessionId) {
  const found = findParticipant(state, sessionId)

  if (!found || !isExtensionAvailable(found.participant, getNow())) return null

  return updateRoom(state, found.room.id, {
    occupants: found.room.occupants.map((participant) =>
      participant.id === sessionId ? extendParticipant(participant) : participant,
    ),
  })
}

export function leave(state, sessionId) {
  const found = findParticipant(state, sessionId)

  if (!found) return null

  const { room } = found
  const occupants = room.occupants.filter(
    (participant) => participant.id !== sessionId,
  )

  if (occupants.length === 0) {
    return updateRoom(state, room.id, {
      status: ROOM_STATUS.FREE,
      mode: null,
      occupants: [],
      mainUserId: null,
      requests: [],
      fullTimerEndsAt: null,
    })
  }

  return updateRoom(state, room.id, {
    occupants,
    mainUserId:
      room.mainUserId === sessionId ? pickMainUserId(occupants) : room.mainUserId,
  })
}
