// src/pages/Dashboard.js
import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import axios from 'axios';
import { 
  Settings, 
  Menu, 
  Map, 
  BarChart2, 
  Bell, 
  FileText, 
  Grid 
} from 'lucide-react';
import WeatherCard from '../components/WeatherCard';
import GraphCastForecast from '../components/GraphCastForecast';
import './Dashboard.css';

/**
 * NavItem component for sidebar navigation
 */
const NavItem = ({ icon, label, badge, isActive, onClick }) => (
  <div 
    className={`nav-item ${isActive ? 'active' : ''}`} 
    onClick={onClick}
  >
    <div className="flex items-center gap-3">
      {icon}
      <span className="text-sm font-semibold">{label}</span>
    </div>
    {badge && (
      <span className="px-2 py-1 bg-red-500 text-white text-xs rounded">
        {badge}
      </span>
    )}
  </div>
);

NavItem.propTypes = {
  icon: PropTypes.node.isRequired,
  label: PropTypes.string.isRequired,
  badge: PropTypes.string,
  isActive: PropTypes.bool,
  onClick: PropTypes.func.isRequired
};

/**
 * Dashboard component serves as the main interface for weather monitoring
 */
const Dashboard = ({ setCurrentPage }) => {
  const [activeView, setActiveView] = useState('overview');
  const [locations, setLocations] = useState([
    {
      city: "Bossier City",
      state: "LA",
      latitude: 32.5162,
      longitude: -93.7321,
      backgroundColor: "#A1A7FF"
    },
    {
      city: "Shreveport",
      state: "LA",
      latitude: 32.5251,
      longitude: -93.7502,
      backgroundColor: "#C4D0BA"
    },
    {
      city: "Ruston",
      state: "LA",
      latitude: 32.5232,
      longitude: -92.6379,
      backgroundColor: "#A1A7FF"
    }
  ]);

  // Navigation items configuration
  const navItems = [
    { icon: <Grid className="w-4 h-4" />, label: 'Dashboard', page: 'dashboard', isActive: true },
    { icon: <Map className="w-4 h-4" />, label: 'Maps', page: 'maps' },
    { icon: <BarChart2 className="w-4 h-4" />, label: 'Forecasts', page: 'forecasts' },
    { icon: <Bell className="w-4 h-4" />, label: 'Alerts', page: 'alerts', badge: '4' },
    { icon: <FileText className="w-4 h-4" />, label: 'Analysis', page: 'analysis' },
    { icon: <Settings className="w-4 h-4" />, label: 'Settings', page: 'settings' },
    { icon: <FileText className="w-4 h-4" />, label: 'Logs', page: 'logs' }
  ];

  return (
    <div className="dashboard-container">
      {/* Sidebar */}
      <div className="sidebar">
        {/* Header */}
        <div className="header">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="logo-container"></div>
              <div>
                <h1 className="text-lg font-bold text-gray-800">Airstorm</h1>
                <p className="text-xs text-gray-500">Admin Panel</p>
              </div>
            </div>
            <Menu className="w-5 h-5 text-gray-500" />
          </div>
        </div>

        {/* User Profile */}
        <div className="profile-section">
          <div className="profile-card">
            <div className="profile-image"></div>
            <div>
              <p className="text-sm font-semibold text-gray-800">Sgt. Tubbs</p>
              <p className="text-xs text-gray-500">Flight Chief</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="nav-section">
          <p className="text-sm text-gray-500 mb-4">Main Menu</p>
          <div className="space-y-2">
            {navItems.map((item) => (
              <NavItem 
                key={item.label}
                icon={item.icon}
                label={item.label}
                badge={item.badge}
                isActive={item.isActive}
                onClick={() => setCurrentPage(item.page)}
              />
            ))}
          </div>
        </nav>
      </div>

      {/* Main Content */}
      <div className="main-content">
        <div className="content-header">
          <h2 className="text-xl font-bold text-gray-800">Dashboard</h2>
        </div>

        {/* View Toggle */}
        <div className="toggle-section">
          <div className="toggle-buttons">
            <button 
              className={`toggle-button ${activeView === 'overview' ? 'active' : ''}`}
              onClick={() => setActiveView('overview')}
            >
              Overview
            </button>
            <button 
              className={`toggle-button ${activeView === 'detailed' ? 'active' : ''}`}
              onClick={() => setActiveView('detailed')}
            >
              Detailed
            </button>
          </div>
          
          <div className="ml-auto flex items-center gap-4">
            <button className="px-4 py-1 bg-white rounded border text-sm text-gray-600">
              Week
            </button>
            <button className="px-4 py-1 bg-blue-600 text-white rounded flex items-center gap-2 text-sm">
              <span className="text-lg">+</span>
              Add New Base
            </button>
          </div>
        </div>

        {/* Weather Cards Grid */}
        <div className="weather-grid">
          {locations.map((location) => (
            <WeatherCard
              key={`${location.city}-${location.state}`}
              city={location.city}
              state={location.state}
              latitude={location.latitude}
              longitude={location.longitude}
              backgroundColor={location.backgroundColor}
            />
          ))}
        </div>

        {/* Charts Section */}
        <div className="chart-section">
          <h3 className="text-lg font-semibold mb-2">Local Weather Conditions</h3>
          <p className="text-sm text-gray-600 mb-4">
            Customize the chart to compare weather condition trends.
          </p>
          <GraphCastForecast />
        </div>

        {/* Bottom Grid */}
        <div className="bottom-grid">
          <div className="bottom-card">
            <h3 className="text-lg font-semibold mb-4">Weather Alerts</h3>
            <p className="text-sm text-gray-600">
              No active weather alerts for your monitored locations.
            </p>
          </div>
          <div className="bottom-card">
            <h3 className="text-lg font-semibold mb-4">Quick Stats</h3>
            <div className="space-y-2">
              <p className="text-sm text-gray-600">
                Monitored Locations: {locations.length}
              </p>
              <p className="text-sm text-gray-600">
                Active Alerts: 0
              </p>
              <p className="text-sm text-gray-600">
                Last Updated: {new Date().toLocaleTimeString()}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

Dashboard.propTypes = {
  setCurrentPage: PropTypes.func.isRequired
};

export default Dashboard;