import { useState, useMemo, useCallback, useRef } from 'react'
import { useData } from '../context/DataContext'
import landscapeData from '../data/manufacturersLandscapeData.json'
import './ManufacturersLandscapePage.css'

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
  US: '\u{1F1FA}\u{1F1F8}',
  BE: '\u{1F1E7}\u{1F1EA}'
}

// Company logo URLs
const companyLogos = {
  'Airbus Defence and Space': 'https://logo.clearbit.com/airbus.com',
  'Thales Alenia Space': 'https://logo.clearbit.com/thalesaleniaspace.com',
  'OHB SE': 'https://logo.clearbit.com/ohb.de',
  'EnduroSat': 'https://logo.clearbit.com/endurosat.com',
  'AAC Clyde Space': 'https://logo.clearbit.com/aac-clyde.space',
  'Open Cosmos': 'https://logo.clearbit.com/open-cosmos.com',
  'SpaceX': 'https://logo.clearbit.com/spacex.com',
  'Lockheed Martin Space': 'https://logo.clearbit.com/lockheedmartin.com',
  'Northrop Grumman Space Systems': 'https://logo.clearbit.com/northropgrumman.com',
  'York Space Systems': 'https://logo.clearbit.com/yorkspacesystems.com',
  'Blue Canyon Technologies (RTX)': 'https://logo.clearbit.com/bluecanyontech.com',
  'Sidus Space': 'https://logo.clearbit.com/sidusspace.com',
  'Aerospacelab': 'https://logo.clearbit.com/aerospacelab.be',
  'Reflex Aerospace': 'https://logo.clearbit.com/reflex.space'
}

// SVG layout constants
const SVG_WIDTH = 1100
const SVG_HEIGHT = 650
const PADDING = { top: 60, right: 60, bottom: 60, left: 80 }
const CHART_LEFT = PADDING.left
const CHART_RIGHT = SVG_WIDTH - PADDING.right
const CHART_TOP = PADDING.top
const CHART_BOTTOM = SVG_HEIGHT - PADDING.bottom
const CHART_W = CHART_RIGHT - CHART_LEFT
const CHART_H = CHART_BOTTOM - CHART_TOP

function computeBubbleRadius(value, allValues, minPx, maxPx) {
  if (!value || value <= 0) return minPx
  const validValues = allValues.filter(v => v > 0)
  if (validValues.length === 0) return minPx
  const logMin = Math.log10(Math.min(...validValues))
  const logMax = Math.log10(Math.max(...validValues))
  if (logMax === logMin) return (minPx + maxPx) / 2
  const logVal = Math.log10(value)
  const t = Math.max(0, Math.min(1, (logVal - logMin) / (logMax - logMin)))
  return minPx + t * (maxPx - minPx)
}

function formatMetricValue(value, metricKey) {
  if (!value || value <= 0) return 'N/A'
  if (metricKey === 'employees') {
    return value >= 1000 ? `${(value / 1000).toFixed(1)}k` : value.toLocaleString()
  }
  if (metricKey === 'annualRevenueBillionUSD') {
    if (value >= 1) return `$${value.toFixed(1)}B`
    return `$${(value * 1000).toFixed(0)}M`
  }
  if (metricKey === 'totalFundingMillionUSD') {
    return `$${value}M`
  }
  return value.toLocaleString()
}

// Manufacturer detail modal (duplicated from SatellitesPage pattern)
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

