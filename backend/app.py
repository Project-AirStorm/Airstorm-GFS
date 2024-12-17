import os
import requests
from datetime import datetime, timedelta
from flask import Flask, jsonify, request
from flask_cors import CORS
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

app = Flask(__name__)
CORS(app)  # enables cross origin resource sharing

# Meteomatics API configuration
METEOMATICS_USERNAME = os.getenv('METEOMATICS_USERNAME')
METEOMATICS_PASSWORD = os.getenv('METEOMATICS_PASSWORD')


@app.route('/api/test', methods=['GET'])
def greet():
    return jsonify({"message": "Hello Airstorm Team, lets do it!"})


@app.route('/home')
def home():
    # this will eventually contain our Graphcast Data, served up to react
    return jsonify({"message": "Hi, I am the flask API Everyone!"})


@app.route('/api/weather', methods=['GET'])
def get_weather():
    # Get coordinates from query parameters
    lat = request.args.get('lat', type=float)
    lon = request.args.get('lon', type=float)

    # Validate input
    if lat is None or lon is None:
        return jsonify({"error": "Latitude and Longitude are required"}), 400

    try:
        # Get current date and format for API
        now = datetime.utcnow()
        formatted_date = now.strftime('%Y-%m-%dT%H:%M:%SZ')

        # Construct Meteomatics API URL
        url = f'https://api.meteomatics.com/v1/{
            formatted_date}/t_2m:C,precip_1h:mm,wind_speed_10m:kmh,wind_dir_10m:d,sunrise:sql,sunset:sql/{lat},{lon}/json'

        # Make API request
        response = requests.get(
            url,
            auth=(METEOMATICS_USERNAME, METEOMATICS_PASSWORD)
        )

        # Check if request was successful
        response.raise_for_status()

        # Parse the response
        weather_data = response.json()

        # Transform the data into a more readable format
        processed_data = {
            "temperature": next(
                (item['coordinates'][0]['dates'][0]['value']
                 for item in weather_data['data'] if item['parameter'] == 't_2m:C'),
                None
            ),
            "precipitation": next(
                (item['coordinates'][0]['dates'][0]['value']
                 for item in weather_data['data'] if item['parameter'] == 'precip_1h:mm'),
                None
            ),
            "wind_speed": next(
                (item['coordinates'][0]['dates'][0]['value']
                 for item in weather_data['data'] if item['parameter'] == 'wind_speed_10m:kmh'),
                None
            ),
            "wind_direction": next(
                (item['coordinates'][0]['dates'][0]['value']
                 for item in weather_data['data'] if item['parameter'] == 'wind_dir_10m:d'),
                None
            ),
            "sunrise": next(
                (item['coordinates'][0]['dates'][0]['value']
                 for item in weather_data['data'] if item['parameter'] == 'sunrise:sql'),
                None
            ),
            "sunset": next(
                (item['coordinates'][0]['dates'][0]['value']
                 for item in weather_data['data'] if item['parameter'] == 'sunset:sql'),
                None
            )
        }

        return jsonify(processed_data)

    except requests.RequestException as e:
        return jsonify({"error": str(e)}), 500


if __name__ == "__main__":
    app.run(host='0.0.0.0', port=5000)
