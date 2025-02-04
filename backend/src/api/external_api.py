from flask import Blueprint, jsonify, request, Response
import requests
import os
import logging
from email.utils import parsedate_to_datetime
from datetime import datetime
from services.weather_analyzer import WeatherAnalyzer
from services.github_service import GitHubService
import openmeteo_requests
import requests_cache
from retry_requests import retry


external_api_bp = Blueprint("external_api", __name__)

logger = logging.getLogger(__name__)

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
                "relative_humidity_2m",
                "wind_speed_10m",
                "weather_code",
            ],
            "hourly": ["temperature_2m"],
            "temperature_unit": "fahrenheit",
            "wind_speed_unit": "mph",
            "timezone": "GMT",
        }

        responses = openmeteo.weather_api(url, params=params)
        response = responses[0]
        current = response.Current()

        weather_code = current.Variables(3).Value()
        condition = weather_analyzer.get_weather_condition(weather_code)

        weather_data = {
            "current_temperature": current.Variables(0).Value(),
            "humidity": current.Variables(1).Value(),
            "wind_speed": current.Variables(2).Value(),
            "condition": condition,
            "air_quality": weather_analyzer.calculate_air_quality(current),
            "latitude": response.Latitude(),
            "longitude": response.Longitude(),
        }

        return jsonify(weather_data)

    except Exception as e:
        logger.error(f"Error fetching weather data: {str(e)}")
        return jsonify({"error": str(e)}), 500


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
