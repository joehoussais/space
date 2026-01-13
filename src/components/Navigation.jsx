import './Navigation.css'

const tabs = [
  { id: 'market', label: 'Market Overview', icon: 'chart' },
  { id: 'launchers', label: 'Launch Vehicles', icon: 'rocket' },
  { id: 'constellations', label: 'Constellations', icon: 'satellite' }
]

function Navigation({ currentPage, setCurrentPage }) {
  return (
    <nav className="navigation">
      <div className="nav-tabs">
        {tabs.map(tab => (
          <button
            key={tab.id}
            className={`nav-tab ${currentPage === tab.id ? 'active' : ''}`}
            onClick={() => setCurrentPage(tab.id)}
          >
            <span className={`nav-icon nav-icon-${tab.icon}`}></span>
            <span className="nav-label">{tab.label}</span>
          </button>
        ))}
      </div>
    </nav>
  )
}

export default Navigation
