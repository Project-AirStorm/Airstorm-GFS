// File: Airstorm-GFS/frontend/src/components/specific/MiniMap/MiniMap.js
// CORRECTED: Fixed syntax error in loadGoogleMaps function

import React, { useState, useEffect, useRef, useCallback } from 'react';
import PropTypes from 'prop-types';
import axios from 'axios'; // Needed for fetching API key
import './MiniMap.css'; // Import CSS for MiniMap
import Loader from '../../common/loader'; // Use the common loader

const REACT_APP_API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001';

const MiniMap = ({ centerLat, centerLon, zoomLevel = 4, locations = [] }) => {
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const [mapInitialized, setMapInitialized] = useState(false);
  const [locationMarkers, setLocationMarkers] = useState([]); // Holds marker instances
  const [isLoading, setIsLoading] = useState(true); // Loading state for map initialization

  // --- Map Initialization (Adapted from Maps.js) ---
  const initializeMap = useCallback(() => {
    // Ensure cleanup happens before re-initializing
    if (mapRef.current) {
      console.log('MiniMap: Cleaning up previous map instance before re-initializing.');
      // Basic cleanup, more specific listener removal happens elsewhere if needed
      mapRef.current = null;
    }

    if (!mapContainerRef.current || !window.google?.maps || mapInitialized) {
        if (mapInitialized) {
            // If it thinks it's initialized but mapRef is gone, reset state
            console.warn("MiniMap: Resetting initialization state.");
            setMapInitialized(false);
        }
      return; // Skip if prerequisites not met
    }

    console.log('MiniMap: Initializing Google Map...');
    setIsLoading(true); // Start loading indication
    try {
      const mapInstance = new window.google.maps.Map(mapContainerRef.current, {
        center: { lat: centerLat, lng: centerLon },
        zoom: zoomLevel,
        mapTypeControl: false, // Disable map type toggle
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
      console.log("MiniMap: Google Map Initialized.");

    } catch (error) {
      console.error('Error initializing Google Map in MiniMap:', error);
      setIsLoading(false); // Stop loading on error
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mapInitialized]); // Only depend on mapInitialized here, center/zoom handled by another effect

  // --- Google Maps Script Loading (Adapted from Maps.js - CORRECTED) ---
  const loadGoogleMaps = useCallback(async () => {
    if (window.google?.maps) {
      if (!mapInitialized) initializeMap();
      return;
    }
    // Check if another instance is already loading the script
    if (document.getElementById('google-maps-script')) {
        console.log("MiniMap: Google Maps script tag already exists.");
         // If script exists but map not initialized, set up a poller/listener
        if (!window.google?.maps) {
            const checkGoogleMaps = setInterval(() => {
                if (window.google?.maps) {
                    clearInterval(checkGoogleMaps);
                    console.log("MiniMap: Google Maps API ready (detected existing script).");
                    if (!mapInitialized) initializeMap();
                }
            }, 100);
        } else {
             if (!mapInitialized) initializeMap(); // Already loaded
        }
        return;
    }
    if (window.googleMapsLoading) {
      console.log("MiniMap: Google Maps script is already loading by another component.");
      // Poll until loaded
      const checkGoogleMaps = setInterval(() => {
          if (window.google?.maps) {
              clearInterval(checkGoogleMaps);
              console.log("MiniMap: Google Maps API ready (detected ongoing load).");
              if (!mapInitialized) initializeMap();
          }
      }, 100);
      return; // Prevent multiple loads
    }


    console.log("MiniMap: Loading Google Maps API script...");
    window.googleMapsLoading = true; // Set flag
    setIsLoading(true);

    try {
      // Fetch API key from your backend (ensure this endpoint exists)
      const response = await axios.get(`${REACT_APP_API_URL}/api/google-maps-init`);
      const googleMapsKey = response.data?.googleMapsKey;
      if (!googleMapsKey) throw new Error('Maps API key missing');

      // Define the global callback
      window.initMap = () => {
        console.log('MiniMap: initMap callback executed.');
        delete window.googleMapsLoading;
        initializeMap();
      };

      // Create and append script
      const script = document.createElement('script');
      script.id = 'google-maps-script'; // Add an ID to check if script exists
      // *** CORRECTED THIS LINE ***
      script.src = `https://maps.googleapis.com/maps/api/js?key=${googleMapsKey}&callback=initMap&v=weekly&libraries=marker`; // Added 'weekly' and closing backtick
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
      console.log("MiniMap: Unmounting.");
      // Attempt to clean up markers if the component unmounts
      locationMarkers.forEach(marker => {
          try {
              if(marker?.setMap) marker.setMap(null);
          } catch(e) {
              console.warn("Error cleaning up marker:", e);
          }
      });
      // We might not want to nullify mapRef here if other cleanup relies on it.
      // The map instance itself will be garbage collected if mapContainerRef.current is removed from DOM.
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loadGoogleMaps]); // Run only once on mount

  // --- Effect to display location markers ---
  useEffect(() => {
    if (!mapInitialized || !mapRef.current || !window.google?.maps) {
        console.log("MiniMap Marker Effect: Map not ready.");
      return; // Ensure map is ready
    }

    console.log(`MiniMap: Updating ${locations.length} markers.`);

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
        console.log("MiniMap: Cleaning up markers effect.");
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
          console.log(`MiniMap: Recenter requested to ${centerLat}, ${centerLon}`);
          mapRef.current.setCenter({ lat: centerLat, lng: centerLon });
          // Avoid setting zoom here unless the zoom prop *also* changes
      }
  }, [centerLat, centerLon, mapInitialized]); // Re-run only if center or init status changes

    // --- Effect to update zoom when zoom prop changes ---
    useEffect(() => {
        if (mapRef.current && mapInitialized) {
            const currentZoom = mapRef.current.getZoom();
            if (currentZoom !== zoomLevel) {
                 console.log(`MiniMap: Zoom update requested to ${zoomLevel}`);
                 mapRef.current.setZoom(zoomLevel);
            }
        }
    }, [zoomLevel, mapInitialized]); // Re-run only if zoom or init status changes


  return (
    <div className="mini-map-wrapper">
      {isLoading && (
          <div className="mini-map-loader-overlay">
              <Loader size="small" message="Loading map..." />
          </div>
      )}
      {/* The div where the map will be rendered */}
      <div ref={mapContainerRef} className="mini-map-container" />
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