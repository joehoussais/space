import { useState, useMemo } from 'react'
import { useData } from '../context/DataContext'
import './LaunchersPage.css'

// Country flag emoji mapping
const flagEmoji = {
  US: '\u{1F1FA}\u{1F1F8}',
  EU: '\u{1F1EA}\u{1F1FA}',
  CN: '\u{1F1E8}\u{1F1F3}',
  RU: '\u{1F1F7}\u{1F1FA}',
  JP: '\u{1F1EF}\u{1F1F5}',
  IN: '\u{1F1EE}\u{1F1F3}'
}

// Company logo URLs
const companyLogos = {
  'SpaceX': 'https://logo.clearbit.com/spacex.com',
  'ArianeGroup': 'https://logo.clearbit.com/ariane.group',
  'Avio': 'https://logo.clearbit.com/avio.com',
  'Rocket Lab': 'https://logo.clearbit.com/rocketlabusa.com',
  'CALT': null,
  'SAST': null,
  'RKK Energia / Progress': null,
  'Mitsubishi Heavy Industries': 'https://logo.clearbit.com/mhi.com',
  'ISRO': null,
  'United Launch Alliance': 'https://logo.clearbit.com/ulalaunch.com',
  'Blue Origin': 'https://logo.clearbit.com/blueorigin.com',
  'Relativity Space': 'https://logo.clearbit.com/relativityspace.com'
}

function LauncherCard({ launcher, onSelect, getConstellationsForLauncher }) {
  const constellations = getConstellationsForLauncher(launcher.id)
  const logoUrl = companyLogos[launcher.company]

  const formatNumber = (num) => {
    if (num === null || num === undefined) return 'TBD'
    if (num >= 1000000) return `$${(num / 1000000).toFixed(0)}M`
    if (num >= 1000) return `${(num / 1000).toFixed(0)}k`
    return num.toLocaleString()
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'Active': return '#10b981'
      case 'Development': return '#f59e0b'
      case 'Retired': return '#6b7280'
      default: return '#64748b'
    }
  }

  return (
    <div className="launcher-card" onClick={() => onSelect(launcher)}>
      <div className="launcher-card-header">
        <div className="launcher-identity">
          {logoUrl ? (
            <img
              src={logoUrl}
              alt={launcher.company}
              className="company-logo"
              onError={(e) => { e.target.style.display = 'none' }}
            />
          ) : (
            <div className="company-logo-placeholder">
              {launcher.company.charAt(0)}
            </div>
          )}
          <div className="launcher-titles">
            <h3 className="launcher-name">{launcher.name}</h3>
            <div className="launcher-company">
              <span className="flag">{flagEmoji[launcher.countryCode]}</span>
              {launcher.company}
            </div>
          </div>
        </div>
        <span
          className="status-badge"
          style={{ backgroundColor: getStatusColor(launcher.status) }}
        >
          {launcher.status}
        </span>
      </div>

      <p className="launcher-description">{launcher.description}</p>

      <div className="launcher-stats">
        <div className="stat">
          <span className="stat-value">{formatNumber(launcher.payloadLEO)}</span>
          <span className="stat-label">kg to LEO</span>
        </div>
        <div className="stat">
          <span className="stat-value">
            {launcher.costPerLaunch ? `$${(launcher.costPerLaunch / 1000000).toFixed(0)}M` : 'TBD'}
          </span>
          <span className="stat-label">per launch</span>
        </div>
        <div className="stat">
          <span className="stat-value">{launcher.totalLaunches || 0}</span>
          <span className="stat-label">launches</span>
        </div>
        <div className="stat">
          <span className="stat-value">
            {launcher.successRate !== null ? `${launcher.successRate}%` : 'N/A'}
          </span>
          <span className="stat-label">success</span>
        </div>
      </div>

      <div className="launcher-engines">
        <div className="engines-label">Engines</div>
        <div className="engines-list">
          {launcher.engines.slice(0, 3).map((engine, idx) => (
            <div key={idx} className="engine-chip" title={`${engine.propellant} - ${engine.count}x`}>
              <span className="engine-name">{engine.name}</span>
              <span className="engine-count">x{engine.count}</span>
            </div>
          ))}
          {launcher.engines.length > 3 && (
            <span className="engine-more">+{launcher.engines.length - 3}</span>
          )}
        </div>
      </div>

      {launcher.typicalPayload && (
        <div className="launcher-payload-info">
          <div className="payload-label">Typical Satellites/Launch</div>
          <div className="payload-value">{launcher.typicalPayload.satellitesPerLaunch}</div>
          {launcher.typicalPayload.notes && (
            <div className="payload-notes" title={launcher.typicalPayload.notes}>
              {launcher.typicalPayload.notes.length > 50
                ? launcher.typicalPayload.notes.substring(0, 50) + '...'
                : launcher.typicalPayload.notes}
            </div>
          )}
        </div>
      )}

      {constellations.length > 0 && (
        <div className="launcher-constellations">
          <div className="constellations-label">Serves</div>
          <div className="constellation-chips">
            {constellations.slice(0, 3).map(c => (
              <span key={c.id} className="constellation-chip">{c.name}</span>
            ))}
            {constellations.length > 3 && (
              <span className="constellation-more">+{constellations.length - 3}</span>
            )}
          </div>
        </div>
      )}

      <div className="launcher-features">
        {launcher.reusable && <span className="feature-badge reusable">Reusable</span>}
        {launcher.stages && <span className="feature-badge">{launcher.stages} stages</span>}
      </div>
    </div>
  )
}

