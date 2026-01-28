import { useState, useMemo } from 'react'
import { useData } from '../context/DataContext'
import ConstellationSourcesPanel from '../components/ConstellationSourcesPanel'
import ConstellationTimeline from '../components/ConstellationTimeline'
import './ConstellationsPage.css'

// Country flag emoji mapping
const flagEmoji = {
  US: '\u{1F1FA}\u{1F1F8}',
  EU: '\u{1F1EA}\u{1F1FA}',
  CN: '\u{1F1E8}\u{1F1F3}',
  RU: '\u{1F1F7}\u{1F1FA}',
  JP: '\u{1F1EF}\u{1F1F5}',
  IN: '\u{1F1EE}\u{1F1F3}',
  CA: '\u{1F1E8}\u{1F1E6}',
  FI: '\u{1F1EB}\u{1F1EE}',
  AR: '\u{1F1E6}\u{1F1F7}',
  KR: '\u{1F1F0}\u{1F1F7}',
  RW: '\u{1F1F7}\u{1F1FC}'
}

// Operator logo URLs
const operatorLogos = {
  'SpaceX': 'https://logo.clearbit.com/spacex.com',
  'Eutelsat OneWeb': 'https://logo.clearbit.com/eutelsat.com',
  'Amazon': 'https://logo.clearbit.com/amazon.com',
  'European Union': 'https://logo.clearbit.com/europa.eu',
  'China SatNet': null,
  'Shanghai Spacecom': null,
  'Roscosmos': null,
  'Telesat': 'https://logo.clearbit.com/telesat.com',
  'SES': 'https://logo.clearbit.com/ses.com',
  'Planet Labs': 'https://logo.clearbit.com/planet.com',
  'BlackSky Technology': 'https://logo.clearbit.com/blacksky.com',
  'Spire': 'https://logo.clearbit.com/spire.com',
  'Iridium Communications': 'https://logo.clearbit.com/iridium.com',
  'ESA/EU': 'https://logo.clearbit.com/esa.int',
  'ESA/EUSPA': 'https://logo.clearbit.com/euspa.europa.eu',
  'CNSA': null,
  'AST SpaceMobile': 'https://logo.clearbit.com/ast-science.com',
  'Viasat': 'https://logo.clearbit.com/viasat.com',
  'Globalstar': 'https://logo.clearbit.com/globalstar.com',
  'ICEYE': 'https://logo.clearbit.com/iceye.com',
  'Lynk Global': 'https://logo.clearbit.com/lynk.world',
  'Maxar': 'https://logo.clearbit.com/maxar.com',
  'GHGSat': 'https://logo.clearbit.com/ghgsat.com',
  'Capella Space': 'https://logo.clearbit.com/capellaspace.com',
  'Satellogic': 'https://logo.clearbit.com/satellogic.com',
  'CASIC': null,
  'Rivada Networks': null,
  'E-Space': null,
  'Hanwha Systems': 'https://logo.clearbit.com/hanwha.com',
  'Omnispace': 'https://logo.clearbit.com/omnispace.com',
  'Kepler Communications': 'https://logo.clearbit.com/kepler.space'
}

