from flask import Blueprint, jsonify, request, Response
import requests
import os
import logging
import time
from email.utils import parsedate_to_datetime
from datetime import datetime
from services.weather_analyzer import WeatherAnalyzer
from services.github_service import GitHubService
from db.database_manager import DatabaseManager
import openmeteo_requests
import requests_cache
from retry_requests import retry
from functools import lru_cache
from datetime import datetime, timedelta
from threading import Lock
from middleware.api_key_protection import protect_api_keys
import json

external_api_bp = Blueprint("external_api", __name__)

logger = logging.getLogger(__name__)
database_service = DatabaseManager()
responses = []
# Initialize services
weather_analyzer = WeatherAnalyzer()
BACKEND_GOOGLE_MAPS_API_KEY = os.getenv("BACKEND_GOOGLE_MAPS_API_KEY")
BACKEND_OPENMETEO_API_KEY = os.getenv("BACKEND_OPENMETEO_API_KEY")

# Setup Open-Meteo API client
cache_session = requests_cache.CachedSession(".cache", expire_after=3600)
retry_session = retry(cache_session, retries=5, backoff_factor=0.2)
openmeteo = openmeteo_requests.Client(session=retry_session)


# ====== Meteosource Tile API ======


@external_api_bp.route('/api/meteosource/tile')
@protect_api_keys
def meteosource_tile():
    try:
        variable = request.args.get('variable', 'temperature')
        valid_variables = [
            "temperature", "feels_like_temperature", "clouds", "precipitation",
            "wind_speed", "wind_gust", "pressure", "humidity", "wave_height",
            "wave_period", "air_quality", "ozone_surface", "ozone_total",
            "no2", "pm2.5"
        ]
        tile_x = request.args.get('x')
        tile_y = request.args.get('y')
        tile_zoom = request.args.get('zoom')
        datetime_param = request.args.get('datetime', '+1hour')

        if variable not in valid_variables:
            variable = 'temperature'

        api_key = os.getenv('BACKEND_METEOSOURCE_API_KEY')
        if not api_key:
            logger.error("Meteosource API key not configured")
            return jsonify({"error": "Service configuration error"}), 500

        url = (
            f"https://www.meteosource.com/api/v1/standard/map?"
            f"key={api_key}&tile_x={tile_x}"
            f"&tile_y={tile_y}&tile_zoom={tile_zoom}"
            f"&datetime={datetime_param}&variable={variable}"
        )

        response = requests.get(url)
        response.raise_for_status()

        headers = {'Content-Type': response.headers.get('Content-Type', '')}
        expires = response.headers.get('Expires')

        if expires:
            try:
                expires_dt = parsedate_to_datetime(expires)
                now = datetime.now(expires_dt.tzinfo)
                max_age = max(int((expires_dt - now).total_seconds()), 0)
                headers['Cache-Control'] = f'public, max-age={max_age}'
                headers['Expires'] = expires
            except Exception as e:
                logger.error(f"Error processing Expires header: {str(e)}")
                headers['Cache-Control'] = 'public, max-age=3600'
        else:
            headers['Cache-Control'] = 'public, max-age=3600'

        return Response(response.content, headers=headers)

    except Exception as e:
        # This will be handled by protect_api_keys decorator
        raise
    try:
        variable = request.args.get('variable', 'temperature')
        valid_variables = [
            "temperature", "feels_like_temperature", "clouds", "precipitation",
            "wind_speed", "wind_gust", "pressure", "humidity", "wave_height",
            "wave_period", "air_quality", "ozone_surface", "ozone_total",
            "no2", "pm2.5"
        ]
        tile_x = request.args.get('x')
        tile_y = request.args.get('y')
        tile_zoom = request.args.get('zoom')
        datetime_param = request.args.get('datetime', '+1hour')

        if variable not in valid_variables:
            variable = 'temperature'

        api_key = os.getenv('BACKEND_METEOSOURCE_API_KEY')
        if not api_key:
            logger.error("Meteosource API key not configured")
            return jsonify({"error": "Service configuration error"}), 500

        url = (
            f"https://www.meteosource.com/api/v1/standard/map?"
            f"key={api_key}&tile_x={tile_x}"
            f"&tile_y={tile_y}&tile_zoom={tile_zoom}"
            f"&datetime={datetime_param}&variable={variable}"
        )

        response = requests.get(url)
        response.raise_for_status()

        headers = {'Content-Type': response.headers.get('Content-Type', '')}
        expires = response.headers.get('Expires')

        if expires:
            try:
                expires_dt = parsedate_to_datetime(expires)
                now = datetime.now(expires_dt.tzinfo)
                max_age = max(int((expires_dt - now).total_seconds()), 0)
                headers['Cache-Control'] = f'public, max-age={max_age}'
                headers['Expires'] = expires
            except Exception as e:
                logger.error(f"Error processing Expires header: {str(e)}")
                headers['Cache-Control'] = 'public, max-age=3600'
        else:
            headers['Cache-Control'] = 'public, max-age=3600'

        return Response(response.content, headers=headers)

    except Exception as e:
        logger.error(f"Unexpected tile error: {e}")
        return jsonify({"error": "Unexpected error occurred"}), 500


# ====== Google Maps Geocoding API ======


