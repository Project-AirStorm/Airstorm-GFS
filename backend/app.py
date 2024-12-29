from flask import Flask, jsonify, request
from flask_cors import CORS
import openmeteo_requests
import requests_cache
from retry_requests import retry
import pandas as pd
from datetime import datetime
from locations_service import LocationService
from random import randint  # Add this for air quality calculation

app = Flask(__name__)
CORS(app)

# Initialize services
location_service = LocationService()

# Setup the Open-Meteo API client
cache_session = requests_cache.CachedSession('.cache', expire_after=3600)
retry_session = retry(cache_session, retries=5, backoff_factor=0.2)
openmeteo = openmeteo_requests.Client(session=retry_session)


def get_weather_condition(code):
    """Map weather codes to readable conditions"""
    conditions = {
        0: "clear",
        1: "fair",
        2: "partly cloudy",
        3: "cloudy",
        45: "foggy",
        48: "foggy",
        51: "light drizzle",
        53: "drizzle",
        55: "heavy drizzle",
        61: "light rain",
        63: "rain",
        65: "heavy rain",
        71: "light snow",
        73: "snow",
        75: "heavy snow",
        95: "thunderstorm",
    }
    return conditions.get(code, "fair")


def calculate_air_quality(current):
    """
    Calculate air quality index based on available metrics
    This is a placeholder - implement based on your specific needs
    """
    # For demo purposes, return a random number between 50-80
    return randint(50, 80)


@app.route('/api/locations', methods=['GET'])
def get_locations():
    user_id = request.args.get('userId')
    if not user_id:
        return jsonify({"error": "User ID is required"}), 400

    locations = location_service.get_user_locations(user_id)
    return jsonify(locations)


@app.route('/api/locations', methods=['POST'])
def save_location():
    data = request.json
    if not all(k in data for k in ('userId', 'name', 'latitude', 'longitude')):
        return jsonify({"error": "Missing required fields"}), 400

    success = location_service.save_location(
        data['userId'],
        data['name'],
        data['latitude'],
        data['longitude'],
        data.get('isFavorite', False)
    )

    return jsonify({"success": success})


@app.route('/api/locations', methods=['DELETE'])
def delete_location():
    data = request.json
    if not all(k in data for k in ('userId', 'latitude', 'longitude')):
        return jsonify({"error": "Missing required fields"}), 400

    success = location_service.delete_location(
        data['userId'],
        data['latitude'],
        data['longitude']
    )

    return jsonify({"success": success})


@app.route('/api/locations/favorite', methods=['POST'])
def toggle_favorite():
    data = request.json
    if not all(k in data for k in ('userId', 'latitude', 'longitude')):
        return jsonify({"error": "Missing required fields"}), 400

    success = location_service.toggle_favorite(
        data['userId'],
        data['latitude'],
        data['longitude']
    )

    return jsonify({"success": success})


@app.route('/api/weather', methods=['GET'])
def get_weather():
    lat = request.args.get('lat', type=float)
    lon = request.args.get('lon', type=float)

    if lat is None or lon is None:
        return jsonify({"error": "Latitude and Longitude are required"}), 400

    try:
        url = "https://api.open-meteo.com/v1/forecast"
        params = {
            "latitude": lat,
            "longitude": lon,
            "current": [
                "temperature_2m",
                "relative_humidity_2m",
                "wind_speed_10m",
                "weather_code"
            ],
            "hourly": ["temperature_2m"],
            "temperature_unit": "fahrenheit",
            "wind_speed_unit": "mph",
            "timezone": "GMT"
        }

        responses = openmeteo.weather_api(url, params=params)
        response = responses[0]
        current = response.Current()

        # Process weather code to condition
        weather_code = current.Variables(0).Value()
        condition = get_weather_condition(weather_code)

        # Format the data for response
        weather_data = {
            "current_temperature": current.Variables(0).Value(),
            "humidity": current.Variables(1).Value(),
            "wind_speed": current.Variables(2).Value(),
            "condition": condition,
            "air_quality": calculate_air_quality(current),
            "latitude": response.Latitude(),
            "longitude": response.Longitude(),
        }

        return jsonify(weather_data)

    except Exception as e:
        print(f"Error fetching weather data: {str(e)}")
        return jsonify({"error": str(e)}), 500


if __name__ == "__main__":
    app.run(host='0.0.0.0', port=5001)