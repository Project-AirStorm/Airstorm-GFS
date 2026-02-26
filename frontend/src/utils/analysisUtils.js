// src/utils/analysisUtils.js

/**
 * Process data from the Previous Runs API and historical data
 * 
 * @param {Object} historicalData - Historical weather data
 * @param {Object} previousRunsData - Data from Previous Runs API
 * @returns {Object} Processed data for visualization
 */
export const processPreviousRunsData = (historicalData, previousRunsData) => {
  const processedData = {
    temperature: [],
    precipitation: [],
    wind: [],
    humidity: []
  };
  
  try {
    console.log("Processing data from historical and Previous Runs API");
    
    // Extract historical hourly data
    const historicalHourly = historicalData?.hourly || {};
    
    // Extract GraphCast data
    const graphCastData = previousRunsData?.gfs_graphcast025?.hourly || {};
    
    // Extract NWP (HRRR) data
    const nwpData = previousRunsData?.gfs_hrrr?.hourly || {};
    
    // Get time arrays
    const historicalTimes = historicalHourly.time || [];
    const graphCastTimes = graphCastData.time || [];
    const nwpTimes = nwpData.time || [];
    
    // Check if we have sufficient data
    if (historicalTimes.length === 0) {
      console.error("No historical time data available");
      return processedData;
    }
    
    // Extract unique days from historical data
    const days = [...new Set(historicalTimes.map(time => time.split('T')[0]))].sort();
    console.log(`Processing ${days.length} unique days from ${days[0]} to ${days[days.length - 1]}`);
    
    // Create day -> indices mappings for each data source
    const historicalDayIndices = createDayIndicesMap(historicalTimes);
    const graphCastDayIndices = createDayIndicesMap(graphCastTimes);
    const nwpDayIndices = createDayIndicesMap(nwpTimes);
    
    // Process each day
    days.forEach((day, index) => {
      const dayIndices = {
        historical: historicalDayIndices[day] || [],
        graphcast: graphCastDayIndices[day] || [],
        nwp: nwpDayIndices[day] || []
      };
      
      // Skip days with no historical data
      if (dayIndices.historical.length === 0) {
        console.warn(`No historical data indices for day ${day}`);
        return;
      }
      
      // Process temperature data
      const avgTemps = {
        historical: calculateDailyAverage(historicalHourly.temperature_2m, dayIndices.historical),
        graphcast: calculateDailyAverage(graphCastData.temperature_2m, dayIndices.graphcast),
        nwp: calculateDailyAverage(nwpData.temperature_2m, dayIndices.nwp)
      };
      
      // Process precipitation data
      const avgPrecip = {
        historical: calculateDailyAverage(historicalHourly.precipitation, dayIndices.historical),
        graphcast: calculateDailyAverage(graphCastData.precipitation, dayIndices.graphcast),
        nwp: calculateDailyAverage(nwpData.precipitation, dayIndices.nwp)
      };
      
      // Process wind speed data
      const avgWind = {
        historical: calculateDailyAverage(historicalHourly.wind_speed_10m, dayIndices.historical),
        graphcast: calculateDailyAverage(graphCastData.wind_speed_10m, dayIndices.graphcast),
        nwp: calculateDailyAverage(nwpData.wind_speed_10m, dayIndices.nwp)
      };
      
      // Process humidity data
      const avgHumidity = {
        historical: calculateDailyAverage(historicalHourly.relative_humidity_2m, dayIndices.historical),
        graphcast: calculateDailyAverage(graphCastData.relative_humidity_2m, dayIndices.graphcast),
        nwp: calculateDailyAverage(nwpData.relative_humidity_2m, dayIndices.nwp)
      };
      
      // Add temperature data if historical value exists
      if (avgTemps.historical !== null) {
        processedData.temperature.push({
          day: index + 1,
          date: day,
          historical: avgTemps.historical,
          graphcast: avgTemps.graphcast,
          nwp: avgTemps.nwp
        });
      }
      
      // Add precipitation data if historical value exists
      if (avgPrecip.historical !== null) {
        processedData.precipitation.push({
          day: index + 1,
          date: day,
          historical: avgPrecip.historical,
          graphcast: avgPrecip.graphcast,
          nwp: avgPrecip.nwp
        });
      }
      
      // Add wind data if historical value exists
      if (avgWind.historical !== null) {
        processedData.wind.push({
          day: index + 1,
          date: day,
          historical: avgWind.historical,
          graphcast: avgWind.graphcast,
          nwp: avgWind.nwp
        });
      }
      
      // Add humidity data if historical value exists
      if (avgHumidity.historical !== null) {
        processedData.humidity.push({
          day: index + 1,
          date: day,
          historical: avgHumidity.historical,
          graphcast: avgHumidity.graphcast,
          nwp: avgHumidity.nwp
        });
      }
    });
    
    return processedData;
  } catch (err) {
    console.error("Error processing weather data:", err);
    return processedData;
  }
};

