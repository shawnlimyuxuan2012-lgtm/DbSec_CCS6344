const path = require("path");
const fs = require("fs");
const { getPool, sql } = require("../config/db");
const { ensureAcademicSchema } = require("../config/academicSchema");
const { logAction, logGradeAccess } = require("../middleware/auth");

const ensure = async () => {
  const pool = await getPool();
  await ensureAcademicSchema(pool);
  return pool;
};

// GET /api/student/classes
const getClasses = async (req, res) => {
  try {
    const pool = await ensure();
    const result = await pool.request().input("sid", sql.Int, req.user.id)
      .query(`
        SELECT c.id, c.name, c.course_code, c.join_code, c.joined_at,
               u.name AS lecturer_name,
               COUNT(a.id) AS assignment_count
        FROM (
          SELECT cl.*, cs.joined_at
          FROM class_students cs
          INNER JOIN classes cl ON cl.id = cs.class_id
          WHERE cs.student_id = @sid
        ) c
        INNER JOIN users u ON u.id = c.lecturer_id
        LEFT JOIN assignments a ON a.class_id = c.id AND a.is_deleted = 0
        GROUP BY c.id, c.name, c.course_code, c.join_code, c.joined_at, u.name
        ORDER BY c.joined_at DESC
      `);
    res.json(result.recordset);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch classes" });
  }
};

// POST /api/student/classes/join
const joinClass = async (req, res) => {
  const joinCode = String(req.body.join_code || "")
    .trim()
    .toUpperCase();
  if (!joinCode)
    return res.status(400).json({ message: "Class code is required" });

  try {
    const pool = await ensure();
    const classRes = await pool
      .request()
      .input("join_code", sql.NVarChar, joinCode)
      .query(
        "SELECT id, name, course_code FROM classes WHERE join_code = @join_code",
      );

    if (!classRes.recordset[0]) {
      return res.status(404).json({ message: "Class code not found" });
    }

    const classInfo = classRes.recordset[0];
    await pool
      .request()
      .input("class_id", sql.Int, classInfo.id)
      .input("student_id", sql.Int, req.user.id).query(`
        IF NOT EXISTS (SELECT 1 FROM class_students WHERE class_id = @class_id AND student_id = @student_id)
        INSERT INTO class_students (class_id, student_id) VALUES (@class_id, @student_id)
      `);

    await logAction(
      req.user.id,
      "JOIN_CLASS",
      "classes",
      classInfo.id,
      null,
      req.ip,
    );
    res.json({ message: "Class added", class: classInfo });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to join class" });
  }
};

const parseOptions = (optionsJson) => {
  if (!optionsJson) return [];
  try {
    const parsed = JSON.parse(optionsJson);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    return [];
  }
};

// GET /api/student/exams
const getExams = async (req, res) => {
  try {
    const pool = await ensure();
    const result = await pool.request().input("sid", sql.Int, req.user.id)
      .query(`
        SELECT e.id, e.title, e.description, e.deadline, e.created_at,
               c.name AS class_name, c.course_code,
               u.name AS lecturer_name,
               COUNT(DISTINCT q.id) AS question_count,
               SUM(ISNULL(q.points, 0)) AS total_points,
               es.id AS submission_id, es.submitted_at, es.score
        FROM exams e
        INNER JOIN classes c ON c.id = e.class_id
        INNER JOIN class_students cs ON cs.class_id = e.class_id AND cs.student_id = @sid
        INNER JOIN users u ON u.id = e.lecturer_id
        LEFT JOIN exam_questions q ON q.exam_id = e.id
        LEFT JOIN exam_submissions es ON es.exam_id = e.id AND es.student_id = @sid
        GROUP BY e.id, e.title, e.description, e.deadline, e.created_at,
                 c.name, c.course_code, u.name, es.id, es.submitted_at, es.score
        ORDER BY e.deadline ASC, e.created_at DESC
      `);
    res.json(result.recordset);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch exams" });
  }
};

