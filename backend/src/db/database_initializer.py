import os
import logging
from db.mysql_connection import get_mysql_connection

class DatabaseInitializer:
    def __init__(self):
        # For MySQL, we no longer need a file path.
        self._initialize_database()

    def _initialize_database(self):
        logging.info("Initializing MySQL database schema")
        try:
            with get_mysql_connection() as conn:
                with conn.cursor() as cursor:
                    # Create Users table
                    '''
                    We always want the user_id and email fields to always be NOT NULL. 
                    Since Clerk manages login (currently through GoogleAUTH) we will not necessarily 
                    have to store passwords in our database, but we do want to capture their email. 
                    If a user wishes to signup manually through a form page, we will need username, first_name, last_name, and password. 
                    '''
                    cursor.execute("""
                        CREATE TABLE IF NOT EXISTS Users (
                            user_id INT AUTO_INCREMENT PRIMARY KEY,
                            username VARCHAR(255) UNIQUE NOT NULL,
                            email VARCHAR(255) UNIQUE NOT NULL, 
                            first_name VARCHAR(255) NOT NULL,
                            last_name VARCHAR(255) NOT NULL,
                            password VARCHAR(255) UNIQUE
                        ) ENGINE=InnoDB;
                    """)

                    # Create Locations table
                    cursor.execute("""
                        CREATE TABLE IF NOT EXISTS Locations (
                            id INT AUTO_INCREMENT PRIMARY KEY,
                            user_id INT NOT NULL,
                            latitude DOUBLE NOT NULL,
                            longitude DOUBLE NOT NULL,
                            location VARCHAR(255) NOT NULL,
                            is_favorite TINYINT DEFAULT 0,
                            FOREIGN KEY (user_id) REFERENCES Users(user_id)
                        ) ENGINE=InnoDB;
                    """)
                # No need to commit explicitly if autocommit is enabled.
            logging.info("MySQL database and tables initialized.")
        except Exception as e:
            logging.error(f"Error initializing MySQL database: {e}")
