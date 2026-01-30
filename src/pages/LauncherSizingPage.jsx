import { useState, useMemo, useCallback } from 'react'
import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ZAxis,
  Cell,
  ReferenceLine,
  ComposedChart,
  Area,
  Line
} from 'recharts'
import LauncherSizingSidebar from '../components/LauncherSizingSidebar'
import launcherSizingData from '../data/launcherSizingData.json'
import './LauncherSizingPage.css'

// Orbit type colors matching the satellites page
const ORBIT_COLORS = {
  'LEO': '#38bdf8',
  'GEO': '#8b5cf6',
  'MEO': '#f59e0b',
  'HEO': '#10b981',
  'Other': '#94a3b8',
  'All': '#06b6d4'
}

// Consolidated mass bins: remove 50-150t, merge heavy categories into "Above 5t"
const CONSOLIDATED_BINS = [
  { min: 0, max: 50, label: '0-50 kg' },
  { min: 50, max: 100, label: '50-100 kg' },
  { min: 100, max: 300, label: '100-300 kg' },
  { min: 300, max: 500, label: '300-500 kg' },
  { min: 500, max: 1000, label: '500 kg - 1 t' },
  { min: 1000, max: 2000, label: '1-2 t' },
  { min: 2000, max: 5000, label: '2-5 t' },
  { min: 5000, max: Infinity, label: 'Above 5 t' }
]

// Custom tooltip for the bubble chart
function BubbleTooltip({ active, payload }) {
  if (!active || !payload || !payload.length) return null

  const data = payload[0].payload
  return (
    <div className="sizing-tooltip">
      <div className="tooltip-header">{data.label}</div>
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
      {data.partiallyAddressable && (
        <div className="tooltip-partial">Partially addressable</div>
      )}
    </div>
  )
}

