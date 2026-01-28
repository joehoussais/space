import './Sidebar.css'

// Segment short labels for display
const segmentLabels = {
  'LEO constellations': 'LEO Constellations',
  'Government civil': 'Gov. Civil',
  'Defense / national security': 'Defense',
  'GEO comsat': 'GEO Comsat',
  'Human spaceflight': 'Human Spaceflight',
  'Lunar / cislunar': 'Lunar/Cislunar',
  'Other (rideshare, demos)': 'Other'
}

// Region icons
const regionIcons = {
  'Global': '🌍',
  'Europe': '🇪🇺',
  'Western-aligned': '🌐'
}

function Sidebar({
  metrics,
  segments,
  regions,
  years,
  selectedMetric,
  setSelectedMetric,
  selectedSegments,
  setSelectedSegments,
  selectedRegion,
  setSelectedRegion,
  yearRange,
  setYearRange,
  chartMode,
  setChartMode,
  priceMultiplier,
  setPriceMultiplier
}) {
  const handleSegmentToggle = (segment) => {
    if (selectedSegments.includes(segment)) {
      // Don't allow deselecting the last one
      if (selectedSegments.length > 1) {
        setSelectedSegments(selectedSegments.filter(s => s !== segment))
      }
    } else {
      setSelectedSegments([...selectedSegments, segment])
    }
  }

  const selectAllSegments = () => {
    setSelectedSegments([...segments])
  }

  const clearToOneSegment = () => {
    setSelectedSegments([segments[0]])
  }

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <div className="logo">
          <span className="logo-icon">🚀</span>
          <span className="logo-text">Market Explorer</span>
        </div>
      </div>

      <div className="filter-section">
        <h3 className="filter-title">Metric</h3>
        <div className="metric-buttons-vertical">
          {metrics.map(metric => (
            <button
              key={metric}
              className={`metric-btn ${selectedMetric === metric ? 'active' : ''}`}
              onClick={() => setSelectedMetric(metric)}
            >
              {metric.includes('Mass') && '⚖️ '}
              {metric.includes('launches') && '🚀 '}
              {metric.includes('revenue') && '💰 '}
              {metric.includes('Mass') ? 'Mass (tonnes)' :
               metric.includes('launches') ? 'Launches' :
               'Revenue ($B)'}
            </button>
          ))}
        </div>
      </div>

      {/* Price Multiplier - only show for revenue */}
      {selectedMetric === 'Derived revenue (USD, $B)' && (
        <div className="filter-section">
          <h3 className="filter-title">$/kg Adjustment</h3>
          <div className="price-multiplier-control">
            <input
              type="range"
              min="0.5"
              max="2.0"
              step="0.1"
              value={priceMultiplier}
              onChange={(e) => setPriceMultiplier(parseFloat(e.target.value))}
              className="price-slider"
            />
            <div className="price-multiplier-value">
              {priceMultiplier.toFixed(1)}x default
            </div>
            <p className="filter-hint">
              Adjust $/kg assumptions. 1.0x uses industry estimates. Lower = Starship disruption scenario.
            </p>
          </div>
        </div>
      )}

      <div className="filter-section">
        <h3 className="filter-title">
          Segments
          <span className="segment-actions">
            <button className="segment-action-btn" onClick={selectAllSegments} title="Select all">All</button>
            <button className="segment-action-btn" onClick={clearToOneSegment} title="Clear to one">Clear</button>
          </span>
        </h3>
        <div className="segment-list">
          {segments.map(segment => (
            <label key={segment} className="segment-item">
              <input
                type="checkbox"
                checked={selectedSegments.includes(segment)}
                onChange={() => handleSegmentToggle(segment)}
              />
              <span className="checkbox-custom"></span>
              <span className="segment-label">{segmentLabels[segment] || segment}</span>
            </label>
          ))}
        </div>
        <p className="filter-hint">
          Total = sum of selected segments. No separate "Total market" - it's calculated.
        </p>
      </div>

      <div className="filter-section">
        <h3 className="filter-title">Region</h3>
        <div className="region-buttons three-way">
          {regions.map(region => (
            <button
              key={region}
              className={`region-btn ${selectedRegion === region ? 'active' : ''}`}
              onClick={() => setSelectedRegion(region)}
              title={region === 'Western-aligned' ? 'Excluding Russia & China' : ''}
            >
              {regionIcons[region]} {region === 'Western-aligned' ? 'Western' : region}
            </button>
          ))}
        </div>
        {selectedRegion === 'Western-aligned' && (
          <p className="filter-hint">
            Global excluding Russia & China (~65% of mass, ~69% of launches)
          </p>
        )}
      </div>

      <div className="filter-section">
        <h3 className="filter-title">Year Range</h3>
        <div className="year-range-controls">
          <div className="year-selector">
            <label className="year-selector-label">From</label>
            <select
              value={yearRange[0]}
              onChange={(e) => {
                const value = parseInt(e.target.value)
                if (value < yearRange[1]) {
                  setYearRange([value, yearRange[1]])
                }
              }}
              className="year-select"
            >
              {years.filter(y => parseInt(y) < yearRange[1]).map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          </div>
          <span className="year-range-separator">→</span>
          <div className="year-selector">
            <label className="year-selector-label">To</label>
            <select
              value={yearRange[1]}
              onChange={(e) => {
                const value = parseInt(e.target.value)
                if (value > yearRange[0]) {
                  setYearRange([yearRange[0], value])
                }
              }}
              className="year-select"
            >
              {years.filter(y => parseInt(y) > yearRange[0]).map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="filter-section">
        <h3 className="filter-title">Chart Mode</h3>
        <div className="chart-mode-buttons">
          <button
            className={`mode-btn ${chartMode === 'area' ? 'active' : ''}`}
            onClick={() => setChartMode('area')}
          >
            Stacked Area
          </button>
          <button
            className={`mode-btn ${chartMode === 'line' ? 'active' : ''}`}
            onClick={() => setChartMode('line')}
          >
            Lines
          </button>
        </div>
      </div>

      <div className="sidebar-footer">
        <p className="footer-text">Data: 2020-2035 forecast</p>
        <p className="footer-text">Sources: BryceTech, Space Foundation, ESA</p>
      </div>
    </aside>
  )
}

export default Sidebar
