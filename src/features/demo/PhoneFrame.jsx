import { useEffect, useLayoutEffect, useRef, useState } from 'react'

const LOGICAL_WIDTH = 360
const LOGICAL_HEIGHT = 780

function PhoneStatusBar() {
  const [now, setNow] = useState(() => new Date())
  const time = new Intl.DateTimeFormat('ru-RU', {
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).format(now)

  useEffect(() => {
    const intervalId = window.setInterval(() => setNow(new Date()), 60_000)
    return () => window.clearInterval(intervalId)
  }, [])

  return (
    <div className="phone-status-bar">
      <time className="phone-status-bar__time" dateTime={now.toISOString()}>
        {time}
      </time>
    </div>
  )
}

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
