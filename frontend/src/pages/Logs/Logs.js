// src/pages/Logs/Logs.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Search, Filter, Download, Clock, Trash2 } from 'lucide-react';
import './Logs.css';

/**
 * Parses a log line into structured data
 * @param {string} logLine - Raw log line to parse
 * @returns {Object} Parsed log data
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
  const [timeframe, setTimeframe] = useState('1h');
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Time frame options
  const timeframeOptions = [
    { value: '1h', label: 'Last Hour' },
    { value: '6h', label: 'Last 6 Hours' },
    { value: '12h', label: 'Last 12 Hours' },
    { value: '24h', label: 'Last 24 Hours' },
    { value: '7d', label: 'Last 7 Days' },
    { value: '30d', label: 'Last 30 Days' }
  ];

  // Fetch logs
  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const response = await axios.get(`${process.env.REACT_APP_API_URL}/api/logs`, {
          params: { timeframe }
        });
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
  }, [timeframe]);

  // Handle log deletion
  const handleDeleteLogs = async () => {
    try {
      setIsDeleting(true);
      setDeleteError(null);

      await axios.delete(`${process.env.REACT_APP_API_URL}/api/logs`);
      
      setLogs([]);
      setShowDeleteConfirm(false);
      
      // Show success message
      const successMessage = document.createElement('div');
      successMessage.className = 'delete-success-message';
      successMessage.textContent = 'Logs deleted successfully';
      document.body.appendChild(successMessage);
      setTimeout(() => successMessage.remove(), 3000);

    } catch (err) {
      console.error('Error deleting logs:', err);
      setDeleteError('Failed to delete logs. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  // Filter logs based on search and filters
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
          {/* Header */}
          <div className="logs-header">
            <div>
              <h2 className="content-title">System Logs</h2>
              <p className="content-description">
                View and analyze system logs
              </p>
            </div>
            <div className="logs-actions">
              <button 
                className="delete-button"
                onClick={() => setShowDeleteConfirm(true)}
                disabled={isDeleting || logs.length === 0}
              >
                <Trash2 className="button-icon" />
                Clear Logs
              </button>
              <button className="export-button">
                <Download className="button-icon" />
                Export Logs
              </button>
            </div>
          </div>

          {/* Controls */}
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
              <div className="timeframe-label">
                <Clock className="clock-icon" />
                <select
                  value={timeframe}
                  onChange={(e) => setTimeframe(e.target.value)}
                  className="timeframe-select"
                >
                  {timeframeOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

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

          {/* Log Viewer */}
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

          {/* Delete Confirmation Dialog */}
          {showDeleteConfirm && (
            <div className="delete-confirm-overlay">
              <div className="delete-confirm-dialog">
                <h3>Delete Logs?</h3>
                <p>Are you sure you want to delete all logs? This action cannot be undone.</p>
                {deleteError && <p className="delete-error">{deleteError}</p>}
                <div className="delete-confirm-actions">
                  <button
                    className="delete-confirm-cancel"
                    onClick={() => setShowDeleteConfirm(false)}
                    disabled={isDeleting}
                  >
                    Cancel
                  </button>
                  <button
                    className="delete-confirm-delete"
                    onClick={handleDeleteLogs}
                    disabled={isDeleting}
                  >
                    {isDeleting ? 'Deleting...' : 'Delete'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Logs;
