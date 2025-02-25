import React from 'react';
import PropTypes from 'prop-types';
import { 
  IoAdd, 
  IoChevronForward, 
  IoBookmark, 
  IoBookmarkOutline,
  IoLocation,
  IoRemove 
} from 'react-icons/io5';
import './LocationPanel.css';

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
  onDeleteLocation
}) => {
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
  onDeleteLocation: PropTypes.func.isRequired
};

export default LocationPanel;