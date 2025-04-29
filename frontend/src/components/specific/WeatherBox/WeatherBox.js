import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import axios from 'axios';

// Import necessary icons
import {
  TiWeatherDownpour, TiWeatherPartlySunny, TiWeatherSnow, TiWeatherStormy, TiWeatherSunny,
} from 'react-icons/ti';
import { LuCloudFog } from "react-icons/lu";
import { RiDrizzleLine, RiHailLine } from "react-icons/ri";
import { FaChevronUp, FaChevronDown } from "react-icons/fa";

// Import child components and styles
import './WeatherBox.css';
import WeatherBoxExtended from'./WeatherBoxExtended.js';
// NOTE: Loader is not imported here as it's not used in the loading state per the request

// WeatherBox Component
const WeatherBox = ({ latitude, longitude, expandAll }) => {
  // --- State Declarations ---
  const [forecastData, setForecastData] = React.useState(null);
  const [error, setError] = React.useState(null);
  const [openStates, setOpenStates] = useState([]);
  const [loading, setLoading] = React.useState(true); // Manage loading state

  // --- Icon Mapping Function ---
  function calculateIcon(code){
    if(code===0){ return <TiWeatherSunny size={50} className="sun-icon" />; } // Added sun-icon class
    else if (code ===1 || code===2 || code=== 3){ return <TiWeatherPartlySunny size={50}/>; }
    else if (code ===45 || code===48){ return <LuCloudFog size={50}/>; }
    else if (code ===51 || code===53 || code=== 55){ return <RiDrizzleLine size={50}/>; }
    else if (code ===56 || code===57){ return <TiWeatherSnow size={50}/>; }
    else if (code ===61 || code===63 || code=== 65){ return <TiWeatherDownpour size={50}/>; }
    else if (code ===66 || code===67){ return <TiWeatherSnow size={50}/>; }
    else if (code ===71 || code===73 || code===75){ return <TiWeatherSnow size={50}/>; }
    else if (code ===77){ return <TiWeatherSnow size={50}/>; }
    else if (code ===80 || code===81 || code===82){ return <TiWeatherDownpour size={50}/>; }
    else if (code ===85|| code===86){ return <TiWeatherSnow size={50}/>; }
    else if (code ===95){ return <TiWeatherStormy size={50}/>; }
    else if (code=== 96||code===99){ return <RiHailLine size={50}/>; }
    return <TiWeatherPartlySunny size={50}/>; // Default icon
  }

  // --- Fetch Daily Forecast Data ---
  useEffect(() => {
    const fetchWeatherData = async () => {
      setLoading(true);
      setError(null);

      const apiKey = process.env.REACT_APP_OPENMETEO_API_KEY;
      if (!apiKey) {
          setError('Open-Meteo API key is missing. Cannot fetch forecast data.');
          setLoading(false);
          return;
      }

      const customerApiUrl = 'https://customer-api.open-meteo.com/v1/forecast';

      try {
        const apiParams = {
            latitude,
            longitude,
            daily: ['temperature_2m_max', 'temperature_2m_min', 'weather_code'],
            temperature_unit: 'fahrenheit',
            precipitation_unit: 'inch',
            forecast_days: 16,
            timezone: 'auto',
            models: 'gfs_graphcast025',
            apikey: apiKey
        };

        const response = await axios.get(customerApiUrl, { params: apiParams });
        console.log('WeatherBox: Raw API Response Data (GraphCast requested from Customer API):', response.data);

        // --- Data Processing ---
        const today = new Date();
        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, '0');
        const day = String(today.getDate()).padStart(2, '0');
        const todayStr = `${year}-${month}-${day}`;

        if (!response.data || !response.data.daily || !response.data.daily.time) {
             throw new Error("Invalid API response format or missing daily data");
        }

        const allDailyData = response.data.daily.time.map((time, index) => {
            const [apiYear, apiMonth, apiDay] = time.split('-').map(Number);
            const localDate = new Date(apiYear, apiMonth - 1, apiDay);
            return {
                time: localDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }),
                dayOfWeek: localDate.toLocaleDateString('en-US', { weekday: 'short' }),
                date: localDate.toLocaleDateString('en-US',{ day:'numeric' }),
                originalDateStr: time,
                temperature_min: Math.round(response.data.daily.temperature_2m_min[index]),
                temperature_max: Math.round(response.data.daily.temperature_2m_max[index]),
                weatherCode: calculateIcon(response.data.daily.weather_code[index]),
            };
        });

        const filteredDailyData = allDailyData.filter(dayData => dayData.originalDateStr >= todayStr);
        setForecastData(filteredDailyData);
        setOpenStates(new Array(filteredDailyData.length).fill(expandAll || false));
        // --- End data processing ---

      } catch (err) {
        console.error("WeatherBox Fetch Error:", err);
        let errorMsg = 'Failed to fetch weather data. ';
        if (err.response) {
            errorMsg += `Server responded with ${err.response.status}: ${err.response.data?.reason || err.response.statusText}`;
        } else if (err.request) {
            errorMsg += 'No response received from weather service.';
        } else {
            errorMsg += err.message;
        }
        setError(errorMsg);
        setForecastData(null);
      } finally {
          setLoading(false);
      }
    };

    if (latitude !== undefined && longitude !== undefined) {
       fetchWeatherData();
    } else {
        setError('Location coordinates are missing.');
        setLoading(false);
    }

  }, [latitude, longitude, expandAll]); // Dependencies

  // --- Handle expandAll Prop Changes ---
  useEffect(() => {
      if (forecastData && forecastData.length > 0) {
          setOpenStates(new Array(forecastData.length).fill(expandAll));
      }
  }, [expandAll, forecastData]);

  // --- Expand/Collapse Handler ---
  const handleClick = (index) => {
    setOpenStates(prevStates => {
      const newStates = [...prevStates];
      newStates[index] = !newStates[index];
      return newStates;
    });
  };

  // --- Component Rendering ---
  return (
    <div className="weather-boxes-container">
       {error && <div className="error-message">{error}</div>}

       {/* Show skeleton loader if loading AND there's no data yet */}
       {loading && !forecastData ? (
            // Render multiple skeleton boxes (e.g., 5 for initial view)
            Array.from({ length: 5 }).map((_, index) => (
                <div key={`loading-${index}`} className="weather-box weather-box--loading" aria-busy="true">
                    {/* Skeleton structure mirroring the actual content */}
                    <div className='dayOfWeek loading-placeholder-container'>
                        <div className="loading-line loading-placeholder-weekday"></div>
                        <div className="loading-line loading-placeholder-daynum"></div>
                    </div>
                    <div className='weatherIcon loading-placeholder-container'>
                        <div className="loading-placeholder-icon-circle"></div>
                    </div>
                    <div className='tempFormatting loading-placeholder-container'>
                        <div className="loading-line loading-placeholder-temp"></div>
                        <div className="loading-line loading-placeholder-slash"></div>
                        <div className="loading-line loading-placeholder-temp"></div>
                    </div>
                    <div className='openButton loading-placeholder-container'>
                        <div className="loading-placeholder-button-circle"></div>
                    </div>
                </div>
            ))
       ) : !error && forecastData && forecastData.length > 0 ? (
            forecastData.map((day, index) => (
                // --- Existing map logic for loaded data ---
                <div key={day.originalDateStr}>
                    <div className='weather-box' role="region">
                        <div className='dayOfWeek'>
                           <div className='weekday'>{day.dayOfWeek}</div>
                           <div className='date'>{day.date}</div>
                        </div>
                        <div className='weatherIcon'>{day.weatherCode}</div>
                        <div className='tempFormatting'>
                            <div className='minTemp'>{day.temperature_min}°</div>
                            <div>/</div>
                            <div className='maxTemp'>{day.temperature_max}°</div>
                        </div>
                        <div className='openButton'>
                            <button onClick={() => handleClick(index)} aria-expanded={openStates[index]}>
                                {openStates[index] ?
                                (<FaChevronUp size={24}/>):
                                (<FaChevronDown size={24}/>)
                                }
                            </button>
                        </div>
                    </div>
                    {openStates[index] && (
                        <div className="expanded-content">
                            <WeatherBoxExtended
                                latitude={latitude}
                                longitude={longitude}
                                day={day}
                            />
                        </div>
                    )}
                </div>
                // --- End Existing map logic ---
            ))
        ) : (
            // Only show this if not loading and no error, but still no data (or empty array)
            !loading && !error && <div className="no-locations-message-center">No forecast data available for this location.</div>
        )}
    </div>
  );
}

// --- PropTypes and DefaultProps ---
WeatherBox.propTypes = {
    latitude: PropTypes.number.isRequired,
    longitude: PropTypes.number.isRequired,
    expandAll: PropTypes.bool
};

WeatherBox.defaultProps = {
    expandAll: false
};

export default WeatherBox;