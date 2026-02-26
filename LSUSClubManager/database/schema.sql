-- ==========================================================================================================================
-- LSUS Campus Event & Club Manager - Full Database Schema
-- Authors: Jadyn Falls, Joshua Francis, Christopher Kouba
-- ==========================================================================================================================

-- ==========================================================================================================================
-- DROP TABLES (safe re-run)
-- ==========================================================================================================================

IF OBJECT_ID('AuditLog', 'U') IS NOT NULL DROP TABLE AuditLog;
IF OBJECT_ID('Registrations', 'U') IS NOT NULL DROP TABLE Registrations;
IF OBJECT_ID('Events', 'U') IS NOT NULL DROP TABLE Events;
IF OBJECT_ID('ClubMemberships', 'U') IS NOT NULL DROP TABLE ClubMemberships;
IF OBJECT_ID('Clubs', 'U') IS NOT NULL DROP TABLE Clubs;
IF OBJECT_ID('Users', 'U') IS NOT NULL DROP TABLE Users;
IF OBJECT_ID('Roles', 'U') IS NOT NULL DROP TABLE Roles;
GO

-- ==========================================================================================================================
-- TABLES
-- ==========================================================================================================================

CREATE TABLE Roles (
    RoleID   INT PRIMARY KEY IDENTITY(1,1),
    RoleName VARCHAR(50) NOT NULL UNIQUE
);

CREATE TABLE Users (
    UserID       INT PRIMARY KEY IDENTITY(1,1),
    FullName     VARCHAR(100) NOT NULL,
    Email        VARCHAR(100) NOT NULL UNIQUE,
    PasswordHash VARCHAR(255) NOT NULL,
    RoleID       INT NOT NULL,
    CreatedAt    DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (RoleID) REFERENCES Roles(RoleID)
);

CREATE TABLE Clubs (
    ClubID         INT PRIMARY KEY IDENTITY(1,1),
    ClubName       VARCHAR(100) NOT NULL,
    Description    VARCHAR(500),
    CreatedBy      INT NOT NULL,
    ApprovalStatus VARCHAR(50) DEFAULT 'Pending',   -- Pending | Approved | Rejected
    CreatedAt      DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (CreatedBy) REFERENCES Users(UserID)
);

CREATE TABLE ClubMemberships (
    MembershipID INT PRIMARY KEY IDENTITY(1,1),
    UserID       INT NOT NULL,
    ClubID       INT NOT NULL,
    JoinedAt     DATETIME DEFAULT GETDATE(),
    UNIQUE (UserID, ClubID),
    FOREIGN KEY (UserID) REFERENCES Users(UserID),
    FOREIGN KEY (ClubID) REFERENCES Clubs(ClubID)
);

CREATE TABLE Events (
    EventID     INT PRIMARY KEY IDENTITY(1,1),
    ClubID      INT NOT NULL,
    EventName   VARCHAR(100) NOT NULL,
    Description VARCHAR(500),
    EventDate   DATETIME NOT NULL,
    Location    VARCHAR(100),
    CreatedAt   DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (ClubID) REFERENCES Clubs(ClubID)
);

CREATE TABLE Registrations (
    RegistrationID   INT PRIMARY KEY IDENTITY(1,1),
    EventID          INT NOT NULL,
    UserID           INT NOT NULL,
    RegistrationDate DATETIME DEFAULT GETDATE(),
    UNIQUE (EventID, UserID),
    FOREIGN KEY (EventID) REFERENCES Events(EventID),
    FOREIGN KEY (UserID) REFERENCES Users(UserID)
);

CREATE TABLE AuditLog (
    LogID      INT PRIMARY KEY IDENTITY(1,1),
    TableName  VARCHAR(50),
    ActionType VARCHAR(20),
    RecordID   INT,
    ActionBy   INT,
    ActionDate DATETIME DEFAULT GETDATE()
);
GO

-- ==========================================================================================================================
-- TRIGGERS (Audit)
-- ==========================================================================================================================

