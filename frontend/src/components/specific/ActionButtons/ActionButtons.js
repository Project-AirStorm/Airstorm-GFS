import React, { useState } from 'react';
import PropTypes from 'prop-types';
import './ActionButtons.css';
import AddLocationPopup from '../AddLocationPopup/AddLocationPopup';

/**
 * ActionButtons component containing primary and secondary action buttons
 * @param {Object} props
 * @param {Function} props.onTimeframeChange - Callback for when timeframe button is clicked
 * @param {Function} props.onAddBase - Callback for when add base button is clicked
 * @param {string} props.timeframe - Current selected timeframe
 * @param {Function} props.onLocationAdded - Callback function when a location is added
 */
const ActionButtons = ({ onTimeframeChange, onAddBase, timeframe = 'Week', onLocationAdded }) => {
  const [isPopupOpen, setIsPopupOpen] = useState(false);

  const handleAddBase = () => {
    setIsPopupOpen(true);
    onAddBase(); // Keeping compatibility with legacy functionality
  };

  return (
    <>
      <div className="action-buttons-container">
        {/* Timeframe button commented out but preserved for future use
        <button 
          className="timeframe-button"handleAddBase
          onClick={onTimeframeChange}
        >
          {timeframe}
        </button>
        */}
        <button 
          className="add-base-button"
          onClick={handleAddBase}
        >
          <span className="add-button-plus">+</span>
          Add New Location
        </button>
      </div>
      <AddLocationPopup
        isOpen={isPopupOpen}
        onClose={() => setIsPopupOpen(false)}
        onLocationAdded={onLocationAdded}
      />
    </>
  );
};

ActionButtons.propTypes = {
  onTimeframeChange: PropTypes.func.isRequired,
  onAddBase: PropTypes.func.isRequired,
  timeframe: PropTypes.string,
  onLocationAdded: PropTypes.func,
};

export default ActionButtons;
