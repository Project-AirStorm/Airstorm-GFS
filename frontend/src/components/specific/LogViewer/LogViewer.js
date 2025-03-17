// LogViewer.js
import React from 'react';
import PropTypes from 'prop-types';
import { Badge } from "@/components/ui/badge";
import { LogEntryComponent, sanitizeLogMessage } from "../../../utils/LogEntry";

const LogViewer = ({ logs }) => (
  <div className="space-y-1">
    {logs.length === 0 ? (
      <div className="text-center p-8 text-gray-500">
        No logs to display
      </div>
    ) : (
      // Extra sanitization before displaying logs
      logs.map((log, index) => (
        <LogEntryComponent 
          key={`log-${index}`} 
          logLine={sanitizeLogMessage(log)} 
        />
      ))
    )}
  </div>
);

LogViewer.propTypes = {
  logs: PropTypes.arrayOf(PropTypes.string).isRequired
};

export default LogViewer;