import os
import pymysql
import logging

def get_mysql_connection():
    try:
        connection = pymysql.connect(
            host=os.environ.get("MYSQL_HOST", "localhost"),
            user=os.environ.get("MYSQL_USER", "root"),
            password=os.environ.get("MYSQL_PASSWORD", ""),
            database=os.environ.get("MYSQL_DATABASE", "weatherapp"),
            port=int(os.environ.get("MYSQL_PORT", 3306)),
            cursorclass=pymysql.cursors.DictCursor,
            autocommit=True  # Enable autocommit (or commit manually as needed)
        )
        return connection
    except Exception as e:
        logging.error(f"Error connecting to MySQL: {e}")
        raise
