CREATE DATABASE SecureStudentDB;
GO
USE SecureStudentDB;
GO

-- Table for User/Student Records with Hashing Support
CREATE TABLE Users (
    UserID INT PRIMARY KEY IDENTITY(1,1),
    Username NVARCHAR(50) UNIQUE NOT NULL,
    PasswordHash VARBINARY(64) NOT NULL, -- Storage for SHA-256 Hashing
    UserRole NVARCHAR(20) NOT NULL,
    CONSTRAINT CHK_Role CHECK (UserRole IN ('Student', 'Admin', 'Instructor'))
);

-- Table for Academic Assessments
CREATE TABLE Assessments (
    AssessmentID INT PRIMARY KEY IDENTITY(1,1),
    Title NVARCHAR(100) NOT NULL,
    MaxGrade INT NOT NULL
);

-- Table for Submissions with Integrity Checks
CREATE TABLE Submissions (
    SubmissionID INT PRIMARY KEY IDENTITY(1,1),
    StudentID INT NOT NULL,
    AssessmentID INT NOT NULL,
    FileHash VARBINARY(64), -- Data Integrity (Task 5 requirement)
    GradeValue INT NULL,
    LastModifiedDate DATETIME DEFAULT GETDATE(),
    
    CONSTRAINT FK_Student FOREIGN KEY (StudentID) REFERENCES Users(UserID),
    CONSTRAINT FK_Assessment FOREIGN KEY (AssessmentID) REFERENCES Assessments(AssessmentID)
);
GO