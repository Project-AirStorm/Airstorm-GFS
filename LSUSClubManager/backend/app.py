"""
LSUS Campus Event & Club Manager — Flask REST API
Authors: Jadyn Falls, Joshua Francis, Christopher Kouba
"""

import os
import secrets
import pyodbc
import bcrypt
from datetime import datetime
from functools import wraps
from flask import Flask, request, jsonify, g
from flask.json.provider import DefaultJSONProvider
from flask_cors import CORS
from dotenv import load_dotenv

load_dotenv()


class ISODateJSONProvider(DefaultJSONProvider):
    """Serialize datetime objects as ISO 8601 strings instead of RFC 2822.
    Flask 3.x defaults to RFC 2822 (e.g. 'Wed, 01 Apr 2026 10:00:00 GMT'),
    which JavaScript's Date constructor treats as UTC and mis-shifts times.
    ISO strings without a timezone marker are parsed as local time by our
    frontend helper, keeping displayed times correct.
    """
    def default(self, obj):
        if isinstance(obj, datetime):
            return obj.isoformat()
        return super().default(obj)


app = Flask(__name__)
app.json_provider_class = ISODateJSONProvider
app.json = ISODateJSONProvider(app)

CORS(app,
     supports_credentials=True,
     origins=["http://127.0.0.1:5500", "http://localhost:5500",
              "http://127.0.0.1:3000", "http://localhost:3000",
              "null"],
     allow_headers=["Content-Type", "X-Auth-Token"],
     methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"])

# In-memory token store: { token: { user_id, full_name, role, email } }
sessions = {}

# ===========================================================
# DATABASE
# ===========================================================


def get_db():
    server = os.getenv("DB_SERVER", "localhost")
    database = os.getenv("DB_NAME", "LSUSClubManager")
    trusted = os.getenv("DB_TRUSTED_CONNECTION", "yes").lower() == "yes"
    if trusted:
        conn_str = (
            f"DRIVER={{ODBC Driver 17 for SQL Server}};"
            f"SERVER={server};DATABASE={database};Trusted_Connection=yes;"
        )
    else:
        user = os.getenv("DB_USER", "sa")
        password = os.getenv("DB_PASSWORD", "")
        conn_str = (
            f"DRIVER={{ODBC Driver 17 for SQL Server}};"
            f"SERVER={server};DATABASE={database};UID={user};PWD={password};"
        )
    return pyodbc.connect(conn_str)


def set_session_ctx(cursor, user_id):
    cursor.execute(
        "EXEC sp_set_session_context @key=N'UserID', @value=?", user_id)


def rows_to_list(cursor, rows):
    cols = [c[0] for c in cursor.description]
    return [dict(zip(cols, row)) for row in rows]


def row_to_dict(cursor, row):
    cols = [c[0] for c in cursor.description]
    return dict(zip(cols, row))


def parse_dt(s):
    """
    Convert a datetime-local string like '2026-04-01T09:00' or '2026-04-01 09:00'
    into a Python datetime object so pyodbc passes it correctly to SQL Server.
    """
    if not s:
        raise ValueError("Date string is empty.")
    s = s.strip().replace("T", " ")
    for fmt in ("%Y-%m-%d %H:%M:%S", "%Y-%m-%d %H:%M", "%Y-%m-%d"):
        try:
            return datetime.strptime(s, fmt)
        except ValueError:
            continue
    raise ValueError(f"Unrecognised date format: '{s}'")


def user_owns_club(user_id, club_id):
    conn = get_db()
    cur = conn.cursor()
    cur.execute(
        "SELECT 1 FROM Clubs c "
        "JOIN Users u ON u.UserID = c.CreatedBy "
        "JOIN Roles r ON r.RoleID = u.RoleID "
        "WHERE c.ClubID=? AND c.CreatedBy=? AND r.RoleName='ClubAdmin'",
        club_id, user_id)
    ok = cur.fetchone() is not None
    conn.close()
    return ok


def get_event_club_id(event_id):
    conn = get_db()
    cur = conn.cursor()
    cur.execute("SELECT ClubID FROM Events WHERE EventID=?", event_id)
    row = cur.fetchone()
    conn.close()
    return row[0] if row else None

# ===========================================================
# AUTH DECORATORS
# ===========================================================


def get_current_user():
    return sessions.get(request.headers.get("X-Auth-Token"))


def login_required(f):
    @wraps(f)
    def _login_required(*args, **kwargs):
        user = get_current_user()
        if not user:
            return jsonify({"error": "Unauthorized. Please log in."}), 401
        g.user = user
        return f(*args, **kwargs)
    return _login_required


def role_required(*roles):
    def decorator(f):
        @wraps(f)
        def _role_required(*args, **kwargs):
            user = get_current_user()
            if not user:
                return jsonify({"error": "Unauthorized."}), 401
            if user.get("role") not in roles:
                return jsonify({"error": f"Forbidden. Required role(s): {roles}"}), 403
            g.user = user
            return f(*args, **kwargs)
        return _role_required
    return decorator

# ===========================================================
# AUTH
# ===========================================================


@app.route("/api/register", methods=["POST"])
def register():
    d = request.get_json()
    full_name = d.get("full_name", "").strip()
    email = d.get("email", "").strip().lower()
    password = d.get("password", "")
    if not full_name or not email or not password:
        return jsonify({"error": "full_name, email, and password are required."}), 400
    pw_hash = bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()
    try:
        conn = get_db()
        cur = conn.cursor()
        cur.execute("INSERT INTO Users (FullName,Email,PasswordHash,RoleID) VALUES (?,?,?,1)",
                    full_name, email, pw_hash)
        conn.commit()
        conn.close()
        return jsonify({"message": "Registered successfully."}), 201
    except pyodbc.IntegrityError:
        return jsonify({"error": "Email already registered."}), 409
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/api/login", methods=["POST"])
def login():
    d = request.get_json()
    email = d.get("email", "").strip().lower()
    password = d.get("password", "")
    try:
        conn = get_db()
        cur = conn.cursor()
        cur.execute(
            "SELECT u.UserID, u.FullName, u.PasswordHash, r.RoleName "
            "FROM Users u JOIN Roles r ON u.RoleID=r.RoleID WHERE u.Email=?", email)
        row = cur.fetchone()
        conn.close()
        if not row:
            return jsonify({"error": "Invalid credentials."}), 401
        user_id, full_name, pw_hash, role = row
        if not bcrypt.checkpw(password.encode(), pw_hash.encode()):
            return jsonify({"error": "Invalid credentials."}), 401
        token = secrets.token_hex(32)
        sessions[token] = {"user_id": user_id, "full_name": full_name,
                           "role": role, "email": email}
        return jsonify({"message": "Logged in.", "token": token,
                        "user": {"id": user_id, "name": full_name, "role": role}})
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/api/logout", methods=["POST"])
def logout():
    token = request.headers.get("X-Auth-Token")
    sessions.pop(token, None)
    return jsonify({"message": "Logged out."})


@app.route("/api/me", methods=["GET"])
def me():
    user = get_current_user()
    if not user:
        return jsonify({"error": "Not logged in."}), 401
    return jsonify({"id": user["user_id"], "name": user["full_name"],
                    "role": user["role"], "email": user["email"]})

# ===========================================================
# CLUBS
# ===========================================================


@app.route("/api/clubs", methods=["GET"])
@login_required
def get_clubs():
    uid = g.user["user_id"]
    try:
        conn = get_db()
        cur = conn.cursor()
        base_select = (
            "SELECT c.ClubID, c.ClubName, c.Description, c.ApprovalStatus, "
            "u.FullName AS CreatedBy, c.CreatedAt, c.CreatedBy AS CreatedByID, "
            "CASE WHEN cm.UserID IS NOT NULL THEN 1 ELSE 0 END AS IsMember "
            "FROM Clubs c "
            "JOIN Users u ON c.CreatedBy=u.UserID "
            "LEFT JOIN ClubMemberships cm ON cm.ClubID=c.ClubID AND cm.UserID=? "
        )
        if g.user["role"] == "Admin":
            cur.execute(base_select + "ORDER BY c.CreatedAt DESC", uid)
        else:
            cur.execute(
                base_select + "WHERE c.ApprovalStatus='Approved' ORDER BY c.ClubName", uid)
        clubs = rows_to_list(cur, cur.fetchall())
        conn.close()
        return jsonify(clubs)
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/api/clubs/<int:club_id>", methods=["GET"])
@login_required
def get_club(club_id):
    uid = g.user["user_id"]
    try:
        conn = get_db()
        cur = conn.cursor()
        cur.execute(
            "SELECT c.ClubID, c.ClubName, c.Description, c.ApprovalStatus, "
            "u.FullName AS CreatedBy, c.CreatedAt, c.CreatedBy AS CreatedByID, "
            "CASE WHEN cm.UserID IS NOT NULL THEN 1 ELSE 0 END AS IsMember "
            "FROM Clubs c "
            "JOIN Users u ON c.CreatedBy=u.UserID "
            "LEFT JOIN ClubMemberships cm ON cm.ClubID=c.ClubID AND cm.UserID=? "
            "WHERE c.ClubID=?", uid, club_id)
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
    d = request.get_json()
    name = d.get("club_name", "").strip()
    desc = d.get("description", "").strip()
    if not name:
        return jsonify({"error": "club_name is required."}), 400
    try:
        conn = get_db()
        cur = conn.cursor()
        set_session_ctx(cur, g.user["user_id"])
        cur.execute("INSERT INTO Clubs (ClubName,Description,CreatedBy) VALUES (?,?,?)",
                    name, desc, g.user["user_id"])
        conn.commit()
        conn.close()
        return jsonify({"message": "Club submitted for approval."}), 201
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/api/clubs/<int:club_id>/approve", methods=["PUT"])
@role_required("Admin")
def approve_club(club_id):
    try:
        conn = get_db()
        cur = conn.cursor()
        set_session_ctx(cur, g.user["user_id"])
        cur.execute(
            "UPDATE Clubs SET ApprovalStatus='Approved' WHERE ClubID=?", club_id)
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
        cur = conn.cursor()
        set_session_ctx(cur, g.user["user_id"])
        cur.execute(
            "UPDATE Clubs SET ApprovalStatus='Rejected' WHERE ClubID=?", club_id)
        conn.commit()
        conn.close()
        return jsonify({"message": "Club rejected."})
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/api/clubs/<int:club_id>/join", methods=["POST"])
@login_required
def join_club(club_id):
    try:
        conn = get_db()
        cur = conn.cursor()
        set_session_ctx(cur, g.user["user_id"])
        cur.execute(
            "IF NOT EXISTS (SELECT 1 FROM ClubMemberships WHERE UserID=? AND ClubID=?) "
            "INSERT INTO ClubMemberships (UserID,ClubID) VALUES (?,?)",
            g.user["user_id"], club_id, g.user["user_id"], club_id)
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
        cur = conn.cursor()
        set_session_ctx(cur, g.user["user_id"])
        cur.execute("DELETE FROM ClubMemberships WHERE UserID=? AND ClubID=?",
                    g.user["user_id"], club_id)
        conn.commit()
        conn.close()
        return jsonify({"message": "Left club."})
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/api/clubs/<int:club_id>/members", methods=["GET"])
@login_required
def get_club_members(club_id):
    try:
        conn = get_db()
        cur = conn.cursor()
        cur.execute(
            "SELECT u.UserID, u.FullName, u.Email, r.RoleName, cm.JoinedAt "
            "FROM ClubMemberships cm "
            "JOIN Users u ON cm.UserID=u.UserID "
            "JOIN Roles r ON u.RoleID=r.RoleID "
            "WHERE cm.ClubID=?", club_id)
        members = rows_to_list(cur, cur.fetchall())
        conn.close()
        return jsonify(members)
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/api/clubs/<int:club_id>/members", methods=["POST"])
@role_required("ClubAdmin", "Admin")
def add_member(club_id):
    if g.user["role"] == "ClubAdmin" and not user_owns_club(g.user["user_id"], club_id):
        return jsonify({"error": "Forbidden. You can only manage your own club."}), 403
    user_id = (request.get_json() or {}).get("user_id")
    if not user_id:
        return jsonify({"error": "user_id is required."}), 400
    try:
        conn = get_db()
        cur = conn.cursor()
        set_session_ctx(cur, g.user["user_id"])
        cur.execute(
            "IF NOT EXISTS (SELECT 1 FROM ClubMemberships WHERE UserID=? AND ClubID=?) "
            "INSERT INTO ClubMemberships (UserID,ClubID) VALUES (?,?)",
            user_id, club_id, user_id, club_id)
        conn.commit()
        conn.close()
        return jsonify({"message": "Student added to club."})
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/api/clubs/<int:club_id>/members/<int:user_id>", methods=["DELETE"])
@role_required("ClubAdmin", "Admin")
def remove_member(club_id, user_id):
    if g.user["role"] == "ClubAdmin" and not user_owns_club(g.user["user_id"], club_id):
        return jsonify({"error": "Forbidden. You can only manage your own club."}), 403
    try:
        conn = get_db()
        cur = conn.cursor()
        set_session_ctx(cur, g.user["user_id"])
        cur.execute(
            "DELETE FROM ClubMemberships WHERE UserID=? AND ClubID=?", user_id, club_id)
        conn.commit()
        conn.close()
        return jsonify({"message": "Student removed from club."})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# ===========================================================
# EVENTS
# ===========================================================


@app.route("/api/events", methods=["GET"])
@login_required
def get_events():
    uid = g.user["user_id"]
    try:
        conn = get_db()
        cur = conn.cursor()
        base = (
            "SELECT e.EventID, e.EventName, e.Description, e.EventDate, e.Location, "
            "c.ClubName, c.ClubID, "
            "(SELECT COUNT(*) FROM Registrations r2 WHERE r2.EventID=e.EventID) AS AttendeeCount, "
            "CASE WHEN reg.UserID IS NOT NULL THEN 1 ELSE 0 END AS IsRegistered, "
            "CASE WHEN mem.UserID IS NOT NULL THEN 1 ELSE 0 END AS IsMember "
            "FROM Events e "
            "JOIN Clubs c ON e.ClubID=c.ClubID "
            "LEFT JOIN Registrations reg ON reg.EventID=e.EventID AND reg.UserID=? "
            "LEFT JOIN ClubMemberships mem ON mem.ClubID=c.ClubID AND mem.UserID=? "
        )
        if g.user["role"] == "Admin":
            cur.execute(base + "ORDER BY e.EventDate DESC", uid, uid)
        else:
            cur.execute(
                base +
                "JOIN ClubMemberships cm ON cm.ClubID=c.ClubID AND cm.UserID=? "
                "WHERE c.ApprovalStatus='Approved' ORDER BY e.EventDate DESC",
                uid, uid, uid)
        events = rows_to_list(cur, cur.fetchall())
        conn.close()
        return jsonify(events)
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/api/clubs/<int:club_id>/events", methods=["GET"])
@login_required
def get_club_events(club_id):
    uid = g.user["user_id"]
    try:
        conn = get_db()
        cur = conn.cursor()
        cur.execute(
            "SELECT e.EventID, e.EventName, e.Description, e.EventDate, e.Location, "
            "(SELECT COUNT(*) FROM Registrations r2 WHERE r2.EventID=e.EventID) AS AttendeeCount, "
            "CASE WHEN reg.UserID IS NOT NULL THEN 1 ELSE 0 END AS IsRegistered "
            "FROM Events e "
            "LEFT JOIN Registrations reg ON reg.EventID=e.EventID AND reg.UserID=? "
            "WHERE e.ClubID=? ORDER BY e.EventDate",
            uid, club_id)
        events = rows_to_list(cur, cur.fetchall())
        conn.close()
        return jsonify(events)
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/api/clubs/<int:club_id>/events", methods=["POST"])
@role_required("ClubAdmin", "Admin")
def add_event(club_id):
    if g.user["role"] == "ClubAdmin" and not user_owns_club(g.user["user_id"], club_id):
        return jsonify({"error": "Forbidden. You can only add events to your own club."}), 403
    d = request.get_json()
    name = d.get("event_name", "").strip()
    desc = d.get("description", "").strip()
    loc = d.get("location", "").strip()
    date_str = d.get("event_date", "")
    if not name or not date_str:
        return jsonify({"error": "event_name and event_date are required."}), 400
    try:
        dt = parse_dt(date_str)
    except ValueError as e:
        return jsonify({"error": f"Invalid date: {e}"}), 400
    try:
        conn = get_db()
        cur = conn.cursor()
        set_session_ctx(cur, g.user["user_id"])
        cur.execute(
            "INSERT INTO Events (ClubID,EventName,Description,EventDate,Location) VALUES (?,?,?,?,?)",
            club_id, name, desc, dt, loc)
        conn.commit()
        conn.close()
        return jsonify({"message": "Event created."}), 201
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/api/events/<int:event_id>", methods=["PUT"])
@role_required("ClubAdmin", "Admin")
def edit_event(event_id):
    if g.user["role"] == "ClubAdmin":
        cid = get_event_club_id(event_id)
        if not cid or not user_owns_club(g.user["user_id"], cid):
            return jsonify({"error": "Forbidden. You can only edit your own club's events."}), 403
    d = request.get_json()
    name = d.get("event_name", "").strip()
    desc = d.get("description", "").strip()
    loc = d.get("location", "").strip()
    date_str = d.get("event_date", "")
    try:
        dt = parse_dt(date_str)
    except ValueError as e:
        return jsonify({"error": f"Invalid date: {e}"}), 400
    try:
        conn = get_db()
        cur = conn.cursor()
        set_session_ctx(cur, g.user["user_id"])
        cur.execute(
            "UPDATE Events SET EventName=?,Description=?,EventDate=?,Location=? WHERE EventID=?",
            name, desc, dt, loc, event_id)
        conn.commit()
        conn.close()
        return jsonify({"message": "Event updated."})
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/api/events/<int:event_id>", methods=["DELETE"])
@role_required("ClubAdmin", "Admin")
def delete_event(event_id):
    if g.user["role"] == "ClubAdmin":
        cid = get_event_club_id(event_id)
        if not cid or not user_owns_club(g.user["user_id"], cid):
            return jsonify({"error": "Forbidden. You can only delete your own club's events."}), 403
    try:
        conn = get_db()
        cur = conn.cursor()
        set_session_ctx(cur, g.user["user_id"])
        cur.execute("DELETE FROM Registrations WHERE EventID=?", event_id)
        cur.execute("DELETE FROM Events WHERE EventID=?", event_id)
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
        cur = conn.cursor()
        set_session_ctx(cur, g.user["user_id"])
        cur.execute(
            "IF NOT EXISTS (SELECT 1 FROM Registrations WHERE EventID=? AND UserID=?) "
            "INSERT INTO Registrations (EventID,UserID) VALUES (?,?)",
            event_id, g.user["user_id"], event_id, g.user["user_id"])
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
        cur = conn.cursor()
        set_session_ctx(cur, g.user["user_id"])
        cur.execute("DELETE FROM Registrations WHERE EventID=? AND UserID=?",
                    event_id, g.user["user_id"])
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
        cur = conn.cursor()
        cur.execute(
            "SELECT u.UserID, u.FullName, u.Email, r.RegistrationDate "
            "FROM Registrations r JOIN Users u ON r.UserID=u.UserID "
            "WHERE r.EventID=? ORDER BY r.RegistrationDate", event_id)
        attendees = rows_to_list(cur, cur.fetchall())
        conn.close()
        return jsonify(attendees)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# ===========================================================
# USERS / ADMIN
# ===========================================================


@app.route("/api/users", methods=["GET"])
@role_required("Admin")
def get_users():
    try:
        conn = get_db()
        cur = conn.cursor()
        cur.execute(
            "SELECT u.UserID, u.FullName, u.Email, r.RoleName, u.CreatedAt "
            "FROM Users u JOIN Roles r ON u.RoleID=r.RoleID ORDER BY u.FullName")
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
        cur = conn.cursor()
        set_session_ctx(cur, g.user["user_id"])
        cur.execute("UPDATE Users SET RoleID=2 WHERE UserID=?", user_id)
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
        cur = conn.cursor()
        set_session_ctx(cur, g.user["user_id"])
        cur.execute("UPDATE Users SET RoleID=1 WHERE UserID=?", user_id)
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
        cur = conn.cursor()
        cur.execute(
            "SELECT a.LogID, a.TableName, a.ActionType, a.RecordID, "
            "u.FullName AS ActionBy, a.ActionDate "
            "FROM AuditLog a LEFT JOIN Users u ON a.ActionBy=u.UserID "
            "ORDER BY a.ActionDate DESC")
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
