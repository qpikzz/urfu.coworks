import { useEffect, useState } from 'react'
import PhoneFrame from './PhoneFrame.jsx'
import DemoControls from './DemoControls.jsx'
import AppHeader from '../coworkings/AppHeader.jsx'
import RoomList from '../coworkings/RoomList.jsx'
import RoomScreen from '../coworkings/RoomScreen.jsx'
import WorkBanner from '../coworkings/WorkBanner.jsx'
import { setSessionUniversity } from '../../state/actions.js'
import { selectSessionRoom } from '../../state/selectors.js'
import { setTimeSpeed } from '../../state/timeEngine.js'
import { useStore } from '../../state/useStore.js'
import '../../styles/demo.css'

const AUTHOR_URL = 'https://github.com/qpikzz'

export default function DemoTab({ hidden }) {
  const state = useStore()
  const [selectedSessionId, setSelectedSessionId] = useState(
    state.sessions[0].id,
  )
  const session =
    state.sessions.find((item) => item.id === selectedSessionId) ??
    state.sessions[0]
  const room = selectSessionRoom(state, session.id)
  const [roomScreenOpen, setRoomScreenOpen] = useState(false)
  const [panelOpen, setPanelOpen] = useState(false)

  useEffect(() => {
    if (!room) setRoomScreenOpen(false)
  }, [room])

  function chooseSession(sessionId) {
    setSelectedSessionId(sessionId)
    setRoomScreenOpen(false)
  }

  return (
    <section
      id="panel-demo"
      className="tab-panel tab-panel--demo demo-layout"
      aria-labelledby="tab-demo"
      hidden={hidden}
    >
      <div className="demo-layout__intro">
        <p className="demo-layout__lead">
          Получай актуальную информацию о доступности коворкингов не заглядывая внутрь
        </p>
        <DemoControls
          sessions={state.sessions}
          sessionId={session.id}
          speed={state.time.speed}
          onSessionChange={chooseSession}
          onSpeedChange={setTimeSpeed}
          idPrefix="demo"
        />
      </div>
      <div className="demo-layout__stage">
        <PhoneFrame>
          {roomScreenOpen && room ? (
            <RoomScreen
              sessionId={session.id}
              onBack={() => setRoomScreenOpen(false)}
            />
          ) : (
            <div className="app-screen" key={session.id}>
              <AppHeader
                universityId={session.universityId}
                onUniversityChange={(universityId) =>
                  setSessionUniversity(session.id, universityId)
                }
              />
              <WorkBanner
                sessionId={session.id}
                onOpen={() => setRoomScreenOpen(true)}
              />
              <RoomList sessionId={session.id} />
            </div>
          )}
        </PhoneFrame>
      </div>
      <div className="demo-panel">
        <section
          className="demo-panel__sheet"
          id="demo-panel-sheet"
          aria-label="Панель демонстрации"
          hidden={!panelOpen}
        >
          <DemoControls
            sessions={state.sessions}
            sessionId={session.id}
            speed={state.time.speed}
            onSessionChange={chooseSession}
            onSpeedChange={setTimeSpeed}
            idPrefix="demo-panel"
          />
          <a
            className="demo-panel__author"
            href={AUTHOR_URL}
            target="_blank"
            rel="noopener noreferrer"
          >
            design &amp; idea by Nikita Shvedov
          </a>
        </section>
        <button
          className="demo-panel__toggle"
          type="button"
          aria-expanded={panelOpen}
          aria-controls="demo-panel-sheet"
          onClick={() => setPanelOpen((open) => !open)}
        >
          {panelOpen ? 'Скрыть панель' : 'Сессии и скорость'}
        </button>
      </div>
    </section>
  )
}
