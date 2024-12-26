from flask import Flask, jsonify, request
from flask_cors import CORS
import openmeteo_requests
import requests_cache
from retry_requests import retry
import pandas as pd
from datetime import datetime

app = Flask(__name__)
CORS(app)

# Setup the Open-Meteo API client
cache_session = requests_cache.CachedSession('.cache', expire_after=3600)
retry_session = retry(cache_session, retries=5, backoff_factor=0.2)
openmeteo = openmeteo_requests.Client(session=retry_session)


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
            "current": "temperature_2m",
            "hourly": "temperature_2m",
            "temperature_unit": "fahrenheit",
            "wind_speed_unit": "mph",
            "precipitation_unit": "inch",
            "timezone": "GMT",
            "forecast_days": 1
        }

        responses = openmeteo.weather_api(url, params=params)
        response = responses[0]

        # Get current temperature
        current = response.Current()
        current_temp = current.Variables(0).Value()

        # Process hourly data
        hourly = response.Hourly()
        hourly_temps = hourly.Variables(0).ValuesAsNumpy()

        # Create timestamps
        timestamps = pd.date_range(
            start=pd.to_datetime(hourly.Time(), unit="s", utc=True),
            end=pd.to_datetime(hourly.TimeEnd(), unit="s", utc=True),
            freq=pd.Timedelta(seconds=hourly.Interval()),
            inclusive="left"
        )

        # Convert timestamps to string format
        hourly_data = {
            "times": [ts.strftime("%H:%M") for ts in timestamps],
            "temperatures": hourly_temps.tolist(),
            "current_temperature": current_temp,
            "elevation": response.Elevation(),
            "latitude": response.Latitude(),
            "longitude": response.Longitude()
        }

        return jsonify(hourly_data)

    except Exception as e:
        return jsonify({"error": str(e)}), 500


if __name__ == "__main__":
    app.run(host='0.0.0.0', port=5001)
