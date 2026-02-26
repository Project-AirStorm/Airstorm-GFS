# LSUS Campus Event & Club Manager

**Authors:** Jadyn Falls · Joshua Francis · Christopher Kouba  
**Stack:** Microsoft SQL Server (SSMS) · Python Flask · HTML/CSS/JavaScript

---

## Project Structure

```
lsus-club-manager/
├── database/
│   └── schema.sql          ← All tables, triggers, stored procs, seed data
├── backend/
│   ├── app.py              ← Flask REST API (all endpoints)
│   ├── requirements.txt    ← Python dependencies
│   └── .env.example        ← Copy to .env and configure
└── frontend/
    └── index.html          ← Full single-file frontend (open in browser)
```

---

## Step 1 — Set Up the Database in SSMS

### 1.1 Open SQL Server Management Studio (SSMS)
- Launch SSMS
- In the "Connect to Server" dialog:
  - **Server type:** Database Engine
  - **Server name:** `localhost` (or `.\SQLEXPRESS` if using Express edition)
  - **Authentication:** Windows Authentication (recommended) OR SQL Server Authentication

### 1.2 Create the Database
In a new query window, run:
```sql
CREATE DATABASE LSUSClubManager;
GO
USE LSUSClubManager;
GO
```

### 1.3 Run the Schema Script
- Open `database/schema.sql` in SSMS  
  (File → Open → File → navigate to schema.sql)
- Make sure the target database is `LSUSClubManager` in the dropdown
- Press **F5** or click **Execute**

This will create:
- 7 tables (Roles, Users, Clubs, ClubMemberships, Events, Registrations, AuditLog)
- 4 audit triggers
- 12 stored procedures
- 3 views
- Sample seed data

### 1.4 Verify It Worked
```sql
USE LSUSClubManager;
SELECT * FROM Roles;
SELECT * FROM Users;
SELECT * FROM AuditLog;
```

---

## Step 2 — Set Up the Python Flask Backend

### 2.1 Prerequisites
- Python 3.9+ installed
- ODBC Driver 17 for SQL Server installed

**Install ODBC Driver 17 (if not already installed):**
Download from Microsoft:  
https://learn.microsoft.com/en-us/sql/connect/odbc/download-odbc-driver-for-sql-server

### 2.2 Install Python Dependencies
Open a terminal/command prompt in the `backend/` folder:

```bash
cd backend
pip install -r requirements.txt
```

### 2.3 Configure the .env File
Copy `.env.example` to `.env`:

```bash
copy .env.example .env       # Windows
cp .env.example .env         # Mac/Linux
```

Edit `.env`:

**Option A — Windows Authentication (Trusted Connection, recommended):**
```
DB_SERVER=localhost
DB_NAME=LSUSClubManager
DB_TRUSTED_CONNECTION=yes
SECRET_KEY=any-random-string-here-change-me
```

**Option B — SQL Server Authentication (if using a SQL login):**
```
DB_SERVER=localhost
DB_NAME=LSUSClubManager
DB_TRUSTED_CONNECTION=no
DB_USER=sa
DB_PASSWORD=YourPassword123
SECRET_KEY=any-random-string-here-change-me
```

> **Note on server name:** If using SQL Server Express, your server name may be
> `localhost\SQLEXPRESS` or `.\SQLEXPRESS`. Check SSMS → Object Explorer for the exact name.

### 2.4 Fix the Seed Data Passwords
The schema.sql seeds fake bcrypt hashes. To set real passwords, run this once:

```bash
python - <<'EOF'
import bcrypt
passwords = {'student123': 'john@lsus.edu', 'student123': 'alice@lsus.edu', 'clubadmin123': 'sarah@lsus.edu', 'admin123': 'mike@lsus.edu'}
for pw, email in passwords.items():
    h = bcrypt.hashpw(pw.encode(), bcrypt.gensalt()).decode()
    print(f"UPDATE Users SET PasswordHash='{h}' WHERE Email='{email}';")
EOF
```

Copy the output and run it in SSMS. This sets real bcrypt hashes for the demo accounts.

**Demo account credentials:**
| Email | Password | Role |
|-------|----------|------|
| john@lsus.edu | student123 | Student |
| alice@lsus.edu | student123 | Student |
| sarah@lsus.edu | clubadmin123 | ClubAdmin |
| mike@lsus.edu | admin123 | Admin |

### 2.5 Start the Flask Server
```bash
cd backend
python app.py
```

You should see:
```
 * Running on http://127.0.0.1:5000
 * Debug mode: on
```

