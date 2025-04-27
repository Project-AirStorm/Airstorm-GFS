// File: Airstorm-GFS/frontend/src/pages/Maps/Maps.js

import React, { useState, useCallback, useRef, useEffect } from 'react';
import axios from 'axios';
import { useUserProfile } from '../../contexts/UserContext'; // <-- Import UserContext hook
// import { UserSession } from '../../utils/UserSession'; // <-- Can remove if userProfile provides ID
import { weatherVariables, units } from '../../config/WeatherConfig.js';
import WeatherMapControls from '../../components/specific/WeatherMap/MapControls/MapControls';
import LocationPanel from '../../components/specific/WeatherMap/LocationPanel/LocationPanel';
import WeatherGraph from '../../components/specific/WeatherGraph/WeatherGraph';
import TimelineSlider from '../../components/specific/TimelineSlider/TimelineSlider';
import Loader from '../../components/common/loader'; // <-- Import Loader

import './Maps.css';

// Constants
const REACT_APP_API_URL = process.env.REACT_APP_API_URL;

const Maps = () => {
  // Refs
  const mapContainer = useRef(null);
  const mapRef = useRef(null);
  const markerRef = useRef(null);
  const weatherControlsRef = useRef(null);
  const locationPanelRef = useRef(null);
  const timelineSliderRef = useRef(null);
  const weatherGraphRef = useRef(null);
  const zoomControlsRef = useRef(null);


  // Get data and functions from UserContext
  const {
    userProfile, // Contains user ID and other profile info
    savedLocations: contextSavedLocations, // Renamed to avoid potential naming conflicts
    refreshAlerts, // Use context refresh function (refreshes locations too)
    isLoading: contextLoading, // General context loading state
    isLocationLoading // Specific location loading state
  } = useUserProfile();

  // Local state specific to the Maps page interactions
  const [selectedVariable, setSelectedVariable] = useState('temperature');
  const [timeOffset, setTimeOffset] = useState('now');
  const [isLocationPanelCollapsed, setIsLocationPanelCollapsed] = useState(true);
  const [coordinates, setCoordinates] = useState({ lat: '', lng: '' }); // Coords for adding new location
  const [locationName, setLocationName] = useState(''); // Name for adding new location
  const [isFavorite, setIsFavorite] = useState(false); // Favorite status for adding new location
  const [kmlLayers, setKmlLayers] = useState({}); // State for KML layer objects
  const [mapInitialized, setMapInitialized] = useState(false); // Track map API initialization
  const [locationMarkers, setLocationMarkers] = useState([]); // Array to hold map marker objects

  // REMOVE local savedLocations state and loadSavedLocations function - Use context directly
  // const [savedLocations, setSavedLocations] = useState([]);
  // const loadSavedLocations = useCallback(async () => { ... }, [userProfile?.userId]);

  // API Handlers using context refresh
  const handleSaveLocation = async () => {
    if (!locationName || !coordinates.lat || !coordinates.lng || !userProfile?.userId) {
        console.error("Cannot save: Missing location name, coordinates, or user ID.");
        alert("Please enter a location name and ensure coordinates are set.");
        return;
    }
    try {
      console.log(`Maps: Saving location "${locationName}" for user ${userProfile.userId}`);
      await axios.post(`${REACT_APP_API_URL}/api/locations`, {
        userId: userProfile.userId,
        name: locationName,
        latitude: parseFloat(coordinates.lat),
        longitude: parseFloat(coordinates.lng),
        isFavorite // Use the local state for the new location being saved
      });
      console.log("Maps: Location saved, refreshing context...");
      refreshAlerts(); // <-- Refresh context to get updated list including the new one
      // Clear input fields after successful save
      setLocationName('');
      setIsFavorite(false);
      setCoordinates({ lat: '', lng: '' });
      if (markerRef.current) markerRef.current.setVisible(false); // Hide the temporary marker
      // Optionally close panel or provide other feedback
      // setIsLocationPanelCollapsed(true);
      alert(`Location "${locationName}" saved successfully!`); // Simple feedback
    } catch (error) {
      console.error('Error saving location:', error);
      alert(`Failed to save location: ${error.response?.data?.error || error.message}`);
    }
  };

  // If keeping the handler here, ensure it calls refreshAlerts.
  // This handler is now kept as requested.
  const handleDeleteLocation = async (location) => {
    if (!userProfile?.userId) return;
    try {
      await axios.delete(`${REACT_APP_API_URL}/api/locations`, {
        data: { userId: userProfile.userId, latitude: location.latitude, longitude: location.longitude }
      });
      refreshAlerts(); // <-- Refresh context
    } catch (error) {
      console.error('Error deleting location:', error);
       alert(`Failed to delete location: ${error.response?.data?.error || error.message}`);
    }
  };


  // Toggle Favorite handler for locations *already saved* (if needed on Maps panel)
  // Note: WeatherCard on Dashboard already has its own toggle handler.
  // This would be for potentially toggling from the saved list in LocationPanel.
  const handleToggleFavoriteInPanel = async (location) => {
     if (!userProfile?.userId) return;
      try {
          console.log(`Maps: Toggling favorite for ${location.name} (User: ${userProfile.userId})`);
          await axios.post(`${REACT_APP_API_URL}/api/locations/favorite`, {
              userId: userProfile.userId,
              latitude: location.latitude,
              longitude: location.longitude,
          });
          console.log("Maps: Favorite toggled, refreshing context.");
          refreshAlerts(); // <-- Refresh context
      } catch (err) {
          console.error('Error toggling favorite:', err);
          alert(`Failed to toggle favorite: ${err.response?.data?.error || err.message}`);
      }
  };


  // Event Handlers
  const handleCoordinateChange = (type, value) => {
    // Basic validation for lat/lng format
    if (/^-?\d*\.?\d*$/.test(value)) {
        setCoordinates(prev => ({ ...prev, [type]: value }));
    }
  };

  const handleTimeChange = (offset) => {
    console.log(`Maps: Time changed to offset: ${offset}`);
    setTimeOffset(offset === 'now' ? 'now' : offset); // Ensure 'now' is handled correctly
  };

  // Map click handler - sets temporary marker and coordinates for potential saving
  const handleMapClick = useCallback(async (e) => {
    if (!markerRef.current) return; // Ensure temp marker exists

    const lat = e.latLng.lat();
    const lng = e.latLng.lng();
    console.log(`Maps: Map clicked at ${lat.toFixed(4)}, ${lng.toFixed(4)}`);

    markerRef.current.setPosition(e.latLng);
    markerRef.current.setVisible(true);
    setCoordinates({ lat: lat.toFixed(4), lng: lng.toFixed(4) });

    // Clear name and favorite status when clicking a new point
    setLocationName('');
    setIsFavorite(false);
    // Optionally open the panel
    // setIsLocationPanelCollapsed(false);

  }, []); // Empty dependency array as it doesn't depend on changing state/props

  // Map right-click handler for context menu (e.g., Skew-T)
  const handleMapRightClick = useCallback((e) => {
     if (!mapRef.current || !mapContainer.current) return; // Ensure map and container are ready

     // Prevent default browser context menu
     e.stop(); // Recommended by Google Maps docs for right-click

     const lat = e.latLng.lat();
     const lng = e.latLng.lng();
     console.log(`Maps: Map right-clicked at ${lat.toFixed(4)}, ${lng.toFixed(4)}`);

     // Remove any existing context menu first
     const existingMenu = mapContainer.current.querySelector('.map-context-menu');
     if (existingMenu) {
         existingMenu.remove();
     }

     // Create context menu div
     const contextMenu = document.createElement('div');
     contextMenu.className = 'map-context-menu'; // Apply CSS class
     // Basic styling - ideally use CSS file
     Object.assign(contextMenu.style, {
         position: 'absolute',
         background: 'white',
         border: '1px solid #ccc',
         borderRadius: '4px',
         boxShadow: '0 2px 6px rgba(0,0,0,0.3)',
         padding: '5px 0',
         zIndex: 1000, // Ensure it's above map tiles
         left: `${e.pixel.x}px`,
         top: `${e.pixel.y}px`
     });
     // Menu items
     contextMenu.innerHTML = `
       <div style="padding: 8px 12px; font-size: 14px; font-weight: bold; border-bottom: 1px solid #eee;">Point Actions</div>
       <div class="context-menu-item" id="generate-skewt" style="padding: 8px 12px; font-size: 13px; cursor: pointer;">Generate SKEW-T Chart</div>
       <div class="context-menu-item" id="center-map" style="padding: 8px 12px; font-size: 13px; cursor: pointer;">Center Map Here</div>
     `;

     // Function to close the menu
     const closeMenu = () => {
       if (contextMenu.parentNode) {
         contextMenu.remove();
       }
       // Remove the global click listener once the menu is closed
       document.removeEventListener('click', closeMenu, true); // Use capture phase
       // It's generally safer NOT to remove map listeners here, let map cleanup handle it
     };

     // Add event listeners to menu items
     contextMenu.querySelector('#generate-skewt').addEventListener('click', () => {
       console.log("Maps: Opening Skew-T chart in new tab.");
       window.open(`/charts?lat=${lat.toFixed(4)}&lon=${lng.toFixed(4)}`, '_blank');
       closeMenu();
     });
      contextMenu.querySelector('#center-map').addEventListener('click', () => {
        if (mapRef.current) {
             mapRef.current.setCenter(e.latLng);
        }
       closeMenu();
     });

     // Add the menu to the map container (which allows absolute positioning relative to the map)
     mapContainer.current.appendChild(contextMenu);

     // Add a one-time global click listener to close the menu if clicked outside
     // Use capture phase to catch clicks before they might be stopped elsewhere
     setTimeout(() => document.addEventListener('click', closeMenu, { once: true, capture: true }), 0);

  }, []); // Empty dependency array


  // Map Initialization Logic using refs and useCallback
  const initializeMap = useCallback(() => {
    if (!mapContainer.current || !window.google?.maps || mapInitialized) {
      console.warn('Map initialization skipped:', {
          hasContainer: !!mapContainer.current,
          hasMapsAPI: !!window.google?.maps,
          alreadyInitialized: mapInitialized
      });
      return; // Skip if already initialized or prerequisites not met
    }

    console.log('Maps: Initializing Google Map...');
    try {
      const mapInstance = new window.google.maps.Map(mapContainer.current, {
        center: { lat: 39.8283, lng: -98.5795 }, // Center of US
        zoom: 4,
        mapTypeControl: true,
        mapTypeControlOptions: { style: window.google.maps.MapTypeControlStyle.HORIZONTAL_BAR, position: window.google.maps.ControlPosition.TOP_LEFT },
        fullscreenControl: true,
        fullscreenControlOptions: { position: window.google.maps.ControlPosition.TOP_RIGHT },
        streetViewControl: false,
        zoomControl: false, // Disable default zoom, use custom
        gestureHandling: 'greedy' // Allow smooth panning/zooming
      });

      // Initialize the temporary marker for map clicks
      markerRef.current = new window.google.maps.Marker({
        map: mapInstance,
        position: null, // Initially no position
        icon: { path: window.google.maps.SymbolPath.CIRCLE, fillColor: '#FF0000', fillOpacity: 1, strokeWeight: 0, scale: 6 },
        visible: false // Initially hidden
      });

      mapRef.current = mapInstance; // Store map instance

      // Add listeners AFTER storing the map instance
      mapInstance.addListener('click', handleMapClick);
      mapInstance.addListener('rightclick', handleMapRightClick);

      setMapInitialized(true); // Mark map as initialized
      console.log("Maps: Google Map Initialized.");

    } catch (error) {
      console.error('Error initializing Google Map:', error);
      // Consider setting an error state to show feedback to the user
    }
  }, [mapInitialized, handleMapClick, handleMapRightClick]); // Include mapInitialized to prevent re-running


  // Function to load Google Maps script if needed
  const loadGoogleMaps = useCallback(async () => {
    if (window.google?.maps) {
        console.log("Maps: Google Maps API already loaded.");
        if (!mapInitialized) initializeMap(); // Initialize if not already done
        return;
    }
    if (window.googleMapsLoading) {
        console.log("Maps: Google Maps script is already loading.");
        return; // Prevent multiple loads
    }

    console.log("Maps: Loading Google Maps API script...");
    window.googleMapsLoading = true; // Set flag

    try {
      const response = await axios.get(`${REACT_APP_API_URL}/api/google-maps-init`);
      const googleMapsKey = response.data?.googleMapsKey;
      if (!googleMapsKey) {
        throw new Error('Failed to get Google Maps API key from server');
      }

      // Define the global callback function
      window.initMap = () => {
        console.log('Maps: initMap callback executed.');
        delete window.googleMapsLoading; // Clear flag
        initializeMap(); // Call initializeMap now that API is ready
      };

      // Create and append the script tag
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${googleMapsKey}&callback=initMap&v=weekly&libraries=marker`; // Added marker library potentially
      script.async = true;
      script.defer = true;
      script.onerror = () => {
           console.error("Maps: Google Maps script failed to load.");
           delete window.googleMapsLoading; // Clear flag on error too
           // Handle script loading error (e.g., show error message)
      };
      document.head.appendChild(script);

    } catch (error) {
      console.error('Error loading Google Maps:', error);
      delete window.googleMapsLoading; // Clear flag on error
      // Handle API key fetch error or script setup error
    }
  }, [initializeMap, mapInitialized]); // Depend on initializeMap and mapInitialized


  // Effect to load Google Maps script on component mount
  useEffect(() => {
    loadGoogleMaps();

    // Basic cleanup for the map instance, more comprehensive cleanup might be needed
    return () => {
        console.log("Maps: Unmounting - basic map cleanup.");
        // Note: More robust cleanup, especially for listeners and markers,
        // should happen in the useEffects where they are created/managed.
        // Resetting mapRef might cause issues if other cleanup depends on it.
        // setMapInitialized(false); // Reset initialization status if needed on remount
    };
  }, [loadGoogleMaps]); // Run only once on mount


  // Effect to update map overlay tiles when variable or time changes
  useEffect(() => {
      if (!mapInitialized || !mapRef.current || !window.google?.maps) return; // Ensure map is ready

      console.log(`Maps: Updating overlay for variable "${selectedVariable}" at time "${timeOffset}"`);
      mapRef.current.overlayMapTypes.clear(); // Clear previous weather overlays

      if (selectedVariable !== 'none') {
        const tileUrl = `${REACT_APP_API_URL}/api/meteosource/tile?x={x}&y={y}&zoom={z}&variable=${selectedVariable}&datetime=${timeOffset === 'now' ? 'now' : timeOffset}`;

        const meteosourceOverlay = new window.google.maps.ImageMapType({
          getTileUrl: (coord, zoom) => tileUrl.replace('{x}', coord.x).replace('{y}', coord.y).replace('{z}', zoom),
          tileSize: new window.google.maps.Size(256, 256),
          name: 'Weather Data',
          isPng: true, // Assuming tiles are PNG
          opacity: 0.7
        });
        mapRef.current.overlayMapTypes.push(meteosourceOverlay);
        console.log("Maps: Meteosource overlay added/updated.");
      } else {
           console.log("Maps: No weather variable selected, overlay cleared.");
      }
  }, [selectedVariable, timeOffset, mapInitialized]); // Re-run when these change


  // useEffect to display saved location markers from context
  useEffect(() => {
    // Ensure map API and map instance are ready, and locations are not loading
    if (!mapInitialized || !mapRef.current || !window.google?.maps || isLocationLoading) {
       // If map was previously initialized, clear old markers during loading
       if(mapInitialized) {
            locationMarkers.forEach(marker => marker?.setMap(null));
            setLocationMarkers([]);
       }
       return;
    }

    // Clear previous markers before adding new ones
    locationMarkers.forEach(marker => marker?.setMap(null));

    // Ensure contextSavedLocations is an array
    const locations = Array.isArray(contextSavedLocations) ? contextSavedLocations : [];
    console.log(`Maps: Displaying ${locations.length} saved location markers.`);

    const markers = locations.map(location => {
      // Validate coordinates
      const lat = Number(location.latitude);
      const lng = Number(location.longitude);
      if (isNaN(lat) || isNaN(lng)) {
          console.warn(`Invalid coordinates for location "${location.name}":`, location.latitude, location.longitude);
          return null; // Skip this marker
      }

      const marker = new window.google.maps.Marker({
        position: { lat: lat, lng: lng },
        map: mapRef.current,
        title: location.name,
        icon: {
          path: window.google.maps.SymbolPath.CIRCLE,
          fillColor: location.isFavorite ? '#FFD700' : '#4A90E2', // Gold for favorites, blue for normal
          fillOpacity: 0.9,
          strokeWeight: 1,
          strokeColor: '#FFFFFF',
          scale: 7 // Slightly smaller scale
        }
      });

      // Add click event to center map on marker
      marker.addListener('click', () => {
        console.log(`Maps: Clicked marker for ${location.name}`);
        mapRef.current?.setCenter({ lat: lat, lng: lng });
        mapRef.current?.setZoom(10); // Adjust zoom level as needed
      });

      // Add info window with custom CSS to hide the close button
      const infoWindow = new window.google.maps.InfoWindow({
        content: `
          <div style="padding: 5px; max-width: 200px;">
            <div style="font-weight: bold; margin-bottom: 5px;">${location.name}</div>
            <div>Lat: ${lat.toFixed(4)}, Lon: ${lng.toFixed(4)}</div>
            ${location.isFavorite ? '<div style="color: #FFD700; margin-top: 5px;">★ Favorite</div>' : ''}
          </div>
          <style>.gm-ui-hover-effect {display: none !important;}</style>
        `
      });

      marker.addListener('mouseover', () => infoWindow.open(mapRef.current, marker));
      marker.addListener('mouseout', () => infoWindow.close());

      return marker;
    }).filter(Boolean); // Remove any null markers created due to invalid data

    setLocationMarkers(markers); // Update the state with the new array of markers

    // Cleanup function for this effect: remove markers when locations change or component unmounts
    return () => {
        console.log("Maps: Cleaning up location markers.");
        markers.forEach(marker => marker?.setMap(null));
    };

  }, [contextSavedLocations, mapInitialized, isLocationLoading]); // Depend on context locations & loading status


  // Main component render
  return (
    <div className="dashboard-container"> {/* Use dashboard-container for consistent padding/layout */}
      <div className="main-content">
        <div className="weather-page-container"> {/* Specific container for map layout */}

          {/* Show loader overlay while map/context is initializing */}
          {(contextLoading || isLocationLoading || !mapInitialized) && (
            <div className="map-loader-overlay">
              <Loader size="medium" message={
                  contextLoading ? "Loading user data..." :
                  isLocationLoading ? "Loading locations..." :
                  "Initializing map..."
              } />
            </div>
           )}

           {/* Map Controls - visibility tied to map initialization */}
           <div ref={weatherControlsRef} style={{ visibility: mapInitialized ? 'visible' : 'hidden' }}>
             <WeatherMapControls
                 selectedVariable={selectedVariable}
                 onVariableChange={setSelectedVariable}
                 weatherVariables={weatherVariables}
                 units={units}
             />
           </div>

           {/* Map Container - always present in DOM for initialization */}
           <div ref={mapContainer} id="map" className="map-container" />

           {/* Location Panel - visibility tied to map initialization */}
           <div ref={locationPanelRef} style={{ visibility: mapInitialized ? 'visible' : 'hidden' }}>
            <LocationPanel
              isCollapsed={isLocationPanelCollapsed}
              onToggleCollapse={() => setIsLocationPanelCollapsed(!isLocationPanelCollapsed)}
              locationName={locationName}
              onLocationNameChange={setLocationName}
              coordinates={coordinates}
              onCoordinateChange={handleCoordinateChange}
              isFavorite={isFavorite} // For new location favorite status
              onToggleFavorite={() => setIsFavorite(!isFavorite)} // Toggles local state for new location
              onSaveLocation={handleSaveLocation} // Uses context refresh
              // Pass context locations, ensuring it's an array
              savedLocations={Array.isArray(contextSavedLocations) ? contextSavedLocations : []}
              onDeleteLocation={handleDeleteLocation} // Use the uncommented function
              userId={userProfile?.userId} // Use ID from context profile
              mapRef={mapRef}
              kmlLayers={kmlLayers}
              setKmlLayers={setKmlLayers}
              // Pass the favorite toggle handler for existing locations if needed
              // onToggleFavoriteSaved={handleToggleFavoriteInPanel} // Example if needed
            />
          </div>

          {/* Conditional rendering of graph/slider based on selection and map init */}
          {selectedVariable !== 'none' && mapInitialized && (
            <>
              <div ref={weatherGraphRef} className="weather-graph-container">
                  <WeatherGraph weatherType={selectedVariable} />
              </div>
              <div ref={timelineSliderRef} className="timeline-slider-wrapper">
                  <TimelineSlider onTimeChange={handleTimeChange} />
              </div>
            </>
          )}

          {/* Custom Zoom Controls */}
           <div ref={zoomControlsRef} className="custom-zoom-controls" style={{ visibility: mapInitialized ? 'visible' : 'hidden' }}>
             <button
               className="custom-zoom-button"
               onClick={() => mapRef.current?.setZoom(mapRef.current.getZoom() + 1)}
               title="Zoom In"
             >
               +
             </button>
             <button
               className="custom-zoom-button"
               onClick={() => mapRef.current?.setZoom(mapRef.current.getZoom() - 1)}
               title="Zoom Out"
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