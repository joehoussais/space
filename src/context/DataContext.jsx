import { createContext, useContext, useMemo } from 'react'
import marketData from '../data/marketData.json'
import launchersData from '../data/launchersData.json'
import constellationsData from '../data/constellationsData.json'
import satellitesData from '../data/satellitesData.json'

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

  const manufacturersById = useMemo(() => {
    const map = {}
    satellitesData.manufacturers.forEach(manufacturer => {
      map[manufacturer.id] = manufacturer
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

  // Get preferred launchers for a manufacturer
  const getLaunchersForManufacturer = useMemo(() => {
    return (manufacturerId) => {
      const manufacturer = manufacturersById[manufacturerId]
      if (!manufacturer) return []
      return (manufacturer.preferredLaunchers || [])
        .map(id => launchersById[id])
        .filter(Boolean)
    }
  }, [manufacturersById, launchersById])

  // Get manufacturers that use a specific launcher
  const getManufacturersForLauncher = useMemo(() => {
    return (launcherId) => {
      return satellitesData.manufacturers.filter(m =>
        (m.preferredLaunchers || []).includes(launcherId)
      )
    }
  }, [])

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

    const totalManufacturers = satellitesData.manufacturers.length
    const europeanManufacturers = satellitesData.manufacturers.filter(m => m.countryCode === 'EU').length
    const totalManufacturerSatellites = satellitesData.manufacturers.reduce(
      (sum, m) => sum + (m.satellitesBuilt || 0), 0
    )

    return {
      totalLaunchers,
      activeLaunchers,
      totalConstellations,
      operationalConstellations,
      totalSatellitesDeployed,
      totalSatellitesPlanned,
      totalManufacturers,
      europeanManufacturers,
      totalManufacturerSatellites
    }
  }, [])

  const value = {
    // Raw data
    marketData,
    launchersData,
    constellationsData,
    satellitesData,

    // Lookup maps
    launchersById,
    constellationsById,
    manufacturersById,

    // Relationship functions
    getLaunchersForConstellation,
    getConstellationsForLauncher,
    getLaunchersForManufacturer,
    getManufacturersForLauncher,

    // Computed stats
    stats,

    // Utility data
    engineTypes: launchersData.engineTypes,
    countries: { ...launchersData.countries, ...constellationsData.countries, ...satellitesData.countries },
    orbitTypes: constellationsData.orbitTypes,
    constellationTypes: constellationsData.constellationTypes,
    manufacturerTypes: satellitesData.manufacturerTypes,
    sizeClassColors: satellitesData.sizeClassColors,
    applicationColors: satellitesData.applicationColors,
    operatorTypeColors: satellitesData.operatorTypeColors
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
