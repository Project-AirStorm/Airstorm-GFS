// src/config/weatherConfig.js

export const weatherVariables = [
  { value: 'none', label: 'No Overlay' },
  { value: 'temperature', label: 'Temperature' },
  { value: 'feels_like_temperature', label: 'Feels Like' },
  { value: 'clouds', label: 'Cloud Cover' },
  { value: 'precipitation', label: 'Precipitation' },
  { value: 'wind_speed', label: 'Wind Speed' },
  { value: 'wind_gust', label: 'Wind Gust' },
  { value: 'pressure', label: 'Pressure' },
  { value: 'humidity', label: 'Humidity' },
  { value: 'air_quality', label: 'Air Quality' },
  { value: 'ozone_surface', label: 'Surface Ozone' },
  { value: 'ozone_total', label: 'Total Ozone' },
  { value: 'no2', label: 'NO₂' },
  { value: 'pm2.5', label: 'PM₂.₅' }
];

export const units = {
  none: '',
  temperature: '°C',
  feels_like_temperature: '°C',
  clouds: '%',
  precipitation: 'mm/h',
  wind_speed: 'm/s',
  wind_gust: 'm/s',
  pressure: 'hPa',
  humidity: '%',
  air_quality: 'Index',
  ozone_surface: 'µg/m³',
  ozone_total: 'Dobson',
  no2: 'µg/m³',
  'pm2.5': 'µg/m³'
};

// Map configuration
export const defaultMapConfig = {
  center: { lat: 36, lng: -86 },
  zoom: 4,
  options: {
    mapTypeControl: true,
    streetViewControl: false,
    fullscreenControl: true,
    zoomControl: true
  }
};

// Weather refresh intervals (in milliseconds)
export const refreshIntervals = {
  weatherData: 300000, // 5 minutes
  locations: 300000,   // 5 minutes
  alerts: 600000       // 10 minutes
};

// API endpoints
export const apiEndpoints = {
  weather: '/api/weather',
  locations: '/api/locations',
  geocode: '/api/geocode',
  meteosource: '/api/meteosource/tile'
};

// Map marker styles
export const markerStyles = {
  selected: {
    path: 'CIRCLE',
    fillColor: '#FF0000',
    fillOpacity: 1,
    strokeWeight: 0,
    scale: 8
  },
  saved: {
    path: 'CIRCLE',
    fillColor: '#4A90E2',
    fillOpacity: 0.9,
    strokeWeight: 0,
    scale: 8
  },
  favorite: {
    path: 'CIRCLE',
    fillColor: '#FFD700',
    fillOpacity: 0.9,
    strokeWeight: 0,
    scale: 8
  }
};

// Timeline configuration
export const timelineConfig = {
  maxDays: 7,
  stepHours: 1,
  labelInterval: 24 // Show labels every 24 hours
};


// --- Updated and Expanded Variable Styles for Charts ---
export const variableStyles = {
  temperature_2m: { // For Temp Max/Min/Mean lines
    color: '#E53E3E', // Red (Max)
    altColor: '#3182CE', // Blue (Min)
    meanColor: '#ECC94B', // Yellow (Mean - Optional)
  },
  apparent_temperature: { // For Feels Like Max/Min lines
    color: '#DD6B20', // Orange (Max)
    altColor: '#63B3ED', // Light Blue (Min)
  },
  precipitation_probability: { // For Precip Prob Max/Min/Mean lines
    color: '#4FD1C5', // Teal (Max)
    altColor: '#81E6D9', // Lighter Teal (Min)
    meanColor: '#38B2AC', // Darker Teal (Mean)
  },
  precipitation: { // For Precip Amount (Sum) line/bar
    color: '#4299E1', // Standard Blue
  },
  rain: { // For Rain Sum line
    color: '#63B3ED', // Light Blue
  },
  showers: { // For Showers Sum line
    color: '#90CDF4', // Very Light Blue
  },
  snowfall: { // For Snowfall Sum / Snowfall Water Equivalent lines
    color: '#EBF8FF', // Very Pale Blue / Off-white
  },
  wind_speed_10m: { // For Wind Speed Max/Min/Mean lines
    color: '#805AD5', // Purple (Max)
    altColor: '#B794F4', // Lighter Purple (Min)
    meanColor: '#9F7AEA', // Mid Purple (Mean)
  },
  wind_gusts_10m: { // For Wind Gusts Max/Min/Mean lines
    color: '#718096', // Dark Gray/Slate (Max)
    altColor: '#E2E8F0', // Light Gray (Min)
    meanColor: '#A0AEC0', // Mid Gray (Mean)
  },
  // wind_direction_10m_dominant: { color: '#???' }, // Direction often not plotted as colored line
  cloud_cover: { // For Cloud Cover Max/Min/Mean lines
    color: '#4A5568', // Darker Slate (Max)
    altColor: '#E2E8F0', // Light Gray (Min)
    meanColor: '#A0AEC0', // Mid Gray/Slate (Mean)
  },
  uv_index: { // For UV Index Max/Clear Sky Max lines
    color: '#F6E05E', // Yellow (Max)
    altColor: '#FAF089', // Lighter Yellow (Clear Sky Max)
  },
  // precipitation_hours: { color: '#???' }, // Hours - likely not plotted as colored line
  // sunshine_duration: { color: '#???' }, // Duration - likely not plotted as colored line
  // daylight_duration: { color: '#???' }, // Duration - likely not plotted as colored line
  visibility: { // For Visibility Max/Min/Mean lines
    color: '#718096', // Dark Gray/Slate (Max)
    altColor: '#E2E8F0', // Light Gray (Min)
    meanColor: '#A0AEC0', // Mid Gray (Mean)
  },
  relative_humidity_2m: { // For Humidity Max/Min/Mean lines
    color: '#48BB78', // Green (Max)
    altColor: '#9AE6B4', // Light Green (Min)
    meanColor: '#68D391', // Mid Green (Mean)
  },
  cape: { // For CAPE Max/Min/Mean lines
    color: '#F56565', // Redish (Max)
    altColor: '#FED7D7', // Light Pink (Min)
    meanColor: '#FC8181', // Mid Red/Pink (Mean)
  },
  dew_point_2m: { // For Dew Point Max/Min/Mean lines
    color: '#38A169', // Dark Green (Max/Mean) - Reuse Humidity Green?
    altColor: '#C6F6D5', // Very Light Green (Min)
    meanColor: '#68D391', // Mid Green (Mean)
  },
  updraft_max: { // For Updraft Max line
    color: '#ED64A6', // Pink
  },
  // weather_code, sunrise, sunset unlikely to be plotted with variable color
};