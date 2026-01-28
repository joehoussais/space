import { useState } from 'react'
import './ConstellationSourcesPanel.css'

function ConstellationSourcesPanel({ dataSources }) {
  const [isExpanded, setIsExpanded] = useState(false)

  if (!dataSources) return null

  return (
    <div className={`constellation-sources-panel ${isExpanded ? 'expanded' : ''}`}>
      <button
        className="sources-toggle"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <span className="toggle-icon">{isExpanded ? '▼' : '▶'}</span>
        <span className="toggle-text">Data Sources & Attribution</span>
        <span className="toggle-count">{dataSources.primary?.length || 0} sources</span>
      </button>

      {isExpanded && (
        <div className="sources-content">
          <div className="sources-intro">
            <p>
              Constellation data compiled from multiple industry sources and official operator websites.
              Data is updated regularly to reflect deployment progress and operational status.
            </p>
            {dataSources.lastUpdated && (
              <p className="last-updated">Last updated: {dataSources.lastUpdated}</p>
            )}
          </div>

          <div className="primary-sources">
            <h4>Primary Sources</h4>
            <div className="source-links">
              {dataSources.primary?.map(source => (
                <a
                  key={source.id}
                  href={source.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="source-link"
                  title={source.description}
                >
                  <span className="source-icon">↗</span>
                  <span className="source-name">{source.name}</span>
                </a>
              ))}
            </div>
          </div>

          <div className="sources-footer">
            <p>
              Individual constellation entries include links to operator websites and specialized databases.
              Click on any constellation card to view detailed specifications and source links.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

export default ConstellationSourcesPanel
