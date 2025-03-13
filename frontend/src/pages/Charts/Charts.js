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
  // newChartRun holds the newly generated chart run (with full s3_files array)
  const [newChartRun, setNewChartRun] = useState(null);
  const [error, setError] = useState('');
  // chartRuns holds past chart runs from the database
  const [chartRuns, setChartRuns] = useState([]);

  const { user } = UserSession(); // e.g., user.id = "user_2sirXuIdmQh7eiB3GwHxZlcQYbI"

  // ------------------------------------------------
  // (A) Generate a new chart run
  // ------------------------------------------------
  const handleGenerateChart = async () => {
    try {
      setLoading(true);
      setError('');
      setNewChartRun(null); // Clear any existing new chart

      const payload = {
        lat: Number(lat),
        lon: Number(lon),
        days: Number(forecastDays),
        user_id: user.id,
      };

      const res = await fetch('http://localhost:5001/api/charts/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        throw new Error(`Generate chart failed: ${res.statusText}`);
      }
      const data = await res.json();
      // data.s3_files is the full array of SVG URLs (one per hour)
      setNewChartRun(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // ------------------------------------------------
  // (B) Load all past chart runs from the DB for this user
  // ------------------------------------------------
  const loadPastCharts = async () => {
    try {
      setError('');
      const res = await fetch(`http://localhost:5001/api/charts?user_id=${user.id}`);
      if (!res.ok) {
        throw new Error(`Fetch chart runs failed: ${res.statusText}`);
      }
      const runs = await res.json();
      setChartRuns(runs);
    } catch (err) {
      setError(err.message);
    }
  };

  // ------------------------------------------------
  // (C) Open Chart Viewer in a new tab, passing the full SVG array via sessionStorage
  // ------------------------------------------------
  const handleViewChart = (chartRun) => {
    sessionStorage.setItem(`chart_${chartRun.chart_id}`, JSON.stringify(chartRun.s3_files));
    window.open(`/chart-viewer?chartId=${chartRun.chart_id}`, '_blank');
  };
  

  // Auto-load past charts on mount (if user data is ready)
  useEffect(() => {
    if (user && user.id) {
      loadPastCharts();
    }
  }, [user]);

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

      {/* (A) Display newly generated chart thumbnail (only the first SVG) */}
      {newChartRun && newChartRun.s3_files && newChartRun.s3_files.length > 0 && (
        <div>
          <h2>Newly Generated Chart</h2>
          <div className="charts-grid">
            <div className="chart-thumbnail">
              <button
                onClick={() => handleViewChart(newChartRun)}
                className="thumbnail-button"
              >
                <img
                  src={newChartRun.s3_files[0]}
                  alt="Chart Thumbnail"
                />
              </button>
              <div className="chart-title">
                {chartType.toUpperCase()} Chart (Preview)
              </div>
            </div>
          </div>
        </div>
      )}

      {/* (C) Display stored chart runs from the DB */}
      {chartRuns.length > 0 && (
        <div style={{ marginTop: '20px' }}>
          <h2>Past Chart Runs</h2>
          {chartRuns.map((run) => (
            <div key={run.chart_id} className="chart-run-card">
              <h3>
                {run.chart_folder} - (Lat: {run.lat}, Lon: {run.lon}, Days: {run.forecast_days})
              </h3>
              <p>Created at: {run.created_at}</p>
              <div className="charts-grid">
                {run.s3_files.length > 0 && (
                  <div className="chart-thumbnail">
                    <button
                      onClick={() => handleViewChart(run)}
                      className="thumbnail-button"
                    >
                      <img
                        src={run.s3_files[0]}
                        alt="First hour thumbnail"
                      />
                    </button>
                    <div className="chart-title">View Full Chart</div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Charts;
