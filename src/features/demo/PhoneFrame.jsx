import { memo, useLayoutEffect, useRef, useState } from 'react'
import { MINUTE_MS } from '../../config.js'
import { useVirtualClockMinute } from '../../state/useStore.js'

const LOGICAL_WIDTH = 360
const LOGICAL_HEIGHT = 780

const TIME_FORMATTER = new Intl.DateTimeFormat('ru-RU', {
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
})

const PhoneStatusBar = memo(function PhoneStatusBar() {
  const minute = useVirtualClockMinute()
  const clock = new Date(minute * MINUTE_MS)
  const time = TIME_FORMATTER.format(clock)

  return (
    <div className="phone-status-bar" aria-hidden="true">
      <time className="phone-status-bar__time" dateTime={clock.toISOString()}>
        {time}
      </time>
      <div className="phone-status-bar__icons" aria-hidden="true">
        <svg
          className="phone-status-bar__icon"
          viewBox="0 0 24 24"
          focusable="false"
        >
          <path
            d="M4 9.5a12 12 0 0 1 16 0M7 13a8 8 0 0 1 10 0M10 16.5a4 4 0 0 1 4 0"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
          <circle cx="12" cy="19.5" r="1" fill="currentColor" />
        </svg>
        <svg
          className="phone-status-bar__icon"
          viewBox="0 0 24 24"
          focusable="false"
        >
          <rect
            x="3"
            y="8"
            width="15"
            height="8"
            rx="2.5"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
          />
          <rect x="5" y="10" width="9" height="4" rx="1" fill="currentColor" />
          <path
            d="M20 11v2"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
        </svg>
      </div>
    </div>
  )
})

export default function PhoneFrame({ children }) {
  const screenRef = useRef(null)
  const [scale, setScale] = useState(1)

  useLayoutEffect(() => {
    const screen = screenRef.current

    if (!screen) return undefined

    function updateScale() {
      if (!screen.clientWidth || !screen.clientHeight) return

      setScale(
        Math.min(
          screen.clientWidth / LOGICAL_WIDTH,
          screen.clientHeight / LOGICAL_HEIGHT,
        ),
      )
    }

    updateScale()

    if (typeof ResizeObserver === 'function') {
      const observer = new ResizeObserver(updateScale)
      observer.observe(screen)
      return () => observer.disconnect()
    }

    window.addEventListener('resize', updateScale)
    return () => window.removeEventListener('resize', updateScale)
  }, [])

  return (
    <div className="phone-frame">
      <div className="phone-frame__screen" ref={screenRef}>
        <div
          className="phone-frame__viewport"
          style={{ '--phone-scale': scale }}
        >
          <PhoneStatusBar />
          <div className="phone-frame__app">{children}</div>
        </div>
      </div>
    </div>
  )
}
