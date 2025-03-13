from flask import Blueprint, request, jsonify
import requests
import logging
from db.database_manager import DatabaseManager
# from db.mysql_connection import get_mysql_connection  # if needed

charts_api_bp = Blueprint('charts_bp', __name__)
database_manager = DatabaseManager()

# This is a POST request because we are POSTING info to the EC2 chartserver API 
@charts_api_bp.route("/api/charts/generate", methods=["POST"])
def generate_charts():
    """
    1) Parse lat/lon/days/user_id from request
    2) Call your external chart-server
    3) Save the chart run in MySQL
    4) Return the chart-server JSON
    """
    try:
        data = request.json
        lat = data["lat"]
        lon = data["lon"]
        forecast_days = data["days"]
        user_id = data["user_id"]

        # Build chart-server URL for EC2 instance
        chart_server_url = (
            f"http://ec2-3-221-177-106.compute-1.amazonaws.com:5000/generate-skew"
            f"?days={forecast_days}&lat={lat}&lon={lon}&user_id={user_id}"
        )

        response = requests.get(chart_server_url, timeout=30)
        response.raise_for_status()

        result = response.json()
        """
        result example:
        {
          "chart_folder": "chart_2025-03-13_02-16-17",
          "days_requested": 1,
          "latitude": 52.537,
          "longitude": 13.376,
          "s3_files": [ ... array of SVG URLs ... ],
          "user_id": "user_2sirXuIdmQh7eiB3GwHxZlcQYbI"
        }
        """

        # Now store in MySQL. We can pass user_id, lat, lon, forecast_days, chart_folder, s3_files
        # 'days_requested' matches forecast_days, 'chart_folder' is from result, 's3_files' from result
        # If the result key is named differently, adjust accordingly.
        chart_folder = result.get("chart_folder")
        s3_files = result.get("s3_files", [])

        success = database_manager.save_chart_run(
            user_id=user_id,
            lat=lat,
            lon=lon,
            forecast_days=forecast_days,
            chart_folder=chart_folder,
            s3_files=s3_files
        )
        if not success:
            logging.error("Failed to save chart run in DB")

        return jsonify(result), 200

    except Exception as e:
        logging.error(f"Error generating chart: {e}")
        return jsonify({"error": str(e)}), 500


@charts_api_bp.route("/api/get-charts", methods=["GET"])
def get_user_charts():
    """
    GET /api/charts?user_id=xyz
    Returns all stored chart runs for this user from MySQL
    """
    user_id = request.args.get("user_id")
    if not user_id:
        return jsonify({"error": "Missing user_id"}), 400

    chart_runs = database_manager.get_chart_runs_for_user(user_id)
    return jsonify(chart_runs), 200
