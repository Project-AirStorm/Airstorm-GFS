import React, { useRef, useEffect, useState } from 'react';
import {
  IoThermometerOutline,
  IoChevronForward,
  IoChevronBack,
  IoBookmarkOutline,
  IoBookmark,
  IoAdd,
  IoRemove,
  IoLocation,
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
import axios from 'axios';

const Weather = () => {
  const mapContainer = useRef(null);
  const map = useRef(null);
  const marker = useRef(null);
  const [weatherData, setWeatherData] = useState(null);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isLocationPanelCollapsed, setIsLocationPanelCollapsed] =
    useState(true);
  const [locationName, setLocationName] = useState('');
  const [isFavorite, setIsFavorite] = useState(false);
  const [savedLocations, setSavedLocations] = useState([]);
  const [coordinates, setCoordinates] = useState({ lat: '', lng: '' });
  const USER_ID = 'JoshuaFrancis';

  useEffect(() => {
    if (!mapContainer.current) return;

    map.current = new maplibregl.Map({
      container: mapContainer.current,
      style: `https://api.maptiler.com/maps/6fc667a0-09bd-4b69-bd77-1ce5af52e91b/style.json?key=${process.env.REACT_MAPTILER_API_KEY}`,
      center: [-94.68554, 37.51718],
      zoom: 3.7,
      terrain: true,
      terrainControl: true,
    });

    marker.current = new maplibregl.Marker({
      color: '#FF0000',
    });

    map.current.on('click', handleMapClick);
    loadSavedLocations();

    return () => {
      if (map.current) {
        map.current.remove();
      }
    };
  }, []);

  const loadSavedLocations = async () => {
    try {
      const response = await axios.get(
        `http://localhost:5001/api/locations?userId=${USER_ID}`
      );
      setSavedLocations(response.data);
      response.data.forEach((loc) => {
        const markerElement = new maplibregl.Marker({
          color: loc.isFavorite ? '#FFD700' : '#4A90E2',
        })
          .setLngLat([loc.longitude, loc.latitude])
          .addTo(map.current);

        markerElement.getElement().addEventListener('mouseenter', () => {
          const popup = new maplibregl.Popup({ closeButton: false })
            .setLngLat([loc.longitude, loc.latitude])
            .setHTML(
              `<div class="p-2"><strong>${
                loc.name
              }</strong><br>${loc.latitude.toFixed(
                4
              )}°N, ${loc.longitude.toFixed(4)}°E</div>`
            )
            .addTo(map.current);

          markerElement.getElement().addEventListener('mouseleave', () => {
            popup.remove();
          });
        });
      });
    } catch (error) {
      console.error('Error loading locations:', error);
    }
  };

  const handleMapClick = async (e) => {
    const { lng, lat } = e.lngLat;
    marker.current.setLngLat([lng, lat]).addTo(map.current);
    setCoordinates({ lat: lat.toFixed(4), lng: lng.toFixed(4) });

    try {
      const response = await fetch(
        `http://localhost:5001/api/weather?lat=${lat}&lon=${lng}`
      );
      if (!response.ok) {
        throw new Error('Weather data fetch failed');
      }
      const data = await response.json();

      setWeatherData({
        current_temperature: data.current_temperature,
        latitude: data.latitude,
        longitude: data.longitude,
        elevation: data.elevation,
        chartData: data.times.map((time, index) => ({
          time,
          temperature: data.temperatures[index],
        })),
      });
    } catch (error) {
      console.error('Error fetching weather data:', error);
    }
  };

  const handleDeleteLocation = async (location) => {
    try {
      await axios.delete(`http://localhost:5001/api/locations`, {
        data: {
          userId: USER_ID,
          latitude: location.latitude,
          longitude: location.longitude,
        },
      });
      loadSavedLocations();
    } catch (error) {
      console.error('Error deleting location:', error);
    }
  };

  const handleSaveLocation = async () => {
    if (!locationName) return;

    let lat, lng;
    if (coordinates.lat && coordinates.lng) {
      // Use manually entered coordinates
      lat = parseFloat(coordinates.lat);
      lng = parseFloat(coordinates.lng);
    } else if (marker.current) {
      // Use marker coordinates
      const markerCoords = marker.current.getLngLat();
      lat = markerCoords.lat;
      lng = markerCoords.lng;
    } else {
      return; // No coordinates available
    }

    try {
      await axios.post('http://localhost:5001/api/locations', {
        userId: USER_ID,
        name: locationName,
        latitude: lat,
        longitude: lng,
        isFavorite,
      });

      loadSavedLocations();
      setLocationName('');
      setIsFavorite(false);
      setCoordinates({ lat: '', lng: '' });
      setIsLocationPanelCollapsed(true);
    } catch (error) {
      console.error('Error saving location:', error);
    }
  };

  const handleCoordinateInput = (e, type) => {
    const value = e.target.value;
    // Allow only numbers, decimal point, and minus sign
    if (/^-?\d*\.?\d*$/.test(value)) {
      setCoordinates((prev) => ({
        ...prev,
        [type]: value,
      }));
    }
  };

  return (
    <div className="h-screen w-screen relative">
      <div ref={mapContainer} className="h-full w-full" />

      {/* Location Save Panel */}
      <div
        className={`absolute top-8 right-0 transition-transform duration-300 ${
          isLocationPanelCollapsed ? 'translate-x-full' : 'translate-x-0'
        }`}
      >
        <button
          onClick={() => setIsLocationPanelCollapsed(!isLocationPanelCollapsed)}
          className="absolute left-0 top-0 -translate-x-full bg-white p-2 rounded-l-lg shadow-lg"
        >
          {isLocationPanelCollapsed ? <IoAdd /> : <IoChevronForward />}
        </button>

        <div className="bg-white rounded-l-lg shadow-lg p-4 w-72">
          <h2 className="text-xl font-semibold mb-4">Save Location</h2>
          <div className="space-y-4">
            <input
              type="text"
              value={locationName}
              onChange={(e) => setLocationName(e.target.value)}
              placeholder="Enter location name"
              className="w-full px-3 py-2 border rounded"
            />

            {/* Coordinate inputs */}
            <div className="space-y-2">
              <input
                type="text"
                value={coordinates.lat}
                onChange={(e) => handleCoordinateInput(e, 'lat')}
                placeholder="Latitude"
                className="w-full px-3 py-2 border rounded"
              />
              <input
                type="text"
                value={coordinates.lng}
                onChange={(e) => handleCoordinateInput(e, 'lng')}
                placeholder="Longitude"
                className="w-full px-3 py-2 border rounded"
              />
            </div>

            <button
              onClick={() => setIsFavorite(!isFavorite)}
              className="flex items-center gap-2 text-gray-700 hover:text-yellow-500"
            >
              {isFavorite ? (
                <IoBookmark className="text-yellow-500" />
              ) : (
                <IoBookmarkOutline />
              )}
              {isFavorite ? 'Favorited' : 'Add to Favorites'}
            </button>
            <button
              onClick={handleSaveLocation}
              disabled={!locationName}
              className="w-full bg-blue-500 text-white px-4 py-2 rounded disabled:opacity-50"
            >
              Save Location
            </button>

            {/* All Saved Locations List */}
            <div className="mt-6">
              <h3 className="text-lg font-semibold mb-2">Saved Locations</h3>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {savedLocations.map((location) => (
                  <div
                    key={`${location.latitude}-${location.longitude}`}
                    className="flex items-center justify-between p-2 hover:bg-gray-100 rounded group"
                  >
                    <div className="flex items-center gap-2">
                      {location.isFavorite ? (
                        <IoBookmark className="text-yellow-500" />
                      ) : (
                        <IoLocation className="text-blue-500" />
                      )}
                      <span>{location.name}</span>
                    </div>
                    <button
                      onClick={() => handleDeleteLocation(location)}
                      className="opacity-0 group-hover:opacity-100 text-red-500 hover:text-red-700 transition-opacity"
                    >
                      <IoRemove />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Weather Sidebar - unchanged */}
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
