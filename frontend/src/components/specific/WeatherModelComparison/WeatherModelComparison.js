// src/components/specific/WeatherModelComparison/WeatherModelComparison.js
import React, { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
import { 
  Thermometer, 
  Droplets, 
  Wind, 
  Clock,
  Calendar,
  ChevronDown,
  Plus,
  MapPin
} from 'lucide-react';

// Import helper components
import ErrorState from './ErrorState';
import LoadingState from './LoadingState';
import LocationDetection from './LocationDetection';
import ErrorMetrics from './ErrorMetrics';
import ComparisonChart from './ComparisonChart';
import AddLocationPopup from '../../specific/AddLocationPopup/AddLocationPopup';
import { UserSession } from '../../../utils/UserSession';

// Import data utilities
import { fetchHistoricalData, processWeatherData } from './dataUtils';

import './WeatherModelComparison.css';

// Constants
const REACT_APP_API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001';

// Model identifiers from the Open-Meteo API
const MODELS = {
  GRAPHCAST: "gfs_graphcast025",
  NWP: "gfs_hrrr"
};

// Metric mapping between API parameters and display values
const METRICS = [
  { id: 'temperature', apiId: 'temperature_2m', label: 'Temperature', icon: <Thermometer className="w-4 h-4" />, unit: '°C' },
  { id: 'precipitation', apiId: 'precipitation', label: 'Precipitation', icon: <Droplets className="w-4 h-4" />, unit: 'mm' },
  { id: 'wind', apiId: 'wind_speed_10m', label: 'Wind Speed', icon: <Wind className="w-4 h-4" />, unit: 'km/h' },
];

// Default location (fallback if geolocation fails)
const DEFAULT_LOCATION = {
  lat: 36,
  lon: -86,
  name: 'Nashville, TN'
};

/**
 * Enhanced Location Selector Component
 */
const LocationSelector = ({ locations, onSelectLocation, onAddLocation, selectedLocation }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  const toggleDropdown = () => {
    setIsOpen(!isOpen);
  };

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <div className="location-selector-wrapper" ref={dropdownRef}>
      <button className="location-selector-button" onClick={toggleDropdown}>
        <MapPin size={16} />
        <span>{selectedLocation ? selectedLocation.name : 'Select Location'}</span>
        <ChevronDown className="dropdown-icon" size={16} />
      </button>

      {isOpen && (
        <div className="location-selector-menu">
          {locations && locations.length > 0 ? (
            <>
              {locations.map((loc) => (
                <button
                  key={`${loc.latitude}-${loc.longitude}`}
                  className={`location-option ${selectedLocation && selectedLocation.lat === loc.latitude && selectedLocation.lon === loc.longitude ? 'selected' : ''}`}
                  onClick={() => {
                    onSelectLocation(loc);
                    setIsOpen(false);
                  }}
                >
                  <div className="location-option-content">
                    <span className="location-name">{loc.name}</span>
                    <span className="location-coords">
                      {loc.latitude.toFixed(4)}, {loc.longitude.toFixed(4)}
                    </span>
                  </div>
                  {loc.isFavorite && <span className="location-favorite">★</span>}
                </button>
              ))}
              <div className="location-divider"></div>
            </>
          ) : (
            <div className="no-locations-message">No saved locations</div>
          )}
          <button className="add-location-option" onClick={onAddLocation}>
            <Plus size={16} />
            <span>Add New Location</span>
          </button>
        </div>
      )}
    </div>
  );
};

/**
 * Weather Model Comparison component that compares GraphCast and NWP models
 */
