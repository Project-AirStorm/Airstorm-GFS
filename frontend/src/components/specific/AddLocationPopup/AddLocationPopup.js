import React, { useState, useEffect } from 'react';
import { Star, X } from 'lucide-react';
import { useUser } from '@clerk/clerk-react';

const AddLocationPopup = ({ isOpen, onClose, onLocationAdded }) => {
  const { isLoaded: userLoaded, user } = useUser();
  const [searchInput, setSearchInput] = useState('');
  const [isFavorite, setIsFavorite] = useState(false);
  const [autocomplete, setAutocomplete] = useState(null);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPlace, setSelectedPlace] = useState(null);

  useEffect(() => {
    if (!isOpen) return;

    const loadGoogleMaps = async () => {
      try {
        setIsLoading(true);
        setError('');

        // Check if script is already loaded
        if (!window.google) {
          const script = document.createElement('script');
          script.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.REACT_APP_GOOGLE_MAPS_API_KEY}&libraries=places`;
          script.async = true;

          await new Promise((resolve, reject) => {
            script.onload = resolve;
            script.onerror = () =>
              reject(new Error('Failed to load Google Maps'));
            document.head.appendChild(script);
          });
        }

        // Initialize autocomplete
        initAutocomplete();
        setIsLoading(false);
      } catch (err) {
        console.error('Google Maps initialization error:', err);
        setError('Failed to initialize location search');
        setIsLoading(false);
      }
    };

    loadGoogleMaps();

    // Cleanup function
    return () => {
      setSearchInput('');
      setSelectedPlace(null);
      setError('');
    };
  }, [isOpen]);

  const initAutocomplete = () => {
    try {
      const input = document.getElementById('location-search');
      if (!input || !window.google?.maps?.places) return;

      const options = {
        types: ['(cities)'],
      };

      const autoCompleteInstance = new window.google.maps.places.Autocomplete(
        input,
        options
      );

      autoCompleteInstance.addListener('place_changed', () => {
        const place = autoCompleteInstance.getPlace();
        if (place.geometry) {
          setSelectedPlace(place);
          setSearchInput(place.formatted_address || place.name);
        } else {
          setSelectedPlace(null);
          setError('Please select a location from the dropdown');
        }
      });

      setAutocomplete(autoCompleteInstance);
    } catch (err) {
      console.error('Autocomplete initialization error:', err);
      setError('Failed to initialize location search');
    }
  };

  const handleSaveLocation = async () => {
    try {
      if (!userLoaded || !user) {
        setError('Please ensure you are logged in.');
        return;
      }

      if (!selectedPlace?.geometry) {
        setError('Please select a valid location from the dropdown');
        return;
      }

      const locationData = {
        userId: user.id,
        name: selectedPlace.name,
        latitude: selectedPlace.geometry.location.lat(),
        longitude: selectedPlace.geometry.location.lng(),
        isFavorite,
      };

      console.log('Sending location data:', locationData);

      const response = await fetch('http://localhost:5001/api/locations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(locationData),
      });

      const data = await response.json();
      console.log('Response from server:', data);

      if (!response.ok) {
        throw new Error(data.error || `Server error: ${response.status}`);
      }

      setSuccessMessage('Location added successfully!');

      // Call the onLocationAdded callback if provided
      if (onLocationAdded) {
        onLocationAdded();
      }

      setTimeout(() => {
        onClose();
        setSearchInput('');
        setSelectedPlace(null);
        setIsFavorite(false);
        setSuccessMessage('');
      }, 1500);
    } catch (err) {
      console.error('Save error:', err);
      setError(err.message || 'Failed to save location');
    }
  };

  const handleInputChange = (e) => {
    setSearchInput(e.target.value);
    // Clear selected place when user starts typing again
    if (selectedPlace) {
      setSelectedPlace(null);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-96 relative">
        <button
          onClick={onClose}
          className="absolute top-6 right-6 text-black-500 hover:text-black-700 text-xl font-bold hover:bg-gray-100 rounded"
        >
          <X className="w-6 h-6" />
        </button>

        <h2 className="text-xl font-semibold mb-4">Add New Location</h2>

        {isLoading ? (
          <div className="text-center py-4">Loading location search...</div>
        ) : (
          <>
            <div className="mb-4">
              <input
                id="location-search"
                type="text"
                value={searchInput}
                onChange={handleInputChange}
                placeholder="Search for a location..."
                className="w-full p-2 border border-gray-300 rounded"
                disabled={isLoading}
              />
            </div>

            <div className="flex items-center mb-4">
              <button
                onClick={() => setIsFavorite(!isFavorite)}
                className="flex items-center gap-2 text-gray-600 hover:text-gray-800"
                disabled={isLoading}
              >
                <Star
                  className={`w-5 h-5 ${
                    isFavorite ? 'fill-yellow-400 text-yellow-400' : ''
                  }`}
                />
                {isFavorite ? 'Favorited' : 'Add to Favorites'}
              </button>
            </div>
          </>
        )}

        {error && (
          <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">
            {error}
          </div>
        )}

        {successMessage && (
          <div className="mb-4 p-3 bg-green-100 text-green-700 rounded">
            {successMessage}
          </div>
        )}

        <div className="flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded"
          >
            Cancel
          </button>
          <button
            onClick={handleSaveLocation}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            disabled={isLoading || !selectedPlace}
          >
            Add Location
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddLocationPopup;
