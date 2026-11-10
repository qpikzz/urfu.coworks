import { useEffect, useState } from 'react'
import { ROOM_STATUS } from '../../data/auditoriums.js'
import {
  acceptJoinRequest,
  extendSession,
  leaveRoom,
  rejectJoinRequest,
} from '../../state/actions.js'
import {
  selectRoomParticipants,
  selectSessionRoom,
} from '../../state/selectors.js'
import { isExtensionAvailable } from '../../state/sessionModel.js'
import { getNow } from '../../state/virtualClock.js'
import {
  FULL_ROOM_CONFIRMATION_MS,
  FULL_ROOM_MIN_OCCUPANTS,
  MINUTE_MS,
  ROOM_TIMER_UPDATE_MS,
} from '../../config.js'
import { useStore, useVirtualClockMinute } from '../../state/useStore.js'
import RoomCount from './RoomCount.jsx'
import './coworkings.css'

const STATUS_LABELS = {
  [ROOM_STATUS.FREE]: 'Свободное',
  [ROOM_STATUS.AVAILABLE]: 'Доступное',
  [ROOM_STATUS.BUSY]: 'Занято',
}

const STATUS_MODIFIERS = {
  [ROOM_STATUS.FREE]: 'free',
  [ROOM_STATUS.AVAILABLE]: 'available',
  [ROOM_STATUS.BUSY]: 'busy',
}

function getSessionName(state, sessionId) {
  const session = state.sessions.find((item) => item.id === sessionId)
  return session ? session.name : sessionId
}

function getInitials(name) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase())
    .join('')
}

function padNumber(value) {
  return String(value).padStart(2, '0')
}

function formatClockTime(time) {
  const date = new Date(time)
  return `${padNumber(date.getHours())}:${padNumber(date.getMinutes())}`
}

function formatRemaining(remainingMs) {
  const totalMinutes = Math.max(0, Math.ceil(remainingMs / MINUTE_MS))
  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60

  if (hours > 0 && minutes > 0) return `${hours} ч ${minutes} мин`
  if (hours > 0) return `${hours} ч`

  return `${minutes} мин`
}

function formatCountdown(remainingMs) {
  const totalSeconds = Math.max(0, Math.ceil(remainingMs / 1000))
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60

  return `${padNumber(minutes)}:${padNumber(seconds)}`
}

function getPeopleWord(count) {
  const mod10 = count % 10
  const mod100 = count % 100

  if (mod10 === 1 && mod100 !== 11) return 'человек'
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return 'человека'

  return 'человек'
}

function Avatar({ name }) {
  return (
    <span className="room-screen__avatar" aria-hidden="true">
      {getInitials(name)}
    </span>
  )
}

function TimerBar({ progress, duration }) {
  const [startProgress] = useState(progress)
  const [startDuration] = useState(duration)

  return (
    <span
      className="room-screen__timer-bar"
      style={{
        '--timer-progress': startProgress,
        animationDuration: `${startDuration}s`,
      }}
    />
  )
}

function RoomConfirmationTimer({ room, speed }) {
  const [now, setNow] = useState(() => getNow())

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setNow(getNow())
    }, ROOM_TIMER_UPDATE_MS)

    return () => window.clearInterval(intervalId)
  }, [])

  const remaining = Math.max(0, room.fullTimerEndsAt - now)

  if (remaining <= 0) return null

  const progress = Math.min(1, remaining / FULL_ROOM_CONFIRMATION_MS)
  const duration = remaining / speed / 1000

  return (
    <section className="room-screen__timer" role="timer" aria-live="off">
      <p className="room-screen__timer-text">
        {`До исхода таймера в комнате должно находиться минимум ${FULL_ROOM_MIN_OCCUPANTS} ${getPeopleWord(FULL_ROOM_MIN_OCCUPANTS)}, иначе её статус будет изменён на «Доступно»`}
      </p>
      <div className="room-screen__timer-value">
        {formatCountdown(remaining)}
      </div>
      <div className="room-screen__timer-track" aria-hidden="true">
        <TimerBar
          key={`${room.fullTimerEndsAt}-${speed}`}
          progress={progress}
          duration={duration}
        />
      </div>
    </section>
  )
}

function RequestItem({ name, onAccept, onReject }) {
  return (
    <li className="room-screen__row">
      <Avatar name={name} />
      <span className="room-screen__person-name">{name}</span>
      <div className="room-screen__request-actions">
        <button
          className="room-screen__icon-button"
          type="button"
          onClick={onAccept}
          aria-label={`Принять ${name}`}
        >
          <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
            <path
              d="m5 12.5 4.5 4.5L19 7.5"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
        <button
          className="room-screen__icon-button room-screen__icon-button--muted"
          type="button"
          onClick={onReject}
          aria-label={`Отклонить ${name}`}
        >
          <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
            <path
              d="M6 6l12 12M18 6 6 18"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
        </button>
      </div>
    </li>
  )
}

