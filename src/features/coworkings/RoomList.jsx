import { useEffect, useRef, useState } from 'react'
import { ROOM_STATUS } from '../../data/auditoriums.js'
import {
  joinAvailableRoom,
  occupyRoom,
  requestJoinRoom,
  setSessionSearch,
  toggleSessionBlock,
} from '../../state/actions.js'
import { appMotionDuration } from '../../lib/motion.js'
import { ROOM_MODE } from '../../state/store.js'
import { selectRoomBlocks } from '../../state/selectors.js'
import { useStore } from '../../state/useStore.js'
import RoomCount from './RoomCount.jsx'
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

function RoomBlock({
  block,
  sessionId,
  searchQuery,
  isWorking,
  onRoomAction,
}) {
  const scrollRef = useRef(null)
  const [showFade, setShowFade] = useState(false)
  const headingId = `room-block-${sessionId}-${block.id}`
  const visibleRooms = block.rooms.filter((room) => room.matchesSearch !== false)
  const isLimited = visibleRooms.length > 6

  useEffect(() => {
    const scrollElement = scrollRef.current

    if (!scrollElement || !isLimited || block.collapsed) {
      setShowFade(false)
      return undefined
    }

    let frameId = 0

    function updateFade() {
      const hasMoreContent =
        scrollElement.scrollTop + scrollElement.clientHeight <
        scrollElement.scrollHeight - 1
      setShowFade(hasMoreContent)
    }

    function scheduleFadeUpdate() {
      if (frameId) return

      frameId = window.requestAnimationFrame(() => {
        frameId = 0
        updateFade()
      })
    }

    updateFade()
    scrollElement.addEventListener('scroll', scheduleFadeUpdate, {
      passive: true,
    })
    window.addEventListener('resize', scheduleFadeUpdate)

    let observer

    if (typeof ResizeObserver === 'function') {
      observer = new ResizeObserver(scheduleFadeUpdate)
      observer.observe(scrollElement)

      if (scrollElement.firstElementChild) {
        observer.observe(scrollElement.firstElementChild)
      }
    }

    return () => {
      if (frameId) window.cancelAnimationFrame(frameId)

      scrollElement.removeEventListener('scroll', scheduleFadeUpdate)
      window.removeEventListener('resize', scheduleFadeUpdate)
      if (observer) observer.disconnect()
    }
  }, [block.collapsed, isLimited, searchQuery, visibleRooms.length])

  return (
    <div
      className={`room-block-slot${block.hidden ? ' room-block-slot--filtered' : ''}`}
      aria-hidden={block.hidden || undefined}
      inert={block.hidden || undefined}
    >
      <div className="room-block-clip">
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
          <div
            className={`room-block__content${block.collapsed ? '' : ' room-block__content--expanded'}`}
            id={`${headingId}-rooms`}
            aria-hidden={block.collapsed}
            inert={block.collapsed || undefined}
          >
            <div className="room-block__content-inner">
              <div className="room-block__scroll-frame">
                <div
                  ref={scrollRef}
                  className={`room-block__scroll${isLimited ? ' room-block__scroll--limited' : ''}`}
                  tabIndex={isLimited ? 0 : undefined}
                  role={isLimited ? 'group' : undefined}
                  aria-label={
                    isLimited ? `Аудитории: ${block.title}` : undefined
                  }
                >
                  <ul className="room-block__rooms">
                    {block.rooms.map((room) => {
                      const isFull = room.occupants.length >= room.capacity
                      const hasRequested = room.requests.includes(sessionId)
                      const isFiltered = room.matchesSearch === false

                      return (
                        <li
                          className={`room-row-slot${isFiltered ? ' room-row-slot--filtered' : ''}`}
                          key={room.id}
                          aria-hidden={isFiltered || undefined}
                          inert={isFiltered || undefined}
                        >
                          <div className="room-row-clip">
                            <div className="room-row">
                              <span
                                className={`room-row__status room-row__status--${block.id}`}
                                aria-label={STATUS_LABELS[room.status]}
                                role="img"
                              />
                              <span className="room-row__name">{room.name}</span>
                              <RoomCount
                                className="room-row__count"
                                value={room.occupants.length}
                                capacity={room.capacity}
                              />
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
                            </div>
                          </div>
                        </li>
                      )
                    })}
                  </ul>
                </div>
                {showFade && (
                  <span className="room-block__fade" aria-hidden="true" />
                )}
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}

export default function RoomList({ sessionId }) {
  const state = useStore()
  const [roomToOccupy, setRoomToOccupy] = useState(null)
  const [dialogClosing, setDialogClosing] = useState(false)
  const dialogTimerRef = useRef(null)
  const session = state.sessions.find((item) => item.id === sessionId)

  useEffect(
    () => () => {
      window.clearTimeout(dialogTimerRef.current)
    },
    [],
  )

  if (!session) return null

  const blocks = selectRoomBlocks(state, sessionId, { includeFiltered: true })
  const isWorking = state.auditoriums.some((room) =>
    room.occupants.some((participant) => participant.id === sessionId),
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

  function closeOccupyDialog(action) {
    if (dialogClosing) return

    setDialogClosing(true)
    dialogTimerRef.current = window.setTimeout(() => {
      setRoomToOccupy(null)
      setDialogClosing(false)

      if (action) action()
    }, appMotionDuration())
  }

  function chooseOccupyMode(mode) {
    const room = roomToOccupy

    closeOccupyDialog(() => {
      if (room) occupyRoom(sessionId, room.id, mode)
    })
  }

  return (
    <section
      className="room-list"
      tabIndex={0}
      aria-label="Список коворкингов"
    >
      <h2 className="room-list__title" id="room-list-title">
        Коворкинги
      </h2>
      <label className="room-list__search-label" htmlFor="room-search">
        Поиск аудиторий
      </label>
      <div className="room-list__search-field">
        <svg
          className="room-list__search-icon"
          viewBox="0 0 24 24"
          aria-hidden="true"
          focusable="false"
        >
          <circle
            cx="10.8"
            cy="10.8"
            r="6.8"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
          />
          <path
            d="m16 16 4 4"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
        </svg>
        <input
          className="room-list__search"
          id="room-search"
          type="search"
          value={session.searchQuery}
          placeholder="Поиск"
          onChange={(event) => setSessionSearch(sessionId, event.target.value)}
        />
      </div>

      <div className="room-list__blocks">
        {blocks.map((block) => (
          <RoomBlock
            key={block.id}
            block={block}
            sessionId={sessionId}
            searchQuery={session.searchQuery}
            isWorking={isWorking}
            onRoomAction={performRoomAction}
          />
        ))}
      </div>

      {roomToOccupy && (
        <div
          className={`room-dialog-backdrop${dialogClosing ? ' room-dialog-backdrop--closing' : ''}`}
        >
          <section
            className={`room-dialog${dialogClosing ? ' room-dialog--closing' : ''}`}
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
              onClick={() => closeOccupyDialog()}
            >
              Отмена
            </button>
          </section>
        </div>
      )}
    </section>
  )
}
