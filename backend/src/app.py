from flask import Flask
from flask_cors import CORS
from dotenv import load_dotenv
import logging

# Import blueprints correctly
from api.external_api import external_api_bp
from api.internal_api import internal_api_bp

# Load environment variables
load_dotenv()

# Initialize Flask app
app = Flask(__name__)
CORS(app)

# Register blueprints
app.register_blueprint(external_api_bp)
app.register_blueprint(internal_api_bp)

# Configure logging
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5001)
