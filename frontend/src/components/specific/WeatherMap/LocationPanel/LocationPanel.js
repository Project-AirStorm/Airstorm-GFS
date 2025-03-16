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
  // Load user's KML files with improved error handling and synchronization
  const loadKmlFiles = async () => {
    try {
      if (!userId) {
        console.log('Cannot load KML files: No user ID available');
        return;
      }
      
      // First, we'll try to load from the backend
      let backendFiles = [];
      let backendSuccess = false;
      
      try {
        console.log(`Loading KML files from backend for user ${userId}...`);
        const response = await axios.get(`${REACT_APP_API_URL}/api/kml-files?userId=${userId}`);
        
        if (response.data && Array.isArray(response.data)) {
          console.log(`Successfully loaded ${response.data.length} KML files from backend`);
          backendFiles = response.data;
          backendSuccess = true;
          
          // Save these as the source of truth
          setKmlFiles(backendFiles);
        } else {
          console.warn('Backend returned invalid KML files data:', response.data);
        }
      } catch (error) {
        console.error('Backend KML loading failed:', error.message);
        
        if (error.response) {
          console.log('Response status:', error.response.status);
          console.log('Response data:', error.response.data);
        } else if (error.request) {
          console.log('No response received from server');
        }
      }
      
      // Now handle localStorage sync and fall back if needed
      const isLocalDev = window.location.hostname === 'localhost';
      
      if (isLocalDev || !backendSuccess) {
        try {
          console.log('Checking localStorage for KML files...');
          // Get all files in localStorage
          const localKmlFiles = JSON.parse(localStorage.getItem('kmlFiles') || '[]');
          
          if (backendSuccess) {
            // SYNCHRONIZATION MODE: Backend successfully loaded, so sync localStorage
            console.log('Synchronizing localStorage with backend data');
            
            // Get backend file IDs for comparison
            const backendFileIds = backendFiles.map(file => file.id.toString());
            
            // Filter local storage to remove files that no longer exist in backend
            const validLocalFiles = localKmlFiles.filter(file => {
              // Keep only files that exist in backend or are for other users
              return file.userId !== userId || backendFileIds.includes(file.id.toString());
            });
            
            // If we've removed any files, update localStorage
            if (validLocalFiles.length !== localKmlFiles.length) {
              console.log(`Removed ${localKmlFiles.length - validLocalFiles.length} deleted files from localStorage`);
              localStorage.setItem('kmlFiles', JSON.stringify(validLocalFiles));
            }
            
            // If in dev mode, supplement backend data with local files
            if (isLocalDev) {
              // Get user's local files that aren't in the backend list
              const localOnlyFiles = validLocalFiles.filter(
                file => file.userId === userId && !backendFileIds.includes(file.id.toString())
              );
              
              if (localOnlyFiles.length > 0) {
                console.log(`Adding ${localOnlyFiles.length} local-only files to the display list`);
                setKmlFiles([...backendFiles, ...localOnlyFiles]);
              }
            }
          } else {
            // FALLBACK MODE: Backend failed, so use localStorage as fallback
            console.log('Using localStorage as fallback for KML files');
            const userFiles = localKmlFiles.filter(file => file.userId === userId);
            setKmlFiles(userFiles);
          }
        } catch (localError) {
          console.error('Error processing localStorage KML files:', localError);
          
          // If we have backend files but localStorage failed, still use the backend files
          if (backendSuccess) {
            console.log('Using backend files despite localStorage error');
            setKmlFiles(backendFiles);
          } else {
            // Both sources failed, show empty list
            console.log('Both backend and localStorage failed, showing empty KML file list');
            setKmlFiles([]);
          }
        }
      }
    } catch (error) {
      console.error('Error in loadKmlFiles function:', error);
      setKmlFiles([]);
    }
  };

  useEffect(() => {
    if (userId && activeTab === 'kml') {
      // Use improved loading function that handles both local and backend data
      console.log('KML tab active - loading KML files');
      
      // First, let's do a clean-up of any potentially orphaned localStorage entries
      const isLocalDev = window.location.hostname === 'localhost';
      if (isLocalDev) {
        try {
          // Get all localStorage entries
          const localKmlFiles = JSON.parse(localStorage.getItem('kmlFiles') || '[]');
          
          // Check if we need to clean up old entries
          // Simple heuristic - if there are files for this user with lastAccessed older than 30 days
          const now = new Date();
          const thirtyDaysAgo = new Date(now.setDate(now.getDate() - 30));
          
          // Add a lastAccessed field to track when files were last seen
          // Keep only files that have been accessed in the last 30 days
          const cleanedFiles = localKmlFiles.map(file => {
            // Add lastAccessed if it doesn't exist
            if (!file.lastAccessed) {
              file.lastAccessed = new Date().toISOString();
            }
            return file;
          }).filter(file => {
            // Keep files for other users
            if (file.userId !== userId) return true;
            
            // For this user's files, check the last accessed date
            const lastAccessed = new Date(file.lastAccessed);
            return lastAccessed > thirtyDaysAgo;
          });
          
          // If we've removed any files, update localStorage
          if (cleanedFiles.length !== localKmlFiles.length) {
            console.log(`Cleaned up ${localKmlFiles.length - cleanedFiles.length} stale KML files from localStorage`);
            localStorage.setItem('kmlFiles', JSON.stringify(cleanedFiles));
          }
        } catch (error) {
          console.error('Error cleaning up localStorage KML files:', error);
        }
      }
      
      // Now load files normally
      loadKmlFiles();
    }
  }, [userId, activeTab]);
  
  // Make sure KML files are loaded but not shown by default
  useEffect(() => {
    if (userId && kmlFiles.length > 0) {
      // Reset all files to not active if this is a fresh load (component mount)
      const updatedFiles = kmlFiles.map(file => ({
        ...file,
        isActive: false // Ensure all are inactive by default
      }));
      
      // Only update if there's a change to prevent infinite loop
      if (JSON.stringify(updatedFiles) !== JSON.stringify(kmlFiles)) {
        setKmlFiles(updatedFiles);
        
        // Also update localStorage if in development mode
        if (window.location.hostname === 'localhost') {
          try {
            const localKmlFiles = JSON.parse(localStorage.getItem('kmlFiles') || '[]');
            const updatedLocalFiles = localKmlFiles.map(file => ({
              ...file,
              isActive: false
            }));
            localStorage.setItem('kmlFiles', JSON.stringify(updatedLocalFiles));
          } catch (error) {
            console.log('Error updating localStorage KML files:', error);
          }
        }
      }
    }
  }, [userId]);

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
    if (!selectedFile || !userId) {
      console.log('Cannot upload: missing file or user ID');
      return;
    }

    try {
      setIsUploading(true);
      console.log(`Uploading KML file ${selectedFile.name}...`);
      
      const fileName = selectedFile.name;
      const isLocalDev = window.location.hostname === 'localhost';
      
      // Generate a file ID that's unique enough for development
      const fileId = Date.now();
      
      // Always attempt to upload to backend first, regardless of environment
      let backendUploadSuccess = false;
      let backendFileId = null;
      
      try {
        console.log('Attempting to upload file to backend...');
        
        const formData = new FormData();
        formData.append('file', selectedFile);
        formData.append('userId', userId);
        formData.append('description', fileDescription);
        
        const response = await axios.post(`${REACT_APP_API_URL}/api/kml-files`, formData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        });
        
        // Check if upload was successful
        if (response.data && response.data.success) {
          console.log('Successfully uploaded file to backend');
          backendUploadSuccess = true;
          backendFileId = response.data.fileId;
          
          // Immediately reload files from backend to get the updated list
          await loadKmlFiles();
        } else {
          console.warn('Backend upload returned unexpected response:', response.data);
        }
      } catch (backendError) {
        console.warn('Backend upload failed:', backendError.message);
        
        // Add more detailed error information
        if (backendError.response) {
          console.log('Response status:', backendError.response.status);
          console.log('Response data:', backendError.response.data);
        } else if (backendError.request) {
          console.log('No response received from server');
        }
      }
      
      // In development mode or if backend upload failed, also store in localStorage
      if (isLocalDev || !backendUploadSuccess) {
        try {
          console.log('Storing KML file in local storage for development...');
          
          // Read the file content
          const fileContent = await new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target.result);
            reader.onerror = (e) => reject(e);
            reader.readAsText(selectedFile);
          });
          
          // Create a KML files array in localStorage if it doesn't exist
          const localKmlFiles = JSON.parse(localStorage.getItem('kmlFiles') || '[]');
          
          // Add the new file, using backend ID if available
          localKmlFiles.push({
            id: backendFileId || fileId,
            fileName: fileName,
            description: fileDescription,
            userId: userId,
            uploadDate: new Date().toISOString(),
            isActive: false,
            kmlContent: fileContent
          });
          
          // Save back to localStorage
          localStorage.setItem('kmlFiles', JSON.stringify(localKmlFiles));
          
          console.log('Successfully saved KML file to local storage:', fileName);
          
          // Reload files from local storage to get the updated list
          loadLocalKmlFiles();
        } catch (localError) {
          console.error('Error storing in localStorage:', localError);
          
          if (!backendUploadSuccess) {
            // Only show an error if backend upload also failed
            alert('Failed to upload KML file. Please try again with a smaller file.');
          }
        }
      }
      
      // Reset form regardless of upload success
      setSelectedFile(null);
      setFileDescription('');
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      
      // Show success message to user
      if (backendUploadSuccess || isLocalDev) {
        // For subtle UI notification
        console.log('Upload complete');
      }
      
    } catch (error) {
      console.error('Error processing KML file:', error);
      alert('Failed to process KML file: ' + error.message);
    } finally {
      setIsUploading(false);
    }
  };
  
  // Load KML files from local storage for development
  // This function is now only used during file upload as we've consolidated loading in loadKmlFiles
  const loadLocalKmlFiles = () => {
    try {
      // This will be a full reload from the new source of truth
      console.log('Reloading KML files after changes');
      loadKmlFiles();
    } catch (error) {
      console.error('Error loading KML files from local storage:', error);
    }
  };

  const toggleKmlVisibility = async (fileId) => {
    try {
      if (!userId) return;
      
      // Find the file in the kmlFiles array
      const fileToToggle = kmlFiles.find(file => file.id.toString() === fileId.toString());
      if (!fileToToggle) {
        console.log(`File ${fileId} not found in kmlFiles state`);
        return;
      }
      
      console.log(`Toggling visibility for file: ${fileToToggle.fileName}`);
      
      // Check if we're already processing this file to prevent duplicate attempts
      const existingLayer = kmlLayers[fileId];
      if (existingLayer && existingLayer.processing) {
        console.log('Already processing this KML file, please wait...');
        return;
      }
      
      // Create a placeholder layer with a setMap method to prevent errors
      // This ensures there's always a valid layer object during processing
      const placeholderLayer = {
        setMap: function() { console.log('Placeholder setMap called'); },
        processing: true
      };
      
      // First handle local state - safely update kmlLayers with the placeholder
      setKmlLayers(prev => ({
        ...prev,
        [fileId]: { 
          ...(prev[fileId] || {}),
          ...placeholderLayer
        }
      }));
      
      // Update files state
      const updatedFiles = kmlFiles.map(file => {
        if (file.id.toString() === fileId.toString()) {
          const newActiveState = !file.isActive;
          
          // Queue layer operations for next render cycle
          setTimeout(() => {
            try {
              // If toggling on, add KML layer to map
              if (newActiveState) {
                // If kmlContent exists, we're using localStorage
                if (file.kmlContent) {
                  console.log('Using local KML content for rendering');
                  loadLocalKmlLayer(file);
                } else {
                  // Otherwise try the backend
                  console.log('Loading KML from backend');
                  loadKmlLayer(file.id);
                }
              } else {
                // Remove KML layer if it exists
                console.log('Removing KML layer - toggling visibility off');
                // Always call removeKmlLayer at least twice to ensure cleanup
                // This works around a Google Maps rendering issue
                removeKmlLayer(file.id);
                // Schedule another removal after a short delay to catch any stuck objects
                setTimeout(() => {
                  removeKmlLayer(file.id);
                }, 50);
              }
            } catch (renderError) {
              console.log('Error during KML rendering, using fallback:', renderError);
              
              // Try alternate method if error occurs
              if (file.kmlContent) {
                // Try backend for local file
                loadKmlLayer(file.id);
              } else {
                // Try simplified renderer for backend file
                try {
                  // Fetch content and use direct rendering
                  const fetchAndRender = async () => {
                    try {
                      const response = await axios.get(
                        `${REACT_APP_API_URL}/api/kml-files/${fileId}?userId=${userId}&format=raw`
                      );
                      if (response.data && response.data.kmlContent) {
                        trySimpleKmlLayer(fileId, response.data.kmlContent);
                      }
                    } catch (fetchError) {
                      console.log('Error fetching KML content:', fetchError);
                    }
                  };
                  fetchAndRender();
                } catch (fallbackError) {
                  console.log('All rendering methods failed');
                }
              }
            }
          }, 0);
          
          return { ...file, isActive: newActiveState };
        }
        return file;
      });
      
      setKmlFiles(updatedFiles);
      
      // Update the localStorage version if we're in development mode
      const isLocalDev = window.location.hostname === 'localhost';
      if (isLocalDev) {
        try {
          const localKmlFiles = JSON.parse(localStorage.getItem('kmlFiles') || '[]');
          const updatedLocalFiles = localKmlFiles.map(file => {
            if (file.id.toString() === fileId.toString()) {
              return { ...file, isActive: !file.isActive };
            }
            return file;
          });
          localStorage.setItem('kmlFiles', JSON.stringify(updatedLocalFiles));
          console.log('Updated local storage KML active state');
        } catch (localStorageError) {
          console.log('Could not update localStorage:', localStorageError.message);
        }
      }
      
      // Try to update the backend even in development mode
      try {
        console.log(`Sending toggle request to backend for KML file ${fileId}`);
        const response = await axios.post(`${REACT_APP_API_URL}/api/kml-files/${fileId}/toggle`, {
          userId: userId
        });
        
        if (response.data && response.data.success) {
          console.log('Successfully toggled KML active state in backend');
        } else {
          console.log('Backend toggle request returned unexpected response:', response.data);
        }
      } catch (backendError) {
        console.log('Backend KML toggle request failed');
        
        // Add more detailed error information
        if (backendError.response) {
          console.log('Response status:', backendError.response.status);
          console.log('Response data:', backendError.response.data);
        } else if (backendError.request) {
          console.log('No response received from server');
        }
      }
      
    } catch (error) {
      console.log('Error toggling KML visibility:', error.message);
    }
  };

  const deleteKmlFile = async (fileId) => {
    if (!window.confirm('Are you sure you want to delete this KML file?')) return;
    
    try {
      if (!userId) return;
      
      // Remove layer if it exists
      removeKmlLayer(fileId);
      
      // Update UI immediately for better feedback
      setKmlFiles(prevFiles => prevFiles.filter(file => file.id.toString() !== fileId.toString()));
      
      let backendDeleteSuccess = false;
      
      // Try backend delete - improved to work in both development and production
      try {
        console.log(`Attempting to delete KML file ${fileId} from database...`);
        const deleteResponse = await axios.delete(`${REACT_APP_API_URL}/api/kml-files/${fileId}`, {
          data: { userId: userId }
        });
        
        if (deleteResponse.data && deleteResponse.data.success) {
          console.log(`Successfully deleted KML file ${fileId} from database`);
          backendDeleteSuccess = true;
        } else {
          console.warn(`Failed to delete KML file ${fileId} from database:`, deleteResponse.data);
        }
      } catch (backendError) {
        console.error('Error deleting KML file from backend:', backendError);
        
        // In development, this might be expected, but we'll log detailed info to help debug
        if (window.location.hostname === 'localhost') {
          console.log('API details for delete request:');
          console.log('- Endpoint:', `${REACT_APP_API_URL}/api/kml-files/${fileId}`);
          console.log('- User ID:', userId);
          console.log('- File ID:', fileId);
        }
      }
      
      // Always update localStorage regardless of backend success
      // This ensures localStorage stays in sync even if backend fails
      try {
        console.log('Updating localStorage to remove deleted file');
        const localKmlFiles = JSON.parse(localStorage.getItem('kmlFiles') || '[]');
        
        // Remove this specific file
        const filteredFiles = localKmlFiles.filter(file => {
          // Don't remove files for other users
          if (file.userId !== userId) return true;
          // Remove the exact file that was deleted
          return file.id.toString() !== fileId.toString();
        });
        
        if (filteredFiles.length !== localKmlFiles.length) {
          console.log(`Removed file ${fileId} from localStorage`);
          localStorage.setItem('kmlFiles', JSON.stringify(filteredFiles));
        }
      } catch (localStorageError) {
        console.warn('Could not update localStorage:', localStorageError);
      }
      
      // Refresh the KML files list to ensure it's in sync
      // This is especially important if backend succeeded but localStorage update failed
      if (backendDeleteSuccess) {
        console.log('Refreshing KML file list after successful deletion');
        setTimeout(() => loadKmlFiles(), 500);
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
      
      // Check if we're in local development
      const isLocalDev = window.location.hostname === 'localhost';
      
      // Get the raw KML content
      const timestamp = new Date().getTime();
      const response = await axios.get(
        `${REACT_APP_API_URL}/api/kml-files/${fileId}?userId=${userId}&format=raw&t=${timestamp}`
      );
      
      // Get the KML content
      const kmlContent = response.data.kmlContent;
      
      // For local development, skip Google Maps KML layer and use our custom renderer
      if (isLocalDev) {
        console.log('Loading backend KML with enhanced renderer (local development mode)');
        trySimpleKmlLayer(fileId, kmlContent);
        return;
      }
      
      // Create a blob from the KML content
      const blob = new Blob([kmlContent], {type: 'application/vnd.google-earth.kml+xml'});
      const blobUrl = URL.createObjectURL(blob);
      
      // For production, try Google's KML layer first
      console.log('Loading KML with Google Maps KML layer (production mode)');
      
      const kmlLayer = new window.google.maps.KmlLayer({
        url: blobUrl,
        map: mapRef.current,
        preserveViewport: true,
        suppressInfoWindows: false
      });
      
      // Add event listener to fall back if Google KML layer fails
      kmlLayer.addListener('status_changed', () => {
        const status = kmlLayer.getStatus();
        
        if (status !== 'OK') {
          console.log(`Using enhanced KML rendering for ${fileId}`);
          
          // Fall back to our custom renderer
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
      
    } catch (error) {
      console.log('Error loading KML layer, using fallback renderer');
      try {
        // Retrieve the KML content if we didn't already get it
        const retrieveAndRender = async () => {
          try {
            const timestamp = new Date().getTime();
            const response = await axios.get(
              `${REACT_APP_API_URL}/api/kml-files/${fileId}?userId=${userId}&format=raw&t=${timestamp}`
            );
            
            if (response.data && response.data.kmlContent) {
              trySimpleKmlLayer(fileId, response.data.kmlContent);
            } else {
              console.log('Could not retrieve KML content');
            }
          } catch (retrieveError) {
            console.log('Error retrieving KML content');
          }
        };
        
        retrieveAndRender();
      } catch (fallbackError) {
        console.log('Unable to render KML file');
      }
    }
  };
  
  // Improved approach - extract coordinates and draw them directly
  const trySimpleKmlLayer = (fileId, kmlContent) => {
    try {
      if (!mapRef?.current) return;
      
      console.log('Using enhanced KML rendering...');
      
      // Create a DOMParser to parse the KML XML properly
      const parser = new DOMParser();
      let xmlDoc;
      
      try {
        xmlDoc = parser.parseFromString(kmlContent, "text/xml");
        
        if (xmlDoc.getElementsByTagName("parsererror").length > 0) {
          // Try to fix common XML issues before throwing error
          const sanitizedContent = kmlContent
            // Fix invalid characters in XML
            .replace(/[^\x09\x0A\x0D\x20-\uD7FF\uE000-\uFFFD\u10000-\u10FFFF]/g, '')
            // Fix unclosed CDATA sections
            .replace(/<!\[CDATA\[([^\]]*)(?!\]\])/, '<![CDATA[$1]]>')
            // Fix mismatched quotes in attributes
            .replace(/(\w+)=([^"']\S*)/g, '$1="$2"')
            // Ensure proper namespace declarations
            .replace(/<kml\s/, '<kml xmlns="http://www.opengis.net/kml/2.2" ');
            
          // Try parsing again
          xmlDoc = parser.parseFromString(sanitizedContent, "text/xml");
          
          if (xmlDoc.getElementsByTagName("parsererror").length > 0) {
            console.log("Optimizing KML file structure");
            // Instead of throwing, we'll try to work with what we have
          }
        }
      } catch (parseError) {
        console.warn("KML parsing error, attempting to continue:", parseError);
        // Create a minimal XML doc to work with
        xmlDoc = parser.parseFromString('<kml xmlns="http://www.opengis.net/kml/2.2"><Document></Document></kml>', "text/xml");
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
        console.log('Using placemark fallback rendering');
        
        // Try to extract placemarks directly instead of coordinates
        const placemarks = xmlDoc.getElementsByTagName("Placemark");
        if (placemarks.length > 0) {
          console.log(`Found ${placemarks.length} placemarks to render`);
          
          // Create a data layer for the placemarks
          const dataLayer = new window.google.maps.Data();
          
          // Process each placemark
          Array.from(placemarks).forEach((placemark, index) => {
            // Try to extract name and description
            const name = placemark.getElementsByTagName("name")[0]?.textContent || `Placemark ${index + 1}`;
            const description = placemark.getElementsByTagName("description")[0]?.textContent || '';
            
            // Check if we can get a point
            const point = placemark.getElementsByTagName("Point")[0];
            if (point) {
              // Try to extract coordinates from point
              const coordsText = point.getElementsByTagName("coordinates")[0]?.textContent;
              if (coordsText) {
                const parts = coordsText.trim().split(',');
                if (parts.length >= 2) {
                  const lng = parseFloat(parts[0]);
                  const lat = parseFloat(parts[1]);
                  
                  if (!isNaN(lng) && !isNaN(lat)) {
                    dataLayer.add({
                      geometry: new window.google.maps.Data.Point(new window.google.maps.LatLng(lat, lng)),
                      properties: { name, description }
                    });
                  }
                }
              }
            } else {
              // If no point, try to find the first coordinate in any element
              let coords = null;
              // Look for coordinates in various elements
              ['Polygon', 'LineString', 'LinearRing'].forEach(elemType => {
                if (!coords) {
                  const elem = placemark.getElementsByTagName(elemType)[0];
                  if (elem) {
                    const coordsElem = elem.getElementsByTagName("coordinates")[0];
                    if (coordsElem && coordsElem.textContent) {
                      const coordValues = coordsElem.textContent.trim().split(/\s+/)[0].split(',');
                      if (coordValues.length >= 2) {
                        const lng = parseFloat(coordValues[0]);
                        const lat = parseFloat(coordValues[1]);
                        if (!isNaN(lng) && !isNaN(lat)) {
                          coords = { lat, lng };
                        }
                      }
                    }
                  }
                }
              });
              
              // If we found any coordinates, add a point
              if (coords) {
                dataLayer.add({
                  geometry: new window.google.maps.Data.Point(new window.google.maps.LatLng(coords.lat, coords.lng)),
                  properties: { name, description }
                });
              }
            }
          });
          
          // Style the placemarks
          dataLayer.setStyle({
            icon: {
              path: window.google.maps.SymbolPath.CIRCLE,
              scale: 10,
              fillColor: '#FF8C00',
              fillOpacity: 0.7,
              strokeColor: '#FFFFFF',
              strokeWeight: 2
            }
          });
          
          // Add hover info
          const infoWindow = new window.google.maps.InfoWindow();
          
          dataLayer.addListener('mouseover', (event) => {
            const name = event.feature.getProperty('name') || 'Placemark';
            const description = event.feature.getProperty('description') || '';
            
            let content = `<div><strong>${name}</strong>`;
            if (description) {
              content += `<p>${description}</p>`;
            }
            content += '</div>';
            
            infoWindow.setContent(content);
            infoWindow.setPosition(event.latLng);
            infoWindow.open(mapRef.current);
          });
          
          dataLayer.addListener('mouseout', () => {
            infoWindow.close();
          });
          
          // Add to map
          dataLayer.setMap(mapRef.current);
          
          // Store info window reference
          dataLayer.infoWindow = infoWindow;
          
          // Add to layers map
          setKmlLayers(prev => ({
            ...prev,
            [fileId]: dataLayer
          }));
          
          console.log('Rendered placemarks from KML file');
          return;
        } else {
          // Just log that we couldn't find any placemarks instead of creating a fallback marker
          console.log('No placemarks found in KML file');
          return;
        }
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
            strokeColor: '#FF8C00', // Orange instead of red
            strokeOpacity: 1.0,
            strokeWeight: 2,
            fillColor: '#FF8C00', // Orange instead of red
            fillOpacity: 0.35,
            icon: {
              path: window.google.maps.SymbolPath.CIRCLE,
              scale: 7,
              fillColor: '#FF8C00', // Orange instead of red
              fillOpacity: 1,
              strokeWeight: 1,
              strokeColor: '#FFFFFF'
            }
          };
        });
      } else {
        // Apply default styling
        dataLayer.setStyle({
          strokeColor: '#FF8C00', // Orange instead of red
          strokeOpacity: 1.0,
          strokeWeight: 2,
          fillColor: '#FF8C00', // Orange instead of red
          fillOpacity: 0.35,
          icon: {
            path: window.google.maps.SymbolPath.CIRCLE,
            scale: 7,
            fillColor: '#FF8C00', // Orange instead of red
            fillOpacity: 1,
            strokeWeight: 1,
            strokeColor: '#FFFFFF'
          }
        });
      }
      
      // Add to map
      dataLayer.setMap(mapRef.current);
      
      // Add hover info window functionality
      const infoWindow = new window.google.maps.InfoWindow();
      
      // Add event listeners for mouseover and mouseout
      dataLayer.addListener('mouseover', (event) => {
        try {
          // Get the feature properties
          const feature = event.feature;
          
          // Collect information to display
          const properties = feature.getProperty('properties') || {};
          const featureType = feature.getGeometry().getType();
          
          // Try to get name and description from the KML data
          const name = feature.getProperty('name') || '';
          const description = feature.getProperty('description') || '';
          
          // Build info content
          let infoContent = '<div style="max-width: 250px;">';
          
          // Add name if available
          if (name) {
            infoContent += `<h3 style="margin: 0; font-size: 16px;">${name}</h3>`;
          } else {
            infoContent += `<h3 style="margin: 0; font-size: 16px;">KML ${featureType}</h3>`;
          }
          
          // Add description if available
          if (description) {
            infoContent += `<div style="margin-top: 5px;">${description}</div>`;
          }
          
          // Close the div
          infoContent += '</div>';
          
          // Set info window content and position
          infoWindow.setContent(infoContent);
          infoWindow.setPosition(event.latLng);
          
          // Delay showing the info window to avoid flicker on quick mouse movements
          setTimeout(() => {
            infoWindow.open(mapRef.current);
          }, 100);
        } catch (error) {
          console.warn('Error showing info window:', error);
        }
      });
      
      dataLayer.addListener('mouseout', () => {
        // Close info window when mouse leaves the feature
        infoWindow.close();
      });
      
      // Store the info window reference
      dataLayer.infoWindow = infoWindow;
      
      // Add to layers map
      setKmlLayers(prev => ({
        ...prev,
        [fileId]: dataLayer
      }));
      
      console.log('Improved KML rendering completed with hover info');
    } catch (error) {
      console.log('Using simpler KML rendering fallback');
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
      
      // Create an empty Data layer for when KML loading fails completely
      // We won't add any markers to avoid the dot in the center
      const fallbackDataLayer = new window.google.maps.Data();
      
      const kmlLayer = new window.google.maps.KmlLayer({
        url: kmlUrl,
        map: mapRef.current,
        preserveViewport: true,
        suppressInfoWindows: false
      });
      
      // Add a timeout to check if the KML layer loads correctly
      const kmlLoadingTimeout = setTimeout(() => {
        const status = kmlLayer && kmlLayer.getStatus ? kmlLayer.getStatus() : 'UNKNOWN';
        if (status !== 'OK') {
          console.warn(`KML loading timeout - no fallback marker will be shown. Status: ${status}`);
          // Store the empty fallback layer for proper management
          setKmlLayers(prev => ({
            ...prev,
            [fileId]: fallbackDataLayer
          }));
        }
      }, 5000); // 5 second timeout
      
      kmlLayer.addListener('status_changed', () => {
        const status = kmlLayer.getStatus();
        clearTimeout(kmlLoadingTimeout); // Clear the timeout since we got a status
        
        if (status !== 'OK') {
          console.log(`KML rendering note: ${status} - No fallback marker will be shown`);
          
          // Update the layers map with the empty fallback
          setKmlLayers(prev => ({
            ...prev,
            [fileId]: fallbackDataLayer
          }));
          
          // Only show a message for certain error types
          if (status === 'LIMITS_EXCEEDED') {
            // This is an actual problem that needs user attention
            alert(`The KML file is too complex to render directly.`);
          }
        } else {
          console.log('Direct KML endpoint loaded successfully');
          
          // Update the layers map
          setKmlLayers(prev => ({
            ...prev,
            [fileId]: kmlLayer,
            processing: false
          }));
        }
      });
      
    } catch (error) {
      console.error('Error with direct KML endpoint:', error);
    }
  };

  const removeKmlLayer = (fileId) => {
    console.log(`Removing KML layer for file ID: ${fileId}`);
    
    // Check if this layer exists in our state
    if (kmlLayers[fileId]) {
      try {
        // Get a reference to the layer we're removing
        const layer = kmlLayers[fileId];
        console.log(`Found layer to remove:`, typeof layer);
        
        // Revoke blob URL if it exists to prevent memory leaks
        if (layer.blobUrl) {
          try {
            URL.revokeObjectURL(layer.blobUrl);
            console.log(`Revoked blob URL for layer ${fileId}`);
          } catch (e) {
            console.log(`Error revoking blob URL: ${e.message}`);
          }
        }
        
        // Close info window if it exists
        if (layer.infoWindow) {
          try {
            layer.infoWindow.close();
            console.log(`Closed info window for layer ${fileId}`);
          } catch (e) {
            console.log(`Error closing info window: ${e.message}`);
          }
        }
        
        // Remove all event listeners if possible
        if (layer.listeners && Array.isArray(layer.listeners)) {
          layer.listeners.forEach(listener => {
            try {
              window.google.maps.event.removeListener(listener);
            } catch (e) {
              console.log(`Error removing listener: ${e.message}`);
            }
          });
          console.log(`Removed event listeners for layer ${fileId}`);
        }
        
        // For Data layers, also try to clear all features
        if (layer instanceof window.google.maps.Data) {
          try {
            layer.forEach(feature => {
              layer.remove(feature);
            });
            console.log(`Removed all features from Data layer ${fileId}`);
          } catch (e) {
            console.log(`Error removing features: ${e.message}`);
          }
        }
        
        // Remove from map - the most important step
        try {
          if (typeof layer.setMap === 'function') {
            layer.setMap(null);
            console.log(`Removed layer ${fileId} from map`);
          } else {
            console.log(`Layer ${fileId} doesn't have setMap method, using alternative removal`);
            
            // For built-in Google Maps objects, try alternatives
            if (window.google?.maps) {
              // For Data layers, try setting null map
              if (layer instanceof window.google.maps.Data) {
                layer.setMap(null);
              }
              
              // For marker arrays, try to clear them
              if (layer.markers && Array.isArray(layer.markers)) {
                layer.markers.forEach(marker => {
                  if (marker && typeof marker.setMap === 'function') {
                    marker.setMap(null);
                  }
                });
              }
              
              // For KmlLayers, try a new instance
              if (layer instanceof window.google.maps.KmlLayer) {
                new window.google.maps.KmlLayer({ map: null });
              }
            }
          }
        } catch (e) {
          console.log(`Error removing layer from map: ${e.message}`);
        }
        
        // Clear any references to DOM elements
        if (layer.iframe) {
          try {
            if (document.body.contains(layer.iframe)) {
              document.body.removeChild(layer.iframe);
            }
            layer.iframe = null;
            console.log(`Removed iframe for layer ${fileId}`);
          } catch (e) {
            console.log(`Error removing iframe: ${e.message}`);
          }
        }
        
        console.log(`KML layer ${fileId} successfully removed and cleaned up`);
      } catch (error) {
        console.log(`Error cleaning up KML layer ${fileId}: ${error.message}`);
      }
      
      // Always update state to remove the layer reference
      setKmlLayers(prev => {
        const updated = { ...prev };
        delete updated[fileId];
        return updated;
      });
    } else {
      console.log(`No layer found for file ID: ${fileId}`);
    }
    
    // Force a refresh of map objects as a last resort
    try {
      if (mapRef?.current) {
        // This triggers Google Maps to re-render and often fixes stuck objects
        const currentCenter = mapRef.current.getCenter();
        const currentZoom = mapRef.current.getZoom();
        mapRef.current.setZoom(currentZoom - 0.0001);
        setTimeout(() => {
          mapRef.current.setZoom(currentZoom);
          mapRef.current.setCenter(currentCenter);
        }, 5);
      }
    } catch (e) {
      console.log(`Error refreshing map: ${e.message}`);
    }
  };

  // Function to load KML content from localStorage
  const loadLocalKmlLayer = (file) => {
    try {
      if (!mapRef?.current || !window.google?.maps) return;
      
      // Check if layer already exists and remove it first
      removeKmlLayer(file.id);
      
      console.log('Loading local KML content directly with enhanced renderer');
      
      // For local development, ALWAYS use the simpler parsing
      // Skip the Google Maps KML layer attempt entirely
      trySimpleKmlLayer(file.id, file.kmlContent);
      
    } catch (error) {
      console.log('Error loading local KML, trying fallback');
      trySimpleKmlLayer(file.id, file.kmlContent);
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
      try {
        // Safely remove all KML layers
        Object.keys(kmlLayers).forEach(fileId => {
          try {
            const layer = kmlLayers[fileId];
            
            // Check if layer exists and has expected methods
            if (layer) {
              // Revoke blob URL if it exists
              if (layer.blobUrl) {
                try {
                  URL.revokeObjectURL(layer.blobUrl);
                } catch (e) {
                  console.log('Error revoking blob URL:', e);
                }
              }
              
              // Close info window if it exists
              if (layer.infoWindow) {
                try {
                  layer.infoWindow.close();
                } catch (e) {
                  console.log('Error closing info window:', e);
                }
              }
              
              // Remove from map if setMap method exists
              if (typeof layer.setMap === 'function') {
                layer.setMap(null);
              } else {
                console.log(`Layer ${fileId} doesn't have setMap method`);
              }
            }
          } catch (layerError) {
            console.log(`Error cleaning up layer ${fileId}:`, layerError);
          }
        });
      } catch (cleanupError) {
        console.log('Error in cleanup function:', cleanupError);
      }
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

              <div className="kml-buttons-group">
                <button
                  onClick={handleUpload}
                  disabled={!selectedFile || isUploading}
                  className="save-button"
                >
                  {isUploading ? 'Uploading...' : 'Upload KML File'}
                </button>
                
                {/* Hidden button that only appears in development mode to purge orphaned test files */}
                {window.location.hostname === 'localhost' && (
                  <button 
                    onClick={() => {
                      if (window.confirm('This will purge all KML files saved in your browser. Continue?')) {
                        try {
                          // Remove all KML files for this user from localStorage
                          const localKmlFiles = JSON.parse(localStorage.getItem('kmlFiles') || '[]');
                          const otherUserFiles = localKmlFiles.filter(file => file.userId !== userId);
                          localStorage.setItem('kmlFiles', JSON.stringify(otherUserFiles));
                          
                          // Refresh the list
                          loadKmlFiles();
                          
                          alert('All local KML files have been purged. Only files stored in the database will be displayed.');
                        } catch (error) {
                          console.error('Error purging KML files:', error);
                          alert('Failed to purge KML files: ' + error.message);
                        }
                      }
                    }}
                    className="danger-button"
                  >
                    Purge Local Files
                  </button>
                )}
              </div>
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