from functools import wraps
from flask import jsonify, request
import logging
import re
from utils.log_sanitizer import sanitize_log_message


logger = logging.getLogger(__name__)

def protect_api_keys(f):
    """
    Middleware decorator to protect API keys in error messages and log all API requests safely.
    Also sanitizes request URLs before they are logged by third-party libraries.
    
    Args:
        f: The function to decorate
        
    Returns:
        The decorated function with API key protection
    """
    @wraps(f)
    def decorated_function(*args, **kwargs):
        # Pre-request logging - sanitize URL and headers
        try:
            # Get the request URL and sanitize it for logging
            url = request.url
            method = request.method
            sanitized_url = sanitize_log_message(url)
            
            # Log the sanitized request information
            logger.info(f"API {method} request to {sanitized_url}")
            
            # Proceed with the original function
            return f(*args, **kwargs)
        except Exception as e:
            # Sanitize error message
            error_message = str(e)
            sanitized_message = sanitize_log_message(error_message)
            
            # Log the sanitized error
            logger.error(f"API error (sanitized): {sanitized_message}")
            
            # Return a generic error response
            return jsonify({"error": "Unexpected error occurred"}), 500
    
    return decorated_function


def sanitize_request_logging():
    """
    Create a middleware that sanitizes request logs.
    This can be registered as a before_request handler with Flask.
    
    Example usage in app.py:
        from middleware.api_key_protection import sanitize_request_logging
        app.before_request(sanitize_request_logging)
    """
    # Only process if it's a request that might contain API keys
    if any(key in request.url for key in ['key=', 'apikey=', 'api_key=', 'token=']):
        # Get the original URL
        original_url = request.url
        
        # Sanitize it
        sanitized_url = sanitize_log_message(original_url)
        
        # Log only the sanitized version
        logger.debug(f"Sanitized request to: {sanitized_url}")