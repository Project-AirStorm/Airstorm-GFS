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
  
  // Reference to track if this is the initial mount of the component
  const isInitialMountRef = useRef(true);
  
  // Handle KML files initialization and state management
  useEffect(() => {
    if (!userId) return;
    
    if (kmlFiles.length > 0) {
      // Get current active state for each file to preserve
      // This helps maintain consistent state across tab switches
      const currentActiveState = {};
      kmlFiles.forEach(file => {
        currentActiveState[file.id] = !!file.isActive;
      });
      
      // Don't reset active state on non-initial renders to prevent flashing
      if (isInitialMountRef.current) {
        console.log('Initial KML files load - ensuring proper active states');
        isInitialMountRef.current = false;
        
        // Keep track of which files had their active state forced to false
        const changedFiles = [];
        
        const updatedFiles = kmlFiles.map(file => {
          // Check if layer exists - if it does, keep its active state
          const hasKmlLayer = kmlLayers[file.id] !== undefined;
          
          // For consistency, if a file is marked active but has no layer, 
          // or is marked inactive but has a layer, update it
          if (file.isActive && !hasKmlLayer) {
            changedFiles.push(file.id);
            return { ...file, isActive: false };
          } else if (!file.isActive && hasKmlLayer) {
            changedFiles.push(file.id);
            return { ...file, isActive: true };
          }
          
          return file;
        });
        
        // Only update if needed to prevent infinite loops
        if (changedFiles.length > 0) {
          console.log(`Fixed active state for ${changedFiles.length} KML files`);
          setKmlFiles(updatedFiles);
          
          // Also update localStorage if in development mode
          if (window.location.hostname === 'localhost') {
            try {
              const localKmlFiles = JSON.parse(localStorage.getItem('kmlFiles') || '[]');
              const updatedLocalFiles = localKmlFiles.map(file => {
                if (changedFiles.includes(file.id)) {
                  // Only update changed files
                  const matchingFile = updatedFiles.find(f => f.id.toString() === file.id.toString());
                  return { 
                    ...file, 
                    isActive: matchingFile ? matchingFile.isActive : false,
                    lastAccessed: new Date().toISOString()
                  };
                }
                return file;
              });
              localStorage.setItem('kmlFiles', JSON.stringify(updatedLocalFiles));
            } catch (error) {
              console.log('Error updating localStorage KML files:', error);
            }
          }
        }
      }
    }
  }, [userId, kmlFiles.length, kmlLayers]);

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
      if (!userId || !mapRef?.current) {
        console.log('Cannot toggle KML: missing user ID or map reference');
        return;
      }
      
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
      
      // Determine new active state
      const newActiveState = !fileToToggle.isActive;
      
      // Create a placeholder layer with a setMap method to prevent errors
      const placeholderLayer = {
        setMap: function() { console.log('Placeholder setMap called'); },
        processing: true
      };
      
      // First handle local state - safely update kmlLayers with the placeholder
      setKmlLayers(prev => {
        const updated = {...prev};
        
        // If turning off, completely remove the layer from state to ensure clean toggle
        if (!newActiveState && updated[fileId]) {
          delete updated[fileId];
          return updated;
        }
        
        // If turning on, add placeholder
        if (newActiveState) {
          return {
            ...updated,
            [fileId]: { 
              ...(updated[fileId] || {}),
              ...placeholderLayer
            }
          };
        }
        
        return updated;
      });
      
      // Update files state immediately to reflect toggle in UI
      const updatedFiles = kmlFiles.map(file => {
        if (file.id.toString() === fileId.toString()) {
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
              return { ...file, isActive: newActiveState };
            }
            return file;
          });
          localStorage.setItem('kmlFiles', JSON.stringify(updatedLocalFiles));
          console.log('Updated local storage KML active state');
        } catch (localStorageError) {
          console.log('Could not update localStorage:', localStorageError.message);
        }
      }
      
      // Handle the actual layer rendering or removal
      if (newActiveState) {
        // If toggling on, add KML layer to map
        try {
          console.log(`Adding KML layer for file: ${fileToToggle.fileName} (ID: ${fileId})`);
          
          // Make sure any existing layer is completely removed first (clean slate)
          removeKmlLayer(fileId);
          
          // Check if we have local content or need to fetch from backend
          if (fileToToggle.kmlContent) {
            console.log('Using local KML content for rendering');
            await loadLocalKmlLayer(fileToToggle);
          } else {
            console.log('Loading KML from backend');
            await loadKmlLayer(fileId);
          }
          
          console.log(`Successfully added KML layer for file: ${fileToToggle.fileName}`);
        } catch (renderError) {
          console.log('Error during KML rendering, using fallback:', renderError);
          
          // Try alternate method if error occurs
          try {
            if (fileToToggle.kmlContent) {
              // Try backend for local file
              await loadKmlLayer(fileId);
            } else {
              // Fetch content and use direct rendering
              const response = await axios.get(
                `${REACT_APP_API_URL}/api/kml-files/${fileId}?userId=${userId}&format=raw`
              );
              if (response.data && response.data.kmlContent) {
                trySimpleKmlLayer(fileId, response.data.kmlContent);
              }
            }
          } catch (fallbackError) {
            console.error('All rendering methods failed:', fallbackError);
            
            // Revert UI state if all rendering methods fail
            setKmlFiles(kmlFiles.map(file => {
              if (file.id.toString() === fileId.toString()) {
                return { ...file, isActive: false };
              }
              return file;
            }));
          }
        }
      } else {
        // If toggling off, remove KML layer
        console.log('Removing KML layer - toggling visibility off');
        
        // Call removal function multiple times to ensure complete cleanup
        removeKmlLayer(fileId);
        
        // Schedule additional removal with delay to catch any stuck objects
        setTimeout(() => {
          removeKmlLayer(fileId);
        }, 100);
      }
      
      // Try to update the backend even in development mode
      try {
        console.log(`Sending toggle request to backend for KML file ${fileId}`);
        const response = await axios.post(`${REACT_APP_API_URL}/api/kml-files/${fileId}/toggle`, {
          userId: userId,
          isActive: newActiveState
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
      console.error('Error toggling KML visibility:', error);
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
      if (!mapRef?.current || !window.google?.maps) {
        console.log('Map not available for KML loading');
        return;
      }
      
      console.log(`Starting to load KML file ${fileId}`);
      
      // First, ensure any existing layer is completely removed
      await new Promise(resolve => {
        // Call removeKmlLayer and wait a moment to ensure cleanup is complete
        removeKmlLayer(fileId);
        setTimeout(resolve, 50);
      });
      
      // Check if we're in local development
      const isLocalDev = window.location.hostname === 'localhost';
      
      // Mark this layer as processing to prevent duplicate loading attempts
      setKmlLayers(prev => ({
        ...prev,
        [fileId]: { 
          processing: true,
          setMap: function() { console.log('Processing placeholder setMap called'); }
        }
      }));
      
      // Get the raw KML content
      const timestamp = new Date().getTime();
      console.log(`Fetching KML content for file ${fileId}`);
      
      const response = await axios.get(
        `${REACT_APP_API_URL}/api/kml-files/${fileId}?userId=${userId}&format=raw&t=${timestamp}`,
        { timeout: 10000 } // Add timeout to prevent indefinite hanging
      );
      
      if (!response.data || !response.data.kmlContent) {
        throw new Error('Invalid KML content received from server');
      }
      
      // Get the KML content
      const kmlContent = response.data.kmlContent;
      
      // For local development, always use our custom renderer for more control
      if (isLocalDev) {
        console.log('Using enhanced renderer for KML (development mode)');
        await trySimpleKmlLayer(fileId, kmlContent);
        return;
      }
      
      // In production, try Google Maps KML layer first
      try {
        console.log('Loading KML with Google Maps KML layer (production mode)');
        
        // Create a blob from the KML content
        const blob = new Blob([kmlContent], {type: 'application/vnd.google-earth.kml+xml'});
        const blobUrl = URL.createObjectURL(blob);
        
        // Create a promise to handle the KML layer loading
        const kmlLayerPromise = new Promise((resolve, reject) => {
          try {
            const kmlLayer = new window.google.maps.KmlLayer({
              url: blobUrl,
              map: mapRef.current,
              preserveViewport: true,
              suppressInfoWindows: false
            });
            
            // Store reference to revoke URL later
            kmlLayer.blobUrl = blobUrl;
            
            // Add listener to resolve once status is known
            const statusListener = kmlLayer.addListener('status_changed', () => {
              const status = kmlLayer.getStatus();
              
              if (status === 'OK') {
                console.log(`Google KML layer loaded successfully for ${fileId}`);
                resolve(kmlLayer);
              } else {
                console.log(`Google KML layer failed with status ${status}, using fallback for ${fileId}`);
                reject(new Error(`KML status: ${status}`));
                
                // Remove the failed layer from map
                kmlLayer.setMap(null);
                
                // Try to revoke the blob URL since we're not using it
                try {
                  URL.revokeObjectURL(blobUrl);
                } catch (e) {}
              }
              
              // Remove the listener to prevent memory leaks
              window.google.maps.event.removeListener(statusListener);
            });
            
            // Add timeout to avoid waiting too long for status_changed
            setTimeout(() => {
              const status = kmlLayer.getStatus();
              if (status !== 'OK') {
                reject(new Error(`KML loading timeout, status: ${status}`));
              }
            }, 5000);
          } catch (e) {
            reject(e);
          }
        });
        
        // Wait for the KML layer to load or fail
        const kmlLayer = await kmlLayerPromise;
        
        // Update state with the successful layer
        setKmlLayers(prev => ({
          ...prev,
          [fileId]: kmlLayer
        }));
        
        return;
      } catch (googleKmlError) {
        console.log('Google KML layer failed, using enhanced renderer fallback:', googleKmlError.message);
        // Continue to fallback rendering
      }
      
      // If we get here, Google KML layer failed - use our custom renderer
      await trySimpleKmlLayer(fileId, kmlContent);
      
    } catch (error) {
      console.error('Error loading KML layer:', error);
      
      // Clear the processing state and mark layer as inactive
      setKmlLayers(prev => {
        const updated = {...prev};
        if (updated[fileId]) delete updated[fileId];
        return updated;
      });
      
      // Also update the KML files state to reflect failed loading
      setKmlFiles(prev => prev.map(file => {
        if (file.id.toString() === fileId.toString()) {
          return {...file, isActive: false};
        }
        return file;
      }));
      
      // Try one more fallback approach
      try {
        console.log('Attempting direct KML endpoint as last resort');
        tryDirectKmlEndpoint(fileId);
      } catch (fallbackError) {
        console.error('All KML rendering methods failed');
      }
    }
  };
  
  // Improved approach - extract coordinates and draw them directly
  const trySimpleKmlLayer = (fileId, kmlContent) => {
    try {
      if (!mapRef?.current) return;
      
      console.log('Using enhanced KML rendering...');
      
      // Find the KML file metadata for better tooltips
      const currentFile = kmlFiles.find(file => file.id.toString() === fileId.toString());
      const fileName = currentFile?.fileName || 'KML File';
      const fileDescription = currentFile?.description || '';
      
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
                      properties: { 
                        name, 
                        description,
                        fileName: fileName,
                        fileDescription: fileDescription
                      }
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
                  properties: { 
                    name, 
                    description,
                    fileName: fileName,
                    fileDescription: fileDescription
                  }
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
            content += '<style>.gm-ui-hover-effect {display: none !important;}</style>';
            
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
                  geometry: new window.google.maps.Data.Polygon([path]),
                  properties: {
                    fileName: fileName,
                    fileDescription: fileDescription
                  }
                }));
              } else {
                // Otherwise add as line
                dataLayer.add(new window.google.maps.Data.Feature({
                  geometry: new window.google.maps.Data.LineString(path),
                  properties: {
                    fileName: fileName,
                    fileDescription: fileDescription
                  }
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
                  geometry: new window.google.maps.Data.Point(new window.google.maps.LatLng(lat, lng)),
                  properties: {
                    fileName: fileName,
                    fileDescription: fileDescription
                  }
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
          
          // Get the file information added earlier
          const fileName = feature.getProperty('fileName') || 'KML File';
          const fileDescription = feature.getProperty('fileDescription') || '';
          
          // Get the feature type and coordinates
          const featureType = feature.getGeometry().getType();
          const position = event.latLng;
          const coordinates = `${position.lat().toFixed(5)}, ${position.lng().toFixed(5)}`;
          
          // Try to get name and description from the KML data
          const name = feature.getProperty('name') || '';
          const description = feature.getProperty('description') || '';
          
          // Build info content
          let infoContent = '<div style="max-width: 280px;">';
          
          // Add file information
          infoContent += `<div style="font-size: 12px; color: #888; margin-bottom: 5px;">From: ${fileName}</div>`;
          
          // Add name if available
          if (name) {
            infoContent += `<h3 style="margin: 0; font-size: 16px;">${name}</h3>`;
          }
          
          // Add coordinates
          infoContent += `<div style="font-size: 12px; color: #555; margin-top: 3px;">${coordinates}</div>`;
          
          // Add description if available
          if (description) {
            infoContent += `<div style="margin-top: 5px;">${description}</div>`;
          }
          
          // Add file description if available and different from element description
          if (fileDescription && fileDescription !== description) {
            infoContent += `<div style="margin-top: 8px; font-style: italic; font-size: 12px; color: #666;">${fileDescription}</div>`;
          }
          
          // Close the div and add CSS to hide the close button
          infoContent += '</div>';
          infoContent += '<style>.gm-ui-hover-effect {display: none !important;}</style>';
          
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
      
      // Find the KML file metadata for better tooltips
      const currentFile = kmlFiles.find(file => file.id.toString() === fileId.toString());
      const fileName = currentFile?.fileName || 'KML File';
      const fileDescription = currentFile?.description || '';
      
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
    
    // Safely check for Google Maps API availability
    if (!window.google?.maps || !mapRef?.current) {
      console.log('Google Maps not available for layer removal');
      
      // Still clean up state even if Google Maps isn't available
      setKmlLayers(prev => {
        const updated = { ...prev };
        if (updated[fileId]) delete updated[fileId];
        return updated;
      });
      
      return;
    }
    
    // Create a local copy of the layer to avoid race conditions with state updates
    const layer = kmlLayers[fileId];
    
    // If no layer exists in our state, just return
    if (!layer) {
      console.log(`No layer found for file ID: ${fileId}`);
      return;
    }
    
    try {
      console.log(`Found layer to remove, type:`, typeof layer);
      
      // STEP 1: Remove event listeners (should be done before any other cleanup)
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
      
      // STEP 2: Close info windows
      if (layer.infoWindow) {
        try {
          layer.infoWindow.close();
          console.log(`Closed info window for layer ${fileId}`);
        } catch (e) {
          console.log(`Error closing info window: ${e.message}`);
        }
      }
      
      // STEP 3: For Google Maps Data layers, clear all features
      if (layer instanceof window.google.maps.Data) {
        try {
          layer.forEach(feature => {
            try {
              layer.remove(feature);
            } catch (err) {
              console.log(`Error removing feature: ${err.message}`);
            }
          });
          console.log(`Removed all features from Data layer ${fileId}`);
        } catch (e) {
          console.log(`Error accessing features: ${e.message}`);
        }
      }
      
      // STEP 4: Remove layer from map - the most important step
      try {
        if (typeof layer.setMap === 'function') {
          layer.setMap(null);
          console.log(`Removed layer ${fileId} from map`);
        } else {
          console.log(`Layer ${fileId} doesn't have setMap method, using alternative removal`);
          
          // For built-in Google Maps objects, try alternatives
          if (window.google?.maps) {
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
      
      // STEP 5: Revoke blob URL if it exists (after layer is removed from map)
      if (layer.blobUrl) {
        try {
          URL.revokeObjectURL(layer.blobUrl);
          console.log(`Revoked blob URL for layer ${fileId}`);
        } catch (e) {
          console.log(`Error revoking blob URL: ${e.message}`);
        }
      }
      
      // STEP 6: Clear any references to DOM elements
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
      console.error(`Error cleaning up KML layer ${fileId}:`, error);
    } finally {
      // STEP 7: ALWAYS update state to remove the layer reference, regardless of errors
      setKmlLayers(prev => {
        const updated = { ...prev };
        if (updated[fileId]) delete updated[fileId];
        return updated;
      });
      
      // STEP 8: Force a refresh of map objects as a last resort
      try {
        if (mapRef?.current) {
          // This triggers Google Maps to re-render and often fixes stuck objects
          const currentCenter = mapRef.current.getCenter();
          const currentZoom = mapRef.current.getZoom();
          
          // Microscopically change zoom level to trigger redraw without user noticing
          mapRef.current.setZoom(currentZoom - 0.0001);
          
          // Restore original zoom after a short delay
          setTimeout(() => {
            mapRef.current.setZoom(currentZoom);
            mapRef.current.setCenter(currentCenter);
          }, 50);
        }
      } catch (e) {
        console.log(`Error refreshing map: ${e.message}`);
      }
    }
  };

  // Function to load KML content from localStorage
  const loadLocalKmlLayer = async (file) => {
    try {
      if (!mapRef?.current || !window.google?.maps) {
        console.log('Map not available for local KML loading');
        return;
      }
      
      const fileId = file.id.toString();
      console.log(`Loading local KML file: ${file.fileName} (ID: ${fileId})`);
      
      // First, ensure any existing layer is completely removed
      await new Promise(resolve => {
        // Call removeKmlLayer and wait a moment to ensure cleanup is complete
        removeKmlLayer(fileId);
        setTimeout(resolve, 50);
      });
      
      // Mark this layer as processing to prevent duplicate loading attempts
      setKmlLayers(prev => ({
        ...prev,
        [fileId]: { 
          processing: true,
          setMap: function() { console.log('Processing placeholder setMap called'); }
        }
      }));
      
      console.log('Loading local KML content with enhanced renderer');
      
      // Always use our own renderer for local KML content for better control
      await trySimpleKmlLayer(fileId, file.kmlContent);
      
    } catch (error) {
      console.error('Error loading local KML:', error);
      
      // Clear the processing state and mark layer as inactive
      setKmlLayers(prev => {
        const updated = {...prev};
        if (updated[file.id]) delete updated[file.id];
        return updated;
      });
      
      // Also update the KML files state to reflect failed loading
      setKmlFiles(prev => prev.map(kmlFile => {
        if (kmlFile.id.toString() === file.id.toString()) {
          return {...kmlFile, isActive: false};
        }
        return kmlFile;
      }));
    }
  };

  // Load active KML layers when map or kmlFiles change
  useEffect(() => {
    // Guard against invalid map or missing kmlFiles
    if (!mapRef?.current || !window.google?.maps) {
      console.log('Map not ready yet for KML layers');
      return;
    }
    
    if (kmlFiles.length === 0) {
      console.log('No KML files to process');
      return;
    }
    
    console.log('Loading active KML layers...');
    
    // Initialize a set to track files that should be active
    const activeFileIds = new Set();
    
    // Create a debounced function for processing layers
    // This prevents too many simultaneous operations
    const processQueue = [];
    let processingQueue = false;
    
    const processNextInQueue = async () => {
      if (processQueue.length === 0) {
        processingQueue = false;
        return;
      }
      
      processingQueue = true;
      const nextItem = processQueue.shift();
      
      try {
        await nextItem.action();
      } catch (error) {
        console.error(`Error processing queued KML operation:`, error);
      } finally {
        // Process next item after a short delay to avoid overwhelming the browser
        setTimeout(() => processNextInQueue(), 50);
      }
    };
    
    const queueOperation = (action, priority = false) => {
      const queueItem = { action };
      if (priority) {
        processQueue.unshift(queueItem);
      } else {
        processQueue.push(queueItem);
      }
      
      if (!processingQueue) {
        processNextInQueue();
      }
    };
    
    // First, identify all layers that should be active or inactive
    kmlFiles.forEach(file => {
      const fileId = file.id.toString();
      const existingLayer = kmlLayers[fileId];
      const shouldBeActive = file.isActive;
      
      if (shouldBeActive) {
        activeFileIds.add(fileId);
        
        // If file should be active but no layer exists, load it
        if (!existingLayer) {
          console.log(`Loading active KML file: ${fileId} - ${file.fileName}`);
          
          queueOperation(async () => {
            try {
              // Check if this is a local file (has kmlContent) or backend file
              if (file.kmlContent) {
                await loadLocalKmlLayer(file);
              } else {
                await loadKmlLayer(fileId);
              }
            } catch (error) {
              console.error(`Error loading KML layer ${fileId}:`, error);
            }
          });
        }
      } else {
        // If file should NOT be active but a layer exists, remove it
        if (existingLayer) {
          console.log(`Removing inactive KML file: ${fileId} - ${file.fileName}`);
          
          queueOperation(() => {
            removeKmlLayer(fileId);
          }, true); // Priority true for removals to free up resources faster
        }
      }
    });
    
    // Check for any orphaned layers (layers without corresponding active files)
    Object.keys(kmlLayers).forEach(fileId => {
      if (!activeFileIds.has(fileId)) {
        console.log(`Removing orphaned KML layer: ${fileId}`);
        queueOperation(() => {
          removeKmlLayer(fileId);
        }, true); // Priority true for orphaned layers
      }
    });
    
    // Cleanup function to remove all layers when component unmounts
    return () => {
      console.log('Cleaning up all KML layers on unmount');
      
      try {
        // First, empty the processing queue to prevent operations after unmount
        processQueue.length = 0;
        
        // Safely remove all KML layers
        const layersToRemove = {...kmlLayers};
        Object.keys(layersToRemove).forEach(fileId => {
          try {
            const layer = layersToRemove[fileId];
            
            // Skip if layer doesn't exist
            if (!layer) return;
            
            // Clear all resources in proper order
            
            // 1. Remove event listeners
            if (layer.listeners && Array.isArray(layer.listeners)) {
              layer.listeners.forEach(listener => {
                try {
                  window.google.maps.event.removeListener(listener);
                } catch (e) {}
              });
            }
            
            // 2. Close info windows
            if (layer.infoWindow) {
              try {
                layer.infoWindow.close();
              } catch (e) {}
            }
            
            // 3. Remove from map
            try {
              if (typeof layer.setMap === 'function') {
                layer.setMap(null);
              }
            } catch (e) {}
            
            // 4. Revoke blob URLs
            if (layer.blobUrl) {
              try {
                URL.revokeObjectURL(layer.blobUrl);
              } catch (e) {}
            }
            
            // 5. Remove DOM elements
            if (layer.iframe && document.body.contains(layer.iframe)) {
              try {
                document.body.removeChild(layer.iframe);
              } catch (e) {}
            }
          } catch (layerError) {
            console.log(`Error cleaning up layer ${fileId}:`, layerError);
          }
        });
        
        // Clear kmlLayers state
        setKmlLayers({});
      } catch (cleanupError) {
        console.error('Error in cleanup function:', cleanupError);
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