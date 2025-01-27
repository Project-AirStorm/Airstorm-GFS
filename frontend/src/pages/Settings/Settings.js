import React from 'react';
import PropTypes from 'prop-types';
import './Settings.css';

const Settings = ({ setCurrentPage }) => {
  return (
    <div className="settings-container">
      <h1>Settings</h1>
      <p>This is the Settings page. You can manage application settings here.</p>
    </div>
  );
};

Settings.propTypes = {
  setCurrentPage: PropTypes.func.isRequired,
};

export default Settings;