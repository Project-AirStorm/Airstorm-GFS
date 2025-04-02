import React from 'react';
import { useState } from 'react';

const WeatherBox = ({
    latitude,
    longitude,
    date
}) =>
  { 
  const[hourlyForecastData, setHourlyForecastData] = React.useState(null);
  const [error, setError] = React.useState(null);

  React.useState(() => {
    const fetchWeatherData = async () =>{
        try{
            const response = await axios.get(`https://customer-api.open-meteo.com/v1/forecast?apikey=${process.env.REACT_APP_OPENMETEO_API_KEY}`,
                {
                    params:{
                        latitude,
                        longitude,
                        date,
                    hourly: [
                        'temperture',
                        'relative_humidity',
                        'precipatition_probability',
                        'weather_code',
                        'surface_pressure',
                        'visibility'
                    ],
                    temperature_unit: 'fahrenheit',
                    forecast_days: 1,
                    timezone: 'auto',
                    models: 'best_match'
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

            const houlyData = response.data.daily.time.map((time, index) => ({
                time: new Date(time).toLocaleDateString('en-US', {
                  hour: 'numeric'
                }),
                temperature: Math.round(response.data.hourly.temperature[index]),
                relative_humidity: Math.round(response.data.hourly.relative_humidity[index]),
                precipatation_probability: Math.round(response.data.hourly.precipatation_probability[index]),
                surface_pressure: Math.round(response.data.hourly.surface_pressure[index]),
                visibility: Math.round(response.data.hourly.visibility[index]),
                weatherCode: calculateIcon(response.data.hourly.weather_code[index]),
              }))
    
              
                setForecastData(houlyData);
        }
        catch{(err)
            setError('Failed to fetch weather data');
        }
    };
    fetchWeatherData();

  }, [latitude, longitude]);

  return(
    <div className='hourCardHolder'>
        {hourlyForecastData && hourlyForecastData.map((time, index) => (
            <div className='hour-card' key={index} role="region">
                <div className='hour-icon'>{time.weatherCode}</div>
                <div className='hour'>{time.time}</div>
            </div>
        ))};
    </div>
  )
}