CREATE TRIGGER trg_Clubs_Audit ON Clubs AFTER INSERT, UPDATE, DELETE
AS
BEGIN
    DECLARE @UserID INT = CAST(SESSION_CONTEXT(N'UserID') AS INT);
    INSERT INTO AuditLog (TableName, ActionType, RecordID, ActionBy)
    SELECT 'Clubs',
           CASE WHEN EXISTS(SELECT * FROM inserted) AND EXISTS(SELECT * FROM deleted) THEN 'UPDATE'
                WHEN EXISTS(SELECT * FROM inserted) THEN 'INSERT'
                ELSE 'DELETE' END,
           COALESCE(i.ClubID, d.ClubID), @UserID
    FROM inserted i FULL OUTER JOIN deleted d ON i.ClubID = d.ClubID;
END;
GO

CREATE TRIGGER trg_Events_Audit ON Events AFTER INSERT, UPDATE, DELETE
AS
BEGIN
    DECLARE @UserID INT = CAST(SESSION_CONTEXT(N'UserID') AS INT);
    INSERT INTO AuditLog (TableName, ActionType, RecordID, ActionBy)
    SELECT 'Events',
           CASE WHEN EXISTS(SELECT * FROM inserted) AND EXISTS(SELECT * FROM deleted) THEN 'UPDATE'
                WHEN EXISTS(SELECT * FROM inserted) THEN 'INSERT'
                ELSE 'DELETE' END,
           COALESCE(i.EventID, d.EventID), @UserID
    FROM inserted i FULL OUTER JOIN deleted d ON i.EventID = d.EventID;
END;
GO

CREATE TRIGGER trg_Registrations_Audit ON Registrations AFTER INSERT, DELETE
AS
BEGIN
    DECLARE @UserID INT = CAST(SESSION_CONTEXT(N'UserID') AS INT);
    INSERT INTO AuditLog (TableName, ActionType, RecordID, ActionBy)
    SELECT 'Registrations',
           CASE WHEN EXISTS(SELECT * FROM inserted) THEN 'INSERT' ELSE 'DELETE' END,
           COALESCE(i.RegistrationID, d.RegistrationID), @UserID
    FROM inserted i FULL OUTER JOIN deleted d ON i.RegistrationID = d.RegistrationID;
END;
GO

CREATE TRIGGER trg_ClubMemberships_Audit ON ClubMemberships AFTER INSERT, DELETE
AS
BEGIN
    DECLARE @UserID INT = CAST(SESSION_CONTEXT(N'UserID') AS INT);
    INSERT INTO AuditLog (TableName, ActionType, RecordID, ActionBy)
    SELECT 'ClubMemberships',
           CASE WHEN EXISTS(SELECT * FROM inserted) THEN 'INSERT' ELSE 'DELETE' END,
           COALESCE(i.MembershipID, d.MembershipID), @UserID
    FROM inserted i FULL OUTER JOIN deleted d ON i.MembershipID = d.MembershipID;
END;
GO

-- When a member leaves a club:
--   1. Remove their event registrations for all events in that club.
--   2. If they were the ClubAdmin who created that club (and have no other
--      clubs they created), demote their role back to Student.
CREATE TRIGGER trg_ClubMemberships_Cleanup ON ClubMemberships AFTER DELETE
AS
BEGIN
    SET NOCOUNT ON;

    -- 1. Drop registrations for events belonging to the club(s) just left
    DELETE r
    FROM Registrations r
    JOIN Events e ON r.EventID = e.EventID
    JOIN deleted d ON e.ClubID = d.ClubID AND r.UserID = d.UserID;

    -- 2. Demote to Student if the leaving user created that specific club
    --    and no longer has any other club they created.
    UPDATE u
    SET u.RoleID = (SELECT RoleID FROM Roles WHERE RoleName = 'Student')
    FROM Users u
    JOIN deleted d ON u.UserID = d.UserID
    JOIN Clubs  c ON c.ClubID = d.ClubID AND c.CreatedBy = d.UserID
    WHERE u.RoleID = (SELECT RoleID FROM Roles WHERE RoleName = 'ClubAdmin')
      AND NOT EXISTS (
          SELECT 1 FROM Clubs c2
          WHERE c2.CreatedBy = d.UserID
            AND c2.ClubID   != d.ClubID
      );
END;
GO

-- ==========================================================================================================================
-- STORED PROCEDURES
-- ==========================================================================================================================

-- Submit a new club (creates in Pending state)
CREATE PROCEDURE SubmitClub
    @ClubName    VARCHAR(100),
    @Description VARCHAR(500),
    @CreatedBy   INT
