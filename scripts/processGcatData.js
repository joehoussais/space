#!/usr/bin/env node

/**
 * GCAT Data Processing Script
 *
 * Downloads the GCAT satellite catalog and processes it for the Launcher Sizing tool.
 * Filters to 2015+ launches with valid mass data.
 *
 * Source: https://planet4589.org/space/gcat/
 * License: Creative Commons CC-BY
 * Citation: "data from GCAT (J. McDowell, planet4589.org/space/gcat)"
 */

import https from 'https';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const GCAT_URL = 'https://planet4589.org/space/gcat/tsv/cat/satcat.tsv';
const OUTPUT_PATH = path.join(__dirname, '../src/data/launcherSizingData.json');
const MIN_YEAR = 2015;

// Regional mapping based on GCAT state codes
// See: https://planet4589.org/space/gcat/web/intro/states.html
const WESTERN_EUROPE_STATES = [
  'F',      // France
  'D',      // Germany
  'I',      // Italy
  'UK',     // United Kingdom
  'E',      // Spain
  'NL',     // Netherlands
  'B',      // Belgium
  'S',      // Sweden
  'N',      // Norway
  'DK',     // Denmark
  'SF',     // Finland
  'A',      // Austria
  'CH',     // Switzerland
  'P',      // Portugal
  'IRL',    // Ireland
  'L',      // Luxembourg
  'GR',     // Greece
  'PL',     // Poland
  'CZ',     // Czech Republic
  'H',      // Hungary
  'RO',     // Romania
  'BG',     // Bulgaria
  'HR',     // Croatia
  'SK',     // Slovakia
  'SLO',    // Slovenia
  'EST',    // Estonia
  'LV',     // Latvia
  'LT',     // Lithuania
  'CY',     // Cyprus
  'M',      // Malta
  'ESA',    // European Space Agency
  'EUME',   // Eumetsat
  'EUTE',   // Eutelsat
  'SES',    // SES (Luxembourg)
];

const EXCLUDED_FROM_WESTERN = [
  'PRC',    // China
  'RUS',    // Russia
  'SU',     // Soviet Union
  'CIS',    // Commonwealth of Independent States
  'BY',     // Belarus
  'DPRK',   // North Korea
  'IR',     // Iran
  'SYR',    // Syria
  'VE',     // Venezuela
  'CU',     // Cuba
];

// Mass bins for distribution analysis
const MASS_BINS = [
  { min: 0, max: 50, label: '0-50 kg' },
  { min: 50, max: 100, label: '50-100 kg' },
  { min: 100, max: 300, label: '100-300 kg' },
  { min: 300, max: 500, label: '300-500 kg' },
  { min: 500, max: 1000, label: '500 kg - 1 t' },
  { min: 1000, max: 2000, label: '1-2 t' },
  { min: 2000, max: 5000, label: '2-5 t' },
  { min: 5000, max: 10000, label: '5-10 t' },
  { min: 10000, max: 20000, label: '10-20 t' },
  { min: 20000, max: 50000, label: '20-50 t' },
  { min: 50000, max: 150000, label: '50-150 t' },
];

function getRegion(stateCode) {
  if (!stateCode) return 'Global';

  const code = stateCode.trim().toUpperCase();

  if (WESTERN_EUROPE_STATES.includes(code)) {
    return 'Western Europe';
  }

  if (EXCLUDED_FROM_WESTERN.includes(code)) {
    return 'Other';
  }

  // Default: Western-aligned (US, Japan, etc.)
  return 'Western-aligned';
}

function parseDate(dateStr) {
  if (!dateStr || dateStr === '-' || dateStr === '') return null;

  // GCAT format: "YYYY Mon DD" or "YYYY Mon DD HH:MM" or variations
  // Examples: "2023 Jan 15", "2023 Jan  3", "2023 Jan 15 12:30"
  const match = dateStr.match(/(\d{4})\s+(\w+)\s+(\d{1,2})/);
  if (!match) return null;

  const [, year, month, day] = match;
  const months = {
    'Jan': '01', 'Feb': '02', 'Mar': '03', 'Apr': '04',
    'May': '05', 'Jun': '06', 'Jul': '07', 'Aug': '08',
    'Sep': '09', 'Oct': '10', 'Nov': '11', 'Dec': '12'
  };

  const monthNum = months[month];
  if (!monthNum) return null;

  return {
    date: `${year}-${monthNum}-${day.padStart(2, '0')}`,
    year: parseInt(year)
  };
}

function parseMass(massStr) {
  if (!massStr || massStr === '-' || massStr === '') return null;

  // GCAT mass format: number optionally followed by confidence indicator
  // Examples: "306", "306?", "~1500", ">100"
  const cleaned = massStr.replace(/[?~><]/g, '').trim();
  const mass = parseFloat(cleaned);

  if (isNaN(mass) || mass <= 0) return null;
  return mass;
}

