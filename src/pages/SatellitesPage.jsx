import { useState, useMemo, useCallback } from 'react'
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

// Company logo URLs - using Clearbit Logo API with fallbacks tracked via state
const companyLogos = {
  'Airbus Defence and Space': 'https://logo.clearbit.com/airbus.com',
  'Thales Alenia Space': 'https://logo.clearbit.com/thalesaleniaspace.com',
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
  'Argotec': 'https://logo.clearbit.com/argotec.it',
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
  'Academic / Research': 'Academic',
  'LEO (Low Earth Orbit)': 'LEO',
  'MEO (Medium Earth Orbit)': 'MEO',
  'GEO (Geostationary)': 'GEO',
  'Other (HEO/SSO/Cislunar)': 'Other'
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

function ManufacturerCard({ manufacturer, onSelect, getLaunchersForManufacturer, failedLogos, onLogoError }) {
  const launchers = getLaunchersForManufacturer(manufacturer.id)
  const logoUrl = companyLogos[manufacturer.name]
  const logoFailed = failedLogos.has(manufacturer.name)

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
          {logoUrl && !logoFailed ? (
            <img
              src={logoUrl}
              alt={manufacturer.name}
              className="company-logo"
              onError={() => onLogoError(manufacturer.name)}
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

      {manufacturer.verticalIntegration && (
        <div className="manufacturer-integration">
          <div className="integration-label">Vertical Integration</div>
          <div className="integration-badges">
            {manufacturer.verticalIntegration.manufactures && (
              <span className="integration-badge manufactures">Builds</span>
            )}
            {manufacturer.verticalIntegration.operates && (
              <span className="integration-badge operates">Operates</span>
            )}
            {manufacturer.verticalIntegration.maintains && (
              <span className="integration-badge maintains">Maintains</span>
            )}
            {manufacturer.verticalIntegration.launches && (
              <span className="integration-badge launches">Launches</span>
            )}
          </div>
        </div>
      )}

      {manufacturer.customerMarkets && (
        <div className="manufacturer-markets">
          <div className="markets-label">Customer Markets</div>
          <div className="market-bars">
            {Object.entries(manufacturer.customerMarkets.breakdown)
              .filter(([, pct]) => pct > 0)
              .sort((a, b) => b[1] - a[1])
              .slice(0, 3)
              .map(([region, pct]) => (
                <div key={region} className="market-bar-item">
                  <div className="market-bar-label">{region}</div>
                  <div className="market-bar-track">
                    <div
                      className="market-bar-fill"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <div className="market-bar-pct">{pct}%</div>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  )
}

function ManufacturerDetail({ manufacturer, onClose, getLaunchersForManufacturer, failedLogos, onLogoError }) {
  const launchers = getLaunchersForManufacturer(manufacturer.id)
  const logoUrl = companyLogos[manufacturer.name]
  const logoFailed = failedLogos.has(manufacturer.name)

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
          {logoUrl && !logoFailed ? (
            <img
              src={logoUrl}
              alt={manufacturer.name}
              className="detail-logo"
              onError={() => onLogoError(manufacturer.name)}
            />
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

        {manufacturer.customerMarkets && (
          <div className="detail-section">
            <h3>Customer Markets</h3>
            <div className="detail-markets">
              <div className="market-breakdown">
                <div className="market-breakdown-header">Regional Sales Breakdown</div>
                <div className="market-bars-detail">
                  {Object.entries(manufacturer.customerMarkets.breakdown)
                    .filter(([, pct]) => pct > 0)
                    .sort((a, b) => b[1] - a[1])
                    .map(([region, pct]) => (
                      <div key={region} className="market-bar-row">
                        <span className="market-region">{region}</span>
                        <div className="market-bar-track-detail">
                          <div
                            className="market-bar-fill-detail"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <span className="market-pct">{pct}%</span>
                      </div>
                    ))}
                </div>
              </div>

              {manufacturer.customerMarkets.keyContracts && manufacturer.customerMarkets.keyContracts.length > 0 && (
                <div className="key-contracts">
                  <div className="key-contracts-header">Key Contracts</div>
                  <div className="contracts-list">
                    {manufacturer.customerMarkets.keyContracts.map((contract, idx) => (
                      <div key={idx} className="contract-item">
                        <div className="contract-main">
                          <span className="contract-customer">{contract.customer}</span>
                          <span className="contract-region-badge">{contract.region}</span>
                        </div>
                        <div className="contract-details">
                          {contract.value && <span className="contract-value">{contract.value}</span>}
                          {contract.satellites && <span className="contract-satellites">{contract.satellites} satellites</span>}
                          {contract.program && <span className="contract-program">{contract.program}</span>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {manufacturer.customerMarkets.notes && (
                <div className="market-notes">
                  <span className="notes-icon">💡</span>
                  {manufacturer.customerMarkets.notes}
                </div>
              )}
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
    orbitTypeColors,
    countries
  } = useData()

  const [selectedManufacturer, setSelectedManufacturer] = useState(null)
  const [metric, setMetric] = useState('market') // 'market' or 'count'
  const [categoryType, setCategoryType] = useState('sizeClass') // 'sizeClass', 'application', 'operatorType'
  const [selectedRegion, setSelectedRegion] = useState('Europe') // 'Global', 'Europe', 'Western-aligned'
  const [excludeStarlink, setExcludeStarlink] = useState(false) // Exclude SpaceX Starlink from count
  const [chartMode, setChartMode] = useState('area') // 'area' or 'line'
  const [yearRange, setYearRange] = useState([2020, 2035])
  const [filters, setFilters] = useState({
    type: 'all',
    country: 'all',
    sizeClass: 'all'
  })
  const [sortBy, setSortBy] = useState('satellitesBuilt')
  const [failedLogos, setFailedLogos] = useState(new Set())

  const handleLogoError = useCallback((name) => {
    setFailedLogos(prev => new Set([...prev, name]))
  }, [])

  // Get the appropriate color palette based on category type
  const getColors = () => {
    switch (categoryType) {
      case 'sizeClass': return sizeClassColors
      case 'application': return applicationColors
      case 'operatorType': return operatorTypeColors
      case 'orbitType': return orbitTypeColors
      default: return sizeClassColors
    }
  }

  const colors = getColors()

  // Get categories for the selected category type
  const categories = satellitesData.categories[categoryType]?.items || []

  // SpaceX Starlink satellites launched by year (Starlink dominates global satellite deployments)
  // Note: "Launched" = deployed to orbit, "Manufactured" = built (may include backlog not yet launched)
  // SpaceX has built 7000+ Starlink satellites, with 6500+ operational in orbit
  const spacexLaunches = {
    '2020': 833, '2021': 1000, '2022': 1400, '2023': 1800,
    '2024': 1850, '2025': 1900, '2026': 2100, '2027': 2300,
    '2028': 2500, '2029': 2700, '2030': 2900, '2031': 3100,
    '2032': 3300, '2033': 3500, '2034': 3700, '2035': 3900
  }

  // Western-aligned multipliers (Global minus Russia/China)
  const westernAlignedMultipliers = satellitesData.regionDefinitions?.['Western-aligned'] || {
    countMultiplier: 0.70,
    marketMultiplier: 0.65
  }

  // Prepare chart data with year range filter
  const chartData = useMemo(() => {
    const metricName = metric === 'market'
      ? 'Satellite manufacturing market (USD, $B)'
      : 'Satellites launched (count)'

    // Determine which region to show and if we need to derive from Global
    const isWesternAligned = selectedRegion === 'Western-aligned'
    const sourceRegion = isWesternAligned ? 'Global' : selectedRegion

    // Filter years by range
    const filteredYears = satellitesData.years.filter(y => {
      const year = parseInt(y)
      return year >= yearRange[0] && year <= yearRange[1]
    })

    return filteredYears.map(year => {
      const dataPoint = { year }
      const starlinkCount = spacexLaunches[year] || 0

      // Get data for each category from the selected region
      categories.forEach(category => {
        const entry = satellitesData.data.find(
          d => d.metric === metricName &&
               d.category === category &&
               d.categoryType === categoryType &&
               d.region === sourceRegion
        )
        let value = entry?.values[year] || 0

        // Apply Western-aligned multiplier if needed
        if (isWesternAligned && value > 0) {
          const multiplier = metric === 'market'
            ? westernAlignedMultipliers.marketMultiplier
            : westernAlignedMultipliers.countMultiplier
          value = value * multiplier
        }

        // If excluding Starlink from count, subtract from LEO/Communications/Commercial categories
        // Starlink is: LEO orbit, Communications application, Commercial operator, Minisats size class
        // Note: Europe data is separate and doesn't include Starlink, so subtraction only applies
        // when source region is Global (i.e. Global or Western-aligned views)
        if (sourceRegion === 'Global' && metric === 'count' && excludeStarlink && value > 0) {
          let starlinkToSubtract = starlinkCount
          // For Western-aligned, apply the same multiplier to Starlink count
          if (isWesternAligned) {
            starlinkToSubtract = starlinkCount * westernAlignedMultipliers.countMultiplier
          }
          if (categoryType === 'orbitType' && category === 'LEO (Low Earth Orbit)') {
            value = Math.max(0, value - starlinkToSubtract)
          } else if (categoryType === 'application' && category === 'Communications') {
            value = Math.max(0, value - starlinkToSubtract)
          } else if (categoryType === 'operatorType' && category === 'Commercial') {
            value = Math.max(0, value - starlinkToSubtract)
          } else if (categoryType === 'sizeClass' && category === 'Minisats (200-600kg)') {
            value = Math.max(0, value - starlinkToSubtract)
          }
        }

        dataPoint[category] = value
      })

      // Add SpaceX reference for count metric when not excluding
      if (metric === 'count' && !excludeStarlink) {
        dataPoint.spacexRef = starlinkCount
      }

      return dataPoint
    })
  }, [satellitesData, metric, categoryType, categories, selectedRegion, excludeStarlink, yearRange, westernAlignedMultipliers])

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

    // For Western-aligned, we derive from Global
    const isWesternAligned = selectedRegion === 'Western-aligned'
    const sourceRegion = isWesternAligned ? 'Global' : selectedRegion

    const regionTotal = satellitesData.data.find(
      d => d.metric === metricName &&
           d.category === 'Total' &&
           d.region === sourceRegion
    )

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

    let regionCurrent = regionTotal?.values[currentYear] || 0
    let regionEnd = regionTotal?.values[endYear] || 0
    let globalCurrent = globalTotal?.values[currentYear] || 0
    const europeCurrent = europeTotal?.values[currentYear] || 0

    // Apply Western-aligned multiplier if needed
    if (isWesternAligned) {
      const multiplier = metric === 'market'
        ? westernAlignedMultipliers.marketMultiplier
        : westernAlignedMultipliers.countMultiplier
      regionCurrent = regionCurrent * multiplier
      regionEnd = regionEnd * multiplier
    }

    // Adjust for Starlink exclusion (Global and Western-aligned derive from Global data)
    if (sourceRegion === 'Global' && metric === 'count' && excludeStarlink) {
      const starlinkCurrent = spacexLaunches[currentYear] || 0
      const starlinkEnd = spacexLaunches[endYear] || 0
      regionCurrent = Math.max(0, regionCurrent - (isWesternAligned ? starlinkCurrent * westernAlignedMultipliers.countMultiplier : starlinkCurrent))
      regionEnd = Math.max(0, regionEnd - (isWesternAligned ? starlinkEnd * westernAlignedMultipliers.countMultiplier : starlinkEnd))
      globalCurrent = Math.max(0, globalCurrent - starlinkCurrent)
    }

    const regionCAGR = regionCurrent > 0
      ? ((Math.pow(regionEnd / regionCurrent, 1/5) - 1) * 100).toFixed(1)
      : 0

    const europeShare = globalCurrent > 0
      ? ((europeCurrent / globalCurrent) * 100).toFixed(1)
      : 0

    return {
      regionCurrent,
      regionEnd,
      regionCAGR,
      europeShare,
      selectedRegion,
      excludingStarlink: metric === 'count' && excludeStarlink
    }
  }, [satellitesData, metric, selectedRegion, excludeStarlink, westernAlignedMultipliers])

  return (
    <div className="satellites-page">
      <SatellitesSidebar
        years={satellitesData.years}
        metric={metric}
        setMetric={setMetric}
        categoryType={categoryType}
        setCategoryType={setCategoryType}
        selectedRegion={selectedRegion}
        setSelectedRegion={setSelectedRegion}
        excludeStarlink={excludeStarlink}
        setExcludeStarlink={setExcludeStarlink}
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
                  ? `$${totals.regionCurrent.toFixed(1)}B`
                  : totals.regionCurrent.toLocaleString()}
              </span>
              <span className="header-stat-label">
                {metric === 'market' ? '2025 Market' : '2025 Satellites'}
                {totals.isEurope ? ' (EU)' : totals.excludingStarlink ? ' (excl. Starlink)' : ''}
              </span>
            </div>
            <div className="header-stat">
              <span className="header-stat-value">{totals.regionCAGR}%</span>
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
              </>
            )}

            {/* SpaceX reference line for count metric */}
            {metric === 'count' && (
              <Line
                type="monotone"
                dataKey="spacexRef"
                stroke="#ef4444"
                strokeWidth={2}
                strokeDasharray="8 4"
                dot={false}
                name="SpaceX (Starlink)"
                legendType="line"
              />
            )}
          </ComposedChart>
        </ResponsiveContainer>

        {metric === 'count' && (
          <div className="europe-legend">
            {!excludeStarlink && (
              <span className="spacex-legend-icon" />
            )}
            <span>
              {excludeStarlink
                ? 'Excluding SpaceX Starlink constellation'
                : 'SpaceX Starlink (for reference)'}
            </span>
          </div>
        )}
      </div>

      {/* Data Methodology Caveat */}
      {satellitesData.dataMethodology?.generalCaveat && (
        <div className="methodology-caveat">
          <div className="caveat-icon">ℹ</div>
          <div className="caveat-content">
            <strong>Data Note:</strong> {satellitesData.dataMethodology.generalCaveat}
          </div>
        </div>
      )}

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
              {insight.sources && insight.sources.length > 0 && (
                <div className="insight-sources">
                  <span className="sources-label">Sources:</span>
                  {insight.sources.map((source, idx) => (
                    <a
                      key={idx}
                      href={source.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="source-link"
                    >
                      {source.title}
                    </a>
                  ))}
                </div>
              )}
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
              failedLogos={failedLogos}
              onLogoError={handleLogoError}
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
          failedLogos={failedLogos}
          onLogoError={handleLogoError}
        />
      )}
    </div>
  )
}

export default SatellitesPage
