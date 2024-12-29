import React from 'react';

const Navbar = ({ onNavigate, currentPage }) => {
  return (
    <nav className="bg-gray-800 bg-opacity-90 shadow-lg">
      <div className="container mx-auto px-4 py-3 flex justify-between items-center">
        <h1 className="text-lg font-bold text-purple-400">
          Airstörm Global Forecasting System
        </h1>
        <div className="flex space-x-4 text-white">
          <button
            onClick={() => onNavigate('dashboard')}
            className={`hover:text-purple-300 transition duration-300 
              ${currentPage === 'dashboard' ? 'text-purple-300' : ''}`}
          >
            Dashboard
          </button>
          <button
            onClick={() => onNavigate('weather')}
            className={`hover:text-purple-300 transition duration-300 
              ${currentPage === 'weather' ? 'text-purple-300' : ''}`}
          >
            Weather
          </button>
          <button
            onClick={() => onNavigate('about')}
            className={`hover:text-purple-300 transition duration-300 
              ${currentPage === 'about' ? 'text-purple-300' : ''}`}
          >
            About
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;