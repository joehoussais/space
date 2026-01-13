import { useState } from 'react'
import './Sidebar.css'

// Use case short labels for display
const useCaseLabels = {
  'Total market': 'Total Market',
  'LEO constellations (comms + EO/IoT)': 'LEO Constellations',
  'Government civil (science + institutional)': 'Gov. Civil',
  'Defense / national security': 'Defense',
  'GEO comsat (single large satellites)': 'GEO Comsat',
  'Human spaceflight + station cargo/logistics': 'Human Spaceflight',
  'Lunar / cislunar / exploration logistics': 'Lunar/Cislunar',
  'Other (tech demos, rideshare misc)': 'Other (demos, rideshare)'
}

function Sidebar({
  metrics,
  useCases,
  regions,
  years,
  selectedMetric,
  setSelectedMetric,
  selectedUseCases,
  setSelectedUseCases,
  selectedRegion,
  setSelectedRegion,
  yearRange,
  setYearRange,
  chartMode,
  setChartMode
}) {
  const minYear = parseInt(years[0])
  const maxYear = parseInt(years[years.length - 1])

  const handleUseCaseToggle = (useCase) => {
    if (selectedUseCases.includes(useCase)) {
      // Don't allow deselecting the last one
      if (selectedUseCases.length > 1) {
        setSelectedUseCases(selectedUseCases.filter(u => u !== useCase))
      }
    } else {
      // If selecting Total market, deselect others; if selecting others, deselect Total
      if (useCase === 'Total market') {
        setSelectedUseCases(['Total market'])
      } else {
        const newSelection = selectedUseCases.filter(u => u !== 'Total market')
        setSelectedUseCases([...newSelection, useCase])
      }
    }
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
        <div className="metric-buttons">
          {metrics.map(metric => (
            <button
              key={metric}
              className={`metric-btn ${selectedMetric === metric ? 'active' : ''}`}
              onClick={() => setSelectedMetric(metric)}
            >
              {metric.includes('revenue') ? '💰 Revenue' : '🚀 Launches'}
            </button>
          ))}
        </div>
      </div>

      <div className="filter-section">
        <h3 className="filter-title">Use Cases</h3>
        <div className="use-case-list">
          {useCases.map(useCase => (
            <label key={useCase} className="use-case-item">
              <input
                type="checkbox"
                checked={selectedUseCases.includes(useCase)}
                onChange={() => handleUseCaseToggle(useCase)}
              />
              <span className="checkbox-custom"></span>
              <span className="use-case-label">{useCaseLabels[useCase] || useCase}</span>
            </label>
          ))}
        </div>
      </div>

      <div className="filter-section">
        <h3 className="filter-title">Region</h3>
        <div className="region-buttons">
          {regions.map(region => (
            <button
              key={region}
              className={`region-btn ${selectedRegion === region ? 'active' : ''}`}
              onClick={() => setSelectedRegion(region)}
            >
              {region === 'Global' ? '🌍' : '🇪🇺'} {region}
            </button>
          ))}
        </div>
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
        <p className="footer-text">Multiple industry sources</p>
      </div>
    </aside>
  )
}

export default Sidebar
