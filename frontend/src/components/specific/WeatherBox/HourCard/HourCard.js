import React from 'react';
import { useState, useEffect } from 'react';
import axios from 'axios';
// Weather Icons (keep existing)
import {
  TiWeatherDownpour,
  TiWeatherPartlySunny,
  TiWeatherSnow,
  TiWeatherStormy,
  TiWeatherSunny,
} from 'react-icons/ti';
import { LuCloudFog } from "react-icons/lu";
import { RiDrizzleLine, RiHailLine } from "react-icons/ri";
// Lucide Icons (add new ones)
import { Wind, Droplet, Cloud, Gauge, Eye } from 'lucide-react';
import './HourCard.css';

const HourCard = ({
    latitude,
    longitude,
    date // Expects date format like 'YYYY-MM-DD'
}) => {
  const [hourlyForecastData, setHourlyForecastData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  // Function to calculate weather icons (no changes needed here)
  function calculateIcon(code) {
      // ... (calculateIcon function remains the same)
      if(code===0){ return <TiWeatherSunny size={24} className="sun-icon" />; }
      else if (code ===1 || code===2){ return <TiWeatherPartlySunny size={24}/> }
      else if (code ===3  || code ===45 || code===48){ return <LuCloudFog size={24}/> }
      else if (code ===51 || code===53 || code=== 55){ return <RiDrizzleLine size={24}/> }
      else if (code ===56 || code===57){ return <TiWeatherSnow size={24}/> } // Freezing Drizzle
      else if (code ===61 || code===63 || code=== 65){ return <TiWeatherDownpour size={24}/> } // Rain
      else if (code ===66 || code===67){ return <TiWeatherSnow size={24}/> } // Freezing Rain
      else if (code ===71 || code===73 || code===75){ return <TiWeatherSnow size={24}/> } // Snow fall
      else if (code ===77){ return <TiWeatherSnow size={24}/> } // Snow grains
      else if (code ===80 || code===81 || code===82){ return <TiWeatherDownpour size={24}/> } // Rain showers
      else if (code ===85|| code===86){ return <TiWeatherSnow size={24}/> } // Snow showers
      else if (code ===95){ return <TiWeatherStormy size={24}/> } // Thunderstorm
      else if (code=== 96||code===99){ return <RiHailLine size={24}/> } // Thunderstorm with hail
      return <TiWeatherPartlySunny size={24}/>; // Default icon
  }

  // Function to convert wind direction degrees to cardinal direction (no changes needed here)
   function degreesToCardinal(deg) {
    // ... (degreesToCardinal function remains the same)
    const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
    if (deg === null || typeof deg === 'undefined') return 'N/A';
    return directions[Math.round(deg / 22.5) % 16];
  }


  useEffect(() => {
    const fetchWeatherData = async () => {
      setLoading(true);
      setError(null);
      setHourlyForecastData(null);

      const apiKey = process.env.REACT_APP_OPENMETEO_API_KEY;
      if (!apiKey) {
          setError('Open-Meteo API key is missing. Cannot fetch forecast data.');
          setLoading(false);
          return;
      }

      const customerApiUrl = 'https://customer-api.open-meteo.com/v1/forecast';

      try {
          console.log(`HourCard: Fetching hourly data for date: ${date} using GFS Seamless model.`);

          // Ensure all desired parameters are requested
          const requestedHourlyParams = [
              'temperature_2m', 'relative_humidity_2m', 'precipitation_probability',
              'weather_code', 'surface_pressure', 'visibility',
              'precipitation', 'cloud_cover', 'wind_speed_10m', 'wind_direction_10m'
          ];

          const apiParams = {
              latitude,
              longitude,
              start_date: date,
              end_date: date,
              hourly: requestedHourlyParams.join(','),
              temperature_unit: 'fahrenheit',
              precipitation_unit: 'inch',
              wind_speed_unit: 'mph',
              // *** ADD VISIBILITY UNIT ***
              visibility_unit: 'mile',
              timezone: 'GMT', // <--- MODIFIED FROM 'auto'
              models: 'gfs_seamless'
          };

          const response = await axios.get(customerApiUrl, {
               params: { ...apiParams, apikey: apiKey }
            });

          console.log('HourCard: Raw API Response Data (GFS Seamless requested):', response.data);

          if (response.data && response.data.hourly && response.data.hourly.time) {
              const hourlyData = response.data.hourly.time.map((time, index) => {
                  const localDate = new Date(time);
                  // const formattedTime = localDate.toLocaleTimeString('en-US', { hour: 'numeric', hour12: true }); // <-- ORIGINAL LINE
                  // --- New lines for Zulu time (HH:MMZ format) --- START
                  const utcHours = String(localDate.getUTCHours()).padStart(2, '0');
                  const utcMinutes = String(localDate.getUTCMinutes()).padStart(2, '0');
                  const formattedTime = `${utcHours}:${utcMinutes}Z`;
                  // --- New lines for Zulu time (HH:MMZ format) --- END

                  const getData = (key) => response.data.hourly[key]?.[index] ?? null;

                  const rawCode = getData('weather_code');
                  const numericPrecipProbability = getData('precipitation_probability') ?? 0;

                  // *** EXTRACT AND FORMAT ALL DATA POINTS ***
                  return {
                      time: formattedTime, // <-- Use the new formattedTime
                      temperature: getData('temperature_2m') !== null ? Math.round(getData('temperature_2m')) : 'N/A',
                      humidity: getData('relative_humidity_2m') !== null ? `${Math.round(getData('relative_humidity_2m'))}%` : 'N/A',
                      precipProbabilityString: numericPrecipProbability !== null ? `${Math.round(numericPrecipProbability)}%` : 'N/A',
                      // numericPrecipProbability: numericPrecipProbability, // Keep if needed for other logic, but not display directly
                      precipitationAmountString: getData('precipitation') !== null ? `${getData('precipitation').toFixed(2)}"` : 'N/A',
                      cloudCover: getData('cloud_cover') !== null ? `${Math.round(getData('cloud_cover'))}%` : 'N/A',
                      windSpeed: getData('wind_speed_10m') !== null ? `${Math.round(getData('wind_speed_10m'))}mph` : 'N/A',
                      windDirection: degreesToCardinal(getData('wind_direction_10m')),
                      pressure: getData('surface_pressure') !== null ? `${Math.round(getData('surface_pressure'))}hPa` : 'N/A',
                      // Round visibility to nearest integer mile
                      visibility: getData('visibility') !== null ? `${Math.round(getData('visibility'))}mi` : 'N/A',
                      weatherCodeIcon: calculateIcon(rawCode),
                      rawWeatherCode: rawCode
                  };
              });
              setHourlyForecastData(hourlyData);
          } else {
              setError('Invalid API response format or missing hourly data from GFS Seamless');
              setHourlyForecastData(null);
          }
      }
      catch(err) {
          // ... (error handling remains the same)
          console.error('Failed to fetch weather data (GFS Seamless):', err);
           let errorMsg = 'Failed to fetch hourly GFS Seamless weather data. ';
           if (err.response) {
               errorMsg += `Server responded with ${err.response.status}: ${err.response.data?.reason || err.response.statusText}`;
           } else if (err.request) { errorMsg += 'No response received from weather service.'; }
           else { errorMsg += err.message; }
           setError(errorMsg);
           setHourlyForecastData(null);
      }
      finally {
          setLoading(false);
      }
    };

    if(latitude && longitude && date) { fetchWeatherData(); }
    else { setError('Missing location or date data for hourly forecast.'); setLoading(false); setHourlyForecastData(null); }
  }, [latitude, longitude, date]);

  // --- Loading State ---
  if (loading) {
      // ... (loading skeleton remains the same)
      return (
          <div className='hourCardHolder'>
              {Array.from({ length: 8 }).map((_, index) => (
                  <div className='hour-card hour-card--loading' key={`loading-${index}`} aria-busy="true">
                      {/* Expand skeleton slightly if needed */}
                      <div className="loading-line loading-placeholder-hour"></div>
                      <div className="loading-placeholder-icon-small-circle"></div>
                      <div className="loading-line loading-placeholder-temp-small"></div>
                      <div className="loading-line loading-placeholder-extra-small"></div> {/* Humidity */}
                      <div className="loading-line loading-placeholder-extra-small"></div> {/* Precip */}
                      <div className="loading-line loading-placeholder-extra-small"></div> {/* Cloud */}
                      <div className="loading-line loading-placeholder-extra-small"></div> {/* Wind */}
                      <div className="loading-line loading-placeholder-extra-small"></div> {/* Pressure */}
                      <div className="loading-line loading-placeholder-extra-small"></div> {/* Visibility */}
                  </div>
              ))}
          </div>
       );
  }

  // --- Error State ---
  if (error) { return <div className="hour-card-error">Error: {error}</div>; }

  // --- No Data State ---
  if (!hourlyForecastData || hourlyForecastData.length === 0) { return <div className="hour-card-no-data">No hourly forecast data available for {date}</div>; }

  // --- Render Actual Data ---
  return (
    <div className='hourCardHolder'>
        {hourlyForecastData.map((hourData, index) => (
            <div className='hour-card' key={index} role="region" aria-label={`Forecast for ${hourData.time}`}>
                {/* Time */}
                <div className='hour'>{hourData.time}</div> {/* Will now display Zulu time */}
                {/* Weather Icon */}
                <div className='hour-icon' title={`Weather code: ${hourData.rawWeatherCode ?? 'N/A'}`}>
                    {hourData.weatherCodeIcon}
                </div>
                {/* Temperature */}
                <div className='hour-temp' title="Temperature">{hourData.temperature}°</div>

                {/* *** ALWAYS RENDER ALL DATA POINTS *** */}

                {/* Humidity */}
                <div className='hour-data-point hour-humidity' title="Relative Humidity">
                    <Droplet size={14} style={{ marginRight: '3px', color: '#3b82f6' }} />
                    {hourData.humidity}
                </div>

                {/* Precipitation (Probability / Amount) */}
                <div
                    className='hour-data-point hour-precip' // Use consistent class
                    title={`Precipitation: ${hourData.precipProbabilityString} chance / ${hourData.precipitationAmountString} amount`}
                >
                    <TiWeatherDownpour size={14} style={{ marginRight: '3px', color: '#60a5fa' }} />
                    {`${hourData.precipProbabilityString} / ${hourData.precipitationAmountString}`}
                </div>

                 {/* Cloud Cover */}
                 <div className='hour-data-point hour-cloud' title="Cloud Cover">
                     <Cloud size={14} style={{ marginRight: '3px', color: '#9ca3af' }} />
                     {hourData.cloudCover}
                 </div>

                 {/* Wind Speed & Direction */}
                 <div className='hour-data-point hour-wind' title="Wind Speed & Direction">
                     <Wind size={14} style={{ marginRight: '3px' }} />
                     {`${hourData.windDirection} ${hourData.windSpeed}`}
                 </div>

                 {/* Surface Pressure
                 <div className='hour-data-point hour-pressure' title="Surface Pressure">
                     <Gauge size={14} style={{ marginRight: '3px', color: '#f97316' }} />
                     {hourData.pressure}
                 </div>

                 {/* Visibility
                 <div className='hour-data-point hour-visibility' title="Visibility">
                     <Eye size={14} style={{ marginRight: '3px', color: '#a855f7' }} />
                     {hourData.visibility}
                 </div>*/}

            </div>
        ))}
    </div>
  );
};

export default HourCard;