const WeatherModelComparison = () => {
  const { user } = UserSession();
  
  // UI state
  const [selectedMetric, setSelectedMetric] = useState('temperature');
  const [timeframe, setTimeframe] = useState('16'); // Default to 16 days
  
  // Saved locations state
  const [savedLocations, setSavedLocations] = useState([]);
  
  // Data state
  const [rawData, setRawData] = useState(null);
  const [processedData, setProcessedData] = useState({
    temperature: [],
    precipitation: [],
    wind: [],
  });
  const [errorMetrics, setErrorMetrics] = useState({
    temperature: { graphcast: {}, nwp: {} },
    precipitation: { graphcast: {}, nwp: {} },
    wind: { graphcast: {}, nwp: {} },
  });
  
  // Location and popup state
  const [showLocationPopup, setShowLocationPopup] = useState(false);
  const [locationSelected, setLocationSelected] = useState(false);
  
  // Status state
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Location state
  const [location, setLocation] = useState(null);
  const [locationStatus, setLocationStatus] = useState({
    detecting: false,
    error: null
  });

  // Get current date and properly offset date ranges
  const getCurrentDateRange = useCallback(() => {
    // Start with current date
    const currentDate = new Date();
    
    // End date should be 5 days before current date
    const endDate = new Date(currentDate);
    endDate.setDate(endDate.getDate() - 5);
    
    // Start date should be (timeframe) days before the end date
    const startDate = new Date(endDate);
    startDate.setDate(startDate.getDate() - parseInt(timeframe, 10));
    
    return {
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0]
    };
  }, [timeframe]);

  // Fetch saved locations from the dashboard
  const fetchSavedLocations = useCallback(async () => {
    if (!user?.id) return;
    
    try {
      const response = await axios.get(`${REACT_APP_API_URL}/api/locations`, {
        params: { userId: user.id }
      });
      
      setSavedLocations(response.data);
      
      // If we have locations and none is selected yet, select the first one
      if (response.data.length > 0 && !location) {
        const firstLocation = response.data[0];
        handleLocationSelected(firstLocation);
      }
    } catch (err) {
      console.error('Error fetching saved locations:', err);
    }
  }, [user?.id, location]);
  
  // Fetch saved locations when component mounts
  useEffect(() => {
    fetchSavedLocations();
  }, [fetchSavedLocations]);
  
  // Handle timeframe toggle
  const toggleTimeframe = () => {
    setTimeframe(timeframe === '16' ? '7' : '16');
  };

  // Handle location popup
  const handleShowAddLocation = () => {
    setShowLocationPopup(true);
  };

  // Handle location selection
  const handleLocationSelected = (newLocation) => {
    setLocation({
      lat: newLocation.latitude,
      lon: newLocation.longitude,
      name: newLocation.name
    });
    setLocationSelected(true);
    setShowLocationPopup(false);
  };

  // Handle location added via popup
  const handleLocationAdded = (newLocation) => {
    fetchSavedLocations();
    handleLocationSelected(newLocation);
  };

  // Get the current metric data
  const getCurrentMetricData = () => {
    return processedData[selectedMetric] || [];
  };

  // Get unit for the selected metric
  const getMetricUnit = () => {
    const metric = METRICS.find(m => m.id === selectedMetric);
    return metric ? metric.unit : '';
  };
  
  // Fetch and process weather data when location or timeframe changes
  useEffect(() => {
    const fetchAndProcessData = async () => {
      // Skip if no location selected
      if (!location) return;
      
      try {
        setLoading(true);
        setError(null);
        
        const dateRange = getCurrentDateRange();
        const apiUrl = REACT_APP_API_URL;
        
        // Fetch historical weather data for both models
        const weatherData = await fetchHistoricalData(
          location.lat, 
          location.lon, 
          dateRange, 
          apiUrl,
          MODELS
        );
        
        // Store raw data for debugging
        setRawData(weatherData);
        
        // Process the weather data
        const processed = processWeatherData(
          weatherData.historical,
          weatherData.forecast,
          METRICS,
          MODELS
        );
        
        // Update processed data state
        setProcessedData(processed);
        
        // Calculate error metrics for each metric
        calculateErrorMetrics(processed);
        
        setLoading(false);
      } catch (err) {
        console.error('Error fetching weather data:', err);
        setError(err.message || 'Failed to fetch weather data');
        setLoading(false);
      }
    };
    
    fetchAndProcessData();
  }, [location, timeframe, getCurrentDateRange]);
  
  // Calculate error metrics for model comparison
  const calculateErrorMetrics = (data) => {
    const metrics = {};
    
    // Loop through each metric (temperature, precipitation, etc.)
    Object.keys(data).forEach(metricKey => {
      const metricData = data[metricKey];
      
      // Skip if no data
      if (!metricData || metricData.length === 0) {
        metrics[metricKey] = { graphcast: {}, nwp: {} };
        return;
      }
      
      // Filter out data points where we have all three values (historical, graphcast, nwp)
      const validData = metricData.filter(point => 
        point.historical !== null && 
        point.graphcast !== null && 
        point.nwp !== null
      );
      
      // Skip if not enough valid data points
      if (validData.length < 2) {
        metrics[metricKey] = { graphcast: {}, nwp: {} };
        return;
      }
      
      // Calculate metrics for both models
      metrics[metricKey] = {
        graphcast: calculateMetrics(validData, 'historical', 'graphcast'),
        nwp: calculateMetrics(validData, 'historical', 'nwp')
      };
    });
    
    setErrorMetrics(metrics);
  };
  
  // Calculate RMSE, MAE, and ACC for a specific model
  const calculateMetrics = (data, truthKey, modelKey) => {
    // Extract values
    const truth = data.map(point => point[truthKey]);
    const predictions = data.map(point => point[modelKey]);
    
    // Calculate mean for anomaly correlation
    const truthMean = truth.reduce((sum, val) => sum + val, 0) / truth.length;
    const predictionsMean = predictions.reduce((sum, val) => sum + val, 0) / predictions.length;
    
    // Calculate error metrics
    let sumSquaredError = 0;
    let sumAbsError = 0;
    let numerator = 0;
    let denomTruth = 0;
    let denomPred = 0;
    
    for (let i = 0; i < truth.length; i++) {
      // For RMSE and MAE
      const error = predictions[i] - truth[i];
      sumSquaredError += error * error;
      sumAbsError += Math.abs(error);
      
      // For anomaly correlation coefficient
      const truthAnomaly = truth[i] - truthMean;
      const predAnomaly = predictions[i] - predictionsMean;
      numerator += truthAnomaly * predAnomaly;
      denomTruth += truthAnomaly * truthAnomaly;
      denomPred += predAnomaly * predAnomaly;
    }
    
    const rmse = Math.sqrt(sumSquaredError / truth.length);
    const mae = sumAbsError / truth.length;
    const acc = numerator / (Math.sqrt(denomTruth) * Math.sqrt(denomPred));
    
    return { rmse, mae, acc };
  };
  
  // Determine if we have valid data to display
  const hasData = getCurrentMetricData().length > 0;
  
  return (
    <div>
      <div>
        <div className="analysis-body">
          <div className="analysis-header">
            <h1 className="content-title">Weather Model Comparison</h1>
            <p className="content-description">
              Compare the performance of GraphCast AI and traditional NWP models against historical weather data.
              <span className="timeframe-info"> Showing data for the past {timeframe} days.</span>
            </p>
          </div>
          
          {/* Controls section */}
          <div className="analysis-controls">
            {/* Metrics selector */}
            <div className="metrics-section">
              {METRICS.map((metric) => (
                <button
                  key={metric.id}
                  className={`metric-button ${selectedMetric === metric.id ? 'active' : ''}`}
                  onClick={() => setSelectedMetric(metric.id)}
                >
                  {metric.icon}
                  <span className="metric-label">{metric.label}</span>
                </button>
              ))}
            </div>
            
            {/* Timeframe selector */}
            <button
              className="timeframe-button"
              onClick={toggleTimeframe}
            >
              {timeframe === '16' ? <Calendar size={16} /> : <Clock size={16} />}
              <span>{timeframe === '16' ? '16 Days' : '7 Days'}</span>
            </button>
            
            {/* Location selector */}
            <LocationSelector 
              locations={savedLocations}
              onSelectLocation={handleLocationSelected}
              onAddLocation={handleShowAddLocation}
              selectedLocation={location}
            />
          </div>
          
          {!location ? (
            <div className="no-location-message">
              <p>Please select a location to view weather model comparison data.</p>
              <LocationSelector
                locations={savedLocations}
                onSelectLocation={handleLocationSelected}
                onAddLocation={handleShowAddLocation}
                selectedLocation={location}
              />
              {savedLocations.length === 0 && (
                <p className="no-saved-locations">No saved locations found. Please add a new location.</p>
              )}
            </div>
          ) : loading ? (
            <LoadingState location={location.name} />
          ) : error ? (
            <ErrorState error={error} rawData={rawData} />
          ) : (
            <div className="analysis-content">
              {/* Use the ComparisonChart component */}
              {hasData ? (
                <ComparisonChart
                  data={getCurrentMetricData()}
                  metricName={METRICS.find(m => m.id === selectedMetric)?.label || ''}
                  metricUnit={getMetricUnit()}
                />
              ) : (
                <div className="chart-placeholder">
                  <p>No data available for this metric.</p>
                </div>
              )}
              
              {/* Error metrics panel */}
              <ErrorMetrics
                selectedMetric={selectedMetric}
                errorMetrics={errorMetrics}
                metricLabel={METRICS.find(m => m.id === selectedMetric)?.label || ''}
                location={location}
              />
            </div>
          )}
        </div>
      </div>
      
      {showLocationPopup && (
        <AddLocationPopup
          isOpen={showLocationPopup}
          onClose={() => setShowLocationPopup(false)}
          onLocationAdded={handleLocationAdded}
        />
      )}
    </div>
  );
};

export default WeatherModelComparison;