// File: Airstorm-GFS/frontend/src/components/specific/OverviewSwitch/OverviewSwitch.js
// Using the version confirmed to work with explicit props.
import React from 'react';
import PropTypes from 'prop-types';
import './OverviewSwitch.css';

/**
 * OverviewSwitch component for toggling between two views, with configurable labels.
 * Defaults to "Overview" / "Detailed" if labels are not provided.
 * @component
 * @param {Object} props
 * @param {string} props.activeView - Currently active view ('overview' or 'detailed')
 * @param {Function} props.onViewChange - Callback function when view is changed ('overview' or 'detailed')
 * @param {string} [props.labelOne='Overview'] - Text label for the first button (maps to 'overview' view)
 * @param {string} [props.labelTwo='Detailed'] - Text label for the second button (maps to 'detailed' view)
 */
const OverviewSwitch = ({ activeView, onViewChange, labelOne, labelTwo }) => {
  return (
    <div className="overview-switch-section">
      <div  className="overview-switch-buttons" >

        {/* Use labelOne prop for the first button */}
        <button
          className={`overview-switch-button ${activeView === 'overview' ? 'active' : ''}`}
          onClick={() => onViewChange('overview')}
        >
          {labelOne} {/* Use prop */}
        </button>

        {/* Use labelTwo prop for the second button */}
        <button
          className={`overview-switch-button ${activeView === 'detailed' ? 'active' : ''}`}
          onClick={() => onViewChange('detailed')}
        >
          {labelTwo} {/* Use prop */}
        </button>

      </div>
    </div>
  );
};

OverviewSwitch.propTypes = {
  activeView: PropTypes.oneOf(['overview', 'detailed']).isRequired,
  onViewChange: PropTypes.func.isRequired,
  labelOne: PropTypes.string,
  labelTwo: PropTypes.string,
};

// Default props for when labels are not passed
OverviewSwitch.defaultProps = {
  labelOne: 'Overview',
  labelTwo: 'Detailed',
};

// Ensure this is the only export default
export default OverviewSwitch;