// Analysis.js - Complete Refactored Version with Location Detection and Historical Forecasts
import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
  ReferenceLine
} from 'recharts';
import { 
  Thermometer, 
  Droplets, 
  Wind, 
  Cloud,
  MapPin,
  AlertCircle
} from 'lucide-react';
import OverviewSwitch from '../../components/specific/OverviewSwitch/OverviewSwitch';
import ActionButtons from '../../components/specific/ActionButtons/ActionButtons';
import './Analysis.css';

// Constants
const REACT_APP_API_URL = process.env.REACT_APP_API_URL;

// Model identifiers from the Open-Meteo API
const MODELS = {
  GRAPHCAST: "gfs_graphcast025",
  NWP: "gfs_hrrr"
};

// Metric mapping between API parameters and display values
const METRICS = [
  { id: 'temperature', apiId: 'temperature_2m', label: 'Temperature', icon: <Thermometer className="w-4 h-4" /> },
  { id: 'precipitation', apiId: 'precipitation', label: 'Precipitation', icon: <Droplets className="w-4 h-4" /> },
  { id: 'wind', apiId: 'wind_speed_10m', label: 'Wind Speed', icon: <Wind className="w-4 h-4" /> },
  { id: 'cloudCover', apiId: 'cloud_cover', label: 'Cloud Cover', icon: <Cloud className="w-4 h-4" /> }
];

// Default location (fallback if geolocation fails)
const DEFAULT_LOCATION = {
  lat: 36,
  lon: -86,
  name: 'Nashville, TN'
};

/**
 * Analysis component for comparing weather model performance
 */
const Analysis = () => {
  // UI state
  const [activeView, setActiveView] = useState('overview');
  const [selectedMetric, setSelectedMetric] = useState('temperature');
  const [timeframe, setTimeframe] = useState('16'); // Default to 16 days
  
  // Data state
  const [rawData, setRawData] = useState(null);
  const [historicalData, setHistoricalData] = useState({});
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
  
  // Location state with geolocation support
  const [location, setLocation] = useState(DEFAULT_LOCATION);
  const [locationLoading, setLocationLoading] = useState(false);
  const [locationError, setLocationError] = useState(null);
  const [locationDetected, setLocationDetected] = useState(false);

  // Loading and error states
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dataTimeframe, setDataTimeframe] = useState({
    startDate: '',
    endDate: ''
  });

  /**
   * Get user's current location using browser geolocation
   */
  const detectUserLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setLocationError("Geolocation is not supported by your browser");
      return;
    }

    setLocationLoading(true);
    setLocationError(null);

    navigator.geolocation.getCurrentPosition(
      // Success handler
      async (position) => {
        try {
          const coords = {
            lat: position.coords.latitude,
            lon: position.coords.longitude
          };
          
          console.log("Location detected:", coords);
          
          // Try to get location name from geocoding API
          let locationName = `${coords.lat.toFixed(2)}, ${coords.lon.toFixed(2)}`;
          
          try {
            const geocodeResponse = await axios.get(`${REACT_APP_API_URL}/api/geocode`, {
              params: {
                lat: coords.lat,
                lon: coords.lon
              },
              timeout: 5000
            });
            
            if (geocodeResponse.data && geocodeResponse.data.formatted_address) {
              locationName = geocodeResponse.data.formatted_address;
            } else if (geocodeResponse.data && geocodeResponse.data.components) {
              const components = geocodeResponse.data.components;
              if (components.city && components.state_code) {
                locationName = `${components.city}, ${components.state_code}`;
              }
            }
          } catch (geocodeErr) {
            console.warn("Could not get location name:", geocodeErr);
          }
          
          // Update location state with detected coordinates and name
          setLocation({
            ...coords,
            name: locationName
          });
          
          setLocationDetected(true);
          setLocationLoading(false);
          
          // Trigger data fetch with new location
          console.log("Fetching weather data for detected location");
        } catch (error) {
          console.error("Error processing location:", error);
          setLocationError("Error processing your location");
          setLocationLoading(false);
        }
      },
      // Error handler
      (error) => {
        console.error("Geolocation error:", error);
        let errorMessage = "Unable to retrieve your location";
        
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = "Location access was denied";
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = "Location information is unavailable";
            break;
          case error.TIMEOUT:
            errorMessage = "Location request timed out";
            break;
          case error.UNKNOWN_ERROR:
            errorMessage = "An unknown error occurred";
            break;
        }
        
        setLocationError(errorMessage);
        setLocationLoading(false);
      },
      // Options
      {
        enableHighAccuracy: false,
        timeout: 10000,
        maximumAge: 0
      }
    );
  }, []);

  /**
   * Calculate date range for data fetching
   * Uses the required time window: end date 5 days ago, start date based on selected timeframe
   */
  const getDateRange = useCallback(() => {
    try {
      // End date should be 5 days ago from current date
      const currentDate = new Date();
      const endDate = new Date(currentDate);
      endDate.setDate(currentDate.getDate() - 5);
      
      // Calculate start date based on timeframe (days before end date)
      const daysToSubtract = parseInt(timeframe, 10) - 1; // -1 because end date is included
      const startDate = new Date(endDate);
      startDate.setDate(endDate.getDate() - daysToSubtract);
      
      // Format the dates as ISO strings
      const formattedStartDate = startDate.toISOString().split('T')[0];
      const formattedEndDate = endDate.toISOString().split('T')[0];
      
      // Update the timeframe display with the dates
      setDataTimeframe({
        startDate: formattedStartDate,
        endDate: formattedEndDate,
        fullStartDate: formattedStartDate 
      });
      
      // Return the API fetch dates - always fetch a bit more data than needed
      // to ensure we have enough even after filtering
      const fetchStartDate = new Date(startDate);
      fetchStartDate.setDate(startDate.getDate() - 2); // Fetch 2 extra days of data
      
      return {
        startDate: fetchStartDate.toISOString().split('T')[0],
        endDate: formattedEndDate
      };
    } catch (err) {
      console.error('Error calculating date range:', err);
      // Return a default 16-day range if there's an error
      const currentDate = new Date();
      const endDate = new Date(currentDate);
      endDate.setDate(currentDate.getDate() - 5);
      
      const startDate = new Date(endDate);
      startDate.setDate(endDate.getDate() - 15); // 16 days including end date
      
      const formattedStartDate = startDate.toISOString().split('T')[0];
      const formattedEndDate = endDate.toISOString().split('T')[0];
      
      setDataTimeframe({
        startDate: formattedStartDate,
        endDate: formattedEndDate
      });
      
      return {
        startDate: formattedStartDate,
        endDate: formattedEndDate
      };
    }
  }, [timeframe]);

  /**
   * Fetch all weather data using the historical-forecasts endpoint for both NWP and GraphCast
   */
  const fetchHistoricalData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const { startDate, endDate } = getDateRange();
      
      console.log(`Fetching data from ${startDate} to ${endDate} for location: ${location.name} (${location.lat}, ${location.lon})`);
      
      // Parameters for API requests
      const hourlyParams = "temperature_2m,cloud_cover,precipitation,wind_speed_10m";
      
      // Fetch real historical weather data as ground truth
      console.log("Fetching historical weather data...");
      const historicalResponse = await axios.get(`${REACT_APP_API_URL}/api/historical-weather`, {
        params: {
          latitude: location.lat,
          longitude: location.lon,
          start_date: startDate,
          end_date: endDate,
          hourly: hourlyParams,
          temperature_unit: "celsius",
          wind_speed_unit: "kmh",
          precipitation_unit: "mm",
          timezone: "auto"
        },
        timeout: 30000
      });
      
      if (!historicalResponse.data || !historicalResponse.data.hourly) {
        throw new Error('Invalid historical weather API response: Missing hourly data');
      }
      
      console.log("Historical weather data received successfully");
      setHistoricalData(historicalResponse.data);
      
      // Fetch forecast data from both models in one request
      console.log("Fetching historical forecast data for both models...");
      const forecastResponse = await axios.get(`${REACT_APP_API_URL}/api/historical-forecasts`, {
        params: {
          latitude: location.lat,
          longitude: location.lon,
          start_date: startDate,
          end_date: endDate,
          hourly: hourlyParams,
          models: `${MODELS.NWP},${MODELS.GRAPHCAST}`, // Request both models
          temperature_unit: "celsius",
          wind_speed_unit: "kmh",
          precipitation_unit: "mm",
          timezone: "auto"
        },
        timeout: 30000
      });
      
      if (!forecastResponse.data || !forecastResponse.data.hourly) {
        throw new Error('Invalid historical forecasts API response: Missing hourly data');
      }
      
      console.log("Historical forecasts data received successfully");
      setRawData(forecastResponse.data);
      
      // Process the data
      processWeatherData(historicalResponse.data, forecastResponse.data);
      setLoading(false);
      
      return {
        historical: historicalResponse.data,
        forecast: forecastResponse.data
      };
    } catch (err) {
      console.error('Error fetching weather data:', err);
      
      // Detailed error logging
      if (err.response) {
        console.error('Response error:', {
          status: err.response.status,
          data: err.response.data
        });
      }
      
      setError(
        err.response?.data?.error || 
        err.message || 
        'Failed to fetch weather data'
      );
      setLoading(false);
      return null;
    }
  }, [location, getDateRange]);