AS
BEGIN
    EXEC sp_set_session_context @key = N'UserID', @value = @CreatedBy;
    INSERT INTO Clubs (ClubName, Description, CreatedBy)
    VALUES (@ClubName, @Description, @CreatedBy);
    SELECT SCOPE_IDENTITY() AS NewClubID;
END;
GO

-- Approve a club submission
CREATE PROCEDURE ApproveClub
    @ClubID  INT,
    @AdminID INT
AS
BEGIN
    EXEC sp_set_session_context @key = N'UserID', @value = @AdminID;
    UPDATE Clubs SET ApprovalStatus = 'Approved' WHERE ClubID = @ClubID;
END;
GO

-- Reject a club submission
CREATE PROCEDURE RejectClub
    @ClubID  INT,
    @AdminID INT
AS
BEGIN
    EXEC sp_set_session_context @key = N'UserID', @value = @AdminID;
    UPDATE Clubs SET ApprovalStatus = 'Rejected' WHERE ClubID = @ClubID;
END;
GO

-- Add an event to a club
CREATE PROCEDURE AddEvent
    @ClubID      INT,
    @EventName   VARCHAR(100),
    @Description VARCHAR(500),
    @EventDate   DATETIME,
    @Location    VARCHAR(100),
    @UserID      INT
AS
BEGIN
    EXEC sp_set_session_context @key = N'UserID', @value = @UserID;
    INSERT INTO Events (ClubID, EventName, Description, EventDate, Location)
    VALUES (@ClubID, @EventName, @Description, @EventDate, @Location);
    SELECT SCOPE_IDENTITY() AS NewEventID;
END;
GO

-- Edit an event
CREATE PROCEDURE EditEvent
    @EventID     INT,
    @EventName   VARCHAR(100),
    @Description VARCHAR(500),
    @EventDate   DATETIME,
    @Location    VARCHAR(100),
    @UserID      INT
AS
BEGIN
    EXEC sp_set_session_context @key = N'UserID', @value = @UserID;
    UPDATE Events
    SET EventName   = @EventName,
        Description = @Description,
        EventDate   = @EventDate,
        Location    = @Location
    WHERE EventID = @EventID;
END;
GO

-- Delete an event
CREATE PROCEDURE DeleteEvent
    @EventID INT,
    @UserID  INT
AS
BEGIN
    EXEC sp_set_session_context @key = N'UserID', @value = @UserID;
    DELETE FROM Registrations WHERE EventID = @EventID;
    DELETE FROM Events         WHERE EventID = @EventID;
END;
GO

-- Register a student for an event
CREATE PROCEDURE RegisterForEvent
    @EventID INT,
    @UserID  INT
AS
BEGIN
    EXEC sp_set_session_context @key = N'UserID', @value = @UserID;
    IF NOT EXISTS (SELECT 1 FROM Registrations WHERE EventID = @EventID AND UserID = @UserID)
        INSERT INTO Registrations (EventID, UserID) VALUES (@EventID, @UserID);
END;
GO

-- Unregister a student from an event
CREATE PROCEDURE UnregisterFromEvent
    @EventID INT,
    @UserID  INT
AS
BEGIN
    EXEC sp_set_session_context @key = N'UserID', @value = @UserID;
    DELETE FROM Registrations WHERE EventID = @EventID AND UserID = @UserID;
END;
GO

-- Add a student to a club
CREATE PROCEDURE AddStudentToClub
    @UserID      INT,
    @ClubID      INT,
    @PerformedBy INT
AS
BEGIN
    EXEC sp_set_session_context @key = N'UserID', @value = @PerformedBy;
    IF NOT EXISTS (SELECT 1 FROM ClubMemberships WHERE UserID = @UserID AND ClubID = @ClubID)
        INSERT INTO ClubMemberships (UserID, ClubID) VALUES (@UserID, @ClubID);
END;
GO

-- Remove a student from a club
CREATE PROCEDURE RemoveStudentFromClub
    @UserID      INT,
    @ClubID      INT,
    @PerformedBy INT
AS
BEGIN
    EXEC sp_set_session_context @key = N'UserID', @value = @PerformedBy;
    DELETE FROM ClubMemberships WHERE UserID = @UserID AND ClubID = @ClubID;
