import React, { useEffect, useState } from 'react';
import axios from 'axios';
import WeatherDashboard from '../components/WeatherDashboard';

const Homepage = () => {
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchLocations = async () => {
    try {
      // Get locations
      const userId = process.env.REACT_APP_USER_ID || 'JoshuaFrancis';
      const response = await axios.get(
        `http://localhost:5001/api/locations?userId=${userId}`
      );
      const locationData = response.data;

      // Fetch weather for each favorite location
      const locationsWithWeather = await Promise.all(
        locationData.map(async (location) => {
          if (location.isFavorite) {
            try {
              const weatherResponse = await axios.get(
                `http://localhost:5001/api/weather?lat=${location.latitude}&lon=${location.longitude}`
              );
              return { ...location, weather: weatherResponse.data };
            } catch (error) {
              console.error(
                `Error fetching weather for ${location.name}:`,
                error
              );
              return location;
            }
          }
          return location;
        })
      );

      setLocations(locationsWithWeather);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching locations:', error);
      setError('Failed to load locations');
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLocations();

    // Refresh weather data every 5 minutes
    const interval = setInterval(fetchLocations, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const handleToggleFavorite = async (location) => {
    try {
      const userId = process.env.REACT_APP_USER_ID || 'JoshuaFrancis';
      await axios.post('http://localhost:5001/api/locations/favorite', {
        userId,
        latitude: location.latitude,
        longitude: location.longitude,
      });

      // Refresh locations after toggling favorite
      fetchLocations();
    } catch (error) {
      console.error('Error toggling favorite:', error);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-gray-900 via-purple-800 to-gray-800 text-white">
      <main className="flex-grow container mx-auto px-4 py-12">
        <div className="space-y-8">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-purple-300 mb-4">
              Welcome to Airstorm GFS
            </h1>
            <p className="text-lg text-purple-200 mb-8">
              Your Favorite Locations Weather Dashboard
            </p>
          </div>

          {loading ? (
            <div className="text-center text-purple-200">
              <div className="animate-pulse">Loading weather data...</div>
            </div>
          ) : error ? (
            <div className="text-center text-red-400">{error}</div>
          ) : (
            <WeatherDashboard
              locations={locations}
              onToggleFavorite={handleToggleFavorite}
            />
          )}
        </div>
      </main>
    </div>
  );
};

export default Homepage;
