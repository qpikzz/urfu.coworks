export const ROOM_STATUS = Object.freeze({
  FREE: 0,
  AVAILABLE: 1,
  BUSY: 2,
})

const SEED_AUDITORIUMS = [
  { name: 'K111', people: 0, capacity: 6, status: ROOM_STATUS.FREE, mainUserId: null, universityId: 'irit' },
  { name: 'K110', people: 2, capacity: 6, status: ROOM_STATUS.AVAILABLE, mainUserId: null, universityId: 'irit' },
  { name: 'K109', people: 4, capacity: 6, status: ROOM_STATUS.BUSY, mainUserId: 'User19', universityId: 'irit' },
  { name: 'K108', people: 0, capacity: 4, status: ROOM_STATUS.FREE, mainUserId: null, universityId: 'irit' },
  { name: 'K116', people: 1, capacity: 8, status: ROOM_STATUS.AVAILABLE, mainUserId: null, universityId: 'irit' },
  { name: 'K115', people: 0, capacity: 6, status: ROOM_STATUS.FREE, mainUserId: null, universityId: 'irit' },
  { name: 'K114', people: 1, capacity: 6, status: ROOM_STATUS.AVAILABLE, mainUserId: null, universityId: 'irit' },
  { name: 'K113', people: 0, capacity: 6, status: ROOM_STATUS.FREE, mainUserId: null, universityId: 'irit' },
]

function getFloor(name) {
  const match = name.match(/\d/)
  return match ? Number(match[0]) : null
}

function createOccupantIds(room) {
  const occupantIds = room.mainUserId ? [room.mainUserId] : []

  for (let index = occupantIds.length; index < room.people; index += 1) {
    occupantIds.push(`guest-${room.name.toLowerCase()}-${index + 1}`)
  }

  return occupantIds
}

export function createInitialAuditoriums() {
  return SEED_AUDITORIUMS.map((room) => ({
    id: room.name,
    name: room.name,
    universityId: room.universityId,
    floor: getFloor(room.name),
    capacity: room.capacity,
    status: room.status,
    occupantIds: createOccupantIds(room),
    mainUserId: room.mainUserId,
  }))
}
