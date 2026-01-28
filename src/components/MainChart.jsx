import { useState } from 'react'
import {
  ComposedChart,
  Area,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine
} from 'recharts'
import './MainChart.css'

// Color palette for segments (space theme)
const COLORS = {
  'LEO constellations': '#06b6d4',
  'Government civil': '#8b5cf6',
  'Defense / national security': '#ec4899',
  'GEO comsat': '#f59e0b',
  'Human spaceflight': '#10b981',
  'Lunar / cislunar': '#6366f1',
  'Other (rideshare, demos)': '#94a3b8'
}

// Short labels for legend
const SHORT_LABELS = {
  'LEO constellations': 'LEO Constellations',
  'Government civil': 'Gov. Civil',
  'Defense / national security': 'Defense',
  'GEO comsat': 'GEO Comsat',
  'Human spaceflight': 'Human Spaceflight',
  'Lunar / cislunar': 'Lunar/Cislunar',
  'Other (rideshare, demos)': 'Other'
}

function CustomTooltip({ active, payload, label, series, selectedMetric }) {
  if (!active || !payload || !payload.length) return null

  const isMass = selectedMetric.includes('Mass')
  const isRevenue = selectedMetric.includes('revenue')
  const total = payload.reduce((sum, p) => sum + (p.value || 0), 0)
  const dataEntry = payload[0]?.payload

  // Find source notes for the first series
  const sourceNote = series[0]?.notes

  return (
    <div className="custom-tooltip">
      <div className="tooltip-header">
        <span className="tooltip-year">{label}</span>
        {parseInt(label) >= 2025 && <span className="tooltip-forecast">Forecast</span>}
      </div>

      <div className="tooltip-body">
        {payload.map((entry, idx) => (
          <div key={idx} className="tooltip-row">
            <span className="tooltip-dot" style={{ background: entry.color }} />
            <span className="tooltip-label">{SHORT_LABELS[entry.dataKey] || entry.dataKey}</span>
            <span className="tooltip-value">
              {isMass ? `${Math.round(entry.value).toLocaleString()} t` :
               isRevenue ? `$${entry.value?.toFixed(2)}B` :
               Math.round(entry.value).toLocaleString()}
            </span>
          </div>
        ))}

        {payload.length > 1 && (
          <div className="tooltip-total">
            <span>Total</span>
            <span>
              {isMass ? `${Math.round(total).toLocaleString()} t` :
               isRevenue ? `$${total.toFixed(2)}B` :
               Math.round(total).toLocaleString()}
            </span>
          </div>
        )}

        {dataEntry?._addressableTotal !== undefined && (
          <div className="tooltip-addressable">
            <span>15t Reusable Addressable</span>
            <span>
              {isMass ? `${Math.round(dataEntry._addressableTotal).toLocaleString()} t` :
               isRevenue ? `$${dataEntry._addressableTotal.toFixed(2)}B` :
               Math.round(dataEntry._addressableTotal).toLocaleString()}
            </span>
          </div>
        )}

        {dataEntry?._europeTotal !== undefined && !dataEntry?._addressableTotal && (
          <div className="tooltip-europe">
            <span>Europe</span>
            <span>
              {isMass ? `${Math.round(dataEntry._europeTotal).toLocaleString()} t` :
               isRevenue ? `$${dataEntry._europeTotal.toFixed(2)}B` :
               Math.round(dataEntry._europeTotal).toLocaleString()}
            </span>
          </div>
        )}
      </div>

      {sourceNote && (
        <div className="tooltip-source">
          <span className="source-icon">ℹ️</span>
          <span className="source-text">{sourceNote.substring(0, 120)}...</span>
        </div>
      )}
    </div>
  )
}