@external_api_bp.route("/api/geocode", methods=["GET"])
@protect_api_keys
def get_location_info():
    try:
        lat = request.args.get("lat", type=float)
        lon = request.args.get("lon", type=float)
        max_retries = 3
        retry_delay = 1  # seconds

        logger.info(f"Geocoding request for lat={lat}, lon={lon}")

        if lat is None or lon is None:
            return jsonify({"error": "Latitude and Longitude are required"}), 400

        if not BACKEND_GOOGLE_MAPS_API_KEY:
            logger.error("Google Maps API key not configured")
            return jsonify({
                "formatted_address": "Location data unavailable",
                "components": {
                    "city": "Unknown",
                    "state": "Unknown",
                    "state_code": "NA",
                    "county": "Unknown",
                    "country": "Unknown",
                    "country_code": "NA",
                }
            })

        for attempt in range(max_retries):
            try:
                url = "https://maps.googleapis.com/maps/api/geocode/json"
                params = {
                    "latlng": f"{lat},{lon}",
                    "key": BACKEND_GOOGLE_MAPS_API_KEY,
                    "language": "en",
                }

                response = requests.get(url, params=params)
                data = response.json()

                if data.get("status") == "OK" and data.get("results"):
                    result = data["results"][0]
                    location_info = {
                        "formatted_address": result.get("formatted_address", "Address unavailable"),
                        "components": {
                            "city": "",
                            "state": "",
                            "state_code": "",
                            "county": "",
                            "country": "",
                            "country_code": "",
                        }
                    }

                    for component in result.get("address_components", []):
                        types = component["types"]

                        if "locality" in types:
                            location_info["components"]["city"] = component["long_name"]
                        elif "administrative_area_level_1" in types:
                            location_info["components"]["state"] = component["long_name"]
                            location_info["components"]["state_code"] = component["short_name"]
                        elif "administrative_area_level_2" in types:
                            location_info["components"]["county"] = component["long_name"]
                        elif "country" in types:
                            location_info["components"]["country"] = component["long_name"]
                            location_info["components"]["country_code"] = component["short_name"]

                    # If we got a result, even if some fields are empty, return it
                    logger.debug(f"Processed location info: {location_info}")
                    return jsonify(location_info)

                # If we get here, the API responded but didn't give us results
                if attempt < max_retries - 1:
                    logger.warning(
                        f"Attempt {attempt + 1} failed, retrying in {retry_delay} seconds...")
                    time.sleep(retry_delay)
                    continue

            except requests.exceptions.RequestException as e:
                if attempt < max_retries - 1:
                    logger.warning(
                        f"Request failed on attempt {attempt + 1}: {str(e)}, retrying...")
                    time.sleep(retry_delay)
                    continue
                logger.error(f"All request attempts failed: {str(e)}")

        # If we get here, all attempts failed. Return a fallback response
        return jsonify({
            "formatted_address": f"Location at {lat}, {lon}",
            "components": {
                "city": "Unknown City",
                "state": "Unknown State",
                "state_code": "NA",
                "county": "Unknown County",
                "country": "Unknown Country",
                "country_code": "NA",
            }
        })

    except Exception as e:
        logger.error(f"Unexpected error in geocoding: {str(e)}")
        return jsonify({
            "formatted_address": "Error retrieving location",
            "components": {
                "city": "Error",
                "state": "Error",
                "state_code": "ERR",
                "county": "Error",
                "country": "Error",
                "country_code": "ERR",
            }
        })


@external_api_bp.route('/api/places/autocomplete', methods=['GET'])
@protect_api_keys
def places_autocomplete():
    try:
        input_text = request.args.get('input')
        if not input_text:
            return jsonify({"error": "Input text is required"}), 400

        api_key = os.getenv('BACKEND_GOOGLE_MAPS_API_KEY')
        if not api_key:
            logger.error("Google Maps API key not configured")
            return jsonify({"error": "Service configuration error"}), 500

        url = "https://maps.googleapis.com/maps/api/place/autocomplete/json"
        params = {
            "input": input_text,
            "types": "(cities)",
            "key": api_key
        }

        response = requests.get(url, params=params)
        response.raise_for_status()

        return jsonify(response.json())

    except requests.RequestException as e:
        logger.error(f"Google Places API error: {str(e)}")
        return jsonify({"error": "Failed to fetch places data"}), 500
    except Exception as e:
        logger.error(f"Unexpected error in places autocomplete: {str(e)}")
        return jsonify({"error": "Internal server error"}), 500


@external_api_bp.route('/api/places/details', methods=['GET'])
@protect_api_keys
def place_details():
    try:
        place_id = request.args.get('placeId')
        if not place_id:
            return jsonify({"error": "Place ID is required"}), 400

        api_key = os.getenv('BACKEND_GOOGLE_MAPS_API_KEY')
        if not api_key:
            logger.error("Google Maps API key not configured")
            return jsonify({"error": "Service configuration error"}), 500

        url = "https://maps.googleapis.com/maps/api/place/details/json"
        params = {
            "place_id": place_id,
            "fields": "name,geometry,formatted_address",
            "key": api_key
        }

        response = requests.get(url, params=params)
        response.raise_for_status()

        return jsonify(response.json())

    except requests.RequestException as e:
        logger.error(f"Google Places API error: {str(e)}")
        return jsonify({"error": "Failed to fetch place details"}), 500
    except Exception as e:
        logger.error(f"Unexpected error in place details: {str(e)}")
        return jsonify({"error": "Internal server error"}), 500


@external_api_bp.route('/api/google-maps-init')
def google_maps_init():
    try:
        return jsonify({
            "googleMapsKey": os.getenv('BACKEND_GOOGLE_MAPS_API_KEY')
        })
    except Exception as e:
        logger.error(f"Google Maps init error: {str(e)}")
        return jsonify({"error": "Internal server error"}), 500


# ====== Open-Meteo Weather API ======
@external_api_bp.route("/api/weather", methods=["GET"])
@protect_api_keys
def get_weather():
    # Load API key and verify it exists
    api_key = os.getenv('BACKEND_OPENMETEO_API_KEY')
    if not api_key:
        logger.error("No API key found for Open-Meteo")
        return jsonify({"error": "API configuration error"}), 500

    lat = request.args.get("lat", type=float)
    lon = request.args.get("lon", type=float)

    if lat is None or lon is None:
        return jsonify({"error": "Latitude and Longitude are required"}), 400

    try:
        url = f"https://customer-api.open-meteo.com/v1/forecast?apikey={api_key}"
        params = {
            "latitude": lat,
            "longitude": lon,
            "current": [
                "temperature_2m",
                "rain",
                "wind_speed_10m",
                "weather_code",
            ],
            "hourly": ["temperature_2m"],
            "temperature_unit": "fahrenheit",
            "rain": "inch",
            "wind_speed_unit": "mph",
            "wind_direction_10m": "°",
            "timezone": "GMT",
        }

        responses = openmeteo.weather_api(url, params=params)
        response = responses[0]
        current = response.Current()

        # Add more detailed error logging
        if not current:
            logger.error("No current weather data received from Open-Meteo")
            return jsonify({"error": "No weather data available"}), 500

        weather_data = {
            "current_temperature": current.Variables(0).Value(),
            "rain": current.Variables(1).Value(),
            "wind_speed": current.Variables(2).Value(),
            "wind_direction": calculate_wind_direction(current.Variables(3).Value()),
            "condition": weather_analyzer.get_weather_condition(current.Variables(3).Value()),
            "latitude": response.Latitude(),
            "longitude": response.Longitude(),
        }

        return jsonify(weather_data)

    except Exception as e:
        logger.error(f"Error fetching weather data: {str(e)}")
        # Return more specific error information
        return jsonify({
            "error": f"Weather service error: {str(e)}",
            "latitude": lat,
            "longitude": lon
        }), 500


