import { DUMMY_JOIN_MAX_AGE_MS } from '../config.js'
import { applyDummyDecision, createParticipant } from '../state/sessionModel.js'
import { getNow } from '../state/virtualClock.js'
import { DUMMY_FIRST_NAMES, SURNAME_INITIALS } from './names.js'
import { SESSIONS } from './sessions.js'

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

const SESSION_NAMES = new Set(SESSIONS.map((session) => session.name))

function getFloor(name) {
  const match = name.match(/\d/)
  return match ? Number(match[0]) : null
}

function shuffle(items) {
  const result = [...items]

  for (let index = result.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1))
    const current = result[index]

    result[index] = result[randomIndex]
    result[randomIndex] = current
  }

  return result
}

function pickSurnameInitial() {
  return SURNAME_INITIALS[Math.floor(Math.random() * SURNAME_INITIALS.length)]
}

function createDummyName(firstName, usedNames) {
  let initial = pickSurnameInitial()

  for (let attempt = 0; attempt < SURNAME_INITIALS.length; attempt += 1) {
    const name = `${firstName} ${initial}.`

    if (!SESSION_NAMES.has(name) && !usedNames.has(name)) return name

    initial = pickSurnameInitial()
  }

  return `${firstName} ${initial}.`
}

function createDummyOccupants(room, now) {
  const firstNames = shuffle(DUMMY_FIRST_NAMES).slice(0, room.people)
  const usedNames = new Set()

  return firstNames.map((firstName, index) => {
    const name = createDummyName(firstName, usedNames)
    usedNames.add(name)

    const joinedAt = now - Math.floor(Math.random() * DUMMY_JOIN_MAX_AGE_MS)
    const participant = createParticipant({
      id: `dummy-${room.name}-${index + 1}`,
      name,
      joinedAt,
      dummy: true,
    })

    return applyDummyDecision(participant, now)
  })
}

function pickMainUserId(occupants) {
  if (occupants.length === 0) return null

  return occupants.reduce((earliest, participant) =>
    participant.joinedAt < earliest.joinedAt ? participant : earliest,
  ).id
}

export function createInitialAuditoriums() {
  const now = getNow()

  return SEED_AUDITORIUMS.map((room) => {
    const occupants = createDummyOccupants(room, now)

    return {
      id: room.name,
      name: room.name,
      universityId: room.universityId,
      floor: getFloor(room.name),
      capacity: room.capacity,
      status: room.status,
      occupants,
      mainUserId: pickMainUserId(occupants),
    }
  })
}