// GET /api/student/exams/:id
const getExam = async (req, res) => {
  try {
    const pool = await ensure();
    const examRes = await pool
      .request()
      .input("id", sql.Int, req.params.id)
      .input("sid", sql.Int, req.user.id).query(`
        SELECT e.id, e.title, e.description, e.deadline,
               c.name AS class_name, c.course_code,
               es.id AS submission_id, es.submitted_at, es.score, es.feedback
        FROM exams e
        INNER JOIN classes c ON c.id = e.class_id
        INNER JOIN class_students cs ON cs.class_id = e.class_id AND cs.student_id = @sid
        LEFT JOIN exam_submissions es ON es.exam_id = e.id AND es.student_id = @sid
        WHERE e.id = @id
      `);

    if (!examRes.recordset[0]) {
      return res.status(404).json({ message: "Exam not found" });
    }

    const questionsRes = await pool
      .request()
      .input("exam_id", sql.Int, req.params.id).query(`
        SELECT id, exam_id, question_type, prompt, options_json, correct_answer, points
        FROM exam_questions
        WHERE exam_id = @exam_id
        ORDER BY id
      `);

    const answersRes = await pool
      .request()
      .input("exam_id", sql.Int, req.params.id)
      .input("sid", sql.Int, req.user.id).query(`
        SELECT ea.question_id, ea.answer_text, ea.is_correct, ea.points_awarded,
               q.correct_answer, q.question_type, q.options_json
        FROM exam_submissions es
        INNER JOIN exam_answers ea ON ea.submission_id = es.id
        INNER JOIN exam_questions q ON q.id = ea.question_id
        WHERE es.exam_id = @exam_id AND es.student_id = @sid
      `);

    const questions = questionsRes.recordset.map((q) => ({
      ...q,
      options: parseOptions(q.options_json),
    }));

    const answers = answersRes.recordset.map((a) => ({
      ...a,
      options: parseOptions(a.options_json),
    }));

    res.json({ exam: examRes.recordset[0], questions, answers });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch exam" });
  }
};

