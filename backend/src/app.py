import sys
import os
import logging
from logging.handlers import RotatingFileHandler
from flask import Flask
from flask_cors import CORS
from dotenv import load_dotenv
from db.database_initializer import DatabaseInitializer

# Import blueprints correctly
from api.external_api import external_api_bp
from api.internal_api import internal_api_bp
from api.chat_api import chat_api_bp
from api.chart_api import charts_api_bp

# Import the log filter
from utils.log_filter import SensitiveDataFilter

# Load environment variables
load_dotenv()

# Initialize Flask app
app = Flask(__name__)

# Configure CORS properly
CORS(app, resources={r"/api/*": {"origins": "*", "supports_credentials": False}})

# --- Logging Configuration ---

# Create sensitive data filter instance
sensitive_filter = SensitiveDataFilter()

# Define log format
log_formatter = logging.Formatter(
    '%(asctime)s | %(name)s | %(levelname)s | %(message)s',
    datefmt='%Y-%m-%d %H:%M:%S'
)

# Create logs directory if it doesn't exist
if not os.path.exists('logs'):
    os.makedirs('logs')

# Configure File Handler
file_handler = RotatingFileHandler(
    'logs/app.log',
    maxBytes=1024 * 1024,  # 1MB
    backupCount=10
)
file_handler.setFormatter(log_formatter)
# Set desired level for file output (e.g., INFO or DEBUG)
file_handler.setLevel(logging.INFO)
# Apply the filter ONLY to the handler(s)
file_handler.addFilter(sensitive_filter)

# Explicitly Configure Console Handler
console_handler = logging.StreamHandler(sys.stdout) # Use sys.stdout for console
console_handler.setFormatter(log_formatter)
# Set desired level for console output (e.g., INFO or DEBUG)
console_handler.setLevel(logging.DEBUG)
# Apply the filter to the console handler
console_handler.addFilter(sensitive_filter)

# Configure Root Logger
# Get root logger, set its base level (the lowest level any handler will process)
root_logger = logging.getLogger('')
root_logger.setLevel(logging.DEBUG) 
# Remove existing handlers added by basicConfig or Flask's defaults
if root_logger.hasHandlers():
    root_logger.handlers.clear()
# Add configured handlers
root_logger.addHandler(file_handler)
root_logger.addHandler(console_handler)

# Configure Third-Party Loggers
# Silence noisy library loggers by setting their level higher
logging.getLogger("urllib3").setLevel(logging.WARNING)
logging.getLogger("requests_cache").setLevel(logging.WARNING)
# Set watchdog to ERROR level to reduce noise
logging.getLogger("watchdog").setLevel(logging.ERROR)

# Configure Werkzeug logger (Flask's web server)
werkzeug_logger = logging.getLogger('werkzeug')
# Decide how Werkzeug logs should be handled:
# Option 1: Let the root logger's handlers manage them (simpler)
werkzeug_logger.setLevel(logging.INFO) # Or DEBUG if needed
werkzeug_logger.propagate = True # Send to root logger handlers (which have the filter)

# Option 2: Handle Werkzeug logs separately (more complex)
# werkzeug_logger.setLevel(logging.INFO) # Or DEBUG
# werkzeug_logger.propagate = False # Stop messages going to root
# # Add handlers *directly* to werkzeug_logger if not propagating
# if not werkzeug_logger.hasHandlers():
#     werkzeug_logger.addHandler(console_handler) 
#     werkzeug_logger.addHandler(file_handler)
# else: # If it has handlers (like Flask default), add filter to them
#     for handler in werkzeug_logger.handlers:
#         # Check if filter already exists to avoid duplicates
#         if sensitive_filter not in handler.filters:
#             handler.addFilter(sensitive_filter)

# --- End Logging Configuration ---

# Create a logger for this specific application module (optional)
# It will inherit level and handlers from the root logger
logger = logging.getLogger(__name__)
logger.info("Logging configured with sensitive data filter on handlers.")

# Register blueprints
app.register_blueprint(external_api_bp)
app.register_blueprint(internal_api_bp)
app.register_blueprint(chat_api_bp)
app.register_blueprint(charts_api_bp)

# Creates the database
db_initializer = DatabaseInitializer()

if __name__ == "__main__":
    # debug=True enables Flask's interactive debugger AND sets logging level to DEBUG for Flask related loggers
    # Setting debug=False relies solely on your logging configuration above.
    # Use debug=True for development, but ensure it's False for production.
    is_debug_mode = os.getenv('FLASK_DEBUG', 'false').lower() == 'true'
    app.run(host="0.0.0.0", port=5001, debug=is_debug_mode)