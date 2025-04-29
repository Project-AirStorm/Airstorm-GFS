// File: Airstorm-GFS/frontend/src/components/specific/WeatherModelComparison/WeatherModelComparison.js
import React, { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
import {
  Thermometer, Droplets, Wind, Clock, Calendar, ChevronDown, Plus, MapPin, Info, ChevronRight
} from 'lucide-react';

// Import Child Components
import ErrorState from './ErrorState';
import SpeedLoader from '../../common/speedloader/speedloader';
import ErrorMetrics from './ErrorMetrics';
import ComparisonChart from './ComparisonChart';
import PerformancePieChart from './PerformancePieChart';
import AddLocationPopup from '../../specific/AddLocationPopup/AddLocationPopup';

// Import Utilities & Context
// import { UserSession } from '../../../utils/UserSession'; // <-- Remove UserSession
import { useUserProfile } from '../../../contexts/UserContext'; // <-- Import useUserProfile
import { fetchHistoricalData, processWeatherData } from './dataUtils';

// Import Styles
import './WeatherModelComparison.css';

// Constants
const REACT_APP_API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001';

const MODELS = {
  GRAPHCAST: "gfs_graphcast025",
  NWP: "gfs_hrrr"
};

const METRICS = [
  { id: 'temperature', apiId: 'temperature_2m', label: 'Temperature', icon: <Thermometer className="metric-icon" />, unit: '°C' },
  { id: 'precipitation', apiId: 'precipitation', label: 'Precipitation', icon: <Droplets className="metric-icon" />, unit: 'mm' },
  { id: 'wind', apiId: 'wind_speed_10m', label: 'Wind Speed', icon: <Wind className="metric-icon" />, unit: 'km/h' },
];

// Location Selector Component
const LocationSelector = ({ locations, onSelectLocation, onAddLocation, selectedLocation }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  const toggleDropdown = () => setIsOpen(!isOpen);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="location-selector-wrapper" ref={dropdownRef}>
      <button className="location-selector-button control-button" onClick={toggleDropdown} aria-expanded={isOpen}>
        <MapPin size={16} className="control-icon" />
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
                  onClick={() => { onSelectLocation(loc); setIsOpen(false); }}
                >
                  <div className="location-option-content">
                    <span className="location-name">{loc.name}</span>
                    <span className="location-coords">{loc.latitude.toFixed(4)}, {loc.longitude.toFixed(4)}</span>
                  </div>
                  {loc.isFavorite && <span className="location-favorite">★</span>}
                </button>
              ))}
              <div className="location-divider"></div>
            </>
          ) : <div className="no-locations-message">No saved locations</div>}
          <button className="add-location-option" onClick={() => { onAddLocation(); setIsOpen(false); }}> {/* Close dropdown on add click */}
            <Plus size={16} /> <span>Add New Location</span>
          </button>
        </div>
      )}
    </div>
  );
};


/**
 * Main Weather Model Comparison component
 */
