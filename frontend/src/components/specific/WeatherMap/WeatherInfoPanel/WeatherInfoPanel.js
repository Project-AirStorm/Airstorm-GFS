import React from 'react';
import PropTypes from 'prop-types';
import { IoThermometerOutline, IoChevronBack, IoChevronForward } from 'react-icons/io5';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import './WeatherInfoPanel.css';

const WeatherInfoPanel = ({ 
  isCollapsed, 
  onToggleCollapse, 
  weatherData 
}) => {
  return (
    <div className={`weather-panel ${isCollapsed ? 'translate-x-full' : 'translate-x-0'}`}>
      <button
        onClick={onToggleCollapse}
        className="panel-toggle-button"
        aria-label={isCollapsed ? "Show weather panel" : "Hide weather panel"}
      >
        {isCollapsed ? <IoChevronBack /> : <IoChevronForward />}
      </button>

      <div className="weather-panel-content">
        <h2 className="weather-panel-title">Weather Information</h2>
        {weatherData ? (
          <div className="weather-data-container">
            <div className="temperature-display">
              <IoThermometerOutline className="temperature-icon" />
              <span>Current Temperature: {weatherData.current_temperature}°F</span>
            </div>
            
            <div className="location-display">
              {weatherData.latitude.toFixed(2)}°N, {weatherData.longitude.toFixed(2)}°E
              <br />
              {weatherData.elevation}m above sea level
            </div>
            
            <div className="chart-container">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={weatherData.chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="time" 
                    tick={{ fontSize: 12 }} 
                    interval={2}
                  />
                  <YAxis 
                    domain={['auto', 'auto']} 
                    tick={{ fontSize: 12 }} 
                  />
                  <Tooltip />
                  <Line
                    type="monotone"
                    dataKey="temperature"
                    stroke="#3b82f6"
                    dot={{ r: 1 }}
                    name="Temperature °F"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        ) : (
          <p className="no-data-message">
            Click on the map to see weather data
          </p>
        )}
      </div>
    </div>
  );
};

WeatherInfoPanel.propTypes = {
  isCollapsed: PropTypes.bool.isRequired,
  onToggleCollapse: PropTypes.func.isRequired,
  weatherData: PropTypes.shape({
    current_temperature: PropTypes.number.isRequired,
    latitude: PropTypes.number.isRequired,
    longitude: PropTypes.number.isRequired,
    elevation: PropTypes.number.isRequired,
    chartData: PropTypes.arrayOf(
      PropTypes.shape({
        time: PropTypes.string.isRequired,
        temperature: PropTypes.number.isRequired
      })
    ).isRequired
  })
};

export default WeatherInfoPanel;