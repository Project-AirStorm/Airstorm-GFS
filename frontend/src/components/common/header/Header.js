import React from 'react';
import PropTypes from 'prop-types';
import { UserButton } from '@clerk/clerk-react'; 
// import { dark } from '@clerk/themes'
import './Header.css';

/**
 * Header component for the dashboard
 * Fixed position header that aligns with the sidebar width
 * @component
 * @param {Object} props
 * @param {string} props.title - The current page title
 */
const Header = ({ title }) => {
  return (
    <header className="dashboard-header">
      <div className="header-content">
        <h1 className="text-xl font-bold text-gray-800">{title}</h1>
      </div>
    </header>
  );
};

Header.propTypes = {
  title: PropTypes.string.isRequired,
};

export default Header;
