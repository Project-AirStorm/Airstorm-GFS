// File: Airstorm-GFS/frontend/src/components/specific/GraphCastForecast/GraphCastForecast.js
// Multiple Area shadings for ALL min/max pairs, Precip as Line on left axis, commented means, independent toggles.

import React, { useState, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
import axios from 'axios';
import { useUserProfile } from '../../../contexts/UserContext'; // Ensure path is correct
import {
  LineChart, // Using LineChart since no bars
  Line,
  Area, // Keep Area for shading
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
} from 'recharts';
import { IoLocationOutline } from 'react-icons/io5';
import { BsToggleOn, BsToggleOff } from "react-icons/bs";
import { variableStyles } from '../../../config/WeatherConfig'; // Ensure path is correct
import './GraphCastForecast.css';

const REACT_APP_API_URL =
  process.env.REACT_APP_API_URL || 'http://localhost:5001';

// --- Chart Line Configuration ---
// Commented out _mean variables, reverted precip to line/left axis
const chartLinesConfig = [
  // Temperatures
  { key: 'temperature_2m_max', name: 'Max Temp', color: variableStyles.temperature_2m?.color || '#E53E3E', unit: '°F', yAxisId: 'left', type: 'line' },
  { key: 'temperature_2m_min', name: 'Min Temp', color: variableStyles.temperature_2m?.altColor || '#3182CE', unit: '°F', yAxisId: 'left', type: 'line' },
  // { key: 'temperature_2m_mean', name: 'Mean Temp', color: variableStyles.temperature_2m?.meanColor || '#ECC94B', unit: '°F', yAxisId: 'left', type: 'line' },
  // { key: 'apparent_temperature_max', name: 'Max Feels Like', color: variableStyles.apparent_temperature?.color || '#DD6B20', unit: '°F', yAxisId: 'left', type: 'line' },
  // { key: 'apparent_temperature_min', name: 'Min Feels Like', color: variableStyles.apparent_temperature?.altColor || '#63B3ED', unit: '°F', yAxisId: 'left', type: 'line' },
  { key: 'dew_point_2m_max', name: 'Max Dew Point', color: variableStyles.dew_point_2m?.color || '#38A169', unit: '°F', yAxisId: 'left', type: 'line' },
  { key: 'dew_point_2m_min', name: 'Min Dew Point', color: variableStyles.dew_point_2m?.altColor || '#C6F6D5', unit: '°F', yAxisId: 'left', type: 'line' },
  // { key: 'dew_point_2m_mean', name: 'Mean Dew Point', color: variableStyles.dew_point_2m?.meanColor || '#68D391', unit: '°F', yAxisId: 'left', type: 'line' },
  // Precipitation
  { key: 'precipitation_probability_max', name: 'Max Precip %', color: variableStyles.precipitation_probability?.color || '#4FD1C5', unit: '%', yAxisId: 'left', type: 'line' },
  { key: 'precipitation_probability_min', name: 'Min Precip %', color: variableStyles.precipitation_probability?.altColor || '#81E6D9', unit: '%', yAxisId: 'left', type: 'line' },
  // { key: 'precipitation_probability_mean', name: 'Mean Precip %', color: variableStyles.precipitation_probability?.meanColor || '#38B2AC', unit: '%', yAxisId: 'left', type: 'line' },
  { key: 'precipitation_sum', name: 'Precip Sum', color: variableStyles.precipitation?.color || '#4299E1', unit: 'inch', yAxisId: 'left', type: 'line' }, // line, left axis
  { key: 'rain_sum', name: 'Rain Sum', color: variableStyles.rain?.color || '#63B3ED', unit: 'inch', yAxisId: 'left', type: 'line' }, // line, left axis
  // { key: 'showers_sum', name: 'Showers Sum', color: variableStyles.showers?.color || '#90CDF4', unit: 'inch', yAxisId: 'left', type: 'line' }, // Commented out
  { key: 'snowfall_sum', name: 'Snowfall Sum', color: variableStyles.snowfall?.color || '#EBF8FF', unit: 'inch', yAxisId: 'left', type: 'line' }, // line, left axis
  // Wind
  { key: 'wind_speed_10m_max', name: 'Max Wind Speed', color: variableStyles.wind_speed_10m?.color || '#805AD5', unit: 'mph', yAxisId: 'right', type: 'line' },
  { key: 'wind_speed_10m_min', name: 'Min Wind Speed', color: variableStyles.wind_speed_10m?.altColor || '#B794F4', unit: 'mph', yAxisId: 'right', type: 'line' },
  // { key: 'wind_speed_10m_mean', name: 'Mean Wind Speed', color: variableStyles.wind_speed_10m?.meanColor || '#9F7AEA', unit: 'mph', yAxisId: 'right', type: 'line' },
  { key: 'wind_gusts_10m_max', name: 'Max Wind Gust', color: variableStyles.wind_gusts_10m?.color || '#718096', unit: 'mph', yAxisId: 'right', type: 'line' },
  { key: 'wind_gusts_10m_min', name: 'Min Wind Gust', color: variableStyles.wind_gusts_10m?.altColor || '#E2E8F0', unit: 'mph', yAxisId: 'right', type: 'line' },
  // { key: 'wind_gusts_10m_mean', name: 'Mean Wind Gust', color: variableStyles.wind_gusts_10m?.meanColor || '#A0AEC0', unit: 'mph', yAxisId: 'right', type: 'line' },
  // Cloud Cover / Humidity / Visibility
  { key: 'cloud_cover_max', name: 'Max Clouds', color: variableStyles.cloud_cover?.color || '#4A5568', unit: '%', yAxisId: 'left', type: 'line' },
  { key: 'cloud_cover_min', name: 'Min Clouds', color: variableStyles.cloud_cover?.altColor || '#E2E8F0', unit: '%', yAxisId: 'left', type: 'line' },
  // { key: 'cloud_cover_mean', name: 'Mean Clouds', color: variableStyles.cloud_cover?.meanColor || '#A0AEC0', unit: '%', yAxisId: 'left', type: 'line' },
  { key: 'relative_humidity_2m_max', name: 'Max Humidity', color: variableStyles.relative_humidity_2m?.color || '#48BB78', unit: '%', yAxisId: 'left', type: 'line' },
  { key: 'relative_humidity_2m_min', name: 'Min Humidity', color: variableStyles.relative_humidity_2m?.altColor || '#9AE6B4', unit: '%', yAxisId: 'left', type: 'line' },
  // { key: 'relative_humidity_2m_mean', name: 'Mean Humidity', color: variableStyles.relative_humidity_2m?.meanColor || '#68D391', unit: '%', yAxisId: 'left', type: 'line' },
  { key: 'visibility_max', name: 'Max Visibility', color: variableStyles.visibility?.color || '#718096', unit: 'm', yAxisId: 'left', type: 'line' },
  { key: 'visibility_min', name: 'Min Visibility', color: variableStyles.visibility?.altColor || '#E2E8F0', unit: 'm', yAxisId: 'left', type: 'line' },
  // { key: 'visibility_mean', name: 'Mean Visibility', color: variableStyles.visibility?.meanColor || '#A0AEC0', unit: 'm', yAxisId: 'left', type: 'line' },
  // Other Indices / Durations / Advanced
  { key: 'uv_index_max', name: 'UV Index Max', color: variableStyles.uv_index?.color || '#F6E05E', unit: '', yAxisId: 'left', type: 'line' },
  { key: 'uv_index_clear_sky_max', name: 'UV Clear Sky Max', color: variableStyles.uv_index?.altColor || '#FAF089', unit: '', yAxisId: 'left', type: 'line' },
  { key: 'cape_max', name: 'Max CAPE', color: variableStyles.cape?.color || '#F56565', unit: 'J/kg', yAxisId: 'left', type: 'line' },
  { key: 'cape_min', name: 'Min CAPE', color: variableStyles.cape?.altColor || '#FED7D7', unit: 'J/kg', yAxisId: 'left', type: 'line' },
  // { key: 'cape_mean', name: 'Mean CAPE', color: variableStyles.cape?.meanColor || '#FC8181', unit: 'J/kg', yAxisId: 'left', type: 'line' },
  { key: 'updraft_max', name: 'Max Updraft', color: variableStyles.updraft_max?.color || '#ED64A6', unit: 'm/s', yAxisId: 'right', type: 'line' },
];

// Filter config to only include lines that are not commented out for legend/area generation
const activeChartLinesConfig = chartLinesConfig.filter(line => line.key &&
    !line.key.includes('_mean') &&
    line.key !== 'apparent_temperature_max' &&
    line.key !== 'apparent_temperature_min' &&
    line.key !== 'showers_sum'
    // Add other keys here if you comment them out above without using //
);

// --- Component ---
const GraphCastForecast = ({ customLatitude = undefined, customLongitude = undefined }) => {
  const [forecast, setForecast] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userLocation, setUserLocation] = useState(null);
  const [locationName, setLocationName] = useState('');
  const [dailyUnits, setDailyUnits] = useState({});

  // State for visibility - Initialize based on ACTIVE config
  const [visibility, setVisibility] = useState(() => {
    const initialVisibility = {};
    const defaultVisible = [ // Adjust defaults as needed
      'temperature_2m_max',
      'temperature_2m_min',
      'precipitation_probability_max',
      'wind_speed_10m_max',
      'wind_speed_10m_min',
      // 'precipitation_sum', // Default hidden
      'relative_humidity_2m_max', // Example default
      'relative_humidity_2m_min', // Example default
      // Keep most hidden by default
    ];
    activeChartLinesConfig.forEach(line => {
      initialVisibility[line.key] = defaultVisible.includes(line.key);
    });
    // Ensure both associated min/max are visible if one is for shading
    if (initialVisibility['temperature_2m_max']) initialVisibility['temperature_2m_min'] = true;
    if (initialVisibility['temperature_2m_min']) initialVisibility['temperature_2m_max'] = true;
    if (initialVisibility['relative_humidity_2m_max']) initialVisibility['relative_humidity_2m_min'] = true;
    if (initialVisibility['relative_humidity_2m_min']) initialVisibility['relative_humidity_2m_max'] = true;
    // Add similar logic for other pairs if needed for default visibility

    return initialVisibility;
  });

  // Get context data
  const { savedLocations: contextSavedLocations, isLoading: contextLoading } = useUserProfile();

  // --- fetchLocationName (Unchanged) ---
  const fetchLocationName = useCallback(async (latitude, longitude) => {
     try {
        const response = await axios.get(`${REACT_APP_API_URL}/api/geocode`, { params: { lat: latitude, lon: longitude } });
        setLocationName(response.data?.formatted_address || `${latitude.toFixed(2)}°N, ${longitude.toFixed(2)}°W`);
     } catch (err) { console.error('Error fetch name', err); setLocationName(`${latitude.toFixed(2)}°N, ${longitude.toFixed(2)}°W`); }
  }, []);

  // --- fetchForecastData (Unchanged - uses detailed endpoint) ---
  const fetchForecastData = useCallback(async (latitude, longitude) => {
     setLoading(true); setError(null); fetchLocationName(latitude, longitude);
     try {
       const response = await axios.get(`${REACT_APP_API_URL}/api/forecast/detailed`, { params: { latitude, longitude }, timeout: 15000 });
       if (!response.data?.daily?.time) { throw new Error('Invalid data format'); }
       setDailyUnits(response.data.daily_units || {});
       const dailyData = response.data.daily.time.map((time, index) => {
         const dayData = { time: new Date(time).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }), isoTime: time };
         chartLinesConfig.forEach(config => { // Process ALL potential keys from original config
           if(config.key) dayData[config.key] = response.data.daily[config.key]?.[index] ?? null;
         });
         return dayData;
       });
       setForecast({ daily: dailyData }); setUserLocation({ latitude, longitude }); setLoading(false);
     } catch (err) { console.error('Error fetch forecast', err); setError(err.message || 'Failed fetch'); setLoading(false); }
   }, [fetchLocationName]);

  // --- useEffect (Unchanged) ---
  useEffect(() => {
     if (contextLoading) { setLoading(true); return; }
     setLoading(true); setError(null); setForecast(null); setLocationName('');
     if (customLatitude !== undefined && customLongitude !== undefined) { fetchForecastData(customLatitude, customLongitude); }
     else if (contextSavedLocations && contextSavedLocations.length > 0) { const f=contextSavedLocations[0]; fetchForecastData(f.latitude, f.longitude); }
     else { setError('Select/add location'); setLoading(false); setUserLocation(null); }
   }, [customLatitude, customLongitude, contextSavedLocations, contextLoading, fetchForecastData]);

  // --- Legend Toggle Handler (Reverted to simple independent toggle) ---
  const handleLegendClick = (dataKey) => {
    setVisibility(prevVisibility => ({
      ...prevVisibility,
      [dataKey]: !prevVisibility[dataKey]
    }));
  };

  // --- Custom Legend Renderer (Updated for 6 Columns, uses active config) ---
  const renderCustomLegend = (props) => {
      const itemsToRenderInLegend = activeChartLinesConfig; // Use filtered config
      const numColumns = 6;
      const itemsPerColumn = Math.ceil(itemsToRenderInLegend.length / numColumns);
      const columns = [];
      for (let i = 0; i < numColumns; i++) { columns.push(itemsToRenderInLegend.slice(i * itemsPerColumn, (i + 1) * itemsPerColumn)); }
      return (
        <div className="custom-legend-container multi-column">
          {columns.map((columnItems, colIndex) => (
            <div key={`col-${colIndex}`} className="legend-column">
              {columnItems.map((entry) => {
                if (!entry.key) return null; const dataKey = entry.key; const isActive = visibility[dataKey] ?? false;
                return ( <div key={`legend-${dataKey}`} className={`custom-legend-item ${isActive?'active':'inactive'}`} onClick={()=>handleLegendClick(dataKey)} style={{ cursor: 'pointer', marginBottom: '4px' }} > <span className="legend-icon" style={{ backgroundColor: entry.color }}></span> <span className="legend-text">{entry.name}</span> <span className="legend-toggle-icon">{isActive ? <BsToggleOn size={20} color="#34D399" /> : <BsToggleOff size={20} color="#9CA3AF" />}</span> </div> );
              })}
            </div>
          ))}
        </div>
      );
    };

  // --- Custom Tooltip (Unchanged) ---
  const CustomTooltip = ({ active, payload, label }) => {
      if (active && payload && payload.length) {
        return (
          <div className="custom-tooltip"> <p className="tooltip-label">{label}</p>
            {payload
              .filter(pld => chartLinesConfig.some(c => c.key === pld.dataKey)) // Lookup in full config
              .filter(pld => { const c = chartLinesConfig.find(c => c.key === pld.dataKey); return c && visibility[pld.dataKey]; }) // Check visibility state
              .map((pld) => {
                  const c = chartLinesConfig.find(c => c.key === pld.dataKey);
                  const v = pld.value !== null ? pld.value.toFixed(c?.unit==='inch'?2:(c?.unit==='°F'?1:0)) : 'N/A';
                  return ( <p key={pld.dataKey} className="tooltip-value" style={{ color: pld.color }}> {c?.name || pld.dataKey}: {v} {c?.unit || ''} </p> );
               })
             }
          </div> );
      } return null;
    };

  // --- Helper Function to Generate Area Pairs ---
  const renderAreaShadingPairs = () => {
      const areas = [];
      // Find unique base keys from active config (remove _max/_min)
      const baseKeys = [...new Set(activeChartLinesConfig.map(item => item.key.replace(/_max$|_min$/, '')))];

      baseKeys.forEach(baseKey => {
          const maxKey = `${baseKey}_max`;
          const minKey = `${baseKey}_min`;

          // Find corresponding configs in the *active* list
          const maxConfig = activeChartLinesConfig.find(item => item.key === maxKey);
          const minConfig = activeChartLinesConfig.find(item => item.key === minKey);

          // Check if BOTH min and max config exist for this base key AND are visible
          if (maxConfig && minConfig && visibility[maxKey] && visibility[minKey]) {
              // Use the color from the MAX config for the shading
              const shadeColor = maxConfig.color;
              // Ensure both lines are on the same axis for the shading to make sense visually
              if (maxConfig.yAxisId === minConfig.yAxisId) {
                  areas.push(
                      <React.Fragment key={`area-${baseKey}`}>
                          {/* Area 1: Max Background Shade */}
                          <Area
                              yAxisId={maxConfig.yAxisId}
                              type="monotone"
                              dataKey={maxKey}
                              fill={shadeColor} // Use the specific max line color
                              stroke="none"
                              fillOpacity={0.2} // Adjust transparency as desired
                              connectNulls={true}
                              isAnimationActive={false}
                          />
                          {/* Area 2: Min Cutout */}
                          <Area
                              yAxisId={minConfig.yAxisId}
                              type="monotone"
                              dataKey={minKey}
                              fill="#FFFFFF" // White background cutout (adjust if chart bg changes)
                              stroke="none"
                              fillOpacity={1} // Fully opaque
                              connectNulls={true}
                              isAnimationActive={false}
                          />
                      </React.Fragment>
                  );
              }
          }
      });
      return areas;
  };


  // --- Render Logic ---
  if (contextLoading && !userLocation && !(customLatitude !== undefined)) { return <div className="loading-state"><div>Loading user locations...</div></div>; }
  if (loading) { return <div className="loading-state"><div>Loading detailed forecast data...</div></div>; }
  if (error && !forecast) { return <div className="error-state"><div>Error: {error}</div></div>; }
  if (!forecast) { return <div className="error-state"><div>Forecast data unavailable. Please select or add a location.</div></div>; }

  return (
    <div className="graphcast-container">
      {error && forecast && <div className="info-message">{error}</div>}
      <div className="graphcast-header simple">
         <div className="graphcast-location"> <IoLocationOutline className="mr-1 text-red-600" /> <span> {locationName || (userLocation ? `${userLocation.latitude.toFixed(2)}°N, ${userLocation.longitude.toFixed(2)}°W` : 'No location selected')} </span> </div>
      </div>
      <div className="chart-container detailed-chart">
        <ResponsiveContainer width="100%" height={400}>
          {/* Back to LineChart */}
          <LineChart
            data={forecast.daily}
            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#d3d5d8" />
            <XAxis dataKey="time" stroke="#6b7280" tick={{ fill: '#6b7280', fontSize: 12 }}/>
            {/* Left Y-Axis - Label updated */}
            <YAxis yAxisId="left" stroke="#6b7280" tick={{ fill: '#6b7280', fontSize: 12 }} label={{ value: 'Temp (°F) / Precip (inch) / % / Other', angle: -90, position: 'insideLeft', fill: '#6b7280', style: { textAnchor: 'middle' } }} allowDecimals={true} />
            {/* Right Y-Axis (Wind/Updraft) */}
            <YAxis yAxisId="right" orientation="right" stroke="#6b7280" tick={{ fill: '#6b7280', fontSize: 12 }} label={{ value: 'Wind (mph) / Updraft (m/s)', angle: 90, position: 'insideRight', fill: '#6b7280', style: { textAnchor: 'middle' } }} allowDecimals={false} />
            {/* Dedicated Precip Axis REMOVED */}

            <Tooltip content={<CustomTooltip />} />
            <Legend content={renderCustomLegend} verticalAlign="bottom" wrapperStyle={{ paddingTop: '20px' }} />

            {/* Render Area Shading for all applicable pairs FIRST */}
            {renderAreaShadingPairs()}

            {/* Render Lines (On Top of Areas) */}
            {activeChartLinesConfig.map((item) => { // Iterate over ACTIVE config
              // Render Line if visible and type is 'line'
              if (visibility[item.key] && item.type === 'line') {
                return (
                  <Line key={item.key} yAxisId={item.yAxisId} type="monotone" dataKey={item.key} name={item.name} stroke={item.color} strokeWidth={2} dot={false} unit={item.unit} connectNulls={true} isAnimationActive={false}/>
                );
              }
              return null; // Don't render if not visible or not a line
            })}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

// PropTypes remain the same
GraphCastForecast.propTypes = {
    customLatitude: PropTypes.number,
    customLongitude: PropTypes.number,
};

export default GraphCastForecast;