import { useState, useMemo } from 'react'
import { DataProvider } from './context/DataContext'
import Navigation from './components/Navigation'
import Sidebar from './components/Sidebar'
import KPICards from './components/KPICards'
import MainChart from './components/MainChart'
import DataTable from './components/DataTable'
import SourcesPanel from './components/SourcesPanel'
import LaunchersPage from './pages/LaunchersPage'
import SatellitesPage from './pages/SatellitesPage'
import ConstellationsPage from './pages/ConstellationsPage'
import marketData from './data/marketData.json'
import './App.css'

function MarketOverviewPage() {
  // Filter state
  const [selectedMetric, setSelectedMetric] = useState('Mass to orbit (tonnes)')
  const [selectedSegments, setSelectedSegments] = useState(marketData.segments) // All segments selected by default
  const [selectedRegion, setSelectedRegion] = useState('Global')
  const [yearRange, setYearRange] = useState([2020, 2035])
  const [chartMode, setChartMode] = useState('area') // 'area' or 'line'
  const [showAddressable, setShowAddressable] = useState(false)
  const [priceMultiplier, setPriceMultiplier] = useState(1.0) // User can adjust $/kg assumptions

  // Get launcher class data
  const launcherClass = marketData.launcherClasses?.['15t-reusable'] || null

  // Get data based on metric type
  const getDataForMetric = (metric, region, segment, year) => {
    if (metric === 'Mass to orbit (tonnes)') {
      const regionData = marketData.massData[region]
      if (!regionData || !regionData[segment]) return 0
      return regionData[segment].values[year] || 0
    } else if (metric === 'Orbital launches (count)') {
      const regionData = marketData.launchData[region]
      if (!regionData || !regionData[segment]) return 0
      return regionData[segment].values[year] || 0
    } else if (metric === 'Derived revenue (USD, $B)') {
      // Revenue = mass × $/kg × priceMultiplier / 1,000,000 (to get $B from tonnes)
      const regionData = marketData.massData[region]
      if (!regionData || !regionData[segment]) return 0
      const mass = regionData[segment].values[year] || 0
      const pricePerKg = marketData.pricingAssumptions.default[segment]?.values[year] || 5000
      // mass is in tonnes (1000 kg), price is $/kg, result in $B
      return (mass * 1000 * pricePerKg * priceMultiplier) / 1000000000
    }
    return 0
  }

  // Filter data based on selections
  const filteredData = useMemo(() => {
    const years = marketData.years.filter(y => {
      const year = parseInt(y)
      return year >= yearRange[0] && year <= yearRange[1]
    })

    // Handle Western-aligned region by applying multipliers to Global data
    let effectiveRegion = selectedRegion
    let multiplier = 1.0
    if (selectedRegion === 'Western-aligned') {
      effectiveRegion = 'Global'
      const regionDef = marketData.regionDefinitions['Western-aligned']
      multiplier = selectedMetric === 'Orbital launches (count)'
        ? regionDef.launchMultiplier
        : regionDef.massMultiplier
    }

    // Get data for selected segments
    const series = selectedSegments.map(segment => {
      const segmentData = selectedMetric === 'Mass to orbit (tonnes)'
        ? marketData.massData[effectiveRegion]?.[segment]
        : selectedMetric === 'Orbital launches (count)'
          ? marketData.launchData[effectiveRegion]?.[segment]
          : marketData.massData[effectiveRegion]?.[segment] // For revenue, we use mass data

      return {
        segment,
        notes: segmentData?.notes || '',
        values: years.map(year => {
          let value = getDataForMetric(selectedMetric, effectiveRegion, segment, year)
          if (selectedRegion === 'Western-aligned') {
            value *= multiplier
          }
          return { year, value }
        })
      }
    })

    // Get Europe data for opportunity indicator (when viewing Global)
    let europeData = null
    if (selectedRegion === 'Global') {
      europeData = selectedSegments.map(segment => {
        return {
          segment,
          values: years.map(year => ({
            year,
            value: getDataForMetric(selectedMetric, 'Europe', segment, year)
          }))
        }
      })
    }

    return { years, series, europeData }
  }, [selectedMetric, selectedSegments, selectedRegion, yearRange, priceMultiplier])

  // Chart data formatted for Recharts
  const chartData = useMemo(() => {
    return filteredData.years.map((year, idx) => {
      const point = { year }
      filteredData.series.forEach(s => {
        point[s.segment] = s.values[idx].value
      })
      // Add Europe total for opportunity shading
      if (filteredData.europeData) {
        point._europeTotal = filteredData.europeData.reduce(
          (sum, s) => sum + s.values[idx].value, 0
        )
      }
      // Add addressable total for 15t reusable overlay
      if (showAddressable && launcherClass) {
        let addressableTotal = 0
        filteredData.series.forEach(s => {
          const addressability = launcherClass.addressability[s.segment]
          if (addressability) {
            addressableTotal += s.values[idx].value * (addressability.percentage / 100)
          }
        })
        point._addressableTotal = addressableTotal
      }
      return point
    })
  }, [filteredData, showAddressable, launcherClass])

  // Calculate KPIs
  const kpis = useMemo(() => {
    const lastYear = filteredData.years[filteredData.years.length - 1]
    const firstYear = filteredData.years[0]

    const totalLast = filteredData.series.reduce(
      (sum, s) => sum + (s.values[s.values.length - 1]?.value || 0), 0
    )
    const totalFirst = filteredData.series.reduce(
      (sum, s) => sum + (s.values[0]?.value || 0), 0
    )

    // Get Global total for Europe share calculation
    let europeShare = null
    if (selectedRegion === 'Europe') {
      let globalTotal = 0
      selectedSegments.forEach(segment => {
        globalTotal += getDataForMetric(selectedMetric, 'Global', segment, lastYear)
      })
      if (globalTotal > 0) {
        europeShare = ((totalLast / globalTotal) * 100).toFixed(1)
      }
    }

    // Calculate addressable market stats
    let addressableValue = null
    let addressablePercent = null
    if (showAddressable && launcherClass) {
      addressableValue = filteredData.series.reduce((sum, s) => {
        const addressability = launcherClass.addressability[s.segment]
        const lastVal = s.values[s.values.length - 1]?.value || 0
        return sum + (addressability ? lastVal * (addressability.percentage / 100) : 0)
      }, 0)
      addressablePercent = totalLast > 0 ? ((addressableValue / totalLast) * 100).toFixed(0) : 0
    }

    // CAGR calculation
    const years = parseInt(lastYear) - parseInt(firstYear)
    const cagr = years > 0 && totalFirst > 0
      ? ((Math.pow(totalLast / totalFirst, 1 / years) - 1) * 100).toFixed(1)
      : 0

    return {
      totalValue: totalLast,
      lastYear,
      europeShare,
      cagr,
      metric: selectedMetric,
      addressableValue,
      addressablePercent
    }
  }, [filteredData, selectedMetric, selectedRegion, selectedSegments, showAddressable, launcherClass, priceMultiplier])

  // Get source notes for the current view
  const sourceNotes = useMemo(() => {
    if (selectedMetric === 'Mass to orbit (tonnes)') {
      return marketData.massData.sourceNotes
    } else if (selectedMetric === 'Orbital launches (count)') {
      return marketData.launchData.sourceNotes
    } else {
      return marketData.pricingAssumptions.description + ' ' + marketData.massData.methodology
    }
  }, [selectedMetric])

  return (
    <div className="market-page">
      <Sidebar
        metrics={marketData.metrics}
        segments={marketData.segments}
        regions={marketData.regions}
        years={marketData.years}
        selectedMetric={selectedMetric}
        setSelectedMetric={setSelectedMetric}
        selectedSegments={selectedSegments}
        setSelectedSegments={setSelectedSegments}
        selectedRegion={selectedRegion}
        setSelectedRegion={setSelectedRegion}
        yearRange={yearRange}
        setYearRange={setYearRange}
        chartMode={chartMode}
        setChartMode={setChartMode}
        priceMultiplier={priceMultiplier}
        setPriceMultiplier={setPriceMultiplier}
      />
      <main className="main-content">
        <header className="header">
          <h1>Space Launch Market Explorer</h1>
          <p className="subtitle">Strategic market analysis 2020-2035 • Mass-based data with adjustable $/kg</p>
        </header>

        <KPICards kpis={kpis} selectedRegion={selectedRegion} showAddressable={showAddressable} />

        <MainChart
          data={chartData}
          series={filteredData.series}
          chartMode={chartMode}
          selectedMetric={selectedMetric}
          selectedRegion={selectedRegion}
          milestones={marketData.milestones}
          forecastStartYear={marketData.forecastStartYear}
          yearRange={yearRange}
          showAddressable={showAddressable}
          setShowAddressable={setShowAddressable}
          launcherClass={launcherClass}
        />

        <DataTable
          data={chartData}
          series={filteredData.series}
          selectedMetric={selectedMetric}
        />

        <SourcesPanel
          sourceNotes={sourceNotes}
          methodology={marketData.dataMethodology}
          selectedMetric={selectedMetric}
        />
      </main>
    </div>
  )
}

function App() {
  const [currentPage, setCurrentPage] = useState('market')

  const renderPage = () => {
    switch (currentPage) {
      case 'market':
        return <MarketOverviewPage />
      case 'launchers':
        return <LaunchersPage />
      case 'satellites':
        return <SatellitesPage />
      case 'constellations':
        return <ConstellationsPage />
      default:
        return <MarketOverviewPage />
    }
  }

  return (
    <DataProvider>
      <div className="app">
        <Navigation currentPage={currentPage} setCurrentPage={setCurrentPage} />
        <div className="page-container">
          {renderPage()}
        </div>
      </div>
    </DataProvider>
  )
}

export default App