// POST /api/student/exams/:id/submit
const submitExam = async (req, res) => {
  const answers = req.body.answers || {};

  try {
    const pool = await ensure();
    const examRes = await pool
      .request()
      .input("id", sql.Int, req.params.id)
      .input("sid", sql.Int, req.user.id).query(`
        SELECT e.id, e.deadline
        FROM exams e
        INNER JOIN class_students cs ON cs.class_id = e.class_id AND cs.student_id = @sid
        WHERE e.id = @id
      `);

    const exam = examRes.recordset[0];
    if (!exam) return res.status(404).json({ message: "Exam not found" });
    if (exam.deadline && new Date() > new Date(exam.deadline)) {
      return res.status(400).json({ message: "Exam deadline has passed" });
    }

    const existing = await pool
      .request()
      .input("exam_id", sql.Int, req.params.id)
      .input("student_id", sql.Int, req.user.id)
      .query(
        "SELECT id FROM exam_submissions WHERE exam_id = @exam_id AND student_id = @student_id",
      );

    if (existing.recordset[0]) {
      return res.status(409).json({ message: "Exam already submitted" });
    }

    const questionsRes = await pool
      .request()
      .input("exam_id", sql.Int, req.params.id)
      .query(
        "SELECT id, question_type, correct_answer, points FROM exam_questions WHERE exam_id = @exam_id",
      );

    let autoScore = 0;
    let hasManualQuestions = false;

    const submissionRes = await pool
      .request()
      .input("exam_id", sql.Int, req.params.id)
      .input("student_id", sql.Int, req.user.id)
      .query(`INSERT INTO exam_submissions (exam_id, student_id)
              OUTPUT INSERTED.id
              VALUES (@exam_id, @student_id)`);

    const submissionId = submissionRes.recordset[0].id;

    for (const question of questionsRes.recordset) {
      const answerText = answers[String(question.id)] ?? "";
      let isCorrect = null;
      let pointsAwarded = null;

      if (question.question_type === "mcq") {
        isCorrect =
          String(answerText).trim().toLowerCase() ===
          String(question.correct_answer || "")
            .trim()
            .toLowerCase();
        pointsAwarded = isCorrect ? Number(question.points || 0) : 0;
        autoScore += pointsAwarded;
      } else {
        hasManualQuestions = true;
      }

      await pool
        .request()
        .input("submission_id", sql.Int, submissionId)
        .input("question_id", sql.Int, question.id)
        .input("answer_text", sql.NVarChar, String(answerText))
        .input(
          "is_correct",
          sql.Bit,
          isCorrect === null ? null : isCorrect ? 1 : 0,
        )
        .input("points_awarded", sql.Decimal(5, 2), pointsAwarded)
        .query(`INSERT INTO exam_answers (submission_id, question_id, answer_text, is_correct, points_awarded)
                VALUES (@submission_id, @question_id, @answer_text, @is_correct, @points_awarded)`);
    }

    await pool
      .request()
      .input("score", sql.Decimal(5, 2), hasManualQuestions ? null : autoScore)
      .input("id", sql.Int, submissionId)
      .query("UPDATE exam_submissions SET score = @score WHERE id = @id");

    await logAction(
      req.user.id,
      "SUBMIT_EXAM",
      "exam_submissions",
      submissionId,
      { exam_id: req.params.id },
      req.ip,
    );
    res
      .status(201)
      .json({
        message: hasManualQuestions
          ? "Exam submitted for review"
          : "Exam submitted",
        id: submissionId,
        score: hasManualQuestions ? null : autoScore,
      });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to submit exam" });
  }
};

// GET /api/student/assignments
const getAssignments = async (req, res) => {
  try {
    const pool = await ensure();
    const result = await pool.request().input("sid", sql.Int, req.user.id)
      .query(`
      SELECT a.id, a.title, a.description, a.course_code, a.course_name, a.class_id,
             c.name AS class_name,
             a.deadline, a.max_score, u.name AS lecturer_name,
             s.id AS submission_id, s.submitted_at, s.resubmitted_at,
             g.score, g.feedback
      FROM assignments a
      INNER JOIN users u ON a.lecturer_id = u.id
      LEFT JOIN classes c ON c.id = a.class_id
      LEFT JOIN class_students cs ON cs.class_id = a.class_id AND cs.student_id = @sid
      LEFT JOIN submissions s ON s.assignment_id = a.id AND s.student_id = @sid
      LEFT JOIN grades g ON g.submission_id = s.id
      WHERE a.is_deleted = 0 AND (a.class_id IS NULL OR cs.student_id = @sid)
      ORDER BY a.deadline ASC
    `);
    res.json(result.recordset);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch assignments" });
  }
};

