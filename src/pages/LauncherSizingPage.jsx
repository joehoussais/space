import { useState, useMemo, useCallback } from 'react'
import {
  ComposedChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  ReferenceLine
} from 'recharts'
import LauncherSizingSidebar from '../components/LauncherSizingSidebar'
import launcherSizingData from '../data/launcherSizingData.json'
import './LauncherSizingPage.css'

// Custom tooltip for the chart
function CustomTooltip({ active, payload, label }) {
  if (!active || !payload || !payload.length) return null

  const data = payload[0].payload
  return (
    <div className="sizing-tooltip">
      <div className="tooltip-header">{label}</div>
      <div className="tooltip-row">
        <span className="tooltip-label">Satellites:</span>
        <span className="tooltip-value">{data.count.toLocaleString()}</span>
      </div>
      <div className="tooltip-row">
        <span className="tooltip-label">Total Mass:</span>
        <span className="tooltip-value">{data.massTonnes.toFixed(1)} t</span>
      </div>
      {data.addressable && (
        <div className="tooltip-addressable">Addressable by your launcher</div>
      )}
    </div>
  )
}

function LauncherSizingPage() {
  // State
  const [launcherCapacity, setLauncherCapacity] = useState(15000) // 15t default
  const [selectedYear, setSelectedYear] = useState('2023')
  const [yearMode, setYearMode] = useState('single')
  const [yearRange, setYearRange] = useState([2020, 2025])
  const [selectedRegion, setSelectedRegion] = useState('Global')
  const [pricePerKg, setPricePerKg] = useState(15000)
  const [showSatelliteList, setShowSatelliteList] = useState(false)

  // Get years from data
  const years = launcherSizingData.years

  // Computed: filtered satellites matching criteria
  const filteredSatellites = useMemo(() => {
    let sats = launcherSizingData.satellites.filter(s => {
      // Mass filter
      if (s.massKg > launcherCapacity) return false

      // Year filter
      if (yearMode === 'single') {
        if (s.year !== parseInt(selectedYear)) return false
      } else {
        if (s.year < yearRange[0] || s.year > yearRange[1]) return false
      }

      // Region filter
      if (selectedRegion === 'Western Europe') {
        return s.region === 'Western Europe'
      } else if (selectedRegion === 'Western-aligned') {
        return s.region === 'Western-aligned' || s.region === 'Western Europe'
      }
      return true // Global
    })

    return sats.sort((a, b) => b.massKg - a.massKg)
  }, [launcherCapacity, selectedYear, yearMode, yearRange, selectedRegion])

  // Computed: all satellites for the period (for total calculation)
  const allSatellitesInPeriod = useMemo(() => {
    return launcherSizingData.satellites.filter(s => {
      // Year filter
      if (yearMode === 'single') {
        if (s.year !== parseInt(selectedYear)) return false
      } else {
        if (s.year < yearRange[0] || s.year > yearRange[1]) return false
      }

      // Region filter
      if (selectedRegion === 'Western Europe') {
        return s.region === 'Western Europe'
      } else if (selectedRegion === 'Western-aligned') {
        return s.region === 'Western-aligned' || s.region === 'Western Europe'
      }
      return true // Global
    })
  }, [selectedYear, yearMode, yearRange, selectedRegion])

  // Computed: KPIs
  const kpis = useMemo(() => {
    const addressableMassKg = filteredSatellites.reduce((sum, s) => sum + s.massKg, 0)
    const addressableMassTonnes = addressableMassKg / 1000
    const satelliteCount = filteredSatellites.length

    const totalMassKg = allSatellitesInPeriod.reduce((sum, s) => sum + s.massKg, 0)
    const totalMassTonnes = totalMassKg / 1000
    const totalCount = allSatellitesInPeriod.length

    const pctMass = totalMassTonnes > 0 ? (addressableMassTonnes / totalMassTonnes * 100) : 0
    const pctCount = totalCount > 0 ? (satelliteCount / totalCount * 100) : 0

    // Revenue calculation (EUR)
    const addressableRevenue = addressableMassKg * pricePerKg / 1000000 // In millions EUR

    return {
      addressableMassTonnes,
      satelliteCount,
      pctMass,
      pctCount,
      totalMassTonnes,
      totalCount,
      addressableRevenue
    }
  }, [filteredSatellites, allSatellitesInPeriod, pricePerKg])

  // Computed: chart data (mass distribution histogram)
  const chartData = useMemo(() => {
    const bins = launcherSizingData.massBins

    return bins.map(bin => {
      const satsInBin = allSatellitesInPeriod.filter(s =>
        s.massKg >= bin.min && s.massKg < bin.max
      )

      const isAddressable = bin.max <= launcherCapacity
      const isPartiallyAddressable = bin.min < launcherCapacity && bin.max > launcherCapacity

      return {
        label: bin.label,
        binMin: bin.min,
        binMax: bin.max,
        count: satsInBin.length,
        massTonnes: satsInBin.reduce((sum, s) => sum + s.massKg, 0) / 1000,
        addressable: isAddressable,
        partiallyAddressable: isPartiallyAddressable
      }
    })
  }, [allSatellitesInPeriod, launcherCapacity])

  // Find the reference line position
  const referenceLineIndex = useMemo(() => {
    for (let i = 0; i < chartData.length; i++) {
      if (chartData[i].binMax > launcherCapacity) {
        return i
      }
    }
    return chartData.length - 1
  }, [chartData, launcherCapacity])

  // Export to CSV handler
  const handleExportCSV = useCallback(() => {
    const headers = ['Name', 'Launch Date', 'Mass (kg)', 'Owner', 'State', 'Region', 'Orbit']
    const rows = filteredSatellites.map(s => [
      `"${s.name.replace(/"/g, '""')}"`,
      s.launchDate,
      s.massKg,
      `"${(s.owner || '').replace(/"/g, '""')}"`,
      s.state,
      s.region,
      s.orbit
    ])

    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url

    const periodStr = yearMode === 'single' ? selectedYear : `${yearRange[0]}-${yearRange[1]}`
    a.download = `satellites_${Math.round(launcherCapacity / 1000)}t_${periodStr}_${selectedRegion.replace(/\s+/g, '-')}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }, [filteredSatellites, launcherCapacity, selectedYear, yearMode, yearRange, selectedRegion])

  const formatCapacity = (kg) => {
    if (kg >= 1000) {
      return `${(kg / 1000).toFixed(1)}t`
    }
    return `${kg}kg`
  }

  return (
    <div className="launcher-sizing-page">
      <LauncherSizingSidebar
        launcherCapacity={launcherCapacity}
        setLauncherCapacity={setLauncherCapacity}
        selectedYear={selectedYear}
        setSelectedYear={setSelectedYear}
        yearMode={yearMode}
        setYearMode={setYearMode}
        yearRange={yearRange}
        setYearRange={setYearRange}
        selectedRegion={selectedRegion}
        setSelectedRegion={setSelectedRegion}
        pricePerKg={pricePerKg}
        setPricePerKg={setPricePerKg}
        years={years}
      />

      <main className="launcher-sizing-main">
        {/* Header */}
        <header className="page-header">
          <div className="header-content">
            <h1>Launcher Sizing Analysis</h1>
            <p className="page-subtitle">
              Historical satellite data analysis for optimal launcher capacity planning
            </p>
          </div>
        </header>

        {/* KPI Cards */}
        <div className="kpi-grid">
          <div className="kpi-card addressable">
            <div className="kpi-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 2v20M2 12h20"/>
                <circle cx="12" cy="12" r="4"/>
              </svg>
            </div>
            <div className="kpi-content">
              <span className="kpi-value">{kpis.addressableMassTonnes.toFixed(0)} t</span>
              <span className="kpi-label">Addressable Mass</span>
            </div>
          </div>

          <div className="kpi-card">
            <div className="kpi-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/>
                <path d="M12 6v6l4 2"/>
              </svg>
            </div>
            <div className="kpi-content">
              <span className="kpi-value">{kpis.pctMass.toFixed(1)}%</span>
              <span className="kpi-label">of Total Mass</span>
            </div>
          </div>

          <div className="kpi-card">
            <div className="kpi-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="3" width="7" height="7"/>
                <rect x="14" y="3" width="7" height="7"/>
                <rect x="14" y="14" width="7" height="7"/>
                <rect x="3" y="14" width="7" height="7"/>
              </svg>
            </div>
            <div className="kpi-content">
              <span className="kpi-value">{kpis.satelliteCount.toLocaleString()}</span>
              <span className="kpi-label">Satellites ({kpis.pctCount.toFixed(0)}% of {kpis.totalCount.toLocaleString()})</span>
            </div>
          </div>

          <div className="kpi-card revenue">
            <div className="kpi-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="12" y1="1" x2="12" y2="23"/>
                <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
              </svg>
            </div>
            <div className="kpi-content">
              <span className="kpi-value">EUR {kpis.addressableRevenue >= 1000 ? `${(kpis.addressableRevenue / 1000).toFixed(1)}B` : `${kpis.addressableRevenue.toFixed(0)}M`}</span>
              <span className="kpi-label">Addressable Revenue @ EUR {(pricePerKg / 1000).toFixed(0)}k/kg</span>
            </div>
          </div>
        </div>

        {/* Chart */}
        <div className="chart-section">
          <div className="chart-header">
            <h2>Satellite Mass Distribution</h2>
            <div className="chart-info">
              <span className="launcher-badge">
                Your launcher: {formatCapacity(launcherCapacity)} LEO
              </span>
            </div>
          </div>

          <div className="chart-container">
            <ResponsiveContainer width="100%" height={380}>
              <ComposedChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
                <defs>
                  <linearGradient id="addressableGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10b981" stopOpacity={0.9} />
                    <stop offset="100%" stopColor="#10b981" stopOpacity={0.4} />
                  </linearGradient>
                  <linearGradient id="nonAddressableGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#64748b" stopOpacity={0.6} />
                    <stop offset="100%" stopColor="#64748b" stopOpacity={0.2} />
                  </linearGradient>
                  <linearGradient id="partialGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#f59e0b" stopOpacity={0.8} />
                    <stop offset="100%" stopColor="#f59e0b" stopOpacity={0.3} />
                  </linearGradient>
                </defs>

                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />

                <XAxis
                  dataKey="label"
                  tick={{ fill: '#94a3b8', fontSize: 11 }}
                  angle={-45}
                  textAnchor="end"
                  height={70}
                  interval={0}
                />

                <YAxis
                  tick={{ fill: '#94a3b8', fontSize: 12 }}
                  label={{
                    value: 'Number of Satellites',
                    angle: -90,
                    position: 'insideLeft',
                    fill: '#64748b',
                    fontSize: 12
                  }}
                />

                <Tooltip content={<CustomTooltip />} />

                <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                  {chartData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={
                        entry.addressable
                          ? 'url(#addressableGradient)'
                          : entry.partiallyAddressable
                            ? 'url(#partialGradient)'
                            : 'url(#nonAddressableGradient)'
                      }
                    />
                  ))}
                </Bar>

                {/* Reference line for launcher capacity */}
                {referenceLineIndex < chartData.length && (
                  <ReferenceLine
                    x={chartData[referenceLineIndex].label}
                    stroke="#10b981"
                    strokeWidth={2}
                    strokeDasharray="8 4"
                  />
                )}
              </ComposedChart>
            </ResponsiveContainer>
          </div>

          <div className="chart-legend">
            <div className="legend-item addressable">
              <span className="legend-color" />
              <span>Addressable (under {formatCapacity(launcherCapacity)})</span>
            </div>
            <div className="legend-item partial">
              <span className="legend-color" />
              <span>Partially addressable</span>
            </div>
            <div className="legend-item non-addressable">
              <span className="legend-color" />
              <span>Exceeds capacity</span>
            </div>
          </div>
        </div>

        {/* Satellite List Section */}
        <div className="satellites-section">
          <div className="section-header">
            <h2>Matching Satellites</h2>
            <div className="section-actions">
              <span className="satellite-count">{filteredSatellites.length.toLocaleString()} satellites</span>
              <button
                className="toggle-list-btn"
                onClick={() => setShowSatelliteList(!showSatelliteList)}
              >
                {showSatelliteList ? 'Hide List' : 'Show List'}
              </button>
              <button className="export-btn" onClick={handleExportCSV}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="7,10 12,15 17,10" />
                  <line x1="12" y1="15" x2="12" y2="3" />
                </svg>
                Export CSV
              </button>
            </div>
          </div>

          {showSatelliteList && (
            <div className="satellite-table-container">
              <table className="satellite-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Launch Date</th>
                    <th>Mass (kg)</th>
                    <th>Owner</th>
                    <th>Region</th>
                    <th>Orbit</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredSatellites.slice(0, 100).map((sat, idx) => (
                    <tr key={idx}>
                      <td className="sat-name">{sat.name}</td>
                      <td>{sat.launchDate}</td>
                      <td className="sat-mass">{sat.massKg.toLocaleString()}</td>
                      <td>{sat.owner}</td>
                      <td>{sat.region}</td>
                      <td>{sat.orbit}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filteredSatellites.length > 100 && (
                <div className="table-overflow-note">
                  Showing first 100 of {filteredSatellites.length.toLocaleString()} satellites.
                  Export CSV for complete list.
                </div>
              )}
            </div>
          )}
        </div>

        {/* Sources Panel */}
        <div className="sources-panel">
          <h3>Data Source</h3>
          <p>
            Satellite data from <strong>GCAT</strong> (General Catalog of Artificial Space Objects)
            maintained by Jonathan McDowell. Data filtered to launches from 2015 onwards
            with valid mass records.
          </p>
          <p className="source-citation">
            Citation: "data from GCAT (J. McDowell, planet4589.org/space/gcat)"
          </p>
          <a
            href="https://planet4589.org/space/gcat/"
            target="_blank"
            rel="noopener noreferrer"
            className="source-link"
          >
            planet4589.org/space/gcat
          </a>
        </div>
      </main>
    </div>
  )
}

export default LauncherSizingPage
