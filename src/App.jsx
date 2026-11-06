import { useState } from 'react'
import SiteHeader from './components/SiteHeader.jsx'
import SiteFooter from './components/SiteFooter.jsx'
import PresentationTab from './features/presentation/PresentationTab.jsx'
import DemoTab from './features/demo/DemoTab.jsx'
import './styles/shell.css'

const TABS = [
  { id: 'presentation', label: 'Презентация' },
  { id: 'demo', label: 'Демонстрация' },
]

export default function App() {
  const [activeTab, setActiveTab] = useState('presentation')

  return (
    <div className={`site${activeTab === 'demo' ? ' site--demo' : ''}`}>
      <SiteHeader
        tabs={TABS}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />
      <main className="site__main">
        <PresentationTab hidden={activeTab !== 'presentation'} />
        <DemoTab hidden={activeTab !== 'demo'} />
      </main>
      <SiteFooter />
    </div>
  )
}
