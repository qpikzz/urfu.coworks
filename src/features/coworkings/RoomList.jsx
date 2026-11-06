import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { ROOM_STATUS } from '../../data/auditoriums.js'
import {
  joinAvailableRoom,
  occupyRoom,
  requestJoinRoom,
  setSessionSearch,
  toggleSessionBlock,
} from '../../state/actions.js'
import { motionDuration, prefersReducedMotion } from '../../lib/motion.js'
import { ROOM_MODE } from '../../state/store.js'
import { selectRoomBlocks } from '../../state/selectors.js'
import { useStore } from '../../state/useStore.js'
import RoomCount from './RoomCount.jsx'
import './coworkings.css'

const FLIP_DURATION = 280
const DIALOG_EXIT_DURATION = 140

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
  const isLimited = visibleRooms.length >= 6

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
    scrollElement.addEventListener('transitionend', updateFade)

    return () => {
      scrollElement.removeEventListener('scroll', updateFade)
      scrollElement.removeEventListener('transitionend', updateFade)
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
                >
                  <ul className="room-block__rooms">
                    {block.rooms.map((room, index) => {
                      const isFull = room.occupantIds.length >= room.capacity
                      const hasRequested = room.requests.includes(sessionId)
                      const isFiltered = room.matchesSearch === false

                      return (
                        <li
                          className={`room-row-slot${isFiltered ? ' room-row-slot--filtered' : ''}`}
                          key={room.id}
                          data-room-id={room.id}
                          style={{ '--row-index': Math.min(index, 7) }}
                          aria-hidden={isFiltered || undefined}
                          inert={isFiltered || undefined}
                        >
                          <div className="room-row-clip">
                            <div className="room-row">
                              <span
                                className={`room-row__status room-row__status--${block.id}`}
                                key={room.status}
                                aria-label={STATUS_LABELS[room.status]}
                                role="img"
                              />
                              <span className="room-row__name">{room.name}</span>
                              <RoomCount
                                className="room-row__count"
                                value={room.occupantIds.length}
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
  const listRef = useRef(null)
  const rowRectsRef = useRef(null)
  const queryRef = useRef(null)
  const dialogTimerRef = useRef(null)
  const session = state.sessions.find((item) => item.id === sessionId)

  useEffect(
    () => () => {
      window.clearTimeout(dialogTimerRef.current)
    },
    [],
  )

  useLayoutEffect(() => {
    const container = listRef.current

    if (!container) {
      rowRectsRef.current = null
      return
    }

    const rows = container.querySelectorAll('[data-room-id]')
    const nextRects = new Map()

    rows.forEach((row) => {
      nextRects.set(row.dataset.roomId, row.getBoundingClientRect())
    })

    const previousRects = rowRectsRef.current
    const currentQuery = session?.searchQuery ?? ''
    const queryChanged = queryRef.current !== currentQuery

    rowRectsRef.current = nextRects
    queryRef.current = currentQuery

    if (!previousRects || queryChanged || prefersReducedMotion()) return

    rows.forEach((row) => {
      const nextRect = nextRects.get(row.dataset.roomId)
      const previousRect = previousRects.get(row.dataset.roomId)

      if (!previousRect || !nextRect || typeof row.animate !== 'function') return

      const deltaX = previousRect.left - nextRect.left
      const deltaY = previousRect.top - nextRect.top

      if (Math.abs(deltaX) < 1 && Math.abs(deltaY) < 1) return

      row.animate(
        [
          { transform: `translate(${deltaX}px, ${deltaY}px)` },
          { transform: 'translate(0, 0)' },
        ],
        {
          duration: FLIP_DURATION,
          easing: 'cubic-bezier(0.2, 0.8, 0.2, 1)',
        },
      )
    })
  })

  if (!session) return null

  const blocks = selectRoomBlocks(state, sessionId, { includeFiltered: true })
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

  function closeOccupyDialog(action) {
    if (dialogClosing) return

    setDialogClosing(true)
    dialogTimerRef.current = window.setTimeout(() => {
      setRoomToOccupy(null)
      setDialogClosing(false)

      if (action) action()
    }, motionDuration(DIALOG_EXIT_DURATION))
  }

  function chooseOccupyMode(mode) {
    const room = roomToOccupy

    closeOccupyDialog(() => {
      if (room) occupyRoom(sessionId, room.id, mode)
    })
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

      <div className="room-list__blocks" ref={listRef}>
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