def calculate_wind_direction(current):
    degree_speed = current
    directions = ["N", "NNE", "NE", "ENE", "E", "ESE", "SE",
                  "SSE", "S", "SSW", "SW", "WSW", "W", "WNW", "NW", "NNW"]
    ix = int((degree_speed + 11.25) / 22.5)
    return directions[ix % 16]


# Add this new route to your external_api.py file after your existing imports and routes
@external_api_bp.route("/api/forecast", methods=["GET"])
@protect_api_keys
def get_forecast():
    """Proxy endpoint for Open-Meteo forecast API"""
    try:
        # Get API key (fall back to free API if no key available)
        api_key = os.getenv('BACKEND_OPENMETEO_API_KEY')

        # Get coordinates
        lat = request.args.get("latitude", type=float)
        lon = request.args.get("longitude", type=float)

        if lat is None or lon is None:
            return jsonify({"error": "Latitude and longitude are required"}), 400

        # Set up parameters for Open-Meteo API
        if api_key:
            url = f"https://customer-api.open-meteo.com/v1/forecast?apikey={api_key}"
        else:
            url = "https://api.open-meteo.com/v1/forecast"

        params = {
            "latitude": lat,
            "longitude": lon,
            "current": [
                "temperature_2m",
                "relative_humidity_2m",
                "precipitation",
                "cloud_cover",
            ],
            "daily": [
                "temperature_2m_max",
                "temperature_2m_min",
                "precipitation_sum",
                "precipitation_probability_max",
                "cloud_cover_mean",
                "weather_code",
            ],
            "temperature_unit": "fahrenheit",
            "precipitation_unit": "inch",
            "forecast_days": 16,
            "timezone": "auto",
            "models": "gfs_graphcast025",
        }

        # Make the request to Open-Meteo
        try:
            logger.info(f"Fetching forecast for {lat}, {lon} from {url}")
            response = requests.get(url, params=params, timeout=10)
            response.raise_for_status()
            return jsonify(response.json())
        except requests.exceptions.RequestException as e:
            logger.error(f"Error fetching forecast from Open-Meteo: {str(e)}")

            # Fall back to free API if we get an error with the customer API
            if api_key and "customer-api" in url:
                logger.info(f"Falling back to free API for {lat}, {lon}")
                try:
                    url = "https://api.open-meteo.com/v1/forecast"
                    response = requests.get(url, params=params, timeout=10)
                    response.raise_for_status()
                    return jsonify(response.json())
                except requests.exceptions.RequestException as e2:
                    logger.error(f"Error with fallback API: {str(e2)}")
                    return jsonify({"error": f"API service unavailable: {str(e2)}"}), 503

            return jsonify({"error": f"Weather service error: {str(e)}"}), 503

    except Exception as e:
        logger.error(f"Error in forecast endpoint: {str(e)}")
        return jsonify({"error": f"Server error: {str(e)}"}), 500


@external_api_bp.route("/api/forecast/detailed", methods=["GET"])
@protect_api_keys
def get_detailed_forecast():
    """Proxy endpoint for Open-Meteo forecast API with expanded detailed daily parameters"""
    try:
        api_key = os.getenv('BACKEND_OPENMETEO_API_KEY')
        lat = request.args.get("latitude", type=float)
        lon = request.args.get("longitude", type=float)

        if lat is None or lon is None:
            return jsonify({"error": "Latitude and longitude are required"}), 400

        # *** Define the NEW, EXPANDED detailed daily parameters ***
        detailed_daily_params = [
            "weather_code", "temperature_2m_max", "apparent_temperature_max",
            "apparent_temperature_min", "wind_speed_10m_max", "wind_gusts_10m_max",
            "wind_direction_10m_dominant", "uv_index_max", "uv_index_clear_sky_max",
            "precipitation_hours", "precipitation_probability_max", "precipitation_sum",
            "snowfall_sum", "showers_sum", "rain_sum", "sunshine_duration",
            "daylight_duration", "sunset", "sunrise", "temperature_2m_mean",
            "temperature_2m_min", "visibility_mean", "relative_humidity_2m_mean",
            "wind_speed_10m_mean", "cape_mean", "cape_max", "cape_min",
            "cloud_cover_mean", "cloud_cover_min", "cloud_cover_max",
            "dew_point_2m_mean", "precipitation_probability_mean", "updraft_max",
            "winddirection_10m_dominant", "wind_gusts_10m_mean", "wind_gusts_10m_min",
            "wind_speed_10m_min",
            # Added parameters from the new URL:
            "dew_point_2m_max", "dew_point_2m_min", "precipitation_probability_min",
            "relative_humidity_2m_min", "relative_humidity_2m_max",
            "snowfall_water_equivalent_sum", "visibility_max", "visibility_min"
        ]

        # Set up parameters for Open-Meteo API
        params = {
            "latitude": lat,
            "longitude": lon,
            "daily": detailed_daily_params, # Use the new expanded list
            "models": "best_match",
            "timezone": "GMT",
            "forecast_days": 16,
            "temperature_unit": "fahrenheit", # Keep existing units
            "precipitation_unit": "inch",     # Keep existing units
        }

        # Determine URL based on API key availability
        if api_key:
            url = "https://customer-api.open-meteo.com/v1/forecast"
            params["apikey"] = api_key
        else:
            # The new example URL uses the free API base
            url = "https://api.open-meteo.com/v1/forecast"

        # Make the request to Open-Meteo
        try:
            logger.info(f"Fetching detailed forecast (expanded) for {lat}, {lon} from {url}")
            response = requests.get(url, params=params, timeout=15) # Increased timeout slightly
            response.raise_for_status()
            logger.info(f"Successfully fetched detailed forecast (expanded) for {lat}, {lon}")
            return jsonify(response.json())

        except requests.exceptions.RequestException as e:
            logger.error(f"Error fetching detailed forecast (expanded) from Open-Meteo: {str(e)}")

            # Fall back to free API if we get an error with the customer API
            # Note: The new example URL already uses the free API base, so fallback might be less relevant
            # unless you were intending to primarily use the customer API.
            if api_key and "customer-api" in url:
                logger.info(f"Falling back to free API for detailed forecast (expanded) for {lat}, {lon}")
                try:
                    fallback_url = "https://api.open-meteo.com/v1/forecast"
                    fallback_params = params.copy()
                    fallback_params.pop("apikey", None)
                    response = requests.get(fallback_url, params=fallback_params, timeout=15) # Increased timeout
                    response.raise_for_status()
                    logger.info(f"Successfully fetched detailed forecast (expanded) using fallback API for {lat}, {lon}")
                    return jsonify(response.json())
                except requests.exceptions.RequestException as e2:
                    logger.error(f"Error with fallback API for detailed forecast (expanded): {str(e2)}")
                    return jsonify({"error": f"API service unavailable: {str(e2)}"}), 503

            # If not using customer API or fallback failed
            return jsonify({"error": f"Weather service error: {str(e)}"}), 503

    except Exception as e:
        logger.error(f"Error in detailed forecast (expanded) endpoint: {str(e)}")
        return jsonify({"error": f"Server error: {str(e)}"}), 500

