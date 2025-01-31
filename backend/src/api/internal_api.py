from flask import Blueprint, jsonify, request
from db.database_initializer import DatabaseInitializer
from db.database_manager import DatabaseManager

internal_api_bp = Blueprint("internal_api", __name__)

db_service = DatabaseInitializer(db_path="data/app.sqlite")
database_service = DatabaseManager()

# Gets the current User_ID
@internal_api_bp.route("/api/locations", methods=["GET"])
def get_locations():
    user_id = request.args.get("userId")
    if not user_id:
        return jsonify({"error": "User ID is required"}), 400
    locations = database_service.get_user_locations(user_id)
    return jsonify(locations)

# Retrives locations from the database  
@internal_api_bp.route("/api/locations", methods=["POST"])
def save_location():
    data = request.json
    if not all(k in data for k in ("userId", "name", "latitude", "longitude")):
        return jsonify({"error": "Missing required fields"}), 400
    
    success = database_service.save_location(
        data["userId"],
        data["name"],
        data["latitude"],
        data["longitude"],
        data.get("isFavorite", False),
    )
    return jsonify({"success": success})

# Deletes locations from React WeatherCard
@internal_api_bp.route("/api/locations", methods=["DELETE"])
def delete_location():
    data = request.json
    if not all(k in data for k in ("userId", "latitude", "longitude")):
        return jsonify({"error": "Missing required fields"}), 400

    success = database_service.delete_location(
        data["userId"], data["latitude"], data["longitude"]
    )
    return jsonify({"success": success})

@internal_api_bp.route("/api/locations/favorite", methods=["POST"])
def toggle_favorite():
    data = request.json
    if not all(k in data for k in ("userId", "latitude", "longitude")):
        return jsonify({"error": "Missing required fields"}), 400

    success = database_service.toggle_favorite(
        data["userId"], data["latitude"], data["longitude"]
    )

    return jsonify({"success": success})