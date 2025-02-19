// LogViewer.js
import React from 'react';
import PropTypes from 'prop-types';
import LogEntry from "../../../../src/utils/LogEntry";

const LogViewer = ({ logs }) => (
  <div className="logs-viewer">
    {logs.length === 0 ? (
      <div className="logs-empty-state">No logs to display</div>
    ) : (
      logs.map((log, index) => (
        <LogEntry key={`log-${index}`} logLine={log} />
      ))
    )}
  </div>
);

LogViewer.propTypes = {
  logs: PropTypes.arrayOf(PropTypes.string).isRequired
};

export default LogViewer;
