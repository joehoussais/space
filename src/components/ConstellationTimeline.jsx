import { useMemo, useState } from 'react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  ReferenceLine
} from 'recharts'
import './ConstellationTimeline.css'

// Validation colors matching the data schema
const VALIDATION_COLORS = {
  Validated: '#10b981',
  Announced: '#f59e0b'
}

// Status colors for the progress portion
const STATUS_COLORS = {
  Operational: '#10b981',
  Deployment: '#06b6d4',
  Development: '#64748b'
}

// Type colors for grouping
const TYPE_COLORS = {
  'Broadband Internet': '#06b6d4',
  'Earth Observation': '#8b5cf6',
  'Navigation': '#f59e0b',
  'Direct-to-Device': '#ec4899',
  'IoT/M2M': '#10b981',
  'Government Secure Comms': '#6366f1'
}

function CustomTooltip({ active, payload }) {
  if (!active || !payload || !payload.length) return null

  const data = payload[0]?.payload
  if (!data) return null

  const startYear = data.startYear
  const endYear = data.endYear
  const deploymentPercent = data.satellitesPlanned > 0
    ? Math.round((data.satellitesDeployed / data.satellitesPlanned) * 100)
    : 0

  return (
    <div className="timeline-tooltip">
      <div className="tooltip-header">
        <span className="tooltip-name">{data.name}</span>
        <span
          className="tooltip-validation"
          style={{ backgroundColor: VALIDATION_COLORS[data.validation] }}
        >
          {data.validation}
        </span>
      </div>
      <div className="tooltip-operator">{data.operator}</div>
      <div className="tooltip-type" style={{ color: TYPE_COLORS[data.type] || '#64748b' }}>
        {data.type}
      </div>
      <div className="tooltip-divider" />
      <div className="tooltip-row">
        <span>First Launch</span>
        <span>{startYear || 'TBD'}</span>
      </div>
      <div className="tooltip-row">
        <span>Full Deployment</span>
        <span>{endYear || 'TBD'}</span>
      </div>
      <div className="tooltip-row">
        <span>Duration</span>
        <span>{startYear && endYear ? `${endYear - startYear} years` : '-'}</span>
      </div>
      <div className="tooltip-divider" />
      <div className="tooltip-row">
        <span>Satellites</span>
        <span>{data.satellitesDeployed?.toLocaleString()} / {data.satellitesPlanned?.toLocaleString()}</span>
      </div>
      <div className="tooltip-row">
        <span>Progress</span>
        <span>{deploymentPercent}%</span>
      </div>
      <div className="tooltip-row">
        <span>Status</span>
        <span style={{ color: STATUS_COLORS[data.status] }}>{data.status}</span>
      </div>
    </div>
  )
}

