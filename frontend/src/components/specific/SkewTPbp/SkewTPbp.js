import React, { useState } from 'react';
import PropTypes from 'prop-types';
import OverviewSwitch from '../OverviewSwitch/OverviewSwitch';
import ActionButtons from '../ActionButtons/ActionButtons';
import './SkewTPbp.css';

/**
 * SkewTPbp component for displaying SkewT Point-by-Point analysis
 * @component
 * @param {Object} props - Component properties
 * @param {Function} props.setCurrentPage - Function to update current page in parent component
 * @returns {JSX.Element} SkewTPbp component
 */
const SkewTPbp = ({ setCurrentPage }) => {
  const [activeView, setActiveView] = useState('overview');

  return (
    <div className="dashboard-container">
      <div className="main-content">
        {/* View Toggle and Action Buttons */}
        <div className="controls-container">
          <OverviewSwitch
            activeView={activeView}
            onViewChange={setActiveView}
          />

          <ActionButtons
            onTimeframeChange={() => console.log('Timeframe changed')}
            onAddBase={() => console.log('Add base clicked')}
            timeframe="Week"
          />
        </div>

        <div className="skewt-pbp-body">
          <div className="skewt-content">
            <h2 className="content-title">
              SkewT Point Based Product Analysis
            </h2>
            <p className="content-description">
              Detailed thermodynamic diagram analysis for atmospheric soundings.
            </p>
            {/* Add your SkewT specific content here */}
          </div>
        </div>
      </div>
    </div>
  );
};

SkewTPbp.propTypes = {
  setCurrentPage: PropTypes.func.isRequired,
};

export default SkewTPbp;
