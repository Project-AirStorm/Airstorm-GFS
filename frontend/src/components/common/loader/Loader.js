// src/components/common/Loader/Loader.js
import React from 'react';
import './Loader.css';

/**
 * Reusable loader component to display loading states
 * @param {Object} props - Component props
 * @param {string} props.size - Size variant ('small', 'medium', 'large')
 * @param {string} props.className - Additional CSS classes
 * @param {boolean} props.fullPage - Whether to display as a fullscreen loader
 * @returns {JSX.Element} Loader component
 */
const Loader = ({ size = 'medium', className = '', fullPage = false }) => {
  const sizeClass = `loader-${size}`;
  
  // For full page loader, render a fixed position loader
  if (fullPage) {
    return (
      <div className="loader-fullpage">
        <div className={`loader ${sizeClass} ${className}`}>
          <div className="loader-animation"></div>
        </div>
      </div>
    );
  }
  
  // For standalone loader with no wrapping divs
  return (
    <div className={`loader ${sizeClass} ${className}`}>
      <div className="loader-animation"></div>
    </div>
  );
};

export default Loader;