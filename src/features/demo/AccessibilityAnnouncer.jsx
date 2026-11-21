import { useEffect, useRef, useState } from 'react'
import { ROOM_STATUS } from '../../data/auditoriums.js'

const STATUS_LABELS = {
  [ROOM_STATUS.FREE]: 'Свободное',
  [ROOM_STATUS.AVAILABLE]: 'Доступное',
  [ROOM_STATUS.BUSY]: 'Занято',
}

function getSessionName(state, sessionId) {
  const session = state.sessions.find((item) => item.id === sessionId)
  return session ? session.name : sessionId
}

export default function AccessibilityAnnouncer({ state, sessionId, active }) {
  const [message, setMessage] = useState('')
  const previousRef = useRef(null)
  const lastMessageRef = useRef('')

  useEffect(() => {
    const session = state.sessions.find((item) => item.id === sessionId)
    const rooms = session
      ? state.auditoriums.filter(
          (room) => room.universityId === session.universityId,
        )
      : []
    const statuses = new Map(rooms.map((room) => [room.id, room.status]))
    const sessionRoom = state.auditoriums.find((room) =>
      room.occupants.some((participant) => participant.id === sessionId),
    )
    const isMain = Boolean(sessionRoom && sessionRoom.mainUserId === sessionId)
    const requests = new Set(isMain ? sessionRoom.requests : [])
    const previous = previousRef.current

    if (!active) {
      previousRef.current = { sessionId, statuses, requests }
      setMessage('')
      return
    }

    if (!previous || previous.sessionId !== sessionId) {
      previousRef.current = { sessionId, statuses, requests }
      return
    }

    const parts = []

    rooms.forEach((room) => {
      const previousStatus = previous.statuses.get(room.id)

      if (previousStatus != null && previousStatus !== room.status) {
        parts.push(`Аудитория ${room.name}: ${STATUS_LABELS[room.status]}`)
      }
    })

    const newRequests = [...requests].filter(
      (requestId) => !previous.requests.has(requestId),
    )

    if (newRequests.length > 0) {
      const names = newRequests.map((requestId) =>
        getSessionName(state, requestId),
      )

      parts.push(
        newRequests.length === 1
          ? `Новая заявка на присоединение: ${names[0]}`
          : `Новые заявки на присоединение: ${names.join(', ')}`,
      )
    }

    previousRef.current = { sessionId, statuses, requests }

    if (parts.length === 0) return

    const text = parts.join('. ')
    const nextMessage =
      text === lastMessageRef.current ? `${text}\u200B` : text

    lastMessageRef.current = nextMessage
    setMessage(nextMessage)
  }, [state, sessionId, active])

  return (
    <p className="visually-hidden" role="status" aria-live="polite">
      {message}
    </p>
  )
}
