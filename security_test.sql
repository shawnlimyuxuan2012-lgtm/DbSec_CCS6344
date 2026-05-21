USE SecureStudentDB;
GO

-- TEST 2A: Soft Delete Status Change (Should pass cleanly)
UPDATE users 
SET is_deleted = 1, delete_requested_at = GETDATE() 
WHERE email = 'student@mmu.edu.my';

-- TEST 2B: Destructive Hard Delete Attempt (Will instantly trigger a Msg 229 Permission Denied Error)
-- Capture this error window for your report!
DELETE FROM users WHERE id = 3;
GO
