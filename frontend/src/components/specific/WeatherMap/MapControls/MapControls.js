import React from 'react';
import PropTypes from 'prop-types';
import './MapControls.css';

const WeatherMapControls = ({ selectedVariable, onVariableChange, weatherVariables, units }) => {
  return (
    <div className="map-controls">
      <select
        value={selectedVariable}
        onChange={(e) => onVariableChange(e.target.value)}
        className="map-type-selector"
      >
        {weatherVariables.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label} {units[option.value] ? `(${units[option.value]})` : ''}
          </option>
        ))}
      </select>
    </div>
  );
};

WeatherMapControls.propTypes = {
  selectedVariable: PropTypes.string.isRequired,
  onVariableChange: PropTypes.func.isRequired,
  weatherVariables: PropTypes.arrayOf(
    PropTypes.shape({
      value: PropTypes.string.isRequired,
      label: PropTypes.string.isRequired,
    })
  ).isRequired,
  units: PropTypes.object.isRequired
};

export default WeatherMapControls;