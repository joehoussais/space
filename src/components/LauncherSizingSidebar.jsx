import './Sidebar.css'
import './LauncherSizingSidebar.css'

// Region icons
const regionIcons = {
  'Global': '',
  'Western Europe': '',
  'Western-aligned': ''
}

function LauncherSizingSidebar({
  launcherCapacity,
  setLauncherCapacity,
  selectedYear,
  setSelectedYear,
  yearMode,
  setYearMode,
  yearRange,
  setYearRange,
  selectedRegion,
  setSelectedRegion,
  pricePerKg,
  setPricePerKg,
  years
}) {
  // Logarithmic scale conversion for the slider
  // Maps linear 0-100 to logarithmic 300-150000
  const logMin = Math.log(300)
  const logMax = Math.log(150000)

  const capacityToSlider = (capacity) => {
    const logValue = Math.log(capacity)
    return ((logValue - logMin) / (logMax - logMin)) * 100
  }

  const sliderToCapacity = (sliderValue) => {
    const logValue = (sliderValue / 100) * (logMax - logMin) + logMin
    return Math.round(Math.exp(logValue))
  }

  const sliderValue = capacityToSlider(launcherCapacity)

  const formatCapacity = (kg) => {
    if (kg >= 1000) {
      return `${(kg / 1000).toFixed(1)} t`
    }
    return `${kg} kg`
  }

  const formatPrice = (price) => {
    if (price >= 1000) {
      return `${(price / 1000).toFixed(0)}k`
    }
    return price.toString()
  }

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <div className="logo">
          <svg className="logo-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M16 16v-4a4 4 0 0 0-8 0v4"/>
            <path d="M6 12h12"/>
            <path d="M6 12a2 2 0 0 0-2 2v4a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-4a2 2 0 0 0-2-2"/>
            <path d="M12 4v4"/>
            <circle cx="12" cy="3" r="1"/>
          </svg>
          <span className="logo-text">Launcher Sizing</span>
        </div>
      </div>

      {/* Launcher Capacity Slider - PRIMARY CONTROL */}
      <div className="filter-section">
        <h3 className="filter-title">Launcher LEO Capacity</h3>
        <div className="capacity-slider-container">
          <input
            type="range"
            min="0"
            max="100"
            step="0.5"
            value={sliderValue}
            onChange={(e) => setLauncherCapacity(sliderToCapacity(parseFloat(e.target.value)))}
            className="capacity-slider"
          />
          <div className="capacity-display">
            <span className="capacity-value">{formatCapacity(launcherCapacity)}</span>
            <span className="capacity-label">to LEO</span>
          </div>
          <div className="capacity-marks">
            <span className="mark">0.3t</span>
            <span className="mark">1t</span>
            <span className="mark">5t</span>
            <span className="mark">15t</span>
            <span className="mark">50t</span>
            <span className="mark">150t</span>
          </div>
        </div>
        <p className="filter-hint">
          Adjust to see what % of satellites your launcher could address
        </p>
      </div>

      {/* Year Selection */}
      <div className="filter-section">
        <h3 className="filter-title">Time Period</h3>
        <div className="year-mode-toggle">
          <button
            className={`mode-btn ${yearMode === 'single' ? 'active' : ''}`}
            onClick={() => setYearMode('single')}
          >
            Single Year
          </button>
          <button
            className={`mode-btn ${yearMode === 'range' ? 'active' : ''}`}
            onClick={() => setYearMode('range')}
          >
            Range
          </button>
        </div>

        {yearMode === 'single' ? (
          <div className="year-single-control">
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="year-select year-select-large"
            >
              {years.map(y => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>
        ) : (
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
            <span className="year-range-separator">-</span>
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
        )}
      </div>

      {/* Region Filter */}
      <div className="filter-section">
        <h3 className="filter-title">Region</h3>
        <div className="region-buttons three-way">
          {['Global', 'Western Europe', 'Western-aligned'].map(region => (
            <button
              key={region}
              className={`region-btn ${selectedRegion === region ? 'active' : ''}`}
              onClick={() => setSelectedRegion(region)}
              title={region === 'Western-aligned' ? 'Excluding Russia & China' : ''}
            >
              {regionIcons[region]} {region === 'Western-aligned' ? 'Western' : region === 'Western Europe' ? 'Europe' : region}
            </button>
          ))}
        </div>
        {selectedRegion === 'Western-aligned' && (
          <p className="filter-hint">
            Global excluding Russia, China, Belarus, etc.
          </p>
        )}
      </div>

      {/* Price per kg Slider */}
      <div className="filter-section">
        <h3 className="filter-title">Launch Price (EUR/kg)</h3>
        <div className="price-slider-container">
          <input
            type="range"
            min="5000"
            max="50000"
            step="1000"
            value={pricePerKg}
            onChange={(e) => setPricePerKg(parseInt(e.target.value))}
            className="price-slider"
          />
          <div className="price-display">
            <span className="price-value">EUR {pricePerKg.toLocaleString()}</span>
            <span className="price-unit">/kg</span>
          </div>
          <div className="price-marks">
            <span className="mark">5k</span>
            <span className="mark">15k</span>
            <span className="mark">25k</span>
            <span className="mark">35k</span>
            <span className="mark">50k</span>
          </div>
        </div>
        <p className="filter-hint">
          Adjust to estimate addressable revenue. Industry avg: ~EUR 10-20k/kg
        </p>
      </div>

      {/* Quick Presets */}
      <div className="filter-section">
        <h3 className="filter-title">Quick Presets</h3>
        <div className="preset-buttons">
          <button
            className="preset-btn"
            onClick={() => setLauncherCapacity(2300)}
            title="Vega C class"
          >
            Vega C (2.3t)
          </button>
          <button
            className="preset-btn"
            onClick={() => setLauncherCapacity(13000)}
            title="Neutron class"
          >
            Neutron (13t)
          </button>
          <button
            className="preset-btn"
            onClick={() => setLauncherCapacity(22800)}
            title="Falcon 9 class"
          >
            Falcon 9 (23t)
          </button>
          <button
            className="preset-btn"
            onClick={() => setLauncherCapacity(63800)}
            title="Falcon Heavy class"
          >
            F. Heavy (64t)
          </button>
        </div>
      </div>

      <div className="sidebar-footer">
        <p className="footer-text">Data: GCAT 2015-2025</p>
        <p className="footer-text">Source: planet4589.org/space/gcat</p>
      </div>
    </aside>
  )
}

export default LauncherSizingSidebar