function LauncherDetail({ launcher, onClose, getConstellationsForLauncher, engineTypes }) {
  const constellations = getConstellationsForLauncher(launcher.id)
  const logoUrl = companyLogos[launcher.company]

  const formatDate = (dateStr) => {
    if (!dateStr) return 'TBD'
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  return (
    <div className="launcher-detail-overlay" onClick={onClose}>
      <div className="launcher-detail" onClick={e => e.stopPropagation()}>
        <button className="detail-close" onClick={onClose}>&times;</button>

        <div className="detail-header">
          {logoUrl ? (
            <img src={logoUrl} alt={launcher.company} className="detail-logo" />
          ) : (
            <div className="detail-logo-placeholder">{launcher.company.charAt(0)}</div>
          )}
          <div>
            <h2>{launcher.name}</h2>
            <p className="detail-company">
              {flagEmoji[launcher.countryCode]} {launcher.company}
            </p>
          </div>
        </div>

        <p className="detail-description">{launcher.description}</p>

        <div className="detail-section">
          <h3>Specifications</h3>
          <div className="specs-grid">
            <div className="spec">
              <span className="spec-label">Height</span>
              <span className="spec-value">{launcher.height} m</span>
            </div>
            <div className="spec">
              <span className="spec-label">Diameter</span>
              <span className="spec-value">{launcher.diameter} m</span>
            </div>
            <div className="spec">
              <span className="spec-label">Mass</span>
              <span className="spec-value">{(launcher.mass / 1000).toFixed(0)} t</span>
            </div>
            <div className="spec">
              <span className="spec-label">Stages</span>
              <span className="spec-value">{launcher.stages}</span>
            </div>
            <div className="spec">
              <span className="spec-label">Payload to LEO</span>
              <span className="spec-value">{launcher.payloadLEO?.toLocaleString()} kg</span>
            </div>
            <div className="spec">
              <span className="spec-label">Payload to GTO</span>
              <span className="spec-value">{launcher.payloadGTO?.toLocaleString() || 'N/A'} kg</span>
            </div>
            <div className="spec">
              <span className="spec-label">Cost per Launch</span>
              <span className="spec-value">
                {launcher.costPerLaunch ? `$${(launcher.costPerLaunch / 1000000).toFixed(0)}M` : 'TBD'}
              </span>
            </div>
            <div className="spec">
              <span className="spec-label">Cost per kg (LEO)</span>
              <span className="spec-value">
                {launcher.costPerKgLEO ? `$${launcher.costPerKgLEO.toLocaleString()}` : 'TBD'}
              </span>
            </div>
          </div>
        </div>

        <div className="detail-section">
          <h3>Launch History</h3>
          <div className="specs-grid">
            <div className="spec">
              <span className="spec-label">First Flight</span>
              <span className="spec-value">{formatDate(launcher.firstFlight)}</span>
            </div>
            <div className="spec">
              <span className="spec-label">Last Flight</span>
              <span className="spec-value">{formatDate(launcher.lastFlight)}</span>
            </div>
            <div className="spec">
              <span className="spec-label">Total Launches</span>
              <span className="spec-value">{launcher.totalLaunches}</span>
            </div>
            <div className="spec">
              <span className="spec-label">Success Rate</span>
              <span className="spec-value">
                {launcher.successRate !== null ? `${launcher.successRate}%` : 'N/A'}
              </span>
            </div>
          </div>
        </div>

        <div className="detail-section">
          <h3>Engines</h3>
          <div className="engines-detail-grid">
            {launcher.engines.map((engine, idx) => (
              <div key={idx} className="engine-detail-card">
                <div className="engine-detail-header">
                  <span className="engine-detail-name">{engine.name}</span>
                  <span
                    className="engine-propellant-badge"
                    style={{ backgroundColor: engineTypes[engine.propellant]?.color || '#64748b' }}
                  >
                    {engineTypes[engine.propellant]?.name || engine.propellant}
                  </span>
                </div>
                <div className="engine-specs">
                  <div className="engine-spec">
                    <span>Stage</span>
                    <span>{engine.stage === 0 ? 'Booster' : engine.stage}</span>
                  </div>
                  <div className="engine-spec">
                    <span>Count</span>
                    <span>{engine.count}</span>
                  </div>
                  {engine.thrustSL && (
                    <div className="engine-spec">
                      <span>Thrust (SL)</span>
                      <span>{engine.thrustSL} kN</span>
                    </div>
                  )}
                  {engine.thrustVac && (
                    <div className="engine-spec">
                      <span>Thrust (Vac)</span>
                      <span>{engine.thrustVac} kN</span>
                    </div>
                  )}
                  {engine.ispVac && (
                    <div className="engine-spec">
                      <span>ISP (Vac)</span>
                      <span>{engine.ispVac} s</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {launcher.launchSites && launcher.launchSites.length > 0 && (
          <div className="detail-section">
            <h3>Launch Sites</h3>
            <div className="launch-sites">
              {launcher.launchSites.map((site, idx) => (
                <span key={idx} className="site-chip">{site}</span>
              ))}
            </div>
          </div>
        )}

        {constellations.length > 0 && (
          <div className="detail-section">
            <h3>Constellations Served</h3>
            <div className="constellations-served">
              {constellations.map(c => (
                <div key={c.id} className="served-constellation">
                  <span className="served-name">{c.name}</span>
                  <span className="served-operator">{c.operator}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {launcher.typicalPayload && (
          <div className="detail-section">
            <h3>Typical Payload Configuration</h3>
            <div className="payload-detail">
              <div className="payload-detail-main">
                <span className="payload-detail-label">Satellites per Launch</span>
                <span className="payload-detail-value">{launcher.typicalPayload.satellitesPerLaunch}</span>
              </div>
              {launcher.typicalPayload.rideshareMax && (
                <div className="payload-detail-secondary">
                  <span className="payload-detail-label">Rideshare Max</span>
                  <span className="payload-detail-value">{launcher.typicalPayload.rideshareMax}</span>
                </div>
              )}
              {launcher.typicalPayload.examples && launcher.typicalPayload.examples.length > 0 && (
                <div className="payload-examples">
                  <span className="examples-label">Example Missions:</span>
                  {launcher.typicalPayload.examples.map((ex, idx) => (
                    <div key={idx} className="payload-example">
                      <span className="example-mission">{ex.mission}</span>
                      <span className="example-count">{ex.satellites} sats</span>
                      <span className="example-year">({ex.year})</span>
                      {ex.type && <span className="example-type">{ex.type}</span>}
                    </div>
                  ))}
                </div>
              )}
              {launcher.typicalPayload.notes && (
                <p className="payload-notes-detail">{launcher.typicalPayload.notes}</p>
              )}
              {launcher.typicalPayload.source && (
                <p className="payload-source">Source: {launcher.typicalPayload.source}</p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function LaunchersPage() {
  const { launchersData, getConstellationsForLauncher, engineTypes, countries } = useData()
  const [selectedLauncher, setSelectedLauncher] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [filters, setFilters] = useState({
    status: 'all',
    country: 'all',
    reusable: 'all'
  })
  const [sortBy, setSortBy] = useState('payloadLEO')

  const filteredLaunchers = useMemo(() => {
    let result = [...launchersData.launchers]

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      result = result.filter(l =>
        l.name.toLowerCase().includes(query) ||
        l.company.toLowerCase().includes(query)
      )
    }

    // Apply filters
    if (filters.status !== 'all') {
      result = result.filter(l => l.status === filters.status)
    }
    if (filters.country !== 'all') {
      result = result.filter(l => l.countryCode === filters.country)
    }
    if (filters.reusable !== 'all') {
      result = result.filter(l => filters.reusable === 'yes' ? l.reusable : !l.reusable)
    }

    // Apply sorting
    result.sort((a, b) => {
      const aVal = a[sortBy] ?? 0
      const bVal = b[sortBy] ?? 0
      return bVal - aVal
    })

    return result
  }, [launchersData.launchers, filters, searchQuery, sortBy])

  const uniqueCountries = [...new Set(launchersData.launchers.map(l => l.countryCode))]

  return (
    <div className="launchers-page">
      <div className="page-header">
        <div className="header-content">
          <h1>Launch Vehicles</h1>
          <p className="page-subtitle">
            Comprehensive database of orbital launch vehicles and their specifications
          </p>
        </div>
        <div className="header-stats">
          <div className="header-stat">
            <span className="header-stat-value">{launchersData.launchers.length}</span>
            <span className="header-stat-label">Vehicles</span>
          </div>
          <div className="header-stat">
            <span className="header-stat-value">
              {launchersData.launchers.filter(l => l.status === 'Active').length}
            </span>
            <span className="header-stat-label">Active</span>
          </div>
          <div className="header-stat">
            <span className="header-stat-value">
              {launchersData.launchers.filter(l => l.reusable).length}
            </span>
            <span className="header-stat-label">Reusable</span>
          </div>
        </div>
      </div>

      <div className="filters-bar">
        <div className="filter-group search-group">
          <label>Search</label>
          <div className="search-input-wrapper">
            <input
              type="text"
              className="search-input"
              placeholder="Search launchers..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button className="search-clear" onClick={() => setSearchQuery('')}>
                &times;
              </button>
            )}
          </div>
        </div>

        <div className="filter-group">
          <label>Status</label>
          <select
            value={filters.status}
            onChange={e => setFilters(f => ({ ...f, status: e.target.value }))}
          >
            <option value="all">All</option>
            <option value="Active">Active</option>
            <option value="Development">Development</option>
          </select>
        </div>

        <div className="filter-group">
          <label>Country</label>
          <select
            value={filters.country}
            onChange={e => setFilters(f => ({ ...f, country: e.target.value }))}
          >
            <option value="all">All</option>
            {uniqueCountries.map(code => (
              <option key={code} value={code}>
                {flagEmoji[code]} {countries[code]?.name || code}
              </option>
            ))}
          </select>
        </div>

        <div className="filter-group">
          <label>Reusability</label>
          <select
            value={filters.reusable}
            onChange={e => setFilters(f => ({ ...f, reusable: e.target.value }))}
          >
            <option value="all">All</option>
            <option value="yes">Reusable</option>
            <option value="no">Expendable</option>
          </select>
        </div>

        <div className="filter-group">
          <label>Sort by</label>
          <select value={sortBy} onChange={e => setSortBy(e.target.value)}>
            <option value="payloadLEO">Payload Capacity</option>
            <option value="totalLaunches">Launch Count</option>
            <option value="successRate">Success Rate</option>
            <option value="costPerLaunch">Cost per Launch</option>
          </select>
        </div>
      </div>

      <div className="launchers-grid">
        {filteredLaunchers.map(launcher => (
          <LauncherCard
            key={launcher.id}
            launcher={launcher}
            onSelect={setSelectedLauncher}
            getConstellationsForLauncher={getConstellationsForLauncher}
          />
        ))}
      </div>

      {filteredLaunchers.length === 0 && (
        <div className="no-results">
          No launch vehicles match the selected filters.
        </div>
      )}

      {selectedLauncher && (
        <LauncherDetail
          launcher={selectedLauncher}
          onClose={() => setSelectedLauncher(null)}
          getConstellationsForLauncher={getConstellationsForLauncher}
          engineTypes={engineTypes}
        />
      )}
    </div>
  )
}

export default LaunchersPage
