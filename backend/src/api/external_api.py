from flask import Blueprint, jsonify, request, Response
import requests
import os
import logging
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

external_api_bp = Blueprint("external_api", __name__)

logger = logging.getLogger(__name__)
database_service = DatabaseManager()

# Initialize services
weather_analyzer = WeatherAnalyzer()
BACKEND_GOOGLE_MAPS_API_KEY = os.getenv("BACKEND_GOOGLE_MAPS_API_KEY")

# Setup Open-Meteo API client
cache_session = requests_cache.CachedSession(".cache", expire_after=3600)
retry_session = retry(cache_session, retries=5, backoff_factor=0.2)
openmeteo = openmeteo_requests.Client(session=retry_session)


# ====== Meteosource Tile API ======
@external_api_bp.route('/api/meteosource/tile')
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
        logger.error(f"Unexpected tile error: {e}")
        return jsonify({"error": "Unexpected error occurred"}), 500


# ====== Google Maps Geocoding API ======
@external_api_bp.route("/api/geocode", methods=["GET"])
def get_location_info():
    try:
        lat = request.args.get("lat", type=float)
        lon = request.args.get("lon", type=float)

        logger.info(f"Geocoding request for lat={lat}, lon={lon}")

        if lat is None or lon is None:
            return jsonify({"error": "Latitude and Longitude are required"}), 400

        if not BACKEND_GOOGLE_MAPS_API_KEY:
            logger.error("Google Maps API key not configured")
            return jsonify({"error": "Geocoding service not configured", "details": "Missing API key"}), 503

        url = "https://maps.googleapis.com/maps/api/geocode/json"
        params = {
            "latlng": f"{lat},{lon}",
            "key": BACKEND_GOOGLE_MAPS_API_KEY,
            "language": "en",
        }

        response = requests.get(url, params=params)
        data = response.json()

        status = data.get("status")
        error_message = data.get("error_message", "No results found")
        logger.error(f"Geocoding API error: {status} - {error_message}")

        if status != "OK" or not data.get("results"):
            return jsonify({"error": "Geocoding failed", "details": error_message}), 503

        location_info = {
            "formatted_address": "",
            "components": {
                "city": "",
                "state": "",
                "state_code": "",
                "county": "",
                "country": "",
                "country_code": "",
            },
        }

        result = next((r for r in data["results"]
                      if r.get("address_components")), None)

        if result:
            location_info["formatted_address"] = result["formatted_address"]

            for component in result["address_components"]:
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

        logger.debug(f"Processed location info: {location_info}")
        return jsonify(location_info)

    except requests.exceptions.RequestException as e:
        logger.error(f"Request error in geocoding: {str(e)}")
        return jsonify({"error": "Geocoding service unavailable", "details": str(e)}), 503
    except Exception as e:
        logger.error(f"Unexpected error in geocoding: {str(e)}")
        return jsonify({"error": "Internal server error", "details": str(e)}), 500


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
def get_weather():
    lat = request.args.get("lat", type=float)
    lon = request.args.get("lon", type=float)

    if lat is None or lon is None:
        return jsonify({"error": "Latitude and Longitude are required"}), 400

    try:
        url = "https://api.open-meteo.com/v1/forecast"
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

        weather_code = current.Variables(3).Value()
        condition = weather_analyzer.get_weather_condition(weather_code)

        weather_data = {
            "current_temperature": current.Variables(0).Value(),
            "rain": current.Variables(1).Value(),
            "wind_speed": current.Variables(2).Value(),
            "wind_direction": calculate_wind_direction(current.Variables(3).Value()),
            "condition": condition,
            "latitude": response.Latitude(),
            "longitude": response.Longitude(),
        }

        return jsonify(weather_data)

    except Exception as e:
        logger.error(f"Error fetching weather data: {str(e)}")
        return jsonify({"error": str(e)}), 500


def calculate_wind_direction(current):
    degree_speed = current
    directions = ["N", "NNE", "NE", "ENE", "E", "ESE", "SE",
                  "SSE", "S", "SSW", "SW", "WSW", "W", "WNW", "NW", "NNW"]
    ix = int((degree_speed + 11.25) / 22.5)
    return directions[ix % 16]


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
