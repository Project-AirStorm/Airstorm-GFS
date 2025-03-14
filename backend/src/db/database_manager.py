import logging
import json
from db.mysql_connection import get_mysql_connection


class DatabaseManager:
    """
    Provides an interface for interacting with the Locations table in a MySQL database.
    Features:
    - Save a user to the Users table.
    - Add new locations for a user.
    - Retrieve all locations associated with a specific user.
    - Toggle the 'is_favorite' status of a location.
    - Delete a location based on user ID and coordinates.
    """

    def save_user(self, clerk_user_id, username, first_name, last_name, email):
        """
        Inserts or updates a user in the Users table, using the Clerk user ID
        as the primary key (user_id).
        """
        try:
            with get_mysql_connection() as conn:
                with conn.cursor() as cursor:
                    # Check if user already exists in the table
                    cursor.execute(
                        "SELECT user_id FROM Users WHERE user_id = %s", (clerk_user_id,)
                    )
                    row = cursor.fetchone()

                    if row is None:
                        # Insert new user
                        cursor.execute(
                            """
                            INSERT INTO Users (user_id, username, first_name, last_name, email)
                            VALUES (%s, %s, %s, %s, %s)
                        """,
                            (clerk_user_id, username, first_name, last_name, email),
                        )
                    else:
                        # Update existing user
                        cursor.execute(
                            """
                            UPDATE Users
                            SET username = %s,
                                first_name = %s,
                                last_name = %s,
                                email = %s
                            WHERE user_id = %s
                        """,
                            (username, first_name, last_name, email, clerk_user_id),
                        )

                conn.commit()
            return True

        except Exception as e:
            logging.error(f"Error saving user: {e}")
            return False

    def save_location(self, user_id, name, latitude, longitude, is_favorite=False):
        try:
            with get_mysql_connection() as conn:
                with conn.cursor() as cursor:
                    cursor.execute(
                        """
                        INSERT INTO Locations (user_id, location, latitude, longitude, is_favorite)
                        VALUES (%s, %s, %s, %s, %s)
                    """,
                        (user_id, name, latitude, longitude, 1 if is_favorite else 0),
                    )
            return True
        except Exception as e:
            logging.error(f"Error saving location: {e}")
            return False

    def get_user_locations(self, user_id):
        locations = []
        try:
            with get_mysql_connection() as conn:
                with conn.cursor() as cursor:
                    cursor.execute(
                        """
                        SELECT location, latitude, longitude, is_favorite
                        FROM Locations
                        WHERE user_id = %s
                    """,
                        (user_id,),
                    )
                    rows = cursor.fetchall()

                    for row in rows:
                        locations.append(
                            {
                                "name": row["location"],
                                "latitude": float(row["latitude"]),
                                "longitude": float(row["longitude"]),
                                "isFavorite": bool(row["is_favorite"]),
                            }
                        )
        except Exception as e:
            logging.error(f"Error fetching user locations: {e}")
        return locations

    def toggle_favorite(self, user_id, latitude, longitude):
        updated = False
        try:
            with get_mysql_connection() as conn:
                with conn.cursor() as cursor:
                    # Fetch the current record (using a small tolerance on floating-point values)
                    cursor.execute(
                        """
                        SELECT id, is_favorite
                        FROM Locations
                        WHERE user_id = %s
                          AND ABS(latitude - %s) < 0.0001
                          AND ABS(longitude - %s) < 0.0001
                        LIMIT 1
                    """,
                        (user_id, latitude, longitude),
                    )
                    row = cursor.fetchone()

                    if row:
                        new_value = 0 if row["is_favorite"] else 1
                        cursor.execute(
                            """
                            UPDATE Locations
                            SET is_favorite = %s
                            WHERE id = %s
                        """,
                            (new_value, row["id"]),
                        )
                        updated = cursor.rowcount > 0
        except Exception as e:
            logging.error(f"Error toggling favorite: {e}")
        return updated

    def delete_location(self, user_id, latitude, longitude):
        deleted = False
        try:
            with get_mysql_connection() as conn:
                with conn.cursor() as cursor:
                    cursor.execute(
                        """
                        DELETE FROM Locations
                        WHERE user_id = %s
                          AND ABS(latitude - %s) < 0.0001
                          AND ABS(longitude - %s) < 0.0001
                    """,
                        (user_id, latitude, longitude),
                    )
                    deleted = cursor.rowcount > 0
        except Exception as e:
            logging.error(f"Error deleting location: {e}")
        return deleted

    def save_chart_run(self, user_id, lat, lon, forecast_days, chart_folder, s3_files):
        """
        Inserts a row into UserCharts, returns the newly inserted chart_id.
        """
        try:
            s3_file_json = json.dumps(s3_files)  # Convert Python list → JSON
            with get_mysql_connection() as conn:
                with conn.cursor() as cursor:
                    sql = """
                        INSERT INTO UserCharts
                        (user_id, lat, lon, forecast_days, chart_folder, s3_file_array)
                        VALUES (%s, %s, %s, %s, %s, %s)
                    """
                    cursor.execute(
                        sql,
                        (user_id, lat, lon, forecast_days, chart_folder, s3_file_json),
                    )
                    # MySQL's lastrowid gives us the newly inserted primary key (chart_id).
                    new_chart_id = cursor.lastrowid
                    conn.commit()
                    return new_chart_id
        except Exception as e:
            logging.error(f"Error saving chart run: {e}")
            return None

    def get_chart_runs_for_user(self, user_id):
        chart_runs = []
        try:
            with get_mysql_connection() as conn:
                with conn.cursor() as cursor:
                    cursor.execute(
                        """
                        SELECT chart_id, lat, lon, forecast_days, chart_folder, s3_file_array, created_at
                        FROM UserCharts
                        WHERE user_id = %s
                        ORDER BY created_at DESC
                    """,
                        (user_id,),
                    )
                    rows = cursor.fetchall()
                    for row in rows:
                        s3_files = (
                            json.loads(row["s3_file_array"])
                            if row["s3_file_array"]
                            else []
                        )
                        chart_runs.append(
                            {
                                "chart_id": row["chart_id"],
                                "lat": row["lat"],
                                "lon": row["lon"],
                                "forecast_days": row["forecast_days"],
                                "chart_folder": row["chart_folder"],
                                "s3_files": s3_files,
                                "created_at": row["created_at"],
                            }
                        )
        except Exception as e:
            logging.error(f"Error fetching chart runs for user {user_id}: {e}")
        return chart_runs

    def get_chart_run_by_id(self, chart_id):
        """
        Returns the single chart run matching this chart_id.
        """
        try:
            with get_mysql_connection() as conn:
                with conn.cursor() as cursor:
                    cursor.execute(
                        """
                        SELECT chart_id, user_id, lat, lon,
                            forecast_days, chart_folder,
                            s3_file_array, created_at
                        FROM UserCharts
                        WHERE chart_id = %s
                    """,
                        (chart_id,),
                    )
                    row = cursor.fetchone()
                    if row is None:
                        return None
                    s3_files = (
                        json.loads(row["s3_file_array"]) if row["s3_file_array"] else []
                    )
                    return {
                        "chart_id": row["chart_id"],
                        "user_id": row["user_id"],
                        "lat": row["lat"],
                        "lon": row["lon"],
                        "forecast_days": row["forecast_days"],
                        "chart_folder": row["chart_folder"],
                        "s3_files": s3_files,
                        "created_at": row["created_at"],
                    }
        except Exception as e:
            logging.error(f"Error in get_chart_run_by_id: {e}")
            return None
