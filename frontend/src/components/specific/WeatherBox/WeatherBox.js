import React from 'react';
import PropTypes from 'prop-types';
import axios from 'axios';
import {
  IoLocationOutline,
  IoTrashOutline,
  IoStarOutline,
  IoStarSharp,
} from 'react-icons/io5';
import {
  TiWeatherCloudy,
  TiWeatherDownpour,
  TiWeatherPartlySunny,
  TiWeatherSnow,
  TiWeatherStormy,
  TiWeatherSunny,
} from 'react-icons/ti';
import { LuCloudFog } from "react-icons/lu";
import { RiDrizzleLine } from "react-icons/ri";
import { RiHailLine } from "react-icons/ri";
import './WeatherBox.css';

const REACT_APP_API_URL = process.env.REACT_APP_API_URL;

const WeatherBox = ({
    latitude,
    longitude
}) =>
  { 
  const[forecastData, setForecastData] = React.useState(null);
  const [error, setError] = React.useState(null);
  
  
  React.useEffect(() => {
    const fetchWeatherData = async () => {
      
          try{
            const response = await axios.get(`https://customer-api.open-meteo.com/v1/forecast?apikey=${process.env.REACT_APP_OPENMETEO_API_KEY}`,
              {
                params: {
                  latitude,
                  longitude,                
                daily: [
                  'temperature_2m_max',
                  'temperature_2m_min',
                  'weather_code'
                ],
                temperature_unit: 'fahrenheit',
                precipitation_unit: 'inch',
                forecast_days: 16,
                timezone: 'auto',
                models: 'best_match',
                },
            }

          );

          function calculateIcon(code){
            var iconName='';
            switch(code){
              case 0:
                iconName='TiWeatherSunny'
              break;

              case 1,2,3:
                iconName='TiWeatherPartlySunny'
                break;

              case 45,48:
                iconName='LuCloudFog'
                break;
              
              case 51,53,55:
                iconName='RiDrizzleLine'
                break;
              
              case 56,57:
                iconName='TiWeatherSnow'
                break;

              case 61,63,65:
                iconName='TiWeatherDownpour'
                break;

              case 66, 67:
                iconName='TiWeatherSnow'
                break;

              case 71,73,75:
                iconName='TiWeatherSnow'
                break;
              
              case 77:
                iconName='TiWeatherSnow'
                break;

              case 80,81,82:
                iconName='TiWeatherDownpour'
                break;

              case 85, 86:
                iconName='TiWeatherSnow'
                break;

              case 95:
                iconName='TiWeatherStormy'
                break;

              case 96,99:
                iconName='RiHailLine'
                break;
            }
          }

          const dailyData = response.data.daily.time.map((time, index) => ({
            time: new Date(time).toLocaleDateString('en-US', {
              weekday: 'short',
              month: 'short',
              day: 'numeric',
            }),
            dayOfWeek: new Date(time).toLocaleDateString('en-US', {
              weekday: 'short'            
            }),
            date: new Date(time).toLocaleDateString('en-US',{
                day:'numeric'
            }),
            temperature_min: Math.round(response.data.daily.temperature_2m_min[index]),
            temperature_max: Math.round(response.data.daily.temperature_2m_max[index]),
            weatherCode: calculateIcon(response.data.daily.weather_code[index]),
          }))

          
            setForecastData(dailyData);

          } catch (err) {
            setError('Failed to fetch weather data');
          }
        };

        fetchWeatherData();
      }, [latitude, longitude]); // Dependencies array includes latitude and longitude

      return (
        <div className="weather-boxes-container">
          {forecastData && forecastData.map((day, index) => (
            <div className='weather-box' key={index} role="region">
                {
                  //placeholder date
                  <div className='dayOfWeek'>{day.dayOfWeek}
                  <div className= 'date'>{day.date}</div>             
                  </div>           
                }

            <div className='weatherIcon'>{day.weatherCode}</div>

            {            
            <div className='tempFormatting'>
              <div className='minTemp' units='°'>{day.temperature_min}</div>
              <div>/</div>
              <div className='maxTemp' units='°'>{day.temperature_max}</div>
            </div>
            }
          </div>
          ))}
        </div>
      );
  }

export default WeatherBox;

    //GraphCastForecast.js
    /*const GraphCastForecast = () => {
      const [forecast, setForecast] = useState(null);
      const [loading, setLoading] = useState(true);
      const [error, setError] = useState(null);
      const [userLocation, setUserLocation] = useState(null);
    
      useEffect(() => {
        if ('geolocation' in navigator) {
          navigator.geolocation.getCurrentPosition(
            async (position) => {
              const { latitude, longitude } = position.coords;
              setUserLocation({ latitude, longitude });
    
              try {
                const response = await axios.get(
                  `https://customer-api.open-meteo.com/v1/forecast?apikey=${process.env.REACT_APP_OPENMETEO_API_KEY}`,
                  {
                    params: {
                      latitude,
                      longitude,
                      current: [
                        'temperature_2m',
                        'relative_humidity_2m',
                        'precipitation',
                        'cloud_cover',
                      ],
                      daily: [
                        'temperature_2m_max',
                        'temperature_2m_min',
                        'precipitation_sum',
                        'precipitation_probability_max',
                        'cloud_cover_mean',
                        'weather_code',
                      ],
                      temperature_unit: 'fahrenheit',
                      precipitation_unit: 'inch',
                      forecast_days: 16,
                      timezone: 'auto',
                      models: 'best_match',
                    },
                  }
                );
              }


    const dailyData = response.data.daily.time.map((time, index) => ({
      time: new Date(time).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      }),
      temperature_min: Math.round(response.data.daily.temperature_2m_max[index]),
      temperature_max: Math.round(response.data.daily.temperature_2m_min[index])
    }))*/


    
