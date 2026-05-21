CREATE DATABASE SecureStudentDB;
GO
USE SecureStudentDB;
GO

-- Table: users
CREATE TABLE users (
	id int IDENTITY(1,1) NOT NULL,
	name nvarchar(100) NOT NULL,
	email nvarchar(150) NOT NULL,
	password_hash nvarchar(255) NOT NULL,
	role nvarchar(20) NOT NULL,
	pdpa_consent bit NOT NULL DEFAULT (0),
	is_deleted bit NOT NULL DEFAULT (0),
	delete_requested_at datetime NULL,
	created_at datetime NOT NULL DEFAULT (getdate()),
	updated_at datetime NOT NULL DEFAULT (getdate()),
	PRIMARY KEY (id),
	UNIQUE (email),
	CHECK (role='admin' OR role='lecturer' OR role='student')
);

-- Table: assignments
CREATE TABLE assignments (
	id int IDENTITY(1,1) NOT NULL,
	title nvarchar(200) NOT NULL,
	description nvarchar(max) NULL,
	course_code nvarchar(20) NOT NULL,
	course_name nvarchar(100) NOT NULL,
	lecturer_id int NOT NULL,
	deadline datetime NOT NULL,
	max_score int NOT NULL DEFAULT (100),
	is_deleted bit NOT NULL DEFAULT (0),
	created_at datetime NOT NULL DEFAULT (getdate()),
	updated_at datetime NOT NULL DEFAULT (getdate()),
	class_id int NULL,
	PRIMARY KEY (id),
	FOREIGN KEY (lecturer_id) REFERENCES users(id)
);

