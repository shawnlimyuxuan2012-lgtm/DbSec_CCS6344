USE [master];
GO

-- 1. Create Server-Level Audit
CREATE SERVER AUDIT StudentDataAudit
TO FILE ( FILEPATH = 'C:\SQLAudits\' ); 
GO

-- 2. Enable the Audit
ALTER SERVER AUDIT StudentDataAudit WITH (STATE = ON);
GO

USE SecureStudentDB;
GO

-- 3. Define what to record (DML actions on the Student Schema)
CREATE DATABASE AUDIT SPECIFICATION [Audit_Student_Access]
FOR SERVER AUDIT StudentDataAudit
ADD (SELECT, INSERT, UPDATE, DELETE ON SCHEMA::[dbo] BY [public])
WITH (STATE = ON);
GO