USE [master];
GO

-- Create Login for the Application Layer
CREATE LOGIN WebAppUser WITH PASSWORD = 'StrongPassword2026!', CHECK_POLICY = ON;
GO

USE SecureStudentDB;
GO

-- Create Database User mapped to Login
CREATE USER WebAppUser FOR LOGIN WebAppUser;
GO

-- Assign Permissions (Least Privilege)
GRANT SELECT, INSERT ON dbo.Users TO WebAppUser;
GRANT SELECT, INSERT ON dbo.Submissions TO WebAppUser;
GRANT SELECT ON dbo.Assessments TO WebAppUser;

-- Explicitly DENY dangerous actions to prevent Internal Attacks
DENY DELETE ON dbo.Users TO WebAppUser;
DENY DELETE ON dbo.Submissions TO WebAppUser;
GO