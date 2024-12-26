import React, { useRef, useEffect, useState } from 'react';
import './map.css';
import {
  IoThermometerOutline,
  IoChevronForward,
  IoChevronBack,
} from 'react-icons/io5';

const Weather = () => {
  const mapContainer = useRef(null);
  const [weatherData, setWeatherData] = useState(null);
  const [isCollapsed, setIsCollapsed] = useState(false);

  useEffect(() => {
    const container = mapContainer.current;
    const iframe = document.createElement('iframe');
    iframe.width = '100%';
    iframe.height = '100%';
    iframe.style.border = 'none';
    iframe.src = `https://api.maptiler.com/maps/6fc667a0-09bd-4b69-bd77-1ce5af52e91b/?key=${process.env.REACT_APP_MAPTILER_API_KEY}#3.5/37.51718/-94.68554`;

    if (container) {
      container.appendChild(iframe);

      // Add message listener for iframe clicks
      window.addEventListener('message', handleMapClick);
    }

    return () => {
      if (container) {
        container.innerHTML = '';
        window.removeEventListener('message', handleMapClick);
      }
    };
  }, []);

  const handleMapClick = async (event) => {
    if (event.data.type === 'click') {
      const { lat, lng } = event.data;
      try {
        const response = await fetch(
          `http://localhost:5001/api/weather?lat=${lat}&lon=${lng}`
        );
        const data = await response.json();
        setWeatherData(data);
      } catch (error) {
        console.error('Error fetching weather data:', error);
      }
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

        <div className="bg-white rounded-l-lg shadow-lg p-4 w-64">
          <h2 className="text-xl font-semibold mb-4">Weather Information</h2>
          {weatherData ? (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <IoThermometerOutline className="text-red-500 text-xl" />
                <span>Temperature: {weatherData.temperature}°C</span>
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