# Add this function inside Airstorm-GFS/backend/src/api/external_api.py
# Ensure necessary imports are present at the top of the file:
# import os
# import requests
# from flask import Blueprint, request, jsonify
# from middleware.api_key_protection import protect_api_keys # Assuming this decorator exists
# import logging # Assuming logger is configured

# logger = logging.getLogger(__name__) # Assuming logger is set up

@external_api_bp.route("/api/forecast/daily_extended", methods=["GET"])
@protect_api_keys # Assuming you want to protect this like the other endpoint
def get_graphcast_extended_forecast():
    """Proxy endpoint for Open-Meteo forecast API with a specific set of daily parameters."""
    try:
        api_key = os.getenv('BACKEND_OPENMETEO_API_KEY')
        lat = request.args.get("latitude", type=float)
        lon = request.args.get("longitude", type=float)

        if lat is None or lon is None:
            logger.warning("Missing latitude or longitude for /api/forecast/daily_extended request.")
            return jsonify({"error": "Latitude and longitude are required"}), 400

        # Define the daily parameters based EXACTLY on the user's example URL
        daily_params = [
            "weather_code", "temperature_2m_max", "apparent_temperature_max",
            "apparent_temperature_min", "wind_speed_10m_max", "wind_gusts_10m_max",
            "wind_direction_10m_dominant", "uv_index_max", "uv_index_clear_sky_max",
            "precipitation_hours", "precipitation_probability_max", "precipitation_sum",
            "snowfall_sum", "showers_sum", "rain_sum", "sunshine_duration",
            "daylight_duration", "sunset", "sunrise", "temperature_2m_mean",
            "temperature_2m_min", "visibility_mean", "relative_humidity_2m_mean",
            "wind_speed_10m_mean", "cape_mean", "cape_max", "cape_min",
            "cloud_cover_mean", "cloud_cover_min", "cloud_cover_max",
            "dew_point_2m_mean", "precipitation_probability_mean", "updraft_max",
            "winddirection_10m_dominant", "wind_gusts_10m_mean", "wind_gusts_10m_min",
            "wind_speed_10m_min"
        ]

        # Set up parameters for Open-Meteo API
        params = {
            "latitude": lat,
            "longitude": lon,
            "daily": ",".join(daily_params), # Join the list into a comma-separated string
            "models": "best_match",         # As per user's example URL
            "timezone": "GMT",              # As per user's example URL
            "forecast_days": 16,            # As per user's example URL
            # Adding units for consistency with other backend endpoints (modify if needed)
            "temperature_unit": "fahrenheit",
            "precipitation_unit": "inch",
            "wind_speed_unit": "mph", # Added based on other endpoints, adjust if needed
            # Note: The example JSON had km/h, mm etc. because units weren't specified in the URL
            # Requesting specific units here will make the response use those units.
        }

        # Determine URL based on API key availability (prioritize customer API as per example URL)
        if api_key:
            url = "https://customer-api.open-meteo.com/v1/forecast"
            params["apikey"] = api_key
            logger.info(f"Using Customer API Key for daily_extended forecast.")
        else:
            url = "https://api.open-meteo.com/v1/forecast" # Fallback to free API
            logger.warning("No Customer API Key found, using free API for daily_extended forecast.")


        # Make the request to Open-Meteo
        try:
            logger.info(f"Fetching daily_extended forecast for {lat}, {lon} from {url}")
            response = requests.get(url, params=params, timeout=15)
            response.raise_for_status() # Raise HTTPError for bad responses (4xx or 5xx)
            logger.info(f"Successfully fetched daily_extended forecast for {lat}, {lon}")
            return jsonify(response.json())

        except requests.exceptions.RequestException as e:
            logger.error(f"Error fetching daily_extended forecast from {url}: {str(e)}")

            # Optional: Fallback logic if customer API failed (if you started with customer API)
            if api_key and "customer-api" in url:
                logger.info(f"Falling back to free API for daily_extended forecast for {lat}, {lon}")
                try:
                    fallback_url = "https://api.open-meteo.com/v1/forecast"
                    fallback_params = params.copy()
                    fallback_params.pop("apikey", None)
                    response = requests.get(fallback_url, params=fallback_params, timeout=15)
                    response.raise_for_status()
                    logger.info(f"Successfully fetched daily_extended forecast using fallback API for {lat}, {lon}")
                    return jsonify(response.json())
                except requests.exceptions.RequestException as e2:
                    logger.error(f"Error with fallback API for daily_extended forecast: {str(e2)}")
                    # Avoid returning specific error details from external service to client if possible
                    return jsonify({"error": "Weather service currently unavailable after fallback."}), 503

            # If not using customer API initially or fallback failed
            return jsonify({"error": "Weather service error."}), 503 # Generic error

    except Exception as e:
        # Log the full error internally, but return a generic error to the client
        logger.exception(f"Unexpected error in daily_extended forecast endpoint: {str(e)}") # Use logger.exception to include stack trace
        return jsonify({"error": "An unexpected server error occurred."}), 500
    
