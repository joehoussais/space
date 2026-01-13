import './KPICards.css'

function KPICards({ kpis, selectedRegion, showAddressable }) {
  const isRevenue = kpis.metric.includes('revenue')

  const formatValue = (value) => {
    if (isRevenue) {
      return `$${value.toFixed(1)}B`
    }
    return Math.round(value).toLocaleString()
  }

  return (
    <div className="kpi-cards">
      <div className="kpi-card">
        <div className="kpi-label">
          {kpis.lastYear} {isRevenue ? 'Revenue' : 'Launches'}
        </div>
        <div className="kpi-value">{formatValue(kpis.totalValue)}</div>
        <div className="kpi-sublabel">{selectedRegion} market</div>
      </div>

      <div className="kpi-card">
        <div className="kpi-label">CAGR</div>
        <div className="kpi-value cagr">
          {kpis.cagr}%
          <span className="trend-arrow">↑</span>
        </div>
        <div className="kpi-sublabel">Compound annual growth</div>
      </div>

      {showAddressable && kpis.addressableValue !== null ? (
        <div className="kpi-card addressable">
          <div className="kpi-label">15t Reusable Addressable</div>
          <div className="kpi-value addressable-value">
            {formatValue(kpis.addressableValue)}
          </div>
          <div className="kpi-sublabel">{kpis.addressablePercent}% of selected market</div>
        </div>
      ) : selectedRegion === 'Europe' && kpis.europeShare ? (
        <div className="kpi-card highlight">
          <div className="kpi-label">Europe Share</div>
          <div className="kpi-value">{kpis.europeShare}%</div>
          <div className="kpi-sublabel">of global market</div>
        </div>
      ) : selectedRegion === 'Global' ? (
        <div className="kpi-card opportunity">
          <div className="kpi-label">European Opportunity</div>
          <div className="kpi-value opportunity-text">
            ~20-22%
          </div>
          <div className="kpi-sublabel">Addressable by EU launchers</div>
        </div>
      ) : null}

      <div className="kpi-card">
        <div className="kpi-label">Market Growth</div>
        <div className="kpi-value growth">
          {isRevenue ? '6.4x' : '8.2x'}
        </div>
        <div className="kpi-sublabel">2020 → 2035 multiple</div>
      </div>
    </div>
  )
}

export default KPICards
