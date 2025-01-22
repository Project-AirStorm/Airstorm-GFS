// MeteogramPbp.js
import React, { useState, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import OverviewSwitch from '../OverviewSwitch/OverviewSwitch';
import ActionButtons from '../ActionButtons/ActionButtons';
import './MeteogramPbp.css';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

const VARIABLE_LABELS = {
  temperature: 'Temperature (°C)',
  relative_humidity: 'Relative Humidity (%)',
  cloud_cover: 'Cloud Cover (%)',
  wind_speed: 'Wind Speed (km/h)',
  wind_direction: 'Wind Direction (°)',
};

const CHART_COLORS = {
  var1: '#ff7300',
  var2: '#82ca9d',
  var3: '#8884d8',
};

const PRESSURE_LEVELS = [
  1000, 975, 950, 925, 900, 850, 800, 700, 600, 500, 400, 300, 250, 200, 150,
  100, 70, 50, 30,
];

const MeteogramPbp = ({ setCurrentPage }) => {
  const [activeView, setActiveView] = useState('overview');
  const [selectedVars, setSelectedVars] = useState({
    var1: 'temperature',
    var2: 'relative_humidity',
    var3: 'wind_speed',
  });
  const [weatherData, setWeatherData] = useState(null);
  const [selectedDay, setSelectedDay] = useState(0);
  const [savedLocations, setSavedLocations] = useState([]);
  const [currentGeoLocation, setCurrentGeoLocation] = useState(null);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [locationKey, setLocationKey] = useState(Date.now());
  const chartRef = useRef(null);
  const apiBaseUrl =
    process.env.REACT_APP_API_BASE_URL || 'http://localhost:5001';
  const userId = process.env.REACT_APP_USER_ID;

  useEffect(() => {
    const getBrowserLocation = () => {
      if ('geolocation' in navigator) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const newLocation = {
              name: 'Current Location',
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
              isCurrent: true,
            };
            setCurrentGeoLocation(newLocation);
            setSelectedLocation(newLocation);
            setLocationKey(Date.now());
          },
          (error) => {
            console.warn('Geolocation error:', error);
            setError('Could not retrieve your current location');
          },
          { timeout: 10000, maximumAge: 600000 }
        );
      }
    };

    const fetchSavedLocations = async () => {
      try {
        const response = await fetch(
          `${apiBaseUrl}/api/locations?userId=${userId}`
        );

        const contentType = response.headers.get('content-type');
        if (!contentType?.includes('application/json')) {
          const text = await response.text();
          throw new Error(`Invalid response: ${text.substring(0, 100)}`);
        }

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to fetch locations');
        }

        const locations = await response.json();
        setSavedLocations(locations);

        if (!currentGeoLocation && locations.length > 0) {
          setSelectedLocation(locations[0]);
          setLocationKey(Date.now());
        }
      } catch (err) {
        setError(err.message);
        console.error('Location fetch error:', err);
      }
    };

    getBrowserLocation();
    fetchSavedLocations();
  }, [apiBaseUrl, userId]);

  const allLocations = [
    ...(currentGeoLocation ? [currentGeoLocation] : []),
    ...savedLocations,
  ];

  useEffect(() => {
    if (selectedLocation) {
      fetchWeatherData();
    }
  }, [selectedLocation, selectedDay, selectedVars]);

  const processWeatherData = (data) => {
    const hourlyData = data.hourly;
    const hourIndex = selectedDay * 24;

    return PRESSURE_LEVELS.map((level) => ({
      pressure: level,
      value1: hourlyData[`${selectedVars.var1}_${level}hPa`]?.[hourIndex],
      value2: hourlyData[`${selectedVars.var2}_${level}hPa`]?.[hourIndex],
      value3: hourlyData[`${selectedVars.var3}_${level}hPa`]?.[hourIndex],
      height: hourlyData[`geopotential_height_${level}hPa`]?.[hourIndex],
      time: new Date(hourlyData.time[hourIndex]),
    })).filter(
      (item) =>
        item.value1 !== undefined &&
        item.value2 !== undefined &&
        item.value3 !== undefined
    );
  };

  const fetchWeatherData = async () => {
    if (!selectedLocation) return;

    setIsLoading(true);
    setError(null);

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000);

      const params = [];
      Object.values(selectedVars).forEach((variable) => {
        PRESSURE_LEVELS.forEach((level) => {
          params.push(`${variable}_${level}hPa`);
        });
      });
      PRESSURE_LEVELS.forEach((level) => {
        params.push(`geopotential_height_${level}hPa`);
      });

      const response = await fetch(
        `https://api.open-meteo.com/v1/gfs?` +
          `latitude=${selectedLocation.latitude}&` +
          `longitude=${selectedLocation.longitude}&` +
          `hourly=${params.join(',')}&` +
          `forecast_days=16`,
        { signal: controller.signal }
      );

      clearTimeout(timeoutId);

      const contentType = response.headers.get('content-type');
      if (!contentType?.includes('application/json')) {
        const text = await response.text();
        throw new Error(`Invalid API response: ${text.substring(0, 100)}`);
      }

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.reason || 'Weather API error');
      }

      const data = await response.json();
      setWeatherData(processWeatherData(data));
    } catch (err) {
      setError(err.name === 'AbortError' ? 'Request timed out' : err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDayChange = (e) => {
    setSelectedDay(parseInt(e.target.value) - 1);
  };

  const handleLocationChange = (e) => {
    try {
      const location = JSON.parse(e.target.value);
      setSelectedLocation(location);
      setLocationKey(Date.now());

      if (location.isCurrent) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const updatedLocation = {
              ...location,
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
            };
            setCurrentGeoLocation(updatedLocation);
            setSelectedLocation(updatedLocation);
            setLocationKey(Date.now());
          },
          (error) => console.warn('Location refresh failed:', error)
        );
      }
    } catch (err) {
      setError('Invalid location data format');
    }
  };

  const chartData = {
    datasets: [
      {
        label: VARIABLE_LABELS[selectedVars.var1],
        data: weatherData?.map((d) => ({ x: d.value1, y: d.pressure })),
        borderColor: CHART_COLORS.var1,
        backgroundColor: CHART_COLORS.var1,
        tension: 0.4,
        pointRadius: 4,
      },
      {
        label: VARIABLE_LABELS[selectedVars.var2],
        data: weatherData?.map((d) => ({ x: d.value2, y: d.pressure })),
        borderColor: CHART_COLORS.var2,
        backgroundColor: CHART_COLORS.var2,
        tension: 0.4,
        pointRadius: 4,
      },
      {
        label: VARIABLE_LABELS[selectedVars.var3],
        data: weatherData?.map((d) => ({ x: d.value3, y: d.pressure })),
        borderColor: CHART_COLORS.var3,
        backgroundColor: CHART_COLORS.var3,
        tension: 0.4,
        pointRadius: 4,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: 'index', intersect: false },
    scales: {
      x: {
        type: 'linear',
        title: {
          display: true,
          text: 'Values',
          font: { weight: 'bold' },
        },
      },
      y: {
        type: 'linear',
        reverse: true,
        title: {
          display: true,
          text: 'Pressure (hPa)',
          font: { weight: 'bold' },
        },
        min: 0,
        max: 1050,
        ticks: { stepSize: 100 },
      },
    },
    plugins: {
      title: {
        display: true,
        text: 'Weather Profile',
        font: { size: 18 },
      },
      tooltip: {
        callbacks: {
          label: (context) => {
            const dataPoint = weatherData[context.dataIndex];
            return [
              `${context.dataset.label}: ${context.parsed.x?.toFixed(2)}`,
              `Height: ${dataPoint.height?.toFixed(0)}m`,
              `Time: ${dataPoint.time?.toLocaleString()}`,
            ];
          },
        },
      },
      legend: {
        position: 'top',
        labels: { font: { size: 14 } },
      },
    },
  };

  return (
    <div className="dashboard-container">
      <div className="main-content">
        <div className="controls-container">
          <OverviewSwitch
            activeView={activeView}
            onViewChange={setActiveView}
          />
          <ActionButtons
            onTimeframeChange={() => console.log('Timeframe changed')}
            onAddBase={() => console.log('Add base clicked')}
            timeframe="Week"
          />
        </div>

        <div className="meteogram-pbp-body">
          <div className="meteogram-content">
            <h2 className="content-title">
              Meteogram Point Based Product Analysis
            </h2>
            <p className="content-description">
              Detailed analysis of meteorological parameters at specific points
              over time.
            </p>

            <div className="meteogram-controls">
              <div className="control-group">
                <label>Location</label>
                <select
                  key={locationKey}
                  value={
                    selectedLocation ? JSON.stringify(selectedLocation) : ''
                  }
                  onChange={handleLocationChange}
                  disabled={!allLocations.length}
                >
                  {allLocations.map((location) => (
                    <option
                      key={`${location.latitude}-${location.longitude}-${
                        location.isCurrent ? 'current' : 'saved'
                      }`}
                      value={JSON.stringify(location)}
                    >
                      {location.isCurrent
                        ? `Current Location (${location.latitude.toFixed(
                            2
                          )}, ${location.longitude.toFixed(2)})`
                        : location.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="control-group">
                <label>Forecast Day</label>
                <select
                  value={selectedDay + 1}
                  onChange={handleDayChange}
                  disabled={!selectedLocation}
                >
                  {Array.from({ length: 16 }, (_, i) => (
                    <option key={i + 1} value={i + 1}>
                      Day {i + 1}
                    </option>
                  ))}
                </select>
              </div>

              {['var1', 'var2', 'var3'].map((varKey, idx) => (
                <div className="control-group" key={varKey}>
                  <label>Variable {idx + 1}</label>
                  <select
                    value={selectedVars[varKey]}
                    onChange={(e) =>
                      setSelectedVars((prev) => ({
                        ...prev,
                        [varKey]: e.target.value,
                      }))
                    }
                  >
                    {Object.entries(VARIABLE_LABELS).map(([key, label]) => (
                      <option key={key} value={key}>
                        {label}
                      </option>
                    ))}
                  </select>
                </div>
              ))}
            </div>

            {isLoading && (
              <div className="loading-overlay">
                <div className="loading-spinner"></div>
                <div className="loading-text">Loading weather data...</div>
              </div>
            )}

            {error && <div className="error-message">⚠️ Error: {error}</div>}

            <div className="chart-container">
              {weatherData ? (
                <Line ref={chartRef} data={chartData} options={chartOptions} />
              ) : (
                <div className="no-data">
                  {selectedLocation
                    ? 'Select variables to view data'
                    : 'Select a location to begin'}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

MeteogramPbp.propTypes = {
  setCurrentPage: PropTypes.func.isRequired,
};

export default MeteogramPbp;