# ====== GitHub Issues API ======
github_service = GitHubService()


@external_api_bp.route('/api/feedback', methods=['POST'])
def submit_feedback():
    """
    Handle feedback submission and create GitHub issue

    Expected JSON payload:
    {
        "ticketName": "string",
        "name": "string",
        "email": "string",
        "description": "string",
        "tag": "string",
        "milestone": "number" (optional)
    }

    Returns:
        JSON response with success/error message and issue data if successful
    """
    try:
        data = request.json
        required_fields = ['ticketName', 'name', 'email', 'description', 'tag']

        # Validate required fields
        if not all(field in data for field in required_fields):
            missing_fields = [
                field for field in required_fields if field not in data]
            return jsonify({
                'error': 'Missing required fields',
                'missing_fields': missing_fields
            }), 400

        # Validate email format (basic validation)
        if '@' not in data['email']:
            return jsonify({
                'error': 'Invalid email format'
            }), 400

        # Parse milestone if provided
        milestone = None
        if 'milestone' in data and data['milestone']:
            try:
                milestone = int(data['milestone'])
            except ValueError:
                return jsonify({
                    'error': 'Invalid milestone format'
                }), 400

        # Sanitize and prepare labels
        labels = [data['tag'], 'user-feedback']
        labels = list(set(labels))  # Remove duplicates

        # Create GitHub issue
        issue = github_service.create_issue(
            title=data['ticketName'],
            body=data,
            labels=labels,
            milestone=milestone
        )

        if not issue:
            return jsonify({
                'error': 'Failed to create GitHub issue'
            }), 500

        logger.info(f"Successfully created GitHub issue: {issue['number']}")

        return jsonify({
            'message': 'Feedback submitted successfully',
            'issue': {
                'number': issue['number'],
                'url': issue['html_url'],
                'title': issue['title']
            }
        })

    except Exception as e:
        logger.error(f"Error submitting feedback: {str(e)}")
        return jsonify({
            'error': 'Internal server error while processing feedback'
        }), 500


@external_api_bp.route('/api/feedback/milestones', methods=['GET'])
def get_milestones():
    """
    Get available milestones from GitHub repository

    Returns:
        JSON response with list of milestones or error message
    """
    try:
        milestones = github_service.get_milestones()

        # Format milestone data for frontend
        formatted_milestones = [{
            'number': milestone['number'],
            'title': milestone['title'],
            'description': milestone['description'],
            'open_issues': milestone['open_issues'],
            'due_on': milestone['due_on']
        } for milestone in milestones]

        return jsonify({
            'milestones': formatted_milestones
        })

    except Exception as e:
        logger.error(f"Error fetching milestones: {str(e)}")
        return jsonify({
            'error': 'Failed to fetch milestones'
        }), 500


@external_api_bp.route('/api/feedback/labels', methods=['GET'])
def get_labels():
    """
    Get available labels for feedback

    Returns:
        JSON response with predefined list of available labels
    """
    try:
        # Predefined labels available for feedback
        labels = [
            {'value': 'bug', 'label': 'Bug', 'color': '0075ca'},
            {'value': 'question', 'label': 'Question', 'color': '0075ca'},
            {'value': 'feature', 'label': 'Feature', 'color': '0075ca'}
        ]

        return jsonify({
            'labels': labels
        })

    except Exception as e:
        logger.error(f"Error fetching labels: {str(e)}")
        return jsonify({
            'error': 'Failed to fetch labels'
        }), 500


@external_api_bp.errorhandler(404)
def handle_404(e):
    """Handle 404 errors"""
    return jsonify({
        'error': 'Feedback endpoint not found'
    }), 404


@external_api_bp.errorhandler(500)
def handle_500(e):
    """Handle 500 errors"""
    return jsonify({
        'error': 'Internal server error in feedback service'
    }), 500


# ====== Alerts API ======


# Cache implementation
class TimedCache:
    def __init__(self):
        self._cache = {}
        self._lock = Lock()

    def get(self, key):
        with self._lock:
            if key in self._cache:
                value, expiry = self._cache[key]
                if datetime.now() < expiry:
                    return value
                else:
                    del self._cache[key]
            return None

    def set(self, key, value, ttl_seconds=300):  # 300 seconds = 5 minutes
        with self._lock:
            expiry = datetime.now() + timedelta(seconds=ttl_seconds)
            self._cache[key] = (value, expiry)


# Initialize cache instances
state_code_cache = TimedCache()
weather_alerts_cache = TimedCache()


@lru_cache(maxsize=100)
def get_state_code(lat, lon):
    """Get state code with caching"""
    cache_key = f"{lat},{lon}"

    # Check cache first
    cached_result = state_code_cache.get(cache_key)
    if cached_result is not None:
        return cached_result

    try:
        api_key = os.getenv('BACKEND_GOOGLE_MAPS_API_KEY')
        if not api_key:
            logger.error("Google Maps API key not configured")
            return None, "Geocoding service not configured"

        params = {
            "latlng": f"{lat},{lon}",
            "key": api_key,
            "language": "en",
        }

        url = "https://maps.googleapis.com/maps/api/geocode/json"
        response = requests.get(url, params=params)
        data = response.json()

        if data.get("status") != "OK" or not data.get("results"):
            logger.error(
                f"Geocoding API error: {data.get('status')} - {data.get('error_message', 'No results found')}")
            return None, "Location not found"

        # First check if location is in the US
        is_us = False
        for result in data["results"]:
            for component in result.get("address_components", []):
                if "country" in component["types"] and component["short_name"] == "US":
                    is_us = True
                    break
            if is_us:
                break

        if not is_us:
            result = (None, "Non-US location")
            state_code_cache.set(cache_key, result)
            return result

        # If it is US, find state or territory code
        for result in data["results"]:
            for component in result.get("address_components", []):
                if any(level in component["types"] for level in ["administrative_area_level_1", "country"]):
                    result = (component["short_name"], None)
                    state_code_cache.set(cache_key, result)
                    return result

        result = (None, "State not found in geocoding response")
        state_code_cache.set(cache_key, result)
        return result

    except requests.RequestException as e:
        logger.error(f"Error in geocoding request: {str(e)}")
        return None, f"Geocoding service error: {str(e)}"
    except Exception as e:
        logger.error(f"Unexpected error in geocoding: {str(e)}")
        return None, f"Unexpected geocoding error: {str(e)}"


