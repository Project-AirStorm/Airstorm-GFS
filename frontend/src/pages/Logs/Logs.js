import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Search, Filter, Download } from 'lucide-react';
import './Logs.css';

const REACT_APP_API_URL = process.env.REACT_APP_API_URL;

const Logs = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLogType, setSelectedLogType] = useState('all');
  const [selectedTimeframe, setSelectedTimeframe] = useState('24h');

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const response = await axios.get(`${REACT_APP_API_URL}/api/logs`);
        
        // Parse the logs into structured format
        const parsedLogs = response.data.map(log => {
          const parts = log.split('|').map(part => part.trim());
          return {
            timestamp: parts[0],
            type: getLogType(parts[1] || ''),
            severity: getSeverity(parts[1] || ''),
            message: parts[2] || parts[1] || log, // fallback if parsing fails
          };
        });

        setLogs(parsedLogs);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching logs:', err);
        setError('Failed to fetch logs');
        setLoading(false);
      }
    };

    fetchLogs();
    const interval = setInterval(fetchLogs, 30000);
    return () => clearInterval(interval);
  }, []);

  const getLogType = (message) => {
    if (message.includes('weather')) return 'weather';
    if (message.includes('user')) return 'user';
    return 'system';
  };

  const getSeverity = (message) => {
    if (message.includes('ERROR')) return 'error';
    if (message.includes('WARNING')) return 'warning';
    return 'info';
  };

  const handleExport = () => {
    // Implementation for exporting logs
    console.log('Exporting logs...');
  };

  const filteredLogs = logs.filter(log => {
    const matchesSearch = 
      log.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.timestamp.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = selectedLogType === 'all' || log.type === selectedLogType;
    return matchesSearch && matchesType;
  });

  if (loading) {
    return <div className="logs-body">Loading logs...</div>;
  }

  if (error) {
    return <div className="logs-body error">{error}</div>;
  }

  return (
    <div className="dashboard-container">
      <div className="main-content">
        <div className="logs-body">
          <div className="logs-header">
            <div className="logs-title-section">
              <h2 className="content-title">System Logs</h2>
              <p className="content-description">
                View and analyze system activity and weather alerts.
              </p>
            </div>

            <div className="logs-actions">
              <button className="export-button" onClick={handleExport}>
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
                placeholder="Search logs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="search-input"
              />
            </div>

            <div className="filters-section">
              <Filter className="filter-icon" />
              <select
                value={selectedLogType}
                onChange={(e) => setSelectedLogType(e.target.value)}
                className="filter-select"
              >
                <option value="all">All Types</option>
                <option value="system">System</option>
                <option value="weather">Weather</option>
                <option value="user">User Activity</option>
              </select>

              <select
                value={selectedTimeframe}
                onChange={(e) => setSelectedTimeframe(e.target.value)}
                className="filter-select"
              >
                <option value="1h">Last Hour</option>
                <option value="24h">Last 24 Hours</option>
                <option value="7d">Last 7 Days</option>
                <option value="30d">Last 30 Days</option>
              </select>
            </div>
          </div>

          <div className="logs-table">
            <table>
              <thead>
                <tr>
                  <th>Timestamp</th>
                  <th>Type</th>
                  <th>Severity</th>
                  <th>Message</th>
                </tr>
              </thead>
              <tbody>
                {filteredLogs.map((log, index) => (
                  <tr key={index} className={`severity-${log.severity}`}>
                    <td>{log.timestamp}</td>
                    <td>
                      <span className={`log-type ${log.type}`}>{log.type}</span>
                    </td>
                    <td>
                      <span className={`severity-badge ${log.severity}`}>
                        {log.severity}
                      </span>
                    </td>
                    <td>{log.message}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Logs;