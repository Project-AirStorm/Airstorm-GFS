import React, { useState, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import { MapPin, ChevronDown, ChevronUp, Navigation } from 'lucide-react'; // Added Navigation for Current Location
import './DashboardLocationSelector.css';

const DashboardLocationSelector = ({
  locations = [], // Default to empty array
  selectedLocation,
  onSelectLocation,
  isLocationLoading,
  allowCurrentLocation = true // Prop to control if "Current Location" option is shown
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  const toggleDropdown = () => {
    if (!isLocationLoading) {
      setIsOpen(!isOpen);
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (location) => {
    onSelectLocation(location); // Pass the whole location object or null
    setIsOpen(false);
  };

  // Determine button text
  const getButtonText = () => {
    if (isLocationLoading) return 'Loading Locations...';
    if (selectedLocation) return selectedLocation.name || `${selectedLocation.latitude?.toFixed(4)}, ${selectedLocation.longitude?.toFixed(4)}`;
    if (allowCurrentLocation) return 'Current Location'; // Default to Current if allowed and nothing else selected
    return 'Select Location';
  };

  return (
    <div className="dashboard-location-selector-wrapper" ref={dropdownRef}>
      <button
        className="dashboard-location-selector-button"
        onClick={toggleDropdown}
        disabled={isLocationLoading}
        aria-expanded={isOpen}
        aria-haspopup="listbox" // Correct aria attribute
      >
        <MapPin size={16} className="location-icon" />
        <span>{getButtonText()}</span>
        {isOpen ? (
          <ChevronUp size={18} className="dropdown-arrow" />
        ) : (
          <ChevronDown size={18} className="dropdown-arrow" />
        )}
      </button>

      {isOpen && (
        <div className="dashboard-location-selector-menu" role="listbox">
          {allowCurrentLocation && (
            <button
              className="dashboard-location-selector-item"
              onClick={() => handleSelect(null)} // Select null for Current Location
              role="option"
              aria-selected={selectedLocation === null}
            >
              <Navigation size={16} className="location-icon" />
              <span className="location-name">Current Location</span>
            </button>
          )}
          {locations.length > 0 ? (
            locations.map((location) => {
              // Ensure lat/lon are numbers before using toFixed
              const latStr = typeof location.latitude === 'number' ? location.latitude.toFixed(4) : 'N/A';
              const lonStr = typeof location.longitude === 'number' ? location.longitude.toFixed(4) : 'N/A';
              return (
                <button
                  key={`${location.latitude}-${location.longitude}`}
                  className="dashboard-location-selector-item"
                  onClick={() => handleSelect(location)} // Pass the full location object
                  role="option"
                  aria-selected={selectedLocation?.latitude === location.latitude && selectedLocation?.longitude === location.longitude}
                >
                  <MapPin size={16} className="location-icon" />
                  {/* Use location.name directly as it's preferred */}
                  <span className="location-name">{location.name || 'Unnamed Location'}</span>
                  <span className="location-coords">({latStr}, {lonStr})</span>
                </button>
              );
            })
          ) : (
             !allowCurrentLocation && <div className="dashboard-location-selector-empty">No saved locations</div>
          )}
        </div>
      )}
    </div>
  );
};

DashboardLocationSelector.propTypes = {
  locations: PropTypes.arrayOf(PropTypes.shape({
      name: PropTypes.string, // Name might not always be present initially
      latitude: PropTypes.number.isRequired,
      longitude: PropTypes.number.isRequired,
      isFavorite: PropTypes.bool
  })),
  selectedLocation: PropTypes.shape({
      name: PropTypes.string,
      latitude: PropTypes.number,
      longitude: PropTypes.number
  }), // Can be null for Current Location
  onSelectLocation: PropTypes.func.isRequired,
  isLocationLoading: PropTypes.bool,
  allowCurrentLocation: PropTypes.bool
};

export default DashboardLocationSelector;