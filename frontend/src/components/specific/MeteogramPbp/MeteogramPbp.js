import React, { useState } from 'react';
import PropTypes from 'prop-types';
import OverviewSwitch from '../OverviewSwitch/OverviewSwitch';
import ActionButtons from '../ActionButtons/ActionButtons';
import './MeteogramPbp.css';

/**
 * MeteogramPbp component for displaying Meteogram Point-by-Point analysis
 * @component
 * @param {Object} props - Component properties
 * @param {Function} props.setCurrentPage - Function to update current page in parent component
 * @returns {JSX.Element} MeteogramPbp component
 */
const MeteogramPbp = ({ setCurrentPage }) => {
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

        <div className="meteogram-pbp-body">
          <div className="meteogram-content">
            <h2 className="content-title">
              Meteogram Point Based Product Analysis
            </h2>
            <p className="content-description">
              Detailed analysis of meteorological parameters at specific points
              over time.
            </p>
            {/* Add your meteogram specific content here */}
          </div>
        </div>
      </div>
    </div>
  );
};

MeteogramPbp.propTypes = {
  setCurrentPage: PropTypes.func.isRequired,
};

export default MeteogramPbp;
