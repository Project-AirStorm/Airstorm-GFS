from random import randint
from locations_service import LocationService
from datetime import datetime
import pandas as pd
from retry_requests import retry
import requests_cache
import openmeteo_requests
from flask_cors import CORS
from flask import Flask, jsonify, request
import requests
import logging
import os
from dotenv import load_dotenv
import logging
from database_initializer import DatabaseInitializer

# Initialize the database service with the correct path
db_service = DatabaseInitializer(db_path="data/app.sqlite")
# TEMPORARY: Suppress DEBUG logs from `watchdog` and other libraries
#logging.getLogger("watchdog").setLevel(logging.WARNNG)
#logging.getLogger("watchdog.observers.inotify_buffer").setLevel(logging.WARNING)

# logging.getLogger("watchdog").setLevel(logging.ERROR)
# logging.getLogger("watchdog.observers.inotify_buffer").setLevel(logging.ERROR)

# Load environment variables from .env file
load_dotenv()

app = Flask(__name__)
CORS(app)

# Initialize services
location_service = LocationService()
BACKEND_GOOGLE_MAPS_API_KEY = os.getenv('BACKEND_GOOGLE_MAPS_API_KEY')

# Logging setup
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

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

# Gets the current User_ID
@app.route('/api/locations', methods=['GET'])
def get_locations():
    user_id = request.args.get('userId')
    if not user_id:
        return jsonify({"error": "User ID is required"}), 400
    #reads in from user_id from CSV file in locations_service.py 
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

# Deletes locations from React WeatherCard 
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

# Returns the city or location based upon the provided coordinates
@app.route('/api/geocode', methods=['GET'])
def get_location_info():
    try:
        lat = request.args.get('lat', type=float)
        lon = request.args.get('lon', type=float)

        logger.info(f"Geocoding request for lat={lat}, lon={lon}")

        if lat is None or lon is None:
            return jsonify({"error": "Latitude and Longitude are required"}), 400

        if not BACKEND_GOOGLE_MAPS_API_KEY:
            logger.error("Google Maps API key not configured")
            return jsonify({
                "error": "Geocoding service not configured",
                "details": "Missing API key"
            }), 503

        # Build the geocoding request
        url = "https://maps.googleapis.com/maps/api/geocode/json"
        params = {
            "latlng": f"{lat},{lon}",
            "key": BACKEND_GOOGLE_MAPS_API_KEY,
            "language": "en"
        }

        response = requests.get(url, params=params)
        data = response.json()

        # Fix for multiline f-string error
        status = data.get('status')
        error_message = data.get('error_message', 'No results found')
        logger.error(f"Geocoding API error: {status} - {error_message}")

        if status != "OK" or not data.get("results"):
            return jsonify({
                "error": "Geocoding failed",
                "details": error_message
            }), 503

        # Initialize location info structure
        location_info = {
            "formatted_address": "",
            "components": {
                "city": "",
                "state": "",
                "state_code": "",
                "county": "",
                "country": "",
                "country_code": ""
            }
        }

        # Get the first result that has address components
        result = next((r for r in data["results"]
                      if r.get("address_components")), None)

        if result:
            location_info["formatted_address"] = result["formatted_address"]

            for component in result["address_components"]:
                types = component["types"]

                # City can be locality or sublocality
                if "locality" in types:
                    location_info["components"]["city"] = component["long_name"]
                # State
                elif "administrative_area_level_1" in types:
                    location_info["components"]["state"] = component["long_name"]
                    location_info["components"]["state_code"] = component["short_name"]
                # County
                elif "administrative_area_level_2" in types:
                    location_info["components"]["county"] = component["long_name"]
                # Country
                elif "country" in types:
                    location_info["components"]["country"] = component["long_name"]
                    location_info["components"]["country_code"] = component["short_name"]

            # If no city was found in locality, check for neighborhood or sublocality
            if not location_info["components"]["city"]:
                for component in result["address_components"]:
                    if "sublocality" in component["types"] or "neighborhood" in component["types"]:
                        location_info["components"]["city"] = component["long_name"]
                        break

            # If still no city, try to use the first locality found in any result
            if not location_info["components"]["city"]:
                for r in data["results"]:
                    for component in r.get("address_components", []):
                        if "locality" in component["types"]:
                            location_info["components"]["city"] = component["long_name"]
                            break
                    if location_info["components"]["city"]:
                        break

        logger.debug(f"Processed location info: {location_info}")
        return jsonify(location_info)

    except requests.exceptions.RequestException as e:
        logger.error(f"Request error in geocoding: {str(e)}")
        return jsonify({
            "error": "Geocoding service unavailable",
            "details": str(e)
        }), 503
    except Exception as e:
        logger.error(f"Unexpected error in geocoding: {str(e)}")
        return jsonify({
            "error": "Internal server error",
            "details": str(e)
        }), 500


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
        weather_code = current.Variables(3).Value()
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
