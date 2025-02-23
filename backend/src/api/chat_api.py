# backend/api/chat_api.py
import logging
from flask import Blueprint, jsonify, request
from stream_chat import StreamChat
import os
from db.mysql_connection import get_mysql_connection

chat_api_bp = Blueprint("chat_api", __name__)
logger = logging.getLogger(__name__)

# Initialize Stream Chat client
stream_client = StreamChat(
    api_key=os.getenv('STREAM_API_KEY'),
    api_secret=os.getenv('STREAM_API_SECRET')
)

chat_api_bp = Blueprint("chat_api", __name__)
logger = logging.getLogger(__name__)

# Initialize Stream Chat client
stream_client = StreamChat(
    api_key=os.getenv('STREAM_API_KEY'),
    api_secret=os.getenv('STREAM_API_SECRET')
)


@chat_api_bp.route("/api/chat/token", methods=["GET"])
def get_chat_token():
    """Generate a Stream Chat token for the user"""
    try:
        user_id = request.args.get("userId")
        if not user_id:
            return jsonify({"error": "User ID is required"}), 400

        # Generate token for the user
        token = stream_client.create_token(user_id)

        return jsonify({
            "token": token
        })

    except Exception as e:
        logger.error(f"Error generating chat token: {str(e)}")
        return jsonify({"error": "Failed to generate chat token"}), 500


@chat_api_bp.route("/api/chat/users/search", methods=["GET"])
def search_users():
    """Search for users by name"""
    try:
        query = request.args.get("query")
        if not query:
            return jsonify({"error": "Search query is required"}), 400

        # Get user list from your database based on search query
        with get_mysql_connection() as conn:
            with conn.cursor() as cursor:
                cursor.execute("""
                    SELECT user_id, username, first_name, last_name
                    FROM Users
                    WHERE CONCAT(first_name, ' ', last_name) LIKE %s
                    OR username LIKE %s
                    LIMIT 10
                """, (f"%{query}%", f"%{query}%"))

                users = cursor.fetchall()

        return jsonify({
            "users": [{
                "id": user["user_id"],
                "username": user["username"],
                "name": f"{user['first_name']} {user['last_name']}"
            } for user in users]
        })

    except Exception as e:
        logger.error(f"Error searching users: {str(e)}")
        return jsonify({"error": "Failed to search users"}), 500


@chat_api_bp.route("/api/chat/users/create", methods=["POST"])
def create_chat_user():
    """Create or update a user in Stream Chat"""
    try:
        user_data = request.json
        user_id = user_data.get("user_id")
        name = user_data.get("name")
        username = user_data.get("username")

        if not user_id or not name or not username:
            return jsonify({"error": "User ID, name, and username are required"}), 400

        # Create or update the user in Stream Chat
        stream_client.update_user({
            "id": user_id,
            "name": name,
            "username": username,
            "role": "user"
        })

        return jsonify({"message": "User created/updated successfully in Stream Chat"}), 200

    except Exception as e:
        logger.error(f"Error creating/updating user in Stream Chat: {str(e)}")
        return jsonify({"error": "Failed to create/update user in Stream Chat"}), 500
