USE [master];
GO

IF NOT EXISTS (SELECT * FROM sys.server_principals WHERE name = 'WebAppUser')
BEGIN
    CREATE LOGIN WebAppUser WITH PASSWORD = 'StrongPassword2026!', CHECK_POLICY = ON;
END
GO

-- FIXED: Added the keyword 'SECURITY' for SQL Server 2022 compliance
GRANT VIEW SERVER SECURITY AUDIT TO WebAppUser;
GO
    
USE SecureStudentDB;
GO

IF NOT EXISTS (SELECT * FROM sys.database_principals WHERE name = 'WebAppUser')
BEGIN
    CREATE USER WebAppUser FOR LOGIN WebAppUser;
END
GO

GRANT SELECT, INSERT, UPDATE ON dbo.users TO WebAppUser;
GRANT SELECT, INSERT, UPDATE ON dbo.submissions TO WebAppUser;
GRANT SELECT, INSERT, UPDATE ON dbo.assignments TO WebAppUser;
GRANT SELECT, INSERT, UPDATE ON dbo.grades TO WebAppUser;
GRANT SELECT, INSERT, UPDATE ON dbo.classes TO WebAppUser;
GRANT SELECT, INSERT, UPDATE ON dbo.class_students TO WebAppUser;
GRANT SELECT, INSERT, UPDATE ON dbo.exams TO WebAppUser;
GRANT SELECT, INSERT, UPDATE ON dbo.exam_submissions TO WebAppUser;
GRANT SELECT, INSERT, UPDATE ON dbo.exam_questions TO WebAppUser;
GRANT SELECT, INSERT, UPDATE ON dbo.exam_answers TO WebAppUser;
GRANT SELECT, INSERT, UPDATE ON dbo.password_reset_tokens TO WebAppUser;
GRANT SELECT, INSERT, UPDATE ON dbo.audit_logs TO WebAppUser;
GRANT SELECT, INSERT, UPDATE ON dbo.grade_access_logs TO WebAppUser;
GO

DENY DELETE ON dbo.users TO WebAppUser;
DENY DELETE ON dbo.submissions TO WebAppUser;
DENY DELETE ON dbo.assignments TO WebAppUser;
DENY DELETE ON dbo.grades TO WebAppUser;
DENY DELETE ON dbo.classes TO WebAppUser;
DENY DELETE ON dbo.exams TO WebAppUser;
GO
