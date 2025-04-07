import React from 'react';
import { useState } from 'react';
import './WeatherBoxExtended.css';
import HourCard from './HourCard/HourCard.js';

const WeatherBoxExtended = ({day}) =>{
    const [userLocation, setUserLocation] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const defaultLocation = {
        latitude: 32.385219,
        longitude: -93.762035
        };

        React.useEffect(() => {
          if ('geolocation' in navigator) {
            const options = {
              timeout: 10000, // 10 seconds timeout
            };
            navigator.geolocation.getCurrentPosition(
              async (position) => {
                const { latitude, longitude } = position.coords;
                setUserLocation({ latitude, longitude });
                setLoading(false);
              },
              
              (error) => {
                setError('Unable to retrieve your location');
                console.error('Error retrieving location:', error);
                setLoading(false);
                setUserLocation(defaultLocation);
              },
              options // Pass the timeout options
            );
              }
              else{
                console.error('Geolocation is not supported by your browser');
                setError('Geolocation is not supported by your browser');
                setLoading(false);
                setUserLocation(defaultLocation);
    
            }
    
          }, [] // Empty dependency array to run only once on mount
        );
        if (loading) {
            return <div>Loading...</div>;
          }
        
          if (error) {
            return <div>{error}</div>;
          } 

    return (
        <div className='WeatherBoxExtended'>
            <h3>Detailed forecast for {day.dayOfWeek}, {day.date}</h3>
            {/* You can add HourCard components here when they're ready */}
            {userLocation && (<HourCard 
                key={`${userLocation.latitude}-${userLocation.longitude}-${day.date}`}
                latitude={userLocation.latitude}
                longitude={userLocation.longitude}
                date={day.date}
                />
            )}
        </div>
    );


};
export default WeatherBoxExtended;