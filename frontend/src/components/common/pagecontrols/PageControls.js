import React, { useState } from 'react';
import PropTypes from 'prop-types';
import OverviewSwitch from '../../specific/OverviewSwitch/OverviewSwitch';
import ActionButtons from '../../specific/ActionButtons/ActionButtons';
import './PageControls.css';

/**
 * PageControls component that combines OverviewSwitch and ActionButtons
 * @component
 */
const PageControls = ({ 
  onTimeframeChange: externalTimeframeChange,
  onAddBase: externalAddBase,
  timeframe = 'Week',
  onViewChange: externalViewChange,
  activeView: externalActiveView
}) => {
  // Local state management if external state is not provided
  const [localActiveView, setLocalActiveView] = useState('overview');
  
  // Determine whether to use external or local state
  const activeView = externalActiveView || localActiveView;
  
  // Handler for view changes
  const handleViewChange = (view) => {
    if (externalViewChange) {
      externalViewChange(view);
    } else {
      setLocalActiveView(view);
    }
  };

  // Default handlers if none provided
  const handleTimeframeChange = () => {
    if (externalTimeframeChange) {
      externalTimeframeChange();
    } else {
      //console.log('Timeframe changed');
    }
  };

  const handleAddBase = () => {
    if (externalAddBase) {
      externalAddBase();
    } else {
      //console.log('Add base clicked');
    }
  };

  return (
    <div className="controls-wrapper">
      <div className="controls-inner">
        <OverviewSwitch 
          activeView={activeView}
          onViewChange={handleViewChange}
        />
        
        <ActionButtons 
          onTimeframeChange={handleTimeframeChange}
          onAddBase={handleAddBase}
          timeframe={timeframe}
        />
      </div>
    </div>
  );
};

PageControls.propTypes = {
  onTimeframeChange: PropTypes.func,
  onAddBase: PropTypes.func,
  timeframe: PropTypes.string,
  onViewChange: PropTypes.func,
  activeView: PropTypes.oneOf(['overview', 'detailed'])
};

export default PageControls;