const WeatherModelComparison = () => {
  // const { user } = UserSession(); // <-- Remove UserSession hook
  const { savedLocations, isLocationLoading, refreshAlerts } = useUserProfile(); // <-- Use UserContext hook

  const [selectedMetric, setSelectedMetric] = useState('temperature');
  const [timeframe, setTimeframe] = useState('16');
  // const [savedLocations, setSavedLocations] = useState([]); // <-- Remove local state
  const [rawData, setRawData] = useState(null);
  const [processedData, setProcessedData] = useState({ temperature: [], precipitation: [], wind: [] });
  const [errorMetrics, setErrorMetrics] = useState({ temperature: {}, precipitation: {}, wind: {} });
  const [accuracyComparison, setAccuracyComparison] = useState({ temperature: [], precipitation: [], wind: [] });
  const [showLocationPopup, setShowLocationPopup] = useState(false);
  const [loading, setLoading] = useState(true); // This tracks component-specific loading (weather data)
  const [error, setError] = useState(null);
  const [location, setLocation] = useState(null); // Currently selected location

  // Effect to auto-select first location when context finishes loading locations
  useEffect(() => {
    // Only run if locations are loaded from context and no location is currently selected
    if (!isLocationLoading && savedLocations.length > 0 && !location) {
      const firstLocation = savedLocations[0];
      handleLocationSelected(firstLocation); 
    } else if (!isLocationLoading && savedLocations.length === 0 && !location) {
      // If no saved locations after loading, ensure component loading stops
      setLoading(false);
    }
  }, [isLocationLoading, savedLocations, location]); // Add location to deps

  // Callback to get date range
  const getCurrentDateRange = useCallback(() => {
    const currentDate = new Date();
    const endDate = new Date(currentDate);
    endDate.setDate(endDate.getDate() - 5); // Data fetching ends 5 days ago
    const startDate = new Date(endDate);
    
    // Subtract (timeframe - 1) days to get the correct inclusive start date
    startDate.setDate(startDate.getDate() - (parseInt(timeframe, 10) - 1)); 

    
    const startDateString = startDate.toISOString().split('T')[0];
    const endDateString = endDate.toISOString().split('T')[0];

    console.log(`Timeframe: ${timeframe}, Start Date: ${startDateString}, End Date: ${endDateString}`);

    return {
      startDate: startDateString,
      endDate: endDateString
    };
}, [timeframe]);

  // REMOVE fetchSavedLocations - Handled by UserContext now

  // Effect to fetch weather data when location or timeframe changes
  useEffect(() => {
    const fetchAndProcessData = async () => {
      if (!location) {
        // Still wait for a location to be selected or determined non-existent
        if (!isLocationLoading && savedLocations.length === 0) {
             setLoading(false); // No locations, stop loading
        } else if (!isLocationLoading) {
            // Locations exist, but none selected yet - Keep loading indicator until selection
             setLoading(true);
        }
        return; // Don't fetch weather without location
      }

      setLoading(true); // Start weather data loading
      setError(null);
      // Clear previous data to avoid showing stale info during load
      setProcessedData({ temperature: [], precipitation: [], wind: [] });
      setErrorMetrics({ temperature: {}, precipitation: {}, wind: {} });
      setAccuracyComparison({ temperature: [], precipitation: [], wind: [] });

      try {
        const dateRange = getCurrentDateRange();
        const weatherData = await fetchHistoricalData(
          location.lat, location.lon, dateRange, REACT_APP_API_URL, MODELS
        );
        setRawData(weatherData); // Store for potential error display

        const processed = processWeatherData(
          weatherData.historical, weatherData.forecast, METRICS, MODELS
        );
        setProcessedData(processed);

        // Calculate Error Metrics and Accuracy Comparison
        const { metrics, accuracy } = calculateAllMetrics(processed);
        setErrorMetrics(metrics);
        setAccuracyComparison(accuracy);

      } catch (err) {
        console.error('Error fetching or processing weather data:', err);
        setError(err.message || 'Failed to fetch or process weather data');
      } finally {
        setLoading(false); // Finish weather data loading
      }
    };

    // Only run if context is not loading locations OR if a location is already set
    // Prevents fetching before location list is available or a location is selected
    if (!isLocationLoading || location) {
       fetchAndProcessData();
    }

  }, [location, timeframe, getCurrentDateRange, isLocationLoading, savedLocations]); // Added context loading state dependencies

  // Metric Calculation (no changes needed)
  const calculateAllMetrics = (data) => {
      const metrics = {};
      const accuracy = {};
      Object.keys(data).forEach(metricKey => {
        const metricData = data[metricKey];
        let graphcastWins = 0;
        let nwpWins = 0;
        if (!metricData || metricData.length === 0) {
          metrics[metricKey] = { graphcast: {}, nwp: {} };
          accuracy[metricKey] = [];
          return;
        }
        const validData = metricData.filter(point =>
          point.historical !== null && point.graphcast !== null && point.nwp !== null
        );
        if (validData.length < 2) {
          metrics[metricKey] = { graphcast: {}, nwp: {} };
          accuracy[metricKey] = [];
          return;
        }
        metrics[metricKey] = {
          graphcast: calculateSingleModelMetrics(validData, 'historical', 'graphcast'),
          nwp: calculateSingleModelMetrics(validData, 'historical', 'nwp')
        };
        validData.forEach(point => {
          const graphcastError = Math.abs(point.graphcast - point.historical);
          const nwpError = Math.abs(point.nwp - point.historical);
          if (graphcastError < nwpError) {
            graphcastWins++;
          } else if (nwpError < graphcastError) {
            nwpWins++;
          }
        });
        accuracy[metricKey] = [
          { name: 'GraphCast Better', value: graphcastWins },
          { name: 'NWP Better', value: nwpWins },
        ];
      });
      return { metrics, accuracy };
  };
  const calculateSingleModelMetrics = (data, truthKey, modelKey) => {
      const truth = data.map(point => point[truthKey]);
      const predictions = data.map(point => point[modelKey]);
      const n = truth.length;
      if (n === 0) return { rmse: null, mae: null, acc: null };
      const truthMean = truth.reduce((sum, val) => sum + val, 0) / n;
      const predictionsMean = predictions.reduce((sum, val) => sum + val, 0) / n;
      let sumSquaredError = 0;
      let sumAbsError = 0;
      let numerator = 0;
      let denomTruth = 0;
      let denomPred = 0;
      for (let i = 0; i < n; i++) {
        const error = predictions[i] - truth[i];
        sumSquaredError += error * error;
        sumAbsError += Math.abs(error);
        const truthAnomaly = truth[i] - truthMean;
        const predAnomaly = predictions[i] - predictionsMean;
        numerator += truthAnomaly * predAnomaly;
        denomTruth += truthAnomaly * truthAnomaly;
        denomPred += predAnomaly * predAnomaly;
      }
      const rmse = Math.sqrt(sumSquaredError / n);
      const mae = sumAbsError / n;
      const accDenominator = Math.sqrt(denomTruth) * Math.sqrt(denomPred);
      const acc = (accDenominator === 0 || Math.abs(accDenominator) < 1e-9) ? 0 : numerator / accDenominator;
      return { rmse, mae, acc };
  };

  // Handlers
  const toggleTimeframe = () => setTimeframe(tf => tf === '16' ? '7' : '16');
  const handleShowAddLocation = () => setShowLocationPopup(true);

  const handleLocationSelected = (newLocation) => {
    // Ensure newLocation has the expected structure before setting state
    if (!newLocation || typeof newLocation.latitude === 'undefined' || typeof newLocation.longitude === 'undefined') {
        console.warn("Attempted to select an invalid location:", newLocation);
        return;
    }
    const formattedLocation = {
        lat: newLocation.latitude,
        lon: newLocation.longitude,
        name: newLocation.name || `${newLocation.latitude.toFixed(2)}, ${newLocation.longitude.toFixed(2)}` // Fallback name
    };
    setLocation(formattedLocation);
    setShowLocationPopup(false); // Close popup if open
  };

  const handleLocationAdded = (addedLocation) => {
    // Use the refresh function from UserContext to update locations globally
    refreshAlerts(); // This function now refreshes locations in the context
    // Select the newly added location (context update might re-trigger selection effect, but explicit selection is okay)
    handleLocationSelected(addedLocation);
    setShowLocationPopup(false);
  };

  // Render Helpers (no changes needed)
  const getCurrentMetricData = () => processedData[selectedMetric] || [];
  const getMetricUnit = () => METRICS.find(m => m.id === selectedMetric)?.unit || '';
  const getMetricLabel = () => METRICS.find(m => m.id === selectedMetric)?.label || '';
  const getAccuracyData = () => accuracyComparison[selectedMetric] || [];
  const hasData = getCurrentMetricData().length > 0;

  // --- Main Render ---
  return (
    <div className="analysis-page-container">
      {/* Header Card */}
      <div className="analysis-card analysis-header-card">
         <h2 className="analysis-title">Weather Model Comparison</h2>
         <p className="analysis-description">
           Compare the performance of GraphCast AI and traditional NWP models against historical weather data.
           {location && !loading && ( // Show timeframe info only when data is loaded for a location
             <span className="timeframe-info"> Currently showing data for {location.name} for the past {timeframe} days. Due to historical weather data processing, this means it ends at {(() => {
              const endDate = new Date(getCurrentDateRange().endDate);
              endDate.setDate(endDate.getDate()); // No subtraction here, endDate is already 5 days ago
              return endDate.toLocaleDateString(); // Format the date for display
              })()}, which is 5 days ago.</span>
             )}
             {!location && !isLocationLoading && savedLocations.length > 0 && (
              <span className="timeframe-info"> Select a location to view comparison.</span>
             )}
             </p>
            </div>

            {/* Controls Card */}
      <div className="analysis-card analysis-controls-card">
         {/* Metrics Selector */}
         <div className="controls-section metrics-controls">
           <span className="control-label">Metric:</span>
           {METRICS.map((metric) => (
             <button
               key={metric.id}
               className={`control-button metric-button ${selectedMetric === metric.id ? 'active' : ''}`}
               onClick={() => setSelectedMetric(metric.id)}
               title={`Select ${metric.label}`}
             >
               {metric.icon}
               <span className="metric-label">{metric.label}</span>
             </button>
           ))}
         </div>
         {/* Timeframe & Location Selector */}
         <div className="controls-section time-location-controls">
            <span className="control-label">Timeframe:</span>
            <button className="control-button timeframe-button" onClick={toggleTimeframe} title={`Toggle timeframe (Current: ${timeframe} days)`}>
              {timeframe === '16' ? <Calendar size={16} className="control-icon"/> : <Clock size={16} className="control-icon"/>}
              <span>{timeframe === '16' ? '16 Days' : '7 Days'}</span>
            </button>
            <span className="control-label">Location:</span>
            {isLocationLoading ? (
               <div className='location-loading-placeholder'>Loading locations...</div>
            ) : (
               <LocationSelector
                 locations={savedLocations} // <-- Use savedLocations from context
                 onSelectLocation={handleLocationSelected}
                 onAddLocation={handleShowAddLocation}
                 selectedLocation={location}
               />
            )}
         </div>
      </div>

      {/* Content Area: Shows message, loader, error, or the main grid */}
      <div className="analysis-content-area">
      {/* Show initial loader if context OR component is loading */}
      {(isLocationLoading || (loading && location)) && !error ? (
           <div className="analysis-card loading-container">
               <SpeedLoader variant="primary" size="large" />
               <p>{isLocationLoading ? 'Loading your locations...' : `Loading weather data comparison for ${location?.name}...`}</p>
           </div>
      ) : !isLocationLoading && savedLocations.length === 0 ? (
           // No locations found after loading
           <div className="analysis-card no-locations-message">
                <h2>No Locations Saved</h2>
                <p>You need to save at least one location to compare weather models.</p>
                <button className="add-location-button control-button" onClick={handleShowAddLocation}>
                   <Plus size={16} /> Add New Location
                </button>
            </div>
      ) : !location && !isLocationLoading && savedLocations.length > 0 ? (
          // Locations loaded, but none selected (prompt user)
          <div className="analysis-card please-select-message">
              <h2>Select a Location</h2>
              <p>Please choose a location from the dropdown above to view the weather model comparison.</p>
          </div>
      ) : error ? (
          // Error state display
         <div className="analysis-card">
             <ErrorState error={error} rawData={rawData} /> {/* Pass rawData here */}
          </div>
      ) : (
        // Main content grid (weather data loaded without errors for a selected location)
        <div className="analysis-grid">
            {/* Left column: Chart and Explanation */}
            <div className="analysis-left-column">
                {/* Comparison Chart Card */}
                <div className="analysis-card analysis-chart-card">
                    {hasData ? (
                        <ComparisonChart
                            data={getCurrentMetricData()}
                            metricName={getMetricLabel()}
                            metricUnit={getMetricUnit()}
                        />
                    ) : (
                        // Placeholder if no data for the selected metric
                        <div className="chart-placeholder">
                           <p>No comparison data available for {getMetricLabel()} at {location?.name}.</p>
                        </div>
                    )}
                </div>

                {/* Explanation Card - Using collapsible <details> elements */}
                <div className="analysis-card analysis-explanation-card">
                   <div className="explanation-section">
                       {/* Added style directly for simplicity, could be moved to CSS */}
                        <details open>
                            <summary style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                                <Info className="summary-icon" size={16} style={{ marginRight: '4px' }} />
                                <ChevronRight className="summary-icon" size={16} style={{ marginRight: '8px' }}/>
                                How the Comparison Works
                            </summary>
                            <div className="explanation-content">
                                <p className="explanation-text">
                                    This section compares forecasts from Google's <span className="explanation-highlight">GraphCast (AI)</span> and a traditional <span className="explanation-highlight">NWP</span> model against <span className="explanation-highlight">Historical Observations</span> (ground truth) for the selected location and metric.
                                </p>
                                <h5 className="explanation-subtitle">Line Chart:</h5>
                                <p className="explanation-text">Shows daily values (average for temperature/wind, sum for precipitation) calculated from hourly data for each source.</p>
                                <h5 className="explanation-subtitle">Error Metrics (Bars):</h5>
                                <p className="explanation-text">Standard metrics (RMSE, MAE, ACC) comparing daily forecasts (GraphCast/NWP) against daily Historical values. Lower RMSE/MAE and higher ACC indicate better performance.</p>
                                <h5 className="explanation-subtitle">Accuracy Frequency (Pie):</h5>
                                <p className="explanation-text">Percentage of days where each model's forecast had a lower absolute error compared to the Historical data. The faded slice performed better less often.</p>
                            </div>
                        </details>

                        <details>
                           <summary style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                               <ChevronRight className="summary-icon" size={16} style={{ marginRight: '8px' }}/>
                                Limitations & Considerations
                            </summary>
                             <div className="explanation-content">
                                <ul className="explanation-list">
                                    <li><span className="explanation-highlight">Data Lag:</span> Historical data typically has a delay, so the comparison period ends a few days before today ({getCurrentDateRange().endDate}).</li>
                                    <li><span className="explanation-highlight">Model Versions:</span> Uses operational model versions available via Open-Meteo (e.g., GraphCast ~0.25° resolution, NWP might be HRRR 3km). Research versions may differ.</li>
                                    <li><span className="explanation-highlight">AI Characteristics:</span> AI models can sometimes "smooth" data, potentially affecting accuracy for local, high-variability events compared to physics-based NWP.</li>
                                    <li><span className="explanation-highlight">Performance Variability:</span> Accuracy varies significantly by location, weather situation, forecast day, and the specific metric.</li>
                                    <li><span className="explanation-highlight">Daily Aggregation:</span> Viewing daily values can mask performance differences seen at the hourly level.</li>
                                </ul>
                            </div>
                        </details>
                    </div>
                </div> {/* End of Explanation Card */}
            </div> {/* End of left column */}


            {/* Right column: Metrics Card (Error Metrics + Pie Chart) */}
            <div className="analysis-card analysis-metrics-card">
               <div className="metrics-card-content">
                 {/* Render Error Metrics component */}
                 <ErrorMetrics
                   selectedMetric={selectedMetric}
                   errorMetrics={errorMetrics}
                   metricLabel={getMetricLabel()}
                   location={location} // Pass selected location name/coords
                 />
                 {/* Render Performance Pie Chart component */}
                 <PerformancePieChart
                    data={getAccuracyData()}
                    metricLabel={getMetricLabel()}
                  />
              </div>
            </div>
          </div> // End of analysis-grid
        )}
      </div>

      {/* Add Location Popup Modal (conditionally rendered) */}
      {showLocationPopup && (
        <AddLocationPopup
          isOpen={showLocationPopup}
          onClose={() => setShowLocationPopup(false)}
          onLocationAdded={handleLocationAdded} // This now uses context refresh
        />
      )}
    </div>
  );
};

export default WeatherModelComparison;