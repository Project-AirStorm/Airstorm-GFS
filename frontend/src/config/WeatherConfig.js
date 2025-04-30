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