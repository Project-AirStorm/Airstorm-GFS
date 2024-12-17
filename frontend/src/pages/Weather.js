import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

const Weather = () => {
  const mapContainer = useRef(null);
  const map = useRef(null);
  const [mapInitialized, setMapInitialized] = useState(false);
  const [weatherData, setWeatherData] = useState(null);
  const [selectedLocation, setSelectedLocation] = useState({
    lng: 0,
    lat: 0,
  });

  // Initialize MapTiler map
  useEffect(() => {
    // Skip if map is already initialized or container isn't ready
    if (mapInitialized || !mapContainer.current) return;

    // Set the access token for MapTiler
    const apiKey = process.env.REACT_APP_MAPTILER_API_KEY;
    if (!apiKey) {
      console.error('MapTiler API key not found');
      return;
    }

    try {
      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: `https://api.maptiler.com/maps/streets-v2/style.json?key=${apiKey}`,
        center: [0, 0],
        zoom: 2,
      });

      // Add click event to get coordinates
      map.current.on('click', (e) => {
        const { lng, lat } = e.lngLat;
        setSelectedLocation({ lng, lat });
        fetchWeatherData(lng, lat);
      });

      // Mark map as initialized
      setMapInitialized(true);
    } catch (error) {
      console.error('Error initializing map:', error);
    }

    // Clean up on unmount
    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
        setMapInitialized(false);
      }
    };
  }, [mapInitialized]);

  // Fetch weather data from Flask backend
  const fetchWeatherData = async (lng, lat) => {
    try {
      const response = await axios.get(`http://localhost:5001/api/weather`, {
        params: {
          lat: lat,
          lon: lng,
        },
      });

      setWeatherData(response.data);
    } catch (error) {
      console.error('Error fetching weather data:', error);
    }
  };

  // Render weather details
  const renderWeatherDetails = () => {
    if (!weatherData) return null;

    return (
      <div className="absolute top-4 right-4 bg-black bg-opacity-70 p-4 rounded-lg text-white z-10">
        <h2 className="text-xl font-bold mb-2">Weather Details</h2>
        <p>Temperature: {weatherData.temperature}°C</p>
        <p>Precipitation: {weatherData.precipitation} mm</p>
        <p>Wind Speed: {weatherData.wind_speed} km/h</p>
        <p>Wind Direction: {weatherData.wind_direction}°</p>
        <p>Sunrise: {weatherData.sunrise}</p>
        <p>Sunset: {weatherData.sunset}</p>
        <p className="mt-2 text-sm">
          Location: {selectedLocation.lng.toFixed(4)},{' '}
          {selectedLocation.lat.toFixed(4)}
        </p>
      </div>
    );
  };

  return (
    <div className="relative flex flex-col min-h-screen bg-gradient-to-br from-gray-900 via-purple-800 to-gray-800 text-white">
      <div
        ref={mapContainer}
        className="absolute top-0 left-0 right-0 bottom-0"
        style={{ height: '100vh' }}
      />
      {renderWeatherDetails()}
      <div className="absolute bottom-4 left-4 bg-black bg-opacity-70 p-4 rounded-lg text-white z-10">
        <h1 className="text-2xl font-bold">Airstorm Weather Map</h1>
        <p>Click on the map to get weather information for that location</p>
      </div>
    </div>
  );
};

export default Weather;
