import './Sidebar.css'

// Category labels for display
const categoryLabels = {
  'sizeClass': 'Size Class',
  'application': 'Application',
  'operatorType': 'Operator Type'
}

function SatellitesSidebar({
  years,
  metric,
  setMetric,
  categoryType,
  setCategoryType,
  showGlobal,
  setShowGlobal,
  yearRange,
  setYearRange,
  chartMode,
  setChartMode
}) {
  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <div className="logo">
          <span className="logo-icon">🇪🇺</span>
          <span className="logo-text">European Satellites</span>
        </div>
      </div>

      {/* Metric Toggle */}
      <div className="filter-section">
        <h3 className="filter-title">Metric</h3>
        <div className="metric-buttons">
          <button
            className={`metric-btn ${metric === 'market' ? 'active' : ''}`}
            onClick={() => setMetric('market')}
          >
            💰 Value ($B)
          </button>
          <button
            className={`metric-btn ${metric === 'count' ? 'active' : ''}`}
            onClick={() => setMetric('count')}
          >
            🛰️ Count
          </button>
        </div>
      </div>

      {/* Category Type Toggle */}
      <div className="filter-section">
        <h3 className="filter-title">Category</h3>
        <div className="category-buttons">
          {Object.keys(categoryLabels).map(cat => (
            <button
              key={cat}
              className={`category-btn ${categoryType === cat ? 'active' : ''}`}
              onClick={() => setCategoryType(cat)}
            >
              {cat === 'sizeClass' && '📏 '}
              {cat === 'application' && '🎯 '}
              {cat === 'operatorType' && '🏢 '}
              {categoryLabels[cat]}
            </button>
          ))}
        </div>
      </div>

      {/* Region Toggle - Europe is primary, Global is overlay */}
      <div className="filter-section">
        <h3 className="filter-title">Compare With</h3>
        <div className="region-buttons">
          <button
            className={`region-btn ${!showGlobal ? 'active' : ''}`}
            onClick={() => setShowGlobal(false)}
          >
            🇪🇺 Europe Only
          </button>
          <button
            className={`region-btn ${showGlobal ? 'active' : ''}`}
            onClick={() => setShowGlobal(true)}
          >
            🌍 + Global
          </button>
        </div>
      </div>

      {/* Year Range */}
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

      {/* Chart Mode */}
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
        <p className="footer-text">Sources: BryceTech, NSR, ESA</p>
      </div>
    </aside>
  )
}

export default SatellitesSidebar
