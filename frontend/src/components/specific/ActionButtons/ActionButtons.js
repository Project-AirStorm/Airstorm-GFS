import React from 'react';
import PropTypes from 'prop-types';
import './ActionButtons.css';

/**
 * ActionButtons component containing primary and secondary action buttons
 * @param {Object} props
 * @param {Function} props.onTimeframeChange - Callback for when timeframe button is clicked
 * @param {Function} props.onAddBase - Callback for when add base button is clicked
 * @param {string} props.timeframe - Current selected timeframe
 */
const ActionButtons = ({ onTimeframeChange, onAddBase, timeframe = 'Week' }) => {
  return (
    <div className="action-buttons-container">
      <button 
        className="timeframe-button"
        onClick={onTimeframeChange}
      >
        {timeframe}
      </button>
      <button 
        className="add-base-button"
        onClick={onAddBase}
      >
        <span className="add-button-plus">+</span>
        Add New Base
      </button>
    </div>
  );
};

ActionButtons.propTypes = {
  onTimeframeChange: PropTypes.func.isRequired,
  onAddBase: PropTypes.func.isRequired,
  timeframe: PropTypes.string
};

export default ActionButtons;