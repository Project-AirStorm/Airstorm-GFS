import sqlite3
import logging

class LocationService:
    """
    The LocationService class provides an interface for interacting with the Locations table
    in an SQLite database. This is our data that is being used to save 

    Features:
    - Add new locations for a user.
    - Retrieve all locations associated with a specific user.
    - Toggle the 'is_favorite' status of a location.
    - Delete a location based on user ID and coordinates.
    """
    def __init__(self, db_path='data/app.sqlite'):
        """
        Initialize the LocationService with the path to the SQLite database.
        """
        self.db_path = db_path

    def save_location(self, user_id, name, latitude, longitude, is_favorite=False):
        """
        Inserts a new location record in the database.
        """
        try:
            with sqlite3.connect(self.db_path) as conn:
                cursor = conn.cursor()
                cursor.execute("""
                    INSERT INTO Locations (user_id, location, latitude, longitude, is_favorite)
                    VALUES (?, ?, ?, ?, ?)
                """, (
                    user_id,
                    name,
                    latitude,
                    longitude,
                    1 if is_favorite else 0
                ))
                conn.commit()
            return True
        except Exception as e:
            logging.error(f"Error saving location: {e}")
            return False

    def get_user_locations(self, user_id):
        """
        Fetches all locations for a specific user_id.
        Returns a list of dict objects.
        """
        locations = []
        try:
            with sqlite3.connect(self.db_path) as conn:
                conn.row_factory = sqlite3.Row
                cursor = conn.cursor()
                cursor.execute("""
                    SELECT location, latitude, longitude, is_favorite
                    FROM Locations
                    WHERE user_id = ?
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
        """
        Finds a location for the user based on lat/long,
        flips its 'is_favorite' boolean, and saves back to the DB.
        """
        updated = False
        try:
            with sqlite3.connect(self.db_path) as conn:
                cursor = conn.cursor()

                # Fetch the current record
                cursor.execute("""
                    SELECT id, is_favorite
                    FROM Locations
                    WHERE user_id = ?
                      AND ABS(latitude - ?) < 0.0001
                      AND ABS(longitude - ?) < 0.0001
                    LIMIT 1
                """, (user_id, latitude, longitude))
                row = cursor.fetchone()

                if row:
                    new_value = 0 if row[1] else 1
                    # Update record
                    cursor.execute("""
                        UPDATE Locations
                        SET is_favorite = ?
                        WHERE id = ?
                    """, (new_value, row[0]))
                    conn.commit()
                    updated = (cursor.rowcount > 0)

        except Exception as e:
            logging.error(f"Error toggling favorite: {e}")

        return updated

    def delete_location(self, user_id, latitude, longitude):
        """
        Delete a location for a specific user based on coordinates.
        Returns True if a location was deleted, False otherwise.
        """
        deleted = False
        try:
            with sqlite3.connect(self.db_path) as conn:
                cursor = conn.cursor()
                cursor.execute("""
                    DELETE FROM Locations
                    WHERE user_id = ?
                      AND ABS(latitude - ?) < 0.0001
                      AND ABS(longitude - ?) < 0.0001
                """, (user_id, latitude, longitude))
                conn.commit()
                deleted = (cursor.rowcount > 0)
        except Exception as e:
            logging.error(f"Error deleting location: {e}")

        return deleted
