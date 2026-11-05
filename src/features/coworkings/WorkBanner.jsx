import { leaveRoom } from '../../state/actions.js'
import { selectSessionRoom } from '../../state/selectors.js'
import { useStore } from '../../state/useStore.js'
import './coworkings.css'

export default function WorkBanner({ sessionId, onOpen }) {
  const state = useStore()
  const room = selectSessionRoom(state, sessionId)

  if (!room) return null

  return (
    <div className="work-banner" role="status" aria-live="polite">
      <button
        className="work-banner__open"
        type="button"
        onClick={onOpen}
        aria-label={`Открыть экран аудитории ${room.name}`}
      >
        <svg
          className="work-banner__icon"
          viewBox="0 0 24 24"
          aria-hidden="true"
          focusable="false"
        >
          <circle
            cx="12"
            cy="12"
            r="9"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
          />
          <path
            d="M12 11v5"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
          <circle cx="12" cy="7.75" r="1.1" fill="currentColor" />
        </svg>
        <span className="work-banner__text">Вы работаете в {room.name}</span>
      </button>
      <button
        className="work-banner__leave"
        type="button"
        onClick={() => leaveRoom(sessionId)}
      >
        Покинуть
      </button>
    </div>
  )
}
