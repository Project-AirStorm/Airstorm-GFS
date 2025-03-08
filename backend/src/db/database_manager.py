import logging
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
        
    def save_kml_file(self, user_id, file_name, file_data, description=""):
        """
        Saves a KML file to the database
        """
        try:
            with get_mysql_connection() as conn:
                with conn.cursor() as cursor:
                    cursor.execute(
                        """
                        INSERT INTO KmlFiles (user_id, file_name, file_data, description)
                        VALUES (%s, %s, %s, %s)
                        """,
                        (user_id, file_name, file_data, description),
                    )
                    file_id = cursor.lastrowid
            return file_id
        except Exception as e:
            logging.error(f"Error saving KML file: {e}")
            return None
    
    def get_user_kml_files(self, user_id):
        """
        Gets metadata about all KML files for a user
        """
        files = []
        try:
            with get_mysql_connection() as conn:
                with conn.cursor() as cursor:
                    cursor.execute(
                        """
                        SELECT id, file_name, description, upload_date, is_active
                        FROM KmlFiles
                        WHERE user_id = %s
                        ORDER BY upload_date DESC
                        """,
                        (user_id,),
                    )
                    rows = cursor.fetchall()
                    
                    for row in rows:
                        files.append({
                            "id": row["id"],
                            "fileName": row["file_name"],
                            "description": row["description"],
                            "uploadDate": row["upload_date"].isoformat() if row["upload_date"] else None,
                            "isActive": bool(row["is_active"])
                        })
        except Exception as e:
            logging.error(f"Error fetching user KML files: {e}")
        return files
    
    def get_kml_file_by_id(self, file_id, user_id=None):
        """
        Gets a specific KML file by its ID with optional user verification
        """
        try:
            with get_mysql_connection() as conn:
                with conn.cursor() as cursor:
                    query = """
                        SELECT id, user_id, file_name, file_data, description, upload_date
                        FROM KmlFiles
                        WHERE id = %s
                    """
                    params = [file_id]
                    
                    if user_id:
                        query += " AND user_id = %s"
                        params.append(user_id)
                        
                    cursor.execute(query, params)
                    row = cursor.fetchone()
                    
                    if not row:
                        return None
                        
                    return {
                        "id": row["id"],
                        "userId": row["user_id"],
                        "fileName": row["file_name"],
                        "fileData": row["file_data"],
                        "description": row["description"],
                        "uploadDate": row["upload_date"].isoformat() if row["upload_date"] else None
                    }
        except Exception as e:
            logging.error(f"Error fetching KML file: {e}")
            return None
    
    def toggle_kml_active(self, file_id, user_id):
        """
        Toggle active status for a KML file
        """
        updated = False
        try:
            with get_mysql_connection() as conn:
                with conn.cursor() as cursor:
                    # Get current state
                    cursor.execute(
                        """
                        SELECT is_active
                        FROM KmlFiles
                        WHERE id = %s AND user_id = %s
                        """,
                        (file_id, user_id),
                    )
                    row = cursor.fetchone()
                    
                    if row:
                        new_value = 0 if row["is_active"] else 1
                        cursor.execute(
                            """
                            UPDATE KmlFiles
                            SET is_active = %s
                            WHERE id = %s AND user_id = %s
                            """,
                            (new_value, file_id, user_id),
                        )
                        updated = cursor.rowcount > 0
        except Exception as e:
            logging.error(f"Error toggling KML active status: {e}")
        return updated
    
    def delete_kml_file(self, file_id, user_id):
        """
        Delete a KML file from the database
        """
        deleted = False
        try:
            with get_mysql_connection() as conn:
                # First verify the file exists and is owned by the user
                with conn.cursor() as cursor:
                    cursor.execute(
                        """
                        SELECT id FROM KmlFiles
                        WHERE id = %s AND user_id = %s
                        """,
                        (file_id, user_id),
                    )
                    file_record = cursor.fetchone()
                    
                    if not file_record:
                        logging.warning(f"KML file {file_id} not found or not owned by user {user_id}")
                        return False
                        
                    # File exists and is owned by the user, proceed with deletion
                    cursor.execute(
                        """
                        DELETE FROM KmlFiles
                        WHERE id = %s AND user_id = %s
                        """,
                        (file_id, user_id),
                    )
                    
                    deleted = cursor.rowcount > 0
                    
                    if deleted:
                        logging.info(f"Successfully deleted KML file {file_id} for user {user_id}")
                    else:
                        logging.warning(f"Failed to delete KML file {file_id} despite verification")
                
                # Commit the transaction
                conn.commit()
                
        except Exception as e:
            logging.error(f"Error deleting KML file: {e}")
            
        return deleted
