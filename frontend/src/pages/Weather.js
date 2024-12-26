import React, { useRef, useEffect, useState } from 'react';
import {
  IoThermometerOutline,
  IoChevronForward,
  IoChevronBack,
} from 'react-icons/io5';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import './map.css';

const Weather = () => {
  const mapContainer = useRef(null);
  const map = useRef(null);
  const marker = useRef(null);
  const [weatherData, setWeatherData] = useState(null);
  const [isCollapsed, setIsCollapsed] = useState(false);

  useEffect(() => {
    if (!mapContainer.current) return;

    // Initialize the map
    map.current = new maplibregl.Map({
      container: mapContainer.current,
      style: `https://api.maptiler.com/maps/6fc667a0-09bd-4b69-bd77-1ce5af52e91b/style.json?key=${process.env.REACT_APP_MAPTILER_API_KEY}`,
      center: [-94.68554, 37.51718],
      zoom: 3.5,
    });

    // Create a marker (initially hidden)
    marker.current = new maplibregl.Marker({
      color: '#FF0000',
    });

    // Add click handler
    map.current.on('click', handleMapClick);

    // Cleanup
    return () => {
      if (map.current) {
        map.current.remove();
      }
    };
  }, []);

  const handleMapClick = async (e) => {
    const { lng, lat } = e.lngLat;

    // Update marker position
    marker.current.setLngLat([lng, lat]).addTo(map.current);

    try {
      const response = await fetch(
        `http://localhost:5001/api/weather?lat=${lat}&lon=${lng}`
      );
      const data = await response.json();

      // Transform data for the chart
      const chartData = data.times.map((time, index) => ({
        time,
        temperature: data.temperatures[index],
      }));

      setWeatherData({
        ...data,
        chartData,
      });
    } catch (error) {
      console.error('Error fetching weather data:', error);
    }
  };

  return (
    <div className="h-screen w-screen relative">
      <div ref={mapContainer} className="h-full w-full" />

      {/* Collapsible Sidebar */}
      <div
        className={`absolute bottom-8 right-0 transition-transform duration-300 ${
          isCollapsed ? 'translate-x-full' : 'translate-x-0'
        }`}
      >
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="absolute left-0 top-1/2 -translate-x-full -translate-y-1/2 bg-white p-2 rounded-l-lg shadow-lg"
        >
          {isCollapsed ? <IoChevronBack /> : <IoChevronForward />}
        </button>

        <div className="bg-white rounded-l-lg shadow-lg p-4 w-96">
          <h2 className="text-xl font-semibold mb-4">Weather Information</h2>
          {weatherData ? (
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-4">
                <IoThermometerOutline className="text-red-500 text-xl" />
                <span>
                  Current Temperature: {weatherData.current_temperature}°F
                </span>
              </div>
              <div className="text-sm text-gray-600 mb-2">
                {weatherData.latitude.toFixed(2)}°N,{' '}
                {weatherData.longitude.toFixed(2)}°E
                <br />
                {weatherData.elevation}m above sea level
              </div>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={weatherData.chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="time"
                      tick={{ fontSize: 12 }}
                      interval={2}
                    />
                    <YAxis domain={['auto', 'auto']} tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Line
                      type="monotone"
                      dataKey="temperature"
                      stroke="#3b82f6"
                      dot={{ r: 1 }}
                      name="Temperature °F"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          ) : (
            <p className="text-gray-500">
              Click on the map to see weather data
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default Weather;