/**
 * Create a day -> indices mapping with improved error handling
 * 
 * @param {Array} timeArray - Array of time strings
 * @returns {Object} Map of day -> indices
 */
export const createDayIndicesMap = (timeArray) => {
  const dayIndicesMap = {};
  
  if (!timeArray || !Array.isArray(timeArray)) {
    console.warn("Invalid time array provided to createDayIndicesMap");
    return dayIndicesMap;
  }
  
  timeArray.forEach((timeStr, index) => {
    try {
      const day = timeStr.split('T')[0];
      if (!dayIndicesMap[day]) {
        dayIndicesMap[day] = [];
      }
      dayIndicesMap[day].push(index);
    } catch (err) {
      console.warn(`Error processing time value at index ${index}: ${timeStr}`, err);
    }
  });
  
  return dayIndicesMap;
};

/**
 * Calculate daily average of values with improved error handling
 * 
 * @param {Array} values - Array of values
 * @param {Array} indices - Array of indices to use
 * @returns {number|null} Average value or null if no valid values
 */
export const calculateDailyAverage = (values, indices) => {
  if (!values || !Array.isArray(values) || !indices || indices.length === 0) {
    return null;
  }
  
  let sum = 0;
  let count = 0;
  
  for (const idx of indices) {
    if (idx >= 0 && idx < values.length && 
        values[idx] !== null && values[idx] !== undefined && 
        !isNaN(values[idx])) {
      sum += values[idx];
      count++;
    }
  }
  
  if (count === 0) {
    return null; // No valid values found
  }
  
  return sum / count;
};

/**
 * Calculate Root Mean Square Error between actual and predicted values
 * 
 * @param {Array} actual - Array of actual values
 * @param {Array} predicted - Array of predicted values
 * @returns {number} RMSE value
 */
