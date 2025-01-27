import React from 'react';
import PropTypes from 'prop-types';
import './Forecasts.css';

const Forecasts = ({ setCurrentPage }) => {
  return (
    <div className="forecasts-container">
      <h1>Forecasts</h1>
      <p>This is the Forecasts page. You can display weather forecasts here.</p>
    </div>
  );
};

Forecasts.propTypes = {
  setCurrentPage: PropTypes.func.isRequired,
};

export default Forecasts;