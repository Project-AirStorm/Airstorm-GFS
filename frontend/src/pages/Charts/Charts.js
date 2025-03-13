import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import './Charts.css';
import { UserSession } from '../../utils/UserSession';

const chartTypes = [
  { id: 'skewt', label: 'Skew-T' },
  { id: 'meteogram', label: 'Meteogram' },
  { id: 'other', label: 'Other Weather Chart' },
];

const Charts = () => {
  const [lat, setLat] = useState('');
  const [lon, setLon] = useState('');
  const [forecastDays, setForecastDays] = useState(1);
  const [chartType, setChartType] = useState('skewt');
  const [loading, setLoading] = useState(false);
  const [charts, setCharts] = useState([]); // array of SVG URL strings
  const [error, setError] = useState('');

  const handleGenerateChart = async () => {
    setCharts([]);
    setError('');
    setLoading(true);
    try {
      const userId = "user_2seeKmUaxI6vzlvi1jzLguWFQZ8";
      // Construct the API endpoint using forecastDays instead of a hardcoded value.
      const endpoint = `http://ec2-3-221-177-106.compute-1.amazonaws.com:5000/generate-skew?days=${forecastDays}&lat=${lat}&lon=${lon}&user_id=${userId}`;
      
      const response = await fetch(endpoint);
      if (!response.ok) {
        throw new Error('Failed to generate charts');
      }
      const data = await response.json();
      // Assume the API returns an array of SVG URLs in data.s3_files
      setCharts(data.s3_files);
    } catch (err) {
      setError(err.message);
    }
    setLoading(false);
  };

  return (
    <div className="charts-page">
      <h1>Generate Weather Charts</h1>
      <div className="chart-inputs">
        <div className="latlon-container">
          <div className="input-group">
            <label>Latitude:</label>
            <input
              type="number"
              value={lat}
              onChange={(e) => setLat(e.target.value)}
              placeholder="Enter latitude"
            />
          </div>
          <div className="input-group">
            <label>Longitude:</label>
            <input
              type="number"
              value={lon}
              onChange={(e) => setLon(e.target.value)}
              placeholder="Enter longitude"
            />
          </div>
          <div className="input-group">
            <label>Forecast Days:</label>
            <select
              value={forecastDays}
              onChange={(e) => setForecastDays(Number(e.target.value))}
            >
              <option value={1}>1 Day</option>
              <option value={3}>3 Days</option>
              <option value={7}>7 Days</option>
              <option value={16}>16 Days</option>
            </select>
          </div>
          <button
            onClick={handleGenerateChart}
            disabled={loading || !lat || !lon}
            className="generate-btn"
          >
            <Plus size={16} className="plus-icon" />
            Generate Chart
          </button>
        </div>
        <div className="chart-type-tabs">
          {chartTypes.map((ct) => (
            <button
              key={ct.id}
              className={chartType === ct.id ? 'active' : ''}
              onClick={() => setChartType(ct.id)}
            >
              {ct.label}
            </button>
          ))}
        </div>
      </div>
      {error && <div className="error">{error}</div>}
      <div className="charts-grid">
        {charts.map((chartUrl, index) => (
          <div key={index} className="chart-thumbnail">
            <img src={chartUrl} alt={`Chart ${index + 1}`} />
            <div className="chart-title">
              {chartType.toUpperCase()} Chart {index + 1}
            </div>
          </div>
        ))}
        {/* Add a placeholder pane */}
        <div className="chart-thumbnail placeholder">
          {/* Placeholder: intentionally empty */}
        </div>
      </div>
    </div>
  );
};

export default Charts;
