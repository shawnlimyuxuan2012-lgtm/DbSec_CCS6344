USE [master];
GO

-- ============================================================
-- 1. SERVER LOGINS  (one per application role + one for DBA)
-- ============================================================

-- Admin application login
IF NOT EXISTS (SELECT 1 FROM sys.server_principals WHERE name = 'AppAdmin')
    CREATE LOGIN AppAdmin
        WITH PASSWORD        = 'Admin@SecureDB2026!',
             CHECK_POLICY    = ON,
             CHECK_EXPIRATION = ON;
GO

-- Lecturer application login
IF NOT EXISTS (SELECT 1 FROM sys.server_principals WHERE name = 'AppLecturer')
    CREATE LOGIN AppLecturer
        WITH PASSWORD        = 'Lecturer@SecureDB2026!',
             CHECK_POLICY    = ON,
             CHECK_EXPIRATION = ON;
GO

-- Student application login
IF NOT EXISTS (SELECT 1 FROM sys.server_principals WHERE name = 'AppStudent')
    CREATE LOGIN AppStudent
        WITH PASSWORD        = 'Student@SecureDB2026!',
             CHECK_POLICY    = ON,
             CHECK_EXPIRATION = ON;
GO

-- Read-only audit/reporting login
IF NOT EXISTS (SELECT 1 FROM sys.server_principals WHERE name = 'AppAuditReader')
    CREATE LOGIN AppAuditReader
        WITH PASSWORD        = 'AuditReader@SecureDB2026!',
             CHECK_POLICY    = ON,
             CHECK_EXPIRATION = ON;
GO

-- Grant the audit-reader login the right to read SQL Audit files
GRANT VIEW SERVER SECURITY AUDIT TO AppAuditReader;
GRANT VIEW SERVER SECURITY AUDIT TO AppAdmin;
GO

-- ============================================================
-- 2. SWITCH TO THE APPLICATION DATABASE
-- ============================================================
USE SecureStudentDB;
GO

-- ============================================================
-- 3. DATABASE USERS  (map logins → users in this DB)
-- ============================================================
IF NOT EXISTS (SELECT 1 FROM sys.database_principals WHERE name = 'AppAdmin')
    CREATE USER AppAdmin FOR LOGIN AppAdmin;
GO

IF NOT EXISTS (SELECT 1 FROM sys.database_principals WHERE name = 'AppLecturer')
    CREATE USER AppLecturer FOR LOGIN AppLecturer;
GO

IF NOT EXISTS (SELECT 1 FROM sys.database_principals WHERE name = 'AppStudent')
    CREATE USER AppStudent FOR LOGIN AppStudent;
GO

IF NOT EXISTS (SELECT 1 FROM sys.database_principals WHERE name = 'AppAuditReader')
    CREATE USER AppAuditReader FOR LOGIN AppAuditReader;
GO

-- ============================================================
-- 4. DATABASE ROLES  (logical groupings of permissions)
-- ============================================================
IF NOT EXISTS (SELECT 1 FROM sys.database_principals WHERE name = 'Role_Admin' AND type = 'R')
    CREATE ROLE Role_Admin;
GO

IF NOT EXISTS (SELECT 1 FROM sys.database_principals WHERE name = 'Role_Lecturer' AND type = 'R')
    CREATE ROLE Role_Lecturer;
GO

IF NOT EXISTS (SELECT 1 FROM sys.database_principals WHERE name = 'Role_Student' AND type = 'R')
    CREATE ROLE Role_Student;
GO

IF NOT EXISTS (SELECT 1 FROM sys.database_principals WHERE name = 'Role_AuditReader' AND type = 'R')
    CREATE ROLE Role_AuditReader;
GO

-- ============================================================
-- 5. ASSIGN USERS TO ROLES
-- ============================================================
ALTER ROLE Role_Admin        ADD MEMBER AppAdmin;
ALTER ROLE Role_Lecturer     ADD MEMBER AppLecturer;
ALTER ROLE Role_Student      ADD MEMBER AppStudent;
ALTER ROLE Role_AuditReader  ADD MEMBER AppAuditReader;
GO

-- ============================================================
-- 6. ROLE PERMISSIONS
-- ============================================================

