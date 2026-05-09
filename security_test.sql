-- run this while using 'WebAppUser' to verify

USE SecureStudentDB;
GO

-- TEST 1: Verify data access (Should Succeed)
SELECT * FROM Users;

-- TEST 2: Verify Internal Attack Protection (Should FAIL/Permission Denied)
-- proof for the Task 5 Report
DELETE FROM Users WHERE UserID = 1;
GO