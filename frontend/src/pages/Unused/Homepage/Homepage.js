import React, { useEffect, useState } from 'react';
import { UserSession } from '../../../utils/UserSession';
import axios from 'axios';
import WeatherDashboard from '../components/WeatherDashboard';
import GraphCastForecast from '../components/GraphCastForecast';

const REACT_APP_API_URL = process.env.REACT_APP_API_URL;

const Homepage = () => {
  const { user } = UserSession(); // Current user session
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchLocations = async () => {
    try {
      const response = await axios.get(
        `${REACT_APP_API_URL}/api/locations?userId=${user.id}`
      );
      const locationData = response.data;

      const locationsWithWeather = await Promise.all(
        locationData.map(async (location) => {
          if (location.isFavorite) {
            try {
              const weatherResponse = await axios.get(
                `${REACT_APP_API_URL}/api/weather?lat=${location.latitude}&lon=${location.longitude}`
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
    const interval = setInterval(fetchLocations, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const handleToggleFavorite = async (location) => {
    try {
      await axios.post(`${REACT_APP_API_URL}/api/locations/favorite`, {
        userId: user.id,
        latitude: location.latitude,
        longitude: location.longitude,
      });
      fetchLocations();
    } catch (error) {
      console.error('Error toggling favorite:', error);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-gray-900 via-purple-800 to-gray-800 text-white">
      <main className="flex-grow container mx-auto px-4 py-12">
        <div className="space-y-8">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-purple-300 mb-4">
              Welcome to Airstorm GFS
            </h1>
            <p className="text-lg text-purple-200">
              Your Advanced Weather Forecasting Platform
            </p>
          </div>

          <GraphCastForecast />

          <div className="mt-12">
            <h2 className="text-2xl font-bold text-purple-300 mb-6 text-center">
              Your Favorite Locations
            </h2>
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
        </div>
      </main>
    </div>
  );
};

export default Homepage;