function categorizeOrbit(opOrbit) {
  if (!opOrbit) return 'Unknown';

  const orbit = opOrbit.trim().toUpperCase();

  // LEO family (multiplier ~1.0)
  if (orbit.includes('LLEO') || orbit === 'LEO' || orbit.startsWith('LEO/')) {
    return 'LEO';
  }
  // SSO — Sun-Synchronous, technically LEO but specific (multiplier ~1.0)
  if (orbit.includes('SSO') || orbit.includes('S/S')) {
    return 'SSO';
  }
  // GTO — Geostationary Transfer Orbit (multiplier ~1.8, not yet at GEO)
  if (orbit.includes('GTO')) {
    return 'GTO';
  }
  // GEO / GSO — Geostationary / Geosynchronous (multiplier ~2.2)
  if (orbit.includes('GEO') || orbit.includes('GSO')) {
    return 'GEO';
  }
  // MEO — Medium Earth Orbit (multiplier ~1.5)
  if (orbit.includes('MEO')) {
    return 'MEO';
  }
  // EEO — Extended/Eccentric Elliptical Orbit (multiplier ~2.0)
  if (orbit.includes('EEO')) {
    return 'EEO';
  }
  // HEO — Highly Elliptical Orbit (multiplier ~2.5)
  if (orbit.includes('HEO') && !orbit.includes('HELIO')) {
    return 'HEO';
  }
  // Heliocentric (multiplier ~3.0)
  if (orbit.includes('HELIO') || orbit.includes('HCO')) {
    return 'Helio';
  }
  // Lunar / Cislunar / Selenocentric (multiplier ~3.0)
  if (orbit.includes('MOON') || orbit.includes('LUN') || orbit.includes('SEL') ||
      orbit.includes('CLO') || orbit.includes('CISLU') || orbit.includes('EML')) {
    return 'Lunar';
  }
  // Deep space / Planetary (multiplier ~4.0)
  if (orbit.includes('MARS') || orbit.includes('DEEP') || orbit.includes('PLAN') ||
      orbit.includes('DSO') || orbit.includes('SOI')) {
    return 'Deep Space';
  }

  return 'Other';
}

function downloadFile(url) {
  return new Promise((resolve, reject) => {
    console.log(`Downloading from ${url}...`);

    https.get(url, (response) => {
      if (response.statusCode === 301 || response.statusCode === 302) {
        // Follow redirect
        downloadFile(response.headers.location).then(resolve).catch(reject);
        return;
      }

      if (response.statusCode !== 200) {
        reject(new Error(`HTTP ${response.statusCode}`));
        return;
      }

      let data = '';
      response.setEncoding('utf8');

      response.on('data', (chunk) => {
        data += chunk;
      });

      response.on('end', () => {
        console.log(`Downloaded ${(data.length / 1024 / 1024).toFixed(2)} MB`);
        resolve(data);
      });

      response.on('error', reject);
    }).on('error', reject);
  });
}

function parseTSV(tsvData) {
  const lines = tsvData.split('\n');
  if (lines.length < 2) {
    throw new Error('TSV file appears empty');
  }

  // Parse header
  const headerLine = lines[0];
  const headers = headerLine.split('\t').map(h => h.trim().replace(/^#\s*/, ''));

  console.log(`Found ${headers.length} columns: ${headers.slice(0, 10).join(', ')}...`);

  // Find column indices
  const colIndex = {
    name: headers.findIndex(h => h.toLowerCase() === 'name' || h.toLowerCase() === 'satname'),
    ldate: headers.findIndex(h => h.toLowerCase() === 'ldate' || h.toLowerCase() === 'launch_date'),
    mass: headers.findIndex(h => h.toLowerCase() === 'mass'),
    owner: headers.findIndex(h => h.toLowerCase() === 'owner'),
    state: headers.findIndex(h => h.toLowerCase() === 'state' || h.toLowerCase() === 'stateowner'),
    opOrbit: headers.findIndex(h => h.toLowerCase() === 'oporbit' || h.toLowerCase() === 'orbit'),
  };

  console.log('Column indices:', colIndex);

  // Parse data rows
  const satellites = [];
  let skippedNoMass = 0;
  let skippedOldDate = 0;
  let skippedNoDate = 0;

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line || line.startsWith('#')) continue;

    const cols = line.split('\t');

    // Parse mass
    const massKg = parseMass(cols[colIndex.mass]);
    if (!massKg) {
      skippedNoMass++;
      continue;
    }

    // Parse date
    const dateInfo = parseDate(cols[colIndex.ldate]);
    if (!dateInfo) {
      skippedNoDate++;
      continue;
    }

    // Filter by year
    if (dateInfo.year < MIN_YEAR) {
      skippedOldDate++;
      continue;
    }

    // Get state and region
    const state = cols[colIndex.state]?.trim() || '';
    const region = getRegion(state);

    satellites.push({
      name: cols[colIndex.name]?.trim() || 'Unknown',
      launchDate: dateInfo.date,
      year: dateInfo.year,
      massKg: Math.round(massKg),
      owner: cols[colIndex.owner]?.trim() || '',
      state: state,
      region: region,
      orbit: categorizeOrbit(cols[colIndex.opOrbit])
    });
  }

  console.log(`\nProcessing summary:`);
  console.log(`  Total data rows: ${lines.length - 1}`);
  console.log(`  Skipped (no mass): ${skippedNoMass}`);
  console.log(`  Skipped (no date): ${skippedNoDate}`);
  console.log(`  Skipped (before ${MIN_YEAR}): ${skippedOldDate}`);
  console.log(`  Valid satellites: ${satellites.length}`);

  return satellites;
}

