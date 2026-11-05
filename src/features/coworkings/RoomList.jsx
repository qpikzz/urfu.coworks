import { useEffect, useRef, useState } from 'react'
import { ROOM_STATUS } from '../../data/auditoriums.js'
import {
  joinAvailableRoom,
  occupyRoom,
  requestJoinRoom,
  setSessionSearch,
  toggleSessionBlock,
} from '../../state/actions.js'
import { ROOM_MODE } from '../../state/store.js'
import { selectRoomBlocks } from '../../state/selectors.js'
import { useStore } from '../../state/useStore.js'
import './coworkings.css'

const STATUS_LABELS = {
  [ROOM_STATUS.FREE]: 'Свободное',
  [ROOM_STATUS.AVAILABLE]: 'Доступное',
  [ROOM_STATUS.BUSY]: 'Занято',
}

const ROOM_ACTIONS = {
  [ROOM_STATUS.FREE]: 'Занять',
  [ROOM_STATUS.AVAILABLE]: 'Записаться',
  [ROOM_STATUS.BUSY]: 'Присоединиться',
}

function RoomBlock({ block, sessionId, isWorking, onRoomAction }) {
  const scrollRef = useRef(null)
  const [showFade, setShowFade] = useState(false)
  const headingId = `room-block-${sessionId}-${block.id}`
  const isLimited = block.rooms.length >= 6

  useEffect(() => {
    const scrollElement = scrollRef.current

    if (!scrollElement || !isLimited || block.collapsed) {
      setShowFade(false)
      return undefined
    }

    function updateFade() {
      const hasMoreContent =
        scrollElement.scrollTop + scrollElement.clientHeight <
        scrollElement.scrollHeight - 1
      setShowFade(hasMoreContent)
    }

    updateFade()
    scrollElement.addEventListener('scroll', updateFade, { passive: true })

    return () => {
      scrollElement.removeEventListener('scroll', updateFade)
    }
  }, [block.collapsed, block.rooms.length, isLimited])

  return (
    <section className="room-block">
      <button
        className="room-block__toggle"
        type="button"
        aria-expanded={!block.collapsed}
        aria-controls={`${headingId}-rooms`}
        onClick={() => toggleSessionBlock(sessionId, block.id)}
      >
        <span
          className={`room-block__chevron${block.collapsed ? '' : ' room-block__chevron--expanded'}`}
          aria-hidden="true"
        />
        <span id={headingId}>{block.title}</span>
      </button>
      {!block.collapsed && (
        <div className="room-block__scroll-frame">
          <div
            ref={scrollRef}
            className={`room-block__scroll${isLimited ? ' room-block__scroll--limited' : ''}`}
            id={`${headingId}-rooms`}
          >
            <ul className="room-block__rooms">
              {block.rooms.map((room) => {
                const isFull = room.occupantIds.length >= room.capacity
                const hasRequested = room.requests.includes(sessionId)

                return (
                  <li className="room-row" key={room.id}>
                    <span
                      className={`room-row__status room-row__status--${block.id}`}
                      aria-label={STATUS_LABELS[room.status]}
                      role="img"
                    />
                    <span className="room-row__name">{room.name}</span>
                    <span className="room-row__count">
                      {room.occupantIds.length}/{room.capacity}
                    </span>
                    <button
                      className="room-row__action"
                      type="button"
                      disabled={
                        isWorking ||
                        isFull ||
                        (room.status === ROOM_STATUS.BUSY && hasRequested)
                      }
                      onClick={() => onRoomAction(room)}
                    >
                      {ROOM_ACTIONS[room.status]}
                    </button>
                  </li>
                )
              })}
            </ul>
          </div>
          {showFade && (
            <span className="room-block__fade" aria-hidden="true" />
          )}
        </div>
      )}
    </section>
  )
}

export default function RoomList({ sessionId }) {
  const state = useStore()
  const [roomToOccupy, setRoomToOccupy] = useState(null)
  const session = state.sessions.find((item) => item.id === sessionId)

  if (!session) return null

  const blocks = selectRoomBlocks(state, sessionId)
  const isWorking = state.auditoriums.some((room) =>
    room.occupantIds.includes(sessionId),
  )

  function performRoomAction(room) {
    if (room.status === ROOM_STATUS.FREE) {
      setRoomToOccupy(room)
    } else if (room.status === ROOM_STATUS.AVAILABLE) {
      joinAvailableRoom(sessionId, room.id)
    } else {
      requestJoinRoom(sessionId, room.id)
    }
  }

  function chooseOccupyMode(mode) {
    if (roomToOccupy) occupyRoom(sessionId, roomToOccupy.id, mode)
    setRoomToOccupy(null)
  }

  return (
    <section className="room-list" aria-labelledby="room-list-title">
      <h2 className="room-list__title" id="room-list-title">
        Коворкинги
      </h2>
      <label className="room-list__search-label" htmlFor="room-search">
        Поиск аудиторий
      </label>
      <input
        className="room-list__search"
        id="room-search"
        type="search"
        value={session.searchQuery}
        placeholder="Поиск"
        onChange={(event) => setSessionSearch(sessionId, event.target.value)}
      />

      <div className="room-list__blocks">
        {blocks.map((block) => (
          <RoomBlock
            key={block.id}
            block={block}
            sessionId={sessionId}
            isWorking={isWorking}
            onRoomAction={performRoomAction}
          />
        ))}
      </div>

      {roomToOccupy && (
        <div className="room-dialog-backdrop">
          <section
            className="room-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="room-dialog-title"
          >
            <h3 className="room-dialog__title" id="room-dialog-title">
              Как занять {roomToOccupy.name}?
            </h3>
            <button
              className="room-dialog__option"
              type="button"
              onClick={() => chooseOccupyMode(ROOM_MODE.AVAILABLE)}
            >
              Оставить доступным
            </button>
            <button
              className="room-dialog__option"
              type="button"
              onClick={() => chooseOccupyMode(ROOM_MODE.FULL)}
            >
              Занять полностью
            </button>
            <button
              className="room-dialog__cancel"
              type="button"
              onClick={() => setRoomToOccupy(null)}
            >
              Отмена
            </button>
          </section>
        </div>
      )}
    </section>
  )
}
