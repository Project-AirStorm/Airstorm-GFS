import logging
import json
from db.mysql_connection import get_mysql_connection


class DatabaseManager:
    def __init__(self):
        pass

    # Sets User role to none to avoid "paramater not included" error if a function which doesn't include role calls the method
    def save_user(self, clerk_user_id, username, first_name, last_name, email, role=None): 
        try:
            with get_mysql_connection() as conn:
                with conn.cursor() as cursor:
                    # Check if user exists - uses user_id column instead of clerk_user_id
                    check_sql = "SELECT * FROM Users WHERE user_id = %s"
                    cursor.execute(check_sql, (clerk_user_id,))
                    user = cursor.fetchone()

                     # Set default role if not provided
                    if role is None:
                        role = 'User'

                    if user:
                        # Update existing user
                        update_sql = """
                        UPDATE Users 
                        SET username = %s, first_name = %s, last_name = %s, email = %s,  role = %s 
                        WHERE user_id = %s
                        """
                        cursor.execute(
                            update_sql,
                            (username, first_name, last_name, email, role, clerk_user_id)
                        )
                    else:
                        # Insert new user
                        insert_sql = """
                        INSERT INTO Users 
                        (user_id, username, first_name, last_name, email, role) 
                        VALUES (%s, %s, %s, %s, %s, %s)
                        """
                        cursor.execute(
                            insert_sql,
                            (clerk_user_id, username, first_name, last_name, email, role)
                        )

                    conn.commit()
                    return True

        except Exception as e:
            logging.error(f"Error saving user: {e}")
            return False

    def save_location(self, user_id, name, latitude, longitude, is_favorite=False):
        """
        Save a location for a user
        """
        try:
            with get_mysql_connection() as conn:
                with conn.cursor() as cursor:
                    # Check if the location exists - using Locations table
                    check_sql = """
                    SELECT * FROM Locations 
                    WHERE user_id = %s AND latitude = %s AND longitude = %s
                    """
                    cursor.execute(check_sql, (user_id, latitude, longitude))
                    existing_location = cursor.fetchone()

                    if existing_location:
                        # Update existing location
                        update_sql = """
                        UPDATE Locations 
                        SET location = %s, is_favorite = %s 
                        WHERE user_id = %s AND latitude = %s AND longitude = %s
                        """
                        cursor.execute(
                            update_sql, (name, is_favorite, user_id, latitude, longitude))
                    else:
                        # Insert new location
                        insert_sql = """
                        INSERT INTO Locations 
                        (user_id, location, latitude, longitude, is_favorite) 
                        VALUES (%s, %s, %s, %s, %s)
                        """
                        cursor.execute(
                            insert_sql, (user_id, name, latitude, longitude, is_favorite))

                    conn.commit()
                    return True

        except Exception as e:
            logging.error(f"Error saving location: {e}")
            return False

    def get_user_locations(self, user_id):
        """
        Get all locations for a user
        """
        try:
            with get_mysql_connection() as conn:
                with conn.cursor() as cursor:
                    sql = """
                    SELECT location as name, latitude, longitude, is_favorite
                    FROM Locations 
                    WHERE user_id = %s
                    ORDER BY is_favorite DESC
                    """
                    cursor.execute(sql, (user_id,))
                    locations = cursor.fetchall()

                    # Convert to list of dicts
                    result = []
                    for loc in locations:
                        result.append({
                            "name": loc["name"],
                            "latitude": float(loc["latitude"]),
                            "longitude": float(loc["longitude"]),
                            "isFavorite": bool(loc["is_favorite"])
                        })

                    return result

        except Exception as e:
            logging.error(f"Error fetching user locations: {e}")
            return []

    def delete_location(self, user_id, latitude, longitude):
        """
        Delete a location for a user
        """
        try:
            with get_mysql_connection() as conn:
                with conn.cursor() as cursor:
                    sql = """
                    DELETE FROM Locations 
                    WHERE user_id = %s AND latitude = %s AND longitude = %s
                    """
                    cursor.execute(sql, (user_id, latitude, longitude))
                    conn.commit()
                    return cursor.rowcount > 0  # True if any rows were deleted

        except Exception as e:
            logging.error(f"Error deleting location: {e}")
            return False

    def toggle_favorite(self, user_id, latitude, longitude):
        """
        Toggle favorite status for a location
        """
        try:
            with get_mysql_connection() as conn:
                with conn.cursor() as cursor:
                    # First get current status
                    select_sql = """
                    SELECT is_favorite 
                    FROM Locations 
                    WHERE user_id = %s AND latitude = %s AND longitude = %s
                    """
                    cursor.execute(select_sql, (user_id, latitude, longitude))
                    result = cursor.fetchone()

                    if not result:
                        return False

                    # Toggle favorite status
                    current_status = result["is_favorite"]
                    new_status = not current_status

                    update_sql = """
                    UPDATE Locations 
                    SET is_favorite = %s 
                    WHERE user_id = %s AND latitude = %s AND longitude = %s
                    """
                    cursor.execute(
                        update_sql, (new_status, user_id, latitude, longitude))
                    conn.commit()
                    return True

        except Exception as e:
            logging.error(f"Error toggling favorite status: {e}")
            return False

    def save_kml_file(self, user_id, file_name, file_data, description=""):
        """
        Save a KML file to the database
        """
        try:
            with get_mysql_connection() as conn:
                with conn.cursor() as cursor:
                    sql = """
                    INSERT INTO KmlFiles 
                    (user_id, file_name, file_data, description, is_active) 
                    VALUES (%s, %s, %s, %s, %s)
                    """
                    cursor.execute(
                        sql, (user_id, file_name, file_data, description, True))

                    # Get the inserted ID
                    file_id = cursor.lastrowid
                    conn.commit()

                    return file_id

        except Exception as e:
            logging.error(f"Error saving KML file: {e}")
            return None

    def get_user_kml_files(self, user_id):
        """
        Get all KML files for a user
        """
        try:
            with get_mysql_connection() as conn:
                with conn.cursor() as cursor:
                    sql = """
                    SELECT id, file_name, description, is_active, upload_date
                    FROM KmlFiles 
                    WHERE user_id = %s
                    ORDER BY upload_date DESC
                    """
                    cursor.execute(sql, (user_id,))
                    files = cursor.fetchall()

                    # Convert to list of dicts
                    result = []
                    for file in files:
                        result.append({
                            "id": file["id"],
                            "fileName": file["file_name"],
                            "description": file["description"] or "",
                            "isActive": bool(file["is_active"]),
                            "createdAt": file["upload_date"].isoformat() if file["upload_date"] else None
                        })

                    return result

        except Exception as e:
            logging.error(f"Error fetching user KML files: {e}")
            return []

    def get_kml_file_by_id(self, file_id, user_id):
        """
        Get a specific KML file by ID
        """
        try:
            with get_mysql_connection() as conn:
                with conn.cursor() as cursor:
                    sql = """
                    SELECT id, file_name, file_data
                    FROM KmlFiles 
                    WHERE id = %s AND user_id = %s
                    """
                    cursor.execute(sql, (file_id, user_id))
                    file = cursor.fetchone()

                    if not file:
                        return None

                    return {
                        "id": file["id"],
                        "fileName": file["file_name"],
                        "fileData": file["file_data"]
                    }

        except Exception as e:
            logging.error(f"Error fetching KML file: {e}")
            return None

    def toggle_kml_active(self, file_id, user_id):
        """
        Toggle active status for a KML file
        """
        try:
            with get_mysql_connection() as conn:
                with conn.cursor() as cursor:
                    # First get current status
                    select_sql = """
                    SELECT is_active 
                    FROM KmlFiles 
                    WHERE id = %s AND user_id = %s
                    """
                    cursor.execute(select_sql, (file_id, user_id))
                    result = cursor.fetchone()

                    if not result:
                        return False

                    # Toggle active status
                    current_status = result["is_active"]
                    new_status = not current_status

                    update_sql = """
                    UPDATE KmlFiles 
                    SET is_active = %s 
                    WHERE id = %s AND user_id = %s
                    """
                    cursor.execute(update_sql, (new_status, file_id, user_id))
                    conn.commit()
                    return True

        except Exception as e:
            logging.error(f"Error toggling KML active status: {e}")
            return False

    def delete_kml_file(self, file_id, user_id):
        """
        Delete a KML file
        """
        try:
            with get_mysql_connection() as conn:
                with conn.cursor() as cursor:
                    sql = """
                    DELETE FROM KmlFiles 
                    WHERE id = %s AND user_id = %s
                    """
                    cursor.execute(sql, (file_id, user_id))
                    deleted = cursor.rowcount > 0
                    conn.commit()
                    return deleted

        except Exception as e:
            logging.error(f"Error deleting KML file: {e}")
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
                        (user_id, lat, lon, forecast_days,
                         chart_folder, s3_file_json),
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
                        json.loads(row["s3_file_array"]
                                   ) if row["s3_file_array"] else []
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

    def delete_chart(self, chart_id):
        """
        Deletes a row from UserCharts by chart_id.
        Returns True if a row was deleted, False otherwise.
        """
        try:
            with get_mysql_connection() as conn:
                with conn.cursor() as cursor:
                    cursor.execute(
                        "DELETE FROM UserCharts WHERE chart_id = %s", (chart_id,))
                    return cursor.rowcount > 0
        except Exception as e:
            logging.error(f"Error deleting chart run {chart_id}: {e}")
            return False
