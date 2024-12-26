from flask import Flask, jsonify, request
from flask_cors import CORS
import openmeteo_requests
import requests_cache
from retry_requests import retry
from datetime import datetime

app = Flask(__name__)
CORS(app)  # enables cross origin resource sharing

# Setup the Open-Meteo API client with cache and retry on error
cache_session = requests_cache.CachedSession('.cache', expire_after=3600)
retry_session = retry(cache_session, retries=5, backoff_factor=0.2)
openmeteo = openmeteo_requests.Client(session=retry_session)


@app.route('/api/test', methods=['GET'])
def greet():
    return jsonify({"message": "Hello Airstorm Team, lets do it!"})


@app.route('/home')
def home():
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
        # Configure Open-Meteo API request
        url = "https://api.open-meteo.com/v1/forecast"
        params = {
            "latitude": lat,
            "longitude": lon,
            "hourly": ["temperature_2m", "precipitation", "wind_speed_10m", "wind_direction_10m"],
            "daily": ["sunrise", "sunset"],
            "timezone": "auto",
            "current_weather": True
        }

        # Make API request
        responses = openmeteo.weather_api(url, params=params)
        response = responses[0]  # Get the first location

        # Get current weather
        current = response.Current()
        hourly = response.Hourly()
        daily = response.Daily()

        # Process the data into the same format as before
        processed_data = {
            "temperature": current.Variables(0).Value(),  # Current temperature
            # Current hour precipitation
            "precipitation": hourly.Variables(1).ValuesAsNumpy()[0],
            "wind_speed": current.Variables(3).Value(),  # Current wind speed
            # Current wind direction
            "wind_direction": current.Variables(4).Value(),
            # Today's sunrise
            "sunrise": daily.Variables(0).ValuesAsNumpy()[0],
            "sunset": daily.Variables(1).ValuesAsNumpy()[0]  # Today's sunset
        }

        return jsonify(processed_data)

    except Exception as e:
        return jsonify({"error": str(e)}), 500


if __name__ == "__main__":
    app.run(host='0.0.0.0', port=5000)