---

## Step 3 — Open the Frontend

1. Navigate to the `frontend/` folder
2. Open `index.html` in a browser  
   (double-click, or right-click → Open with Chrome/Edge)

> **Tip:** For best results, use a local server like VS Code's **Live Server** extension.
> Right-click `index.html` → "Open with Live Server" (runs at http://127.0.0.1:5500)

3. Log in with one of the demo accounts listed above.

---

## API Endpoints Reference

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/register | Register new student account |
| POST | /api/login | Log in |
| POST | /api/logout | Log out |
| GET  | /api/me | Get current user info |

### Clubs
| Method | Endpoint | Role Required |
|--------|----------|---------------|
| GET    | /api/clubs | Any logged-in user |
| POST   | /api/clubs | Any logged-in user |
| GET    | /api/clubs/:id | Any logged-in user |
| PUT    | /api/clubs/:id/approve | Admin only |
| PUT    | /api/clubs/:id/reject | Admin only |
| POST   | /api/clubs/:id/join | Any logged-in user |
| DELETE | /api/clubs/:id/leave | Any logged-in user |
| GET    | /api/clubs/:id/members | Any logged-in user |
| POST   | /api/clubs/:id/members | ClubAdmin, Admin |
| DELETE | /api/clubs/:id/members/:uid | ClubAdmin, Admin |

### Events
| Method | Endpoint | Role Required |
|--------|----------|---------------|
| GET    | /api/events | Any logged-in user |
| GET    | /api/clubs/:id/events | Any logged-in user |
| POST   | /api/clubs/:id/events | ClubAdmin, Admin |
| PUT    | /api/events/:id | ClubAdmin, Admin |
| DELETE | /api/events/:id | ClubAdmin, Admin |
| POST   | /api/events/:id/register | Any logged-in user |
| DELETE | /api/events/:id/unregister | Any logged-in user |
| GET    | /api/events/:id/attendees | Any logged-in user |

### Admin
| Method | Endpoint | Role Required |
|--------|----------|---------------|
| GET    | /api/users | Admin only |
| PUT    | /api/users/:id/assign-club-admin | Admin only |
| PUT    | /api/users/:id/revoke-club-admin | Admin only |
| GET    | /api/audit | Admin only |

---

## Role Permissions Summary

| Feature | Student | ClubAdmin | Admin |
|---------|---------|-----------|-------|
| Register/login | ✅ | ✅ | ✅ |
| View approved clubs | ✅ | ✅ | ✅ |
| Submit club for review | ✅ | ✅ | ✅ |
| Join/leave clubs | ✅ | ✅ | ✅ |
| Register for events | ✅ | ✅ | ✅ |
| View event attendees | ✅ | ✅ | ✅ |
| Add/edit/delete events | ❌ | ✅ | ✅ |
| Add/remove members | ❌ | ✅ | ✅ |
| Approve/reject clubs | ❌ | ❌ | ✅ |
| Assign/revoke ClubAdmin | ❌ | ❌ | ✅ |
| View audit log | ❌ | ❌ | ✅ |
| View all users | ❌ | ❌ | ✅ |

---

## Troubleshooting

**"Login failed for user" error from Flask:**
- Check your `.env` DB_SERVER, DB_NAME, and credentials
- For Windows Auth, make sure `DB_TRUSTED_CONNECTION=yes`
- Try server name `.\SQLEXPRESS` or `localhost,1433`

**CORS error in browser:**
- Make sure Flask is running on port 5000
- If using a port other than 5500 for the frontend, add it to the CORS origins in `app.py`

**pyodbc.Error: [IM002] Data source name not found:**
- Install ODBC Driver 17 for SQL Server from Microsoft's website

**"No module named 'pyodbc'":**
- Run: `pip install pyodbc`

**Database already exists error:**
- The DROP TABLE statements at the top of schema.sql safely re-run without errors

---

## Database Design Notes (3NF)

- **Roles** → normalized role definitions (no redundant role strings in Users)
- **Users** → single record per person, FK to Roles
- **Clubs** → FK to Users (creator), status field for approval workflow
- **ClubMemberships** → junction table (UserID, ClubID) with UNIQUE constraint
- **Events** → FK to Clubs
- **Registrations** → junction table (EventID, UserID) with UNIQUE constraint
- **AuditLog** → append-only, written by triggers via SESSION_CONTEXT

All triggers use `sp_set_session_context` to pass UserID into the audit log without modifying trigger logic.
