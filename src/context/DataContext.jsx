import { createContext, useContext, useMemo } from 'react'
import marketData from '../data/marketData.json'
import launchersData from '../data/launchersData.json'
import constellationsData from '../data/constellationsData.json'

const DataContext = createContext(null)

export function DataProvider({ children }) {
  // Create lookup maps for efficient cross-referencing
  const launchersById = useMemo(() => {
    const map = {}
    launchersData.launchers.forEach(launcher => {
      map[launcher.id] = launcher
    })
    return map
  }, [])

  const constellationsById = useMemo(() => {
    const map = {}
    constellationsData.constellations.forEach(constellation => {
      map[constellation.id] = constellation
    })
    return map
  }, [])

  // Get launchers for a constellation
  const getLaunchersForConstellation = useMemo(() => {
    return (constellationId) => {
      const constellation = constellationsById[constellationId]
      if (!constellation) return []
      return (constellation.launchProviders || [])
        .map(id => launchersById[id])
        .filter(Boolean)
    }
  }, [constellationsById, launchersById])

  // Get constellations served by a launcher
  const getConstellationsForLauncher = useMemo(() => {
    return (launcherId) => {
      const launcher = launchersById[launcherId]
      if (!launcher) return []
      return (launcher.constellationsServed || [])
        .map(id => constellationsById[id])
        .filter(Boolean)
    }
  }, [constellationsById, launchersById])

  // Statistics computed from data
  const stats = useMemo(() => {
    const totalLaunchers = launchersData.launchers.length
    const activeLaunchers = launchersData.launchers.filter(l => l.status === 'Active').length
    const totalConstellations = constellationsData.constellations.length
    const operationalConstellations = constellationsData.constellations.filter(c => c.status === 'Operational').length

    const totalSatellitesDeployed = constellationsData.constellations.reduce(
      (sum, c) => sum + (c.satellitesDeployed || 0), 0
    )
    const totalSatellitesPlanned = constellationsData.constellations.reduce(
      (sum, c) => sum + (c.satellitesPlanned || 0), 0
    )

    return {
      totalLaunchers,
      activeLaunchers,
      totalConstellations,
      operationalConstellations,
      totalSatellitesDeployed,
      totalSatellitesPlanned
    }
  }, [])

  const value = {
    // Raw data
    marketData,
    launchersData,
    constellationsData,

    // Lookup maps
    launchersById,
    constellationsById,

    // Relationship functions
    getLaunchersForConstellation,
    getConstellationsForLauncher,

    // Computed stats
    stats,

    // Utility data
    engineTypes: launchersData.engineTypes,
    countries: { ...launchersData.countries, ...constellationsData.countries },
    orbitTypes: constellationsData.orbitTypes,
    constellationTypes: constellationsData.constellationTypes
  }

  return (
    <DataContext.Provider value={value}>
      {children}
    </DataContext.Provider>
  )
}

export function useData() {
  const context = useContext(DataContext)
  if (!context) {
    throw new Error('useData must be used within a DataProvider')
  }
  return context
}

export default DataContext
