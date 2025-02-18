import React from 'react';

/**
 * LogViewer component for displaying formatted application logs
 * @component
 */
const LogViewer = ({ logs }) => {
  // Group logs by source (frontend/backend)
  const groupedLogs = logs.reduce((acc, log) => {
    const source = log.source || 'unknown';
    if (!acc[source]) {
      acc[source] = [];
    }
    acc[source].push(log);
    return acc;
  }, {});

  const getLogTypeColor = (log) => {
    if (log.message.includes('ERROR')) return 'text-red-600';
    if (log.message.includes('WARNING')) return 'text-yellow-600';
    if (log.message.includes('INFO')) return 'text-blue-600';
    return 'text-gray-600';
  };

  const getLogTypeIcon = (log) => {
    if (log.message.includes('ERROR')) return '❌';
    if (log.message.includes('WARNING')) return '⚠️';
    if (log.message.includes('INFO')) return 'ℹ️';
    return '•';
  };

  return (
    <div className="logs-viewer">
      {Object.entries(groupedLogs).map(([source, sourceLogs]) => (
        <div key={source} className="log-group">
          <div className="log-group-header">
            <h3 className="log-source-title">{source}</h3>
          </div>
          <div className="log-entries">
            {sourceLogs.map((log, index) => (
              <div key={index} className={`log-entry ${getLogTypeColor(log)}`}>
                <span className="log-icon">{getLogTypeIcon(log)}</span>
                <span className="log-timestamp">{log.timestamp}</span>
                <span className="log-message">{log.message}</span>
                {log.method && log.path && (
                  <span className="log-request">
                    {log.method} {log.path} → {log.status}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

export default LogViewer;