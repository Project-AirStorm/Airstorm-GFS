import React from 'react';
import PropTypes from 'prop-types';
import './Analysis.css';

const Analysis = ({ setCurrentPage }) => {
  return (
    <div className="analysis-container">
      <h1>Analysis</h1>
      <p>This is the Analysis page. You can display weather analysis and trends here.</p>
    </div>
  );
};

Analysis.propTypes = {
  setCurrentPage: PropTypes.func.isRequired,
};

export default Analysis;