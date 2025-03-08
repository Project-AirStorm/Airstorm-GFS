// LogEntry.js
import React from 'react';
import PropTypes from 'prop-types';
import { Badge } from "@/components/ui/badge";

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
 * Component to display a single log entry
 */
const LogEntry = ({ logLine }) => {
  const {
    timestamp,
    logger,
    level,
    errorNumber,
    message
  } = parseLogLine(logLine);

  // Determine severity class
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

LogEntry.propTypes = {
  logLine: PropTypes.string.isRequired
};

const LogEntryComponent = ({ logLine }) => {
  const [timestamp, level, source, message] = logLine.split('|').map(s => s.trim());
  
  return (
    <div className="log-entry">
      <span className="log-timestamp">{timestamp}</span>
      <Badge className={`log-level level-${level.toLowerCase()}`}>
        {level}
      </Badge>
      <span className="log-message">{message}</span>
      <span className="log-source">{source}</span>
    </div>
  );
};

LogEntryComponent.propTypes = {
  logLine: PropTypes.string.isRequired
};

export { LogEntryComponent };
export default LogEntry;