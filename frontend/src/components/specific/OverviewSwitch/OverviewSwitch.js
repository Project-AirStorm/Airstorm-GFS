import React from 'react';
import PropTypes from 'prop-types';
import './OverviewSwitch.css';

/**
 * OverviewSwitch component for toggling between overview and detailed views
 * @component
 * @param {Object} props
 * @param {string} props.activeView - Currently active view ('overview' or 'detailed')
 * @param {Function} props.onViewChange - Callback function when view is changed
 */
const OverviewSwitch = ({ activeView, onViewChange }) => {
  return (
    <div className="overview-switch-section">
      <div  className="overview-switch-buttons" > 

        <button 
          className={`overview-switch-button ${activeView === 'overview' ? 'active' : ''}`}
          onClick={() => onViewChange('overview')}
        >
          Overview
        </button>
        <button 
          className={`overview-switch-button ${activeView === 'detailed' ? 'active' : ''}`}
          onClick={() => onViewChange('detailed')}
        >
          Detailed
        </button>

      </div>
    </div>
  );
};

OverviewSwitch.propTypes = {
  activeView: PropTypes.oneOf(['overview', 'detailed']).isRequired,
  onViewChange: PropTypes.func.isRequired
};

export default OverviewSwitch;