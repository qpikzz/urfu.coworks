import PhoneFrame from './PhoneFrame.jsx'
import AppHeader from '../coworkings/AppHeader.jsx'
import RoomList from '../coworkings/RoomList.jsx'
import { setSessionUniversity } from '../../state/actions.js'
import { useStore } from '../../state/useStore.js'
import '../../styles/demo.css'

export default function DemoTab({ hidden }) {
  const { sessions } = useStore()
  const session = sessions[0]

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
          <AppHeader
            universityId={session.universityId}
            onUniversityChange={(universityId) =>
              setSessionUniversity(session.id, universityId)
            }
          />
          <RoomList sessionId={session.id} />
        </PhoneFrame>
      </div>
    </section>
  )
}
