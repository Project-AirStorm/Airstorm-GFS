import React, { useRef, useEffect, useState } from 'react';
import { UserSession } from '../../../utils/UserSession';

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
import axios from 'axios';
import './map.css';
import WeatherGraph from '../../../components/specific/WeatherGraph/WeatherGraph';
import TimelineSlider from '../../../components/specific/TimelineSlider/TimelineSlider';

const REACT_APP_API_URL = process.env.REACT_APP_API_URL;

const units = {
  temperature: '°C',
  feels_like_temperature: '°C',
  clouds: '%',
  precipitation: 'mm/h',
  wind_speed: 'm/s',
  wind_gust: 'm/s',
  pressure: 'hPa',
  humidity: '%',
  wave_height: 'm',
  wave_period: 's',
  air_quality: 'Index',
  ozone_surface: 'µg/m³',
  ozone_total: 'Dobson',
  no2: 'µg/m³',
  'pm2.5': 'µg/m³',
};

const Weather = () => {

  const { user } = UserSession(); // User session
  const mapContainer = useRef(null);
  const mapRef = useRef(null);
  const markerRef = useRef(null);
  const [weatherData, setWeatherData] = useState(null);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isLocationPanelCollapsed, setIsLocationPanelCollapsed] =
    useState(true);
  const [locationName, setLocationName] = useState('');
  const [isFavorite, setIsFavorite] = useState(false);
  const [savedLocations, setSavedLocations] = useState([]);
  const [coordinates, setCoordinates] = useState({ lat: '', lng: '' });
  const [savedMarkers, setSavedMarkers] = useState([]);
  const [selectedVariable, setSelectedVariable] = useState('temperature');
  const [timeOffset, setTimeOffset] = useState('now'); // Start at current time

  const weatherVariables = [
    { value: 'temperature', label: 'Temperature' },
    { value: 'feels_like_temperature', label: 'Feels Like' },
    { value: 'clouds', label: 'Cloud Cover' },
    { value: 'precipitation', label: 'Precipitation' },
    { value: 'wind_speed', label: 'Wind Speed' },
    { value: 'wind_gust', label: 'Wind Gust' },
    { value: 'pressure', label: 'Pressure' },
    { value: 'humidity', label: 'Humidity' },
    { value: 'wave_height', label: 'Wave Height' },
    { value: 'wave_period', label: 'Wave Period' },
    { value: 'air_quality', label: 'Air Quality' },
    { value: 'ozone_surface', label: 'Surface Ozone' },
    { value: 'ozone_total', label: 'Total Ozone' },
    { value: 'no2', label: 'NO₂' },
    { value: 'pm2.5', label: 'PM₂.₅' },
  ];

  // Load saved locations
  const loadSavedLocations = async () => {
    try {
      
      if (!user?.id) return; 
      const response = await axios.get(
        `${REACT_APP_API_URL}/api/locations?userId=${user.id}`
      );
      const locations = response.data.map((loc) => ({
        ...loc,
        latitude: parseFloat(loc.latitude),
        longitude: parseFloat(loc.longitude),
      }));
      setSavedLocations(locations);
    } catch (error) {
      console.error('Error loading locations:', error);
    }
  };

  // Handle saved location markers
  useEffect(() => {
    if (mapRef.current && savedLocations.length > 0) {
      savedMarkers.forEach((marker) => marker.setMap(null));

      const newMarkers = savedLocations.map((location) => {
        const marker = new window.google.maps.Marker({
          position: { lat: location.latitude, lng: location.longitude },
          map: mapRef.current,
          icon: {
            path: window.google.maps.SymbolPath.CIRCLE,
            fillColor: location.isFavorite ? '#FFD700' : '#4A90E2',
            fillOpacity: 0.9,
            strokeWeight: 0,
            scale: 8,
          },
        });

        let infoWindow = null;
        marker.addListener('mouseover', () => {
          infoWindow = new window.google.maps.InfoWindow({
            content: `
              <div class="info-window-content">
                <div class="info-window-title">${location.name}</div>
                <div class="info-window-coords">
                  ${location.latitude.toFixed(4)}°N<br>
                  ${location.longitude.toFixed(4)}°E
                </div>
              </div>
            `,
          });
          infoWindow.open(mapRef.current, marker);
        });

        marker.addListener('mouseout', () => {
          if (infoWindow) infoWindow.close();
        });

        return marker;
      });

      setSavedMarkers(newMarkers);
    }
  }, [savedLocations, mapRef.current]);

  // Cleanup markers
  useEffect(() => {
    return () => {
      savedMarkers.forEach((marker) => marker.setMap(null));
    };
  }, [savedMarkers]);

  const handleCoordinateInput = (e, type) => {
    const value = e.target.value;
    if (/^-?\d*\.?\d*$/.test(value)) {
      setCoordinates((prev) => ({
        ...prev,
        [type]: value,
      }));
    }
  };

  const handleSaveLocation = async () => {
    if (!locationName) return;

    let lat, lng;
    if (coordinates.lat && coordinates.lng) {
      lat = parseFloat(coordinates.lat);
      lng = parseFloat(coordinates.lng);
    } else if (markerRef.current?.getPosition()) {
      const position = markerRef.current.getPosition();
      lat = position.lat();
      lng = position.lng();
    } else {
      return;
    }

    try {
      await axios.post(`${REACT_APP_API_URL}/api/locations`, {
        userId: user.id,
        name: locationName,
        latitude: lat,
        longitude: lng,
        isFavorite,
      });

      await loadSavedLocations();
      setLocationName('');
      setIsFavorite(false);
      setCoordinates({ lat: '', lng: '' });
      setIsLocationPanelCollapsed(true);
    } catch (error) {
      console.error('Error saving location:', error);
    }
  };

  const handleDeleteLocation = async (location) => {
    try {
      await axios.delete(`${REACT_APP_API_URL}/api/locations`, {
        data: {
          userId: user.id,
          latitude: location.latitude,
          longitude: location.longitude,
        },
      });
      await loadSavedLocations();
    } catch (error) {
      console.error('Error deleting location:', error);
    }
  };

  useEffect(() => {
    const loadGoogleMaps = async () => {
      try {
        const response = await axios.get(
          `${REACT_APP_API_URL}/api/google-maps-init`
        );
        const { googleMapsKey } = response.data;

        const script = document.createElement('script');
        script.src = `https://maps.googleapis.com/maps/api/js?key=${googleMapsKey}&callback=initMap&v=weekly`;
        script.async = true;
        script.defer = true;
        document.head.appendChild(script);

        window.initMap = () => {
          const mapInstance = new window.google.maps.Map(mapContainer.current, {
            center: { lat: 51.5, lng: 0 },
            zoom: 6,
          });

          markerRef.current = new window.google.maps.Marker({
            map: mapInstance,
            position: null,
            icon: {
              path: window.google.maps.SymbolPath.CIRCLE,
              fillColor: '#FF0000',
              fillOpacity: 1,
              strokeWeight: 0,
              scale: 8,
            },
            visible: false,
          });

          const meteosourceOverlay = new window.google.maps.ImageMapType({
            getTileUrl: (coord, zoom) => {
              const timeParam = timeOffset === 'now' ? 'now' : timeOffset;
              return `${REACT_APP_API_URL}/api/meteosource/tile?x=${coord.x}&y=${coord.y}&zoom=${zoom}&variable=${selectedVariable}&datetime=${timeParam}`;
            },
            tileSize: new window.google.maps.Size(256, 256),
            name: 'Weather Data',
          });

          mapInstance.overlayMapTypes.push(meteosourceOverlay);
          mapRef.current = mapInstance;
          mapInstance.addListener('click', handleMapClick);
        };

        loadSavedLocations();
      } catch (error) {
        console.error('Error initializing map:', error);
      }
    };

    if (!window.google?.maps) {
      loadGoogleMaps();
    }

    return () => {
      if (markerRef.current) markerRef.current.setMap(null);
      if (window.google?.maps && mapRef.current) {
        window.google.maps.event.clearInstanceListeners(mapRef.current);
      }
    };
  }, []);

  // Update map overlay when variable or time changes
  useEffect(() => {
    if (mapRef.current) {
      mapRef.current.overlayMapTypes.clear();

      const meteosourceOverlay = new window.google.maps.ImageMapType({
        getTileUrl: (coord, zoom) => {
          const timeParam = timeOffset === 'now' ? 'now' : timeOffset;
          return `${REACT_APP_API_URL}/api/meteosource/tile?x=${coord.x}&y=${coord.y}&zoom=${zoom}&variable=${selectedVariable}&datetime=${timeParam}`;
        },
        tileSize: new window.google.maps.Size(256, 256),
        name: 'Weather Data',
      });

      mapRef.current.overlayMapTypes.push(meteosourceOverlay);
    }
  }, [selectedVariable, timeOffset]);

  const handleMapClick = async (e) => {
    if (!markerRef.current) return;

    const lat = e.latLng.lat();
    const lng = e.latLng.lng();

    markerRef.current.setPosition(e.latLng);
    markerRef.current.setVisible(true);
    setCoordinates({ lat: lat.toFixed(4), lng: lng.toFixed(4) });

    try {
      const response = await axios.get(`${REACT_APP_API_URL}/api/weather`, {
        params: { lat, lon: lng },
      });

      setWeatherData({
        current_temperature: response.data.current_temperature,
        latitude: response.data.latitude,
        longitude: response.data.longitude,
        elevation: response.data.elevation,
        chartData: response.data.times.map((time, index) => ({
          time,
          temperature: response.data.temperatures[index],
        })),
      });
    } catch (error) {
      console.error('Error fetching weather data:', error);
    }
  };

  const handleTimeChange = (offset) => {
    // If offset is 'now', set timeOffset to 'now'; otherwise, use the offset
    setTimeOffset(offset === 'now' ? 'now' : offset);
  };

  return (
    <div className="h-screen w-screen relative">
      {/* Variable Selection Dropdown */}
      <div className="map-controls">
        <select
          value={selectedVariable}
          onChange={(e) => setSelectedVariable(e.target.value)}
          className="map-type-selector"
        >
          {weatherVariables.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label} ({units[option.value]})
            </option>
          ))}
        </select>
      </div>

      <div ref={mapContainer} className="h-full w-full" id="map" />

      {/* Location Save Panel */}
      <div
        className={`absolute top-8 right-0 transition-transform duration-300 location-panel ${
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

            <div className="mt-6">
              <h3 className="text-lg font-semibold mb-2">Saved Locations</h3>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {savedLocations.map((location) => (
                  <div
                    key={`${location.latitude}-${location.longitude}`}
                    className="saved-location-item flex items-center justify-between p-2 rounded group transition-all"
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

      {/* Weather Sidebar */}
      <div
        className={`absolute bottom-8 right-0 transition-transform duration-300 weather-panel ${
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

      {/* Weather Graph Container */}
      <div className="weather-graph-container">
        <WeatherGraph weatherType={selectedVariable} />
      </div>

      {/* Timeline Slider */}
      <TimelineSlider onTimeChange={handleTimeChange} />
    </div>
  );
};

export default Weather;