function ParticipantItem({
  participant,
  isSelf,
  isMain,
  now,
  canExtend,
  onExtend,
}) {
  const remaining = Math.max(0, participant.endsAt - now)

  return (
    <li
      className={`room-screen__row${isSelf ? ' room-screen__row--self' : ''}`}
    >
      <Avatar name={participant.name} />
      <div className="room-screen__person">
        <div className="room-screen__person-head">
          <span className="room-screen__person-name">
            {participant.name}
          </span>
          {isSelf && <span className="room-screen__chip">Вы</span>}
          {isMain && <span className="room-screen__chip">Главный</span>}
        </div>
        <span className="room-screen__meta">
          {`с ${formatClockTime(participant.joinedAt)} до ${formatClockTime(participant.endsAt)}`}
        </span>
        {isSelf && (
          <span className="room-screen__remaining">
            {`Осталось ${formatRemaining(remaining)}`}
          </span>
        )}
      </div>
      {isSelf && canExtend && (
        <button
          className="room-screen__extend"
          type="button"
          onClick={onExtend}
          aria-label={`Продлить сессию ${participant.name}`}
        >
          Продлить
        </button>
      )}
    </li>
  )
}

export default function RoomScreen({ sessionId, onBack, entering }) {
  const state = useStore()
  useVirtualClockMinute()
  const room = selectSessionRoom(state, sessionId)

  if (!room) return null

  const now = getNow()
  const isMain = room.mainUserId === sessionId
  const participants = selectRoomParticipants(state, sessionId, room.id)
  const sortedParticipants = [...participants].sort((a, b) => {
    if (a.id === room.mainUserId) return -1
    if (b.id === room.mainUserId) return 1
    return a.joinedAt - b.joinedAt
  })
  const selfParticipant = participants.find(
    (participant) => participant.id === sessionId,
  )
  const canExtend = selfParticipant
    ? isExtensionAvailable(selfParticipant, now)
    : false
  const showRequests = isMain && room.status === ROOM_STATUS.BUSY
  const showTimer =
    room.status === ROOM_STATUS.BUSY && room.fullTimerEndsAt != null

  function handleLeave() {
    leaveRoom(sessionId)
    onBack()
  }

  return (
    <div className={`room-screen${entering ? ' room-screen--enter' : ''}`}>
      <header className="room-screen__header">
        <button className="room-screen__back" type="button" onClick={onBack}>
          <svg
            className="room-screen__back-icon"
            viewBox="0 0 24 24"
            aria-hidden="true"
            focusable="false"
          >
            <path
              d="M14.5 5.5 8 12l6.5 6.5"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <span>Назад</span>
        </button>
        <h2 className="room-screen__title">{room.name}</h2>
      </header>

      <div
        className="room-screen__body"
        tabIndex={0}
        aria-label="Содержимое экрана аудитории"
      >
        <section
          className="room-screen__summary"
          aria-label="Информация об аудитории"
        >
          <span
            className={`room-screen__status room-screen__status--${STATUS_MODIFIERS[room.status]}`}
            aria-label={STATUS_LABELS[room.status]}
            role="img"
          />
          <span className="room-screen__status-label">
            {STATUS_LABELS[room.status]}
          </span>
          <RoomCount
            className="room-screen__count"
            value={room.occupants.length}
            capacity={room.capacity}
          />
        </section>

        {showTimer && (
          <RoomConfirmationTimer room={room} speed={state.time.speed} />
        )}

        {showRequests && (
          <section
            className="room-screen__block"
            aria-labelledby="room-screen-requests-title"
          >
            <h3
              className="room-screen__block-title"
              id="room-screen-requests-title"
            >
              <span>Заявки на присоединение</span>
              <span className="room-screen__block-count">
                {room.requests.length}
              </span>
            </h3>
            {room.requests.length === 0 ? (
              <p className="room-screen__empty">Заявок пока нет</p>
            ) : (
              <ul className="room-screen__list">
                {room.requests.map((requestUserId) => {
                  const name = getSessionName(state, requestUserId)

                  return (
                    <RequestItem
                      key={requestUserId}
                      name={name}
                      onAccept={() =>
                        acceptJoinRequest(sessionId, room.id, requestUserId)
                      }
                      onReject={() =>
                        rejectJoinRequest(sessionId, room.id, requestUserId)
                      }
                    />
                  )
                })}
              </ul>
            )}
          </section>
        )}

        <section
          className="room-screen__block"
          aria-labelledby="room-screen-participants-title"
        >
          <h3
            className="room-screen__block-title"
            id="room-screen-participants-title"
          >
            <span>Участники</span>
            <span className="room-screen__block-count">
              {sortedParticipants.length}
            </span>
          </h3>
          <ul className="room-screen__list">
            {sortedParticipants.map((participant) => (
              <ParticipantItem
                key={participant.id}
                participant={participant}
                isSelf={participant.id === sessionId}
                isMain={participant.id === room.mainUserId}
                now={now}
                canExtend={canExtend && participant.id === sessionId}
                onExtend={() => extendSession(sessionId)}
              />
            ))}
          </ul>
        </section>
      </div>

      <button
        className="room-screen__leave"
        type="button"
        onClick={handleLeave}
      >
        Покинуть
      </button>
    </div>
  )
}
