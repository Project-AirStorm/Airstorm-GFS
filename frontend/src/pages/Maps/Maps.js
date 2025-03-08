// Third-party imports
import React, { useState, useCallback, useRef, useEffect } from 'react';
import axios from 'axios';

// Local absolute imports (from src/)
import { UserSession } from '../../utils/UserSession';
import { weatherVariables, units } from '../../config/WeatherConfig.js';
import WeatherMapControls from '../../components/specific/WeatherMap/MapControls/MapControls';
import LocationPanel from '../../components/specific/WeatherMap/LocationPanel/LocationPanel';
import WeatherGraph from '../../components/specific/WeatherGraph/WeatherGraph';
import TimelineSlider from '../../components/specific/TimelineSlider/TimelineSlider';
 
// Relative imports (same directory)
import './Maps.css';

// Constants
const REACT_APP_API_URL = process.env.REACT_APP_API_URL;

const Maps = () => {
  // Refs for map
  const mapContainer = useRef(null);
  const mapRef = useRef(null);
  const markerRef = useRef(null);
  
  const { user } = UserSession();
  
  // State Management
  const [selectedVariable, setSelectedVariable] = useState('temperature');
  const [timeOffset, setTimeOffset] = useState('now');
  const [isLocationPanelCollapsed, setIsLocationPanelCollapsed] = useState(true);
  const [coordinates, setCoordinates] = useState({ lat: '', lng: '' });
  const [locationName, setLocationName] = useState('');
  const [isFavorite, setIsFavorite] = useState(false);
  const [savedLocations, setSavedLocations] = useState([]);
  const [kmlLayers, setKmlLayers] = useState({});

  // API Handlers
  const handleSaveLocation = async () => {
    if (!locationName) return;
    try {
      await axios.post(`${REACT_APP_API_URL}/api/locations`, {
        userId: user.id,
        name: locationName,
        latitude: parseFloat(coordinates.lat),
        longitude: parseFloat(coordinates.lng),
        isFavorite
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

  const loadSavedLocations = useCallback(async () => {
    try {
      if (!user?.id) return;
      const response = await axios.get(
        `${REACT_APP_API_URL}/api/locations?userId=${user.id}`
      );
      setSavedLocations(response.data.map(loc => ({
        ...loc,
        latitude: parseFloat(loc.latitude),
        longitude: parseFloat(loc.longitude)
      })));
    } catch (error) {
      console.error('Error loading locations:', error);
    }
  }, [user?.id]);

  const handleDeleteLocation = async (location) => {
    try {
      await axios.delete(`${REACT_APP_API_URL}/api/locations`, {
        data: {
          userId: user.id,
          latitude: location.latitude,
          longitude: location.longitude
        }
      });
      await loadSavedLocations();
    } catch (error) {
      console.error('Error deleting location:', error);
    }
  };

  // Event Handlers
  const handleCoordinateChange = (type, value) => {
    setCoordinates(prev => ({
      ...prev,
      [type]: value
    }));
  };

  const handleTimeChange = (offset) => {
    setTimeOffset(offset === 'now' ? 'now' : offset);
  };

  // Map click handler
  const handleMapClick = useCallback(async (e) => {
    if (!markerRef.current) return;

    const lat = e.latLng.lat();
    const lng = e.latLng.lng();

    markerRef.current.setPosition(e.latLng);
    markerRef.current.setVisible(true);
    setCoordinates({ lat: lat.toFixed(4), lng: lng.toFixed(4) });

  }, []);

  // Initialize Google Maps
  const loadGoogleMaps = useCallback(async () => {
    try {
      const response = await axios.get(`${REACT_APP_API_URL}/api/google-maps-init`);
      const { googleMapsKey } = response.data;

      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${googleMapsKey}&callback=initMap&v=weekly`;
      script.async = true;
      script.defer = true;
      document.head.appendChild(script);

      window.initMap = () => {
        const mapInstance = new window.google.maps.Map(mapContainer.current, {
          center: { lat: 36, lng: -86 },
          zoom: 4,
          // Configure map type controls (Map/Satellite)
          mapTypeControl: true,
          mapTypeControlOptions: {
            style: window.google.maps.MapTypeControlStyle.HORIZONTAL_BAR,
            position: window.google.maps.ControlPosition.TOP_LEFT
          },
          // Configure fullscreen control
          fullscreenControl: true,
          fullscreenControlOptions: {
            position: window.google.maps.ControlPosition.TOP_RIGHT
          },
          // Other map options
          streetViewControl: false,
          zoomControl: true,
          zoomControlOptions: {
            position: window.google.maps.ControlPosition.RIGHT_BOTTOM
          }
        });

        markerRef.current = new window.google.maps.Marker({
          map: mapInstance,
          position: null,
          icon: {
            path: window.google.maps.SymbolPath.CIRCLE,
            fillColor: '#FF0000',
            fillOpacity: 1,
            strokeWeight: 0,
            scale: 8
          },
          visible: false
        });

        const meteosourceOverlay = new window.google.maps.ImageMapType({
          getTileUrl: (coord, zoom) => {
            const timeParam = timeOffset === 'now' ? 'now' : timeOffset;
            return `${REACT_APP_API_URL}/api/meteosource/tile?x=${coord.x}&y=${coord.y}&zoom=${zoom}&variable=${selectedVariable}&datetime=${timeParam}`;
          },
          tileSize: new window.google.maps.Size(256, 256),
          name: 'Weather Data'
        });

        mapInstance.overlayMapTypes.push(meteosourceOverlay);
        mapRef.current = mapInstance;
        mapInstance.addListener('click', handleMapClick);
      };

      loadSavedLocations();
    } catch (error) {
      console.error('Error initializing map:', error);
    }
  }, [loadSavedLocations, selectedVariable, timeOffset, handleMapClick]);

  // Load Google Maps on component mount
  useEffect(() => {
    if (!window.google?.maps) {
      loadGoogleMaps();
    }

    return () => {
      if (markerRef.current) markerRef.current.setMap(null);
      if (window.google?.maps && mapRef.current) {
        window.google.maps.event.clearInstanceListeners(mapRef.current);
      }
    };
  }, [loadGoogleMaps]);

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
        name: 'Weather Data'
      });

      mapRef.current.overlayMapTypes.push(meteosourceOverlay);
    }
  }, [selectedVariable, timeOffset]);

  return (
    <div className="dashboard-container">
      <div className="main-content">
        <div className="weather-page-container">
          <WeatherMapControls
            selectedVariable={selectedVariable}
            onVariableChange={setSelectedVariable}
            weatherVariables={weatherVariables}
            units={units}
          />

          <div ref={mapContainer} id="map" className="map-container" />

          <LocationPanel
            isCollapsed={isLocationPanelCollapsed}
            onToggleCollapse={() => setIsLocationPanelCollapsed(!isLocationPanelCollapsed)}
            locationName={locationName}
            onLocationNameChange={setLocationName}
            coordinates={coordinates}
            onCoordinateChange={handleCoordinateChange}
            isFavorite={isFavorite}
            onToggleFavorite={() => setIsFavorite(!isFavorite)}
            onSaveLocation={handleSaveLocation}
            savedLocations={savedLocations}
            onDeleteLocation={handleDeleteLocation}
            userId={user?.id}
            mapRef={mapRef}
            kmlLayers={kmlLayers}
            setKmlLayers={setKmlLayers}
          />

          <div className="weather-graph-container">
            <WeatherGraph weatherType={selectedVariable} />
          </div>

          <TimelineSlider onTimeChange={handleTimeChange} />
          <div className="custom-zoom-controls">
        <button 
          className="custom-zoom-button" 
          onClick={() => {
            if (mapRef.current) {
              mapRef.current.setZoom(mapRef.current.getZoom() + 1);
            }
          }}
        >
          +
        </button>
        <button 
          className="custom-zoom-button" 
          onClick={() => {
            if (mapRef.current) {
              mapRef.current.setZoom(mapRef.current.getZoom() - 1);
            }
          }}
        >
          −
        </button>
      </div>
        </div>
      </div>
    </div>
  );
};

export default Maps;