// src/pages/Logs/Logs.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Search, Filter, Download } from 'lucide-react';
import './Logs.css';

/**
 * Parses a log line into structured data
 */
const parseLogLine = (logLine) => {
  const parts = logLine.split('|').map(s => s.trim());
  let [timestamp, logger, level, message] = parts;
  
  // Extract error number if present
  let errorNumber = null;
  if (message) {
    const errorMatch = message.match(/\[Errno \d+\]/);
    if (errorMatch) {
      errorNumber = errorMatch[0];
      message = message.replace(errorNumber, '').trim();
    }
  }

  // Clean up any ANSI color codes
  message = message?.replace(/\u001B\[\d+m/g, '');

  return {
    timestamp,
    logger,
    level: level?.replace('|', '').trim(),
    errorNumber,
    message
  };
};

/**
 * Individual log entry component
 */
const LogEntry = ({ logLine }) => {
  const {
    timestamp,
    logger,
    level,
    errorNumber,
    message
  } = parseLogLine(logLine);

  const severityClass = level?.toLowerCase().includes('error') ? 'error' :
                       level?.toLowerCase().includes('warning') ? 'warning' : 'info';

  return (
    <div className={`log-entry severity-${severityClass}`}>
      <div className="log-entry-header">
        <span className="log-timestamp">{timestamp}</span>
        <span className="log-logger">{logger}</span>
        {level && <span className={`log-level level-${severityClass}`}>{level}</span>}
      </div>
      <div className="log-content">
        {errorNumber && (
          <span className="log-error-number">{errorNumber}</span>
        )}
        <span className="log-message">{message}</span>
      </div>
    </div>
  );
};

/**
 * Main Logs component
 */
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
        const response = await axios.get(`${process.env.REACT_APP_API_URL}/api/logs`);
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

  // Get unique loggers for filter
  const loggers = [...new Set(logs.map(log => {
    const parts = log.split('|');
    return parts[1]?.trim() || '';
  }))].filter(Boolean);

  if (loading) {
    return (
      <div className="logs-body">
        <div className="logs-loading">
          <div className="loading-spinner"></div>
          <p>Loading logs...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="logs-body">
        <div className="logs-error">
          <p>{error}</p>
          <button className="retry-button" onClick={() => window.location.reload()}>
            Retry
          </button>
        </div>
      </div>
    );
  }

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

          <div className="logs-viewer">
            {filteredLogs.length === 0 ? (
              <div className="logs-empty-state">
                No logs found matching your criteria
              </div>
            ) : (
              filteredLogs.map((log, index) => (
                <LogEntry key={index} logLine={log} />
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Logs;