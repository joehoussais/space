import './DataTable.css'

// Short labels for table headers
const SHORT_LABELS = {
  'LEO constellations': 'LEO Const.',
  'Government civil': 'Gov. Civil',
  'Defense / national security': 'Defense',
  'GEO comsat': 'GEO Comsat',
  'Human spaceflight': 'Human SF',
  'Lunar / cislunar': 'Lunar',
  'Other (rideshare, demos)': 'Other'
}

function DataTable({ data, series, selectedMetric }) {
  const isMass = selectedMetric.includes('Mass') || selectedMetric.includes('LEO-equivalent')
  const isLeoEquiv = selectedMetric.includes('LEO-equivalent')
  const isRevenue = selectedMetric.includes('revenue')

  const formatValue = (value) => {
    if (value === undefined || value === null) return '—'
    if (isMass) {
      return `${Math.round(value).toLocaleString()} t`
    }
    if (isRevenue) {
      return `$${value.toFixed(2)}B`
    }
    return Math.round(value).toLocaleString()
  }

  const getMetricLabel = () => {
    if (isLeoEquiv) return 'LEO-Equivalent Mass (tonnes)'
    if (isMass) return 'Mass to Orbit (tonnes)'
    if (isRevenue) return 'Derived Revenue ($B)'
    return 'Launch Count'
  }

  // Get column headers from series
  const columns = series.map(s => s.segment)

  // Calculate totals if multiple series
  const showTotal = series.length > 1

  return (
    <div className="data-table-container">
      <div className="table-header">
        <h3 className="table-title">Data Table</h3>
        <span className="table-metric">{getMetricLabel()}</span>
      </div>

      <div className="table-wrapper">
        <table className="data-table">
          <thead>
            <tr>
              <th className="year-col">Year</th>
              {columns.map(col => (
                <th key={col}>{SHORT_LABELS[col] || col}</th>
              ))}
              {showTotal && <th className="total-col">Total</th>}
            </tr>
          </thead>
          <tbody>
            {data.map((row, idx) => {
              const total = columns.reduce((sum, col) => sum + (row[col] || 0), 0)
              const isForecast = parseInt(row.year) >= 2025

              return (
                <tr key={row.year} className={isForecast ? 'forecast-row' : ''}>
                  <td className="year-col">
                    {row.year}
                    {isForecast && <span className="forecast-badge">F</span>}
                  </td>
                  {columns.map(col => (
                    <td key={col}>{formatValue(row[col])}</td>
                  ))}
                  {showTotal && (
                    <td className="total-col">{formatValue(total)}</td>
                  )}
                </tr>
              )
            })}
          </tbody>
          <tfoot>
            <tr>
              <td className="year-col">CAGR</td>
              {columns.map(col => {
                const firstVal = data[0]?.[col] || 0
                const lastVal = data[data.length - 1]?.[col] || 0
                const years = data.length - 1
                const cagr = years > 0 && firstVal > 0
                  ? ((Math.pow(lastVal / firstVal, 1 / years) - 1) * 100).toFixed(1)
                  : '—'
                return (
                  <td key={col} className="cagr-cell">
                    {cagr !== '—' ? `${cagr}%` : cagr}
                  </td>
                )
              })}
              {showTotal && (
                <td className="total-col cagr-cell">
                  {(() => {
                    const firstTotal = columns.reduce((sum, col) => sum + (data[0]?.[col] || 0), 0)
                    const lastTotal = columns.reduce((sum, col) => sum + (data[data.length - 1]?.[col] || 0), 0)
                    const years = data.length - 1
                    return years > 0 && firstTotal > 0
                      ? `${((Math.pow(lastTotal / firstTotal, 1 / years) - 1) * 100).toFixed(1)}%`
                      : '—'
                  })()}
                </td>
              )}
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  )
}

export default DataTable
