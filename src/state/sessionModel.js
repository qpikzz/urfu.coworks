import {
  DUMMY_EXTEND_CHANCE,
  EXTENSION_DURATION_MS,
  EXTENSION_WINDOW_MS,
  SESSION_DURATION_MS,
} from '../config.js'

export function createParticipant({ id, name, joinedAt, dummy = false }) {
  const endsAt = joinedAt + SESSION_DURATION_MS

  return {
    id,
    name,
    joinedAt,
    endsAt,
    dummy,
    nextDecisionAt: dummy ? endsAt - EXTENSION_WINDOW_MS : null,
  }
}

export function isExtensionAvailable(participant, now) {
  if (!participant) return false

  return now >= participant.endsAt - EXTENSION_WINDOW_MS && now <= participant.endsAt
}

export function extendParticipant(participant) {
  return {
    ...participant,
    endsAt: participant.endsAt + EXTENSION_DURATION_MS,
  }
}

export function applyDummyDecision(participant, now, random = Math.random) {
  if (!participant.dummy) return participant
  if (participant.nextDecisionAt == null) return participant
  if (now < participant.nextDecisionAt) return participant

  if (random() < DUMMY_EXTEND_CHANCE) {
    const endsAt = participant.endsAt + EXTENSION_DURATION_MS

    return {
      ...participant,
      endsAt,
      nextDecisionAt: endsAt - EXTENSION_WINDOW_MS,
    }
  }

  return { ...participant, nextDecisionAt: null }
}

export function getParticipantEventAt(participant) {
  if (participant.nextDecisionAt == null) return participant.endsAt

  return Math.min(participant.nextDecisionAt, participant.endsAt)
}