// GET /api/student/assignments/:id
const getAssignment = async (req, res) => {
  try {
    const pool = await ensure();
    const result = await pool
      .request()
      .input("id", sql.Int, req.params.id)
      .input("sid", sql.Int, req.user.id).query(`
        SELECT a.*, c.name AS class_name, u.name AS lecturer_name,
               s.id AS submission_id, s.submitted_at, s.file_path, s.original_name
        FROM assignments a
        INNER JOIN users u ON a.lecturer_id = u.id
        LEFT JOIN classes c ON c.id = a.class_id
        LEFT JOIN class_students cs ON cs.class_id = a.class_id AND cs.student_id = @sid
        LEFT JOIN submissions s ON s.assignment_id = a.id AND s.student_id = @sid
        WHERE a.id = @id AND a.is_deleted = 0 AND (a.class_id IS NULL OR cs.student_id = @sid)
      `);

    if (!result.recordset[0]) {
      return res.status(404).json({ message: "Assignment not found" });
    }
    res.json(result.recordset[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch assignment" });
  }
};

// POST /api/student/submit-assignment/:id
const submitAssignment = async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: "File is required" });
  }

  try {
    const pool = await ensure();
    const assignmentRes = await pool
      .request()
      .input("id", sql.Int, req.params.id)
      .input("sid", sql.Int, req.user.id).query(`
        SELECT a.*
        FROM assignments a
        LEFT JOIN class_students cs ON cs.class_id = a.class_id AND cs.student_id = @sid
        WHERE a.id = @id AND a.is_deleted = 0 AND (a.class_id IS NULL OR cs.student_id = @sid)
      `);

    if (!assignmentRes.recordset[0]) {
      fs.unlinkSync(req.file.path);
      return res.status(404).json({ message: "Assignment not found" });
    }

    const assignment = assignmentRes.recordset[0];
    const isLate = new Date() > new Date(assignment.deadline);

    // Check existing submission
    const existing = await pool
      .request()
      .input("aid", sql.Int, req.params.id)
      .input("sid", sql.Int, req.user.id)
      .query(
        "SELECT id, file_path FROM submissions WHERE assignment_id = @aid AND student_id = @sid",
      );

    if (existing.recordset[0]) {
      // Delete old file & update
      try {
        fs.unlinkSync(existing.recordset[0].file_path);
      } catch (e) {}

      if (isLate) {
        fs.unlinkSync(req.file.path);
        return res
          .status(400)
          .json({ message: "Cannot resubmit after deadline" });
      }

      await pool
        .request()
        .input("file_path", sql.NVarChar, req.file.path)
        .input("original_name", sql.NVarChar, req.file.originalname)
        .input("file_size", sql.Int, req.file.size)
        .input("mime_type", sql.NVarChar, req.file.mimetype)
        .input("id", sql.Int, existing.recordset[0].id)
        .query(`UPDATE submissions SET file_path=@file_path, original_name=@original_name,
                file_size=@file_size, mime_type=@mime_type,
                resubmitted_at=GETDATE(), is_late=0 WHERE id=@id`);

      await logAction(
        req.user.id,
        "RESUBMIT",
        "submissions",
        existing.recordset[0].id,
        null,
        req.ip,
      );
      return res.json({ message: "Assignment resubmitted successfully" });
    }

    const result = await pool
      .request()
      .input("assignment_id", sql.Int, req.params.id)
      .input("student_id", sql.Int, req.user.id)
      .input("file_path", sql.NVarChar, req.file.path)
      .input("original_name", sql.NVarChar, req.file.originalname)
      .input("file_size", sql.Int, req.file.size)
      .input("mime_type", sql.NVarChar, req.file.mimetype)
      .input("is_late", sql.Bit, isLate ? 1 : 0)
      .query(`INSERT INTO submissions (assignment_id, student_id, file_path, original_name, file_size, mime_type, is_late)
              OUTPUT INSERTED.id
              VALUES (@assignment_id, @student_id, @file_path, @original_name, @file_size, @mime_type, @is_late)`);

    await logAction(
      req.user.id,
      "SUBMIT",
      "submissions",
      result.recordset[0].id,
      null,
      req.ip,
    );
    res
      .status(201)
      .json({
        message: isLate ? "Submitted (late)" : "Submitted successfully",
      });
  } catch (err) {
    if (req.file)
      try {
        fs.unlinkSync(req.file.path);
      } catch (e) {}
    console.error(err);
    res.status(500).json({ message: "Failed to submit assignment" });
  }
};

// PUT /api/student/resubmit-assignment/:id (alias handled in submit)
const resubmitAssignment = submitAssignment;

