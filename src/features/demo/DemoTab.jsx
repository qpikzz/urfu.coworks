import { useEffect, useState } from 'react'
import PhoneFrame from './PhoneFrame.jsx'
import AppHeader from '../coworkings/AppHeader.jsx'
import RoomList from '../coworkings/RoomList.jsx'
import RoomScreen from '../coworkings/RoomScreen.jsx'
import WorkBanner from '../coworkings/WorkBanner.jsx'
import { setSessionUniversity } from '../../state/actions.js'
import { selectSessionRoom } from '../../state/selectors.js'
import { useStore } from '../../state/useStore.js'
import '../../styles/demo.css'

export default function DemoTab({ hidden }) {
  const state = useStore()
  const session = state.sessions[0]
  const room = selectSessionRoom(state, session.id)
  const [roomScreenOpen, setRoomScreenOpen] = useState(false)

  useEffect(() => {
    if (!room) setRoomScreenOpen(false)
  }, [room])

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
      </div>
      <div className="demo-layout__stage">
        <PhoneFrame>
          {roomScreenOpen && room ? (
            <RoomScreen
              sessionId={session.id}
              onBack={() => setRoomScreenOpen(false)}
            />
          ) : (
            <>
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
            </>
          )}
        </PhoneFrame>
      </div>
    </section>
  )
}
