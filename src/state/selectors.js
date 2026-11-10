import { ROOM_STATUS } from '../data/auditoriums.js'
import { isExtensionAvailable } from './sessionModel.js'
import { BLOCKS } from './store.js'
import { getNow } from './virtualClock.js'

export const ROOM_BLOCKS = Object.freeze([
  { id: BLOCKS.FREE, status: ROOM_STATUS.FREE, title: 'Свободное' },
  { id: BLOCKS.AVAILABLE, status: ROOM_STATUS.AVAILABLE, title: 'Доступное' },
  { id: BLOCKS.BUSY, status: ROOM_STATUS.BUSY, title: 'Занято' },
])

export function normalizeSearchQuery(query) {
  return String(query ?? '').trim().toLowerCase()
}

export function matchesRoomSearch(room, query) {
  const normalizedQuery = normalizeSearchQuery(query)

  if (normalizedQuery === '') return true

  return room.name.toLowerCase().includes(normalizedQuery)
}

export function compareRooms(a, b) {
  const floorA = a.floor ?? Number.POSITIVE_INFINITY
  const floorB = b.floor ?? Number.POSITIVE_INFINITY

  if (floorA !== floorB) return floorA - floorB

  return a.name.localeCompare(b.name, 'ru')
}

export function sortRooms(rooms) {
  return [...rooms].sort(compareRooms)
}

export function filterRooms(rooms, query) {
  return rooms.filter((room) => matchesRoomSearch(room, query))
}

export function selectSessionRoom(state, sessionId) {
  return (
    state.auditoriums.find((room) =>
      room.occupants.some((participant) => participant.id === sessionId),
    ) ?? null
  )
}

export function selectSessionParticipant(state, sessionId) {
  for (const room of state.auditoriums) {
    const participant = room.occupants.find((item) => item.id === sessionId)

    if (participant) return { room, participant }
  }

  return null
}

export function selectExtensionAvailable(state, sessionId) {
  const found = selectSessionParticipant(state, sessionId)

  return found ? isExtensionAvailable(found.participant, getNow()) : false
}

export function selectRoomParticipants(state, sessionId, roomId) {
  const room = state.auditoriums.find((item) => item.id === roomId)

  if (!room) return []
  if (!room.occupants.some((participant) => participant.id === sessionId)) return []

  return [...room.occupants].sort((a, b) => a.joinedAt - b.joinedAt)
}

export function selectSessionRooms(state, sessionId) {
  const session = state.sessions.find((item) => item.id === sessionId)

  if (!session) return []

  const rooms = state.auditoriums.filter(
    (room) => room.universityId === session.universityId,
  )

  return sortRooms(filterRooms(rooms, session.searchQuery))
}

export function selectRoomBlocks(
  state,
  sessionId,
  { includeFiltered = false } = {},
) {
  const session = state.sessions.find((item) => item.id === sessionId)

  if (!session) return []

  const rooms = sortRooms(
    state.auditoriums.filter(
      (room) => room.universityId === session.universityId,
    ),
  )
  const isSearching = normalizeSearchQuery(session.searchQuery) !== ''

  return ROOM_BLOCKS.map((block) => {
    const blockRooms = rooms.filter((room) => room.status === block.status)
    const matchedRooms = isSearching
      ? blockRooms.filter((room) => matchesRoomSearch(room, session.searchQuery))
      : blockRooms

    return {
      ...block,
      collapsed: Boolean(session.collapsedBlocks[block.id]),
      hidden: isSearching && matchedRooms.length === 0,
      rooms: includeFiltered
        ? blockRooms.map((room) => ({
            ...room,
            matchesSearch:
              !isSearching || matchesRoomSearch(room, session.searchQuery),
          }))
        : matchedRooms,
    }
  }).filter((block) => includeFiltered || !isSearching || block.rooms.length > 0)
}
