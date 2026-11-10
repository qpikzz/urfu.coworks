import { ROOM_STATUS } from '../../data/auditoriums.js'
import {
  acceptJoinRequest,
  leaveRoom,
  rejectJoinRequest,
} from '../../state/actions.js'
import { selectSessionRoom } from '../../state/selectors.js'
import { getNow } from '../../state/virtualClock.js'
import { FULL_ROOM_CONFIRMATION_MS } from '../../config.js'
import { useStore } from '../../state/useStore.js'
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

function RequestItem({ name, onAccept, onReject }) {
  return (
    <li className="room-screen__request-item">
      <div className="room-screen__request-clip">
        <div className="room-screen__request">
          <span className="room-screen__request-name">{name}</span>
          <button
            className="room-screen__request-action"
            type="button"
            onClick={onAccept}
          >
            принять
          </button>
          <button
            className="room-screen__request-action room-screen__request-action--muted"
            type="button"
            onClick={onReject}
          >
            отклонить
          </button>
        </div>
      </div>
    </li>
  )
}

export default function RoomScreen({ sessionId, onBack, entering }) {
  const state = useStore()
  const room = selectSessionRoom(state, sessionId)

  if (!room) return null

  const isMain = room.mainUserId === sessionId
  const now = getNow()
  const timerRemaining =
    room.fullTimerEndsAt == null ? null : Math.max(0, room.fullTimerEndsAt - now)
  const timerProgress =
    timerRemaining === null
      ? null
      : Math.min(1, timerRemaining / FULL_ROOM_CONFIRMATION_MS)
  const timerDuration =
    timerRemaining === null
      ? null
      : Math.max(0.001, timerRemaining / state.time.speed / 1000)

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

      <div className="room-screen__body">
        <section className="room-screen__summary" aria-label="Информация об аудитории">
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

        {timerDuration !== null && (
          <div
            className="room-screen__timer"
            role="progressbar"
            aria-label="Таймер 5 минут"
            aria-valuemin="0"
            aria-valuemax="100"
            aria-valuenow={Math.round(timerProgress * 100)}
          >
            <span
              key={`${room.id}-${room.fullTimerEndsAt}-${state.time.speed}`}
              className="room-screen__timer-bar"
              style={{ animationDuration: `${timerDuration}s` }}
            />
          </div>
        )}

        {isMain && (
          <section
            className="room-screen__requests"
            aria-labelledby="room-screen-requests-title"
          >
            <h3
              className="room-screen__requests-title"
              id="room-screen-requests-title"
            >
              Заявки на присоединение
            </h3>
            {room.requests.length === 0 ? (
              <p className="room-screen__empty">Заявок пока нет</p>
            ) : (
              <ul className="room-screen__request-list">
                {room.requests.map((requestUserId) => (
                  <RequestItem
                    key={requestUserId}
                    name={getSessionName(state, requestUserId)}
                    onAccept={() =>
                      acceptJoinRequest(sessionId, room.id, requestUserId)
                    }
                    onReject={() =>
                      rejectJoinRequest(sessionId, room.id, requestUserId)
                    }
                  />
                ))}
              </ul>
            )}
          </section>
        )}

        <button
          className="room-screen__leave"
          type="button"
          onClick={handleLeave}
        >
          Покинуть
        </button>
      </div>
    </div>
  )
}
