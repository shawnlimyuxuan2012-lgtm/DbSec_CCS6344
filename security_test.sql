USE SecureStudentDB;
GO

--  EMERGENCY BLOCK: Stops the entire script instantly if executed by accident!
PRINT 'CRITICAL: Security suite is safety-locked to prevent accidental account modification.';
RETURN; 
GO


-- =========================================================================
-- THE SCRIPTS BELOW ARE FOR REPORT SNIPPETS ONLY (WILL NOT RUN DUE TO RETURN)
-- =========================================================================

-- TEST A: PDPA Compliance Verification (Soft-Delete Simulation)
-- UPDATE users SET is_deleted = 1, delete_requested_at = GETDATE() WHERE email = 'student@mmu.edu.my';

-- TEST B: Database Hardening Verification (SQL Injection / Deletion Check)
-- DELETE FROM users WHERE id = 3;