function generateOutput(satellites) {
  // Get unique years
  const years = [...new Set(satellites.map(s => s.year.toString()))].sort();

  // Calculate distributions
  const distributions = {};

  for (const region of ['Global', 'Western Europe', 'Western-aligned']) {
    distributions[region] = {};

    for (const year of years) {
      // Filter satellites for this region/year
      let regionSats;
      if (region === 'Global') {
        regionSats = satellites.filter(s => s.year.toString() === year);
      } else if (region === 'Western Europe') {
        regionSats = satellites.filter(s => s.year.toString() === year && s.region === 'Western Europe');
      } else {
        // Western-aligned includes Western Europe
        regionSats = satellites.filter(s =>
          s.year.toString() === year &&
          (s.region === 'Western Europe' || s.region === 'Western-aligned')
        );
      }

      // Calculate bin distributions
      const byBin = MASS_BINS.map(bin => {
        const satsInBin = regionSats.filter(s => s.massKg >= bin.min && s.massKg < bin.max);
        return {
          bin: bin.label,
          count: satsInBin.length,
          totalMassKg: satsInBin.reduce((sum, s) => sum + s.massKg, 0),
          totalMassTonnes: Math.round(satsInBin.reduce((sum, s) => sum + s.massKg, 0) / 100) / 10
        };
      });

      // Calculate cumulative distributions
      let cumulativeCount = 0;
      let cumulativeMass = 0;
      const totalCount = regionSats.length;
      const totalMass = regionSats.reduce((sum, s) => sum + s.massKg, 0);

      const cumulative = MASS_BINS.map(bin => {
        const satsUpToBin = regionSats.filter(s => s.massKg < bin.max);
        cumulativeCount = satsUpToBin.length;
        cumulativeMass = satsUpToBin.reduce((sum, s) => sum + s.massKg, 0);

        return {
          maxMassKg: bin.max,
          label: bin.label,
          count: cumulativeCount,
          massTonnes: Math.round(cumulativeMass / 100) / 10,
          pctCount: totalCount > 0 ? Math.round(cumulativeCount / totalCount * 1000) / 10 : 0,
          pctMass: totalMass > 0 ? Math.round(cumulativeMass / totalMass * 1000) / 10 : 0
        };
      });

      distributions[region][year] = {
        totalCount: regionSats.length,
        totalMassTonnes: Math.round(totalMass / 100) / 10,
        byBin,
        cumulative
      };
    }
  }

  // Build output
  const output = {
    metadata: {
      source: 'GCAT (General Catalog of Artificial Space Objects)',
      sourceUrl: 'https://planet4589.org/space/gcat/',
      citation: 'data from GCAT (J. McDowell, planet4589.org/space/gcat)',
      license: 'Creative Commons CC-BY',
      processedDate: new Date().toISOString().split('T')[0],
      filterCriteria: `LDate >= ${MIN_YEAR}-01-01, Mass > 0`,
      totalSatellites: satellites.length,
      forecastBoundary: 2026
    },
    years,
    regions: ['Global', 'Western Europe', 'Western-aligned'],
    massBins: MASS_BINS,
    distributions,
    satellites: satellites.sort((a, b) => {
      // Sort by year desc, then mass desc
      if (b.year !== a.year) return b.year - a.year;
      return b.massKg - a.massKg;
    })
  };

  return output;
}

async function main() {
  try {
    console.log('=== GCAT Data Processing Script ===\n');

    // Download data
    const tsvData = await downloadFile(GCAT_URL);

    // Parse TSV
    console.log('\nParsing TSV data...');
    const satellites = parseTSV(tsvData);

    // Generate output
    console.log('\nGenerating output...');
    const output = generateOutput(satellites);

    // Write output
    console.log(`\nWriting to ${OUTPUT_PATH}...`);
    fs.writeFileSync(OUTPUT_PATH, JSON.stringify(output, null, 2));

    // Summary
    console.log('\n=== Summary ===');
    console.log(`Years covered: ${output.years[0]} - ${output.years[output.years.length - 1]}`);
    console.log(`Total satellites: ${output.metadata.totalSatellites}`);
    console.log(`Output file size: ${(fs.statSync(OUTPUT_PATH).size / 1024 / 1024).toFixed(2)} MB`);

    // Show yearly breakdown
    console.log('\nYearly breakdown (Global):');
    for (const year of output.years.slice(-5)) {
      const data = output.distributions.Global[year];
      console.log(`  ${year}: ${data.totalCount} satellites, ${data.totalMassTonnes} tonnes`);
    }

    console.log('\n=== Done! ===');

  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

main();
