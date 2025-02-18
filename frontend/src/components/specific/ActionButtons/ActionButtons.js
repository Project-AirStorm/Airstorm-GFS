import React, { useState } from 'react';
import PropTypes from 'prop-types';
import './ActionButtons.css';
import AddLocationPopup from '../AddLocationPopup/AddLocationPopup';

const ActionButtons = ({
  onTimeframeChange,
  onAddBase,
  timeframe = 'Week',
  onLocationAdded, // Add this prop
}) => {
  const [isPopupOpen, setIsPopupOpen] = useState(false);

  const handleAddBase = () => {
    setIsPopupOpen(true);
  };

  return (
    <>
      <div className="action-buttons-container">
        <button className="timeframe-button" onClick={onTimeframeChange}>
          {timeframe}
        </button>
        <button className="add-base-button" onClick={handleAddBase}>
          <span className="add-button-plus">+</span>
          <span className="add-button-text">Add Location</span>
        </button>
      </div>

      <AddLocationPopup
        isOpen={isPopupOpen}
        onClose={() => setIsPopupOpen(false)}
        onLocationAdded={onLocationAdded} // Pass the callback to AddLocationPopup
      />
    </>
  );
};

ActionButtons.propTypes = {
  onTimeframeChange: PropTypes.func.isRequired,
  onAddBase: PropTypes.func.isRequired,
  timeframe: PropTypes.string,
  onLocationAdded: PropTypes.func, // Add PropType for the new prop
};

export default ActionButtons;
