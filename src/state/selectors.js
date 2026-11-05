import { ROOM_STATUS } from '../data/auditoriums.js'
import { BLOCKS } from './store.js'

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
    state.auditoriums.find((room) => room.occupantIds.includes(sessionId)) ??
    null
  )
}

export function selectSessionRooms(state, sessionId) {
  const session = state.sessions.find((item) => item.id === sessionId)

  if (!session) return []

  const rooms = state.auditoriums.filter(
    (room) => room.universityId === session.universityId,
  )

  return sortRooms(filterRooms(rooms, session.searchQuery))
}

export function selectRoomBlocks(state, sessionId) {
  const session = state.sessions.find((item) => item.id === sessionId)

  if (!session) return []

  const rooms = selectSessionRooms(state, sessionId)
  const isSearching = normalizeSearchQuery(session.searchQuery) !== ''

  return ROOM_BLOCKS.map((block) => ({
    ...block,
    collapsed: Boolean(session.collapsedBlocks[block.id]),
    rooms: rooms.filter((room) => room.status === block.status),
  })).filter((block) => !isSearching || block.rooms.length > 0)
}
