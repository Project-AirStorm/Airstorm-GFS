import React from 'react';
import PropTypes from 'prop-types';

/**
 * ActionButtons component containing primary and secondary action buttons
 * @param {Object} props
 * @param {Function} props.onTimeframeChange - Callback for when timeframe button is clicked
 * @param {Function} props.onAddBase - Callback for when add base button is clicked
 * @param {string} props.timeframe - Current selected timeframe
 */
const ActionButtons = ({ onTimeframeChange, onAddBase, timeframe = 'Week' }) => {
  return (
    <div className="ml-auto flex items-center gap-4">
      <button 
        className="px-4 py-1 bg-white rounded border text-sm text-gray-600 hover:bg-gray-50 transition-colors"
        onClick={onTimeframeChange}
      >
        {timeframe}
      </button>
      <button 
        className="px-4 py-1 bg-blue-600 text-white rounded flex items-center gap-2 text-sm hover:bg-blue-700 transition-colors"
        onClick={onAddBase}
      >
        <span className="text-lg">+</span>
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