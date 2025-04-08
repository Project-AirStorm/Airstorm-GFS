import React from 'react';
import { useState } from 'react';
import './WeatherBoxExtended.css';
import HourCard from './HourCard/HourCard.js';

const WeatherBoxExtended = ({day, latitude, longitude}) =>{
    const [userLocation, setUserLocation] = useState({latitude, longitude});
    const [loading, setLoading] = useState(false); // Changed to false since we already have location
    const [error, setError] = useState(null);

    const defaultLocation = {
        latitude: 32.385219,
        longitude: -93.762035
    };

    // Since we're already receiving latitude and longitude as props, 
    // we don't need to get location again. We'll use the provided coords.
    React.useEffect(() => {
        // Update userLocation if props change
        if (latitude && longitude) {
            setUserLocation({ latitude, longitude });
            setLoading(false);
        } else {
            setUserLocation(defaultLocation);
            setError('Using default location. No coordinates provided.');
            setLoading(false);
        }
    }, [latitude, longitude]); // Depend on latitude and longitude props

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
            {userLocation && (
                <HourCard 
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