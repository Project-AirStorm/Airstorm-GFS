from flask import Blueprint, jsonify, request
from db.database_manager import DatabaseManager
import logging
import os
from datetime import datetime
from utils.log_sanitizer import sanitize_log_message

internal_api_bp = Blueprint("internal_api", __name__)
database_service = DatabaseManager()

@internal_api_bp.route("/api/save-user", methods=["POST"])
def user_session():
    """
    Receives user data from Clerk (React frontend) and saves it in the MySQL Users table.
    """
    data = request.json
    required_fields = ("userId", "username", "firstName", "lastName", "email")

    # Quick validation
    if not all(field in data for field in required_fields):
        return jsonify({"error": "Missing required user fields"}), 400

    clerk_user_id = data["userId"]  # This is the Clerk user ID string
    username = data["username"]
    first_name = data["firstName"]
    last_name = data["lastName"]
    email = data["email"]

    # Save user data in the MySQL database
    success = database_service.save_user(
        clerk_user_id, username, first_name, last_name, email
    )

    if not success:
        return jsonify({"error": "Failed to save user data"}), 500

    return jsonify({"message": "User data saved successfully"}), 200

@internal_api_bp.route("/api/locations", methods=["GET"])
def get_locations():
    """
    Get locations for a specific user
    """
    user_id = request.args.get("userId")
    if not user_id:
        return jsonify({"error": "User ID is required"}), 400
    locations = database_service.get_user_locations(user_id)
    return jsonify(locations)

@internal_api_bp.route("/api/locations", methods=["POST"])
def save_location():
    try:
        data = request.json
        print("Received data in backend:", data)  # Debug log

        required_fields = ["userId", "name", "latitude", "longitude"]
        missing_fields = [
            field for field in required_fields if field not in data]

        if missing_fields:
            print(f"Missing fields: {missing_fields}")  # Debug log
            return jsonify({
                "error": f"Missing required fields: {', '.join(missing_fields)}",
                "received_data": data
            }), 400

        success = database_service.save_location(
            data["userId"],
            data["name"],
            data["latitude"],
            data["longitude"],
            data.get("isFavorite", False),
        )

        if success:
            return jsonify({"success": True})
        return jsonify({"error": "Failed to save location"}), 500

    except Exception as e:
        print(f"Error saving location: {str(e)}")
        return jsonify({"error": str(e)}), 500

@internal_api_bp.route("/api/locations", methods=["DELETE"])
def delete_location():
    """
    Delete a location for a user
    """
    data = request.json
    if not all(k in data for k in ("userId", "latitude", "longitude")):
        return jsonify({"error": "Missing required fields"}), 400

    success = database_service.delete_location(
        data["userId"], data["latitude"], data["longitude"]
    )
    return jsonify({"success": success})

@internal_api_bp.route("/api/locations/favorite", methods=["POST"])
def toggle_favorite():
    """
    Toggle favorite status for a location
    """
    data = request.json
    if not all(k in data for k in ("userId", "latitude", "longitude")):
        return jsonify({"error": "Missing required fields"}), 400

    success = database_service.toggle_favorite(
        data["userId"], data["latitude"], data["longitude"]
    )

    return jsonify({"success": success})

@internal_api_bp.route("/api/logs", methods=["GET"])


@internal_api_bp.route("/api/logs", methods=["GET"])
def get_logs():
    """
    Get application logs with support for different log sources
    """
    try:
        # Log request for debugging
        logging.info("Log request received")
        
        # Initialize logs list
        logs = []
        
        # First try to get logs from the log file
        log_file_path = os.path.join(os.getcwd(), 'logs', 'app.log')
        if os.path.exists(log_file_path):
            with open(log_file_path, 'r') as file:
                file_logs = file.readlines()[-1000:]  # Get last 1000 lines
                # Double-sanitize each log line as a safety measure
                logs.extend([sanitize_log_message(line) for line in file_logs])
        
        # If no file logs, add some basic info
        if not logs:
            logs = [
                f"{datetime.now().isoformat()} | INFO | Application running",
                f"{datetime.now().isoformat()} | INFO | No historical logs available",
            ]
        
        # Add current runtime info
        logs.append(f"{datetime.now().isoformat()} | INFO | Log request successful")
        
        # Clean up logs
        logs = [line.strip() for line in logs if line.strip()]
        
        return jsonify(logs)

    except Exception as e:
        error_message = sanitize_log_message(str(e))
        logging.error(f"Error in get_logs: {error_message}")
        
        # Return detailed error response with sanitized information
        return jsonify({
            "error": "Failed to fetch logs",
            "message": error_message,
            "timestamp": datetime.now().isoformat(),
            "debug_info": {
                "current_dir": os.getcwd(),
                "log_path": log_file_path if 'log_file_path' in locals() else "Not set",
                "exception_type": type(e).__name__
            }
        }), 500
    """
    Get application logs with support for different log sources
    """
    try:
        # Log request for debugging
        logging.info("Log request received")
        
        # Initialize logs list
        logs = []
        
        # First try to get logs from the log file
        log_file_path = os.path.join(os.getcwd(), 'logs', 'app.log')
        if os.path.exists(log_file_path):
            with open(log_file_path, 'r') as file:
                file_logs = file.readlines()[-1000:]  # Get last 1000 lines
                logs.extend(file_logs)
        
        # If no file logs, add some basic info
        if not logs:
            logs = [
                f"{datetime.now().isoformat()} | INFO | Application running",
                f"{datetime.now().isoformat()} | INFO | No historical logs available",
            ]
        
        # Add current runtime info
        logs.append(f"{datetime.now().isoformat()} | INFO | Log request successful")
        
        # Clean up logs
        logs = [line.strip() for line in logs if line.strip()]
        
        return jsonify(logs)

    except Exception as e:
        error_message = str(e)
        logging.error(f"Error in get_logs: {error_message}")
        
        # Return detailed error response
        return jsonify({
            "error": "Failed to fetch logs",
            "message": error_message,
            "timestamp": datetime.now().isoformat(),
            "debug_info": {
                "current_dir": os.getcwd(),
                "log_path": log_file_path if 'log_file_path' in locals() else "Not set",
                "exception_type": type(e).__name__
            }
        }), 500
    
    # Retrieves all of the user charts
    @internal_api_bp.route('/api/charts/save', methods=['POST'])
    def save_chart_run():
        data = request.json
        user_id = data["user_id"]
        lat = data["lat"]
        lon = data["lon"]
        forecast_days = data["forecast_days"]
        chart_folder = data["chart_folder"]
        s3_files = data["s3_files"]

        success = chart_run_manager.save_chart_run(
            user_id, lat, lon, forecast_days, chart_folder, s3_files
        )
        if not success:
            return jsonify({"error": "Failed to save chart run"}), 500
        return jsonify({"message": "Chart run saved"}), 200

    @internal_api_bp.route('/api/charts', methods=['GET'])
    def get_charts_for_user():
        user_id = request.args.get("user_id")
        if not user_id:
            return jsonify({"error": "user_id required"}), 400

        chart_runs = chart_run_manager.get_chart_runs_for_user(user_id)
        return jsonify(chart_runs)
