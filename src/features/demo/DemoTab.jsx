import PhoneFrame from './PhoneFrame.jsx'
import '../../styles/demo.css'

export default function DemoTab({ hidden }) {
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
        <PhoneFrame />
      </div>
    </section>
  )
}
