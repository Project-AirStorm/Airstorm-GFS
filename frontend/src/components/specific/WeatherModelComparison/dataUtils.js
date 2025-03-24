// src/components/specific/WeatherModelComparison/dataUtils.js
import axios from 'axios';

/**
 * Fetch all weather data using the historical-forecasts endpoint for both NWP and GraphCast
 * 
 * @param {number} lat - Latitude coordinate
 * @param {number} lon - Longitude coordinate
 * @param {Object} dateRange - Object containing startDate and endDate
 * @param {string} apiUrl - Base API URL
 * @param {Object} models - Object containing model identifiers
 * @returns {Promise<Object>} - Promise resolving to historical and forecast data
 */
export const fetchHistoricalData = async (lat, lon, dateRange, apiUrl, models) => {
  try {
    // Parameters for API requests
    const hourlyParams = "temperature_2m,cloud_cover,precipitation,wind_speed_10m";
    
    // Fetch real historical weather data as ground truth
    console.log("Fetching historical weather data...");
    const historicalResponse = await axios.get(`${apiUrl}/api/historical-weather`, {
      params: {
        latitude: lat,
        longitude: lon,
        start_date: dateRange.startDate,
        end_date: dateRange.endDate,
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
    
    // Fetch forecast data from both models in one request
    console.log("Fetching historical forecast data for both models...");
    const forecastResponse = await axios.get(`${apiUrl}/api/historical-forecasts`, {
      params: {
        latitude: lat,
        longitude: lon,
        start_date: dateRange.startDate,
        end_date: dateRange.endDate,
        hourly: hourlyParams,
        models: `${models.NWP},${models.GRAPHCAST}`, // Request both models
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
    
    throw new Error(
      err.response?.data?.error || 
      err.message || 
      'Failed to fetch weather data'
    );
  }
};

/**
 * Process weather data from historical-weather and historical-forecasts endpoints
 * 
 * @param {Object} historicalData - Historical weather data
 * @param {Object} forecastData - Forecast data
 * @param {Array} metrics - Array of metric configurations
 * @param {Object} models - Object containing model identifiers
 * @returns {Object} Processed data organized by metric
 */
export const processWeatherData = (historicalData, forecastData, metrics, models) => {
  try {
    // Validate historical data structure
    if (!historicalData || !historicalData.hourly || !historicalData.hourly.time) {
      console.error("Invalid historical data format");
      throw new Error("Historical weather data is incomplete or in an unexpected format");
    }
    
    // Validate forecast data
    if (!forecastData) {
      console.error("Forecast data is null or undefined");
      throw new Error("Forecast data is missing");
    }
    
    console.log("Processing data from historical-forecasts endpoint");
    
    if (!forecastData.hourly) {
      console.error("Forecast data missing hourly section");
      console.error("Raw forecast data:", forecastData);
      throw new Error("Forecast data is missing hourly measurements");
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
    
    // Helper function to get the model parameter key
    const getModelParamKey = (model, param) => {
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
    
    // Process each metric
    for (const metric of metrics) {
      const apiParam = metric.apiId;
      const metricId = metric.id;
      
      // Check for historical data
      if (!histHourly[apiParam]) {
        console.warn(`Historical data missing ${apiParam}`);
        continue;
      }
      
      // Find the GraphCast data key
      const graphcastKey = getModelParamKey(models.GRAPHCAST, apiParam);
      // Find the NWP data key
      const nwpKey = getModelParamKey(models.NWP, apiParam);
      
      console.log(`${metricId} - GraphCast key format: ${graphcastKey || "NOT FOUND"}`);
      console.log(`${metricId} - NWP key format: ${nwpKey || "NOT FOUND"}`);
      
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
    
    // Apply timeframe filtering
    const maxDays = 16; // Default max days
    
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
    
    return limitedData;
    
  } catch (error) {
    console.error("Error processing weather data:", error);
    throw new Error(`Failed to process weather data: ${error.message}`);
  }
};