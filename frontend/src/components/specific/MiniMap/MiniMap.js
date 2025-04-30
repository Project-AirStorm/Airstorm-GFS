// File: Airstorm-GFS/frontend/src/components/specific/MiniMap/MiniMap.js
// Includes Map/Satellite toggle and Precipitation overlay toggle
// MODIFIED: Commented out most console.log statements

import React, { useState, useEffect, useRef, useCallback } from 'react';
import PropTypes from 'prop-types';
import axios from 'axios'; // Needed for fetching API key
import './MiniMap.css'; // Import CSS for MiniMap
import Loader from '../../common/loader'; // Use the common loader

const REACT_APP_API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001';

const MiniMap = ({ centerLat, centerLon, zoomLevel = 4, locations = [] }) => {
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const precipOverlayRef = useRef(null); // Ref to store the precipitation overlay instance

  const [mapInitialized, setMapInitialized] = useState(false);
  const [locationMarkers, setLocationMarkers] = useState([]); // Holds marker instances
  const [isLoading, setIsLoading] = useState(true); // Loading state for map initialization
  // State to track current map type
  const [mapTypeId, setMapTypeId] = useState('roadmap'); // Default to 'roadmap'
  // State: Toggle for precipitation overlay
  const [showPrecipOverlay, setShowPrecipOverlay] = useState(false);

  // --- Map Initialization ---
  const initializeMap = useCallback(() => {
    if (mapRef.current) {
      // console.log('MiniMap: Cleaning up previous map instance before re-initializing.');
      mapRef.current = null;
    }

    if (!mapContainerRef.current || !window.google?.maps || mapInitialized) {
      if (mapInitialized) {
          console.warn("MiniMap: Resetting initialization state.");
          setMapInitialized(false);
      }
      return; // Skip if prerequisites not met
    }

    // console.log('MiniMap: Initializing Google Map...');
    setIsLoading(true); // Start loading indication
    try {
      const mapInstance = new window.google.maps.Map(mapContainerRef.current, {
        center: { lat: centerLat, lng: centerLon },
        zoom: zoomLevel,
        mapTypeId: mapTypeId, // Set map type from state
        mapTypeControl: false, // Disable default Map/Satellite toggle
        fullscreenControl: false, // Disable fullscreen
        streetViewControl: false, // Disable street view
        zoomControl: true, // Keep basic zoom control
        zoomControlOptions: { // Position zoom controls
             position: window.google.maps.ControlPosition.RIGHT_BOTTOM,
        },
        gestureHandling: 'cooperative' // Use 'cooperative' for smaller maps to avoid scroll hijacking
      });

      mapRef.current = mapInstance; // Store map instance
      setMapInitialized(true); // Mark map as initialized
      setIsLoading(false); // Stop loading indication
      // console.log("MiniMap: Google Map Initialized.");

    } catch (error) {
      console.error('Error initializing Google Map in MiniMap:', error);
      setIsLoading(false); // Stop loading on error
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mapInitialized, mapTypeId]); // Added mapTypeId dependency

  // --- Google Maps Script Loading (Corrected Version) ---
  const loadGoogleMaps = useCallback(async () => {
    if (window.google?.maps) {
      if (!mapInitialized) initializeMap();
      return;
    }
    // Check if another instance is already loading the script
    if (document.getElementById('google-maps-script')) {
        // console.log("MiniMap: Google Maps script tag already exists.");
         // If script exists but map not initialized, set up a poller/listener
        if (!window.google?.maps) {
            const checkGoogleMaps = setInterval(() => {
                if (window.google?.maps) {
                    clearInterval(checkGoogleMaps);
                    // console.log("MiniMap: Google Maps API ready (detected existing script).");
                    if (!mapInitialized) initializeMap();
                }
            }, 100);
        } else {
             if (!mapInitialized) initializeMap(); // Already loaded
        }
        return;
    }
    if (window.googleMapsLoading) {
      // console.log("MiniMap: Google Maps script is already loading by another component.");
      // Poll until loaded
      const checkGoogleMaps = setInterval(() => {
          if (window.google?.maps) {
              clearInterval(checkGoogleMaps);
              // console.log("MiniMap: Google Maps API ready (detected ongoing load).");
              if (!mapInitialized) initializeMap();
          }
      }, 100);
      return; // Prevent multiple loads
    }

    // console.log("MiniMap: Loading Google Maps API script...");
    window.googleMapsLoading = true; // Set flag
    setIsLoading(true);

    try {
      // Fetch API key from your backend (ensure this endpoint exists)
      const response = await axios.get(`${REACT_APP_API_URL}/api/google-maps-init`);
      const googleMapsKey = response.data?.googleMapsKey;
      if (!googleMapsKey) throw new Error('Maps API key missing');

      // Define the global callback
      window.initMap = () => {
        // console.log('MiniMap: initMap callback executed.');
        delete window.googleMapsLoading;
        initializeMap();
      };

      // Create and append script
      const script = document.createElement('script');
      script.id = 'google-maps-script'; // Add an ID to check if script exists
      script.src = `https://maps.googleapis.com/maps/api/js?key=${googleMapsKey}&callback=initMap&v=weekly&libraries=marker`; // Corrected line
      script.async = true;
      script.defer = true;
      script.onerror = () => {
           console.error("MiniMap: Google Maps script failed to load.");
           delete window.googleMapsLoading; // Clear flag on error too
           setIsLoading(false);
           // Clean up failed script tag
           const failedScript = document.getElementById('google-maps-script');
           if(failedScript) failedScript.remove();
           window.initMap = undefined; // Clean up callback
      };
      document.head.appendChild(script);

    } catch (error) {
      console.error('Error loading Google Maps in MiniMap:', error);
      delete window.googleMapsLoading; // Clear flag on error
      setIsLoading(false);
    }
  }, [initializeMap, mapInitialized]);


  // --- Effect to load Google Maps script on mount ---
  useEffect(() => {
    loadGoogleMaps();

    // Basic cleanup
    return () => {
      // console.log("MiniMap: Unmounting.");
      // Attempt to clean up markers if the component unmounts
      locationMarkers.forEach(marker => {
          try {
              if(marker?.setMap) marker.setMap(null);
          } catch(e) {
              console.warn("Error cleaning up marker:", e);
          }
      });
       // Clean up precipitation overlay ref
        precipOverlayRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loadGoogleMaps]); // Run only once on mount

  // --- Effect to display location markers ---
  useEffect(() => {
    if (!mapInitialized || !mapRef.current || !window.google?.maps) {
        // console.log("MiniMap Marker Effect: Map not ready.");
      return; // Ensure map is ready
    }

    // console.log(`MiniMap: Updating ${locations.length} markers.`);

    // Clear previous markers first
    locationMarkers.forEach(marker => {
         try {
            if(marker?.setMap) marker.setMap(null);
         } catch(e) { console.warn("Error clearing marker:", e); }
    });

    const markers = locations.map(location => {
      const lat = Number(location.latitude);
      const lng = Number(location.longitude);
      if (isNaN(lat) || isNaN(lng)) {
          console.warn("MiniMap: Skipping invalid location", location);
          return null; // Skip invalid
      }

      const marker = new window.google.maps.Marker({
        position: { lat: lat, lng: lng },
        map: mapRef.current,
        title: location.name || `Location (${lat.toFixed(2)}, ${lng.toFixed(2)})`, // Add fallback title
        icon: { // Use same icon style as Maps.js
          path: window.google.maps.SymbolPath.CIRCLE,
          fillColor: location.isFavorite ? '#FFD700' : '#4A90E2', // Gold/Blue
          fillOpacity: 0.9,
          strokeWeight: 1,
          strokeColor: '#FFFFFF',
          scale: 6 // Slightly smaller scale might be good for mini map
        }
      });

      // Simple info window on hover (no close button needed for hover)
      const infoWindow = new window.google.maps.InfoWindow({
        content: `<div style="font-weight: bold;">${location.name || `Location (${lat.toFixed(2)}, ${lng.toFixed(2)})`}</div>`
      });

      // Use listeners array to manage listeners for cleanup
      const listeners = [];
      listeners.push(marker.addListener('mouseover', () => infoWindow.open({ anchor: marker, map: mapRef.current }))); // Updated open method
      listeners.push(marker.addListener('mouseout', () => infoWindow.close()));

      // Optional: Center map on marker click
      listeners.push(marker.addListener('click', () => {
          mapRef.current?.setCenter({ lat: lat, lng: lng });
          mapRef.current?.setZoom(10); // Zoom in on click
      }));

      // Store listeners on the marker object for later removal
      marker.listeners = listeners;


      return marker;
    }).filter(Boolean); // Remove nulls

    setLocationMarkers(markers); // Update the state

    // Cleanup function for this effect
    return () => {
        // console.log("MiniMap: Cleaning up markers effect.");
        markers.forEach(marker => {
             // Remove listeners first
            if(marker?.listeners && Array.isArray(marker.listeners)) {
                marker.listeners.forEach(listener => window.google.maps.event.removeListener(listener));
            }
            // Then remove marker from map
            try {
               if(marker?.setMap) marker.setMap(null);
            } catch(e) { console.warn("Error cleaning marker in effect cleanup:", e); }
        });
    };

  }, [locations, mapInitialized]); // Re-run when locations or map init status changes


  // --- Effect to recenter map when center props change ---
  useEffect(() => {
      if (mapRef.current && mapInitialized) {
          // console.log(`MiniMap: Recenter requested to ${centerLat}, ${centerLon}`);
          mapRef.current.setCenter({ lat: centerLat, lng: centerLon });
      }
  }, [centerLat, centerLon, mapInitialized]); // Re-run only if center or init status changes

  // --- Effect to update zoom when zoom prop changes ---
  useEffect(() => {
      if (mapRef.current && mapInitialized) {
          const currentZoom = mapRef.current.getZoom();
          if (currentZoom !== zoomLevel) {
               // console.log(`MiniMap: Zoom update requested to ${zoomLevel}`);
               mapRef.current.setZoom(zoomLevel);
          }
      }
  }, [zoomLevel, mapInitialized]); // Re-run only if zoom or init status changes

  // --- Function to toggle map type ---
  const toggleMapType = () => {
      if (mapRef.current) {
          const newTypeId = mapTypeId === 'roadmap' ? 'satellite' : 'roadmap';
          mapRef.current.setMapTypeId(newTypeId); // Tell Google Maps API
          setMapTypeId(newTypeId); // Update React state
      }
  };

  // --- Function to toggle precipitation overlay ---
  const togglePrecipOverlay = () => {
      setShowPrecipOverlay(prev => !prev);
  };

  // --- Effect to add/remove precipitation overlay ---
  useEffect(() => {
      if (!mapInitialized || !mapRef.current || !window.google?.maps) {
          // Ensure cleanup happens if map becomes uninitialized while overlay is on
          if(precipOverlayRef.current) {
              // console.log("MiniMap: Cleaning up precip overlay due to map uninitialization.");
              precipOverlayRef.current = null; // Just clear the ref, map instance might be gone
          }
          return; // Wait for map
      }

      const mapOverlays = mapRef.current.overlayMapTypes;

      // --- Remove existing precip overlay if it's stored in ref ---
      let overlayRemoved = false;
      if (precipOverlayRef.current) {
           try {
               for (let i = 0; i < mapOverlays.getLength(); i++) {
                   // Check if the overlay at index i is the one we stored
                   if (mapOverlays.getAt(i) === precipOverlayRef.current) {
                       mapOverlays.removeAt(i);
                       overlayRemoved = true;
                       // console.log("MiniMap: Removed existing precip overlay from map.");
                       break; // Exit loop once removed
                   }
               }
           } catch (error) {
               console.error("Error removing overlay:", error);
           } finally {
                precipOverlayRef.current = null; // Clear the ref regardless of removal success
           }
      }

      // --- Add new overlay if requested ---
      if (showPrecipOverlay) {
          // console.log("MiniMap: Adding precip overlay.");
          // Using 'precipitation' which should work with the Meteosource endpoint
          const tileUrl = `${REACT_APP_API_URL}/api/meteosource/tile?x={x}&y={y}&zoom={z}&variable=precipitation&datetime=now`;
          const overlay = new window.google.maps.ImageMapType({
              getTileUrl: (coord, zoom) => {
                // Basic validation to prevent errors on invalid coords/zoom
                if (!coord || typeof zoom === 'undefined') return null;
                 return tileUrl.replace('{x}', coord.x).replace('{y}', coord.y).replace('{z}', zoom);
              },
              tileSize: new window.google.maps.Size(256, 256),
              name: 'Precipitation',
              isPng: true,
              opacity: 0.6 // Adjust opacity
          });
          try {
            mapOverlays.insertAt(0, overlay); // Insert at bottom (index 0)
            precipOverlayRef.current = overlay; // Store ref to the added overlay
            // console.log("MiniMap: Precipitation overlay added.");
          } catch (error) {
              console.error("Error adding overlay:", error);
              precipOverlayRef.current = null; // Ensure ref is null if add failed
          }
      } else if (overlayRemoved) {
           // console.log("MiniMap: Precipitation overlay toggled off.");
      }

  }, [showPrecipOverlay, mapInitialized]); // Rerun when toggle state or map readiness changes


  return (
    <div className="mini-map-wrapper">
      {isLoading && (
          <div className="mini-map-loader-overlay">
              <Loader size="small" message="Loading map..." />
          </div>
      )}
      {/* The div where the map will be rendered */}
      <div ref={mapContainerRef} className="mini-map-container" />

      {/* Map/Satellite Toggle Button */}
      {mapInitialized && (
          <button onClick={toggleMapType} className="mini-map-type-toggle" title="Toggle Map Type">
              {/* Change button text based on current type */}
              {mapTypeId === 'roadmap' ? 'Satellite' : 'Map'}
          </button>
      )}

      {/* Precipitation Toggle Button */}
      {mapInitialized && (
          <button
            onClick={togglePrecipOverlay}
            className={`mini-map-precip-toggle ${showPrecipOverlay ? 'active' : ''}`} // Add 'active' class
            title="Toggle Precipitation Overlay"
          >
            {/* Change text based on state */}
            {showPrecipOverlay ? 'Hide Precip' : 'Show Precip'}
          </button>
      )}
    </div>
  );
};

MiniMap.propTypes = {
  centerLat: PropTypes.number.isRequired,
  centerLon: PropTypes.number.isRequired,
  zoomLevel: PropTypes.number,
  locations: PropTypes.arrayOf(PropTypes.shape({
      name: PropTypes.string,
      latitude: PropTypes.number.isRequired,
      longitude: PropTypes.number.isRequired,
      isFavorite: PropTypes.bool
  }))
};

export default MiniMap;