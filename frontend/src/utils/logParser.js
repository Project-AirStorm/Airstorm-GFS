/**
 * Parses raw log lines into structured log objects
 * @param {string} logText - Raw log text
 * @returns {Array} Parsed log objects
 */
export const parseLogData = (logText) => {
    return logText.split('\n')
      .filter(line => line.trim())
      .map(line => {
        // Parse the log line
        const logParts = line.split('|');
        const source = logParts[0]?.trim();
        let message = logParts[1]?.trim() || line.trim();
  
        // Extract timestamp, method, path, and status for API calls
        let timestamp = '', method = '', path = '', status = '';
        
        if (message.includes('INFO:werkzeug:')) {
          const matches = message.match(/INFO:werkzeug:(\d{3}\.\d{3}\.\d{1,3}\.\d{1,3}).+\"(\w+)\s+([^\s]+)\s+[^\"]+\"\s+(\d{3})/);
          if (matches) {
            timestamp = matches[1];
            method = matches[2];
            path = matches[3];
            status = matches[4];
            message = `${method} ${path} ${status}`;
          }
        }
  
        return {
          source: source.includes('frontend') ? 'Frontend' : 'Backend',
          timestamp,
          message,
          method,
          path,
          status
        };
      });
  };