import { useState, useMemo } from 'react'
import { useData } from '../context/DataContext'
import {
  ComposedChart,
  Area,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine
} from 'recharts'
import SatellitesSidebar from '../components/SatellitesSidebar'
import './SatellitesPage.css'

// Country flag emoji mapping
const flagEmoji = {
  EU: '\u{1F1EA}\u{1F1FA}',
  FR: '\u{1F1EB}\u{1F1F7}',
  DE: '\u{1F1E9}\u{1F1EA}',
  IT: '\u{1F1EE}\u{1F1F9}',
  UK: '\u{1F1EC}\u{1F1E7}',
  NL: '\u{1F1F3}\u{1F1F1}',
  DK: '\u{1F1E9}\u{1F1F0}',
  SE: '\u{1F1F8}\u{1F1EA}',
  LT: '\u{1F1F1}\u{1F1F9}',
  BG: '\u{1F1E7}\u{1F1EC}',
  ES: '\u{1F1EA}\u{1F1F8}',
  US: '\u{1F1FA}\u{1F1F8}'
}

// Company logo URLs
const companyLogos = {
  'SpaceX': 'https://logo.clearbit.com/spacex.com',
  'Airbus Defence and Space': 'https://logo.clearbit.com/airbus.com',
  'Thales Alenia Space': 'https://logo.clearbit.com/thalesgroup.com',
  'OHB SE': 'https://logo.clearbit.com/ohb.de',
  'SSTL (Surrey Satellite)': 'https://logo.clearbit.com/sstl.co.uk',
  'EnduroSat': 'https://logo.clearbit.com/endurosat.com',
  'NanoAvionics': 'https://logo.clearbit.com/nanoavionics.com',
  'AAC Clyde Space': 'https://logo.clearbit.com/aac-clyde.space',
  'ISISPACE': 'https://logo.clearbit.com/isispace.nl',
  'GomSpace': 'https://logo.clearbit.com/gomspace.com',
  'Open Cosmos': 'https://logo.clearbit.com/open-cosmos.com',
  'D-Orbit': 'https://logo.clearbit.com/dorbit.space',
  'Loft Orbital': 'https://logo.clearbit.com/loftorbital.com',
  'Exolaunch': 'https://logo.clearbit.com/exolaunch.com',
  'Satellite Vu': 'https://logo.clearbit.com/satellitevu.com',
  'Spire Global': 'https://logo.clearbit.com/spire.com',
  'Argotec': 'https://logo.clearbit.com/argotecgroup.com',
  'OroraTech': 'https://logo.clearbit.com/ororatech.com',
  'Kineis': 'https://logo.clearbit.com/kineis.com'
}

// Short labels for chart legend
const SHORT_LABELS = {
  'CubeSats (1-27U)': 'CubeSats',
  'Microsats (11-200kg)': 'Microsats',
  'Minisats (200-600kg)': 'Minisats',
  'Medium (600-2500kg)': 'Medium',
  'Large (2500kg+)': 'Large',
  'Communications': 'Comms',
  'Earth Observation': 'EO',
  'Navigation': 'Nav',
  'IoT / M2M': 'IoT',
  'Science / Tech Demo': 'Science',
  'Defense / ISR': 'Defense',
  'Commercial': 'Commercial',
  'Government / Civil': 'Gov/Civil',
  'Defense / Military': 'Defense',
  'Academic / Research': 'Academic'
}

function CustomTooltip({ active, payload, label, metric, forecastStartYear }) {
  if (!active || !payload || !payload.length) return null

  const isForecast = parseInt(label) >= forecastStartYear
  const total = payload.reduce((sum, entry) => sum + (entry.value || 0), 0)

  return (
    <div className="satellite-tooltip">
      <div className="tooltip-header">
        <span className="tooltip-year">{label}</span>
        {isForecast && <span className="tooltip-forecast-badge">Forecast</span>}
      </div>
      <div className="tooltip-content">
        {payload.map((entry, idx) => (
          <div key={idx} className="tooltip-row">
            <span className="tooltip-color" style={{ backgroundColor: entry.color }} />
            <span className="tooltip-label">{SHORT_LABELS[entry.name] || entry.name}</span>
            <span className="tooltip-value">
              {metric.includes('count')
                ? Math.round(entry.value).toLocaleString()
                : `$${entry.value.toFixed(2)}B`}
            </span>
          </div>
        ))}
        <div className="tooltip-total">
          <span>Total</span>
          <span>
            {metric.includes('count')
              ? Math.round(total).toLocaleString()
              : `$${total.toFixed(2)}B`}
          </span>
        </div>
      </div>
    </div>
  )
}

