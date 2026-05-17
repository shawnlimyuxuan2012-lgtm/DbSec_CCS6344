const { sql } = require('./db');

let ensured = false;

const ensureAcademicSchema = async (pool) => {
  if (ensured) return;

  await pool.request().query(`
    IF OBJECT_ID('classes', 'U') IS NULL
    BEGIN
      CREATE TABLE classes (
        id INT IDENTITY(1,1) PRIMARY KEY,
        name NVARCHAR(150) NOT NULL,
        course_code NVARCHAR(50) NOT NULL,
        join_code NVARCHAR(20) NOT NULL UNIQUE,
        lecturer_id INT NOT NULL,
        created_at DATETIME NOT NULL DEFAULT GETDATE(),
        updated_at DATETIME NOT NULL DEFAULT GETDATE()
      );
    END;

    IF OBJECT_ID('class_students', 'U') IS NULL
    BEGIN
      CREATE TABLE class_students (
        id INT IDENTITY(1,1) PRIMARY KEY,
        class_id INT NOT NULL,
        student_id INT NOT NULL,
        joined_at DATETIME NOT NULL DEFAULT GETDATE(),
        CONSTRAINT UQ_class_students UNIQUE (class_id, student_id)
      );
    END;

    IF COL_LENGTH('assignments', 'class_id') IS NULL
    BEGIN
      ALTER TABLE assignments ADD class_id INT NULL;
    END;

    IF OBJECT_ID('exams', 'U') IS NULL
    BEGIN
      CREATE TABLE exams (
        id INT IDENTITY(1,1) PRIMARY KEY,
        class_id INT NOT NULL,
        lecturer_id INT NOT NULL,
        title NVARCHAR(200) NOT NULL,
        description NVARCHAR(MAX) NULL,
        deadline DATETIME NULL,
        created_at DATETIME NOT NULL DEFAULT GETDATE(),
        updated_at DATETIME NOT NULL DEFAULT GETDATE()
      );
    END;

    IF COL_LENGTH('exams', 'deadline') IS NULL
    BEGIN
      ALTER TABLE exams ADD deadline DATETIME NULL;
    END;

    IF OBJECT_ID('exam_questions', 'U') IS NULL
    BEGIN
      CREATE TABLE exam_questions (
        id INT IDENTITY(1,1) PRIMARY KEY,
        exam_id INT NOT NULL,
        question_type NVARCHAR(30) NOT NULL,
        prompt NVARCHAR(MAX) NOT NULL,
        options_json NVARCHAR(MAX) NULL,
        correct_answer NVARCHAR(MAX) NULL,
        points INT NOT NULL DEFAULT 1,
        created_at DATETIME NOT NULL DEFAULT GETDATE()
      );
    END;

    IF OBJECT_ID('exam_submissions', 'U') IS NULL
    BEGIN
      CREATE TABLE exam_submissions (
        id INT IDENTITY(1,1) PRIMARY KEY,
        exam_id INT NOT NULL,
        student_id INT NOT NULL,
        submitted_at DATETIME NOT NULL DEFAULT GETDATE(),
        score DECIMAL(5,2) NULL,
        feedback NVARCHAR(MAX) NULL,
        CONSTRAINT UQ_exam_submissions UNIQUE (exam_id, student_id)
      );
    END;

    IF OBJECT_ID('exam_answers', 'U') IS NULL
    BEGIN
      CREATE TABLE exam_answers (
        id INT IDENTITY(1,1) PRIMARY KEY,
        submission_id INT NOT NULL,
        question_id INT NOT NULL,
        answer_text NVARCHAR(MAX) NULL,
        is_correct BIT NULL,
        points_awarded DECIMAL(5,2) NULL,
        CONSTRAINT UQ_exam_answers UNIQUE (submission_id, question_id)
      );
    END;
  `);

  ensured = true;
};

const generateJoinCode = () => {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 8; i += 1) {
    code += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return code;
};

module.exports = { ensureAcademicSchema, generateJoinCode, sql };
