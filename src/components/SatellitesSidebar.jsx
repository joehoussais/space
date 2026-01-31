import './Sidebar.css'

// Category labels for display
const categoryLabels = {
  'sizeClass': 'Size Class',
  'application': 'Application',
  'operatorType': 'Operator Type',
  'orbitType': 'Orbit Type'
}

function SatellitesSidebar({
  years,
  metric,
  setMetric,
  categoryType,
  setCategoryType,
  selectedRegion,
  setSelectedRegion,
  excludeStarlink,
  setExcludeStarlink,
  yearRange,
  setYearRange,
  chartMode,
  setChartMode
}) {
  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <div className="logo">
          <span className="logo-icon">🛰️</span>
          <span className="logo-text">Satellite Market</span>
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
              {cat === 'sizeClass' && <svg className="category-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 6H3M21 12H9M21 18H7"/></svg>}
              {cat === 'application' && <svg className="category-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>}
              {cat === 'operatorType' && <svg className="category-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M9 17v-6M15 17v-6"/></svg>}
              {cat === 'orbitType' && <svg className="category-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2"/><path d="m4.93 4.93 1.41 1.41M17.66 17.66l1.41 1.41M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"/></svg>}
              {categoryLabels[cat]}
            </button>
          ))}
        </div>
        {categoryType === 'application' && (
          <p className="filter-hint methodology-note">
            <svg className="info-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/></svg>
            Multi-purpose satellites counted in each application served. Totals may exceed physical count.
          </p>
        )}
      </div>

      {/* Region Toggle */}
      <div className="filter-section">
        <h3 className="filter-title">Region</h3>
        <div className="region-buttons three-way">
          <button
            className={`region-btn ${selectedRegion === 'Global' ? 'active' : ''}`}
            onClick={() => setSelectedRegion('Global')}
          >
            🌍 Global
          </button>
          <button
            className={`region-btn ${selectedRegion === 'Western-aligned' ? 'active' : ''}`}
            onClick={() => setSelectedRegion('Western-aligned')}
            title="Excluding Russia and China"
          >
            🌐 Western
          </button>
          <button
            className={`region-btn ${selectedRegion === 'Europe' ? 'active' : ''}`}
            onClick={() => setSelectedRegion('Europe')}
          >
            🇪🇺 Europe
          </button>
        </div>
        {selectedRegion === 'Western-aligned' && (
          <p className="filter-hint">
            Global market excluding Russia & China (~65-70% of total)
          </p>
        )}
      </div>

      {/* SpaceX Starlink Toggle - show for Count metric */}
      {metric === 'count' && (
        <div className="filter-section">
          <h3 className="filter-title">SpaceX Starlink</h3>
          <div className="starlink-buttons">
            <button
              className={`starlink-btn ${!excludeStarlink ? 'active' : ''}`}
              onClick={() => setExcludeStarlink(false)}
            >
              Include
            </button>
            <button
              className={`starlink-btn ${excludeStarlink ? 'active' : ''}`}
              onClick={() => setExcludeStarlink(true)}
            >
              Exclude
            </button>
          </div>
          <p className="filter-hint">
            {excludeStarlink
              ? 'Starlink satellites removed from count'
              : 'Starlink accounts for ~60% of global satellites'}
          </p>
        </div>
      )}

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
