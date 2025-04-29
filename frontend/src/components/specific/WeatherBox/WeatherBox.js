import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import axios from 'axios';
// Corrected: Import Io icons from io5
import {
  IoLocationOutline, IoTrashOutline, IoStarOutline, IoStarSharp,
} from 'react-icons/io5';
// Corrected: Import Ti icons from ti
import {
  TiWeatherDownpour, TiWeatherPartlySunny, TiWeatherSnow, TiWeatherStormy, TiWeatherSunny,
} from 'react-icons/ti';
// Keep other imports
import { LuCloudFog } from "react-icons/lu";
import { RiDrizzleLine, RiHailLine } from "react-icons/ri";
import { FaChevronUp, FaChevronDown } from "react-icons/fa";
import './WeatherBox.css';
import WeatherBoxExtended from'./WeatherBoxExtended.js';

const REACT_APP_API_URL = process.env.REACT_APP_API_URL;

const WeatherBox = ({ latitude, longitude, expandAll }) => {
  const [forecastData, setForecastData] = React.useState(null);
  const [error, setError] = React.useState(null);
  const [openStates, setOpenStates] = useState([]);

  // Function to calculate weather icons (no change)
  function calculateIcon(code){
    // UPDATED: Added className="sun-icon"
    if(code===0){ return <TiWeatherSunny size={50} className="sun-icon" />; }
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

  useEffect(() => {
    const fetchWeatherData = async () => {
      try {
        const response = await axios.get(`https://customer-api.open-meteo.com/v1/forecast?apikey=${process.env.REACT_APP_OPENMETEO_API_KEY}`, {
          params: {
            latitude, longitude,
            daily: ['temperature_2m_max', 'temperature_2m_min', 'weather_code'],
            temperature_unit: 'fahrenheit', precipitation_unit: 'inch',
            forecast_days: 16, timezone: 'auto', models: 'best_match',
          },
        });

        console.log('Raw API Response Data:', response.data); // Keep log for now

        const today = new Date();
        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, '0');
        const day = String(today.getDate()).padStart(2, '0');
        const todayStr = `${year}-${month}-${day}`;
        console.log('Today (YYYY-MM-DD):', todayStr);

        // Map all data first, *adjusting date creation*
        const allDailyData = response.data.daily.time.map((time, index) => {
            // Parse YYYY-MM-DD directly to avoid timezone shifts from midnight assumption
            const [apiYear, apiMonth, apiDay] = time.split('-').map(Number);
            // Create date object using local timezone interpretation of the date components
            const localDate = new Date(apiYear, apiMonth - 1, apiDay); // Month is 0-indexed for constructor

            return {
                // Format the localDate object
                time: localDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }),
                dayOfWeek: localDate.toLocaleDateString('en-US', { weekday: 'short' }),
                date: localDate.toLocaleDateString('en-US',{ day:'numeric' }),
                originalDateStr: time, // Keep the YYYY-MM-DD string from API for filtering
                temperature_min: Math.round(response.data.daily.temperature_2m_min[index]),
                temperature_max: Math.round(response.data.daily.temperature_2m_max[index]),
                weatherCode: calculateIcon(response.data.daily.weather_code[index]),
            };
        });

        console.log('Mapped API Data (Before Filter - Revised Date):', allDailyData);

        // Filter the mapped data (logic remains correct)
        const filteredDailyData = allDailyData.filter(dayData => dayData.originalDateStr >= todayStr);

        console.log('Filtered Forecast Data (Today onwards):', filteredDailyData);

        setForecastData(filteredDailyData);
        setOpenStates(new Array(filteredDailyData.length).fill(expandAll || false));

      } catch (err) {
        console.error("WeatherBox Fetch Error:", err);
        setError('Failed to fetch weather data');
      }
    };

    fetchWeatherData();
  }, [latitude, longitude]);


  // useEffect to handle expandAll prop (no change)
  useEffect(() => {
      if (forecastData && forecastData.length > 0) {
          setOpenStates(new Array(forecastData.length).fill(expandAll));
      }
  }, [expandAll, forecastData]);

  // handleClick function (no change)
  const handleClick = (index) => {
    setOpenStates(prevStates => {
      const newStates = [...prevStates];
      newStates[index] = !newStates[index];
      return newStates;
    });
  };

  // JSX rendering (no change)
  return (
    <div className="weather-boxes-container">
       {error && <div className="error-message">{error}</div>}
       {!error && forecastData && forecastData.length > 0 ? (
            forecastData.map((day, index) => (
                <div key={day.originalDateStr}>
                    <div className='weather-box' role="region">
                         {/* ... Weather box content ... */}
                        <div className='dayOfWeek'>
                            {day.dayOfWeek}
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
                                (<FaChevronUp className="transition-transform duration-300" size={50}/>):
                                (<FaChevronDown className="transition-transform duration-300" size={50}/>)
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
            ))
        ) : (
            !error && <div>Loading forecast or no data available...</div>
        )}
    </div>
  );
}

// PropTypes (no change)
WeatherBox.propTypes = {
    latitude: PropTypes.number.isRequired,
    longitude: PropTypes.number.isRequired,
    expandAll: PropTypes.bool
};

WeatherBox.defaultProps = {
    expandAll: false
};

export default WeatherBox;