import sqlite3
import os
import logging

class DatabaseService:
    def __init__(self, db_path="data/app.db"):
        self.db_path = db_path
        self._ensure_data_directory()
        self._initialize_database()

    def _ensure_data_directory(self):
        """Ensure that the data directory exists."""
        directory = os.path.dirname(self.db_path)
        if not os.path.exists(directory):
            logging.info(f"Creating data directory at {directory}")
            os.makedirs(directory, exist_ok=True)

    def _initialize_database(self):
        """Initialize the SQLite database and tables if they don't exist."""
        logging.info(f"Initializing database at {self.db_path}")
        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.cursor()

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

            conn.commit()
            logging.info("Database and tables initialized.")