def get_weather_gov_alerts(state_code):
    """Get alerts with caching"""
    # Check cache first
    cached_alerts = weather_alerts_cache.get(state_code)
    if cached_alerts is not None:
        return cached_alerts

    try:
        headers = {
            'Accept': 'application/geo+json',
            'User-Agent': 'AirStorm Weather App - Development Testing'
        }

        url = f"https://api.weather.gov/alerts/active?area={state_code}"
        response = requests.get(url, headers=headers)
        response.raise_for_status()

        data = response.json()
        result = (data.get('features', []), None)

        # Cache the result
        weather_alerts_cache.set(state_code, result)
        return result

    except requests.RequestException as e:
        logger.error(f"Error fetching weather.gov alerts: {str(e)}")
        return None, f"Weather.gov service error: {str(e)}"
    except Exception as e:
        logger.error(f"Unexpected error fetching alerts: {str(e)}")
        return None, f"Unexpected error: {str(e)}"


@external_api_bp.route("/api/external/alerts", methods=["GET"])
def get_alerts():
    """Optimized alert fetching with caching"""
    try:
        user_id = request.args.get("userId")
        if not user_id:
            logger.error("User ID is required")
            return jsonify({"error": "User ID is required"}), 400

        # Get user's saved locations
        locations = database_service.get_user_locations(user_id)
        if not locations:
            return jsonify({"alerts": [], "message": "No saved locations found"}), 200

        all_alerts = []
        location_states = {}
        state_alerts = {}

        # Process locations in batches to avoid overwhelming the APIs
        batch_size = 3
        location_batches = [locations[i:i + batch_size]
                            for i in range(0, len(locations), batch_size)]

        for batch in location_batches:
            # Process each batch of locations
            for location in batch:
                lat = location['latitude']
                lon = location['longitude']
                loc_key = f"{lat},{lon}"

                if loc_key not in location_states:
                    state_code, error = get_state_code(lat, lon)
                    if error:
                        if error == "Non-US location":
                            logger.info(
                                f"Skipping non-US location {location['name']}")
                        else:
                            logger.warning(
                                f"Could not determine state for location {location['name']}: {error}")
                        continue

                    location_states[loc_key] = state_code
                    logger.info(
                        f"Found state {state_code} for location {location['name']}")

            # Get alerts for the states in this batch
            for state_code in set(location_states.values()):
                if state_code and state_code not in state_alerts:
                    alerts, error = get_weather_gov_alerts(state_code)
                    if error:
                        logger.error(
                            f"Error fetching alerts for state {state_code}: {error}")
                        continue

                    state_alerts[state_code] = alerts
                    logger.info(
                        f"Found {len(alerts)} alerts for state {state_code}")

        # Process alerts for each location
        for location in locations:
            lat = location['latitude']
            lon = location['longitude']
            loc_key = f"{lat},{lon}"

            state_code = location_states.get(loc_key)
            if not state_code:
                continue

            alerts_for_state = state_alerts.get(state_code, [])

            for alert in alerts_for_state:
                try:
                    properties = alert.get('properties', {})

                    formatted_alert = {
                        'event': properties.get('event'),
                        'severity': properties.get('severity'),
                        'certainty': properties.get('certainty'),
                        'onset': properties.get('onset'),
                        'expires': properties.get('ends') or properties.get('expires'),
                        'sender': properties.get('senderName'),
                        'description': properties.get('description'),
                        'instruction': properties.get('instruction'),
                        'location_name': location['name'],
                        'latitude': location['latitude'],
                        'longitude': location['longitude'],
                        'state': state_code,
                        'headline': properties.get('headline'),
                        'url': properties.get('url')
                    }

                    all_alerts.append(formatted_alert)

                except Exception as e:
                    logger.error(f"Error processing alert: {str(e)}")
                    continue

        logger.info(
            f"Returning {len(all_alerts)} total alerts across all locations")
        return jsonify({
            "alerts": all_alerts,
            "total": len(all_alerts)
        })

    except Exception as e:
        logger.error(f"Unexpected error in alerts endpoint: {str(e)}")
        return jsonify({"error": "Internal server error"}), 500


@external_api_bp.route("/api/graphcast-forecast", methods=["GET"])
@protect_api_keys
def get_graphcast_forecast():
    try:
        lat = request.args.get("latitude", type=float)
        lon = request.args.get("longitude", type=float)
        start_date = request.args.get("start_date")
        end_date = request.args.get("end_date")
        hourly_params = request.args.getlist("hourly[]")
        models = request.args.getlist("models[]")

        if not all([lat, lon, start_date, end_date, hourly_params]):
            return jsonify({"error": "Missing required parameters"}), 400

        api_key = os.getenv('BACKEND_OPENMETEO_API_KEY')
        if not api_key:
            logger.error("Open-Meteo API key not configured")
            return jsonify({"error": "Service configuration error"}), 500

        url = f"https://customer-previous-runs-api.open-meteo.com/v1/forecast"
        params = {
            "latitude": lat,
            "longitude": lon,
            "start_date": start_date,
            "end_date": end_date,
            "hourly": hourly_params,
            "models": models or ["graphcast025"],
            "temperature_unit": "fahrenheit",
            "wind_speed_unit": "mph",
            "precipitation_unit": "inch",
            "timezone": "auto",
            "apikey": api_key
        }

        responses = openmeteo.weather_api(url, params=params)

        if not responses or len(responses) == 0:
            return jsonify({"error": "No data received from weather service"}), 500

        response = responses[0]

        # Process the response and return formatted data
        hourly_data = response.Hourly()
        result = {
            "hourly": {
                "time": [datetime.fromtimestamp(t).strftime('%Y-%m-%dT%H:%M') for t in hourly_data.Time()]
            }
        }

        # Add each requested variable to the result
        for i, variable in enumerate(hourly_params):
            result["hourly"][variable] = hourly_data.Variables(
                i).ValuesAsNumpy().tolist()

        return jsonify(result)

    except Exception as e:
        logger.error(f"Error fetching GraphCast forecast data: {str(e)}")
        return jsonify({"error": f"Failed to fetch GraphCast forecast data: {str(e)}"}), 500


