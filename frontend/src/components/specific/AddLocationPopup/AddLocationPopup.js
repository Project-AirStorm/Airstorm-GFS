import React, { useState, useEffect, useRef } from 'react';
import { Star, X } from 'lucide-react';
import { useUser } from '@clerk/clerk-react';
import _ from 'lodash';
import axios from 'axios';

const REACT_APP_API_URL = process.env.REACT_APP_API_URL;

const AddLocationPopup = ({ isOpen, onClose, onLocationAdded }) => {
  const { isLoaded: userLoaded, user } = useUser();
  const [searchInput, setSearchInput] = useState('');
  const [predictions, setPredictions] = useState([]);
  const [isFavorite, setIsFavorite] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedPlace, setSelectedPlace] = useState(null);

  // Create a debounced function for API calls
  const debouncedFetchPredictions = useRef(
    _.debounce(async (input) => {
      if (!input) {
        setPredictions([]);
        return;
      }

      try {
        const response = await axios.get(
          `${REACT_APP_API_URL}/api/places/autocomplete`,
          {
            params: { input },
          }
        );

        if (response.data.predictions) {
          setPredictions(response.data.predictions);
        }
      } catch (err) {
        // console.error('Error fetching predictions:', err);
        // setError('Failed to fetch location suggestions');
      }
    }, 300)
  ).current;

  useEffect(() => {
    if (!isOpen) {
      setSearchInput('');
      setPredictions([]);
      setSelectedPlace(null);
      setError('');
    }
  }, [isOpen]);

  useEffect(() => {
    debouncedFetchPredictions(searchInput);
  }, [searchInput, debouncedFetchPredictions]);

  const handlePlaceSelect = async (prediction) => {
    try {
      setIsLoading(true);
      const response = await axios.get(
        `${REACT_APP_API_URL}/api/places/details`,
        {
          params: { placeId: prediction.place_id },
        }
      );

      if (response.data.result) {
        const place = response.data.result;
        setSelectedPlace({
          name: place.name,
          formatted_address: place.formatted_address,
          geometry: place.geometry,
        });
        setSearchInput(place.formatted_address);
        setPredictions([]);
      }
    } catch (err) {
      // console.error('Error fetching place details:', err);
      // setError('Failed to get location details');
    } finally {
      setIsLoading(false);
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
        latitude: selectedPlace.geometry.location.lat,
        longitude: selectedPlace.geometry.location.lng,
        isFavorite,
      };

      const response = await axios.post(
        `${REACT_APP_API_URL}/api/locations`,
        locationData
      );

      if (response.data) {
        setSuccessMessage('Location added successfully!');

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
      }
    } catch (err) {
      // console.error('Save error:', err);
      // setError(err.response?.data?.error || 'Failed to save location');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-96 relative">
        <button
          onClick={onClose}
          className="absolute top-6 right-6 text-gray-500 hover:text-gray-700"
        >
          <X className="w-6 h-6" />
        </button>

        <h2 className="text-xl font-semibold mb-4">Add New Location</h2>

        <div className="mb-4 relative">
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search for a location..."
            className="w-full p-2 border border-gray-300 rounded"
            disabled={isLoading}
          />

          {predictions.length > 0 && (
            <div className="absolute w-full mt-1 bg-white border border-gray-300 rounded shadow-lg z-10 max-h-60 overflow-y-auto">
              {predictions.map((prediction) => (
                <div
                  key={prediction.place_id}
                  onClick={() => handlePlaceSelect(prediction)}
                  className="p-2 hover:bg-gray-100 cursor-pointer"
                >
                  {prediction.description}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex items-center mb-4">
          <button
            onClick={() => setIsFavorite(!isFavorite)}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-800"
          >
            <Star
              className={`w-5 h-5 ${
                isFavorite ? 'fill-yellow-400 text-yellow-400' : ''
              }`}
            />
            {isFavorite ? 'Favorited' : 'Add to Favorites'}
          </button>
        </div>

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
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
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