---------------------------------------------------------------
-- Role_Admin
---------------------------------------------------------------
GRANT SELECT, INSERT, UPDATE, DELETE ON dbo.users              TO Role_Admin;
GRANT SELECT, INSERT, UPDATE, DELETE ON dbo.classes            TO Role_Admin;
GRANT SELECT, INSERT, UPDATE, DELETE ON dbo.class_students     TO Role_Admin;
GRANT SELECT, INSERT, UPDATE, DELETE ON dbo.assignments        TO Role_Admin;
GRANT SELECT, INSERT, UPDATE, DELETE ON dbo.submissions        TO Role_Admin;
GRANT SELECT, INSERT, UPDATE, DELETE ON dbo.grades             TO Role_Admin;
GRANT SELECT, INSERT, UPDATE, DELETE ON dbo.exams              TO Role_Admin;
GRANT SELECT, INSERT, UPDATE, DELETE ON dbo.exam_questions     TO Role_Admin;
GRANT SELECT, INSERT, UPDATE, DELETE ON dbo.exam_submissions   TO Role_Admin;
GRANT SELECT, INSERT, UPDATE, DELETE ON dbo.exam_answers       TO Role_Admin;
GRANT SELECT, INSERT, UPDATE, DELETE ON dbo.password_reset_tokens TO Role_Admin;
GRANT SELECT, INSERT, UPDATE         ON dbo.audit_logs         TO Role_Admin;
GRANT SELECT, INSERT, UPDATE         ON dbo.grade_access_logs  TO Role_Admin;
DENY DELETE ON dbo.audit_logs        TO Role_Admin;
DENY DELETE ON dbo.grade_access_logs TO Role_Admin;
GO

---------------------------------------------------------------
-- Role_Lecturer
---------------------------------------------------------------
GRANT SELECT ON dbo.users             TO Role_Lecturer;
GRANT SELECT, INSERT, UPDATE          ON dbo.classes            TO Role_Lecturer;
GRANT SELECT, INSERT, DELETE          ON dbo.class_students     TO Role_Lecturer;
GRANT SELECT, INSERT, UPDATE          ON dbo.assignments        TO Role_Lecturer;
DENY  DELETE                          ON dbo.assignments        TO Role_Lecturer;
GRANT SELECT                          ON dbo.submissions        TO Role_Lecturer;
GRANT SELECT, INSERT, UPDATE          ON dbo.grades             TO Role_Lecturer;
DENY  DELETE                          ON dbo.grades             TO Role_Lecturer;
GRANT SELECT, INSERT, UPDATE          ON dbo.exams              TO Role_Lecturer;
DENY  DELETE                          ON dbo.exams              TO Role_Lecturer;
GRANT SELECT, INSERT, UPDATE, DELETE  ON dbo.exam_questions     TO Role_Lecturer;
GRANT SELECT, INSERT, UPDATE          ON dbo.exam_submissions   TO Role_Lecturer;
GRANT SELECT, INSERT, UPDATE          ON dbo.exam_answers       TO Role_Lecturer;
GRANT INSERT                          ON dbo.audit_logs         TO Role_Lecturer;
GRANT INSERT                          ON dbo.grade_access_logs  TO Role_Lecturer;
DENY  SELECT, UPDATE, DELETE          ON dbo.audit_logs         TO Role_Lecturer;
DENY  SELECT, UPDATE, DELETE          ON dbo.grade_access_logs  TO Role_Lecturer;
DENY  SELECT, INSERT, UPDATE, DELETE  ON dbo.password_reset_tokens TO Role_Lecturer;
GO

---------------------------------------------------------------
-- Role_Student
---------------------------------------------------------------
GRANT SELECT                          ON dbo.users              TO Role_Student;
DENY  INSERT, UPDATE, DELETE          ON dbo.users              TO Role_Student;
GRANT SELECT                          ON dbo.classes            TO Role_Student;
GRANT SELECT, INSERT                  ON dbo.class_students     TO Role_Student;
DENY  UPDATE, DELETE                  ON dbo.class_students     TO Role_Student;
GRANT SELECT                          ON dbo.assignments        TO Role_Student;
DENY  INSERT, UPDATE, DELETE          ON dbo.assignments        TO Role_Student;
GRANT SELECT, INSERT, UPDATE          ON dbo.submissions        TO Role_Student;
DENY  DELETE                          ON dbo.submissions        TO Role_Student;
GRANT SELECT                          ON dbo.grades             TO Role_Student;
DENY  INSERT, UPDATE, DELETE          ON dbo.grades             TO Role_Student;
GRANT SELECT                          ON dbo.exams              TO Role_Student;
GRANT SELECT                          ON dbo.exam_questions     TO Role_Student;
GRANT SELECT, INSERT                  ON dbo.exam_submissions   TO Role_Student;
GRANT SELECT, INSERT                  ON dbo.exam_answers       TO Role_Student;
DENY  UPDATE, DELETE                  ON dbo.exam_submissions   TO Role_Student;
DENY  UPDATE, DELETE                  ON dbo.exam_answers       TO Role_Student;
GRANT INSERT                          ON dbo.audit_logs         TO Role_Student;
GRANT INSERT                          ON dbo.grade_access_logs  TO Role_Student;
DENY  SELECT, UPDATE, DELETE          ON dbo.audit_logs         TO Role_Student;
DENY  SELECT, UPDATE, DELETE          ON dbo.grade_access_logs  TO Role_Student;
GRANT SELECT, INSERT, UPDATE          ON dbo.password_reset_tokens TO Role_Student;
DENY  DELETE                          ON dbo.password_reset_tokens TO Role_Student;
DENY  SELECT                          ON dbo.exam_answers       TO Role_Student;
GO
---------------------------------------------------------------
-- Role_AuditReader
---------------------------------------------------------------
GRANT SELECT ON dbo.audit_logs        TO Role_AuditReader;
GRANT SELECT ON dbo.grade_access_logs TO Role_AuditReader;
DENY  SELECT ON dbo.users             TO Role_AuditReader; 
DENY  SELECT ON dbo.grades            TO Role_AuditReader;
DENY  SELECT ON dbo.submissions       TO Role_AuditReader;
GO

