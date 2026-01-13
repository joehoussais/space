import { useState } from 'react'
import './SourcesPanel.css'

// Short labels for display
const SHORT_LABELS = {
  'Total market': 'Total Market',
  'LEO constellations (comms + EO/IoT)': 'LEO Constellations',
  'Government civil (science + institutional)': 'Gov. Civil',
  'Defense / national security': 'Defense',
  'GEO comsat (single large satellites)': 'GEO Comsat',
  'Human spaceflight + station cargo/logistics': 'Human Spaceflight',
  'Lunar / cislunar / exploration logistics': 'Lunar/Cislunar',
  'Other (tech demos, rideshare misc)': 'Other'
}

function SourcesPanel({ data, selectedMetric }) {
  const [isExpanded, setIsExpanded] = useState(false)

  // Get unique sources for selected metric
  const sources = data
    .filter(d => d.metric === selectedMetric)
    .reduce((acc, d) => {
      if (!acc.find(s => s.useCase === d.useCase && s.region === d.region)) {
        acc.push({
          useCase: d.useCase,
          region: d.region,
          sourceNotes: d.sourceNotes
        })
      }
      return acc
    }, [])

  return (
    <div className={`sources-panel ${isExpanded ? 'expanded' : ''}`}>
      <button
        className="sources-toggle"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <span className="toggle-icon">{isExpanded ? '▼' : '▶'}</span>
        <span className="toggle-text">Sources & Methodology</span>
        <span className="toggle-count">{sources.length} sources</span>
      </button>

      {isExpanded && (
        <div className="sources-content">
          <div className="sources-intro">
            <p>
              Data compiled from multiple industry reports and official sources.
              Forecast values (2025-2035) use compound growth rates derived from
              analyst consensus. All revenue figures in nominal USD billions.
            </p>
          </div>

          <div className="sources-grid">
            {sources.map((source, idx) => (
              <div key={idx} className="source-card">
                <div className="source-header">
                  <span className="source-usecase">
                    {SHORT_LABELS[source.useCase] || source.useCase}
                  </span>
                  <span className={`source-region ${source.region.toLowerCase()}`}>
                    {source.region === 'Global' ? '🌍' : '🇪🇺'} {source.region}
                  </span>
                </div>
                <p className="source-notes">{source.sourceNotes}</p>
              </div>
            ))}
          </div>

          <div className="sources-footer">
            <p>
              <strong>Key sources:</strong> Space Foundation, Fortune Business Insights,
              Allied Market Research, Grand View Research, ESA, NASA, GAO reports
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

export default SourcesPanel
