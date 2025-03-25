// src/components/specific/WeatherModelComparison/WeatherModelComparison.js
import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { 
  Thermometer, 
  Droplets, 
  Wind, 
  Cloud,
  Clock,
  Calendar
} from 'lucide-react';

// Import helper components
import ErrorState from './ErrorState';
import LoadingState from './LoadingState';
import LocationDetection from './LocationDetection';
import ErrorMetrics from './ErrorMetrics';
import ComparisonChart from './ComparisonChart';  // Import the ComparisonChart component

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
  { id: 'cloudCover', apiId: 'cloud_cover', label: 'Cloud Cover', icon: <Cloud className="w-4 h-4" />, unit: '%' }
];

// Default location (fallback if geolocation fails)
const DEFAULT_LOCATION = {
  lat: 36,
  lon: -86,
  name: 'Nashville, TN'
};

/**
 * Weather Model Comparison component that compares GraphCast and NWP models
 */
const WeatherModelComparison = () => {
  // UI state
  const [activeView, setActiveView] = useState('overview');
  const [selectedMetric, setSelectedMetric] = useState('temperature');
  const [timeframe, setTimeframe] = useState('16'); // Default to 16 days
  
  // Data state
  const [rawData, setRawData] = useState(null);
  const [processedData, setProcessedData] = useState({
    temperature: [],
    precipitation: [],
    wind: [],
    cloudCover: []
  });
  const [errorMetrics, setErrorMetrics] = useState({
    temperature: { graphcast: {}, nwp: {} },
    precipitation: { graphcast: {}, nwp: {} },
    wind: { graphcast: {}, nwp: {} },
    cloudCover: { graphcast: {}, nwp: {} }
  });
  
  // Status state
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Location state
  const [location, setLocation] = useState(DEFAULT_LOCATION);
  const [locationStatus, setLocationStatus] = useState({
    detecting: true,
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
  
  // Detect user's location on component mount
  useEffect(() => {
    const detectLocation = () => {
      setLocationStatus({ detecting: true, error: null });
      
      if ('geolocation' in navigator) {
        navigator.geolocation.getCurrentPosition(
          async (position) => {
            try {
              const { latitude, longitude } = position.coords;
              
              // Get location name from coordinates using geocoding API
              const response = await axios.get(`${REACT_APP_API_URL}/api/geocode`, {
                params: { lat: latitude, lon: longitude }
              });
              
              // Extract location components
              const locationData = response.data;
              const locationName = locationData.components 
                ? `${locationData.components.city || ''}, ${locationData.components.state_code || ''}`
                : `${latitude.toFixed(2)}°, ${longitude.toFixed(2)}°`;
              
              // Update location state
              setLocation({
                lat: latitude,
                lon: longitude,
                name: locationName.trim() || `${latitude.toFixed(2)}°, ${longitude.toFixed(2)}°`
              });
              
              setLocationStatus({ detecting: false, error: null });
            } catch (error) {
              console.error('Error getting location name:', error);
              
              // Still set coordinates but use generic name
              setLocation({
                lat: position.coords.latitude,
                lon: position.coords.longitude,
                name: `${position.coords.latitude.toFixed(2)}°, ${position.coords.longitude.toFixed(2)}°`
              });
              
              setLocationStatus({ detecting: false, error: null });
            }
          },
          (error) => {
            console.error('Geolocation error:', error);
            setLocationStatus({ 
              detecting: false, 
              error: `Could not detect location: ${error.message}` 
            });
          },
          { timeout: 10000, enableHighAccuracy: false }
        );
      } else {
        setLocationStatus({ 
          detecting: false, 
          error: 'Geolocation is not supported by your browser' 
        });
      }
    };
    
    detectLocation();
  }, []);
  
  // Fetch and process weather data when location or timeframe changes
  useEffect(() => {
    const fetchAndProcessData = async () => {
      // Skip if still detecting location
      if (locationStatus.detecting) return;
      
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
  }, [location, timeframe, locationStatus.detecting, getCurrentDateRange]);
  
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
  
  // Handle metric button click
  const handleMetricClick = (metricId) => {
    setSelectedMetric(metricId);
  };
  
  // Handle timeframe change
  const handleTimeframeChange = () => {
    // Toggle between 16 days and 7 days
    setTimeframe(timeframe === '16' ? '7' : '16');
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
  
  // Retry location detection
  const handleRetryLocation = () => {
    setLocationStatus({ detecting: true, error: null });
    // Reset to default location and trigger the useEffect again
    setLocation(DEFAULT_LOCATION);
  };
  
  // Return loading state if detecting location
  if (locationStatus.detecting) {
    return <LocationDetection type="loading" />;
  }
  
  // Return location error if detection failed
  if (locationStatus.error) {
    return (
      <LocationDetection
        type="error"
        error={locationStatus.error}
        location={`${location.name} (${location.lat.toFixed(2)}, ${location.lon.toFixed(2)})`}
        onRetry={handleRetryLocation}
      />
    );
  }
  
  // Return loading state while fetching data
  if (loading) {
    return <LoadingState location={location.name} />;
  }
  
  // Return error state if something went wrong
  if (error) {
    return <ErrorState error={error} rawData={rawData} />;
  }
  
  // Determine if we have valid data to display
  const hasData = getCurrentMetricData().length > 0;
  
  return (
    <div className="dashboard-container">
      <div className="main-content">
        <div className="analysis-body">
          <div className="analysis-header">
            <h1 className="content-title">Weather Model Comparison</h1>
            <p className="content-description">
              Compare the performance of GraphCast AI and traditional NWP models against historical weather data.
              <span className="timeframe-info"> Showing data for the past {timeframe} days.</span>
            </p>
          </div>
          
          {/* Metrics selector */}
          <div className="metrics-selector">
            {METRICS.map((metric) => (
              <div key={metric.id} className="metric-button-container">
                <button
                  className={`metric-button ${selectedMetric === metric.id ? 'active' : ''}`}
                  onClick={() => handleMetricClick(metric.id)}
                >
                  {metric.icon}
                  <span className="ml-2">{metric.label}</span>
                </button>
              </div>
            ))}
            
            <div className="timeframe-toggle">
              <button
                className="metric-button"
                onClick={handleTimeframeChange}
              >
                {timeframe === '16' ? <Calendar className="w-4 h-4" /> : <Clock className="w-4 h-4" />}
                <span className="ml-2">{timeframe === '16' ? '16 Days' : '7 Days'}</span>
              </button>
            </div>
          </div>
          
          <div className="analysis-content">
            {/* Use the ComparisonChart component instead of directly using LineChart */}
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
        </div>
      </div>
    </div>
  );
};

export default WeatherModelComparison;