-- ============================================================
-- 7. COLUMN-LEVEL SECURITY
-- ============================================================

-- Students must not see other users' password hashes
DENY SELECT ON dbo.users(password_hash) TO Role_Student;

-- Lecturers must not see password hashes
DENY SELECT ON dbo.users(password_hash) TO Role_Lecturer;

-- Audit reader must not see hashes or PDPA fields
DENY SELECT ON dbo.users(password_hash) TO Role_AuditReader;
DENY SELECT ON dbo.users(pdpa_consent)  TO Role_AuditReader;
GO

-- ============================================================
-- 8. STORED PROCEDURES
-- ============================================================

-- sp_GetMyProfile – students/lecturers fetch their own row safely
IF OBJECT_ID('dbo.sp_GetMyProfile', 'P') IS NOT NULL
    DROP PROCEDURE dbo.sp_GetMyProfile;
GO
CREATE PROCEDURE dbo.sp_GetMyProfile
    @userId INT
AS
BEGIN
    SET NOCOUNT ON;
    SELECT id, name, email, role, pdpa_consent, created_at
    FROM   dbo.users
    WHERE  id = @userId AND is_deleted = 0;
END;
GO
GRANT EXECUTE ON dbo.sp_GetMyProfile TO Role_Student;
GRANT EXECUTE ON dbo.sp_GetMyProfile TO Role_Lecturer;
GO

-- sp_GetMyGrades – student sees only own grades
IF OBJECT_ID('dbo.sp_GetMyGrades', 'P') IS NOT NULL
    DROP PROCEDURE dbo.sp_GetMyGrades;
GO
CREATE PROCEDURE dbo.sp_GetMyGrades
    @studentId INT
AS
BEGIN
    SET NOCOUNT ON;
    SELECT g.id, g.score, g.feedback, g.graded_at,
           a.title AS assignment_title, a.course_code, a.max_score
    FROM   dbo.grades       g
    JOIN   dbo.submissions  s ON s.id = g.submission_id
    JOIN   dbo.assignments  a ON a.id = s.assignment_id
    WHERE  s.student_id = @studentId;
END;
GO
GRANT EXECUTE ON dbo.sp_GetMyGrades TO Role_Student;
GO

-- sp_SoftDeleteUser – admin soft-deletes a user
IF OBJECT_ID('dbo.sp_SoftDeleteUser', 'P') IS NOT NULL
    DROP PROCEDURE dbo.sp_SoftDeleteUser;
GO
CREATE PROCEDURE dbo.sp_SoftDeleteUser
    @targetId INT
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE dbo.users
    SET    is_deleted = 1, updated_at = GETDATE()
    WHERE  id = @targetId;
END;
GO
GRANT EXECUTE ON dbo.sp_SoftDeleteUser TO Role_Admin;
GO

-- sp_AuthenticateUser – auth user login
IF OBJECT_ID('dbo.sp_AuthenticateUser', 'P') IS NOT NULL
    DROP PROCEDURE dbo.sp_AuthenticateUser;
GO
CREATE PROCEDURE dbo.sp_AuthenticateUser
    @email NVARCHAR(255)
AS
BEGIN
    SET NOCOUNT ON;
    SELECT id, name, email, password_hash, role
    FROM   dbo.users
    WHERE  email      = @email
      AND  is_deleted = 0;
END;
GO
GRANT EXECUTE ON dbo.sp_AuthenticateUser TO Role_Student;
GRANT EXECUTE ON dbo.sp_AuthenticateUser TO Role_Lecturer;
GRANT EXECUTE ON dbo.sp_AuthenticateUser TO Role_Admin;
GO