function ManufacturersLandscapePage() {
  const { manufacturersById, getLaunchersForManufacturer } = useData()

  const [sizeMetric, setSizeMetric] = useState('employees')
  const [hoveredCompany, setHoveredCompany] = useState(null)
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 })
  const [selectedCompany, setSelectedCompany] = useState(null)
  const [failedLogos, setFailedLogos] = useState(new Set())
  const chartContainerRef = useRef(null)

  const onLogoError = useCallback((name) => {
    setFailedLogos(prev => new Set([...prev, name]))
  }, [])

  // Get active metric config
  const activeMetric = landscapeData.sizeMetrics.find(m => m.key === sizeMetric)

  // Enrich companies with manufacturer data
  const enrichedCompanies = useMemo(() => {
    return landscapeData.companies.map(entry => {
      const manufacturer = manufacturersById[entry.manufacturerId]
      if (!manufacturer) return null
      const metricValue = manufacturer[sizeMetric] || 0
      return {
        ...entry,
        manufacturer,
        metricValue
      }
    }).filter(Boolean)
  }, [manufacturersById, sizeMetric])

  // Compute bubble radii
  const bubbleData = useMemo(() => {
    const allValues = enrichedCompanies.map(c => c.metricValue).filter(v => v > 0)
    const { minPx, maxPx } = landscapeData.bubbleSizeRange

    return enrichedCompanies.map(company => {
      const r = computeBubbleRadius(company.metricValue, allValues, minPx, maxPx)
      const cx = CHART_LEFT + (company.xPct / 100) * CHART_W
      const cy = CHART_BOTTOM - (company.yPct / 100) * CHART_H
      const color = landscapeData.regionColors[company.region]
      const hasData = company.metricValue > 0

      return {
        ...company,
        r,
        cx,
        cy,
        color,
        hasData
      }
    })
  }, [enrichedCompanies])

  // Compute size legend reference values
  const sizeLegend = useMemo(() => {
    const allValues = enrichedCompanies.map(c => c.metricValue).filter(v => v > 0)
    if (allValues.length === 0) return []
    const minVal = Math.min(...allValues)
    const maxVal = Math.max(...allValues)
    const midVal = Math.sqrt(minVal * maxVal) // geometric mean
    const { minPx, maxPx } = landscapeData.bubbleSizeRange

    return [
      { value: minVal, r: computeBubbleRadius(minVal, allValues, minPx, maxPx) },
      { value: midVal, r: computeBubbleRadius(midVal, allValues, minPx, maxPx) },
      { value: maxVal, r: computeBubbleRadius(maxVal, allValues, minPx, maxPx) }
    ]
  }, [enrichedCompanies])

  const handleMouseEnter = useCallback((company, event) => {
    if (!chartContainerRef.current) return
    const rect = chartContainerRef.current.getBoundingClientRect()
    let x = event.clientX - rect.left + 16
    let y = event.clientY - rect.top - 10

    // Flip if near right edge
    if (x + 290 > rect.width) x = x - 310
    // Flip if near bottom edge
    if (y + 260 > rect.height) y = y - 260

    setTooltipPos({ x, y })
    setHoveredCompany(company.manufacturerId)
  }, [])

  const handleMouseLeave = useCallback(() => {
    setHoveredCompany(null)
  }, [])

  const handleBubbleClick = useCallback((company) => {
    setSelectedCompany(company.manufacturer)
    setHoveredCompany(null)
  }, [])

  // Get hovered company data for tooltip
  const hoveredData = hoveredCompany
    ? bubbleData.find(c => c.manufacturerId === hoveredCompany)
    : null

  return (
    <div className="manufacturers-landscape-page">
      <header className="landscape-header">
        <h1>{landscapeData.title}</h1>
        <p className="landscape-subtitle">{landscapeData.subtitle}</p>
      </header>

      <div className="landscape-controls">
        <div className="controls-left">
          <div className="control-group">
            <span className="control-label">Bubble Size</span>
            <div className="metric-toggles">
              {landscapeData.sizeMetrics.map(metric => (
                <button
                  key={metric.key}
                  className={sizeMetric === metric.key ? 'active' : ''}
                  onClick={() => setSizeMetric(metric.key)}
                >
                  {metric.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="controls-right">
          <div className="color-legend">
            <div className="legend-item">
              <span className="legend-dot usa" />
              <span className="legend-text">USA</span>
            </div>
            <div className="legend-item">
              <span className="legend-dot europe" />
              <span className="legend-text">Europe</span>
            </div>
          </div>

          <div className="size-legend">
            <span className="size-legend-label">Size:</span>
            {sizeLegend.map((item, idx) => (
              <div key={idx} className="size-ref">
                <div
                  className="size-ref-circle"
                  style={{ width: item.r * 2, height: item.r * 2 }}
                />
                <span className="size-ref-value">
                  {formatMetricValue(item.value, sizeMetric)}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="landscape-chart-container" ref={chartContainerRef}>
        <svg
          viewBox={`0 0 ${SVG_WIDTH} ${SVG_HEIGHT}`}
          width="100%"
          preserveAspectRatio="xMidYMid meet"
          className="landscape-svg"
        >
          <defs>
            {/* USA glow filter */}
            <filter id="glow-usa" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="4" result="blur" />
              <feFlood floodColor="#F97316" floodOpacity="0.35" result="color" />
              <feComposite in="color" in2="blur" operator="in" result="shadow" />
              <feMerge>
                <feMergeNode in="shadow" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
            {/* Europe glow filter */}
            <filter id="glow-europe" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="4" result="blur" />
              <feFlood floodColor="#3B82F6" floodOpacity="0.35" result="color" />
              <feComposite in="color" in2="blur" operator="in" result="shadow" />
              <feMerge>
                <feMergeNode in="shadow" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Chart background */}
          <rect
            x={CHART_LEFT}
            y={CHART_TOP}
            width={CHART_W}
            height={CHART_H}
            fill="rgba(15, 23, 42, 0.3)"
            rx="4"
          />

          {/* Center crosshair lines */}
          <line
            x1={CHART_LEFT + CHART_W / 2}
            y1={CHART_TOP}
            x2={CHART_LEFT + CHART_W / 2}
            y2={CHART_BOTTOM}
            stroke="rgba(148, 163, 184, 0.1)"
            strokeDasharray="6 4"
          />
          <line
            x1={CHART_LEFT}
            y1={CHART_TOP + CHART_H / 2}
            x2={CHART_RIGHT}
            y2={CHART_TOP + CHART_H / 2}
            stroke="rgba(148, 163, 184, 0.1)"
            strokeDasharray="6 4"
          />

          {/* Quadrant labels (watermark) */}
          <text
            x={CHART_LEFT + CHART_W * 0.25}
            y={CHART_TOP + CHART_H * 0.25}
            className="quadrant-label"
            textAnchor="middle"
            dominantBaseline="middle"
          >
            {landscapeData.quadrantLabels.topLeft}
          </text>
          <text
            x={CHART_LEFT + CHART_W * 0.75}
            y={CHART_TOP + CHART_H * 0.25}
            className="quadrant-label"
            textAnchor="middle"
            dominantBaseline="middle"
          >
            {landscapeData.quadrantLabels.topRight}
          </text>
          <text
            x={CHART_LEFT + CHART_W * 0.25}
            y={CHART_TOP + CHART_H * 0.75}
            className="quadrant-label"
            textAnchor="middle"
            dominantBaseline="middle"
          >
            {landscapeData.quadrantLabels.bottomLeft}
          </text>
          <text
            x={CHART_LEFT + CHART_W * 0.75}
            y={CHART_TOP + CHART_H * 0.75}
            className="quadrant-label"
            textAnchor="middle"
            dominantBaseline="middle"
          >
            {landscapeData.quadrantLabels.bottomRight}
          </text>

          {/* X-axis labels */}
          <text
            x={CHART_LEFT + 4}
            y={CHART_BOTTOM + 38}
            className="axis-label"
            textAnchor="start"
          >
            {landscapeData.axes.x.min}
          </text>
          <text
            x={CHART_RIGHT - 4}
            y={CHART_BOTTOM + 38}
            className="axis-label"
            textAnchor="end"
          >
            {landscapeData.axes.x.max}
          </text>
          <text
            x={CHART_LEFT + CHART_W / 2}
            y={CHART_BOTTOM + 52}
            className="axis-title"
            textAnchor="middle"
          >
            {landscapeData.axes.x.label}
          </text>

          {/* Y-axis labels */}
          <text
            x={CHART_LEFT - 12}
            y={CHART_BOTTOM - 4}
            className="axis-label"
            textAnchor="end"
            dominantBaseline="auto"
          >
            {landscapeData.axes.y.min}
          </text>
          <text
            x={CHART_LEFT - 12}
            y={CHART_TOP + 4}
            className="axis-label"
            textAnchor="end"
            dominantBaseline="hanging"
          >
            {landscapeData.axes.y.max}
          </text>
          <text
            x={CHART_LEFT - 46}
            y={CHART_TOP + CHART_H / 2}
            className="axis-title"
            textAnchor="middle"
            transform={`rotate(-90, ${CHART_LEFT - 46}, ${CHART_TOP + CHART_H / 2})`}
          >
            {landscapeData.axes.y.label}
          </text>

          {/* Bubbles */}
          {bubbleData.map((company, idx) => {
            const isHovered = hoveredCompany === company.manufacturerId
            const glowId = company.region === 'USA' ? 'glow-usa' : 'glow-europe'

            return (
              <g
                key={company.manufacturerId}
                className={`bubble-group ${isHovered ? 'hovered' : ''}`}
                onMouseEnter={(e) => handleMouseEnter(company, e)}
                onMouseMove={(e) => handleMouseEnter(company, e)}
                onMouseLeave={handleMouseLeave}
                onClick={() => handleBubbleClick(company)}
                style={{ '--delay': `${-(idx * 0.7)}s` }}
              >
                <circle
                  cx={company.cx}
                  cy={company.cy}
                  r={company.r}
                  fill={company.color}
                  fillOpacity={isHovered ? 0.85 : 0.55}
                  stroke={company.color}
                  strokeWidth={isHovered ? 2.5 : 1}
                  strokeOpacity={isHovered ? 1 : 0.7}
                  strokeDasharray={company.hasData ? 'none' : '4 3'}
                  filter={`url(#${glowId})`}
                  className="bubble-circle"
                />
                <text
                  x={company.cx}
                  y={company.cy + company.r + 14}
                  textAnchor="middle"
                  className="bubble-label"
                >
                  {company.manufacturer.shortName || company.manufacturer.name}
                </text>
              </g>
            )
          })}
        </svg>

        {/* Tooltip */}
        {hoveredData && (
          <div
            className="landscape-tooltip"
            style={{ left: tooltipPos.x, top: tooltipPos.y }}
          >
            <div className="tooltip-name">{hoveredData.manufacturer.name}</div>
            <div className="tooltip-region">
              {flagEmoji[hoveredData.manufacturer.countryCode]} {hoveredData.manufacturer.country}
              <span className="tooltip-region-badge" style={{ backgroundColor: hoveredData.color }}>
                {hoveredData.region}
              </span>
            </div>
            <div className="tooltip-divider" />
            <div className="tooltip-rows">
              {landscapeData.sizeMetrics.map(metric => {
                const val = hoveredData.manufacturer[metric.key]
                const isActive = metric.key === sizeMetric
                return (
                  <div key={metric.key} className={`tooltip-metric-row ${isActive ? 'active' : ''}`}>
                    <span className="tooltip-metric-label">{metric.label}</span>
                    <span className="tooltip-metric-value">
                      {formatMetricValue(val, metric.key)}
                    </span>
                  </div>
                )
              })}
            </div>
            <div className="tooltip-divider" />
            <div className="tooltip-rows">
              <div className="tooltip-metric-row">
                <span className="tooltip-metric-label">Satellites Built</span>
                <span className="tooltip-metric-value">
                  {hoveredData.manufacturer.satellitesBuilt?.toLocaleString() || 'N/A'}
                </span>
              </div>
              <div className="tooltip-metric-row">
                <span className="tooltip-metric-label">Type</span>
                <span className="tooltip-metric-value">{hoveredData.manufacturer.type}</span>
              </div>
            </div>
            {hoveredData.manufacturer.notablePrograms && hoveredData.manufacturer.notablePrograms.length > 0 && (
              <>
                <div className="tooltip-divider" />
                <div className="tooltip-programs">
                  <span className="tooltip-programs-label">Programs:</span>
                  <span className="tooltip-programs-list">
                    {hoveredData.manufacturer.notablePrograms.slice(0, 3).join(', ')}
                  </span>
                </div>
              </>
            )}
            <div className="tooltip-hint">Click for details</div>
          </div>
        )}
      </div>

      {/* Detail modal */}
      {selectedCompany && (
        <ManufacturerDetail
          manufacturer={selectedCompany}
          onClose={() => setSelectedCompany(null)}
          getLaunchersForManufacturer={getLaunchersForManufacturer}
          failedLogos={failedLogos}
          onLogoError={onLogoError}
        />
      )}
    </div>
  )
}

export default ManufacturersLandscapePage
