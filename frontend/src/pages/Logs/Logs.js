// Logs.js
import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { Search, Filter, Download } from 'lucide-react';
import './Logs.css';

/**
 * Logs page component for displaying system logs and activity history
 * @component
 * @param {Object} props - Component properties
 * @param {Function} props.setCurrentPage - Function to update current page in parent component
 * @returns {JSX.Element} Logs component
 */
const Logs = ({ setCurrentPage }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLogType, setSelectedLogType] = useState('all');
  const [selectedTimeframe, setSelectedTimeframe] = useState('24h');

  // Sample log data - in a real app, this would come from an API
  const logs = [
    {
      id: 1,
      timestamp: '2025-01-27T10:30:00',
      type: 'system',
      severity: 'info',
      message: 'System startup completed successfully',
      source: 'System'
    },
    {
      id: 2,
      timestamp: '2025-01-27T10:35:00',
      type: 'weather',
      severity: 'warning',
      message: 'High wind alert triggered for Barksdale AFB',
      source: 'Weather Service'
    },
    {
      id: 3,
      timestamp: '2025-01-27T10:40:00',
      type: 'user',
      severity: 'error',
      message: 'Failed login attempt detected',
      source: 'Auth Service'
    }
  ];

  const logTypes = [
    { id: 'all', label: 'All Logs' },
    { id: 'system', label: 'System' },
    { id: 'weather', label: 'Weather' },
    { id: 'user', label: 'User Activity' }
  ];

  const timeframes = [
    { id: '1h', label: 'Last Hour' },
    { id: '24h', label: 'Last 24 Hours' },
    { id: '7d', label: 'Last 7 Days' },
    { id: '30d', label: 'Last 30 Days' }
  ];

  const handleSearch = (event) => {
    setSearchTerm(event.target.value);
  };

  const handleExport = () => {
    console.log('Exporting logs...');
  };

  // Filter logs based on search term and filters
  const filteredLogs = logs.filter(log => {
    const matchesSearch = log.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         log.source.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = selectedLogType === 'all' || log.type === selectedLogType;
    return matchesSearch && matchesType;
  });

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
                onChange={handleSearch}
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
                {logTypes.map(type => (
                  <option key={type.id} value={type.id}>{type.label}</option>
                ))}
              </select>

              <select
                value={selectedTimeframe}
                onChange={(e) => setSelectedTimeframe(e.target.value)}
                className="filter-select"
              >
                {timeframes.map(time => (
                  <option key={time.id} value={time.id}>{time.label}</option>
                ))}
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
                  <th>Source</th>
                </tr>
              </thead>
              <tbody>
                {filteredLogs.map(log => (
                  <tr key={log.id} className={`severity-${log.severity}`}>
                    <td>{new Date(log.timestamp).toLocaleString()}</td>
                    <td>
                      <span className={`log-type ${log.type}`}>
                        {log.type}
                      </span>
                    </td>
                    <td>
                      <span className={`severity-badge ${log.severity}`}>
                        {log.severity}
                      </span>
                    </td>
                    <td>{log.message}</td>
                    <td>{log.source}</td>
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

// Logs.propTypes = {
//   setCurrentPage: PropTypes.func.isRequired
// };

export default Logs;