END;
GO

-- Assign Club Admin role to a student
CREATE PROCEDURE AssignClubAdmin
    @TargetUserID INT,
    @AdminID      INT
AS
BEGIN
    EXEC sp_set_session_context @key = N'UserID', @value = @AdminID;
    UPDATE Users SET RoleID = 2 WHERE UserID = @TargetUserID;
END;
GO

-- Revoke Club Admin role (back to Student)
CREATE PROCEDURE RevokeClubAdmin
    @TargetUserID INT,
    @AdminID      INT
AS
BEGIN
    EXEC sp_set_session_context @key = N'UserID', @value = @AdminID;
    UPDATE Users SET RoleID = 1 WHERE UserID = @TargetUserID;
END;
GO

-- ==========================================================================================================================
-- VIEWS (useful read queries)
-- ==========================================================================================================================

CREATE VIEW vw_ApprovedClubs AS
SELECT c.ClubID, c.ClubName, c.Description, u.FullName AS CreatedBy, c.CreatedAt
FROM Clubs c
JOIN Users u ON c.CreatedBy = u.UserID
WHERE c.ApprovalStatus = 'Approved';
GO

CREATE VIEW vw_EventsWithClub AS
SELECT e.EventID, e.EventName, e.Description, e.EventDate, e.Location,
       c.ClubName, c.ClubID
FROM Events e
JOIN Clubs c ON e.ClubID = c.ClubID
WHERE c.ApprovalStatus = 'Approved';
GO

CREATE VIEW vw_RegistrationCounts AS
SELECT e.EventID, e.EventName, COUNT(r.RegistrationID) AS AttendeeCount
FROM Events e
LEFT JOIN Registrations r ON e.EventID = r.EventID
GROUP BY e.EventID, e.EventName;
GO

-- ==========================================================================================================================
-- SEED DATA
-- ==========================================================================================================================

INSERT INTO Roles (RoleName) VALUES ('Student'), ('ClubAdmin'), ('Admin');

-- Passwords are bcrypt hashes of: student123, clubadmin123, admin123
INSERT INTO Users (FullName, Email, PasswordHash, RoleID) VALUES
('John Student',    'john@lsus.edu',    '$2b$12$eKH3e1y2z3M4n5o6p7q8r.SomeHashForStudent',   1),
('Sarah ClubAdmin', 'sarah@lsus.edu',   '$2b$12$aBC1d2e3f4G5h6i7j8k9l.SomeHashForClubAdmin', 2),
('Mike Admin',      'mike@lsus.edu',    '$2b$12$xYZ9a8b7c6D5e4f3g2h1i.SomeHashForAdmin',     3),
('Alice Student',   'alice@lsus.edu',   '$2b$12$eKH3e1y2z3M4n5o6p7q8r.SomeHashForStudent',   1),
('Bob Student',     'bob@lsus.edu',     '$2b$12$eKH3e1y2z3M4n5o6p7q8r.SomeHashForStudent',   1);
GO

-- NOTE: Run the Flask app which will create real bcrypt hashes.
-- Or manually hash passwords with: python -c "import bcrypt; print(bcrypt.hashpw(b'password', bcrypt.gensalt()).decode())"
-- Then UPDATE Users SET PasswordHash = '<hash>' WHERE Email = '<email>';

EXEC SubmitClub @ClubName='Tech Club',   @Description='Technology and programming enthusiasts.', @CreatedBy=2;
EXEC SubmitClub @ClubName='Art Society', @Description='Visual arts, painting, and design.',       @CreatedBy=1;
EXEC ApproveClub @ClubID=1, @AdminID=3;

EXEC AddEvent @ClubID=1, @EventName='Hackathon 2026',  @Description='24-hour coding challenge.', @EventDate='2026-04-01 09:00', @Location='Room 101', @UserID=2;
EXEC AddEvent @ClubID=1, @EventName='Python Workshop', @Description='Intro to Python scripting.', @EventDate='2026-03-15 14:00', @Location='Lab 202', @UserID=2;

EXEC AddStudentToClub @UserID=1, @ClubID=1, @PerformedBy=2;
EXEC RegisterForEvent @EventID=1, @UserID=1;

SELECT * FROM AuditLog;
GO
