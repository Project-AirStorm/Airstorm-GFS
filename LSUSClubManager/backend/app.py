"""
LSUS Campus Event & Club Manager — Flask REST API
Authors: Jadyn Falls, Joshua Francis, Christopher Kouba
"""

import os
import pyodbc
import bcrypt
from functools import wraps
from datetime import datetime
from flask import Flask, request, jsonify, session
from flask_cors import CORS
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__)
app.secret_key = os.getenv("SECRET_KEY", "dev-secret-key-change-in-prod")
CORS(app, supports_credentials=True, origins=["http://127.0.0.1:5500", "http://localhost:5500", "http://localhost:3000"])

# ===========================================================
# DATABASE CONNECTION
# ===========================================================

def get_db():
    """Return a fresh pyodbc connection."""
    server = os.getenv("DB_SERVER", "localhost")
    database = os.getenv("DB_NAME", "LSUSClubManager")
    trusted = os.getenv("DB_TRUSTED_CONNECTION", "yes").lower() == "yes"

    if trusted:
        conn_str = (
            f"DRIVER={{ODBC Driver 17 for SQL Server}};"
            f"SERVER={server};"
            f"DATABASE={database};"
            f"Trusted_Connection=yes;"
        )
    else:
        user = os.getenv("DB_USER", "sa")
        password = os.getenv("DB_PASSWORD", "")
        conn_str = (
            f"DRIVER={{ODBC Driver 17 for SQL Server}};"
            f"SERVER={server};"
            f"DATABASE={database};"
            f"UID={user};PWD={password};"
        )
    return pyodbc.connect(conn_str)


def set_session_ctx(cursor, user_id):
    """Set SQL Server session context for audit triggers."""
    cursor.execute("EXEC sp_set_session_context @key=N'UserID', @value=?", user_id)


def row_to_dict(cursor, row):
    """Convert a pyodbc row to a dictionary."""
    columns = [column[0] for column in cursor.description]
    return dict(zip(columns, row))


def rows_to_list(cursor, rows):
    columns = [column[0] for column in cursor.description]
    return [dict(zip(columns, row)) for row in rows]

# ===========================================================
# AUTH DECORATORS
# ===========================================================

def login_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        if "user_id" not in session:
            return jsonify({"error": "Unauthorized. Please log in."}), 401
        return f(*args, **kwargs)
    return decorated


def role_required(*roles):
    """roles: 'Student', 'ClubAdmin', 'Admin'"""
    def decorator(f):
        @wraps(f)
        def decorated(*args, **kwargs):
            if "user_id" not in session:
                return jsonify({"error": "Unauthorized."}), 401
            if session.get("role") not in roles:
                return jsonify({"error": f"Forbidden. Requires role: {roles}"}), 403
            return f(*args, **kwargs)
        return decorated
    return decorator

# ===========================================================
# AUTH ROUTES
# ===========================================================

@app.route("/api/register", methods=["POST"])
def register():
    data = request.get_json()
    full_name = data.get("full_name", "").strip()
    email     = data.get("email", "").strip().lower()
    password  = data.get("password", "")

    if not full_name or not email or not password:
        return jsonify({"error": "full_name, email, and password are required."}), 400

    pw_hash = bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()

    try:
        conn = get_db()
        cur  = conn.cursor()
        # Role 1 = Student (default for new registrations)
        cur.execute(
            "INSERT INTO Users (FullName, Email, PasswordHash, RoleID) VALUES (?, ?, ?, 1)",
            full_name, email, pw_hash
        )
        conn.commit()
        conn.close()
        return jsonify({"message": "Registered successfully."}), 201
    except pyodbc.IntegrityError:
        return jsonify({"error": "Email already registered."}), 409
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/api/login", methods=["POST"])
def login():
    data     = request.get_json()
    email    = data.get("email", "").strip().lower()
    password = data.get("password", "")

    try:
        conn = get_db()
        cur  = conn.cursor()
        cur.execute(
            "SELECT u.UserID, u.FullName, u.PasswordHash, r.RoleName "
            "FROM Users u JOIN Roles r ON u.RoleID = r.RoleID "
            "WHERE u.Email = ?", email
        )
        row = cur.fetchone()
        conn.close()

        if not row:
            return jsonify({"error": "Invalid credentials."}), 401

        user_id, full_name, pw_hash, role = row
        if not bcrypt.checkpw(password.encode(), pw_hash.encode()):
            return jsonify({"error": "Invalid credentials."}), 401

        session["user_id"]   = user_id
        session["full_name"] = full_name
        session["role"]      = role
        session["email"]     = email

        return jsonify({"message": "Logged in.", "user": {"id": user_id, "name": full_name, "role": role}})
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/api/logout", methods=["POST"])
def logout():
    session.clear()
    return jsonify({"message": "Logged out."})


