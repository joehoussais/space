import { useState } from 'react'
import './SourcesPanel.css'

function SourcesPanel({ sourceNotes, methodology, selectedMetric }) {
  const [isExpanded, setIsExpanded] = useState(false)

  const isMass = selectedMetric.includes('Mass')
  const isRevenue = selectedMetric.includes('revenue')
  const isLaunches = selectedMetric.includes('launches')

  return (
    <div className={`sources-panel ${isExpanded ? 'expanded' : ''}`}>
      <button
        className="sources-toggle"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <span className="toggle-icon">{isExpanded ? '▼' : '▶'}</span>
        <span className="toggle-text">Data Sources & Methodology</span>
      </button>

      {isExpanded && (
        <div className="sources-content">
          <div className="sources-intro">
            <h4>
              {isMass ? 'Mass to Orbit Data' :
               isLaunches ? 'Launch Count Data' :
               'Derived Revenue Methodology'}
            </h4>
            <p className="source-notes-main">{sourceNotes}</p>
          </div>

          {isRevenue && (
            <div className="methodology-section">
              <h4>Revenue Calculation</h4>
              <p>
                Revenue is derived by multiplying mass (tonnes) × $/kg price assumptions × 1000.
                Default $/kg values are based on industry estimates but can be adjusted using the
                slider in the sidebar. Lower multipliers simulate Starship-era pricing disruption.
              </p>
              <div className="pricing-note">
                <span className="note-icon">💡</span>
                <span>
                  Example: 1,000t × $2,000/kg = $2B revenue. At 0.5x multiplier = $1B.
                </span>
              </div>
            </div>
          )}

          {methodology && (
            <div className="methodology-section">
              <h4>Segment Definitions</h4>
              <div className="segment-definitions">
                {Object.entries(methodology.segmentDefinitions || {}).map(([segment, definition]) => (
                  <div key={segment} className="segment-definition">
                    <span className="segment-name">{segment}</span>
                    <span className="segment-desc">{definition}</span>
                  </div>
                ))}
              </div>
              {methodology.caveat && (
                <p className="methodology-caveat">
                  <span className="caveat-icon">⚠️</span>
                  {methodology.caveat}
                </p>
              )}
            </div>
          )}

          <div className="sources-footer">
            <p>
              <strong>Primary Sources:</strong> BryceTech Briefings (2020-2024), Space Foundation,
              Jonathan McDowell's Space Statistics (planet4589.org), ESA Annual Reports, FAA/AST.
            </p>
            <p className="transparency-note">
              <strong>Transparency:</strong> Mass data is primary. Revenue figures are derived,
              not sourced directly. Users can apply their own $/kg assumptions for sensitivity analysis.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

export default SourcesPanel
