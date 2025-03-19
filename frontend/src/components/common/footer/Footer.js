import React from 'react';
import './Footer.css';

/**
 * Footer component that appears at the bottom of every page
 * Uses custom CSS classes instead of Tailwind utilities for better maintainability
 *
 * @component
 * @return {JSX.Element} Footer component with copyright information
 */
const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="footer">
      <div className="footer-container">
        <p className="footer-text">
          © {currentYear}{' '}
          <span className="footer-company"> Project Airstorm</span>. All rights
          reserved.
        </p>
      </div>
    </footer>
  );
};

export default Footer;