@app.route("/api/me", methods=["GET"])
@login_required
def me():
    return jsonify({
        "id":   session["user_id"],
        "name": session["full_name"],
        "role": session["role"],
        "email": session["email"]
    })

# ===========================================================
# CLUBS ROUTES
# ===========================================================

@app.route("/api/clubs", methods=["GET"])
@login_required
def get_clubs():
    """All users see approved clubs. Admins see all."""
    try:
        conn = get_db()
        cur  = conn.cursor()
        if session["role"] == "Admin":
            cur.execute(
                "SELECT c.ClubID, c.ClubName, c.Description, c.ApprovalStatus, "
                "u.FullName AS CreatedBy, c.CreatedAt "
                "FROM Clubs c JOIN Users u ON c.CreatedBy = u.UserID "
                "ORDER BY c.CreatedAt DESC"
            )
        else:
            cur.execute(
                "SELECT c.ClubID, c.ClubName, c.Description, c.ApprovalStatus, "
                "u.FullName AS CreatedBy, c.CreatedAt "
                "FROM Clubs c JOIN Users u ON c.CreatedBy = u.UserID "
                "WHERE c.ApprovalStatus = 'Approved' ORDER BY c.ClubName"
            )
        clubs = rows_to_list(cur, cur.fetchall())
        conn.close()
        return jsonify(clubs)
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/api/clubs/<int:club_id>", methods=["GET"])
@login_required
def get_club(club_id):
    try:
        conn = get_db()
        cur  = conn.cursor()
        cur.execute(
            "SELECT c.ClubID, c.ClubName, c.Description, c.ApprovalStatus, "
            "u.FullName AS CreatedBy, c.CreatedAt "
            "FROM Clubs c JOIN Users u ON c.CreatedBy = u.UserID "
            "WHERE c.ClubID = ?", club_id
        )
        row = cur.fetchone()
        conn.close()
        if not row:
            return jsonify({"error": "Club not found."}), 404
        return jsonify(row_to_dict(cur, row))
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/api/clubs", methods=["POST"])
@login_required
def submit_club():
    data = request.get_json()
    name = data.get("club_name", "").strip()
    desc = data.get("description", "").strip()
    if not name:
        return jsonify({"error": "club_name is required."}), 400
    try:
        conn = get_db()
        cur  = conn.cursor()
        cur.execute("EXEC SubmitClub @ClubName=?, @Description=?, @CreatedBy=?",
                    name, desc, session["user_id"])
        row = cur.fetchone()
        conn.commit()
        conn.close()
        return jsonify({"message": "Club submitted for approval.", "club_id": row[0] if row else None}), 201
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/api/clubs/<int:club_id>/approve", methods=["PUT"])
@role_required("Admin")
def approve_club(club_id):
    try:
        conn = get_db()
        cur  = conn.cursor()
        cur.execute("EXEC ApproveClub @ClubID=?, @AdminID=?", club_id, session["user_id"])
        conn.commit()
        conn.close()
        return jsonify({"message": "Club approved."})
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/api/clubs/<int:club_id>/reject", methods=["PUT"])
@role_required("Admin")
def reject_club(club_id):
    try:
        conn = get_db()
        cur  = conn.cursor()
        cur.execute("EXEC RejectClub @ClubID=?, @AdminID=?", club_id, session["user_id"])
        conn.commit()
        conn.close()
        return jsonify({"message": "Club rejected."})
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/api/clubs/<int:club_id>/members", methods=["GET"])
@login_required
def get_club_members(club_id):
    try:
        conn = get_db()
        cur  = conn.cursor()
        cur.execute(
            "SELECT u.UserID, u.FullName, u.Email, r.RoleName, cm.JoinedAt "
            "FROM ClubMemberships cm "
            "JOIN Users u ON cm.UserID = u.UserID "
            "JOIN Roles r ON u.RoleID = r.RoleID "
            "WHERE cm.ClubID = ?", club_id
        )
        members = rows_to_list(cur, cur.fetchall())
        conn.close()
        return jsonify(members)
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/api/clubs/<int:club_id>/members", methods=["POST"])
@role_required("ClubAdmin", "Admin")
def add_member(club_id):
    data    = request.get_json()
    user_id = data.get("user_id")
    if not user_id:
        return jsonify({"error": "user_id is required."}), 400
    try:
        conn = get_db()
        cur  = conn.cursor()
        cur.execute("EXEC AddStudentToClub @UserID=?, @ClubID=?, @PerformedBy=?",
                    user_id, club_id, session["user_id"])
        conn.commit()
        conn.close()
        return jsonify({"message": "Student added to club."})
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/api/clubs/<int:club_id>/members/<int:user_id>", methods=["DELETE"])
@role_required("ClubAdmin", "Admin")
def remove_member(club_id, user_id):
    try:
        conn = get_db()
        cur  = conn.cursor()
        cur.execute("EXEC RemoveStudentFromClub @UserID=?, @ClubID=?, @PerformedBy=?",
                    user_id, club_id, session["user_id"])
        conn.commit()
        conn.close()
        return jsonify({"message": "Student removed from club."})
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/api/clubs/<int:club_id>/join", methods=["POST"])
@login_required
def join_club(club_id):
    try:
        conn = get_db()
        cur  = conn.cursor()
        set_session_ctx(cur, session["user_id"])
        cur.execute(
            "IF NOT EXISTS (SELECT 1 FROM ClubMemberships WHERE UserID=? AND ClubID=?) "
            "INSERT INTO ClubMemberships (UserID, ClubID) VALUES (?, ?)",
            session["user_id"], club_id, session["user_id"], club_id
        )
        conn.commit()
        conn.close()
        return jsonify({"message": "Joined club."})
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/api/clubs/<int:club_id>/leave", methods=["DELETE"])
@login_required
def leave_club(club_id):
    try:
        conn = get_db()
        cur  = conn.cursor()
        set_session_ctx(cur, session["user_id"])
        cur.execute("DELETE FROM ClubMemberships WHERE UserID=? AND ClubID=?",
                    session["user_id"], club_id)
        conn.commit()
        conn.close()
        return jsonify({"message": "Left club."})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# ===========================================================
