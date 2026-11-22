import { useLayoutEffect, useEffect, useRef, useState } from 'react'

export default function SiteHeader({ tabs, activeTab, onTabChange }) {
  const navRef = useRef(null)
  const [indicator, setIndicator] = useState({ left: 0, width: 0 })
  const [alertTab, setAlertTab] = useState(null)

  useEffect(() => {
    function handleMessage(event) {
      if (event.origin !== window.location.origin) return
      if (event.data?.type !== 'slide-change' || !Number.isInteger(event.data.index)) return

      if (event.data.index === 10) {
        setAlertTab('demo')
      } else if (alertTab === 'demo') {
        setAlertTab(null)
      }
    }

    window.addEventListener('message', handleMessage)
    return () => window.removeEventListener('message', handleMessage)
  }, [alertTab])

  useEffect(() => {
    if (activeTab === 'demo' && alertTab === 'demo') {
      setAlertTab(null)
    }
  }, [activeTab, alertTab])

  useLayoutEffect(() => {
    const nav = navRef.current

    if (!nav) return undefined

    function updateIndicator() {
      const active = nav.querySelector('[aria-current="page"]')

      setIndicator(
        active
          ? { left: active.offsetLeft, width: active.offsetWidth }
          : { left: 0, width: 0 },
      )
    }

    updateIndicator()

    if (typeof ResizeObserver !== 'function') return undefined

    const observer = new ResizeObserver(updateIndicator)
    observer.observe(nav)

    return () => observer.disconnect()
  }, [activeTab, tabs])

  return (
    <header className="site-header">
      <div className="site-header__inner">
        <span className="site-header__brand">УрФУ.Коворкинги</span>
        <nav className="site-tabs" aria-label="Разделы сайта" ref={navRef}>
          <span
            className="site-tabs__indicator"
            style={{
              width: `${indicator.width}px`,
              transform: `translateX(${indicator.left}px)`,
            }}
            aria-hidden="true"
          />
          {tabs.map((tab) => {
            const isAlert = alertTab === tab.id
            return (
              <button
                key={tab.id}
                type="button"
                id={`tab-${tab.id}`}
                className={`site-tabs__button${isAlert ? ' site-tabs__button--alert' : ''}`}
                aria-current={activeTab === tab.id ? 'page' : undefined}
                aria-controls={`panel-${tab.id}`}
                aria-label={isAlert ? `${tab.label} — перейти к демонстрации` : tab.label}
                onClick={() => onTabChange(tab.id)}
              >
                {tab.label}
              </button>
            )
          })}
        </nav>
      </div>
    </header>
  )
}
