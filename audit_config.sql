USE [master];
GO

IF NOT EXISTS (SELECT * FROM sys.server_audits WHERE name = 'StudentServerAudit')
BEGIN
    CREATE SERVER AUDIT StudentServerAudit
    TO FILE ( FILEPATH = 'C:\SQLAudits\' ,MAXSIZE = 10 MB )
    WITH ( QUEUE_DELAY = 1000, ON_FAILURE = CONTINUE );
END
GO

ALTER SERVER AUDIT StudentServerAudit WITH (STATE = ON);
GO

USE SecureStudentDB;
GO

IF NOT EXISTS (SELECT * FROM sys.database_audit_specifications WHERE name = 'StudentDBAuditSpec')
BEGIN
    CREATE DATABASE AUDIT SPECIFICATION StudentDBAuditSpec
    FOR SERVER AUDIT StudentServerAudit
    ADD (SELECT, INSERT, UPDATE, DELETE ON SCHEMA::[dbo] BY [public])
    WITH (STATE = ON);
END
GO
