// WeatherGraph.js
import React from 'react';
import './WeatherGraph.css';

const imageMap = {
  temperature:
    'https://www.meteosource.com/static/img/documentation/temperature_2m_metric.png',
  feels_like_temperature:
    'https://www.meteosource.com/static/img/documentation/apparent_temperature_2m_metric.png',
  clouds:
    'https://www.meteosource.com/static/img/documentation/cloud_cover_total_metric.png',
  precipitation:
    'https://www.meteosource.com/static/img/documentation/total_precipitation_metric.png',
  wind_speed:
    'https://www.meteosource.com/static/img/documentation/wind_spd_10m_metric.png',
  wind_gust:
    'https://www.meteosource.com/static/img/documentation/wind_gust_metric.png',
  pressure:
    'https://www.meteosource.com/static/img/documentation/pressure_msl_metric.png',
  humidity:
    'https://www.meteosource.com/static/img/documentation/relative_humidity_metric.png',
  wave_height:
    'https://www.meteosource.com/static/img/documentation/wave_height_metric.png',
  wave_period:
    'https://www.meteosource.com/static/img/documentation/wave_period_metric.png',
  air_quality:
    'https://www.meteosource.com/static/img/documentation/air_quality_metric.png',
  ozone_surface:
    'https://www.meteosource.com/static/img/documentation/ozone_surface_metric.png',
  ozone_total:
    'https://www.meteosource.com/static/img/documentation/ozone_total_metric.png',
  no2: 'https://www.meteosource.com/static/img/documentation/no2_surface_metric.png',
  'pm2.5':
    'https://www.meteosource.com/static/img/documentation/pm25_metric.png',
};

const units = {
  temperature: '°C',
  feels_like_temperature: '°C',
  clouds: '%',
  precipitation: 'mm/h',
  wind_speed: 'm/s',
  wind_gust: 'm/s',
  pressure: 'hPa',
  humidity: '%',
  wave_height: 'm',
  wave_period: 's',
  air_quality: 'Index',
  ozone_surface: 'µg/m3',
  ozone_total: 'Dobson',
  no2: 'µg/m3',
  pm25: 'µg/m3',
};

const WeatherGraph = ({ weatherType }) => {
  const imageUrl = imageMap[weatherType];
  const displayName = weatherType.replace(/_/g, ' ').replace('pm2.5', 'PM2.5');

  if (!imageUrl) {
    return <div>No image available for {weatherType}</div>;
  }

  return (
    <div className="weather-graph">
      <h2>
        {displayName} ({units[weatherType]})
      </h2>
      <div className="graph-image-container">
        <img
          src={imageUrl}
          alt={`${displayName} visualization`}
          className="meteosource-image"
        />
      </div>
    </div>
  );
};

export default WeatherGraph;