# EVENTS ROUTES
# ===========================================================

@app.route("/api/events", methods=["GET"])
@login_required
def get_events():
    """Return events for clubs the user belongs to (or all for admin)."""
    try:
        conn = get_db()
        cur  = conn.cursor()
        if session["role"] == "Admin":
            cur.execute(
                "SELECT e.EventID, e.EventName, e.Description, e.EventDate, e.Location, "
                "c.ClubName, c.ClubID, "
                "(SELECT COUNT(*) FROM Registrations r WHERE r.EventID = e.EventID) AS AttendeeCount "
                "FROM Events e JOIN Clubs c ON e.ClubID = c.ClubID "
                "ORDER BY e.EventDate DESC"
            )
        else:
            cur.execute(
                "SELECT e.EventID, e.EventName, e.Description, e.EventDate, e.Location, "
                "c.ClubName, c.ClubID, "
                "(SELECT COUNT(*) FROM Registrations r WHERE r.EventID = e.EventID) AS AttendeeCount "
                "FROM Events e "
                "JOIN Clubs c ON e.ClubID = c.ClubID "
                "JOIN ClubMemberships cm ON cm.ClubID = c.ClubID AND cm.UserID = ? "
                "WHERE c.ApprovalStatus = 'Approved' "
                "ORDER BY e.EventDate DESC",
                session["user_id"]
            )
        events = rows_to_list(cur, cur.fetchall())
        conn.close()
        return jsonify(events)
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/api/clubs/<int:club_id>/events", methods=["GET"])
@login_required
def get_club_events(club_id):
    try:
        conn = get_db()
        cur  = conn.cursor()
        cur.execute(
            "SELECT e.EventID, e.EventName, e.Description, e.EventDate, e.Location, "
            "(SELECT COUNT(*) FROM Registrations r WHERE r.EventID = e.EventID) AS AttendeeCount "
            "FROM Events e WHERE e.ClubID = ? ORDER BY e.EventDate",
            club_id
        )
        events = rows_to_list(cur, cur.fetchall())
        conn.close()
        return jsonify(events)
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/api/clubs/<int:club_id>/events", methods=["POST"])
@role_required("ClubAdmin", "Admin")
def add_event(club_id):
    data  = request.get_json()
    name  = data.get("event_name", "").strip()
    desc  = data.get("description", "").strip()
    date  = data.get("event_date")
    loc   = data.get("location", "").strip()
    if not name or not date:
        return jsonify({"error": "event_name and event_date are required."}), 400
    try:
        conn = get_db()
        cur  = conn.cursor()
        cur.execute("EXEC AddEvent @ClubID=?, @EventName=?, @Description=?, @EventDate=?, @Location=?, @UserID=?",
                    club_id, name, desc, date, loc, session["user_id"])
        row = cur.fetchone()
        conn.commit()
        conn.close()
        return jsonify({"message": "Event created.", "event_id": row[0] if row else None}), 201
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/api/events/<int:event_id>", methods=["PUT"])
@role_required("ClubAdmin", "Admin")
def edit_event(event_id):
    data = request.get_json()
    name = data.get("event_name", "").strip()
    desc = data.get("description", "").strip()
    date = data.get("event_date")
    loc  = data.get("location", "").strip()
    try:
        conn = get_db()
        cur  = conn.cursor()
        cur.execute("EXEC EditEvent @EventID=?, @EventName=?, @Description=?, @EventDate=?, @Location=?, @UserID=?",
                    event_id, name, desc, date, loc, session["user_id"])
        conn.commit()
        conn.close()
        return jsonify({"message": "Event updated."})
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/api/events/<int:event_id>", methods=["DELETE"])
@role_required("ClubAdmin", "Admin")
def delete_event(event_id):
    try:
        conn = get_db()
        cur  = conn.cursor()
        cur.execute("EXEC DeleteEvent @EventID=?, @UserID=?", event_id, session["user_id"])
        conn.commit()
        conn.close()
        return jsonify({"message": "Event deleted."})
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/api/events/<int:event_id>/register", methods=["POST"])
@login_required
def register_event(event_id):
    try:
        conn = get_db()
        cur  = conn.cursor()
        cur.execute("EXEC RegisterForEvent @EventID=?, @UserID=?", event_id, session["user_id"])
        conn.commit()
        conn.close()
        return jsonify({"message": "Registered for event."})
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/api/events/<int:event_id>/unregister", methods=["DELETE"])
@login_required
def unregister_event(event_id):
    try:
        conn = get_db()
        cur  = conn.cursor()
        cur.execute("EXEC UnregisterFromEvent @EventID=?, @UserID=?", event_id, session["user_id"])
        conn.commit()
        conn.close()
        return jsonify({"message": "Unregistered from event."})
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/api/events/<int:event_id>/attendees", methods=["GET"])
@login_required
def get_event_attendees(event_id):
    try:
        conn = get_db()
        cur  = conn.cursor()
        cur.execute(
            "SELECT u.UserID, u.FullName, u.Email, r.RegistrationDate "
            "FROM Registrations r JOIN Users u ON r.UserID = u.UserID "
            "WHERE r.EventID = ? ORDER BY r.RegistrationDate",
            event_id
        )
        attendees = rows_to_list(cur, cur.fetchall())
        conn.close()
        return jsonify(attendees)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# ===========================================================