/**
 * Process weather data from historical-weather and historical-forecasts endpoints
 * With detailed validation and debugging to ensure forecast data is properly implemented
 */
const processWeatherData = (historicalData, forecastData) => {
  try {
    // Validate historical data structure
    if (!historicalData || !historicalData.hourly || !historicalData.hourly.time) {
      console.error("Invalid historical data format");
      setError("Historical weather data is incomplete or in an unexpected format");
      return;
    }
    
    // Validate forecast data and log its structure
    if (!forecastData) {
      console.error("Forecast data is null or undefined");
      setError("Forecast data is missing");
      return;
    }
    
    console.log("Processing data from historical-forecasts endpoint");
    console.log("Forecast data response structure:", Object.keys(forecastData));
    
    if (!forecastData.hourly) {
      console.error("Forecast data missing hourly section");
      console.error("Raw forecast data:", forecastData);
      setError("Forecast data is missing hourly measurements");
      return;
    }
    
    // Log the keys in the hourly data to see exactly what's available
    console.log("Hourly data keys in forecast response:", Object.keys(forecastData.hourly));
    
    // DEBUGGING: Check for cloud cover specifically
    console.log("Checking for cloud cover in historical data:");
    console.log("Historical hourly keys:", Object.keys(historicalData.hourly));
    const cloudCoverKeys = Object.keys(forecastData.hourly).filter(key => 
      key.includes('cloud_cover') || key.includes('cloud') || key.includes('cc')
    );
    console.log("Possible cloud cover keys in forecast data:", cloudCoverKeys);
    
    // Check for existence of model-specific data
    // For historical forecasts, we expect keys like "gfs_graphcast025_temperature_2m" and "gfs_hrrr_temperature_2m"
    const graphcastTempKey = `${MODELS.GRAPHCAST}_temperature_2m`;
    const nwpTempKey = `${MODELS.NWP}_temperature_2m`;
    
    const hasGraphcastTemp = forecastData.hourly.hasOwnProperty(graphcastTempKey);
    const hasNwpTemp = forecastData.hourly.hasOwnProperty(nwpTempKey);
    
    console.log(`Checking for GraphCast temperature data (${graphcastTempKey}): ${hasGraphcastTemp ? "FOUND" : "NOT FOUND"}`);
    console.log(`Checking for NWP temperature data (${nwpTempKey}): ${hasNwpTemp ? "FOUND" : "NOT FOUND"}`);
    
    // DEBUGGING: Check key patterns for cloud cover specifically
    const graphcastCloudKey = `${MODELS.GRAPHCAST}_cloud_cover`;
    const nwpCloudKey = `${MODELS.NWP}_cloud_cover`;
    console.log(`Looking for GraphCast cloud cover: ${graphcastCloudKey} exists: ${forecastData.hourly.hasOwnProperty(graphcastCloudKey)}`);
    console.log(`Looking for NWP cloud cover: ${nwpCloudKey} exists: ${forecastData.hourly.hasOwnProperty(nwpCloudKey)}`);
    
    // If we don't find the expected format, try to see if there's an alternative format
    if (!hasGraphcastTemp && !hasNwpTemp) {
      // Log the first few keys to help identify the pattern
      const hourlyKeys = Object.keys(forecastData.hourly);
      console.log("First 10 hourly data keys:", hourlyKeys.slice(0, 10));
      
      // Try to find any keys that might contain the model names
      const graphcastKeys = hourlyKeys.filter(key => key.includes(MODELS.GRAPHCAST));
      const nwpKeys = hourlyKeys.filter(key => key.includes(MODELS.NWP));
      
      console.log("Keys containing GraphCast model name:", graphcastKeys);
      console.log("Keys containing NWP model name:", nwpKeys);
    }
    
    const histHourly = historicalData.hourly;
    const histTimes = histHourly.time;
    const forecastTimes = forecastData.hourly.time || [];
    
    console.log(`Historical data has ${histTimes.length} time points`);
    console.log(`Forecast data has ${forecastTimes.length} time points`);
    
    // Extract unique days from timestamps
    const uniqueDays = [...new Set(histTimes.map(time => time.split('T')[0]))].sort();
    console.log(`Processing ${uniqueDays.length} unique days of weather data`);
    
    // Initialize processed data object
    const processed = {
      temperature: [],
      precipitation: [],
      wind: [],
      cloudCover: []
    };
    
    // DEBUGGING: Enhanced getModelParamKey function for cloud cover issues
    const getModelParamKey = (model, param) => {
      // Special handling for cloud cover which might have a different format
      if (param === 'cloud_cover') {
        console.log(`Looking for cloud cover key with model: ${model}`);
        
        // Try different potential formats for cloud cover
        const cloudCoverFormats = [
          `${model}_${param}`,
          `${model}_cloud_cover`,
          `${model}_clouds`,
          `${model}_cc`
        ];
        
        for (const format of cloudCoverFormats) {
          if (forecastData.hourly[format]) {
            console.log(`Found cloud cover data with key: ${format}`);
            return format;
          }
        }
        
        // If still not found, look for any key containing both model and cloud
        const cloudKey = Object.keys(forecastData.hourly).find(key => 
          key.includes(model) && (key.includes('cloud') || key.includes('cc'))
        );
        
        if (cloudKey) {
          console.log(`Found cloud cover with alternative key: ${cloudKey}`);
          return cloudKey;
        }
        
        console.log(`No cloud cover key found for model ${model}`);
        return null;
      }
      
      // First check for the direct format: {model}_{param}
      const directKey = `${model}_${param}`;
      if (forecastData.hourly[directKey]) {
        return directKey;
      }
      
      // Next check for a format where model might be a prefix
      const prefixedKey = Object.keys(forecastData.hourly).find(key => 
        key.startsWith(model) && key.endsWith(param)
      );
      
      if (prefixedKey) {
        return prefixedKey;
      }
      
      // If we still don't find it, check for any key containing both model and param
      const containsKey = Object.keys(forecastData.hourly).find(key => 
        key.includes(model) && key.includes(param)
      );
      
      return containsKey;
    };
    
    // Check for each metric and model format
    for (const metric of METRICS) {
      const apiParam = metric.apiId;
      const metricId = metric.id;
      
      // DEBUGGING: Add specific logging for cloud cover
      if (metricId === 'cloudCover') {
        console.log("⚠️ PROCESSING CLOUD COVER DATA ⚠️");
        console.log("Looking for historical cloud cover with key:", apiParam);
      }
      
      // Check for historical data
      if (!histHourly[apiParam]) {
        console.warn(`Historical data missing ${apiParam}`);
        if (metricId === 'cloudCover') {
          console.error("❌ HISTORICAL CLOUD COVER DATA MISSING!");
          console.log("Available historical data keys:", Object.keys(histHourly));
        }
        continue;
      } else if (metricId === 'cloudCover') {
        console.log("✅ Historical cloud cover data found!");
      }
      
      // Find the GraphCast data key
      const graphcastKey = getModelParamKey(MODELS.GRAPHCAST, apiParam);
      // Find the NWP data key
      const nwpKey = getModelParamKey(MODELS.NWP, apiParam);
      
      console.log(`${metricId} - GraphCast key format: ${graphcastKey || "NOT FOUND"}`);
      console.log(`${metricId} - NWP key format: ${nwpKey || "NOT FOUND"}`);
      
      // DEBUGGING: Add more detail for cloud cover keys
      if (metricId === 'cloudCover') {
        if (!graphcastKey) {
          console.error("❌ NO GRAPHCAST CLOUD COVER KEY FOUND!");
          // Try to find any key that might contain cloud cover data for GraphCast
          const possibleKeys = Object.keys(forecastData.hourly).filter(key => 
            key.includes(MODELS.GRAPHCAST) && (key.includes('cloud') || key.includes('cc'))
          );
          console.log("Possible GraphCast cloud cover keys:", possibleKeys);
        }
        
        if (!nwpKey) {
          console.error("❌ NO NWP CLOUD COVER KEY FOUND!");
          // Try to find any key that might contain cloud cover data for NWP
          const possibleKeys = Object.keys(forecastData.hourly).filter(key => 
            key.includes(MODELS.NWP) && (key.includes('cloud') || key.includes('cc'))
          );
          console.log("Possible NWP cloud cover keys:", possibleKeys);
        }
      }
      
      // Determine if we have data for each model
      const hasGraphcastData = !!graphcastKey && Array.isArray(forecastData.hourly[graphcastKey]);
      const hasNWPData = !!nwpKey && Array.isArray(forecastData.hourly[nwpKey]);
      
      console.log(`${metricId} - Historical: true, GraphCast: ${hasGraphcastData}, NWP: ${hasNWPData}`);
      
      // Process each day
      uniqueDays.forEach((dateStr, index) => {
        // Calculate day number (1-based index)
        const dayNumber = index + 1;
        
        // Format date for display
        const date = new Date(dateStr);
        const formattedDate = date.toLocaleDateString('en-US', { 
          month: 'short', 
          day: 'numeric' 
        });
        
        // Helper function to get daily average from hourly data
        const calculateDailyAverage = (dataArray, times, dateStr, isSum = false) => {
          if (!Array.isArray(dataArray) || !Array.isArray(times)) {
            return null;
          }
          
          // Find indices for this date
          const indices = times.map((time, i) => time.startsWith(dateStr) ? i : -1)
                              .filter(i => i !== -1);
          
          if (indices.length === 0) {
            return null;
          }
          
          // Get values for these indices
          const values = indices.map(i => dataArray[i])
                               .filter(v => v !== undefined && v !== null && !isNaN(v));
          
          if (values.length === 0) {
            return null;
          }
          
          // For sum (like precipitation), add values; otherwise average them
          if (isSum) {
            return values.reduce((sum, v) => sum + v, 0);
          } else {
            return values.reduce((sum, v) => sum + v, 0) / values.length;
          }
        };
        
        // Get data for each metric and model
        const isSum = metricId === 'precipitation';
        
        // Get historical value
        const historicalValue = calculateDailyAverage(
          histHourly[apiParam], 
          histHourly.time, 
          dateStr,
          isSum
        );
        
        // Get GraphCast value if available
        const graphcastValue = hasGraphcastData ? 
          calculateDailyAverage(
            forecastData.hourly[graphcastKey],
            forecastData.hourly.time,
            dateStr,
            isSum
          ) : null;
          
        // Get NWP value if available
        const nwpValue = hasNWPData ? 
          calculateDailyAverage(
            forecastData.hourly[nwpKey],
            forecastData.hourly.time,
            dateStr,
            isSum
          ) : null;
          
        // DEBUGGING: Add specific logging for cloud cover values
        if (metricId === 'cloudCover' && index === 0) {
          console.log(`Cloud cover values for first day (${dateStr}):`);
          console.log(`- Historical: ${historicalValue}`);
          console.log(`- GraphCast: ${graphcastValue}`);
          console.log(`- NWP: ${nwpValue}`);
        }
        
        // Skip if we don't have historical data (except for precipitation which can be 0)
        if (historicalValue === null && !isSum) {
          return;
        }
        
        // Calculate temperature min/max for temperature data
        let tempMin = null;
        let tempMax = null;
        
        if (metricId === 'temperature') {
          const tempIndices = histHourly.time
            .map((time, i) => time.startsWith(dateStr) ? i : -1)
            .filter(i => i !== -1);
            
          if (tempIndices.length > 0) {
            const tempValues = tempIndices
              .map(i => histHourly.temperature_2m[i])
              .filter(v => v !== undefined && v !== null && !isNaN(v));
              
            if (tempValues.length > 0) {
              tempMin = Math.min(...tempValues);
              tempMax = Math.max(...tempValues);
            }
          }
        }
        
        // Add data point to processed data
        processed[metricId].push({
          day: dayNumber,
          date: dateStr,
          displayDate: formattedDate,
          historical: historicalValue,
          graphcast: graphcastValue,
          nwp: nwpValue,
          ...(metricId === 'temperature' && { min: tempMin, max: tempMax })
        });
      });
    }
    
    // DEBUGGING: Check processed data for each metric
    console.log("Processed data point counts:");
    Object.keys(processed).forEach(key => {
      console.log(`- ${key}: ${processed[key].length} points`);
      if (processed[key].length > 0) {
        console.log(`  Sample: ${JSON.stringify(processed[key][0])}`);
      } else {
        console.log(`  No data points for ${key}!`);
      }
    });
    
    // Apply timeframe filtering
    const maxDays = parseInt(timeframe, 10) || 16;
    
    // Limit data arrays to selected timeframe
    const limitDataToTimeframe = (dataArray) => {
      if (!dataArray || dataArray.length === 0) return [];
      if (dataArray.length <= maxDays) return dataArray;
      return dataArray.slice(0, maxDays);
    };
    
    // Apply filtering to each metric
    const limitedData = {
      temperature: limitDataToTimeframe(processed.temperature),
      precipitation: limitDataToTimeframe(processed.precipitation),
      wind: limitDataToTimeframe(processed.wind),
      cloudCover: limitDataToTimeframe(processed.cloudCover)
    };
    
    // Log data counts for debugging
    console.log("Data points after processing:", {
      temperature: limitedData.temperature.length,
      precipitation: limitedData.precipitation.length,
      wind: limitedData.wind.length,
      cloudCover: limitedData.cloudCover.length
    });
    
    // Update state with processed data
    setProcessedData(limitedData);
    calculateErrorMetrics(limitedData);
    
  } catch (error) {
    console.error("Error processing weather data:", error);
    setError(`Failed to process weather data: ${error.message}`);
  }
};
  /**
   * Calculate error metrics for visualizations
   */
  const calculateErrorMetrics = (processed) => {
    const metrics = {};
    
    // Initialize the metrics structure based on available data keys
    Object.keys(processed).forEach(metricType => {
      metrics[metricType] = { graphcast: {}, nwp: {} };
      
      if (!processed[metricType] || processed[metricType].length === 0) return;
      
      // Extract arrays of values for each model
      const historicalValues = processed[metricType].map(item => item.historical);
      const graphcastValues = processed[metricType].map(item => item.graphcast);
      const nwpValues = processed[metricType].map(item => item.nwp);
      
      // Calculate RMSE
      const graphcastRMSE = calculateRMSE(historicalValues, graphcastValues);
      const nwpRMSE = calculateRMSE(historicalValues, nwpValues);
      
      // Calculate MAE
      const graphcastMAE = calculateMAE(historicalValues, graphcastValues);
      const nwpMAE = calculateMAE(historicalValues, nwpValues);
      
      // Calculate ACC
      const graphcastACC = calculateACC(historicalValues, graphcastValues);
      const nwpACC = calculateACC(historicalValues, nwpValues);
      
      // Add metrics
      metrics[metricType].graphcast = {
        rmse: graphcastRMSE,
        mae: graphcastMAE,
        acc: graphcastACC
      };
      
      metrics[metricType].nwp = {
        rmse: nwpRMSE,
        mae: nwpMAE,
        acc: nwpACC
      };
    });
    
    // Update error metrics state
    setErrorMetrics(metrics);
  };

  /**
   * Calculate Root Mean Square Error
   */
  const calculateRMSE = (actual, predicted) => {
    if (!actual || !predicted || actual.length !== predicted.length) {
      return 0;
    }
    
    // Filter out null/undefined values
    const validPairs = actual.map((val, i) => [val, predicted[i]])
      .filter(pair => pair[0] !== null && pair[0] !== undefined && 
                      pair[1] !== null && pair[1] !== undefined);
    
    if (validPairs.length === 0) return 0;
    
    const n = validPairs.length;
    let sumSquaredError = 0;
    
    for (let i = 0; i < n; i++) {
      const error = validPairs[i][0] - validPairs[i][1];
      sumSquaredError += error * error;
    }
    
    return Math.sqrt(sumSquaredError / n);
  };

  /**
   * Calculate Mean Absolute Error
   */
  const calculateMAE = (actual, predicted) => {
    if (!actual || !predicted || actual.length !== predicted.length) {
      return 0;
    }
    
    // Filter out null/undefined values
    const validPairs = actual.map((val, i) => [val, predicted[i]])
      .filter(pair => pair[0] !== null && pair[0] !== undefined && 
                      pair[1] !== null && pair[1] !== undefined);
    
    if (validPairs.length === 0) return 0;
    
    const n = validPairs.length;
    let sumAbsoluteError = 0;
    
    for (let i = 0; i < n; i++) {
      const error = Math.abs(validPairs[i][0] - validPairs[i][1]);
      sumAbsoluteError += error;
    }
    
    return sumAbsoluteError / n;
  };

  /**
   * Calculate Anomaly Correlation Coefficient
   */
  const calculateACC = (actual, predicted) => {
    if (!actual || !predicted || actual.length !== predicted.length) {
      return 0;
    }
    
    // Filter out null/undefined values
    const validPairs = actual.map((val, i) => [val, predicted[i]])
      .filter(pair => pair[0] !== null && pair[0] !== undefined && 
                      pair[1] !== null && pair[1] !== undefined);
    
    if (validPairs.length < 2) return 0;
    
    const n = validPairs.length;
    
    // Extract actual and predicted values
    const validActual = validPairs.map(pair => pair[0]);
    const validPredicted = validPairs.map(pair => pair[1]);
    
    // Calculate means
    const actualMean = validActual.reduce((sum, val) => sum + val, 0) / n;
    const predictedMean = validPredicted.reduce((sum, val) => sum + val, 0) / n;
    
    // Calculate anomalies (deviations from mean)
    const actualAnomalies = validActual.map(val => val - actualMean);
    const predictedAnomalies = validPredicted.map(val => val - predictedMean);
    
    // Calculate correlation coefficient
    let numerator = 0;
    let denomActual = 0;
    let denomPredicted = 0;
    
    for (let i = 0; i < n; i++) {
      numerator += actualAnomalies[i] * predictedAnomalies[i];
      denomActual += actualAnomalies[i] * actualAnomalies[i];
      denomPredicted += predictedAnomalies[i] * predictedAnomalies[i];
    }
    
    const denominator = Math.sqrt(denomActual * denomPredicted);
    
    // Handle edge case of no variability
    if (denominator === 0) {
      return 0;
    }
    
    // Ensure result is between 0 and 1 for this use case
    return Math.abs(numerator / denominator);
  };

  /**
   * Initially detect location and fetch data on component mount
   */
  useEffect(() => {
    // Try to detect user's location on initial load
    detectUserLocation();
    
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /**
   * Main data fetching effect - triggers when location changes
   */
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      
      try {
        // Get date range
        const dateRange = getDateRange();
        console.log(`Fetching data for range: ${dateRange.startDate} to ${dateRange.endDate} (API range)`);
        
        // Fetch data
        console.log("Fetching weather data...");
        await fetchHistoricalData();
        console.log("Weather data fetched successfully");
        
        setLoading(false);
      } catch (err) {
        console.error('Error fetching weather data:', err);
        setError(err.message || 'Failed to fetch and process weather data');
        setLoading(false);
      }
    };
    
    // Only fetch data if we have location coordinates
    if (location.lat && location.lon) {
      fetchData();
    }
  }, [location, fetchHistoricalData, getDateRange]);

  /**
   * Effect to handle timeframe changes
   */
  useEffect(() => {
    // Only refetch if we already have data and aren't currently loading
    if (rawData && historicalData && !loading) {
      fetchHistoricalData();
    }
  }, [timeframe, fetchHistoricalData]);

  /**
   * Get the display unit for the selected metric
   */
  const getMetricUnitDisplay = () => {
    switch(selectedMetric) {
      case 'temperature':
        return '°C';
      case 'precipitation':
        return 'mm';
      case 'wind':
        return 'km/h';
      case 'cloudCover':
        return '%';
      default:
        return '';
    }
  };

  /**
   * Get the display name for the selected metric
   */
  const getMetricLabel = () => {
    try {
      const metric = METRICS.find(m => m.id === selectedMetric);
      return metric ? metric.label : selectedMetric;
    } catch (err) {
      console.error('Error getting metric label:', err);
      return selectedMetric;
    }
  };
  
  /**
   * Generate a summary comparison tag for error metrics
   * For RMSE and MAE, lower is better; for ACC, higher is better
   * 
   * @param {string} metricType - Type of metric (rmse, mae, acc)
   * @param {boolean} higherIsBetter - Whether higher values are better (true for ACC)
   * @returns {JSX.Element|null} Comparison summary tag
   */
  const getMetricComparisonSummary = (metricType, higherIsBetter = false) => {
    const graphcastValue = errorMetrics[selectedMetric]?.graphcast?.[metricType];
    const nwpValue = errorMetrics[selectedMetric]?.nwp?.[metricType];
    
    // Check if we have valid values for comparison
    if (graphcastValue === undefined || 
        nwpValue === undefined || 
        graphcastValue === 0 || 
        nwpValue === 0) {
      return null;
    }
    
    // For RMSE and MAE, lower is better; for ACC, higher is better
    const isGraphcastBetter = higherIsBetter 
      ? graphcastValue > nwpValue 
      : graphcastValue < nwpValue;
    
    // Reference value for percentage calculation
    const referenceValue = higherIsBetter 
      ? (isGraphcastBetter ? nwpValue : graphcastValue) // For ACC, use the lower value as reference
      : (isGraphcastBetter ? nwpValue : graphcastValue); // For RMSE/MAE, use the higher value as reference
      
    // Calculate percentage difference
    const percentDifference = Math.abs(
      ((graphcastValue - nwpValue) / referenceValue) * 100
    ).toFixed(1);
    
    // Only show tag if difference is significant (over 1%)
    if (parseFloat(percentDifference) < 1) {
      return (
        <div className="metric-comparison-tag similar">
          Models perform similarly
        </div>
      );
    }
    
    return (
      <div className={`metric-comparison-tag ${isGraphcastBetter ? 'graphcast-better' : 'nwp-better'}`}>
        {isGraphcastBetter ? 'GraphCast better by ' : 'NWP better by '}
        {percentDifference}%
      </div>
    );
  };

  /**
   * Handle metric selection change
   */
  const handleMetricChange = (metric) => {
    setSelectedMetric(metric);
  };

  /**
   * Handle timeframe change
   */
  const handleTimeframeChange = () => {
    try {
      // Toggle between 7, 14, and 16 days
      const timeframes = ['7', '14', '16'];
      const currentIndex = timeframes.indexOf(timeframe);
      const nextIndex = (currentIndex + 1) % timeframes.length;
      setTimeframe(timeframes[nextIndex]);
    } catch (err) {
      console.error('Error changing timeframe:', err);
      // Default to 16 days if error
      setTimeframe('16');
    }
  };

  /**
   * Render loading state with progress indicator
   */
  const renderLoading = () => (
    <div className="dashboard-container">
      <div className="main-content">
        <div className="analysis-body">
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p>Loading weather data for {location.name}...</p>
          </div>
        </div>
      </div>
    </div>
  );

  /**
   * Render location detection loading state
   */
  const renderLocationLoading = () => (
    <div className="dashboard-container">
      <div className="main-content">
        <div className="analysis-body">
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p>Detecting your location...</p>
          </div>
        </div>
      </div>
    </div>
  );

  /**
   * Render error state with retry button
   */
  const renderError = () => (
    <div className="dashboard-container">
      <div className="main-content">
        <div className="analysis-body">
          <div className="error-message-container">
            <h2 className="error-title">Error Loading Data</h2>
            <p className="error-message">{error}</p>
            
            <ul className="error-checklist">
              <li>Check that your API keys are properly configured</li>
              <li>Verify that the backend services are running</li>
              <li>Ensure the date range is valid for the API</li>
            </ul>
            
            {rawData && (
              <div className="error-details">
                <h3>Raw Response:</h3>
                <pre className="error-json">
                  {JSON.stringify(rawData, null, 2)}
                </pre>
              </div>
            )}
            
            <button
              onClick={() => window.location.reload()}
              className="retry-button"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  /**
   * Render location error with retry option
   */
  const renderLocationError = () => (
    <div className="dashboard-container">
      <div className="main-content">
        <div className="analysis-body">
          <div className="error-message-container">
            <h2 className="error-title">Location Error</h2>
            <div className="error-icon">
              <AlertCircle size={48} />
            </div>
            <p className="error-message">{locationError}</p>
            <p>Using default location: {location.name}</p>
            
            <button
              onClick={detectUserLocation}
              className="retry-button"
            >
              <MapPin className="icon-left" size={16} />
              Retry Location Detection
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  /**
   * Custom tooltip for the chart
   */
  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const item = payload[0].payload;
      const unit = getMetricUnitDisplay();
      
      return (
        <div className="custom-tooltip">
          <p className="tooltip-label">{`Day ${item.day} (${item.displayDate || item.date})`}</p>
          <p className="tooltip-value">Historical (Ground Truth): {item.historical?.toFixed(1) || 'N/A'}{unit}</p>
          <p className="tooltip-value">GraphCast: {item.graphcast?.toFixed(1) || 'N/A'}{unit}</p>
          <p className="tooltip-value">NWP: {item.nwp?.toFixed(1) || 'N/A'}{unit}</p>
          {selectedMetric === 'temperature' && item.min && item.max && (
            <p className="tooltip-value">Range: {item.min.toFixed(1)}{unit} - {item.max.toFixed(1)}{unit}</p>
          )}
        </div>
      );
    }
    
    return null;
  };

  // Get data for the currently selected metric
  const selectedData = processedData[selectedMetric] || [];

  // If still detecting location
  if (locationLoading) {
    return renderLocationLoading();
  }

  // If location error occurred but we're using default location
  // and still loading data, show regular loading
  if (locationError && loading) {
    return renderLoading();
  }

  // If location error occurred but we're not loading data
  // show location error with option to retry
  if (locationError && !loading && !error && !locationDetected) {
    return renderLocationError();
  }

  // If loading
  if (loading) {
    return renderLoading();
  }

  // If error
  if (error) {
    return renderError();
  }

  return (
    <div className="dashboard-container">
      <div className="main-content">
        <div className="analysis-body">
          <div className="analysis-header">
            <h2 className="content-title">Weather Model Comparison</h2>
            <div className="content-description-wrapper">
              <p className="content-description">
                Comparing weather models against historical data for {getMetricLabel().toLowerCase()}.
                <span className="timeframe-info ml-2">
                  Display period: {dataTimeframe.startDate} to {dataTimeframe.endDate}
                </span>
              </p>

            </div>
          </div>

          <div className="metrics-selector">
            {METRICS.map((metric) => (
              <div key={metric.id} className="metric-button-container">
                <button
                  className={`metric-button ${
                    selectedMetric === metric.id ? 'active' : ''
                  }`}
                  onClick={() => handleMetricChange(metric.id)}
                >
                  {metric.icon}
                  <span className="ml-2">{metric.label}</span>
                </button>
              </div>
            ))}
            
            {/* Timeframe Toggle Button */}
            <button
              className="metric-button timeframe-toggle"
              onClick={handleTimeframeChange}
            >
              <span className="ml-2">{timeframe} Days</span>
            </button>
          </div>

          <div className="analysis-content">
            {/* Model Comparison Chart */}
            <div className="analysis-chart">
              <h3 className="chart-title">
                {getMetricLabel()} Forecast Comparison
                <span className="chart-unit">({getMetricUnitDisplay()})</span>
              </h3>
              <div style={{ width: '100%', height: 400 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={selectedData}
                    margin={{ top: 20, right: 30, left: 20, bottom: 30 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="day" 
                      name="Day" 
                      type="number"
                      domain={[1, 'dataMax']}
                      tickFormatter={(day) => `Day ${day}`}
                      label={{ 
                        value: 'Day', 
                        position: 'insideBottom', 
                        offset: -5,
                        fontSize: 14
                      }}
                      interval={Math.ceil(selectedData.length / 10)}
                      allowDecimals={false}
                      padding={{ left: 10, right: 10 }}
                    />
                    <YAxis 
                      label={{ 
                        value: `${getMetricLabel()} (${getMetricUnitDisplay()})`, 
                        angle: -90, 
                        position: 'insideLeft',
                        offset: -5,
                        fontSize: 14
                      }}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend verticalAlign="top" height={36} />
                    <Line 
                      name="Historical Data (Ground Truth)" 
                      dataKey="historical" 
                      stroke="#8884d8" 
                      strokeWidth={2}
                      type="monotone"
                      dot={{ r: 4, strokeWidth: 1 }}
                      activeDot={{ r: 6, strokeWidth: 1, stroke: '#fff' }}
                      connectNulls={false}
                    />
                    <Line 
                      name="GraphCast Model" 
                      dataKey="graphcast" 
                      stroke="#82ca9d" 
                      strokeWidth={2}
                      strokeDasharray="5 5"
                      type="monotone"
                      dot={{ r: 4, strokeWidth: 1 }}
                      activeDot={{ r: 6, strokeWidth: 1, stroke: '#fff' }}
                      connectNulls={false}
                    />
                    <Line 
                      name="NWP Model" 
                      dataKey="nwp" 
                      stroke="#ff7300" 
                      strokeWidth={2}
                      strokeDasharray="3 3"
                      type="monotone"
                      dot={{ r: 4, strokeWidth: 1 }}
                      activeDot={{ r: 6, strokeWidth: 1, stroke: '#fff' }}
                      connectNulls={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div className="analysis-details">
              <h3 className="details-title">Model Performance Metrics</h3>
              <div className="details-subtitle">
                {getMetricLabel()} Comparison Metrics
              </div>
              
              {/* Error metrics visualization */}
              <div className="error-metrics-container">
                <div className="error-metric-chart">
                  <h4 className="error-metric-title">
                    Root Mean Square Error (RMSE)
                  </h4>
                  <ResponsiveContainer width="100%" height={80}>
                    <BarChart
                      data={[
                        { 
                          name: 'GraphCast', 
                          value: errorMetrics[selectedMetric]?.graphcast?.rmse || 0 
                        },
                        { 
                          name: 'NWP', 
                          value: errorMetrics[selectedMetric]?.nwp?.rmse || 0 
                        }
                      ]}
                      layout="vertical"
                      margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                    >
                      <XAxis type="number" hide />
                      <YAxis dataKey="name" type="category" width={80} />
                      <Tooltip 
                        formatter={(value) => [`${value.toFixed(2)}`, 'RMSE']}
                        labelFormatter={() => ''}
                      />
                      <Bar dataKey="value" nameKey="name">
                        {[
                          <Cell key="cell-0" fill="#82ca9d" />,
                          <Cell key="cell-1" fill="#ff7300" />
                        ]}
                      </Bar>
                      <ReferenceLine x={0} stroke="#666" />
                    </BarChart>
                  </ResponsiveContainer>
                  {getMetricComparisonSummary('rmse')}
                </div>
                
                <div className="error-metric-chart">
                  <h4 className="error-metric-title">
                    Mean Absolute Error (MAE)
                  </h4>
                  <ResponsiveContainer width="100%" height={80}>
                    <BarChart
                      data={[
                        { 
                          name: 'GraphCast', 
                          value: errorMetrics[selectedMetric]?.graphcast?.mae || 0 
                        },
                        { 
                          name: 'NWP', 
                          value: errorMetrics[selectedMetric]?.nwp?.mae || 0 
                        }
                      ]}
                      layout="vertical"
                      margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                    >
                      <XAxis type="number" hide />
                      <YAxis dataKey="name" type="category" width={80} />
                      <Tooltip 
                        formatter={(value) => [`${value.toFixed(2)}`, 'MAE']}
                        labelFormatter={() => ''}
                      />
                      <Bar dataKey="value" nameKey="name">
                        {[
                          <Cell key="cell-0" fill="#82ca9d" />,
                          <Cell key="cell-1" fill="#ff7300" />
                        ]}
                      </Bar>
                      <ReferenceLine x={0} stroke="#666" />
                    </BarChart>
                  </ResponsiveContainer>
                  {getMetricComparisonSummary('mae')}
                </div>
                
                <div className="error-metric-chart">
                  <h4 className="error-metric-title">
                    Anomaly Correlation Coefficient (ACC)
                  </h4>
                  <ResponsiveContainer width="100%" height={80}>
                    <BarChart
                      data={[
                        { 
                          name: 'GraphCast', 
                          value: errorMetrics[selectedMetric]?.graphcast?.acc || 0 
                        },
                        { 
                          name: 'NWP', 
                          value: errorMetrics[selectedMetric]?.nwp?.acc || 0 
                        }
                      ]}
                      layout="vertical"
                      margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                    >
                      <XAxis type="number" domain={[0, 1]} hide />
                      <YAxis dataKey="name" type="category" width={80} />
                      <Tooltip 
                        formatter={(value) => [`${value.toFixed(2)}`, 'ACC']}
                        labelFormatter={() => ''}
                      />
                      <Bar dataKey="value" nameKey="name">
                        {[
                          <Cell key="cell-0" fill="#82ca9d" />,
                          <Cell key="cell-1" fill="#ff7300" />
                        ]}
                      </Bar>
                      <ReferenceLine x={0.7} stroke="#666" strokeDasharray="3 3" />
                    </BarChart>
                  </ResponsiveContainer>
                  {getMetricComparisonSummary('acc', true)}
                </div>
              </div>
              
              {/* Performance summary */}
              <div className="metric-summary">
                <h4 className="summary-title">Performance Summary</h4>
                <p className="summary-text">
                  This visualization compares actual weather measurements with model forecasts.
                  The data shows how GraphCast (AI-based) and traditional NWP models perform
                  for {getMetricLabel().toLowerCase()} prediction using historical data as ground truth.
                </p>
                <p className="data-note">
                  Data shown for location: {location.name} ({location.lat.toFixed(2)}, {location.lon.toFixed(2)})
                </p>
              </div>
            </div>
          </div>
          
          {/* Display Raw API Response Data for debugging - comment out for production */}
          {rawData && false && (
            <div className="raw-data-section" style={{ marginTop: '2rem', padding: '1rem', border: '1px solid #ddd', borderRadius: '0.5rem' }}>
              <h3 className="section-title">Raw API Response</h3>
              <p>This section is for debugging only - it shows the raw API response from backend.</p>
              <div className="raw-data-container" style={{ maxHeight: '400px', overflow: 'auto' }}>
                <pre style={{ fontSize: '12px', whiteSpace: 'pre-wrap' }}>{JSON.stringify(rawData, null, 2)}</pre>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Analysis;