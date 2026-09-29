/**
 * VISTAAR Design Tokens & Platform Configuration
 * Contract Requirement: Warm Beige + White + Scientific Blue (#2563EB, #0E7490)
 */

export const THEME_COLORS = {
  background: '#FAF7F0',    // Warm beige/ivory background
  surface: '#FFFFFF',       // Clean white cards and panels
  textPrimary: '#17202A',   // High-contrast charcoal text
  textSecondary: '#5F6B76', // Muted slate secondary text
  border: '#E7E0D5',        // Subtle warm border
  primary: '#2563EB',       // Deep Scientific Blue
  scientific: '#0E7490',    // Cyan / Polar Arctic/Antarctic Cyan
  success: '#15803D',       // Forest green
  warning: '#B45309',       // Amber / Caution
  danger: '#B91C1C',        // Crimson / Alert
};

export const POLAR_STATIONS = [
  {
    id: 'maitri',
    name: 'Maitri Station',
    region: 'Antarctica',
    locationName: 'Schirmacher Oasis, Queen Maud Land',
    coordinates: { lat: -70.7667, lng: 11.7333, elevationMeters: 117 },
    commissionYear: 1989,
    operationalStatus: 'ACTIVE',
    keyInstruments: ['Automatic Weather Station (AWS)', 'High Speed Wind Recorder', 'Ozone Spectrophotometer', 'Geomagnetic Observatory'],
    description: "India's second permanent research station in Antarctica, operating continuously since 1989 in the ice-free Schirmacher Oasis rocky plateau."
  },
  {
    id: 'bharati',
    name: 'Bharati Station',
    region: 'Antarctica',
    locationName: 'Larsemann Hills, East Antarctica',
    coordinates: { lat: -69.4072, lng: 76.1956, elevationMeters: 35 },
    commissionYear: 2012,
    operationalStatus: 'ACTIVE',
    keyInstruments: ['IMD Automatic Weather Station', 'IIG Geomagnetic Observatory', 'Optical Disdrometer', 'Micro Rain Radar', 'Radiometer'],
    description: "State-of-the-art energy-efficient modular station constructed with 134 prefabricated shipping containers, supporting atmospheric, oceanographic, and geological research."
  },
  {
    id: 'himadri',
    name: 'Himadri Station',
    region: 'Arctic',
    locationName: 'Ny-Ålesund, Spitsbergen, Svalbard (Norway)',
    coordinates: { lat: 78.9272, lng: 11.9281, elevationMeters: 10 },
    commissionYear: 2008,
    operationalStatus: 'ACTIVE',
    keyInstruments: ['Micro Rain Radar (MRR-2)', 'HATPRO Multi-frequency Microwave Radiometer', 'OTT-PARSIVEL Optical Disdrometer', 'Aerosol Spectrometer'],
    description: "India's dedicated Arctic research station located at the world's northernmost permanent civilian research settlement in Svalbard, investigating Arctic climate feedback and teleconnections with the Indian Monsoon."
  },
  {
    id: 'himansh',
    name: 'Himansh High-Altitude Station',
    region: 'Himalayas',
    locationName: 'Sutri Dhaka, Chandra Basin, Spiti Valley, Himachal Pradesh',
    coordinates: { lat: 32.4042, lng: 77.6167, elevationMeters: 4080 },
    commissionYear: 2016,
    operationalStatus: 'ACTIVE',
    keyInstruments: ['Automated High-Altitude Meteorological Station', 'Radiation Sensor Array', 'Cryospheric Glacier Monitoring Sensors'],
    description: "India's high-altitude research station in the Third Pole, situated at 4,080m elevation to study Himalayan glaciology, snow cover dynamics, and freshwater security."
  },
  {
    id: 'sankalp',
    name: 'Sankalp / SASE Field Observatory',
    region: 'Himalayas',
    locationName: 'Western Himalayas Glacier Zone',
    coordinates: { lat: 34.2500, lng: 77.5800, elevationMeters: 3850 },
    commissionYear: 2006,
    operationalStatus: 'ACTIVE',
    keyInstruments: ['Synoptic AWS', 'Snow Met Stations', 'Acoustic Snow Sensors'],
    description: "Collaborative cryosphere and snow-avalanche field observation post operated in cooperation with DGRE/SASE to track meteorological and snow accumulation trends."
  }
] as const;