# USERS / ADMIN ROUTES
# ===========================================================

@app.route("/api/users", methods=["GET"])
@role_required("Admin")
def get_users():
    try:
        conn = get_db()
        cur  = conn.cursor()
        cur.execute(
            "SELECT u.UserID, u.FullName, u.Email, r.RoleName, u.CreatedAt "
            "FROM Users u JOIN Roles r ON u.RoleID = r.RoleID ORDER BY u.FullName"
        )
        users = rows_to_list(cur, cur.fetchall())
        conn.close()
        return jsonify(users)
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/api/users/<int:user_id>/assign-club-admin", methods=["PUT"])
@role_required("Admin")
def assign_club_admin(user_id):
    try:
        conn = get_db()
        cur  = conn.cursor()
        cur.execute("EXEC AssignClubAdmin @TargetUserID=?, @AdminID=?", user_id, session["user_id"])
        conn.commit()
        conn.close()
        return jsonify({"message": "Club Admin role assigned."})
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/api/users/<int:user_id>/revoke-club-admin", methods=["PUT"])
@role_required("Admin")
def revoke_club_admin(user_id):
    try:
        conn = get_db()
        cur  = conn.cursor()
        cur.execute("EXEC RevokeClubAdmin @TargetUserID=?, @AdminID=?", user_id, session["user_id"])
        conn.commit()
        conn.close()
        return jsonify({"message": "Club Admin role revoked."})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# ===========================================================
# AUDIT LOG
# ===========================================================

@app.route("/api/audit", methods=["GET"])
@role_required("Admin")
def get_audit_log():
    try:
        conn = get_db()
        cur  = conn.cursor()
        cur.execute(
            "SELECT a.LogID, a.TableName, a.ActionType, a.RecordID, "
            "u.FullName AS ActionBy, a.ActionDate "
            "FROM AuditLog a "
            "LEFT JOIN Users u ON a.ActionBy = u.UserID "
            "ORDER BY a.ActionDate DESC"
        )
        logs = rows_to_list(cur, cur.fetchall())
        conn.close()
        return jsonify(logs)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# ===========================================================
# RUN
# ===========================================================

if __name__ == "__main__":
    app.run(debug=True, port=5000)
