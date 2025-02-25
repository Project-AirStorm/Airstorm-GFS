// src/pages/Logs/Logs.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Search, Filter, Download, Clock, Trash2 } from 'lucide-react';
import './Logs.css';

/**
 * Parses a log line into structured data
 */
const parseLogLine = (logLine) => {
  const parts = logLine.split('|').map(s => s.trim());
  let [timestamp, logger, level, message] = parts;
  
  let errorNumber = null;
  if (message) {
    // Remove date and time pattern like "172.18.0.1 - - [20/Feb/2025 01:09:34] "POST /api/save-user HTTP/1.1" 200 -"
    message = message.replace(/\d+\.\d+\.\d+\.\d+\s+-\s+-\s+\[\d+\/\w+\/\d+\s+\d+:\d+:\d+\]\s+"[^"]+"\s+\d+\s+-/, '').trim();
    
    // Extract error number if present
    const errorMatch = message.match(/\[Errno \d+\]/);
    if (errorMatch) {
      errorNumber = errorMatch[0];
      message = message.replace(errorNumber, '').trim();
    }
  }

  // Remove ANSI color codes
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

  const timeframeOptions = [
    { value: '1h', label: 'Last Hour' },
    { value: '6h', label: 'Last 6 Hours' },
    { value: '12h', label: 'Last 12 Hours' },
    { value: '24h', label: 'Last 24 Hours' },
    { value: '7d', label: 'Last 7 Days' },
    { value: '30d', label: 'Last 30 Days' }
  ];

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

  const handleDeleteLogs = async () => {
    try {
      setIsDeleting(true);
      setDeleteError(null);

      await axios.delete(`${process.env.REACT_APP_API_URL}/api/logs`);
      setLogs([]);
      setShowDeleteConfirm(false);
      
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

  /**
   * Handle exporting logs as TSV file
   */
  const handleExportLogs = () => {
    try {
      // Format the logs for export, using the filtered logs
      const exportData = filteredLogs.map(log => ({
        Timestamp: log.timestamp,
        Severity: log.severity,
        Message: log.message,
        Source: log.source
      }));
      
      // If no logs to export, show a message
      if (exportData.length === 0) {
        const noLogsMessage = document.createElement('div');
        noLogsMessage.className = 'delete-success-message';
        noLogsMessage.style.backgroundColor = 'rgb(239 68 68)';
        noLogsMessage.textContent = 'No logs to export';
        document.body.appendChild(noLogsMessage);
        setTimeout(() => noLogsMessage.remove(), 3000);
        return;
      }
      
      // Convert to TSV (tab-separated values)
      const csvHeader = ['Timestamp', 'Severity', 'Message', 'Source'].join('\t');
      const csvRows = exportData.map(row => 
        [
          row.Timestamp, 
          row.Severity, 
          // Escape any tabs in the message
          row.Message.replace(/\t/g, ' '), 
          row.Source
        ].join('\t')
      );
      const csvContent = [csvHeader, ...csvRows].join('\n');
      
      // Create a blob and download link
      const blob = new Blob([csvContent], { type: 'text/tab-separated-values' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.setAttribute('href', url);
      a.setAttribute('download', `system-logs-${new Date().toISOString().slice(0, 10)}.tsv`);
      a.click();
      
      // Clean up
      URL.revokeObjectURL(url);
      
      // Show success message
      const successMessage = document.createElement('div');
      successMessage.className = 'delete-success-message';
      successMessage.textContent = 'Logs exported successfully';
      document.body.appendChild(successMessage);
      setTimeout(() => successMessage.remove(), 3000);
    } catch (err) {
      console.error('Error exporting logs:', err);
      const errorMessage = document.createElement('div');
      errorMessage.className = 'delete-success-message';
      errorMessage.style.backgroundColor = 'rgb(239 68 68)';
      errorMessage.textContent = 'Failed to export logs';
      document.body.appendChild(errorMessage);
      setTimeout(() => errorMessage.remove(), 3000);
    }
  };

  // Parse log strings into structured objects for table display and filter out logs without messages
  const parsedLogs = logs
    .map((log, index) => {
      const parsedLog = parseLogLine(log);
      return {
        id: index,
        timestamp: parsedLog.timestamp,
        severity: parsedLog.level?.toLowerCase().includes('error') ? 'error' :
                parsedLog.level?.toLowerCase().includes('warning') ? 'warning' : 'info',
        message: parsedLog.errorNumber ? `${parsedLog.errorNumber} ${parsedLog.message}` : parsedLog.message,
        source: parsedLog.logger
      };
    })
    .filter(log => log.message && log.message.trim() !== ''); // Filter out logs without messages

  const filteredLogs = parsedLogs.filter(log => {
    const matchesSearch = 
      (log.message?.toLowerCase().includes(searchTerm.toLowerCase()) || 
       log.source?.toLowerCase().includes(searchTerm.toLowerCase()) || 
       log.timestamp?.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesLevel = selectedLevel === 'all' || log.severity === selectedLevel;
    const matchesLogger = selectedLogger === 'all' || log.source === selectedLogger;
    return matchesSearch && matchesLevel && matchesLogger;
  });

  const loggers = [...new Set(parsedLogs.map(log => log.source))].filter(Boolean);

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
              <p className="content-description">View and analyze system logs</p>
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
              <button 
                className="export-button"
                onClick={handleExportLogs}
                disabled={filteredLogs.length === 0}
              >
                <Download className="button-icon" />
                Export Logs
              </button>
            </div>
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

          {/* Table display format with Type column removed */}
          <div className="logs-table">
            {filteredLogs.length === 0 ? (
              <div className="logs-empty-state">
                No logs found matching your criteria
              </div>
            ) : (
              <table>
                <thead>
                  <tr>
                    <th>Timestamp</th>
                    <th>Severity</th>
                    <th>Message</th>
                    <th>Source</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredLogs.map((log) => (
                    <tr key={log.id} className={`severity-${log.severity}`}>
                      <td>{log.timestamp}</td>
                      <td>
                        <span className={`severity-badge ${log.severity}`}>
                          {log.severity}
                        </span>
                      </td>
                      <td>{log.message}</td>
                      <td>
                        <span className={`log-type ${log.source.toLowerCase().replace(/\./g, '-')}`}>
                          {log.source}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

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