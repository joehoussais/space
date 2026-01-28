import './KPICards.css'

function KPICards({ kpis, selectedRegion, showAddressable }) {
  const isMass = kpis.metric.includes('Mass') || kpis.metric.includes('LEO-equivalent')
  const isRevenue = kpis.metric.includes('revenue')
  const isLeoEquiv = kpis.metric.includes('LEO-equivalent')

  const formatValue = (value) => {
    if (isMass) {
      if (value >= 1000) {
        return `${(value / 1000).toFixed(1)}K t`
      }
      return `${Math.round(value)} t`
    }
    if (isRevenue) {
      return `$${value.toFixed(1)}B`
    }
    return Math.round(value).toLocaleString()
  }

  const getMetricLabel = () => {
    if (isLeoEquiv) return 'LEO-equiv Mass'
    if (isMass) return 'Mass'
    if (isRevenue) return 'Revenue'
    return 'Launches'
  }

  return (
    <div className="kpi-cards">
      <div className="kpi-card">
        <div className="kpi-label">
          {kpis.lastYear} {getMetricLabel()}
        </div>
        <div className="kpi-value">{formatValue(kpis.totalValue)}</div>
        <div className="kpi-sublabel">{selectedRegion} total</div>
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
          <div className="kpi-sublabel">{kpis.addressablePercent}% of selected</div>
        </div>
      ) : selectedRegion === 'Europe' && kpis.europeShare ? (
        <div className="kpi-card highlight">
          <div className="kpi-label">Europe Share</div>
          <div className="kpi-value">{kpis.europeShare}%</div>
          <div className="kpi-sublabel">of global market</div>
        </div>
      ) : selectedRegion === 'Global' ? (
        <div className="kpi-card opportunity">
          <div className="kpi-label">European Share</div>
          <div className="kpi-value opportunity-text">
            ~8%
          </div>
          <div className="kpi-sublabel">
            {isMass ? 'of global mass' : isRevenue ? 'of global revenue' : 'of global launches'}
          </div>
        </div>
      ) : selectedRegion === 'Western-aligned' ? (
        <div className="kpi-card">
          <div className="kpi-label">Western Share</div>
          <div className="kpi-value">~65%</div>
          <div className="kpi-sublabel">excl. Russia & China</div>
        </div>
      ) : null}

      <div className="kpi-card">
        <div className="kpi-label">Sum of Segments</div>
        <div className="kpi-value growth">
          = Total
        </div>
        <div className="kpi-sublabel">No separate "Total market"</div>
      </div>
    </div>
  )
}

export default KPICards
