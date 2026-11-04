import { ROOM_STATUS } from '../data/auditoriums.js'
import { ROOM_MODE } from './store.js'
import { FIVE_MINUTES } from './timers.js'

function getNow(state) {
  return state.time?.now ?? Date.now()
}

function findRoom(state, roomId) {
  return state.auditoriums.find((room) => room.id === roomId)
}

function isSessionInAnyRoom(state, sessionId) {
  return state.auditoriums.some((room) => room.occupantIds.includes(sessionId))
}

function isRoomFull(room) {
  return room.occupantIds.length >= room.capacity
}

function updateRoom(state, roomId, update) {
  return {
    ...state,
    auditoriums: state.auditoriums.map((room) =>
      room.id === roomId ? { ...room, ...update } : room,
    ),
  }
}

function updateSession(state, sessionId, update) {
  return {
    ...state,
    sessions: state.sessions.map((session) =>
      session.id === sessionId ? { ...session, ...update } : session,
    ),
  }
}

function startWork(state, sessionId) {
  return updateSession(state, sessionId, {
    workStartedAt: getNow(state),
    stayPromptAt: null,
  })
}

function clearWork(state, sessionId) {
  return updateSession(state, sessionId, {
    workStartedAt: null,
    stayPromptAt: null,
  })
}

function enterRoom(state, roomId, sessionId, update) {
  const nextState = {
    ...state,
    auditoriums: state.auditoriums.map((room) => {
      if (room.id === roomId) return { ...room, ...update }
      if (!room.requests.includes(sessionId)) return room

      return {
        ...room,
        requests: room.requests.filter((id) => id !== sessionId),
      }
    }),
  }

  return startWork(nextState, sessionId)
}

export function occupy(state, sessionId, roomId, mode) {
  const room = findRoom(state, roomId)

  if (!room || room.status !== ROOM_STATUS.FREE) return null
  if (room.occupantIds.length > 0) return null
  if (isSessionInAnyRoom(state, sessionId)) return null
  if (mode !== ROOM_MODE.AVAILABLE && mode !== ROOM_MODE.FULL) return null

  const isFull = mode === ROOM_MODE.FULL

  return enterRoom(state, roomId, sessionId, {
    status: isFull ? ROOM_STATUS.BUSY : ROOM_STATUS.AVAILABLE,
    mode,
    occupantIds: [sessionId],
    mainUserId: sessionId,
    requests: [],
    fullTimerEndsAt: isFull ? getNow(state) + FIVE_MINUTES : null,
  })
}

export function joinAvailable(state, sessionId, roomId) {
  const room = findRoom(state, roomId)

  if (!room || room.status !== ROOM_STATUS.AVAILABLE) return null
  if (isRoomFull(room)) return null
  if (isSessionInAnyRoom(state, sessionId)) return null

  return enterRoom(state, roomId, sessionId, {
    occupantIds: [...room.occupantIds, sessionId],
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

  return enterRoom(state, roomId, requestUserId, {
    occupantIds: [...room.occupantIds, requestUserId],
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

export function confirmStay(state, sessionId) {
  const session = state.sessions.find((item) => item.id === sessionId)

  if (!session || session.stayPromptAt == null) return null

  const room = state.auditoriums.find((item) =>
    item.occupantIds.includes(sessionId),
  )

  if (!room) return null

  return updateSession(state, sessionId, {
    workStartedAt: getNow(state),
    stayPromptAt: null,
  })
}

export function leave(state, sessionId) {
  const room = state.auditoriums.find((item) =>
    item.occupantIds.includes(sessionId),
  )

  if (!room) return null

  const occupantIds = room.occupantIds.filter((id) => id !== sessionId)
  const nextState = clearWork(state, sessionId)

  if (occupantIds.length === 0) {
    return updateRoom(nextState, room.id, {
      status: ROOM_STATUS.FREE,
      mode: null,
      occupantIds: [],
      mainUserId: null,
      requests: [],
      fullTimerEndsAt: null,
    })
  }

  return updateRoom(nextState, room.id, {
    occupantIds,
    mainUserId: room.mainUserId === sessionId ? occupantIds[0] : room.mainUserId,
  })
}