function ConstellationCard({ constellation, onSelect, getLaunchersForConstellation, constellationTypes, orbitTypes }) {
  const launchers = getLaunchersForConstellation(constellation.id)
  const logoUrl = operatorLogos[constellation.operator]
  const typeConfig = constellationTypes[constellation.type] || {}
  const orbitConfig = orbitTypes[constellation.orbitType] || {}

  const deploymentPercent = constellation.satellitesPlanned > 0
    ? Math.round((constellation.satellitesDeployed / constellation.satellitesPlanned) * 100)
    : 0

  const getStatusColor = (status) => {
    switch (status) {
      case 'Operational': return '#10b981'
      case 'Deployment': return '#06b6d4'
      case 'Development': return '#f59e0b'
      default: return '#64748b'
    }
  }

  return (
    <div className="constellation-card" onClick={() => onSelect(constellation)}>
      <div className="constellation-card-header">
        <div className="constellation-identity">
          {logoUrl ? (
            <img
              src={logoUrl}
              alt={constellation.operator}
              className="operator-logo"
              onError={(e) => { e.target.style.display = 'none' }}
            />
          ) : (
            <div className="operator-logo-placeholder">
              {constellation.operator.charAt(0)}
            </div>
          )}
          <div className="constellation-titles">
            <h3 className="constellation-name">{constellation.name}</h3>
            <div className="constellation-operator">
              <span className="flag">{flagEmoji[constellation.countryCode]}</span>
              {constellation.operator}
            </div>
          </div>
        </div>
        <span
          className="status-badge"
          style={{ backgroundColor: getStatusColor(constellation.status) }}
        >
          {constellation.status}
        </span>
      </div>

      <div className="constellation-type-row">
        <span
          className="type-badge"
          style={{ backgroundColor: typeConfig.color || '#64748b' }}
        >
          {constellation.type}
        </span>
        {constellation.subcategory && (
          <span className="subcategory-badge">
            {constellation.subcategory}
          </span>
        )}
        <span
          className="orbit-badge"
          style={{ borderColor: orbitConfig.color || '#64748b', color: orbitConfig.color || '#64748b' }}
        >
          {constellation.orbitType} @ {Array.isArray(constellation.altitudeKm)
            ? `${constellation.altitudeKm[0]}-${constellation.altitudeKm[constellation.altitudeKm.length - 1]} km`
            : `${constellation.altitudeKm} km`}
        </span>
      </div>

      <p className="constellation-description">{constellation.description}</p>

      <div className="deployment-progress">
        <div className="deployment-header">
          <span>Deployment Progress</span>
          <span>{constellation.satellitesDeployed?.toLocaleString()} / {constellation.satellitesPlanned?.toLocaleString()}</span>
        </div>
        <div className="progress-bar">
          <div
            className="progress-fill"
            style={{ width: `${deploymentPercent}%` }}
          />
        </div>
        <div className="deployment-percent">{deploymentPercent}% deployed</div>
      </div>

      <div className="constellation-stats">
        {constellation.downloadSpeedMbps && (
          <div className="stat">
            <span className="stat-value">{constellation.downloadSpeedMbps}</span>
            <span className="stat-label">Mbps down</span>
          </div>
        )}
        {constellation.latencyMs && (
          <div className="stat">
            <span className="stat-value">{constellation.latencyMs}</span>
            <span className="stat-label">ms latency</span>
          </div>
        )}
        {constellation.subscribers && (
          <div className="stat">
            <span className="stat-value">
              {constellation.subscribers >= 1000000
                ? `${(constellation.subscribers / 1000000).toFixed(1)}M`
                : `${(constellation.subscribers / 1000).toFixed(0)}K`}
            </span>
            <span className="stat-label">subscribers</span>
          </div>
        )}
        {constellation.investmentBillionUSD && (
          <div className="stat">
            <span className="stat-value">${constellation.investmentBillionUSD}B</span>
            <span className="stat-label">investment</span>
          </div>
        )}
      </div>

      {launchers.length > 0 && (
        <div className="constellation-launchers">
          <div className="launchers-label">Launch Providers</div>
          <div className="launcher-chips">
            {launchers.slice(0, 3).map(l => (
              <span key={l.id} className="launcher-chip">{l.name}</span>
            ))}
            {launchers.length > 3 && (
              <span className="launcher-more">+{launchers.length - 3}</span>
            )}
          </div>
        </div>
      )}

      <div className="constellation-features">
        {constellation.interSatelliteLinks && (
          <span className="feature-badge isl">Inter-Satellite Links</span>
        )}
        {constellation.imagingResolutionM && (
          <span className="feature-badge">{constellation.imagingResolutionM}m resolution</span>
        )}
      </div>
    </div>
  )
}

