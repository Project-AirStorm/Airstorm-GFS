// Logs.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Search, Filter, Download } from 'lucide-react';
import LogViewer from '../../../src/components/specific/LogViewer/LogViewer';
const REACT_APP_API_URL = process.env.REACT_APP_API_URL;

const Logs = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLevel, setSelectedLevel] = useState('all');
  const [selectedLogger, setSelectedLogger] = useState('all');

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const response = await axios.get(`${REACT_APP_API_URL}/api/logs`);
        setLogs(response.data);
        setLoading(false);
      } catch (err) {
        setError('Failed to fetch logs');
        setLoading(false);
      }
    };

    fetchLogs();
    const interval = setInterval(fetchLogs, 30000);
    return () => clearInterval(interval);
  }, []);

  const filteredLogs = logs.filter(log => {
    const matchesSearch = log.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesLevel = selectedLevel === 'all' || log.toLowerCase().includes(selectedLevel);
    const matchesLogger = selectedLogger === 'all' || log.includes(selectedLogger);
    
    return matchesSearch && matchesLevel && matchesLogger;
  });

  if (loading) return <div className="logs-loading">Loading logs...</div>;
  if (error) return <div className="logs-error">{error}</div>;

  // Get unique loggers for filter
  const loggers = [...new Set(logs.map(log => {
    const parts = log.split('|');
    return parts[1]?.trim() || '';
  }))].filter(Boolean);

  return (
    <div className="dashboard-container">
      <div className="main-content">
        <div className="logs-body">
          <div className="logs-header">
            <div>
              <h2 className="content-title">System Logs</h2>
              <p className="content-description">
                View and analyze system logs
              </p>
            </div>
            <button className="export-button">
              <Download className="button-icon" />
              Export Logs
            </button>
          </div>

          <div className="logs-controls">
            <div className="search-bar">
              <Search className="search-icon" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search logs..."
                className="search-input"
              />
            </div>

            <div className="filters-section">
              <Filter className="filter-icon" />
              <select
                value={selectedLevel}
                onChange={(e) => setSelectedLevel(e.target.value)}
                className="filter-select"
              >
                <option value="all">All Levels</option>
                <option value="error">Error</option>
                <option value="warning">Warning</option>
                <option value="info">Info</option>
              </select>

              <select
                value={selectedLogger}
                onChange={(e) => setSelectedLogger(e.target.value)}
                className="filter-select"
              >
                <option value="all">All Loggers</option>
                {loggers.map(logger => (
                  <option key={logger} value={logger}>{logger}</option>
                ))}
              </select>
            </div>
          </div>

          <LogViewer logs={filteredLogs} />
        </div>
      </div>
    </div>
  );
};

export default Logs;