// GET /api/student/submissions
const getSubmissions = async (req, res) => {
  try {
    const pool = await ensure();
    const result = await pool.request().input("sid", sql.Int, req.user.id)
      .query(`
        SELECT s.*, a.title AS assignment_title, a.course_code, a.deadline,
               g.score, g.feedback, g.graded_at
        FROM submissions s
        INNER JOIN assignments a ON s.assignment_id = a.id
        LEFT JOIN grades g ON g.submission_id = s.id
        WHERE s.student_id = @sid
        ORDER BY s.submitted_at DESC
      `);
    res.json(result.recordset);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch submissions" });
  }
};

// GET /api/student/grades
const getGrades = async (req, res) => {
  try {
    const pool = await ensure();
    const result = await pool.request().input("sid", sql.Int, req.user.id)
      .query(`
        SELECT g.id AS grade_id, g.score, g.feedback, g.graded_at,
               a.title AS title, a.course_code, a.course_name, a.max_score,
               'assignment' AS record_type
        FROM grades g
        INNER JOIN submissions s ON g.submission_id = s.id
        INNER JOIN assignments a ON s.assignment_id = a.id
        WHERE s.student_id = @sid

        UNION ALL

        SELECT es.id AS grade_id, es.score, es.feedback, es.submitted_at AS graded_at,
               e.title AS title, c.course_code, c.name AS course_name,
               COALESCE(SUM(q.points), 0) AS max_score,
               'exam' AS record_type
        FROM exam_submissions es
        INNER JOIN exams e ON es.exam_id = e.id
        INNER JOIN classes c ON e.class_id = c.id
        INNER JOIN exam_questions q ON q.exam_id = e.id
        WHERE es.student_id = @sid
        GROUP BY es.id, es.score, es.feedback, es.submitted_at, e.title, c.course_code, c.name

        ORDER BY graded_at DESC
      `);

    // Log grade access
    for (const row of result.recordset) {
      await logGradeAccess(req.user.id, row.grade_id, "VIEW", req.ip);
    }

    res.json(result.recordset);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch grades" });
  }
};

// GET /api/student/download-data
const downloadData = async (req, res) => {
  try {
    const pool = await ensure();
    const userId = req.user.id;

    const userRes = await pool
      .request()
      .input("id", sql.Int, userId)
      .query(
        "SELECT id, name, email, role, pdpa_consent, created_at FROM users WHERE id = @id",
      );

    const submissionsRes = await pool.request().input("sid", sql.Int, userId)
      .query(`SELECT s.id, a.title, a.course_code, s.submitted_at, s.is_late,
                     g.score, g.feedback FROM submissions s
              INNER JOIN assignments a ON s.assignment_id = a.id
              LEFT JOIN grades g ON g.submission_id = s.id
              WHERE s.student_id = @sid`);

    const data = {
      generated_at: new Date().toISOString(),
      user: userRes.recordset[0],
      submissions: submissionsRes.recordset,
      notice: "This data is provided under PDPA Section 30 data access rights.",
    };

    await logAction(userId, "DOWNLOAD_DATA", "users", userId, null, req.ip);

    res.setHeader("Content-Type", "application/json");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="my-data-${userId}-${Date.now()}.json"`,
    );
    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to export data" });
  }
};

// DELETE /api/student/delete-account
const requestDeletion = async (req, res) => {
  try {
    const pool = await ensure();
    await pool.request().input("id", sql.Int, req.user.id)
      .query(`UPDATE users SET delete_requested_at = GETDATE(), updated_at = GETDATE()
              WHERE id = @id`);

    await logAction(
      req.user.id,
      "REQUEST_DELETION",
      "users",
      req.user.id,
      null,
      req.ip,
    );
    res.json({
      message:
        "Account deletion request submitted. An admin will process it within 30 days.",
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to submit deletion request" });
  }
};

module.exports = {
  getClasses,
  joinClass,
  getExams,
  getExam,
  submitExam,
  getAssignments,
  getAssignment,
  submitAssignment,
  resubmitAssignment,
  getSubmissions,
  getGrades,
  downloadData,
  requestDeletion,
};
