import re

# List of patterns to sanitize (add more as needed)
SENSITIVE_PATTERNS = [
    # API keys typically follow these patterns
    (r'key=([^&\s]+)', r'key=***REDACTED***'),
    (r'apikey=([^&\s]+)', r'apikey=***REDACTED***'),
    (r'api_key=([^&\s]+)', r'api_key=***REDACTED***'),
    (r'token=([^&\s]+)', r'token=***REDACTED***'),
    (r'secret=([^&\s]+)', r'secret=***REDACTED***'),
    (r'password=([^&\s]+)', r'password=***REDACTED***'),
    (r'auth=([^&\s]+)', r'auth=***REDACTED***'),
    # URLs containing API keys
    (r'https://www\.meteosource\.com/api/v1/standard/map\?key=[^&\s]+', 
     r'https://www.meteosource.com/api/v1/standard/map?key=***REDACTED***'),
    (r'https://maps\.googleapis\.com/maps/api/geocode/json\?[^&]*key=[^&\s]+', 
     r'https://maps.googleapis.com/maps/api/geocode/json?...&key=***REDACTED***'),
    (r'https://maps\.googleapis\.com/maps/api/place/[^?]*\?[^&]*key=[^&\s]+',
     r'https://maps.googleapis.com/maps/api/place/...?key=***REDACTED***'),
    (r'https://customer-api\.open-meteo\.com/v1/forecast\?apikey=[^&\s]+',
     r'https://customer-api.open-meteo.com/v1/forecast?apikey=***REDACTED***'),
]

def sanitize_log_message(message):
    """Sanitize a log message to remove sensitive information."""
    if message is None:
        return message
    
    sanitized = str(message)
    for pattern, replacement in SENSITIVE_PATTERNS:
        sanitized = re.sub(pattern, replacement, sanitized)
    
    return sanitized