-- Table: audit_logs
CREATE TABLE audit_logs (
	id int IDENTITY(1,1) NOT NULL,
	user_id int NULL,
	action nvarchar(100) NOT NULL,
	entity nvarchar(50) NULL,
	entity_id int NULL,
	details nvarchar(max) NULL,
	ip_address nvarchar(50) NULL,
	created_at datetime NOT NULL DEFAULT (getdate()),
	PRIMARY KEY (id),
	FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Table: classes
CREATE TABLE classes (
	id int IDENTITY(1,1) NOT NULL,
	name nvarchar(150) NOT NULL,
	course_code nvarchar(50) NOT NULL,
	join_code nvarchar(20) NOT NULL,
	lecturer_id int NOT NULL,
	created_at datetime NOT NULL DEFAULT (getdate()),
	updated_at datetime NOT NULL DEFAULT (getdate()),
	PRIMARY KEY (id),
	UNIQUE (join_code)
);

-- Table: class_students
CREATE TABLE class_students (
	id int IDENTITY(1,1) NOT NULL,
	class_id int NOT NULL,
	student_id int NOT NULL,
	joined_at datetime NOT NULL DEFAULT (getdate()),
	PRIMARY KEY (id),
	CONSTRAINT UQ_class_students UNIQUE (class_id, student_id)
);

-- Table: submissions
CREATE TABLE submissions (
	id int IDENTITY(1,1) NOT NULL,
	assignment_id int NOT NULL,
	student_id int NOT NULL,
	file_path nvarchar(500) NOT NULL,
	original_name nvarchar(255) NOT NULL,
	file_size int NOT NULL,
	mime_type nvarchar(100) NOT NULL,
	submitted_at datetime NOT NULL DEFAULT (getdate()),
	resubmitted_at datetime NULL,
	is_late bit NOT NULL DEFAULT (0),
	PRIMARY KEY (id),
	CONSTRAINT UQ_submission UNIQUE (assignment_id, student_id),
	FOREIGN KEY (assignment_id) REFERENCES assignments(id),
	FOREIGN KEY (student_id) REFERENCES users(id)
);

-- Table: grades
CREATE TABLE grades (
	id int IDENTITY(1,1) NOT NULL,
	submission_id int NOT NULL,
	lecturer_id int NOT NULL,
	score decimal(5, 2) NOT NULL,
	feedback nvarchar(max) NULL,
	graded_at datetime NOT NULL DEFAULT (getdate()),
	updated_at datetime NOT NULL DEFAULT (getdate()),
	PRIMARY KEY (id),
	FOREIGN KEY (lecturer_id) REFERENCES users(id),
	FOREIGN KEY (submission_id) REFERENCES submissions(id)
);

-- Table: grade_access_logs
CREATE TABLE grade_access_logs (
	id int IDENTITY(1,1) NOT NULL,
	user_id int NOT NULL,
	grade_id int NULL,
	action nvarchar(50) NOT NULL,
	ip_address nvarchar(50) NULL,
	accessed_at datetime NOT NULL DEFAULT (getdate()),
	PRIMARY KEY (id),
	FOREIGN KEY (grade_id) REFERENCES grades(id),
	FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Table: exams
CREATE TABLE exams (
	id int IDENTITY(1,1) NOT NULL,
	class_id int NOT NULL,
	lecturer_id int NOT NULL,
	title nvarchar(200) NOT NULL,
	description nvarchar(max) NULL,
	created_at datetime NOT NULL DEFAULT (getdate()),
	updated_at datetime NOT NULL DEFAULT (getdate()),
	deadline datetime NULL,
	PRIMARY KEY (id)
);

-- Table: exam_questions
CREATE TABLE exam_questions (
	id int IDENTITY(1,1) NOT NULL,
	exam_id int NOT NULL,
	question_type nvarchar(30) NOT NULL,
	prompt nvarchar(max) NOT NULL,
	options_json nvarchar(max) NULL,
	correct_answer nvarchar(max) NULL,
	points int NOT NULL DEFAULT (1),
	created_at datetime NOT NULL DEFAULT (getdate()),
	PRIMARY KEY (id)
);

-- Table: exam_submissions
CREATE TABLE exam_submissions (
	id int IDENTITY(1,1) NOT NULL,
	exam_id int NOT NULL,
	student_id int NOT NULL,
	submitted_at datetime NOT NULL DEFAULT (getdate()),
	score decimal(5, 2) NULL,
	feedback nvarchar(max) NULL,
	PRIMARY KEY (id),
	CONSTRAINT UQ_exam_submissions UNIQUE (exam_id, student_id)
);

-- Table: exam_answers
CREATE TABLE exam_answers (
	id int IDENTITY(1,1) NOT NULL,
	submission_id int NOT NULL,
	question_id int NOT NULL,
	answer_text nvarchar(max) NULL,
	is_correct bit NULL,
	points_awarded decimal(5, 2) NULL,
	PRIMARY KEY (id),
	CONSTRAINT UQ_exam_answers UNIQUE (submission_id, question_id)
);

-- Table: password_reset_tokens
CREATE TABLE password_reset_tokens (
	id int IDENTITY(1,1) NOT NULL,
	user_id int NOT NULL,
	token nvarchar(255) NOT NULL,
	expires_at datetime NOT NULL,
	used bit NOT NULL DEFAULT (0),
	created_at datetime NOT NULL DEFAULT (getdate()),
	PRIMARY KEY (id),
	UNIQUE (token),
	FOREIGN KEY (user_id) REFERENCES users(id)
);
GO

TEST ACCOUNTS (Password for all: MmuPass2026!)

INSERT INTO users (name, email, password_hash, role, pdpa_consent, is_deleted)
VALUES 
('System Administrator', 'admin@mmu.edu.my', 'e9b9868f763f0343a4130097f4cf91d842247fb6f610e19e075037d0c35476a6', 'admin', 1, 0),
('Prof. Ahmad', 'lecturer@mmu.edu.my', 'e9b9868f763f0343a4130097f4cf91d842247fb6f610e19e075037d0c35476a6', 'lecturer', 1, 0),
('Lim Yong Shian', 'student@mmu.edu.my', 'e9b9868f763f0343a4130097f4cf91d842247fb6f610e19e075037d0c35476a6', 'student', 1, 0);
GO
