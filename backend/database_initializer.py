import sqlite3
import logging
import os


class DatabaseInitializer:
    def __init__(self, db_path="data/app.sqlite"):
        self.db_path = db_path
        self._initialize_database()

    def _initialize_database(self):
        """Ensure the database and required tables are initialized."""
        directory = os.path.dirname(self.db_path)
        if not os.path.exists(directory):
            os.makedirs(directory, exist_ok=True)
            logging.info(f"Created data directory at {directory}")

        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.cursor()
            logging.info(f"Initializing database at {self.db_path}")

            # Create Users table
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS Users (
                    user_id INTEGER PRIMARY KEY AUTOINCREMENT,
                    username TEXT UNIQUE NOT NULL,
                    password TEXT NOT NULL
                );
            """)

            # Create Locations table
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS Locations (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    user_id INTEGER NOT NULL,
                    latitude REAL NOT NULL,
                    longitude REAL NOT NULL,
                    location TEXT NOT NULL,
                    is_favorite INTEGER DEFAULT 0,
                    FOREIGN KEY (user_id) REFERENCES Users (user_id)
                );
            """)

            logging.info("Database and tables initialized.")
