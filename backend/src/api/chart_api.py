from flask import Blueprint, request, jsonify
import requests
import logging
from db.database_manager import DatabaseManager

# from db.mysql_connection import get_mysql_connection  # if needed

charts_api_bp = Blueprint("charts_bp", __name__)
database_manager = DatabaseManager()


@charts_api_bp.route("/api/charts/generate", methods=["POST"])
def generate_charts():
    """
    1) Parse lat/lon/days/user_id from request
    2) Call the external chart-server
    3) Save the chart run in MySQL
    4) RETURN the newly inserted DB row to React (so the shape is consistent).
    """
    try:
        data = request.json
        lat = data["lat"]
        lon = data["lon"]
        forecast_days = data["days"]
        user_id = data["user_id"]

        # 1) Call your external chart-server
        chart_server_url = (
            f"http://ec2-3-221-177-106.compute-1.amazonaws.com:5000/generate-skew"
            f"?days={forecast_days}&lat={lat}&lon={lon}&user_id={user_id}"
        )
        # Currently this timeout value keeps that chart generator from bombing out 
        response = requests.get(chart_server_url, timeout=300) 
        response.raise_for_status()

        result_from_ec2 = response.json()
        """
        Something like:
        {
            "latitude": ...,
            "longitude": ...,
            "days_requested": ...,
            "chart_folder": ...,
            "s3_files": [...],
            "user_id": ...
        }
        """
        s3_files = result_from_ec2.get("s3_files", [])
        chart_folder = result_from_ec2.get("chart_folder")

        # 2) Save to DB (we have lat, lon, forecast_days from the original request)
        #    and we know s3_files + chart_folder from the result
        new_chart_id = database_manager.save_chart_run(
            user_id=user_id,
            lat=lat,
            lon=lon,
            forecast_days=forecast_days,
            chart_folder=chart_folder,
            s3_files=s3_files,
        )

        if not new_chart_id:
            logging.error("Failed to save chart run in DB.")
            return jsonify({"error": "Could not save chart run to DB"}), 500

        # 3) Retrieve the newly inserted row from the DB so that
        #    we return the EXACT shape your React code expects.
        new_chart_run = database_manager.get_s3_chart_run_by_id(new_chart_id)
        if not new_chart_run:
            return (
                jsonify({"error": "Inserted but could not retrieve new chart run"}),
                500,
            )

        # Return the new row from DB to the front end
        # This ensures your newly created run has { chart_id, lat, lon, ... } etc.
        return jsonify(new_chart_run), 200

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

    chart_runs = database_manager.get_s3_chart_runs_for_user(user_id)
    return jsonify(chart_runs), 200

@charts_api_bp.route("/api/charts/delete", methods=["DELETE"])
def delete_user_chart():
    """
    DELETE /api/charts/delete?chart_id=123
    Deletes a chart by chart_id in the UserCharts table
    """
    chart_id = request.args.get("chart_id")
    if not chart_id:
        return jsonify({"error": "Missing chart_id"}), 400

    # Attempt to delete the chart
    success = database_manager.delete_s3_chart(chart_id)
    if success:
        return jsonify({"message": f"Chart {chart_id} deleted"}), 200
    else:
        return jsonify({"error": f"Could not delete chart {chart_id}"}), 404