function ManufacturerCard({ manufacturer, onSelect, getLaunchersForManufacturer }) {
  const launchers = getLaunchersForManufacturer(manufacturer.id)
  const logoUrl = companyLogos[manufacturer.name]

  const formatNumber = (num) => {
    if (num === null || num === undefined) return 'TBD'
    if (num >= 1000) return `${(num / 1000).toFixed(1)}k`
    return num.toLocaleString()
  }

  const formatRevenue = (num) => {
    if (!num) return 'N/A'
    if (num >= 1) return `$${num.toFixed(1)}B`
    return `$${(num * 1000).toFixed(0)}M`
  }

  const getTypeColor = (type) => {
    switch (type) {
      case 'Prime Contractor': return '#8b5cf6'
      case 'Manufacturer': return '#06b6d4'
      case 'Launch Services': return '#f59e0b'
      default: return '#64748b'
    }
  }

  return (
    <div className="manufacturer-card" onClick={() => onSelect(manufacturer)}>
      <div className="manufacturer-card-header">
        <div className="manufacturer-identity">
          {logoUrl ? (
            <img
              src={logoUrl}
              alt={manufacturer.name}
              className="company-logo"
              onError={(e) => { e.target.style.display = 'none' }}
            />
          ) : (
            <div className="company-logo-placeholder">
              {manufacturer.shortName?.charAt(0) || manufacturer.name.charAt(0)}
            </div>
          )}
          <div className="manufacturer-titles">
            <h3 className="manufacturer-name">{manufacturer.shortName || manufacturer.name}</h3>
            <div className="manufacturer-company">
              <span className="flag">{flagEmoji[manufacturer.countryCode]}</span>
              {manufacturer.country}
            </div>
          </div>
        </div>
        <span
          className="type-badge"
          style={{ backgroundColor: getTypeColor(manufacturer.type) }}
        >
          {manufacturer.type}
        </span>
      </div>

      <p className="manufacturer-description">{manufacturer.description}</p>

      <div className="manufacturer-stats">
        <div className="stat">
          <span className="stat-value">{formatNumber(manufacturer.satellitesBuilt)}</span>
          <span className="stat-label">satellites built</span>
        </div>
        <div className="stat">
          <span className="stat-value">{formatRevenue(manufacturer.annualRevenueBillionUSD)}</span>
          <span className="stat-label">annual revenue</span>
        </div>
        <div className="stat">
          <span className="stat-value">{manufacturer.employees?.toLocaleString() || 'N/A'}</span>
          <span className="stat-label">employees</span>
        </div>
        {manufacturer.totalFundingMillionUSD && (
          <div className="stat">
            <span className="stat-value">${manufacturer.totalFundingMillionUSD}M</span>
            <span className="stat-label">funding</span>
          </div>
        )}
      </div>

      <div className="manufacturer-capabilities">
        <div className="capabilities-label">Size Classes</div>
        <div className="capability-chips">
          {(manufacturer.sizeClasses || []).slice(0, 3).map((cap, idx) => (
            <span key={idx} className="capability-chip">{SHORT_LABELS[cap] || cap}</span>
          ))}
        </div>
      </div>

      {launchers.length > 0 && (
        <div className="manufacturer-launchers">
          <div className="launchers-label">Preferred Launchers</div>
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
    </div>
  )
}

function ManufacturerDetail({ manufacturer, onClose, getLaunchersForManufacturer }) {
  const launchers = getLaunchersForManufacturer(manufacturer.id)
  const logoUrl = companyLogos[manufacturer.name]

  const formatRevenue = (num) => {
    if (!num) return 'N/A'
    if (num >= 1) return `$${num.toFixed(1)}B`
    return `$${(num * 1000).toFixed(0)}M`
  }

  return (
    <div className="manufacturer-detail-overlay" onClick={onClose}>
      <div className="manufacturer-detail" onClick={e => e.stopPropagation()}>
        <button className="detail-close" onClick={onClose}>&times;</button>

        <div className="detail-header">
          {logoUrl ? (
            <img src={logoUrl} alt={manufacturer.name} className="detail-logo" />
          ) : (
            <div className="detail-logo-placeholder">
              {manufacturer.shortName?.charAt(0) || manufacturer.name.charAt(0)}
            </div>
          )}
          <div>
            <h2>{manufacturer.name}</h2>
            <p className="detail-company">
              {flagEmoji[manufacturer.countryCode]} {manufacturer.country}
            </p>
          </div>
        </div>

        <p className="detail-description">{manufacturer.description}</p>

        <div className="detail-section">
          <h3>Company Overview</h3>
          <div className="specs-grid">
            <div className="spec">
              <span className="spec-label">Founded</span>
              <span className="spec-value">{manufacturer.founded || 'N/A'}</span>
            </div>
            <div className="spec">
              <span className="spec-label">Employees</span>
              <span className="spec-value">{manufacturer.employees?.toLocaleString() || 'N/A'}</span>
            </div>
            <div className="spec">
              <span className="spec-label">Annual Revenue</span>
              <span className="spec-value">{formatRevenue(manufacturer.annualRevenueBillionUSD)}</span>
            </div>
            {manufacturer.totalFundingMillionUSD && (
              <div className="spec">
                <span className="spec-label">Total Funding</span>
                <span className="spec-value">${manufacturer.totalFundingMillionUSD}M</span>
              </div>
            )}
            <div className="spec">
              <span className="spec-label">Satellites Built</span>
              <span className="spec-value">{manufacturer.satellitesBuilt?.toLocaleString() || 'N/A'}</span>
            </div>
            {manufacturer.satellitesDeployed && (
              <div className="spec">
                <span className="spec-label">Deployed</span>
                <span className="spec-value">{manufacturer.satellitesDeployed}</span>
              </div>
            )}
            {manufacturer.backlogSatellites && (
              <div className="spec">
                <span className="spec-label">Backlog</span>
                <span className="spec-value">{manufacturer.backlogSatellites} satellites</span>
              </div>
            )}
          </div>
        </div>

        <div className="detail-section">
          <h3>Capabilities</h3>
          <div className="capability-tags">
            {(manufacturer.capabilities || []).map((cap, idx) => (
              <span key={idx} className="capability-tag">{cap}</span>
            ))}
          </div>
        </div>

        <div className="detail-section">
          <h3>Size Classes</h3>
          <div className="size-class-tags">
            {(manufacturer.sizeClasses || []).map((sc, idx) => (
              <span key={idx} className="size-class-tag">{sc}</span>
            ))}
          </div>
        </div>

        {manufacturer.notablePrograms && manufacturer.notablePrograms.length > 0 && (
          <div className="detail-section">
            <h3>Notable Programs</h3>
            <div className="programs-list">
              {manufacturer.notablePrograms.map((program, idx) => (
                <span key={idx} className="program-chip">{program}</span>
              ))}
            </div>
          </div>
        )}

        {launchers.length > 0 && (
          <div className="detail-section">
            <h3>Preferred Launch Providers</h3>
            <div className="launchers-served">
              {launchers.map(l => (
                <div key={l.id} className="served-launcher">
                  <span className="served-name">{l.name}</span>
                  <span className="served-company">{l.company}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {manufacturer.customers && manufacturer.customers.length > 0 && (
          <div className="detail-section">
            <h3>Key Customers</h3>
            <div className="customers-list">
              {manufacturer.customers.map((customer, idx) => (
                <span key={idx} className="customer-chip">{customer}</span>
              ))}
            </div>
          </div>
        )}

        {manufacturer.website && (
          <div className="detail-section">
            <a
              href={manufacturer.website}
              target="_blank"
              rel="noopener noreferrer"
              className="website-link"
            >
              Visit Website
            </a>
          </div>
        )}
      </div>
    </div>
  )
}

function SatellitesPage() {
  const {
    satellitesData,
    getLaunchersForManufacturer,
    sizeClassColors,
    applicationColors,
    operatorTypeColors,
    countries
  } = useData()

  const [selectedManufacturer, setSelectedManufacturer] = useState(null)
  const [metric, setMetric] = useState('market') // 'market' or 'count'
  const [categoryType, setCategoryType] = useState('sizeClass') // 'sizeClass', 'application', 'operatorType'
  const [showEurope, setShowEurope] = useState(true)
  const [chartMode, setChartMode] = useState('area') // 'area' or 'line'
  const [yearRange, setYearRange] = useState([2020, 2035])
  const [filters, setFilters] = useState({
    type: 'all',
    country: 'all',
    sizeClass: 'all'
  })
  const [sortBy, setSortBy] = useState('satellitesBuilt')

  // Get the appropriate color palette based on category type
  const getColors = () => {
    switch (categoryType) {
      case 'sizeClass': return sizeClassColors
      case 'application': return applicationColors
      case 'operatorType': return operatorTypeColors
      default: return sizeClassColors
    }
  }

  const colors = getColors()

  // Get categories for the selected category type
  const categories = satellitesData.categories[categoryType]?.items || []

  // Prepare chart data with year range filter
  const chartData = useMemo(() => {
    const metricName = metric === 'market'
      ? 'Satellite manufacturing market (USD, $B)'
      : 'Satellites launched (count)'

    // Filter years by range
    const filteredYears = satellitesData.years.filter(y => {
      const year = parseInt(y)
      return year >= yearRange[0] && year <= yearRange[1]
    })

    return filteredYears.map(year => {
      const dataPoint = { year }

      // Get data for each category
      categories.forEach(category => {
        const entry = satellitesData.data.find(
          d => d.metric === metricName &&
               d.category === category &&
               d.categoryType === categoryType &&
               d.region === 'Global'
        )
        dataPoint[category] = entry?.values[year] || 0

        // Get Europe data if showing overlay
        if (showEurope) {
          const europeEntry = satellitesData.data.find(
            d => d.metric === metricName &&
                 d.category === category &&
                 d.categoryType === categoryType &&
                 d.region === 'Europe'
          )
          dataPoint[`${category}_europe`] = europeEntry?.values[year] || 0
        }
      })

      return dataPoint
    })
  }, [satellitesData, metric, categoryType, categories, showEurope, yearRange])

  // Filtered manufacturers
  const filteredManufacturers = useMemo(() => {
    let result = [...satellitesData.manufacturers]

    if (filters.type !== 'all') {
      result = result.filter(m => m.type === filters.type)
    }
    if (filters.country !== 'all') {
      result = result.filter(m => m.countryCode === filters.country)
    }
    if (filters.sizeClass !== 'all') {
      result = result.filter(m =>
        (m.sizeClasses || []).some(sc => sc.includes(filters.sizeClass))
      )
    }

    result.sort((a, b) => {
      const aVal = a[sortBy] ?? 0
      const bVal = b[sortBy] ?? 0
      return bVal - aVal
    })

    return result
  }, [satellitesData.manufacturers, filters, sortBy])

  const uniqueTypes = [...new Set(satellitesData.manufacturers.map(m => m.type))]
  const uniqueCountries = [...new Set(satellitesData.manufacturers.map(m => m.countryCode))]

  // Calculate totals for KPIs
  const totals = useMemo(() => {
    const metricName = metric === 'market'
      ? 'Satellite manufacturing market (USD, $B)'
      : 'Satellites launched (count)'

    const globalTotal = satellitesData.data.find(
      d => d.metric === metricName &&
           d.category === 'Total' &&
           d.region === 'Global'
    )

    const europeTotal = satellitesData.data.find(
      d => d.metric === metricName &&
           d.category === 'Total' &&
           d.region === 'Europe'
    )

    const currentYear = '2025'
    const endYear = '2030'

    const globalCurrent = globalTotal?.values[currentYear] || 0
    const globalEnd = globalTotal?.values[endYear] || 0
    const europeCurrent = europeTotal?.values[currentYear] || 0
    const europeEnd = europeTotal?.values[endYear] || 0

    const globalCAGR = globalCurrent > 0
      ? ((Math.pow(globalEnd / globalCurrent, 1/5) - 1) * 100).toFixed(1)
      : 0

    const europeShare = globalCurrent > 0
      ? ((europeCurrent / globalCurrent) * 100).toFixed(1)
      : 0

    return {
      globalCurrent,
      globalEnd,
      europeCurrent,
      globalCAGR,
      europeShare
    }
  }, [satellitesData, metric])

  return (
    <div className="satellites-page">
      <SatellitesSidebar
        years={satellitesData.years}
        metric={metric}
        setMetric={setMetric}
        categoryType={categoryType}
        setCategoryType={setCategoryType}
        showEurope={showEurope}
        setShowEurope={setShowEurope}
        yearRange={yearRange}
        setYearRange={setYearRange}
        chartMode={chartMode}
        setChartMode={setChartMode}
      />

      <main className="satellites-main">
        <div className="page-header">
          <div className="header-content">
            <h1>Satellite Manufacturing</h1>
            <p className="page-subtitle">
              Market evolution, projections, and key manufacturers
            </p>
          </div>
          <div className="header-stats">
            <div className="header-stat">
              <span className="header-stat-value">{satellitesData.manufacturers.length}</span>
              <span className="header-stat-label">Manufacturers</span>
            </div>
            <div className="header-stat">
              <span className="header-stat-value">
                {metric === 'market'
                  ? `$${totals.globalCurrent.toFixed(1)}B`
                  : totals.globalCurrent.toLocaleString()}
              </span>
              <span className="header-stat-label">{metric === 'market' ? '2025 Market' : '2025 Satellites'}</span>
            </div>
            <div className="header-stat">
              <span className="header-stat-value">{totals.globalCAGR}%</span>
              <span className="header-stat-label">CAGR to 2030</span>
            </div>
            <div className="header-stat europe-stat">
              <span className="header-stat-value">{totals.europeShare}%</span>
              <span className="header-stat-label">Europe Share</span>
            </div>
          </div>
        </div>

        {/* Chart */}
      <div className="chart-container">
        <ResponsiveContainer width="100%" height={400}>
          <ComposedChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            <defs>
              {categories.map((category, idx) => (
                <linearGradient key={category} id={`gradient-${idx}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={colors[category]} stopOpacity={0.8} />
                  <stop offset="95%" stopColor={colors[category]} stopOpacity={0.3} />
                </linearGradient>
              ))}
              <pattern id="europePattern" patternUnits="userSpaceOnUse" width="6" height="6">
                <path d="M0,6 L6,0" stroke="rgba(255,255,255,0.4)" strokeWidth="1" />
              </pattern>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
            <XAxis
              dataKey="year"
              tick={{ fill: '#94a3b8', fontSize: 12 }}
              axisLine={{ stroke: '#334155' }}
            />
            <YAxis
              tick={{ fill: '#94a3b8', fontSize: 12 }}
              axisLine={{ stroke: '#334155' }}
              tickFormatter={(value) =>
                metric === 'market' ? `$${value}B` : value.toLocaleString()
              }
            />
            <Tooltip
              content={
                <CustomTooltip
                  metric={metric}
                  forecastStartYear={satellitesData.forecastStartYear}
                />
              }
            />
            <Legend
              formatter={(value) => SHORT_LABELS[value] || value}
              wrapperStyle={{ paddingTop: 20 }}
            />

            {/* Forecast reference line */}
            <ReferenceLine
              x={String(satellitesData.forecastStartYear)}
              stroke="#64748b"
              strokeDasharray="5 5"
              label={{
                value: 'Forecast',
                position: 'top',
                fill: '#64748b',
                fontSize: 11
              }}
            />

            {/* Chart series - Area or Line based on chartMode */}
            {chartMode === 'area' ? (
              <>
                {categories.map((category, idx) => (
                  <Area
                    key={category}
                    type="monotone"
                    dataKey={category}
                    stackId="1"
                    stroke={colors[category]}
                    fill={`url(#gradient-${idx})`}
                    name={category}
                  />
                ))}
                {/* Europe overlay areas */}
                {showEurope && categories.map((category) => (
                  <Area
                    key={`${category}_europe`}
                    type="monotone"
                    dataKey={`${category}_europe`}
                    stackId="2"
                    stroke="none"
                    fill="url(#europePattern)"
                    name={`${category} (Europe)`}
                    legendType="none"
                  />
                ))}
              </>
            ) : (
              <>
                {categories.map((category) => (
                  <Line
                    key={category}
                    type="monotone"
                    dataKey={category}
                    stroke={colors[category]}
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 5, fill: colors[category] }}
                    name={category}
                  />
                ))}
                {/* Europe lines */}
                {showEurope && categories.map((category) => (
                  <Line
                    key={`${category}_europe`}
                    type="monotone"
                    dataKey={`${category}_europe`}
                    stroke={colors[category]}
                    strokeWidth={2}
                    strokeDasharray="5 5"
                    dot={false}
                    name={`${category} (Europe)`}
                    legendType="none"
                  />
                ))}
              </>
            )}
          </ComposedChart>
        </ResponsiveContainer>

        {showEurope && (
          <div className="europe-legend">
            <span className={`europe-legend-icon ${chartMode === 'line' ? 'dashed' : ''}`} />
            <span>
              {chartMode === 'area'
                ? 'European market share (diagonal pattern)'
                : 'European market share (dashed lines)'}
            </span>
          </div>
        )}
      </div>

      {/* Key Insights */}
      <div className="insights-section">
        <h2>Market Opportunity Insights</h2>
        <div className="insights-grid">
          {Object.entries(satellitesData.keyInsights).map(([key, insight]) => (
            <div key={key} className="insight-card">
              <div className="insight-header">
                <h3>{insight.title}</h3>
                <span className={`opportunity-badge ${insight.opportunity.toLowerCase()}`}>
                  {insight.opportunity} Opportunity
                </span>
              </div>
              <p>{insight.description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Manufacturers Section */}
        <div className="manufacturers-section">
          <h2>Satellite Manufacturers</h2>

        <div className="filters-bar">
          <div className="filter-group">
            <label>Type</label>
            <select
              value={filters.type}
              onChange={e => setFilters(f => ({ ...f, type: e.target.value }))}
            >
              <option value="all">All Types</option>
              {uniqueTypes.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <label>Country</label>
            <select
              value={filters.country}
              onChange={e => setFilters(f => ({ ...f, country: e.target.value }))}
            >
              <option value="all">All Countries</option>
              {uniqueCountries.map(code => (
                <option key={code} value={code}>
                  {flagEmoji[code]} {countries[code]?.name || code}
                </option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <label>Size Class</label>
            <select
              value={filters.sizeClass}
              onChange={e => setFilters(f => ({ ...f, sizeClass: e.target.value }))}
            >
              <option value="all">All Sizes</option>
              <option value="CubeSat">CubeSats</option>
              <option value="Microsat">Microsats</option>
              <option value="Minisat">Minisats</option>
              <option value="Medium">Medium</option>
              <option value="Large">Large</option>
            </select>
          </div>

          <div className="filter-group">
            <label>Sort by</label>
            <select value={sortBy} onChange={e => setSortBy(e.target.value)}>
              <option value="satellitesBuilt">Satellites Built</option>
              <option value="annualRevenueBillionUSD">Revenue</option>
              <option value="employees">Employees</option>
              <option value="totalFundingMillionUSD">Funding</option>
            </select>
          </div>
        </div>

        <div className="manufacturers-grid">
          {filteredManufacturers.map(manufacturer => (
            <ManufacturerCard
              key={manufacturer.id}
              manufacturer={manufacturer}
              onSelect={setSelectedManufacturer}
              getLaunchersForManufacturer={getLaunchersForManufacturer}
            />
          ))}
        </div>

        {filteredManufacturers.length === 0 && (
            <div className="no-results">
              No manufacturers match the selected filters.
            </div>
          )}
        </div>
      </main>

      {selectedManufacturer && (
        <ManufacturerDetail
          manufacturer={selectedManufacturer}
          onClose={() => setSelectedManufacturer(null)}
          getLaunchersForManufacturer={getLaunchersForManufacturer}
        />
      )}
    </div>
  )
}

export default SatellitesPage
