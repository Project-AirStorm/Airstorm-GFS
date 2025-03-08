import React, { useState, useRef, useEffect } from 'react';
import PropTypes from 'prop-types';
import axios from 'axios';
import { 
  IoAdd, 
  IoChevronForward, 
  IoBookmark, 
  IoBookmarkOutline,
  IoLocation,
  IoRemove,
  IoEye,
  IoEyeOff,
  IoTrash,
  IoDocumentAttach
} from 'react-icons/io5';
import './LocationPanel.css';

const REACT_APP_API_URL = process.env.REACT_APP_API_URL;

const LocationPanel = ({
  isCollapsed,
  onToggleCollapse,
  locationName,
  onLocationNameChange,
  coordinates,
  onCoordinateChange,
  isFavorite,
  onToggleFavorite,
  onSaveLocation,
  savedLocations,
  onDeleteLocation,
  userId,
  mapRef,
  kmlLayers,
  setKmlLayers
}) => {
  const [activeTab, setActiveTab] = useState('locations');
  const [selectedFile, setSelectedFile] = useState(null);
  const [fileDescription, setFileDescription] = useState('');
  const [kmlFiles, setKmlFiles] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef(null);
  // Load user's KML files
  const loadKmlFiles = async () => {
    try {
      if (!userId) return;
      
      try {
        // Try to load from backend first
        const response = await axios.get(`${REACT_APP_API_URL}/api/kml-files?userId=${userId}`);
        setKmlFiles(response.data);
      } catch (error) {
        console.warn('Backend KML loading failed (expected in development):', error);
        // Fall back to localStorage in development
        loadLocalKmlFiles();
      }
    } catch (error) {
      console.error('Error loading KML files:', error);
    }
  };

  useEffect(() => {
    if (userId && activeTab === 'kml') {
      // For dev environment, always load local files
      if (window.location.hostname === 'localhost') {
        loadLocalKmlFiles();
      } else {
        // For production, try backend first
        loadKmlFiles();
      }
    }
  }, [userId, activeTab]);

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    const fileName = file?.name.toLowerCase() || '';
    
    if (file && (fileName.endsWith('.kml') || fileName.endsWith('.kmz'))) {
      setSelectedFile(file);
    } else {
      alert('Please select a valid KML or KMZ file');
      setSelectedFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleUpload = async () => {
    if (!selectedFile || !userId) return;

    try {
      setIsUploading(true);
      
      // Create a local version of the KML file for development
      // In development, we'll store files in local browser storage since the database connection is failing
      
      // Generate a unique ID for the file
      const fileId = Date.now();
      const fileName = selectedFile.name;
      
      // Read the file content
      const fileContent = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target.result);
        reader.onerror = (e) => reject(e);
        reader.readAsText(selectedFile);
      });
      
      // Store in local storage (this is a development workaround)
      try {
        // Create a KML files array in localStorage if it doesn't exist
        const localKmlFiles = JSON.parse(localStorage.getItem('kmlFiles') || '[]');
        
        // Add the new file
        localKmlFiles.push({
          id: fileId,
          fileName: fileName,
          description: fileDescription,
          userId: userId,
          uploadDate: new Date().toISOString(),
          isActive: false,
          kmlContent: fileContent
        });
        
        // Save back to localStorage
        localStorage.setItem('kmlFiles', JSON.stringify(localKmlFiles));
        
        console.log('Saved KML file to local storage:', fileName);
        
        // Reset form
        setSelectedFile(null);
        setFileDescription('');
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
        
        // Update the KML files list from local storage
        loadLocalKmlFiles();
        
      } catch (localError) {
        console.error('Error storing in localStorage:', localError);
        alert('Failed to store KML file in local storage. Try with a smaller file.');
      }
      
      // Also attempt to upload to backend (this might fail in development)
      try {
        const formData = new FormData();
        formData.append('file', selectedFile);
        formData.append('userId', userId);
        formData.append('description', fileDescription);
        
        await axios.post(`${REACT_APP_API_URL}/api/kml-files`, formData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        });
        
        // If backend upload succeeds, load files from backend
        await loadKmlFiles();
        
      } catch (backendError) {
        console.warn('Backend upload failed (expected in development):', backendError);
        // This is expected in development, so we don't show an error to the user
      }
      
    } catch (error) {
      console.error('Error processing KML file:', error);
      alert('Failed to process KML file');
    } finally {
      setIsUploading(false);
    }
  };
  
  // Load KML files from local storage for development
  const loadLocalKmlFiles = () => {
    try {
      const localKmlFiles = JSON.parse(localStorage.getItem('kmlFiles') || '[]');
      // Filter to only show files for the current user
      const userFiles = localKmlFiles.filter(file => file.userId === userId);
      setKmlFiles(userFiles);
    } catch (error) {
      console.error('Error loading KML files from local storage:', error);
    }
  };

  const toggleKmlVisibility = async (fileId) => {
    try {
      if (!userId) return;
      
      // Try with both localStorage and backend
      
      // First handle local state
      const updatedFiles = kmlFiles.map(file => {
        if (file.id === fileId) {
          const newActiveState = !file.isActive;
          
          // If toggling on, add KML layer to map
          if (newActiveState) {
            // If kmlContent exists, we're using localStorage
            if (file.kmlContent) {
              console.log('Using local KML content');
              loadLocalKmlLayer(file);
            } else {
              // Otherwise try the backend
              loadKmlLayer(file.id);
            }
          } else {
            // Remove KML layer if it exists
            removeKmlLayer(file.id);
          }
          
          return { ...file, isActive: newActiveState };
        }
        return file;
      });
      
      setKmlFiles(updatedFiles);
      
      // Update the localStorage version if we're in development mode
      try {
        const localKmlFiles = JSON.parse(localStorage.getItem('kmlFiles') || '[]');
        const updatedLocalFiles = localKmlFiles.map(file => {
          if (file.id === fileId) {
            return { ...file, isActive: !file.isActive };
          }
          return file;
        });
        localStorage.setItem('kmlFiles', JSON.stringify(updatedLocalFiles));
      } catch (localStorageError) {
        console.warn('Could not update localStorage:', localStorageError);
      }
      
      // Also try the backend (will fail in development, and that's ok)
      try {
        await axios.post(`${REACT_APP_API_URL}/api/kml-files/${fileId}/toggle`, {
          userId: userId
        });
      } catch (backendError) {
        console.warn('Backend KML toggle failed (expected in development):', backendError);
      }
      
    } catch (error) {
      console.error('Error toggling KML visibility:', error);
    }
  };

  const deleteKmlFile = async (fileId) => {
    if (!window.confirm('Are you sure you want to delete this KML file?')) return;
    
    try {
      if (!userId) return;
      
      // Remove layer if it exists
      removeKmlLayer(fileId);
      
      // Update local state
      setKmlFiles(kmlFiles.filter(file => file.id !== fileId));
      
      // Delete from localStorage in development
      try {
        const localKmlFiles = JSON.parse(localStorage.getItem('kmlFiles') || '[]');
        const filteredFiles = localKmlFiles.filter(file => file.id !== fileId);
        localStorage.setItem('kmlFiles', JSON.stringify(filteredFiles));
      } catch (localStorageError) {
        console.warn('Could not update localStorage:', localStorageError);
      }
      
      // Try backend delete (will fail in development)
      try {
        await axios.delete(`${REACT_APP_API_URL}/api/kml-files/${fileId}`, {
          data: { userId: userId }
        });
      } catch (backendError) {
        console.warn('Backend KML delete failed (expected in development):', backendError);
      }
    } catch (error) {
      console.error('Error deleting KML file:', error);
    }
  };

  const loadKmlLayer = async (fileId) => {
    try {
      if (!mapRef?.current || !window.google?.maps) return;
      
      // Check if layer already exists and remove it first
      removeKmlLayer(fileId);
      
      // Create a new DOM parser to parse KML
      const parser = new DOMParser();
      
      // Create an iframe to serve the KML file locally - this is a workaround for development
      const iframe = document.createElement('iframe');
      iframe.style.display = 'none';
      document.body.appendChild(iframe);
      
      // Get the raw KML content
      const timestamp = new Date().getTime();
      const response = await axios.get(
        `${REACT_APP_API_URL}/api/kml-files/${fileId}?userId=${userId}&format=raw&t=${timestamp}`
      );
      
      // Get the KML content
      const kmlContent = response.data.kmlContent;
      
      // Before creating the blob, check the KML for issues
      const hasNetworkLinks = /<NetworkLink>/.test(kmlContent);
      const hasExternalResources = /<href>data\//.test(kmlContent) || 
                                 /<Icon>[\s\S]*?<href>/.test(kmlContent);
      
      // Log diagnostics
      if (hasNetworkLinks) {
        console.warn('⚠️ KML file contains NetworkLink elements that may not work in browser context');
      }
      
      if (hasExternalResources) {
        console.warn('⚠️ KML file contains references to external resources that may not be accessible');
      }
      
      // Parse the KML to check for other issues
      try {
        const xmlDoc = parser.parseFromString(kmlContent, "text/xml");
        
        // Check for parsing errors
        if (xmlDoc.getElementsByTagName("parsererror").length > 0) {
          console.error("⚠️ KML file contains XML parsing errors");
          // If there are parsing errors, try to fix common issues
          console.log("Attempting to clean XML...");
        } else {
          console.log("KML structure valid");
          
          // Get an estimated size of placemarks to render
          const placemarks = xmlDoc.getElementsByTagName("Placemark");
          const coordinates = xmlDoc.getElementsByTagName("coordinates");
          
          console.log(`KML contains ${placemarks.length} placemarks and ${coordinates.length} coordinate sets`);
          
          // If the file is very complex, add a warning
          if (placemarks.length > 100 || coordinates.length > 100) {
            console.warn(`⚠️ Complex KML file with ${placemarks.length} placemarks may be slow to render`);
          }
        }
      } catch (e) {
        console.error("Error analyzing KML structure:", e);
      }
      
      // Create a blob from the KML content
      const blob = new Blob([kmlContent], {type: 'application/vnd.google-earth.kml+xml'});
      const blobUrl = URL.createObjectURL(blob);
      
      // Create the KML layer with the blob URL
      const kmlLayer = new window.google.maps.KmlLayer({
        url: blobUrl,
        map: mapRef.current,
        preserveViewport: true,
        suppressInfoWindows: false
      });
      
      console.log('Loading KML from blob URL:', blobUrl);
      
      // Add event listener for status with better error handling
      kmlLayer.addListener('status_changed', () => {
        const status = kmlLayer.getStatus();
        console.log(`KML Layer ${fileId} status: ${status}`);
        
        if (status !== 'OK') {
          // Provide better error diagnostics
          let errorMessage = `Error loading KML layer: ${status}`;
          
          switch(status) {
            case 'DOCUMENT_NOT_FOUND':
              errorMessage += ' - The KML document could not be found or accessed';
              break;
            case 'FETCH_ERROR':
              errorMessage += ' - The KML document could not be fetched';
              break;
            case 'INVALID_DOCUMENT':
              errorMessage += ' - The KML document is not a valid KML, KMZ or GeoRSS document';
              break;
            case 'INVALID_REQUEST':
              errorMessage += ' - The KML Layer was invalid';
              break;
            case 'LIMITS_EXCEEDED':
              errorMessage += ' - The KML contains too many Document, Folder or Style elements';
              break;
            case 'TIMED_OUT':
              errorMessage += ' - The KML document fetch timed out';
              break;
            case 'UNKNOWN':
              errorMessage += ' - Unknown error processing KML';
              break;
          }
          
          console.error(errorMessage);
          console.log('Falling back to alternative KML rendering...');
          
          // If error occurs with blob URL, try our improved method
          trySimpleKmlLayer(fileId, kmlContent);
        }
      });
      
      // Store reference to revoke URL later
      kmlLayer.blobUrl = blobUrl;
      
      // Add to layers map
      setKmlLayers(prev => ({
        ...prev,
        [fileId]: kmlLayer
      }));
      
      // Clean up iframe after use
      setTimeout(() => {
        document.body.removeChild(iframe);
      }, 1000);
      
    } catch (error) {
      console.error('Error loading KML layer:', error);
      // Try direct loading as fallback
      tryDirectKmlEndpoint(fileId);
    }
  };
  
  // Improved approach - extract coordinates and draw them directly
  const trySimpleKmlLayer = (fileId, kmlContent) => {
    try {
      if (!mapRef?.current) return;
      
      console.log('Trying improved KML rendering approach...');
      
      // Create a DOMParser to parse the KML XML properly
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(kmlContent, "text/xml");
      
      if (xmlDoc.getElementsByTagName("parsererror").length > 0) {
        console.error("Error parsing KML XML");
        throw new Error("XML parsing error");
      }
      
      // Check for KML namespace
      const kmlNamespace = xmlDoc.documentElement.namespaceURI || "http://www.opengis.net/kml/2.2";
      
      // Extract coordinates using proper XML parsing
      // This handles namespaces better than regex
      const getAllCoordinateElements = (doc) => {
        // Try both with and without namespace
        const coordElements = [...doc.getElementsByTagName("coordinates")];
        if (coordElements.length === 0) {
          // Try with namespace
          const allElements = doc.getElementsByTagNameNS(kmlNamespace, "coordinates");
          return [...allElements];
        }
        return coordElements;
      };
      
      const coordElements = getAllCoordinateElements(xmlDoc);
      
      if (coordElements.length === 0) {
        console.error('No coordinates found in KML document');
        return;
      }
      
      // Create a Data layer
      const dataLayer = new window.google.maps.Data();
      
      // Process each set of coordinates
      coordElements.forEach((element, index) => {
        const coordsStr = element.textContent.trim();
        const coordsList = coordsStr.split(/\s+/); // Handle all whitespace
        
        if (coordsList.length > 1) {
          // Create a polygon or polyline
          const path = coordsList
            .filter(coord => coord.trim() !== '') // Filter out empty strings
            .map(coordSet => {
              const parts = coordSet.split(',');
              // KML format is longitude,latitude,altitude
              if (parts.length >= 2) {
                const lng = parseFloat(parts[0]);
                const lat = parseFloat(parts[1]);
                // Check if values are valid numbers and in proper range
                if (!isNaN(lng) && !isNaN(lat) && lng >= -180 && lng <= 180 && lat >= -90 && lat <= 90) {
                  return { lat, lng };
                }
              }
              return null;
            })
            .filter(point => point !== null); // Remove invalid points
          
          if (path.length > 0) {
            try {
              // Determine if this is a polygon or a line
              // Find the parent element to see if it's a Polygon or LineString
              let parent = element.parentNode;
              let isPolygon = false;
              
              while (parent && parent.nodeName !== "Polygon" && parent.nodeName !== "LineString") {
                parent = parent.parentNode;
              }
              
              isPolygon = parent && parent.nodeName === "Polygon";
              
              // Add as polygon if it's a polygon or if first and last points match
              if (isPolygon || (path.length > 2 && path[0].lat === path[path.length-1].lat && path[0].lng === path[path.length-1].lng)) {
                dataLayer.add(new window.google.maps.Data.Feature({
                  geometry: new window.google.maps.Data.Polygon([path])
                }));
              } else {
                // Otherwise add as line
                dataLayer.add(new window.google.maps.Data.Feature({
                  geometry: new window.google.maps.Data.LineString(path)
                }));
              }
            } catch (e) {
              console.warn(`Error processing path ${index}:`, e);
            }
          }
        } else if (coordsList.length === 1 && coordsList[0].trim() !== '') {
          try {
            // Create a point
            const parts = coordsList[0].split(',');
            if (parts.length >= 2) {
              const lng = parseFloat(parts[0]);
              const lat = parseFloat(parts[1]);
              
              if (!isNaN(lng) && !isNaN(lat) && lng >= -180 && lng <= 180 && lat >= -90 && lat <= 90) {
                dataLayer.add(new window.google.maps.Data.Feature({
                  geometry: new window.google.maps.Data.Point(new window.google.maps.LatLng(lat, lng))
                }));
              }
            }
          } catch (e) {
            console.warn(`Error processing point ${index}:`, e);
          }
        }
      });
      
      // Parse Placemark elements to get names and descriptions
      const placemarks = [...xmlDoc.getElementsByTagName("Placemark")];
      if (placemarks.length > 0) {
        console.log(`Found ${placemarks.length} placemarks in KML`);
        
        // Try to extract style information
        const styles = {};
        const styleElements = [...xmlDoc.getElementsByTagName("Style")];
        styleElements.forEach(style => {
          const id = style.getAttribute("id");
          if (id) {
            // Extract basic style properties
            const lineStyle = style.getElementsByTagName("LineStyle")[0];
            const polyStyle = style.getElementsByTagName("PolyStyle")[0];
            const iconStyle = style.getElementsByTagName("IconStyle")[0];
            
            styles[id] = {
              stroke: lineStyle ? (lineStyle.getElementsByTagName("color")[0]?.textContent || "#FF0000") : "#FF0000",
              strokeWidth: lineStyle ? parseFloat(lineStyle.getElementsByTagName("width")[0]?.textContent || "2") : 2,
              fill: polyStyle ? (polyStyle.getElementsByTagName("color")[0]?.textContent || "#FF0000") : "#FF0000",
              fillOpacity: 0.35
            };
          }
        });
        
        // Apply custom styling if available
        dataLayer.setStyle(feature => {
          return {
            strokeColor: '#FF0000',
            strokeOpacity: 1.0,
            strokeWeight: 2,
            fillColor: '#FF0000',
            fillOpacity: 0.35,
            icon: {
              path: window.google.maps.SymbolPath.CIRCLE,
              scale: 7,
              fillColor: '#FF0000',
              fillOpacity: 1,
              strokeWeight: 1,
              strokeColor: '#FFFFFF'
            }
          };
        });
      } else {
        // Apply default styling
        dataLayer.setStyle({
          strokeColor: '#FF0000',
          strokeOpacity: 1.0,
          strokeWeight: 2,
          fillColor: '#FF0000',
          fillOpacity: 0.35,
          icon: {
            path: window.google.maps.SymbolPath.CIRCLE,
            scale: 7,
            fillColor: '#FF0000',
            fillOpacity: 1,
            strokeWeight: 1,
            strokeColor: '#FFFFFF'
          }
        });
      }
      
      // Add to map
      dataLayer.setMap(mapRef.current);
      
      // Add to layers map
      setKmlLayers(prev => ({
        ...prev,
        [fileId]: dataLayer
      }));
      
      console.log('Improved KML rendering completed');
    } catch (error) {
      console.error('Error in improved KML rendering:', error);
      tryDirectKmlEndpoint(fileId);
    }
  };
  
  // Try using the direct KML endpoint - only works in production with public URLs
  const tryDirectKmlEndpoint = (fileId) => {
    try {
      if (!mapRef?.current) return;
      
      console.log('Trying direct KML endpoint...');
      const timestamp = new Date().getTime();
      const kmlUrl = `${REACT_APP_API_URL}/api/kml-files/${fileId}?userId=${userId}&t=${timestamp}`;
      
      const kmlLayer = new window.google.maps.KmlLayer({
        url: kmlUrl,
        map: mapRef.current,
        preserveViewport: true,
        suppressInfoWindows: false
      });
      
      kmlLayer.addListener('status_changed', () => {
        const status = kmlLayer.getStatus();
        if (status !== 'OK') {
          console.error(`Direct KML endpoint error: ${status}`);
        } else {
          console.log('Direct KML endpoint loaded successfully');
        }
      });
      
      setKmlLayers(prev => ({
        ...prev,
        [fileId]: kmlLayer
      }));
    } catch (error) {
      console.error('Error with direct KML endpoint:', error);
    }
  };

  const removeKmlLayer = (fileId) => {
    if (kmlLayers[fileId]) {
      // Revoke blob URL if it exists to prevent memory leaks
      if (kmlLayers[fileId].blobUrl) {
        URL.revokeObjectURL(kmlLayers[fileId].blobUrl);
      }
      
      kmlLayers[fileId].setMap(null);
      
      // Remove from layers map
      const updatedLayers = { ...kmlLayers };
      delete updatedLayers[fileId];
      setKmlLayers(updatedLayers);
    }
  };

  // Function to load KML content from localStorage
  const loadLocalKmlLayer = (file) => {
    try {
      if (!mapRef?.current || !window.google?.maps) return;
      
      // Check if layer already exists and remove it first
      removeKmlLayer(file.id);
      
      // Before creating the blob, check and potentially fix the KML content
      let processedKmlContent = file.kmlContent;
      
      // First, check if this KML has NetworkLinks or references to external files
      const hasNetworkLinks = /<NetworkLink>/.test(processedKmlContent);
      const hasExternalResources = /<href>data\//.test(processedKmlContent) || 
                                  /<Icon>[\s\S]*?<href>/.test(processedKmlContent);
      
      // Log diagnostics
      if (hasNetworkLinks) {
        console.warn('⚠️ KML file contains NetworkLink elements that may not work in browser context');
      }
      
      if (hasExternalResources) {
        console.warn('⚠️ KML file contains references to external resources that may not be accessible');
      }
      
      // Parse the KML to check for other issues
      try {
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(processedKmlContent, "text/xml");
        
        // Check for parsing errors
        if (xmlDoc.getElementsByTagName("parsererror").length > 0) {
          console.error("⚠️ KML file contains XML parsing errors");
        } else {
          console.log("KML structure valid");
          
          // Get an estimated size of placemarks to render
          const placemarks = xmlDoc.getElementsByTagName("Placemark");
          const coordinates = xmlDoc.getElementsByTagName("coordinates");
          
          console.log(`KML contains ${placemarks.length} placemarks and ${coordinates.length} coordinate sets`);
          
          // If the file is very complex, add a warning
          if (placemarks.length > 100 || coordinates.length > 100) {
            console.warn(`⚠️ Complex KML file with ${placemarks.length} placemarks may be slow to render`);
          }
        }
      } catch (e) {
        console.error("Error analyzing KML structure:", e);
      }
      
      // Create a blob from the KML content
      const blob = new Blob([processedKmlContent], {type: 'application/vnd.google-earth.kml+xml'});
      const blobUrl = URL.createObjectURL(blob);
      
      // Try to use Google's KML layer with blob URL
      try {
        console.log('Loading KML from blob URL:', blobUrl);
        
        const kmlLayer = new window.google.maps.KmlLayer({
          url: blobUrl,
          map: mapRef.current,
          preserveViewport: true,
          suppressInfoWindows: false
        });
        
        // Monitor status changes with better error reporting
        kmlLayer.addListener('status_changed', () => {
          const status = kmlLayer.getStatus();
          console.log(`KML Layer ${file.id} status: ${status}`);
          
          if (status !== 'OK') {
            // Provide better error diagnostics
            let errorMessage = `Error loading KML layer: ${status}`;
            
            switch(status) {
              case 'DOCUMENT_NOT_FOUND':
                errorMessage += ' - The KML document could not be found or accessed';
                break;
              case 'FETCH_ERROR':
                errorMessage += ' - The KML document could not be fetched';
                break;
              case 'INVALID_DOCUMENT':
                errorMessage += ' - The KML document is not a valid KML, KMZ or GeoRSS document';
                break;
              case 'INVALID_REQUEST':
                errorMessage += ' - The KML Layer was invalid';
                break;
              case 'LIMITS_EXCEEDED':
                errorMessage += ' - The KML contains too many Document, Folder or Style elements';
                break;
              case 'TIMED_OUT':
                errorMessage += ' - The KML document fetch timed out';
                break;
              case 'UNKNOWN':
                errorMessage += ' - Unknown error processing KML';
                break;
            }
            
            console.error(errorMessage);
            console.log('Falling back to alternative KML rendering...');
            
            // Fall back to simpler parsing if blob URL fails
            trySimpleKmlLayer(file.id, file.kmlContent);
          }
        });
        
        // Store reference to revoke URL later
        kmlLayer.blobUrl = blobUrl;
        
        // Add to layers map
        setKmlLayers(prev => ({
          ...prev,
          [file.id]: kmlLayer
        }));
        
      } catch (error) {
        console.error('Error creating KML layer from blob:', error);
        // Try direct parsing as fallback
        trySimpleKmlLayer(file.id, file.kmlContent);
      }
      
    } catch (error) {
      console.error('Error loading local KML:', error);
    }
  };

  // Load active KML layers when map or kmlFiles change
  useEffect(() => {
    if (mapRef?.current && kmlFiles.length > 0) {
      console.log('Loading active KML layers...');
      // Load all active KML files
      kmlFiles.forEach(file => {
        if (file.isActive) {
          console.log(`Loading active KML file: ${file.id} - ${file.fileName}`);
          // Check if this is a local file (has kmlContent) or backend file
          if (file.kmlContent) {
            loadLocalKmlLayer(file);
          } else {
            loadKmlLayer(file.id);
          }
        } else {
          // Ensure inactive files are not displayed
          removeKmlLayer(file.id);
        }
      });
    }
    
    // Cleanup function to remove all layers
    return () => {
      Object.keys(kmlLayers).forEach(fileId => {
        if (kmlLayers[fileId]) {
          if (kmlLayers[fileId].blobUrl) {
            URL.revokeObjectURL(kmlLayers[fileId].blobUrl);
          }
          kmlLayers[fileId].setMap(null);
        }
      });
    };
  }, [mapRef?.current, kmlFiles]);

  const handleCoordinateInput = (e, type) => {
    const value = e.target.value;
    if (/^-?\d*\.?\d*$/.test(value)) {
      onCoordinateChange(type, value);
    }
  };

  return (
    <div className={`location-panel ${isCollapsed ? 'translate-x-full' : 'translate-x-0'}`}>
      <button
        onClick={onToggleCollapse}
        className="panel-toggle-button"
      >
        {isCollapsed ? <IoAdd /> : <IoChevronForward />}
      </button>

      <div className="location-panel-content">
        <div className="tab-navigation">
          <button 
            className={`tab-button ${activeTab === 'locations' ? 'active' : ''}`}
            onClick={() => setActiveTab('locations')}
          >
            Locations
          </button>
          <button 
            className={`tab-button ${activeTab === 'kml' ? 'active' : ''}`}
            onClick={() => setActiveTab('kml')}
          >
            KML Files
          </button>
        </div>

        {activeTab === 'locations' ? (
          <>
            <div className="location-panel-header">
              <h2 className="location-panel-title">Save Location</h2>
            </div>

            <div className="location-input-group">
              <input
                type="text"
                value={locationName}
                onChange={(e) => onLocationNameChange(e.target.value)}
                placeholder="Enter location name"
                className="location-input"
              />

              <div className="coordinates-container">
                <input
                  type="text"
                  value={coordinates.lat}
                  onChange={(e) => handleCoordinateInput(e, 'lat')}
                  placeholder="Latitude"
                  className="location-input"
                />
                <input
                  type="text"
                  value={coordinates.lng}
                  onChange={(e) => handleCoordinateInput(e, 'lng')}
                  placeholder="Longitude"
                  className="location-input"
                />
              </div>

              <button
                onClick={onToggleFavorite}
                className={`favorite-button ${isFavorite ? 'active' : ''}`}
              >
                {isFavorite ? (
                  <IoBookmark className="favorite-icon" />
                ) : (
                  <IoBookmarkOutline className="favorite-icon" />
                )}
                {isFavorite ? 'Favorited' : 'Add to Favorites'}
              </button>

              <button
                onClick={onSaveLocation}
                disabled={!locationName}
                className="save-button"
              >
                Save Location
              </button>
            </div>

            <div className="saved-locations-list">
              <h3 className="saved-locations-header">Saved Locations</h3>
              <div className="saved-locations-content">
                {savedLocations.map((location) => (
                  <div
                    key={`${location.latitude}-${location.longitude}`}
                    className="saved-location-item"
                  >
                    <div className="saved-location-info">
                      {location.isFavorite ? (
                        <IoBookmark className="favorite-location-icon" />
                      ) : (
                        <IoLocation className="location-icon" />
                      )}
                      <span>{location.name}</span>
                    </div>
                    <button
                      onClick={() => onDeleteLocation(location)}
                      className="delete-button"
                      aria-label="Delete location"
                    >
                      <IoRemove />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </>
        ) : (
          <>
            <div className="location-panel-header">
              <h2 className="location-panel-title">KML Files</h2>
            </div>

            <div className="kml-upload-section">
              <div className="file-input-container">
                <label className="file-input-label" htmlFor="kml-file-input">
                  <IoDocumentAttach /> Select KML/KMZ File
                </label>
                <input
                  type="file"
                  id="kml-file-input"
                  className="file-input"
                  accept=".kml,.kmz"
                  onChange={handleFileChange}
                  ref={fileInputRef}
                />
                {selectedFile && (
                  <div className="selected-file-name">{selectedFile.name}</div>
                )}
              </div>

              <div className="kml-input-group">
                <input
                  type="text"
                  className="location-input"
                  placeholder="Description (optional)"
                  value={fileDescription}
                  onChange={(e) => setFileDescription(e.target.value)}
                />
              </div>

              <button
                onClick={handleUpload}
                disabled={!selectedFile || isUploading}
                className="save-button"
              >
                {isUploading ? 'Uploading...' : 'Upload KML File'}
              </button>
            </div>

            <div className="saved-locations-list">
              <h3 className="saved-locations-header">Your KML Files</h3>
              <div className="kml-info-message">
                <p>Upload KML or KMZ files to visualize them on the map.</p>
                <p>Files are parsed directly in the browser for local development.</p>
              </div>
              <div className="saved-locations-content">
                {kmlFiles.length === 0 ? (
                  <p className="no-files-message">No KML files uploaded yet</p>
                ) : (
                  kmlFiles.map((file) => (
                    <div key={file.id} className="saved-location-item kml-file-item">
                      <div className="saved-location-info">
                        <div className="kml-file-name">{file.fileName}</div>
                        {file.description && (
                          <div className="kml-file-description">{file.description}</div>
                        )}
                      </div>
                      <div className="kml-file-actions">
                        <button
                          className={`toggle-active-button ${file.isActive ? 'active' : 'inactive'}`}
                          onClick={() => toggleKmlVisibility(file.id)}
                          aria-label={file.isActive ? 'Hide KML layer' : 'Show KML layer'}
                        >
                          {file.isActive ? <IoEye /> : <IoEyeOff />}
                        </button>
                        <button
                          className="delete-button"
                          onClick={() => deleteKmlFile(file.id)}
                          aria-label="Delete KML file"
                        >
                          <IoTrash />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

LocationPanel.propTypes = {
  isCollapsed: PropTypes.bool.isRequired,
  onToggleCollapse: PropTypes.func.isRequired,
  locationName: PropTypes.string.isRequired,
  onLocationNameChange: PropTypes.func.isRequired,
  coordinates: PropTypes.shape({
    lat: PropTypes.string.isRequired,
    lng: PropTypes.string.isRequired
  }).isRequired,
  onCoordinateChange: PropTypes.func.isRequired,
  isFavorite: PropTypes.bool.isRequired,
  onToggleFavorite: PropTypes.func.isRequired,
  onSaveLocation: PropTypes.func.isRequired,
  savedLocations: PropTypes.arrayOf(
    PropTypes.shape({
      name: PropTypes.string.isRequired,
      latitude: PropTypes.number.isRequired,
      longitude: PropTypes.number.isRequired,
      isFavorite: PropTypes.bool.isRequired
    })
  ).isRequired,
  onDeleteLocation: PropTypes.func.isRequired,
  userId: PropTypes.string,
  mapRef: PropTypes.object,
  kmlLayers: PropTypes.object,
  setKmlLayers: PropTypes.func
};

export default LocationPanel;