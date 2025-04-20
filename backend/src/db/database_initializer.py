import os
import logging
import pymysql
from db.mysql_connection import get_mysql_connection


class DatabaseInitializer:
    def __init__(self):
        # For MySQL, we no longer need a file path.
        self._initialize_database()

    def _initialize_database(self):
        logging.info("Initializing MySQL database schema")
        try:
            # First connect without database to create it if needed
            connection = pymysql.connect(
                host=os.environ.get("MYSQL_HOST"),
                user=os.environ.get("MYSQL_USER"),
                password=os.environ.get("MYSQL_PASSWORD"),
                port=int(os.environ.get("MYSQL_PORT", 3306)),
                cursorclass=pymysql.cursors.DictCursor,
                autocommit=True
            )

            with connection.cursor() as cursor:
                # Create database if it doesn't exist
                cursor.execute(
                    f"CREATE DATABASE IF NOT EXISTS {os.environ.get('MYSQL_DATABASE')}")
            connection.close()

            # Now connect with database specified and create tables
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
                            user_id VARCHAR(255) PRIMARY KEY,      -- Stores clerk user_id
                            username VARCHAR(255) UNIQUE NOT NULL,
                            email VARCHAR(255) UNIQUE NOT NULL, 
                            first_name VARCHAR(255) NOT NULL,
                            last_name VARCHAR(255) NOT NULL,
                            role VARCHAR(50) DEFAULT 'User'
                        ) ENGINE=InnoDB;
                    """)
                    cursor.execute("""
                        CREATE TABLE IF NOT EXISTS UserCharts (
                            chart_id INT AUTO_INCREMENT PRIMARY KEY,
                            user_id VARCHAR(255) NOT NULL,
                            lat DOUBLE NOT NULL,
                            lon DOUBLE NOT NULL,
                            forecast_days INT NOT NULL,
                            chart_folder VARCHAR(255),
                            s3_file_array JSON,
                            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                            FOREIGN KEY (user_id) REFERENCES Users(user_id)
                        ) ENGINE=InnoDB;
                    """)

                    # Create Locations table
                    cursor.execute("""
                        CREATE TABLE IF NOT EXISTS Locations (
                            id INT AUTO_INCREMENT PRIMARY KEY,
                            user_id VARCHAR(255) NOT NULL,
                            latitude DOUBLE NOT NULL,
                            longitude DOUBLE NOT NULL,
                            location VARCHAR(255) NOT NULL,
                            is_favorite TINYINT DEFAULT 0,
                            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                            FOREIGN KEY (user_id) REFERENCES Users(user_id)
                        ) ENGINE=InnoDB;
                    """)
                    
                    # Create KML Files table
                    cursor.execute("""
                        CREATE TABLE IF NOT EXISTS KmlFiles (
                            id INT AUTO_INCREMENT PRIMARY KEY,
                            user_id VARCHAR(255) NOT NULL,
                            file_name VARCHAR(255) NOT NULL,
                            file_data LONGBLOB NOT NULL,
                            description VARCHAR(500),
                            upload_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                            is_active TINYINT DEFAULT 1,
                            FOREIGN KEY (user_id) REFERENCES Users(user_id)
                        ) ENGINE=InnoDB;
                    """)
                # No need to commit explicitly if autocommit is enabled.
            logging.info("MySQL database and tables initialized.")
        except Exception as e:
            logging.error(f"Error initializing MySQL database: {e}")