function ConstellationTimeline({ constellations, constellationTypes }) {
  const [excludeStarlink, setExcludeStarlink] = useState(true)
  const [groupBy, setGroupBy] = useState('validation')
  const [sortBy, setSortBy] = useState('startYear')

  const currentYear = new Date().getFullYear()

  // Process data for the Gantt chart
  const { chartData, yearRange } = useMemo(() => {
    let filtered = constellations.filter(c => {
      // Exclude Starlink if toggle is on
      if (excludeStarlink && c.id === 'starlink') return false
      // Only include constellations with timeline data
      return c.firstLaunch || c.fullDeploymentTarget
    })

    // Calculate year range
    let minYear = currentYear
    let maxYear = currentYear + 5

    filtered.forEach(c => {
      const startYear = c.firstLaunch ? new Date(c.firstLaunch).getFullYear() : null
      const endYear = c.fullDeploymentTarget ? parseInt(c.fullDeploymentTarget) : null

      if (startYear && startYear < minYear) minYear = startYear
      if (endYear && endYear > maxYear) maxYear = endYear
    })

    // Pad the range slightly
    minYear = Math.max(2015, minYear - 1)
    maxYear = Math.min(2035, maxYear + 1)

    // Transform data for horizontal bar chart
    const data = filtered.map(c => {
      const startYear = c.firstLaunch ? new Date(c.firstLaunch).getFullYear() : null
      const endYear = c.fullDeploymentTarget ? parseInt(c.fullDeploymentTarget) : null

      // Calculate bar positioning: offset from minYear and duration
      const barStart = startYear ? startYear - minYear : (endYear ? endYear - minYear - 2 : currentYear - minYear)
      const barEnd = endYear ? endYear - minYear : (startYear ? startYear - minYear + 3 : currentYear - minYear + 3)

      return {
        ...c,
        startYear,
        endYear,
        barStart,
        barDuration: Math.max(1, barEnd - barStart),
        displayName: c.name.length > 20 ? c.name.substring(0, 18) + '...' : c.name
      }
    })

    // Sort data
    data.sort((a, b) => {
      if (sortBy === 'startYear') {
        const aStart = a.startYear || 9999
        const bStart = b.startYear || 9999
        return aStart - bStart
      } else if (sortBy === 'endYear') {
        const aEnd = a.endYear || 9999
        const bEnd = b.endYear || 9999
        return aEnd - bEnd
      } else if (sortBy === 'validation') {
        if (a.validation !== b.validation) {
          return a.validation === 'Validated' ? -1 : 1
        }
        return (a.startYear || 9999) - (b.startYear || 9999)
      } else if (sortBy === 'type') {
        if (a.type !== b.type) {
          return a.type.localeCompare(b.type)
        }
        return (a.startYear || 9999) - (b.startYear || 9999)
      }
      return 0
    })

    return {
      chartData: data,
      yearRange: { min: minYear, max: maxYear }
    }
  }, [constellations, excludeStarlink, sortBy, currentYear])

  // Generate year ticks
  const yearTicks = useMemo(() => {
    const ticks = []
    for (let year = yearRange.min; year <= yearRange.max; year++) {
      ticks.push(year - yearRange.min)
    }
    return ticks
  }, [yearRange])

  // Format tick to show actual year
  const formatXTick = (value) => {
    const year = yearRange.min + value
    return year
  }

  // Calculate chart height based on data
  const chartHeight = Math.max(400, chartData.length * 32 + 80)

  // Stats for the header
  const stats = useMemo(() => {
    const validated = chartData.filter(c => c.validation === 'Validated').length
    const announced = chartData.filter(c => c.validation === 'Announced').length
    const deploying = chartData.filter(c => c.status === 'Deployment' || c.status === 'Operational').length
    return { validated, announced, deploying, total: chartData.length }
  }, [chartData])

  return (
    <div className="constellation-timeline">
      <div className="timeline-header">
        <div className="timeline-title">
          <h2>Constellation Deployment Timeline</h2>
          <p>Pipeline view of satellite constellation deployments from first launch to full deployment</p>
        </div>
        <div className="timeline-stats">
          <div className="timeline-stat">
            <span className="stat-value" style={{ color: VALIDATION_COLORS.Validated }}>{stats.validated}</span>
            <span className="stat-label">Validated</span>
          </div>
          <div className="timeline-stat">
            <span className="stat-value" style={{ color: VALIDATION_COLORS.Announced }}>{stats.announced}</span>
            <span className="stat-label">Announced</span>
          </div>
          <div className="timeline-stat">
            <span className="stat-value">{stats.deploying}</span>
            <span className="stat-label">Active</span>
          </div>
        </div>
      </div>

      <div className="timeline-controls">
        <label className="timeline-toggle">
          <input
            type="checkbox"
            checked={excludeStarlink}
            onChange={(e) => setExcludeStarlink(e.target.checked)}
          />
          <span className="toggle-switch"></span>
          <span className="toggle-text">Exclude Starlink</span>
        </label>

        <div className="timeline-select">
          <label>Sort by</label>
          <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
            <option value="startYear">First Launch</option>
            <option value="endYear">Full Deployment</option>
            <option value="validation">Validation Status</option>
            <option value="type">Constellation Type</option>
          </select>
        </div>

        <div className="timeline-select">
          <label>Color by</label>
          <select value={groupBy} onChange={(e) => setGroupBy(e.target.value)}>
            <option value="validation">Validation Status</option>
            <option value="type">Constellation Type</option>
            <option value="status">Deployment Status</option>
          </select>
        </div>
      </div>

      <div className="timeline-legend">
        {groupBy === 'validation' && (
          <>
            <div className="legend-item">
              <span className="legend-dot" style={{ backgroundColor: VALIDATION_COLORS.Validated }} />
              <span>Validated (confirmed funding & deployment)</span>
            </div>
            <div className="legend-item">
              <span className="legend-dot" style={{ backgroundColor: VALIDATION_COLORS.Announced }} />
              <span>Announced (timeline uncertain)</span>
            </div>
          </>
        )}
        {groupBy === 'type' && Object.entries(TYPE_COLORS).map(([type, color]) => (
          <div key={type} className="legend-item">
            <span className="legend-dot" style={{ backgroundColor: color }} />
            <span>{type}</span>
          </div>
        ))}
        {groupBy === 'status' && Object.entries(STATUS_COLORS).map(([status, color]) => (
          <div key={status} className="legend-item">
            <span className="legend-dot" style={{ backgroundColor: color }} />
            <span>{status}</span>
          </div>
        ))}
        <div className="legend-item legend-current">
          <span className="legend-line" />
          <span>Current Year ({currentYear})</span>
        </div>
      </div>

      <div className="timeline-chart-container">
        <ResponsiveContainer width="100%" height={chartHeight}>
          <BarChart
            data={chartData}
            layout="vertical"
            margin={{ top: 20, right: 30, left: 140, bottom: 20 }}
            barCategoryGap={4}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="rgba(99, 179, 237, 0.1)"
              horizontal={false}
            />
            <XAxis
              type="number"
              domain={[0, yearRange.max - yearRange.min]}
              ticks={yearTicks}
              tickFormatter={formatXTick}
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#64748b', fontSize: 11 }}
            />
            <YAxis
              type="category"
              dataKey="displayName"
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#e2e8f0', fontSize: 11 }}
              width={130}
            />
            <Tooltip
              content={<CustomTooltip />}
              cursor={{ fill: 'rgba(99, 179, 237, 0.05)' }}
            />

            {/* Current year reference line */}
            <ReferenceLine
              x={currentYear - yearRange.min}
              stroke="#38bdf8"
              strokeWidth={2}
              strokeDasharray="5 5"
            />

            {/* Offset bars (invisible, for positioning) */}
            <Bar
              dataKey="barStart"
              stackId="timeline"
              fill="transparent"
              isAnimationActive={false}
            />

            {/* Duration bars (visible) */}
            <Bar
              dataKey="barDuration"
              stackId="timeline"
              radius={[4, 4, 4, 4]}
              isAnimationActive={true}
            >
              {chartData.map((entry, index) => {
                let color
                if (groupBy === 'validation') {
                  color = VALIDATION_COLORS[entry.validation] || '#64748b'
                } else if (groupBy === 'type') {
                  color = TYPE_COLORS[entry.type] || '#64748b'
                } else if (groupBy === 'status') {
                  color = STATUS_COLORS[entry.status] || '#64748b'
                }
                return <Cell key={`cell-${index}`} fill={color} fillOpacity={0.8} />
              })}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="timeline-footer">
        <div className="timeline-note">
          Bars represent timeline from first launch to projected full deployment.
          Dashed line indicates current year. Hover over bars for details.
        </div>
      </div>
    </div>
  )
}

export default ConstellationTimeline
