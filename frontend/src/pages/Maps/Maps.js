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
  const weatherControlsRef = useRef(null);
  const locationPanelRef = useRef(null);
  const timelineSliderRef = useRef(null);
  const weatherGraphRef = useRef(null);
  const zoomControlsRef = useRef(null);
  
  const { user } = UserSession();
  
  // State Management
  const [selectedVariable, setSelectedVariable] = useState('none');
  const [timeOffset, setTimeOffset] = useState('now');
  const [isLocationPanelCollapsed, setIsLocationPanelCollapsed] = useState(true);
  const [coordinates, setCoordinates] = useState({ lat: '', lng: '' });
  const [locationName, setLocationName] = useState('');
  const [isFavorite, setIsFavorite] = useState(false);
  const [savedLocations, setSavedLocations] = useState([]);
  const [kmlLayers, setKmlLayers] = useState({});
  const [mapInitialized, setMapInitialized] = useState(false);
  const [locationMarkers, setLocationMarkers] = useState([]);

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
  
  // Map right-click handler for context menu
  const handleMapRightClick = useCallback((e) => {
    if (!mapRef.current) return;
    
    const lat = e.latLng.lat();
    const lng = e.latLng.lng();
    
    // Create context menu div
    const contextMenu = document.createElement('div');
    contextMenu.className = 'map-context-menu';
    contextMenu.innerHTML = `
      <div class="context-menu-title">Point-Based Products</div>
      <div class="context-menu-item" id="generate-skewt">Generate SKEW-T Chart</div>
    `;
    
    // Position the menu at click location
    contextMenu.style.position = 'absolute';
    contextMenu.style.left = e.pixel.x + 'px';
    contextMenu.style.top = e.pixel.y + 'px';
    
    // Close menu on map click
    const closeMenu = () => {
      if (contextMenu.parentNode) {
        contextMenu.parentNode.removeChild(contextMenu);
      }
      
      // Remove listener after menu is closed
      if (mapRef.current) {
        window.google.maps.event.removeListener(mapClickListener);
      }
    };
    
    // Add the menu to the map container
    mapContainer.current.appendChild(contextMenu);
    
    // Add click event to "Generate SKEW-T Chart" option
    document.getElementById('generate-skewt').addEventListener('click', () => {
      // Open the chart generation page with coordinates
      window.open(
        `/charts?lat=${lat.toFixed(4)}&lon=${lng.toFixed(4)}`,
        '_blank'
      );
      closeMenu();
    });
    
    // Close menu when clicking elsewhere on the map
    const mapClickListener = mapRef.current.addListener('click', closeMenu);
    
    // Also close menu when clicking anywhere else on the page
    setTimeout(() => {
      document.addEventListener('click', closeMenu, { once: true });
    }, 0);
    
  }, []);

  // Declare function references first to avoid initialization order problems
  const initializeMapRef = useRef(null);
  const loadGoogleMapsRef = useRef(null);
  const handleSavedLocationsAfterMapInitRef = useRef(null);
  
  // Function to handle saved locations after map initialization
  const handleSavedLocationsAfterMapInit = useCallback(() => {
    // A separate function to load saved locations after map init
    // to avoid circular dependencies
    if (mapRef.current && user?.id) {
      loadSavedLocations();
    }
  }, [loadSavedLocations, user?.id]);

  // Store reference
  handleSavedLocationsAfterMapInitRef.current = handleSavedLocationsAfterMapInit;

  // Separate function to initialize the map
  const initializeMap = useCallback(() => {
    if (!mapContainer.current || !window.google?.maps) {
      console.log('Cannot initialize map: container or Google Maps not ready');
      return;
    }
    
    console.log('Initializing map');
    
    try {
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

      // Only add meteosource overlay if a weather variable is selected
      if (selectedVariable !== 'none') {
        const meteosourceOverlay = new window.google.maps.ImageMapType({
          getTileUrl: (coord, zoom) => {
            const timeParam = timeOffset === 'now' ? 'now' : timeOffset;
            return `${REACT_APP_API_URL}/api/meteosource/tile?x=${coord.x}&y=${coord.y}&zoom=${zoom}&variable=${selectedVariable}&datetime=${timeParam}`;
          },
          tileSize: new window.google.maps.Size(256, 256),
          name: 'Weather Data'
        });

        mapInstance.overlayMapTypes.push(meteosourceOverlay);
      }
      
      mapRef.current = mapInstance;
      mapInstance.addListener('click', handleMapClick);
      mapInstance.addListener('rightclick', handleMapRightClick);
      setMapInitialized(true);
      
      // Load saved locations once map is initialized
      setTimeout(() => {
        if (handleSavedLocationsAfterMapInitRef.current) {
          handleSavedLocationsAfterMapInitRef.current();
        }
      }, 300); // Short delay to ensure map is fully ready
      
    } catch (error) {
      console.error('Error in map initialization:', error);
    }
  }, [selectedVariable, timeOffset, handleMapClick, handleMapRightClick]);
  
  // Store reference
  initializeMapRef.current = initializeMap;

  // Initialize Google Maps
  const loadGoogleMaps = useCallback(async () => {
    try {
      // Check for existing Google Maps script
      const existingScript = document.querySelector('script[src*="maps.googleapis.com/maps/api/js"]');
      
      // If Google Maps is already loaded, just initialize the map directly
      if (window.google?.maps) {
        console.log('Google Maps API already loaded, initializing map directly');
        if (initializeMapRef.current) {
          initializeMapRef.current();
        }
        return;
      }
      
      // If the script tag exists but Google Maps isn't loaded yet,
      // just wait for the callback to happen
      if (existingScript) {
        console.log('Google Maps script already exists, waiting for callback');
        window.initMap = () => {
          console.log('Google Maps callback received');
          if (initializeMapRef.current) {
            initializeMapRef.current();
          }
        };
        return;
      }
      
      // Otherwise, we need to load the script
      console.log('Fetching Google Maps API key and loading script');
      const response = await axios.get(`${REACT_APP_API_URL}/api/google-maps-init`);
      
      if (!response.data || !response.data.googleMapsKey) {
        console.error('Failed to get Google Maps API key from server');
        return;
      }
      
      const { googleMapsKey } = response.data;
      
      // Set up the callback before adding the script
      window.initMap = () => {
        console.log('Google Maps callback received');
        if (initializeMapRef.current) {
          initializeMapRef.current();
        }
      };
      
      // Create new script tag
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${googleMapsKey}&callback=initMap&v=weekly`;
      script.async = true;
      script.defer = true;
      
      // Add script to document
      document.head.appendChild(script);
      
    } catch (error) {
      console.error('Error initializing map:', error);
    }
  }, []);
  
  // Store reference
  loadGoogleMapsRef.current = loadGoogleMaps;

  // Load Google Maps on component mount and rerender when switching back to the page
  useEffect(() => {
    // This will run both when component first mounts and when switching back to the page
    if (window.google?.maps) {
      // If Google Maps is already loaded, just initialize the map
      if (initializeMapRef.current) {
        initializeMapRef.current();
      }
    } else {
      // If Google Maps isn't loaded yet, load it (which will then initialize the map)
      if (loadGoogleMapsRef.current) {
        loadGoogleMapsRef.current();
      }
    }
    
    // Create cleanup function that doesn't depend on locationMarkers state
    // to avoid dependency cycles and infinite loops
    return () => {
      // Cleanup when component unmounts or before reinitialization
      if (markerRef.current) {
        markerRef.current.setMap(null);
      }
      
      // Get a stable reference to current markers for cleanup
      const currentMarkers = locationMarkers;
      currentMarkers.forEach(marker => {
        if (marker) marker.setMap(null);
      });
      
      if (window.google?.maps && mapRef.current) {
        window.google.maps.event.clearInstanceListeners(mapRef.current);
      }
      // Don't set mapRef.current to null to maintain reference
    };
  }, []); // No dependencies to avoid infinite loop

  // Update map overlay when variable or time changes
  useEffect(() => {
    if (mapRef.current) {
      // Clear existing overlays but maintain click handler
      mapRef.current.overlayMapTypes.clear();
      
      // Only add MeteoSource overlay if a weather variable is selected
      if (selectedVariable !== 'none') {
        // Create new overlay with updated parameters
        const meteosourceOverlay = new window.google.maps.ImageMapType({
          getTileUrl: (coord, zoom) => {
            const timeParam = timeOffset === 'now' ? 'now' : timeOffset;
            return `${REACT_APP_API_URL}/api/meteosource/tile?x=${coord.x}&y=${coord.y}&zoom=${zoom}&variable=${selectedVariable}&datetime=${timeParam}`;
          },
          tileSize: new window.google.maps.Size(256, 256),
          name: 'Weather Data'
        });
        
        // Add new overlay
        mapRef.current.overlayMapTypes.push(meteosourceOverlay);
      }
      
      // Make sure click handlers are still attached
      // First remove to prevent duplicates
      window.google.maps.event.clearListeners(mapRef.current, 'click');
      window.google.maps.event.clearListeners(mapRef.current, 'rightclick');
      mapRef.current.addListener('click', handleMapClick);
      mapRef.current.addListener('rightclick', handleMapRightClick);
    }
  }, [selectedVariable, timeOffset, handleMapClick, handleMapRightClick]);
  
  // Load saved locations when user changes
  useEffect(() => {
    if (user?.id && mapInitialized) {
      console.log(`User data available (${user.id}), loading saved locations`);
      loadSavedLocations();
    }
  }, [user?.id, mapInitialized, loadSavedLocations]);

  // Display saved locations on the map
  useEffect(() => {
    // Check if map and Google Maps are ready
    if (!mapRef.current || !window.google?.maps) {
      return;
    }
    
    // Clear existing location markers
    locationMarkers.forEach(marker => {
      if (marker) marker.setMap(null);
    });
    
    // If no saved locations, don't proceed
    if (!savedLocations.length) {
      setLocationMarkers([]);
      return;
    }
    
    console.log(`Creating ${savedLocations.length} location markers on map`);
    
    // Create markers for saved locations
    const markers = savedLocations.map(location => {
      if (!location || isNaN(location.latitude) || isNaN(location.longitude)) {
        return null;
      }
      
      const marker = new window.google.maps.Marker({
        position: { lat: location.latitude, lng: location.longitude },
        map: mapRef.current,
        title: location.name,
        icon: {
          path: window.google.maps.SymbolPath.CIRCLE,
          fillColor: location.isFavorite ? '#FFD700' : '#4A90E2', // Gold for favorites, blue for normal
          fillOpacity: 0.9,
          strokeWeight: 1,
          strokeColor: '#FFFFFF',
          scale: 8
        }
      });
      
      // Add click event to center map on marker
      marker.addListener('click', () => {
        mapRef.current.setCenter({ lat: location.latitude, lng: location.longitude });
        mapRef.current.setZoom(10);
      });
      
      // Add info window with custom CSS to hide the close button
      const infoWindow = new window.google.maps.InfoWindow({
        content: `
          <div style="padding: 5px; max-width: 200px;">
            <div style="font-weight: bold; margin-bottom: 5px;">${location.name}</div>
            <div>Latitude: ${location.latitude.toFixed(5)}</div>
            <div>Longitude: ${location.longitude.toFixed(5)}</div>
            ${location.isFavorite ? '<div style="color: #FFD700; margin-top: 5px;">★ Favorite Location</div>' : ''}
          </div>
          <style>
            .gm-ui-hover-effect {display: none !important;}
          </style>
        `
      });
      
      // Show info window on hover
      marker.addListener('mouseover', () => {
        infoWindow.open(mapRef.current, marker);
      });
      
      marker.addListener('mouseout', () => {
        infoWindow.close();
      });
      
      return marker;
    }).filter(Boolean); // Remove any null markers
    
    setLocationMarkers(markers);
  }, [savedLocations]); // Removed locationMarkers from dependencies to avoid loop

  return (
    <div className="dashboard-container">
      <div className="main-content">
        <div className="weather-page-container">
          <div ref={weatherControlsRef}>
            <WeatherMapControls
              selectedVariable={selectedVariable}
              onVariableChange={setSelectedVariable}
              weatherVariables={weatherVariables}
              units={units}
            />
          </div>

          <div ref={mapContainer} id="map" className="map-container" />

          <div ref={locationPanelRef}>
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
          </div>

          {selectedVariable !== 'none' && (
            <div ref={weatherGraphRef} className="weather-graph-container">
              <WeatherGraph weatherType={selectedVariable} />
            </div>
          )}

          {selectedVariable !== 'none' && (
            <div ref={timelineSliderRef} className="timeline-slider-wrapper">
              <TimelineSlider onTimeChange={handleTimeChange} />
            </div>
          )}
          <div ref={zoomControlsRef} className="custom-zoom-controls">
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