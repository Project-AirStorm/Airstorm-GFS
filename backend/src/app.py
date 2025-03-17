from flask import Flask
from flask_cors import CORS
from dotenv import load_dotenv
import logging
from logging.handlers import RotatingFileHandler
import os
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

# Configure CORS properly - allow all origins for KML files to work with Google Maps
# It's crucial that Google's servers can access our KML files
CORS(app, resources={r"/api/*": {"origins": "*", "supports_credentials": False}})

# Configure logging
logging.basicConfig(
    level=logging.DEBUG,
    format='%(asctime)s | %(name)s | %(levelname)s | %(message)s',
    datefmt='%Y-%m-%d %H:%M:%S'
)

#Create logs directory if it doesn't exist
if not os.path.exists('logs'):
    os.makedirs('logs')

# Add file handler
file_handler = RotatingFileHandler(
    'logs/app.log',
    maxBytes=1024 * 1024,  # 1MB
    backupCount=10
)
file_handler.setFormatter(logging.Formatter(
    '%(asctime)s | %(name)s | %(levelname)s | %(message)s'
))
file_handler.setLevel(logging.INFO)

# Create sensitive data filter
sensitive_filter = SensitiveDataFilter()
file_handler.addFilter(sensitive_filter)

# Add the handler to the root logger
root_logger = logging.getLogger('')
root_logger.addHandler(file_handler)
root_logger.addFilter(sensitive_filter)

# Specifically configure werkzeug logger
werkzeug_logger = logging.getLogger('werkzeug')
werkzeug_logger.addHandler(file_handler)
werkzeug_logger.addFilter(sensitive_filter)

# Set watchdog to ERROR level to reduce noise
logging.getLogger("watchdog").setLevel(logging.ERROR)

# Create a logger for the application
logger = logging.getLogger(__name__)

# Register blueprints
app.register_blueprint(external_api_bp)
app.register_blueprint(internal_api_bp)
app.register_blueprint(chat_api_bp)
app.register_blueprint(charts_api_bp)

# Creates the database
db_initializer = DatabaseInitializer()

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5001)