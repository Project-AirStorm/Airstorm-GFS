import re

# List of patterns to sanitize (add more as needed)
# Order can matter if patterns overlap; more specific patterns first might be better.
SENSITIVE_PATTERNS = [
    # Specific URL patterns (make replacements broader, capture group for base URL)
    # Google Geocode/Places - Replace key param fully
    (r'(https://maps\.googleapis\.com/maps/api/(?:geocode|place)/[^?]+\?)key=[^&\s]+(&?)', r'\1key=***REDACTED***\2'), 
    # Open-Meteo Customer APIs - Replace apikey param fully
    (r'(https://customer-(?:archive-|historical-forecast-|previous-runs-)?api\.open-meteo\.com/v1/(?:forecast|archive)\?)apikey=[^&\s]+(&?)', r'\1apikey=***REDACTED***\2'),
    # Meteosource - Replace key param fully
    (r'(https://www\.meteosource\.com/api/v1/standard/map\?)key=[^&\s]+(&?)', r'\1key=***REDACTED***\2'),
    # Stream API Key (from logs) - Replace api_key param fully
    (r'(POST /users\?api_key=)[^&\s]+(.*)', r'\1***REDACTED***\2'), # Match POST log format
    (r'api_key=[a-z0-9]{10,}', r'api_key=***REDACTED***'), # General stream api_key param, assuming it's alphanumeric and reasonably long
    
    # General key patterns (as fallback) - replace the whole param value
    (r'(key=)[^&\s]+', r'\1***REDACTED***'),
    (r'(apikey=)[^&\s]+', r'\1***REDACTED***'),
    (r'(api_key=)[^&\s]+', r'\1***REDACTED***'),
    (r'(token=)[^&\s]+', r'\1***REDACTED***'),
    (r'(secret=)[^&\s]+', r'\1***REDACTED***'),
    (r'(password=)[^&\s]+', r'\1***REDACTED***'),
    (r'(auth=)[^&\s]+', r'\1***REDACTED***'),
    
    # Potentially sensitive headers (like Authorization)
    (r'(Authorization\s*:\s*Bearer\s+)[^&\s]+', r'\1***REDACTED***'),
    (r'(Authorization\s*:\s*Basic\s+)[^&\s]+', r'\1***REDACTED***'),
    (r'(X-Api-Key\s*:\s*)[^&\s]+', r'\1***REDACTED***'),

    # Debugger PIN (from logs)
    (r'Debugger PIN:\s*\d{3}-\d{3}-\d{3}', r'Debugger PIN: ***REDACTED***'),
]

def sanitize_log_message(message):
    """Sanitize a log message to remove sensitive information."""
    if message is None:
        # Return None if the input is None to avoid errors with str()
        return None
    
    sanitized = str(message) # Ensure message is a string
    for pattern, replacement in SENSITIVE_PATTERNS:
        # Use re.sub which handles non-matches gracefully
        sanitized = re.sub(pattern, replacement, sanitized, flags=re.IGNORECASE) # Add ignorecase flag for headers
    
    return sanitized