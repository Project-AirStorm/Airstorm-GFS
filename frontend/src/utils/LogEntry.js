// LogEntry.js
import React from 'react';
import PropTypes from 'prop-types';
import { Badge } from "@/components/ui/badge";

/**
 * Function to sanitize sensitive information from log messages
 * @param {string} message - Message to sanitize
 * @returns {string} Sanitized message
 */
const sanitizeLogMessage = (message) => {
  if (!message) return message;
  
  // Array of regex patterns to catch API keys
  const patterns = [
    { pattern: /key=([^&\s]+)/g, replacement: "key=***REDACTED***" },
    { pattern: /apikey=([^&\s]+)/g, replacement: "apikey=***REDACTED***" },
    { pattern: /api_key=([^&\s]+)/g, replacement: "api_key=***REDACTED***" },
    { pattern: /token=([^&\s]+)/g, replacement: "token=***REDACTED***" },
    { pattern: /secret=([^&\s]+)/g, replacement: "secret=***REDACTED***" },
    { pattern: /password=([^&\s]+)/g, replacement: "password=***REDACTED***" },
    { pattern: /auth=([^&\s]+)/g, replacement: "auth=***REDACTED***" },
    { pattern: /https:\/\/www\.meteosource\.com\/api\/v1\/standard\/map\?key=[^&\s]+/g, 
      replacement: "https://www.meteosource.com/api/v1/standard/map?key=***REDACTED***" }
  ];
  
  let sanitized = String(message);
  patterns.forEach(({ pattern, replacement }) => {
    sanitized = sanitized.replace(pattern, replacement);
  });
  
  return sanitized;
};

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
  
  // Sanitize the message to catch any API keys - extra layer of protection
  message = sanitizeLogMessage(message);

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
  // Sanitize the entire log line first
  const sanitizedLogLine = sanitizeLogMessage(logLine);
  
  const [timestamp, level, source, message] = sanitizedLogLine.split('|').map(s => s.trim());
  
  return (
    <div className="log-entry">
      <span className="log-timestamp">{timestamp}</span>
      <Badge className={`log-level level-${level?.toLowerCase()}`}>
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

export { LogEntryComponent, sanitizeLogMessage };
export default LogEntry;