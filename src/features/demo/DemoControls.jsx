import { useLayoutEffect, useRef, useState } from 'react'
import { TIME_SPEEDS } from '../../config.js'

function DemoSwitch({ labelId, options, value, onChange }) {
  const listRef = useRef(null)
  const [indicator, setIndicator] = useState({ left: 0, width: 0 })

  useLayoutEffect(() => {
    const list = listRef.current

    if (!list) return undefined

    function updateIndicator() {
      const active = list.querySelector('[aria-pressed="true"]')

      setIndicator(
        active
          ? { left: active.offsetLeft, width: active.offsetWidth }
          : { left: 0, width: 0 },
      )
    }

    updateIndicator()

    if (typeof ResizeObserver !== 'function') return undefined

    const observer = new ResizeObserver(updateIndicator)
    observer.observe(list)

    return () => observer.disconnect()
  }, [value, labelId])

  return (
    <div
      className="demo-switch"
      role="group"
      aria-labelledby={labelId}
      ref={listRef}
    >
      <span
        className="demo-switch__indicator"
        style={{
          width: `${indicator.width}px`,
          transform: `translateX(${indicator.left}px)`,
        }}
        aria-hidden="true"
      />
      {options.map((option) => (
        <button
          key={option.value}
          className="demo-switch__button"
          type="button"
          aria-pressed={option.value === value}
          onClick={() => onChange(option.value)}
        >
          {option.label}
        </button>
      ))}
    </div>
  )
}

export default function DemoControls({
  sessions,
  sessionId,
  speed,
  onSessionChange,
  onSpeedChange,
  idPrefix,
}) {
  const sessionsLabelId = `${idPrefix}-sessions-label`
  const speedLabelId = `${idPrefix}-speed-label`

  return (
    <div className="demo-controls">
      <div className="demo-control">
        <span className="demo-control__label" id={sessionsLabelId}>
          Сессия
        </span>
        <DemoSwitch
          labelId={sessionsLabelId}
          options={sessions.map((item) => ({
            value: item.id,
            label: item.id,
          }))}
          value={sessionId}
          onChange={onSessionChange}
        />
      </div>
      <div className="demo-control">
        <span className="demo-control__label" id={speedLabelId}>
          Скорость времени
        </span>
        <DemoSwitch
          labelId={speedLabelId}
          options={TIME_SPEEDS.map((item) => ({
            value: item,
            label: `x${item}`,
          }))}
          value={speed}
          onChange={onSpeedChange}
        />
      </div>
    </div>
  )
}
