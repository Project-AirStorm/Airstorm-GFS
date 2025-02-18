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

# Load environment variables
load_dotenv()

# Initialize Flask app
app = Flask(__name__)
CORS(app)

# Configure logging
logging.basicConfig(
    level=logging.DEBUG,
    format='%(asctime)s | %(name)s | %(levelname)s | %(message)s',
    datefmt='%Y-%m-%d %H:%M:%S'
)

# Create logs directory if it doesn't exist
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

# Add the handler to the root logger
logging.getLogger('').addHandler(file_handler)

# Specifically configure werkzeug logger
werkzeug_logger = logging.getLogger('werkzeug')
werkzeug_logger.addHandler(file_handler)

# Set watchdog to ERROR level to reduce noise
logging.getLogger("watchdog").setLevel(logging.ERROR)

# Create a logger for the application
logger = logging.getLogger(__name__)

# Register blueprints
app.register_blueprint(external_api_bp)
app.register_blueprint(internal_api_bp)

# Initialize database
db_initializer = DatabaseInitializer()

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5001)