import React, { useState, useEffect } from 'react';
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
  const [charts, setCharts] = useState([]); // array of S3 file URLs for the newly generated chart
  const [error, setError] = useState('');

  // This will store multiple "chart runs" from the DB – each run might have lat, lon, chart_folder, s3_files, etc.
  const [chartRuns, setChartRuns] = useState([]);

  const { user } = UserSession();  // e.g. user.id = user_2sirXuIdmQh7eiB3GwHxZlcQYbI

  // ------------------------------------------------
  // (A) Generate a new chart run
  // ------------------------------------------------
  const handleGenerateChart = async () => {
    try {
      setLoading(true);
      setError('');
      setCharts([]); // Clear the "live" chart for now

      const payload = {
        lat: Number(lat),
        lon: Number(lon),
        days: Number(forecastDays),
        user_id: user.id
      };

      // Call your /api/charts/generate route in the main Flask app
      const res = await fetch('http://localhost:5001/api/charts/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        throw new Error(`Generate chart failed: ${res.statusText}`);
      }
      const data = await res.json();
      // data.s3_files is the newly generated SVG array
      setCharts(data.s3_files);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // ------------------------------------------------
  // (B) Load all chart runs from the DB for this user
  // ------------------------------------------------
  const loadPastCharts = async () => {
    try {
      setError('');
      const res = await fetch(`http://localhost:5001/api/charts?user_id=${user.id}`);
      if (!res.ok) {
        throw new Error(`Fetch chart runs failed: ${res.statusText}`);
      }
      const runs = await res.json(); // array of chart runs
      setChartRuns(runs);
    } catch (err) {
      setError(err.message);
    }
  };

  // Optional: Auto-load on mount
  useEffect(() => {
    // If you want to load past charts automatically when the user navigates here, call loadPastCharts()
    loadPastCharts();
  }, []);

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
            {loading ? 'Generating...' : 'Generate Chart'}
          </button>
        </div>

        {/* Chart type tabs – only relevant if your chart server has multiple chart types */}
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

      {/* (A) Show newly generated chart (from "charts" state) if any */}
      {charts.length > 0 && (
        <div>
          <h2>Newly Generated Chart</h2>
          <div className="charts-grid">
            {charts.map((chartUrl, index) => (
              <div key={index} className="chart-thumbnail">
                <a href={chartUrl} target="_blank" rel="noopener noreferrer">
                  <img src={chartUrl} alt={`Chart ${index + 1}`} />
                </a>
                <div className="chart-title">
                  {chartType.toUpperCase()} Chart {index + 1}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* (B) Show "Load Past Charts" button manually, or rely on useEffect above */}
      <div style={{ marginTop: '20px' }}>
        <button onClick={loadPastCharts}>Load Past Charts</button>
      </div>

      {/* (C) Display the stored chart runs from the DB */}
      {chartRuns.length > 0 && (
        <div style={{ marginTop: '20px' }}>
          <h2>Past Chart Runs</h2>
          {/* Each run can have lat, lon, chart_folder, s3_files, etc. */}
          {chartRuns.map((run) => (
            <div key={run.chart_id} style={{ marginBottom: '2rem' }}>
              <h3>
                {run.chart_folder} - (Lat: {run.lat}, Lon: {run.lon}, Days: {run.forecast_days})
              </h3>
              <p>Created at: {run.created_at}</p>
              <div className="charts-grid">
                {run.s3_files.map((svgUrl, idx) => (
                  <div key={idx} className="chart-thumbnail">
                    <a href={svgUrl} target="_blank" rel="noopener noreferrer">
                      <img src={svgUrl} alt={`Chart ${idx}`} />
                    </a>
                    <div className="chart-title">Chart {idx + 1}</div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Charts;
