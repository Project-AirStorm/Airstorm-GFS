import React, { useRef, useEffect, useState } from 'react';
import * as maptilersdk from '@maptiler/sdk';
import '@maptiler/sdk/dist/maptiler-sdk.css';
import {
  IoLocationOutline,
  IoThermometerOutline,
  IoWaterOutline,
  IoSpeedometerOutline,
  IoSunnyOutline,
  IoMoonOutline,
} from 'react-icons/io5';

const Weather = () => {
  const mapContainer = useRef(null);
  const map = useRef(null);
  const marker = useRef(null);
  const [weatherData, setWeatherData] = useState(null);
  const [selectedLocation, setSelectedLocation] = useState({
    lng: -93.5204,
    lat: 32.5343,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  maptilersdk.config.apiKey = process.env.REACT_APP_MAPTILER_API_KEY;

  useEffect(() => {
    if (map.current) return;

    map.current = new maptilersdk.Map({
      container: mapContainer.current,
      style: maptilersdk.MapStyle.STREETS,
      center: [selectedLocation.lng, selectedLocation.lat],
      zoom: 15,
    });

    marker.current = new maptilersdk.Marker({ color: '#FF0000' })
      .setLngLat([selectedLocation.lng, selectedLocation.lat])
      .addTo(map.current);

    map.current.on('click', (e) => {
      const { lng, lat } = e.lngLat;
      setSelectedLocation({ lng, lat });
      marker.current.setLngLat([lng, lat]);
      fetchWeatherData(lng, lat);
    });
  }, [selectedLocation.lng, selectedLocation.lat]);

  const fetchWeatherData = async (lng, lat) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(
        `http://localhost:5001/api/weather?lat=${lat}&lon=${lng}`
      );
      const data = await response.json();
      setWeatherData(data);
    } catch (error) {
      setError('Error fetching weather data: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const WeatherDetails = () => {
    if (loading) {
      return (
        <div className="mt-4 bg-white rounded-lg shadow p-6">
          <div className="animate-pulse flex space-y-4">
            <div className="space-y-3">
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              <div className="h-4 bg-gray-200 rounded w-2/3"></div>
            </div>
          </div>
        </div>
      );
    }

    if (error) {
      return (
        <div className="mt-4 bg-red-50 rounded-lg shadow p-6">
          <p className="text-red-600">{error}</p>
        </div>
      );
    }

    if (!weatherData) return null;

    return (
      <div className="mt-4 bg-white rounded-lg shadow">
        <div className="p-4 border-b">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <IoLocationOutline className="h-5 w-5" />
            <span>
              Weather at {selectedLocation.lng.toFixed(4)}°,{' '}
              {selectedLocation.lat.toFixed(4)}°
            </span>
          </h3>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center gap-2">
              <IoThermometerOutline className="h-5 w-5 text-red-500" />
              <span>Temperature: {weatherData.temperature}°C</span>
            </div>
            <div className="flex items-center gap-2">
              <IoWaterOutline className="h-5 w-5 text-blue-500" />
              <span>Precipitation: {weatherData.precipitation} mm</span>
            </div>
            <div className="flex items-center gap-2">
              <IoSpeedometerOutline className="h-5 w-5 text-gray-500" />
              <span>
                Wind: {weatherData.wind_speed} km/h at{' '}
                {weatherData.wind_direction}°
              </span>
            </div>
            <div className="flex items-center gap-2">
              <IoSunnyOutline className="h-5 w-5 text-yellow-500" />
              <span>
                Sunrise: {new Date(weatherData.sunrise).toLocaleTimeString()}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <IoMoonOutline className="h-5 w-5 text-orange-500" />
              <span>
                Sunset: {new Date(weatherData.sunset).toLocaleTimeString()}
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="h-screen w-screen flex flex-col">
      <div className="flex-1 relative">
        <div ref={mapContainer} className="absolute inset-0" />
      </div>
      <WeatherDetails />
    </div>
  );
};

export default Weather;