@external_api_bp.route("/api/traditional-forecast", methods=["GET"])
@protect_api_keys
def get_traditional_forecast():
    try:
        lat = request.args.get("latitude", type=float)
        lon = request.args.get("longitude", type=float)
        start_date = request.args.get("start_date")
        end_date = request.args.get("end_date")
        hourly_params = request.args.getlist("hourly[]")
        models = request.args.getlist("models[]")

        if not all([lat, lon, start_date, end_date, hourly_params]):
            return jsonify({"error": "Missing required parameters"}), 400

        api_key = os.getenv('BACKEND_OPENMETEO_API_KEY')
        if not api_key:
            logger.error("Open-Meteo API key not configured")
            return jsonify({"error": "Service configuration error"}), 500

        url = f"https://customer-previous-runs-api.open-meteo.com/v1/forecast"
        params = {
            "latitude": lat,
            "longitude": lon,
            "start_date": start_date,
            "end_date": end_date,
            "hourly": hourly_params,
            "models": models or ["gfs_hrrr"],
            "temperature_unit": "fahrenheit",
            "wind_speed_unit": "mph",
            "precipitation_unit": "inch",
            "timezone": "auto",
            "apikey": api_key
        }

        responses = openmeteo.weather_api(url, params=params)

        if not responses or len(responses) == 0:
            return jsonify({"error": "No data received from weather service"}), 500

        response = responses[0]

        # Process the response and return formatted data
        hourly_data = response.Hourly()
        result = {
            "hourly": {
                "time": [datetime.fromtimestamp(t).strftime('%Y-%m-%dT%H:%M') for t in hourly_data.Time()]
            }
        }

        # Add each requested variable to the result
        for i, variable in enumerate(hourly_params):
            result["hourly"][variable] = hourly_data.Variables(
                i).ValuesAsNumpy().tolist()

        return jsonify(result)

    except Exception as e:
        logger.error(f"Error fetching traditional forecast data: {str(e)}")
        return jsonify({"error": f"Failed to fetch traditional forecast data: {str(e)}"}), 500

# Updated functions for consistent comma-separated parameter handling


@external_api_bp.route("/api/historical-weather", methods=["GET"])
@protect_api_keys
def get_historical_weather():
    """
    Get historical weather data from Open-Meteo Archive API

    Supports both array and comma-separated formats for parameters.
    Returns raw data in the original format from Open-Meteo.
    """
    try:
        # Start with detailed logging
        logger.info("Historical weather API request received")

        # Get basic parameters
        latitude = request.args.get("latitude", type=float)
        longitude = request.args.get("longitude", type=float)
        start_date = request.args.get("start_date")
        end_date = request.args.get("end_date")

        # Handle hourly parameters (support both formats)
        hourly_params = request.args.get("hourly")
        if not hourly_params:
            # Try to get from array format
            hourly_array = request.args.getlist("hourly[]")
            if hourly_array:
                hourly_params = ",".join(hourly_array)
                logger.info(
                    f"Converted hourly array to string: {hourly_params}")
            else:
                # Default values
                hourly_params = "temperature_2m,relative_humidity_2m,precipitation,wind_speed_10m"
                logger.info(
                    f"Using default hourly parameters: {hourly_params}")

        # Get other optional parameters
        timezone = request.args.get("timezone", "auto")
        temp_unit = request.args.get("temperature_unit", "celsius")
        wind_unit = request.args.get("wind_speed_unit", "kmh")
        precip_unit = request.args.get("precipitation_unit", "mm")

        # Validate required parameters
        if not all([latitude, longitude]):
            logger.error("Missing required parameters: latitude and longitude")
            return jsonify({"error": "Latitude and longitude are required"}), 400

        # Calculate default dates if not provided
        if not start_date or not end_date:
            current_date = datetime.now().date()
            end_date = end_date or (
                current_date - timedelta(days=5)).strftime('%Y-%m-%d')
            start_date = start_date or (
                current_date - timedelta(days=21)).strftime('%Y-%m-%d')
            logger.info(
                f"Using calculated date range: {start_date} to {end_date}")

        # Log all parameters
        logger.info(f"Request parameters: lat={latitude}, lon={longitude}, " +
                    f"dates={start_date} to {end_date}, hourly={hourly_params}")

        # Prepare API request parameters
        api_params = {
            "latitude": latitude,
            "longitude": longitude,
            "start_date": start_date,
            "end_date": end_date,
            "hourly": hourly_params,
            "timezone": timezone,
            "temperature_unit": temp_unit,
            "wind_speed_unit": wind_unit,
            "precipitation_unit": precip_unit
        }

        # Get API key and set URL
        api_key = os.getenv('BACKEND_OPENMETEO_API_KEY')
        if api_key:
            url = "https://customer-archive-api.open-meteo.com/v1/archive"
            api_params["apikey"] = api_key
            logger.info("Using paid Open-Meteo API")
        else:
            url = "https://archive-api.open-meteo.com/v1/archive"
            logger.info("Using free Open-Meteo API")

        # Make direct HTTP request
        logger.info(f"Making request to {url}")
        response = requests.get(url, params=api_params, timeout=30)

        # Handle HTTP errors
        if response.status_code != 200:
            logger.error(
                f"Open-Meteo API returned status code {response.status_code}")
            logger.error(f"Response: {response.text}")
            return jsonify({
                "error": f"Open-Meteo API error: {response.status_code}",
                "message": response.text
            }), response.status_code

        # Get response JSON
        data = response.json()
        logger.info("Successfully received data from Open-Meteo")

        # Validate response structure
        if "hourly" not in data:
            logger.warning("Response missing 'hourly' data")
            logger.warning(f"Response content: {data}")
            return jsonify({
                "error": "Invalid response from Open-Meteo: missing hourly data",
                "data": data
            }), 500

        # Log the length of time data for debugging
        if "time" in data["hourly"]:
            logger.info(
                f"Received {len(data['hourly']['time'])} hourly time points")

        # Log the available parameters
        logger.info(f"Received parameters: {list(data['hourly'].keys())}")

        # Return the raw data from Open-Meteo
        return jsonify(data)

    except requests.RequestException as e:
        logger.error(f"Request error to Open-Meteo: {str(e)}")
        return jsonify({"error": f"Failed to connect to weather service: {str(e)}"}), 500
    except ValueError as e:
        logger.error(f"Value error in weather request: {str(e)}")
        return jsonify({"error": f"Invalid parameter value: {str(e)}"}), 400
    except Exception as e:
        logger.error(f"Unexpected error in historical weather: {str(e)}")
        return jsonify({"error": f"Server error: {str(e)}"}), 500


