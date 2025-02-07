import logging
from db.mysql_connection import get_mysql_connection

class DatabaseManager:
    """
    Provides an interface for interacting with the Locations table in a MySQL database.
    Features:
    - Add new locations for a user.
    - Retrieve all locations associated with a specific user.
    - Toggle the 'is_favorite' status of a location.
    - Delete a location based on user ID and coordinates.
    """

    def save_location(self, user_id, name, latitude, longitude, is_favorite=False):
        try:
            with get_mysql_connection() as conn:
                with conn.cursor() as cursor:
                    cursor.execute("""
                        INSERT INTO Locations (user_id, location, latitude, longitude, is_favorite)
                        VALUES (%s, %s, %s, %s, %s)
                    """, (
                        user_id,
                        name,
                        latitude,
                        longitude,
                        1 if is_favorite else 0
                    ))
            return True
        except Exception as e:
            logging.error(f"Error saving location: {e}")
            return False

    def get_user_locations(self, user_id):
        locations = []
        try:
            with get_mysql_connection() as conn:
                with conn.cursor() as cursor:
                    cursor.execute("""
                        SELECT location, latitude, longitude, is_favorite
                        FROM Locations
                        WHERE user_id = %s
                    """, (user_id,))
                    rows = cursor.fetchall()

                    for row in rows:
                        locations.append({
                            'name': row['location'],
                            'latitude': float(row['latitude']),
                            'longitude': float(row['longitude']),
                            'isFavorite': bool(row['is_favorite'])
                        })
        except Exception as e:
            logging.error(f"Error fetching user locations: {e}")
        return locations

    def toggle_favorite(self, user_id, latitude, longitude):
        updated = False
        try:
            with get_mysql_connection() as conn:
                with conn.cursor() as cursor:
                    # Fetch the current record (using a small tolerance on floating-point values)
                    cursor.execute("""
                        SELECT id, is_favorite
                        FROM Locations
                        WHERE user_id = %s
                          AND ABS(latitude - %s) < 0.0001
                          AND ABS(longitude - %s) < 0.0001
                        LIMIT 1
                    """, (user_id, latitude, longitude))
                    row = cursor.fetchone()

                    if row:
                        new_value = 0 if row['is_favorite'] else 1
                        cursor.execute("""
                            UPDATE Locations
                            SET is_favorite = %s
                            WHERE id = %s
                        """, (new_value, row['id']))
                        updated = (cursor.rowcount > 0)
        except Exception as e:
            logging.error(f"Error toggling favorite: {e}")
        return updated

    def delete_location(self, user_id, latitude, longitude):
        deleted = False
        try:
            with get_mysql_connection() as conn:
                with conn.cursor() as cursor:
                    cursor.execute("""
                        DELETE FROM Locations
                        WHERE user_id = %s
                          AND ABS(latitude - %s) < 0.0001
                          AND ABS(longitude - %s) < 0.0001
                    """, (user_id, latitude, longitude))
                    deleted = (cursor.rowcount > 0)
        except Exception as e:
            logging.error(f"Error deleting location: {e}")
        return deleted
