import React, { useState, useEffect } from 'react';
import { Plus, Trash } from 'lucide-react';
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
  const [error, setError] = useState('');
  // chartRuns holds past chart runs from the database
  const [chartRuns, setChartRuns] = useState([]);

  const { user } = UserSession(); // e.g., user.id = "user_2sirXuIdmQh7eiB3GwHxZlcQYbI"

  // (A) Generate a new chart run
  const handleGenerateChart = async () => {
    try {
      setLoading(true);
      setError('');
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
      const newlyInsertedChartRun = await res.json();

      // Prepend that new run so it shows up immediately
      setChartRuns(prevRuns => [newlyInsertedChartRun, ...prevRuns]);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // (B) Load all past chart runs from the DB for this user
  const loadPastCharts = async () => {
    try {
      setError('');
      const res = await fetch(`http://localhost:5001/api/get-charts?user_id=${user.id}`);
      if (!res.ok) {
        throw new Error(`Fetch chart runs failed: ${res.statusText}`);
      }
      const runs = await res.json();
      setChartRuns(runs);
    } catch (err) {
      setError(err.message);
    }
  };

  // (C) Open Chart Viewer in a new tab, passing chartId, lat and lon as query parameters
  const handleViewChart = (chartRun) => {
    // Save the s3_files in sessionStorage as before.
    sessionStorage.setItem(`chart_${chartRun.chart_id}`, JSON.stringify(chartRun.s3_files));
    // Pass chartId, lat and lon via the URL
    window.open(
      `/chart-viewer?chartId=${chartRun.chart_id}&lat=${chartRun.lat}&lon=${chartRun.lon}&start=${encodeURIComponent(new Date(chartRun.created_at).toISOString())}`,
      '_blank'
    );
  };

  // (D) Delete a chart run both from the database and from local state
  const handleDeleteChart = async (chartId) => {
    try {
      const res = await fetch(`http://localhost:5001/api/charts/delete?chart_id=${chartId}`, {
        method: 'DELETE'
      });
      if (!res.ok) {
        throw new Error(`Delete chart failed: ${res.statusText}`);
      }
      // Remove the deleted chart from local state
      setChartRuns(prevRuns => prevRuns.filter(run => run.chart_id !== chartId));
    } catch (err) {
      setError(err.message);
    }
  };

  // Auto-load past charts on mount (if user data is ready)
  useEffect(() => {
    if (user && user.id) {
      loadPastCharts();
    }
  }, [user]);

  return (
    <div className="charts-page">
      <div className="chart-inputs">
        <div className="latlon-container">
          <div className="input-group">
            <input
              type="number"
              value={lat}
              onChange={(e) => setLat(e.target.value)}
              placeholder="Enter latitude"
            />
          </div>
          <div className="input-group">
            <input
              type="number"
              value={lon}
              onChange={(e) => setLon(e.target.value)}
              placeholder="Enter longitude"
            />
          </div>
          <div className="input-group">
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
            {loading ? (
              <>
                Generating...
                <span className="spinner"></span>
              </>
            ) : (
              'Generate Chart'
            )}
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
      {/* Display all chart runs (new and past) in the gallery layout */}
      {chartRuns.length > 0 && (
        <div className="chart-run-cards-container" style={{ marginTop: '20px' }}>
          {chartRuns.map((run) => (
            <div key={run.chart_id} className="chart-run-card">
              <div className="chart-card-header">
                <div className="chart-folder">
                  <strong>{run.chart_folder}</strong>
                </div>
                <div className="chart-trash">
                  <button
                    className="trash-button"
                    onClick={() => handleDeleteChart(run.chart_id)}
                    title="Delete Chart"
                  >
                    <Trash size={16} />
                  </button>
                </div>
              </div>
              <div className="charts-grid">
                {run.s3_files?.length > 0 && (
                  <div className="chart-thumbnail">
                    <button onClick={() => handleViewChart(run)} className="thumbnail-button">
                      <img src={run.s3_files[0]} alt="First hour thumbnail" />
                    </button>
                    <div className="chart-details">
                      <p>(Lat: {run.lat}, Lon: {run.lon}, Days: {run.forecast_days})</p>
                      <div className="chart-date">
                        <i>{new Date(run.created_at).toUTCString()}</i>
                      </div>
                    </div>
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
