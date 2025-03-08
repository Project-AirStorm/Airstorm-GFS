from functools import wraps
from flask import jsonify
import logging
from utils.log_sanitizer import sanitize_log_message

logger = logging.getLogger(__name__)

def protect_api_keys(f):
    """Middleware decorator to protect API keys in error messages."""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        try:
            return f(*args, **kwargs)
        except Exception as e:
            # Sanitize error message
            error_message = str(e)
            sanitized_message = sanitize_log_message(error_message)
            
            # Log the sanitized message
            logger.error(f"API error (sanitized): {sanitized_message}")
            
            # Return a generic error response
            return jsonify({"error": "Unexpected error occurred"}), 500
    return decorated_function