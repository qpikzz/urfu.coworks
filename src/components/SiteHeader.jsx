export default function SiteHeader({ tabs, activeTab, onTabChange }) {
  return (
    <header className="site-header">
      <div className="site-header__inner">
        <span className="site-header__brand">УрФУ.Коворкинги</span>
        <nav className="site-tabs" aria-label="Разделы сайта">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              id={`tab-${tab.id}`}
              className="site-tabs__button"
              aria-current={activeTab === tab.id ? 'page' : undefined}
              aria-controls={`panel-${tab.id}`}
              onClick={() => onTabChange(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>
    </header>
  )
}
