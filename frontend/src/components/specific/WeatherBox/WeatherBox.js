import React from 'react';
import { useState } from 'react';
import PropTypes from 'prop-types';
import axios from 'axios';
import {
  IoLocationOutline,
  IoTrashOutline,
  IoStarOutline,
  IoStarSharp,
} from 'react-icons/io5';
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
import { FaChevronUp } from "react-icons/fa";
import { FaChevronDown } from "react-icons/fa";
import './WeatherBox.css';
import WeatherBoxExtended from'./WeatherBoxExtended.js'

const REACT_APP_API_URL = process.env.REACT_APP_API_URL;

const WeatherBox = ({
    latitude,
    longitude
}) =>
  { 
  const[forecastData, setForecastData] = React.useState(null);
  const [error, setError] = React.useState(null);
  const [openStates, setOpenStates] = useState([]);
  
  
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
            if(code===0){
              return <TiWeatherSunny size={50} />;
            }
            else if (code ===1 || code===2 || code=== 3){
              return <TiWeatherPartlySunny size={50}/>
            }
            else if (code ===45 || code===48){
              return <LuCloudFog size={50}/>
            }
            else if (code ===51 || code===53 || code=== 55){
              return <RiDrizzleLine size={50}/>
            }
            else if (code ===56 || code===57){
              return <TiWeatherSnow size={50}/>
            }
            else if (code ===61 || code===63 || code=== 65){
              return <TiWeatherDownpour size={50}/>
            }
            else if (code ===66 || code===67){
              return <TiWeatherSnow size={50}/>
            }
            else if (code ===71 || code===73 || code===75){
              return <TiWeatherSnow size={50}/>
            }
            else if (code ===77){
              return <TiWeatherSnow size={50}/>
            }
            else if (code ===80 || code===81 || code===82){
              return <TiWeatherDownpour size={50}/>
            }
            else if (code ===85|| code===86){
              return <TiWeatherSnow size={50}/>
            }
            else if (code ===95){
              return <TiWeatherStormy size={50}/>
            }
            else if (code=== 96||code===99){
              return <RiHailLine size={50}/>
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
            setOpenStates(new Array(dailyData.length).fill(false));

          } catch (err) {
            setError('Failed to fetch weather data');
          }
        };

        fetchWeatherData();
      }, [latitude, longitude]); // Dependencies array includes latitude and longitude

      const handleClick = (index) => {
        setOpenStates(prevStates => {
          const newStates = [...prevStates];
          newStates[index] = !newStates[index];
          return newStates;
        });
      };

      return (
        <div className="weather-boxes-container">
          {forecastData && forecastData.map((day, index) => (
            <div key={index}>
              <div className='weather-box' role="region">
                  {
                    <div className='dayOfWeek'>{day.dayOfWeek}
                      <div className= 'date'>{day.date}</div>             
                    </div>           
                  }

            <div className='weatherIcon'>{day.weatherCode}</div>

            {            
            <div className='tempFormatting'>
              <div className='minTemp' units='°'>{day.temperature_min}°</div>
              <div>/</div>
              <div className='maxTemp' units='°'>{day.temperature_max}°</div>
            </div>
            }

            
              <div className='openButton'>
                <button onClick={()=> handleClick(index)} aria-expanded={openStates[index]}>
                    {openStates[index] ? 
                    (<FaChevronUp className="transition-transform duration-300" size={50}/>):
                    (<FaChevronDown className="transition-transform duration-300" size={50}/>)
                    }
                </button>
              </div>
            </div>
            
            {openStates[index] && (
              <div className="expanded-content">
                <WeatherBoxExtended latitude={latitude} longitude={longitude} day={day}/>
              </div>
            )}
          </div>
        ))}
      </div>
    );
    
      
  }

export default WeatherBox;


    