function CustomLegend({ payload, series }) {
  const [hoveredItem, setHoveredItem] = useState(null)

  return (
    <div className="custom-legend">
      {payload.map((entry, idx) => {
        const fullSourceNote = series.find(s => s.segment === entry.dataKey)?.notes
        const isHovered = hoveredItem === entry.dataKey

        return (
          <div
            key={idx}
            className="legend-item"
            onMouseEnter={() => setHoveredItem(entry.dataKey)}
            onMouseLeave={() => setHoveredItem(null)}
          >
            <span className="legend-dot" style={{ background: entry.color }} />
            <span className="legend-label">{SHORT_LABELS[entry.dataKey] || entry.dataKey}</span>
            {fullSourceNote && <span className="legend-info">ℹ️</span>}

            {isHovered && fullSourceNote && (
              <div className="legend-tooltip">
                {fullSourceNote}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

function MainChart({
  data,
  series,
  chartMode,
  selectedMetric,
  selectedRegion,
  milestones,
  forecastStartYear,
  yearRange,
  showAddressable,
  setShowAddressable,
  launcherClass
}) {
  const isMass = selectedMetric.includes('Mass')
  const isRevenue = selectedMetric.includes('revenue')

  // Filter milestones to visible year range
  const visibleMilestones = milestones.filter(
    m => m.year >= yearRange[0] && m.year <= yearRange[1]
  )

  const formatYAxis = (value) => {
    if (isMass) {
      return value >= 1000 ? `${(value / 1000).toFixed(1)}K t` : `${value} t`
    }
    if (isRevenue) {
      return `$${value}B`
    }
    return value >= 1000 ? `${(value / 1000).toFixed(1)}K` : value
  }

  const getChartTitle = () => {
    if (isMass) return 'Mass to Orbit'
    if (isRevenue) return 'Derived Launch Revenue'
    return 'Orbital Launches'
  }

  return (
    <div className="chart-container">
      <div className="chart-header">
        <h2 className="chart-title">
          {getChartTitle()}
          <span className="chart-region">{selectedRegion}</span>
        </h2>
        <div className="chart-controls">
          {launcherClass && (
            <label className="launcher-fit-toggle">
              <input
                type="checkbox"
                checked={showAddressable}
                onChange={(e) => setShowAddressable(e.target.checked)}
              />
              <span className="toggle-switch"></span>
              <span className="toggle-text">15t Reusable Fit</span>
            </label>
          )}
          {showAddressable && (
            <div className="addressable-indicator">
              <span className="addressable-indicator-box" />
              <span>Addressable market</span>
            </div>
          )}
          {selectedRegion === 'Global' && !showAddressable && (
            <div className="europe-indicator">
              <span className="europe-indicator-box" />
              <span>European share</span>
            </div>
          )}
        </div>
      </div>

      <ResponsiveContainer width="100%" height={420}>
        <ComposedChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
          <defs>
            {/* Gradient definitions for area fills */}
            {series.map((s, idx) => (
              <linearGradient key={s.segment} id={`gradient-${idx}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={COLORS[s.segment]} stopOpacity={0.6} />
                <stop offset="95%" stopColor={COLORS[s.segment]} stopOpacity={0.1} />
              </linearGradient>
            ))}
            {/* Europe opportunity pattern */}
            <pattern id="europePattern" patternUnits="userSpaceOnUse" width="8" height="8">
              <path d="M-2,2 l4,-4 M0,8 l8,-8 M6,10 l4,-4" stroke="#facc15" strokeWidth="1" strokeOpacity="0.3" />
            </pattern>
            {/* Addressable market pattern */}
            <pattern id="addressablePattern" patternUnits="userSpaceOnUse" width="6" height="6">
              <path d="M-1,1 l2,-2 M0,6 l6,-6 M5,7 l2,-2" stroke="#10b981" strokeWidth="1.5" strokeOpacity="0.5" />
            </pattern>
            <linearGradient id="addressableGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
              <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.1} />
            </linearGradient>
          </defs>

          <CartesianGrid
            strokeDasharray="3 3"
            stroke="rgba(99, 179, 237, 0.1)"
            vertical={false}
          />

          <XAxis
            dataKey="year"
            axisLine={false}
            tickLine={false}
            tick={{ fill: '#64748b', fontSize: 12 }}
            dy={10}
          />

          <YAxis
            axisLine={false}
            tickLine={false}
            tick={{ fill: '#64748b', fontSize: 12 }}
            tickFormatter={formatYAxis}
            dx={-10}
          />

          {/* Forecast separator */}
          {forecastStartYear >= yearRange[0] && forecastStartYear <= yearRange[1] && (
            <ReferenceLine
              x={String(forecastStartYear)}
              stroke="#64748b"
              strokeDasharray="5 5"
              label={{
                value: 'Forecast →',
                position: 'top',
                fill: '#64748b',
                fontSize: 11
              }}
            />
          )}

          {/* Addressable market shading (15t reusable) */}
          {showAddressable && data[0]?._addressableTotal !== undefined && (
            <Area
              type="monotone"
              dataKey="_addressableTotal"
              fill="url(#addressableGradient)"
              stroke="#10b981"
              strokeWidth={2}
              strokeDasharray="4 2"
              fillOpacity={1}
            />
          )}

          {/* Europe opportunity shading (when viewing Global and not showing addressable) */}
          {!showAddressable && selectedRegion === 'Global' && data[0]?._europeTotal !== undefined && (
            <Area
              type="monotone"
              dataKey="_europeTotal"
              fill="url(#europePattern)"
              stroke="#facc15"
              strokeWidth={1}
              strokeDasharray="4 4"
              fillOpacity={1}
              stackId="europe"
            />
          )}

          {/* Main data series */}
          {chartMode === 'area' ? (
            series.map((s, idx) => (
              <Area
                key={s.segment}
                type="monotone"
                dataKey={s.segment}
                stackId="main"
                stroke={COLORS[s.segment]}
                fill={`url(#gradient-${idx})`}
                strokeWidth={2}
              />
            ))
          ) : (
            series.map((s) => (
              <Line
                key={s.segment}
                type="monotone"
                dataKey={s.segment}
                stroke={COLORS[s.segment]}
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 6, fill: COLORS[s.segment] }}
              />
            ))
          )}

          {/* Milestone markers */}
          {visibleMilestones.map((milestone, idx) => (
            <ReferenceLine
              key={idx}
              x={String(milestone.year)}
              stroke={milestone.type === 'europe' ? '#38bdf8' : '#8b5cf6'}
              strokeWidth={2}
              strokeOpacity={0.6}
              label={{
                value: milestone.label,
                position: 'insideTopRight',
                fill: milestone.type === 'europe' ? '#38bdf8' : '#8b5cf6',
                fontSize: 10,
                angle: -90,
                offset: 10
              }}
            />
          ))}

          <Tooltip
            content={<CustomTooltip series={series} selectedMetric={selectedMetric} />}
            cursor={{ stroke: 'rgba(99, 179, 237, 0.3)', strokeWidth: 1 }}
          />

          <Legend content={<CustomLegend series={series} />} />
        </ComposedChart>
      </ResponsiveContainer>

      {/* Milestone legend */}
      <div className="milestone-legend">
        {visibleMilestones.map((m, idx) => (
          <div key={idx} className={`milestone-item ${m.type}`}>
            <span className="milestone-dot" />
            <span className="milestone-year">{m.year}</span>
            <span className="milestone-label">{m.label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

export default MainChart
