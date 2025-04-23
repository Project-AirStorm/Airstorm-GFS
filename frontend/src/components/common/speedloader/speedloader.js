/* src/components/common/SpeedLoader/SpeedLoader.js */
import React from 'react';
import './speedloader.css';

/**
 * SpeedLoader component with two variants and size options
 * @param {{ variant?: 'primary'|'secondary', size?: 'small'|'medium'|'large', className?: string }} props
 */
const SpeedLoader = ({ variant = 'primary', size = 'medium', className = '' }) => {
  const baseClass = variant === 'secondary' ? 'speedloader-alt' : 'speedloader';
  const sizeClass = `${baseClass}-${size}`;
  return <div className={`${baseClass} ${sizeClass} ${className}`} />;
};

export default SpeedLoader;