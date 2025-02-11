import React from 'react';
import { Link } from 'react-router-dom';
import './404.css';
import { Radio } from 'react-feather'; // Use the radio icon as a radar

const NotFound = () => {
  return (
    <div className="not-found-container">
      <h1 className="not-found-title">This page isn't on our radar!</h1>
      <div className="not-found-icon">
        <Radio className="radar-icon" size={60} />
      </div>
      <p className="not-found-message">Looks like this page doesn't exist.</p>
      <Link to="/dashboard" className="not-found-link">
        Return to Safety
      </Link>
    </div>
  );
};

export default NotFound;
