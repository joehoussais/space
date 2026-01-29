import './Navigation.css'

const tabGroups = [
  {
    label: 'Launch Services',
    tabs: [
      { id: 'market', label: 'Market Overview', icon: 'chart' },
      { id: 'launchers', label: 'Launch Vehicles', icon: 'rocket' }
    ]
  },
  {
    label: 'Satellites & Spacecraft',
    tabs: [
      { id: 'satellites', label: 'Satellites', icon: 'sat-dish' },
      { id: 'constellations', label: 'Constellations', icon: 'satellite' }
    ]
  }
]

function Navigation({ currentPage, setCurrentPage }) {
  return (
    <nav className="navigation">
      <div className="nav-content">
        <div className="nav-tabs">
          {tabGroups.map((group, groupIdx) => (
            <div key={group.label} className="nav-group-container">
              <div className="nav-group-box">
                {group.tabs.map((tab, tabIdx) => (
                  <button
                    key={tab.id}
                    className={`nav-tab ${currentPage === tab.id ? 'active' : ''}`}
                    onClick={() => setCurrentPage(tab.id)}
                  >
                    <span className={`nav-icon nav-icon-${tab.icon}`}></span>
                    <span className="nav-label">{tab.label}</span>
                    {tabIdx < group.tabs.length - 1 && <span className="nav-tab-divider" />}
                  </button>
                ))}
              </div>
              <span className="nav-group-label">{group.label}</span>
            </div>
          ))}
        </div>
        <img src="/rrw-logo.png" alt="Red River West" className="nav-logo" />
      </div>
    </nav>
  )
}

export default Navigation