@external_api_bp.route("/api/historical-forecasts", methods=["GET"])
@protect_api_keys
def get_historical_forecasts():
    """
    Get historical forecast data from Open-Meteo Historical Forecast API

    Supports both array and comma-separated formats for parameters.
    Returns raw data in the original format from Open-Meteo.

    Based on the successful historical-weather endpoint pattern.
    """
    try:
        # Start with detailed logging
        logger.info("Historical forecasts API request received")

        # Get basic parameters
        latitude = request.args.get("latitude", type=float)
        longitude = request.args.get("longitude", type=float)
        start_date = request.args.get("start_date")
        end_date = request.args.get("end_date")

        # Handle hourly parameters (support both formats)
        hourly_params = request.args.get("hourly")
        if not hourly_params:
            # Try to get from array format
            hourly_array = request.args.getlist("hourly[]")
            if hourly_array:
                hourly_params = ",".join(hourly_array)
                logger.info(
                    f"Converted hourly array to string: {hourly_params}")
            else:
                # Default values
                hourly_params = "temperature_2m,relative_humidity_2m,precipitation,wind_speed_10m"
                logger.info(
                    f"Using default hourly parameters: {hourly_params}")

        # Handle models parameter (support both formats)
        models_params = request.args.get("models")
        if not models_params:
            # Try to get from array format
            models_array = request.args.getlist("models[]")
            if models_array:
                models_params = ",".join(models_array)
                logger.info(
                    f"Converted models array to string: {models_params}")
            else:
                # Default values
                models_params = "gfs_hrrr,gfs_graphcast025"
                logger.info(
                    f"Using default models parameters: {models_params}")

        # Get other optional parameters
        timezone = request.args.get("timezone", "auto")
        temp_unit = request.args.get("temperature_unit", "celsius")
        wind_unit = request.args.get("wind_speed_unit", "kmh")
        precip_unit = request.args.get("precipitation_unit", "mm")

        # Validate required parameters
        if not all([latitude, longitude]):
            logger.error("Missing required parameters: latitude and longitude")
            return jsonify({"error": "Latitude and longitude are required"}), 400

        # Calculate default dates if not provided
        if not start_date or not end_date:
            current_date = datetime.now().date()
            end_date = end_date or current_date.strftime('%Y-%m-%d')
            start_date = start_date or (
                current_date - timedelta(days=14)).strftime('%Y-%m-%d')
            logger.info(
                f"Using calculated date range: {start_date} to {end_date}")

        # Log all parameters
        logger.info(f"Request parameters: lat={latitude}, lon={longitude}, " +
                    f"dates={start_date} to {end_date}, hourly={hourly_params}, models={models_params}")

        # Prepare API request parameters
        api_params = {
            "latitude": latitude,
            "longitude": longitude,
            "start_date": start_date,
            "end_date": end_date,
            "hourly": hourly_params,
            "models": models_params,
            "timezone": timezone,
            "temperature_unit": temp_unit,
            "wind_speed_unit": wind_unit,
            "precipitation_unit": precip_unit
        }

        # Get API key and set URL - for historical forecasts, API key is required
        api_key = os.getenv('BACKEND_OPENMETEO_API_KEY')
        if not api_key:
            logger.error(
                "Open-Meteo API key not configured - required for historical forecasts")
            return jsonify({"error": "API configuration error - API key required"}), 500

        url = "https://customer-historical-forecast-api.open-meteo.com/v1/forecast"
        api_params["apikey"] = api_key
        logger.info("Using historical forecast API")

        # Make direct HTTP request
        logger.info(f"Making request to {url}")
        response = requests.get(url, params=api_params, timeout=30)

        # Handle HTTP errors
        if response.status_code != 200:
            logger.error(
                f"Open-Meteo API returned status code {response.status_code}")
            logger.error(f"Response: {response.text}")
            return jsonify({
                "error": f"Open-Meteo API error: {response.status_code}",
                "message": response.text
            }), response.status_code

        # Get response JSON
        data = response.json()
        logger.info("Successfully received data from Open-Meteo")

        # Validate response structure
        if "hourly" not in data:
            logger.warning("Response missing 'hourly' data")
            logger.warning(f"Response content: {data}")
            return jsonify({
                "error": "Invalid response from Open-Meteo: missing hourly data",
                "data": data
            }), 500

        # Log the length of time data for debugging
        if "time" in data["hourly"]:
            logger.info(
                f"Received {len(data['hourly']['time'])} hourly time points")

        # Log the available parameters
        logger.info(f"Received parameters: {list(data['hourly'].keys())}")

        # Return the raw data from Open-Meteo
        return jsonify(data)

    except requests.RequestException as e:
        logger.error(f"Request error to Open-Meteo: {str(e)}")
        return jsonify({"error": f"Failed to connect to weather service: {str(e)}"}), 500
    except ValueError as e:
        logger.error(f"Value error in weather request: {str(e)}")
        return jsonify({"error": f"Invalid parameter value: {str(e)}"}), 400
    except Exception as e:
        logger.error(f"Unexpected error in historical forecasts: {str(e)}")
        return jsonify({"error": f"Server error: {str(e)}"}), 500