export const calculateRMSE = (actual, predicted) => {
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
 * Calculate Mean Absolute Error between actual and predicted values
 * 
 * @param {Array} actual - Array of actual values
 * @param {Array} predicted - Array of predicted values
 * @returns {number} MAE value
 */
export const calculateMAE = (actual, predicted) => {
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
 * Calculate Anomaly Correlation Coefficient between actual and predicted values
 * 
 * @param {Array} actual - Array of actual values
 * @param {Array} predicted - Array of predicted values
 * @returns {number} ACC value between 0 and 1
 */
export const calculateACC = (actual, predicted) => {
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
 * Calculate all error metrics for multiple model data
 * 
 * @param {Object} data - Object containing data arrays for different metrics
 * @returns {Object} Object containing error metrics for each model and metric type
 */
export const calculateAllMetrics = (data) => {
  // Create metrics structure matching the data structure keys
  const metrics = {};
  
  // Initialize the metrics structure based on available data keys
  Object.keys(data).forEach(metricType => {
    metrics[metricType] = { graphcast: {}, nwp: {} };
  });
  
  // For each metric type, calculate error metrics
  Object.keys(data).forEach(metricType => {
    if (!data[metricType] || data[metricType].length === 0) return;
    
    // Extract arrays of values for each model
    const historicalValues = data[metricType].map(item => item.historical);
    const graphcastValues = data[metricType].map(item => item.graphcast);
    const nwpValues = data[metricType].map(item => item.nwp);
    
    // Calculate metrics for GraphCast if we have valid data
    if (graphcastValues.some(val => val !== null && val !== undefined)) {
      metrics[metricType].graphcast = {
        rmse: calculateRMSE(historicalValues, graphcastValues),
        mae: calculateMAE(historicalValues, graphcastValues),
        acc: calculateACC(historicalValues, graphcastValues)
      };
    } else {
      console.warn(`No valid GraphCast values for ${metricType}`);
      metrics[metricType].graphcast = { rmse: 0, mae: 0, acc: 0 };
    }
    
    // Calculate metrics for NWP if we have valid data
    if (nwpValues.some(val => val !== null && val !== undefined)) {
      metrics[metricType].nwp = {
        rmse: calculateRMSE(historicalValues, nwpValues),
        mae: calculateMAE(historicalValues, nwpValues),
        acc: calculateACC(historicalValues, nwpValues)
      };
    } else {
      console.warn(`No valid NWP values for ${metricType}`);
      metrics[metricType].nwp = { rmse: 0, mae: 0, acc: 0 };
    }
  });
  
  return metrics;
};

/**
 * Generate a summary of model performance based on error metrics
 * 
 * @param {string} metric - Metric type (temperature, precipitation, wind, humidity)
 * @param {Object} errorMetrics - Object containing error metrics for each model and metric type
 * @returns {string} Performance summary text
 */
export const getPerformanceSummary = (metric, errorMetrics) => {
  const graphcastMetrics = errorMetrics[metric]?.graphcast || {};
  const nwpMetrics = errorMetrics[metric]?.nwp || {};
  
  // Check if we have valid metrics
  if (!graphcastMetrics.rmse && !nwpMetrics.rmse) {
    return `No valid metrics available for ${metric}.`;
  }
  
  // Compare models based on RMSE
  const hasGraphCastRMSE = typeof graphcastMetrics.rmse === 'number' && graphcastMetrics.rmse > 0;
  const hasNWPRMSE = typeof nwpMetrics.rmse === 'number' && nwpMetrics.rmse > 0;
  
  if (hasGraphCastRMSE && hasNWPRMSE) {
    const betterModel = graphcastMetrics.rmse < nwpMetrics.rmse 
      ? 'GraphCast' 
      : 'HRRR';
      
    const percentImprovement = Math.abs(
      ((graphcastMetrics.rmse - nwpMetrics.rmse) / nwpMetrics.rmse) * 100
    ).toFixed(1);
    
    const metricName = {
      'temperature': 'temperature',
      'precipitation': 'precipitation',
      'wind': 'wind speed',
      'humidity': 'humidity'
    }[metric] || metric;
    
    return `Based on RMSE, ${betterModel} shows better performance for ${metricName} forecasting with ${percentImprovement}% improvement. Actual historical measurements are used as the ground truth.`;
  }
  
  // Default summary if only one model has metrics
  return `This visualization compares actual weather measurements with GraphCast and HRRR model forecasts from the Previous Runs API. Lower RMSE/MAE and higher ACC indicate better performance.`;
};

/**
 * Get units for the specified weather metric with metric units
 * 
 * @param {string} metric - Metric type (temperature, precipitation, wind, humidity)
 * @returns {string} Unit string
 */
export const getMetricUnit = (metric) => {
  switch(metric) {
    case 'temperature':
      return '°C';
    case 'precipitation':
      return 'mm';
      
    case 'wind':
      return 'km/h';
    case 'humidity':
      return '%';
    default:
      return '';
  }
};