function ConstellationDetail({ constellation, onClose, getLaunchersForConstellation, constellationTypes, orbitTypes }) {
  const launchers = getLaunchersForConstellation(constellation.id)
  const logoUrl = operatorLogos[constellation.operator]
  const typeConfig = constellationTypes[constellation.type] || {}

  const deploymentPercent = constellation.satellitesPlanned > 0
    ? Math.round((constellation.satellitesDeployed / constellation.satellitesPlanned) * 100)
    : 0

  return (
    <div className="constellation-detail-overlay" onClick={onClose}>
      <div className="constellation-detail" onClick={e => e.stopPropagation()}>
        <button className="detail-close" onClick={onClose}>&times;</button>

        <div className="detail-header">
          {logoUrl ? (
            <img src={logoUrl} alt={constellation.operator} className="detail-logo" />
          ) : (
            <div className="detail-logo-placeholder">{constellation.operator.charAt(0)}</div>
          )}
          <div>
            <h2>{constellation.name}</h2>
            <p className="detail-operator">
              {flagEmoji[constellation.countryCode]} {constellation.operator}
            </p>
            <div className="detail-badges">
              <span
                className="detail-type-badge"
                style={{ backgroundColor: typeConfig.color || '#64748b' }}
              >
                {constellation.type}
              </span>
              {constellation.subcategory && (
                <span className="detail-subcategory-badge">
                  {constellation.subcategory}
                </span>
              )}
            </div>
          </div>
        </div>

        <p className="detail-description">{constellation.description}</p>

        <div className="detail-section">
          <h3>Constellation Status</h3>
          <div className="deployment-detail">
            <div className="deployment-numbers">
              <div className="deploy-stat">
                <span className="deploy-value">{constellation.satellitesPlanned?.toLocaleString()}</span>
                <span className="deploy-label">Planned</span>
              </div>
              <div className="deploy-stat">
                <span className="deploy-value">{constellation.satellitesDeployed?.toLocaleString()}</span>
                <span className="deploy-label">Deployed</span>
              </div>
              <div className="deploy-stat">
                <span className="deploy-value">{constellation.satellitesOperational?.toLocaleString()}</span>
                <span className="deploy-label">Operational</span>
              </div>
            </div>
            <div className="deployment-bar-large">
              <div className="progress-fill" style={{ width: `${deploymentPercent}%` }} />
              <span className="progress-label">{deploymentPercent}%</span>
            </div>
          </div>
        </div>

        <div className="detail-section">
          <h3>Orbital Parameters</h3>
          <div className="specs-grid">
            <div className="spec">
              <span className="spec-label">Orbit Type</span>
              <span className="spec-value">{constellation.orbitType}</span>
            </div>
            <div className="spec">
              <span className="spec-label">Altitude</span>
              <span className="spec-value">
                {Array.isArray(constellation.altitudeKm)
                  ? constellation.altitudeKm.join(', ')
                  : constellation.altitudeKm} km
              </span>
            </div>
            <div className="spec">
              <span className="spec-label">Inclination</span>
              <span className="spec-value">
                {Array.isArray(constellation.inclinationDeg)
                  ? constellation.inclinationDeg.join(', ')
                  : constellation.inclinationDeg}&deg;
              </span>
            </div>
            <div className="spec">
              <span className="spec-label">Coverage</span>
              <span className="spec-value">{constellation.coverageArea}</span>
            </div>
          </div>
        </div>

        <div className="detail-section">
          <h3>Satellite Specifications</h3>
          <div className="specs-grid">
            {constellation.satelliteMassKg && (
              <div className="spec">
                <span className="spec-label">Mass per Satellite</span>
                <span className="spec-value">{constellation.satelliteMassKg} kg</span>
              </div>
            )}
            {constellation.designLifeYears && (
              <div className="spec">
                <span className="spec-label">Design Life</span>
                <span className="spec-value">{constellation.designLifeYears} years</span>
              </div>
            )}
            {constellation.generationCurrent && (
              <div className="spec">
                <span className="spec-label">Current Generation</span>
                <span className="spec-value">{constellation.generationCurrent}</span>
              </div>
            )}
            {constellation.propulsion && (
              <div className="spec">
                <span className="spec-label">Propulsion</span>
                <span className="spec-value">{constellation.propulsion}</span>
              </div>
            )}
          </div>
        </div>

        {(constellation.downloadSpeedMbps || constellation.latencyMs) && (
          <div className="detail-section">
            <h3>Performance</h3>
            <div className="specs-grid">
              {constellation.downloadSpeedMbps && (
                <div className="spec">
                  <span className="spec-label">Download Speed</span>
                  <span className="spec-value">{constellation.downloadSpeedMbps} Mbps</span>
                </div>
              )}
              {constellation.uploadSpeedMbps && (
                <div className="spec">
                  <span className="spec-label">Upload Speed</span>
                  <span className="spec-value">{constellation.uploadSpeedMbps} Mbps</span>
                </div>
              )}
              {constellation.latencyMs && (
                <div className="spec">
                  <span className="spec-label">Latency</span>
                  <span className="spec-value">{constellation.latencyMs} ms</span>
                </div>
              )}
              {constellation.frequencyBands && constellation.frequencyBands.length > 0 && (
                <div className="spec">
                  <span className="spec-label">Frequency Bands</span>
                  <span className="spec-value">{constellation.frequencyBands.join(', ')}</span>
                </div>
              )}
            </div>
          </div>
        )}

        <div className="detail-section">
          <h3>Business & Timeline</h3>
          <div className="specs-grid">
            {constellation.firstLaunch && (
              <div className="spec">
                <span className="spec-label">First Launch</span>
                <span className="spec-value">
                  {new Date(constellation.firstLaunch).toLocaleDateString('en-US', {
                    year: 'numeric', month: 'short'
                  })}
                </span>
              </div>
            )}
            {constellation.fullDeploymentTarget && (
              <div className="spec">
                <span className="spec-label">Full Deployment</span>
                <span className="spec-value">{constellation.fullDeploymentTarget}</span>
              </div>
            )}
            {constellation.investmentBillionUSD && (
              <div className="spec">
                <span className="spec-label">Investment</span>
                <span className="spec-value">${constellation.investmentBillionUSD}B</span>
              </div>
            )}
            {constellation.annualRevenueBillionUSD && (
              <div className="spec">
                <span className="spec-label">Annual Revenue</span>
                <span className="spec-value">${constellation.annualRevenueBillionUSD}B</span>
              </div>
            )}
            {constellation.subscribers && (
              <div className="spec">
                <span className="spec-label">Subscribers</span>
                <span className="spec-value">{constellation.subscribers.toLocaleString()}</span>
              </div>
            )}
            {constellation.groundStations && (
              <div className="spec">
                <span className="spec-label">Ground Stations</span>
                <span className="spec-value">{constellation.groundStations}</span>
              </div>
            )}
          </div>
        </div>

        {constellation.primaryMarkets && constellation.primaryMarkets.length > 0 && (
          <div className="detail-section">
            <h3>Target Markets</h3>
            <div className="markets-list">
              {constellation.primaryMarkets.map((market, idx) => (
                <span key={idx} className="market-chip">{market}</span>
              ))}
            </div>
          </div>
        )}

        {launchers.length > 0 && (
          <div className="detail-section">
            <h3>Launch Providers</h3>
            <div className="providers-list">
              {launchers.map(l => (
                <div key={l.id} className="provider-card">
                  <span className="provider-name">{l.name}</span>
                  <span className="provider-company">{l.company}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {constellation.sources && constellation.sources.length > 0 && (
          <div className="detail-section">
            <h3>Sources</h3>
            <div className="sources-list">
              {constellation.sources.map((source, idx) => (
                <a
                  key={idx}
                  href={source.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="constellation-source-link"
                >
                  <span className="source-icon">↗</span>
                  {source.title}
                </a>
              ))}
            </div>
          </div>
        )}

        <div className="detail-features">
          {constellation.interSatelliteLinks && (
            <span className="feature-detail isl">Inter-Satellite Links</span>
          )}
        </div>
      </div>
    </div>
  )
}

function ConstellationsPage() {
  const {
    constellationsData,
    getLaunchersForConstellation,
    constellationTypes,
    orbitTypes,
    countries
  } = useData()

  const [selectedConstellation, setSelectedConstellation] = useState(null)
  const [viewMode, setViewMode] = useState('cards') // 'cards' or 'timeline'
  const [searchQuery, setSearchQuery] = useState('')
  const [filters, setFilters] = useState({
    status: 'all',
    type: 'all',
    subcategory: 'all',
    orbit: 'all',
    country: 'all'
  })
  const [sortBy, setSortBy] = useState('satellitesDeployed')

  // Get subcategories for selected type
  const availableSubcategories = useMemo(() => {
    if (filters.type === 'all') return []
    const typeConfig = constellationTypes[filters.type]
    return typeConfig?.subcategories ? Object.keys(typeConfig.subcategories) : []
  }, [filters.type, constellationTypes])

  const filteredConstellations = useMemo(() => {
    let result = [...constellationsData.constellations]

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      result = result.filter(c =>
        c.name.toLowerCase().includes(query) ||
        c.operator.toLowerCase().includes(query) ||
        (c.type && c.type.toLowerCase().includes(query))
      )
    }

    if (filters.status !== 'all') {
      result = result.filter(c => c.status === filters.status)
    }
    if (filters.type !== 'all') {
      result = result.filter(c => c.type === filters.type)
    }
    if (filters.subcategory !== 'all') {
      result = result.filter(c => c.subcategory === filters.subcategory)
    }
    if (filters.orbit !== 'all') {
      result = result.filter(c => c.orbitType === filters.orbit)
    }
    if (filters.country !== 'all') {
      result = result.filter(c => c.countryCode === filters.country)
    }

    result.sort((a, b) => {
      const aVal = a[sortBy] ?? 0
      const bVal = b[sortBy] ?? 0
      return bVal - aVal
    })

    return result
  }, [constellationsData.constellations, filters, searchQuery, sortBy])

  const uniqueTypes = [...new Set(constellationsData.constellations.map(c => c.type))]
  const uniqueOrbits = [...new Set(constellationsData.constellations.map(c => c.orbitType))]
  const uniqueCountries = [...new Set(constellationsData.constellations.map(c => c.countryCode))]

  const totalDeployed = constellationsData.constellations.reduce(
    (sum, c) => sum + (c.satellitesDeployed || 0), 0
  )
  const totalPlanned = constellationsData.constellations.reduce(
    (sum, c) => sum + (c.satellitesPlanned || 0), 0
  )

  // Reset subcategory when type changes
  const handleTypeChange = (newType) => {
    setFilters(f => ({ ...f, type: newType, subcategory: 'all' }))
  }

  return (
    <div className="constellations-page">
      <div className="page-header">
        <div className="header-content">
          <h1>Satellite Constellations</h1>
          <p className="page-subtitle">
            Comprehensive overview of major satellite constellation initiatives worldwide
          </p>
        </div>
        <div className="header-actions">
          <div className="view-toggle">
            <button
              className={`view-toggle-btn ${viewMode === 'cards' ? 'active' : ''}`}
              onClick={() => setViewMode('cards')}
              title="Card View"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                <rect x="1" y="1" width="6" height="6" rx="1" />
                <rect x="9" y="1" width="6" height="6" rx="1" />
                <rect x="1" y="9" width="6" height="6" rx="1" />
                <rect x="9" y="9" width="6" height="6" rx="1" />
              </svg>
              Cards
            </button>
            <button
              className={`view-toggle-btn ${viewMode === 'timeline' ? 'active' : ''}`}
              onClick={() => setViewMode('timeline')}
              title="Timeline View"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                <rect x="1" y="2" width="10" height="3" rx="1" />
                <rect x="3" y="7" width="12" height="3" rx="1" />
                <rect x="2" y="12" width="8" height="3" rx="1" />
              </svg>
              Timeline
            </button>
          </div>
          <div className="header-stats">
            <div className="header-stat">
              <span className="header-stat-value">{constellationsData.constellations.length}</span>
              <span className="header-stat-label">Constellations</span>
            </div>
            <div className="header-stat">
              <span className="header-stat-value">{totalDeployed.toLocaleString()}</span>
              <span className="header-stat-label">Deployed</span>
            </div>
            <div className="header-stat">
              <span className="header-stat-value">{totalPlanned.toLocaleString()}</span>
              <span className="header-stat-label">Planned</span>
            </div>
          </div>
        </div>
      </div>

      <ConstellationSourcesPanel dataSources={constellationsData.dataSources} />

      {viewMode === 'timeline' ? (
        <ConstellationTimeline
          constellations={constellationsData.constellations}
          constellationTypes={constellationTypes}
        />
      ) : (
        <>
      <div className="filters-bar">
        <div className="filter-group search-group">
          <label>Search</label>
          <div className="search-input-wrapper">
            <input
              type="text"
              className="search-input"
              placeholder="Search constellations..."
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
            <option value="Operational">Operational</option>
            <option value="Deployment">Deployment</option>
            <option value="Development">Development</option>
          </select>
        </div>

        <div className="filter-group">
          <label>Type</label>
          <select
            value={filters.type}
            onChange={e => handleTypeChange(e.target.value)}
          >
            <option value="all">All</option>
            {uniqueTypes.map(type => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
        </div>

        {availableSubcategories.length > 0 && (
          <div className="filter-group">
            <label>Subcategory</label>
            <select
              value={filters.subcategory}
              onChange={e => setFilters(f => ({ ...f, subcategory: e.target.value }))}
            >
              <option value="all">All</option>
              {availableSubcategories.map(sub => (
                <option key={sub} value={sub}>{sub}</option>
              ))}
            </select>
          </div>
        )}

        <div className="filter-group">
          <label>Orbit</label>
          <select
            value={filters.orbit}
            onChange={e => setFilters(f => ({ ...f, orbit: e.target.value }))}
          >
            <option value="all">All</option>
            {uniqueOrbits.map(orbit => (
              <option key={orbit} value={orbit}>{orbit}</option>
            ))}
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
          <label>Sort by</label>
          <select value={sortBy} onChange={e => setSortBy(e.target.value)}>
            <option value="satellitesDeployed">Satellites Deployed</option>
            <option value="satellitesPlanned">Satellites Planned</option>
            <option value="investmentBillionUSD">Investment</option>
            <option value="subscribers">Subscribers</option>
          </select>
        </div>
      </div>

      <div className="constellations-grid">
        {filteredConstellations.map(constellation => (
          <ConstellationCard
            key={constellation.id}
            constellation={constellation}
            onSelect={setSelectedConstellation}
            getLaunchersForConstellation={getLaunchersForConstellation}
            constellationTypes={constellationTypes}
            orbitTypes={orbitTypes}
          />
        ))}
      </div>

      {filteredConstellations.length === 0 && (
        <div className="no-results">
          No constellations match the selected filters.
        </div>
      )}
        </>
      )}

      {selectedConstellation && (
        <ConstellationDetail
          constellation={selectedConstellation}
          onClose={() => setSelectedConstellation(null)}
          getLaunchersForConstellation={getLaunchersForConstellation}
          constellationTypes={constellationTypes}
          orbitTypes={orbitTypes}
        />
      )}
    </div>
  )
}

export default ConstellationsPage
