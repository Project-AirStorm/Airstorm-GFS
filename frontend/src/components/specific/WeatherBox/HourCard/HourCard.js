import React from 'react';
import { useState, useEffect } from 'react';
import axios from 'axios';
import {
  TiWeatherDownpour,
  TiWeatherPartlySunny,
  TiWeatherSnow,
  TiWeatherStormy,
  TiWeatherSunny,
} from 'react-icons/ti';
import { LuCloudFog } from "react-icons/lu";
import { RiDrizzleLine } from "react-icons/ri";
import { RiHailLine } from "react-icons/ri";
import './HourCard.css';

const HourCard = ({
    latitude,
    longitude,
    date
}) => {
  const [hourlyForecastData, setHourlyForecastData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  // Use proper useEffect hook instead of useState
  // Use proper useEffect hook instead of useState
  useEffect(() => {
    const fetchWeatherData = async () => {
        try {
            if (!latitude || !longitude || !date) {
                setError('Missing required location or date data');
                setLoading(false);
                return;
            }

            // Log which date is being fetched
            console.log(`HourCard: Fetching hourly data for date: ${date}`); // <<< ADDED LOG

            const response = await axios.get(`https://customer-api.open-meteo.com/v1/forecast?apikey=${process.env.REACT_APP_OPENMETEO_API_KEY}`,
                {
                    params: {
                        latitude,
                        longitude,
                        date, // The specific date (e.g., '2025-05-01')
                    hourly: [
                        'temperature_2m',
                        'relative_humidity_2m',
                        'precipitation_probability',
                        'weather_code', // We need this
                        'surface_pressure',
                        'visibility'
                    ],
                    temperature_unit: 'fahrenheit',
                    forecast_days: 1, // Fetching only 1 day's worth of hourly data
                    timezone: 'GMT',
                    models: 'best_match'
                    },
                }
            );

            // --- ADDED CONSOLE LOGS ---
            console.log('HourCard: Raw API Response Data:', response.data);
            if (response.data && response.data.hourly) {
                 console.log('HourCard: Hourly Weather Codes Received:', response.data.hourly.weather_code);
                 console.log('HourCard: Corresponding Hourly Times:', response.data.hourly.time);
            } else {
                 console.warn('HourCard: Hourly data not found in response.');
            }
            // --- END ADDED CONSOLE LOGS ---


            function calculateIcon(code) {
               // ... (calculateIcon function remains the same)
                 if(code===0){ return <TiWeatherSunny size={30} className="sun-icon"/>; }
                else if (code ===1 || code===2 ){ return <TiWeatherPartlySunny size={30}/> }
                else if (code ===3 || code===48){ return <LuCloudFog size={30}/> }
                else if (code ===51 || code===53 || code=== 55){ return <RiDrizzleLine size={30}/> }
                else if (code ===56 || code===57){ return <TiWeatherSnow size={30}/> }
                else if (code ===61 || code===63 || code=== 65){ return <TiWeatherDownpour size={30}/> }
                else if (code ===66 || code===67){ return <TiWeatherSnow size={30}/> }
                else if (code ===71 || code===73 || code===75){ return <TiWeatherSnow size={30}/> }
                else if (code ===77){ return <TiWeatherSnow size={30}/> }
                else if (code ===80 || code===81 || code===82){ return <TiWeatherDownpour size={30}/> }
                else if (code ===85|| code===86){ return <TiWeatherSnow size={30}/> }
                else if (code ===95){ return <TiWeatherStormy size={30}/> }
                else if (code=== 96||code===99){ return <RiHailLine size={30}/> }
                // Default icon for unknown codes
                return <TiWeatherPartlySunny size={30}/>
            }

            // Check if hourly data exists in the response
            if (response.data && response.data.hourly && response.data.hourly.time) { // Added check for time array
                const hourlyData = response.data.hourly.time.map((time, index) => {
                    const utcDate = new Date(time);
                    const hours = String(utcDate.getUTCHours()).padStart(2, '0');
                    const minutes = String(utcDate.getUTCMinutes()).padStart(2, '0');
                    const formattedTime = `${hours}:${minutes}Z`;
                    return {
                        time: formattedTime,
                        temperature: Math.round(response.data.hourly.temperature_2m[index]),
                        relative_humidity: response.data.hourly.relative_humidity_2m ?
                            Math.round(response.data.hourly.relative_humidity_2m[index]) : null,
                        precipitation_probability: response.data.hourly.precipitation_probability ?
                            Math.round(response.data.hourly.precipitation_probability[index]) : null,
                        surface_pressure: response.data.hourly.surface_pressure ?
                            Math.round(response.data.hourly.surface_pressure[index]) : null,
                        visibility: response.data.hourly.visibility ?
                            Math.round(response.data.hourly.visibility[index]) : null,
                        // Pass the specific hourly weather code
                        weatherCode: calculateIcon(response.data.hourly.weather_code[index]),
                    };
                });

                setHourlyForecastData(hourlyData);
            } else {
                setError('Invalid API response format or missing hourly data');
            }
        }
        catch(err) {
            console.error('Failed to fetch weather data:', err);
            setError('Failed to fetch hourly weather data');
        }
        finally {
            setLoading(false);
        }
    };

    if(latitude && longitude && date) {
        fetchWeatherData();
    } else {
        setLoading(false);
        setError('Missing location or date data');
    }
    // Ensure API key environment variable check is done elsewhere if needed
  }, [latitude, longitude, date]); // Dependencies remain the same

  if(loading) {
    return <div>Loading hourly forecast...</div>;
  }

  if(error) {
    return <div>Error: {error}</div>;
  }

  if (!hourlyForecastData || hourlyForecastData.length === 0) {
    return <div>No hourly forecast data available</div>;
  }

  return (
    <div className='hourCardHolder'>
        {hourlyForecastData.map((hourData, index) => (
            <div className='hour-card' key={index} role="region">
                <div className='hour'>{hourData.time}</div>
                <div className='hour-icon'>{hourData.weatherCode}</div>
                <div className='hour-temp'>{hourData.temperature}°</div>
            </div>
        ))}
    </div>
  );
};

export default HourCard;