// Custom tooltip for the market curve
function MarketCurveTooltip({ active, payload, label }) {
  if (!active || !payload || !payload.length) return null

  const formatValue = (name, value) => {
    if (name.includes('Mass')) return value.toFixed(0) + ' t'
    if (name.includes('Revenue')) {
      if (value >= 1000) return 'EUR ' + (value / 1000).toFixed(1) + 'B'
      return 'EUR ' + value.toFixed(0) + 'M'
    }
    return value.toLocaleString()
  }

  return (
    <div className="sizing-tooltip">
      <div className="tooltip-header">{label} LEO</div>
      {payload.map((entry, idx) => (
        <div key={idx} className="tooltip-row">
          <span className="tooltip-label">{entry.name}:</span>
          <span className="tooltip-value">{formatValue(entry.name, entry.value)}</span>
        </div>
      ))}
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
  const [selectedOrbit, setSelectedOrbit] = useState('All')

  // Get years from data
  const years = launcherSizingData.years

  // Check if 2026 is in the current selection
  const includes2026 = useMemo(() => {
    if (yearMode === 'single') return selectedYear === '2026'
    return yearRange[1] >= 2026
  }, [yearMode, selectedYear, yearRange])

  // Count of 2026 satellites (static)
  const count2026 = useMemo(() => {
    return launcherSizingData.satellites.filter(s => s.year === 2026).length
  }, [])

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

  // Orbit-filtered satellites for the period
  const orbitFilteredSatellites = useMemo(() => {
    if (selectedOrbit === 'All') return allSatellitesInPeriod
    return allSatellitesInPeriod.filter(s => s.orbit === selectedOrbit)
  }, [allSatellitesInPeriod, selectedOrbit])

  // Computed: filtered satellites matching criteria (mass + orbit)
  const filteredSatellites = useMemo(() => {
    const sats = orbitFilteredSatellites.filter(s => s.massKg <= launcherCapacity)
    return sats.sort((a, b) => b.massKg - a.massKg)
  }, [orbitFilteredSatellites, launcherCapacity])

  // Orbit type counts for the filter buttons
  const orbitCounts = useMemo(() => {
    const counts = { All: allSatellitesInPeriod.length }
    allSatellitesInPeriod.forEach(s => {
      counts[s.orbit] = (counts[s.orbit] || 0) + 1
    })
    return counts
  }, [allSatellitesInPeriod])

  // Computed: KPIs
  const kpis = useMemo(() => {
    const addressableMassKg = filteredSatellites.reduce((sum, s) => sum + s.massKg, 0)
    const addressableMassTonnes = addressableMassKg / 1000
    const satelliteCount = filteredSatellites.length

    const totalMassKg = orbitFilteredSatellites.reduce((sum, s) => sum + s.massKg, 0)
    const totalMassTonnes = totalMassKg / 1000
    const totalCount = orbitFilteredSatellites.length

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
  }, [filteredSatellites, orbitFilteredSatellites, pricePerKg])

  // Computed: bubble chart data (mass distribution)
  const bubbleData = useMemo(() => {
    return CONSOLIDATED_BINS.map((bin, index) => {
      const satsInBin = orbitFilteredSatellites.filter(s =>
        s.massKg >= bin.min && s.massKg < bin.max
      )

      const isAddressable = bin.max <= launcherCapacity
      const isPartiallyAddressable = bin.min < launcherCapacity && bin.max > launcherCapacity

      const massTonnes = satsInBin.reduce((sum, s) => sum + s.massKg, 0) / 1000

      return {
        label: bin.label,
        binMin: bin.min,
        binMax: bin.max,
        count: satsInBin.length,
        massTonnes,
        bubbleSize: Math.max(massTonnes, 0.5),
        addressable: isAddressable,
        partiallyAddressable: isPartiallyAddressable,
        x: index,
        y: satsInBin.length
      }
    })
  }, [orbitFilteredSatellites, launcherCapacity])

  // Max mass for Z-axis scaling
  const maxMass = useMemo(() => {
    return Math.max(...bubbleData.map(d => d.bubbleSize), 1)
  }, [bubbleData])

  // Market size curve data
  const marketCurveData = useMemo(() => {
    const capacityPoints = [
      { kg: 300, label: '0.3t' },
      { kg: 500, label: '0.5t' },
      { kg: 1000, label: '1t' },
      { kg: 2000, label: '2t' },
      { kg: 3000, label: '3t' },
      { kg: 4000, label: '4t' },
      { kg: 5000, label: '5t' },
      { kg: 7500, label: '7.5t' },
      { kg: 10000, label: '10t' },
      { kg: 15000, label: '15t' },
      { kg: 20000, label: '20t' },
      { kg: 30000, label: '30t' },
      { kg: 50000, label: '50t' }
    ]

    return capacityPoints.map(point => {
      const addressable = orbitFilteredSatellites.filter(s => s.massKg <= point.kg)
      const addressableMassKg = addressable.reduce((sum, s) => sum + s.massKg, 0)

      return {
        label: point.label,
        capacity: point.kg,
        'Addressable Mass (t)': addressableMassKg / 1000,
        'Satellite Count': addressable.length
      }
    })
  }, [orbitFilteredSatellites])

  // Export to CSV handler
  const handleExportCSV = useCallback(() => {
    const headers = ['Name', 'Launch Date', 'Mass (kg)', 'Owner', 'State', 'Region', 'Orbit']
    const rows = filteredSatellites.map(s => [
      '"' + s.name.replace(/"/g, '""') + '"',
      s.launchDate,
      s.massKg,
      '"' + (s.owner || '').replace(/"/g, '""') + '"',
      s.state,
      s.region,
      s.orbit
    ])

    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url

    const periodStr = yearMode === 'single' ? selectedYear : yearRange[0] + '-' + yearRange[1]
    const orbitStr = selectedOrbit !== 'All' ? '_' + selectedOrbit : ''
    a.download = 'satellites_' + Math.round(launcherCapacity / 1000) + 't_' + periodStr + '_' + selectedRegion.replace(/\s+/g, '-') + orbitStr + '.csv'
    a.click()
    URL.revokeObjectURL(url)
  }, [filteredSatellites, launcherCapacity, selectedYear, yearMode, yearRange, selectedRegion, selectedOrbit])

  const formatCapacity = (kg) => {
    if (kg >= 1000) {
      return (kg / 1000).toFixed(1) + 't'
    }
    return kg + 'kg'
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

        {/* 2026 Data Warning */}
        {includes2026 && (
          <div className="data-warning-banner">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
              <line x1="12" y1="9" x2="12" y2="13"/>
              <line x1="12" y1="17" x2="12.01" y2="17"/>
            </svg>
            <div className="warning-content">
              <strong>2026 data is incomplete</strong> &mdash; Only {count2026} satellites recorded (January 2026 only).
              Values for 2026 will appear significantly lower than prior years.
            </div>
          </div>
        )}

        {/* Orbit Type Filter */}
        <div className="orbit-filter-section">
          <h3 className="orbit-filter-title">Orbit Type</h3>
          <div className="orbit-filter-buttons">
            {['All', 'LEO', 'GEO', 'MEO', 'HEO', 'Other'].map(orbit => (
              <button
                key={orbit}
                className={'orbit-btn' + (selectedOrbit === orbit ? ' active' : '')}
                onClick={() => setSelectedOrbit(orbit)}
                style={selectedOrbit === orbit ? {
                  borderColor: ORBIT_COLORS[orbit],
                  background: ORBIT_COLORS[orbit] + '20'
                } : {}}
              >
                <span className="orbit-btn-label">{orbit}</span>
                {orbitCounts[orbit] !== undefined && (
                  <span className="orbit-btn-count">{(orbitCounts[orbit] || 0).toLocaleString()}</span>
                )}
              </button>
            ))}
          </div>
        </div>

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
              <span className="kpi-value">EUR {kpis.addressableRevenue >= 1000 ? (kpis.addressableRevenue / 1000).toFixed(1) + 'B' : kpis.addressableRevenue.toFixed(0) + 'M'}</span>
              <span className="kpi-label">Addressable Revenue @ EUR {(pricePerKg / 1000).toFixed(0)}k/kg</span>
            </div>
          </div>
        </div>

        {/* Bubble Chart */}
        <div className="chart-section">
          <div className="chart-header">
            <h2>Satellite Mass Distribution</h2>
            <div className="chart-info">
              <span className="launcher-badge">
                Your launcher: {formatCapacity(launcherCapacity)} LEO
              </span>
              {selectedOrbit !== 'All' && (
                <span className="orbit-badge" style={{ borderColor: ORBIT_COLORS[selectedOrbit], color: ORBIT_COLORS[selectedOrbit] }}>
                  {selectedOrbit} only
                </span>
              )}
            </div>
          </div>
          <p className="chart-subtitle">
            Bubble size represents total mass in each category. Y-axis shows satellite count.
          </p>

          <div className="chart-container">
            <ResponsiveContainer width="100%" height={420}>
              <ScatterChart margin={{ top: 20, right: 40, left: 20, bottom: 60 }}>
                <defs>
                  <linearGradient id="addressableBubble" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#10b981" stopOpacity={0.9} />
                    <stop offset="100%" stopColor="#06b6d4" stopOpacity={0.7} />
                  </linearGradient>
                  <linearGradient id="partialBubble" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#f59e0b" stopOpacity={0.9} />
                    <stop offset="100%" stopColor="#ea580c" stopOpacity={0.7} />
                  </linearGradient>
                  <linearGradient id="nonAddressableBubble" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#64748b" stopOpacity={0.6} />
                    <stop offset="100%" stopColor="#475569" stopOpacity={0.4} />
                  </linearGradient>
                </defs>

                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />

                <XAxis
                  type="number"
                  dataKey="x"
                  domain={[-0.5, CONSOLIDATED_BINS.length - 0.5]}
                  ticks={CONSOLIDATED_BINS.map((_, i) => i)}
                  tickFormatter={(value) => CONSOLIDATED_BINS[value]?.label || ''}
                  tick={{ fill: '#94a3b8', fontSize: 11 }}
                  angle={-45}
                  textAnchor="end"
                  height={70}
                  interval={0}
                />

                <YAxis
                  type="number"
                  dataKey="y"
                  tick={{ fill: '#94a3b8', fontSize: 12 }}
                  label={{
                    value: 'Number of Satellites',
                    angle: -90,
                    position: 'insideLeft',
                    fill: '#64748b',
                    fontSize: 12
                  }}
                />

                <ZAxis
                  type="number"
                  dataKey="bubbleSize"
                  range={[100, 3000]}
                  domain={[0, maxMass]}
                />

                <Tooltip content={<BubbleTooltip />} />

                <Scatter data={bubbleData}>
                  {bubbleData.map((entry, index) => (
                    <Cell
                      key={'cell-' + index}
                      fill={
                        entry.addressable
                          ? 'url(#addressableBubble)'
                          : entry.partiallyAddressable
                            ? 'url(#partialBubble)'
                            : 'url(#nonAddressableBubble)'
                      }
                      stroke={
                        entry.addressable ? '#10b981' :
                        entry.partiallyAddressable ? '#f59e0b' : '#475569'
                      }
                      strokeWidth={1.5}
                    />
                  ))}
                </Scatter>
              </ScatterChart>
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
            <div className="legend-item bubble-size-note">
              <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="#64748b" strokeWidth="2"><circle cx="12" cy="12" r="10"/></svg>
              <span>Bubble size = total mass in category</span>
            </div>
          </div>
        </div>

        {/* Market Size Curve */}
        <div className="chart-section">
          <div className="chart-header">
            <h2>Market Opportunity by Launcher Capacity</h2>
            <div className="chart-info">
              <span className="launcher-badge">
                Current: {formatCapacity(launcherCapacity)} LEO
              </span>
            </div>
          </div>
          <p className="chart-subtitle">
            How addressable mass and satellite count change with launcher capacity. Adjust the slider to explore.
          </p>

          <div className="chart-container">
            <ResponsiveContainer width="100%" height={340}>
              <ComposedChart data={marketCurveData} margin={{ top: 20, right: 60, left: 20, bottom: 20 }}>
                <defs>
                  <linearGradient id="massAreaGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.05} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
                <XAxis
                  dataKey="label"
                  tick={{ fill: '#94a3b8', fontSize: 12 }}
                />
                <YAxis
                  yAxisId="mass"
                  tick={{ fill: '#94a3b8', fontSize: 12 }}
                  tickFormatter={(v) => v >= 1000 ? (v/1000).toFixed(0) + 'K t' : v + ' t'}
                  label={{
                    value: 'Addressable Mass (t)',
                    angle: -90,
                    position: 'insideLeft',
                    fill: '#10b981',
                    fontSize: 11
                  }}
                />
                <YAxis
                  yAxisId="count"
                  orientation="right"
                  tick={{ fill: '#94a3b8', fontSize: 12 }}
                  tickFormatter={(v) => v >= 1000 ? (v/1000).toFixed(0) + 'K' : v}
                  label={{
                    value: 'Satellite Count',
                    angle: 90,
                    position: 'insideRight',
                    fill: '#38bdf8',
                    fontSize: 11
                  }}
                />
                <Tooltip content={<MarketCurveTooltip />} />

                <Area
                  yAxisId="mass"
                  type="monotone"
                  dataKey="Addressable Mass (t)"
                  fill="url(#massAreaGradient)"
                  stroke="#10b981"
                  strokeWidth={2}
                />
                <Line
                  yAxisId="count"
                  type="monotone"
                  dataKey="Satellite Count"
                  stroke="#38bdf8"
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 5, fill: '#38bdf8' }}
                />

                {/* Current launcher capacity reference */}
                <ReferenceLine
                  yAxisId="mass"
                  x={formatCapacity(launcherCapacity)}
                  stroke="#f59e0b"
                  strokeWidth={2}
                  strokeDasharray="6 3"
                  label={{
                    value: 'Your launcher',
                    position: 'top',
                    fill: '#f59e0b',
                    fontSize: 11
                  }}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>

          <div className="chart-legend">
            <div className="legend-item">
              <span className="legend-color" style={{ background: '#10b981' }} />
              <span>Addressable Mass (tonnes)</span>
            </div>
            <div className="legend-item">
              <span className="legend-color" style={{ background: '#38bdf8' }} />
              <span>Satellite Count</span>
            </div>
            <div className="legend-item">
              <span className="legend-color" style={{ background: '#f59e0b' }} />
              <span>Your launcher capacity</span>
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
            maintained by Jonathan McDowell. Historical data from 2015-2025 launches
            with valid mass records. 2025 includes forecast estimates.
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
