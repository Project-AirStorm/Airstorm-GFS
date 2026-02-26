import React, { useState, useEffect } from 'react'; // Added useEffect
import './WeatherBoxExtended.css';
import HourCard from './HourCard/HourCard.js';

const WeatherBoxExtended = ({ day, latitude, longitude }) => {
    const [userLocation, setUserLocation] = useState({ latitude, longitude });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // No need for defaultLocation here as coords are passed down

    useEffect(() => {
        if (latitude && longitude) {
            setUserLocation({ latitude, longitude });
            setLoading(false);
        } else {
            // Handle missing coords if necessary, though parent should ensure they exist
            setError('Missing coordinates for detailed view.');
            setLoading(false);
        }
    }, [latitude, longitude]);

    if (loading) { return <div>Loading details...</div>; }
    if (error) { return <div>{error}</div>; }

    // *** Use day.originalDateStr for a more unique key if available ***
    // Otherwise, fallback to day.date (numeric day)
    const dateKey = day.originalDateStr ? new Date(day.originalDateStr).toISOString().split('T')[0] : day.date;

    return (
        <div className='WeatherBoxExtended'>
            <h3>Hourly Forecast {day.dayOfWeek}, {day.date}</h3>
            {userLocation && (
                <HourCard
                    // Use a potentially more unique key combining location and the full date
                    key={`${userLocation.latitude}-${userLocation.longitude}-${dateKey}`}
                    latitude={userLocation.latitude}
                    longitude={userLocation.longitude}
                    // Pass the date string expected by HourCard (might need adjustment)
                    // Assuming HourCard needs YYYY-MM-DD or similar from originalDateStr
                    date={dateKey}
                />
            )}
        </div>
    );
};
export default WeatherBoxExtended;