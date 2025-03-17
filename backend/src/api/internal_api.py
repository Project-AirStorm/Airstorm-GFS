from flask import Blueprint, jsonify, request, send_file, current_app as app
from db.database_manager import DatabaseManager
import logging
import os
import io
import base64
import zipfile
from datetime import datetime
from utils.log_sanitizer import sanitize_log_message

internal_api_bp = Blueprint("internal_api", __name__)
database_service = DatabaseManager()
# Use database_service for chart functionality
chart_run_manager = database_service


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


@internal_api_bp.route("/api/kml-files", methods=["GET"])
def get_kml_files():
    """
    Get KML files for a specific user
    """
    user_id = request.args.get("userId")
    if not user_id:
        return jsonify({"error": "User ID is required"}), 400

    kml_files = database_service.get_user_kml_files(user_id)
    return jsonify(kml_files)


@internal_api_bp.route("/api/kml-files/<int:file_id>", methods=["GET"])
def get_kml_file(file_id):
    """
    Get a specific KML file by its ID
    """
    user_id = request.args.get("userId")
    # Default to kml, can be 'kml' or 'raw'
    format_type = request.args.get("format", "kml")

    kml_file = database_service.get_kml_file_by_id(file_id, user_id)
    if not kml_file:
        return jsonify({"error": "KML file not found"}), 404

    # Return the file data
    file_data = kml_file["fileData"]

    # For direct download or for Google Maps KML Layer
    if format_type == 'kml':
        # Create a direct response with proper mimetype
        response = app.response_class(
            response=file_data,
            status=200,
            mimetype="application/vnd.google-earth.kml+xml"
        )

        # Add required headers for Google Maps KML layer
        response.headers['Access-Control-Allow-Origin'] = '*'
        response.headers['Access-Control-Allow-Methods'] = 'GET, OPTIONS'
        response.headers['Access-Control-Allow-Headers'] = 'Content-Type'
        response.headers['Content-Disposition'] = 'inline'
        response.headers['Cache-Control'] = 'no-cache, no-store, must-revalidate'
        response.headers['Pragma'] = 'no-cache'
        response.headers['Expires'] = '0'

        return response
    # For raw data to be parsed client-side
    else:
        # For direct frontend consumption
        return jsonify({
            "id": kml_file["id"],
            "fileName": kml_file["fileName"],
            "kmlContent": file_data.decode('utf-8')  # Convert bytes to string
        })


@internal_api_bp.route("/api/kml-files", methods=["POST"])
def upload_kml_file():
    """
    Upload a new KML or KMZ file
    """
    try:
        if 'file' not in request.files:
            return jsonify({"error": "No file part"}), 400

        file = request.files['file']
        user_id = request.form.get('userId')
        description = request.form.get('description', '')

        if not file.filename or not user_id:
            return jsonify({"error": "Missing file or user ID"}), 400

        # Get file extension
        file_ext = file.filename.lower().split('.')[-1]

        # Check if it's a valid KML or KMZ file
        if file_ext not in ['kml', 'kmz']:
            return jsonify({"error": "File must be a KML or KMZ file"}), 400

        file_data = file.read()
        file_name = file.filename

        # If it's a KMZ (ZIP) file, extract the KML data
        if file_ext == 'kmz':
            try:
                # Open the KMZ as a zip file
                kmz_file = zipfile.ZipFile(io.BytesIO(file_data))

                # Find the main KML file (usually doc.kml)
                kml_files = [f for f in kmz_file.namelist()
                             if f.lower().endswith('.kml')]

                if not kml_files:
                    return jsonify({"error": "No KML file found in KMZ archive"}), 400

                # Use the first KML file found (typically doc.kml)
                main_kml = kml_files[0]

                # Extract the KML content
                kml_data = kmz_file.read(main_kml)

                # Replace file_data with the extracted KML content
                file_data = kml_data

                # Keep original filename but change extension to .kml
                file_name = file_name.rsplit('.', 1)[0] + '.kml'

                logging.info(f"Extracted KML from KMZ: {main_kml}")

            except Exception as e:
                logging.error(f"Error extracting KML from KMZ: {e}")
                return jsonify({"error": f"Invalid KMZ file: {str(e)}"}), 400

        # Save the KML file (either original or extracted from KMZ)
        file_id = database_service.save_kml_file(
            user_id, file_name, file_data, description)

        if file_id:
            return jsonify({
                "success": True,
                "fileId": file_id,
                "fileName": file_name
            })
        else:
            return jsonify({"error": "Failed to save KML file"}), 500

    except Exception as e:
        logging.error(f"Error uploading KML/KMZ file: {e}")
        return jsonify({"error": str(e)}), 500


@internal_api_bp.route("/api/kml-files/<int:file_id>/toggle", methods=["POST"])
def toggle_kml_active(file_id):
    """
    Toggle active status for a KML file
    """
    data = request.json
    if not data or "userId" not in data:
        return jsonify({"error": "User ID is required"}), 400

    success = database_service.toggle_kml_active(file_id, data["userId"])
    return jsonify({"success": success})


@internal_api_bp.route("/api/kml-files/<int:file_id>", methods=["DELETE"])
def delete_kml_file(file_id):
    """
    Delete a KML file
    """
    try:
        # Print debugging info
        logging.info(f"Delete request for KML file ID: {file_id}")

        # Verify we have JSON data
        if not request.is_json and not request.data:
            logging.warning(
                f"No JSON data in request. Headers: {dict(request.headers)}")
            return jsonify({"error": "Missing JSON data", "received": "Missing request body"}), 400

        # Parse JSON data with error handling
        try:
            data = request.json
        except Exception as e:
            logging.error(
                f"Failed to parse JSON: {e}. Request data: {request.data}")
            return jsonify({"error": f"Invalid JSON data: {str(e)}"}), 400

        # Verify user ID
        if not data or "userId" not in data:
            logging.warning(f"Missing userId in request data: {data}")
            return jsonify({"error": "User ID is required", "received": data}), 400

        user_id = data["userId"]
        logging.info(f"Deleting KML file {file_id} for user {user_id}")

        # Try to delete the file
        success = database_service.delete_kml_file(file_id, user_id)

        if success:
            logging.info(f"Successfully deleted KML file {file_id}")
            return jsonify({"success": True, "message": f"KML file {file_id} deleted"})
        else:
            logging.warning(
                f"Failed to delete KML file {file_id}, possibly not found or not owned by user {user_id}")
            return jsonify({"success": False, "error": "File not found or not owned by this user"}), 404

    except Exception as e:
        logging.error(f"Error deleting KML file {file_id}: {str(e)}")
        return jsonify({"error": f"Server error: {str(e)}"}), 500


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