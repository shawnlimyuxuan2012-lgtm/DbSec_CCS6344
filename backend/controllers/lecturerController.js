const { getPool, sql } = require("../config/db");
const { generateJoinCode } = require("../utils/generateCode");
const { logAction, logGradeAccess } = require("../middleware/auth");

const ensure = async () => {
  return await getPool();
};

// GET /api/lecturer/classes
const getClasses = async (req, res) => {
  try {
    const pool = await ensure();
    const result = await pool.request().input("lid", sql.Int, req.user.id)
      .query(`
        SELECT c.*,
               COUNT(DISTINCT cs.student_id) AS student_count,
               COUNT(DISTINCT a.id) AS assignment_count,
               COUNT(DISTINCT e.id) AS exam_count
        FROM classes c
        LEFT JOIN class_students cs ON cs.class_id = c.id
        LEFT JOIN assignments a ON a.class_id = c.id AND a.is_deleted = 0
        LEFT JOIN exams e ON e.class_id = c.id
        WHERE c.lecturer_id = @lid
        GROUP BY c.id, c.name, c.course_code, c.join_code, c.lecturer_id, c.created_at, c.updated_at
        ORDER BY c.created_at DESC
      `);
    res.json(result.recordset);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch classes" });
  }
};

// GET /api/lecturer/classes/:id
const getClass = async (req, res) => {
  try {
    const pool = await ensure();
    const classRes = await pool
      .request()
      .input("id", sql.Int, req.params.id)
      .input("lid", sql.Int, req.user.id).query(`
        SELECT c.*,
               COUNT(DISTINCT cs.student_id) AS student_count,
               COUNT(DISTINCT a.id) AS assignment_count,
               COUNT(DISTINCT e.id) AS exam_count
        FROM classes c
        LEFT JOIN class_students cs ON cs.class_id = c.id
        LEFT JOIN assignments a ON a.class_id = c.id AND a.is_deleted = 0
        LEFT JOIN exams e ON e.class_id = c.id
        WHERE c.id = @id AND c.lecturer_id = @lid
        GROUP BY c.id, c.name, c.course_code, c.join_code, c.lecturer_id, c.created_at, c.updated_at
      `);

    if (!classRes.recordset[0]) {
      return res
        .status(404)
        .json({ message: "Class not found or unauthorized" });
    }

    const studentsRes = await pool
      .request()
      .input("class_id", sql.Int, req.params.id).query(`
        SELECT u.id, u.name, u.email, cs.joined_at
        FROM class_students cs
        INNER JOIN users u ON u.id = cs.student_id
        WHERE cs.class_id = @class_id
        ORDER BY u.name
      `);

    res.json({ class: classRes.recordset[0], students: studentsRes.recordset });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch class" });
  }
};

// POST /api/lecturer/classes
const createClass = async (req, res) => {
  const { name, course_code } = req.body;
  if (!name || !course_code) {
    return res
      .status(400)
      .json({ message: "Class name and course code are required" });
  }

  try {
    const pool = await ensure();
    let result;

    for (let attempt = 0; attempt < 5; attempt += 1) {
      try {
        result = await pool
          .request()
          .input("name", sql.NVarChar, name)
          .input("course_code", sql.NVarChar, course_code)
          .input("join_code", sql.NVarChar, generateJoinCode())
          .input("lecturer_id", sql.Int, req.user.id)
          .query(`INSERT INTO classes (name, course_code, join_code, lecturer_id)
                  OUTPUT INSERTED.*
                  VALUES (@name, @course_code, @join_code, @lecturer_id)`);
        break;
      } catch (err) {
        if (
          !String(err.message || "").includes("UQ") &&
          !String(err.message || "").includes("UNIQUE")
        )
          throw err;
      }
    }

    if (!result)
      return res.status(500).json({ message: "Failed to generate class code" });

    const created = result.recordset[0];
    await logAction(
      req.user.id,
      "CREATE_CLASS",
      "classes",
      created.id,
      { name, course_code },
      req.ip,
    );
    res.status(201).json({ message: "Class created", class: created });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to create class" });
  }
};

// POST /api/lecturer/classes/:id/students
const addStudentToClass = async (req, res) => {
  const { email } = req.body;
  if (!email)
    return res.status(400).json({ message: "Student email is required" });

  try {
    const pool = await ensure();
    const classRes = await pool
      .request()
      .input("id", sql.Int, req.params.id)
      .input("lid", sql.Int, req.user.id)
      .query("SELECT id FROM classes WHERE id = @id AND lecturer_id = @lid");

    if (!classRes.recordset[0]) {
      return res
        .status(404)
        .json({ message: "Class not found or unauthorized" });
    }

    const studentRes = await pool
      .request()
      .input("email", sql.NVarChar, email)
      .query(
        "SELECT id, name, email FROM users WHERE email = @email AND role = 'student'",
      );

    if (!studentRes.recordset[0]) {
      return res.status(404).json({ message: "Student not found" });
    }

    const student = studentRes.recordset[0];
    await pool
      .request()
      .input("class_id", sql.Int, req.params.id)
      .input("student_id", sql.Int, student.id).query(`
        IF NOT EXISTS (SELECT 1 FROM class_students WHERE class_id = @class_id AND student_id = @student_id)
        INSERT INTO class_students (class_id, student_id) VALUES (@class_id, @student_id)
      `);

    await logAction(
      req.user.id,
      "ADD_STUDENT_TO_CLASS",
      "classes",
      req.params.id,
      { student_id: student.id },
      req.ip,
    );
    res.json({ message: "Student added to class", student });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to add student" });
  }
};

// DELETE /api/lecturer/classes/:id/students/:studentId
const removeStudentFromClass = async (req, res) => {
  try {
    const pool = await ensure();
    const classRes = await pool
      .request()
      .input("id", sql.Int, req.params.id)
      .input("lid", sql.Int, req.user.id)
      .query("SELECT id FROM classes WHERE id = @id AND lecturer_id = @lid");

    if (!classRes.recordset[0]) {
      return res
        .status(404)
        .json({ message: "Class not found or unauthorized" });
    }

    const result = await pool
      .request()
      .input("class_id", sql.Int, req.params.id)
      .input("student_id", sql.Int, req.params.studentId)
      .query(
        "DELETE FROM class_students WHERE class_id = @class_id AND student_id = @student_id",
      );

    if (result.rowsAffected[0] === 0) {
      return res.status(404).json({ message: "Student is not in this class" });
    }

    await logAction(
      req.user.id,
      "REMOVE_STUDENT_FROM_CLASS",
      "classes",
      req.params.id,
      { student_id: req.params.studentId },
      req.ip,
    );
    res.json({ message: "Student removed from class" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to remove student" });
  }
};

// GET /api/lecturer/courses
const getCourses = async (req, res) => {
  try {
    const pool = await ensure();
    const result = await pool.request().input("lid", sql.Int, req.user.id)
      .query(`
        SELECT a.*, 
               c.name AS class_name,
               c.join_code,
               COUNT(s.id) AS submission_count,
               COUNT(g.id) AS graded_count
        FROM assignments a
        LEFT JOIN classes c ON c.id = a.class_id
        LEFT JOIN submissions s ON s.assignment_id = a.id
        LEFT JOIN grades g ON g.submission_id = s.id
        WHERE a.lecturer_id = @lid AND a.is_deleted = 0
        GROUP BY a.id, a.title, a.description, a.course_code, a.course_name, a.class_id,
                 c.name, c.join_code,
                 a.lecturer_id, a.deadline, a.max_score, a.is_deleted, a.created_at, a.updated_at
        ORDER BY a.course_code, a.deadline
      `);
    res.json(result.recordset);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch courses" });
  }
};

// POST /api/lecturer/assignments
const createAssignment = async (req, res) => {
  const {
    title,
    description,
    course_code,
    course_name,
    deadline,
    max_score,
    class_id,
  } = req.body;

  if (!title || !course_code || !course_name || !deadline) {
    return res.status(400).json({
      message: "Title, course code, course name and deadline are required",
    });
  }

  try {
    const pool = await ensure();
    if (class_id) {
      const classRes = await pool
        .request()
        .input("class_id", sql.Int, class_id)
        .input("lid", sql.Int, req.user.id)
        .query(
          "SELECT id FROM classes WHERE id = @class_id AND lecturer_id = @lid",
        );
      if (!classRes.recordset[0]) {
        return res
          .status(404)
          .json({ message: "Class not found or unauthorized" });
      }
    }

    const result = await pool
      .request()
      .input("title", sql.NVarChar, title)
      .input("description", sql.NVarChar, description || null)
      .input("course_code", sql.NVarChar, course_code)
      .input("course_name", sql.NVarChar, course_name)
      .input("lecturer_id", sql.Int, req.user.id)
      .input("deadline", sql.DateTime, new Date(deadline))
      .input("max_score", sql.Int, max_score || 100)
      .input("class_id", sql.Int, class_id || null)
      .query(`INSERT INTO assignments (title, description, course_code, course_name, lecturer_id, deadline, max_score, class_id)
              OUTPUT INSERTED.id
              VALUES (@title, @description, @course_code, @course_name, @lecturer_id, @deadline, @max_score, @class_id)`);

    const id = result.recordset[0].id;
    await logAction(
      req.user.id,
      "CREATE_ASSIGNMENT",
      "assignments",
      id,
      { title },
      req.ip,
    );
    res.status(201).json({ message: "Assignment created", id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to create assignment" });
  }
};

// PUT /api/lecturer/assignments/:id
const updateAssignment = async (req, res) => {
  const {
    title,
    description,
    course_code,
    course_name,
    deadline,
    max_score,
    class_id,
  } = req.body;

  try {
    const pool = await ensure();
    const existing = await pool
      .request()
      .input("id", sql.Int, req.params.id)
      .input("lid", sql.Int, req.user.id)
      .query(
        "SELECT id FROM assignments WHERE id = @id AND lecturer_id = @lid AND is_deleted = 0",
      );

    if (!existing.recordset[0]) {
      return res
        .status(404)
        .json({ message: "Assignment not found or unauthorized" });
    }

    if (class_id) {
      const classRes = await pool
        .request()
        .input("class_id", sql.Int, class_id)
        .input("lid", sql.Int, req.user.id)
        .query(
          "SELECT id FROM classes WHERE id = @class_id AND lecturer_id = @lid",
        );
      if (!classRes.recordset[0]) {
        return res
          .status(404)
          .json({ message: "Class not found or unauthorized" });
      }
    }

    await pool
      .request()
      .input("title", sql.NVarChar, title)
      .input("description", sql.NVarChar, description || null)
      .input("course_code", sql.NVarChar, course_code)
      .input("course_name", sql.NVarChar, course_name)
      .input("deadline", sql.DateTime, new Date(deadline))
      .input("max_score", sql.Int, max_score || 100)
      .input("class_id", sql.Int, class_id || null)
      .input("id", sql.Int, req.params.id)
      .query(`UPDATE assignments SET title=@title, description=@description,
              course_code=@course_code, course_name=@course_name,
              deadline=@deadline, max_score=@max_score, class_id=@class_id, updated_at=GETDATE()
              WHERE id=@id`);

    await logAction(
      req.user.id,
      "UPDATE_ASSIGNMENT",
      "assignments",
      req.params.id,
      { title },
      req.ip,
    );
    res.json({ message: "Assignment updated" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to update assignment" });
  }
};

// DELETE /api/lecturer/assignments/:id
const deleteAssignment = async (req, res) => {
  try {
    const pool = await ensure();
    const result = await pool
      .request()
      .input("id", sql.Int, req.params.id)
      .input("lid", sql.Int, req.user.id)
      .query(
        "UPDATE assignments SET is_deleted=1, updated_at=GETDATE() WHERE id=@id AND lecturer_id=@lid AND is_deleted=0",
      );

    if (result.rowsAffected[0] === 0) {
      return res
        .status(404)
        .json({ message: "Assignment not found or unauthorized" });
    }

    await logAction(
      req.user.id,
      "DELETE_ASSIGNMENT",
      "assignments",
      req.params.id,
      null,
      req.ip,
    );
    res.json({ message: "Assignment deleted" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to delete assignment" });
  }
};

// GET /api/lecturer/submissions/:assignmentId
const getSubmissions = async (req, res) => {
  try {
    const pool = await ensure();
    // Verify assignment belongs to this lecturer
    const asgRes = await pool
      .request()
      .input("aid", sql.Int, req.params.assignmentId)
      .input("lid", sql.Int, req.user.id)
      .query(
        "SELECT id, title FROM assignments WHERE id = @aid AND lecturer_id = @lid AND is_deleted = 0",
      );

    if (!asgRes.recordset[0]) {
      return res.status(404).json({ message: "Assignment not found" });
    }

    const result = await pool
      .request()
      .input("aid", sql.Int, req.params.assignmentId).query(`
        SELECT s.id, s.student_id, u.name AS student_name, u.email AS student_email,
               s.submitted_at, s.resubmitted_at, s.original_name, s.file_size,
               s.is_late, g.id AS grade_id, g.score, g.feedback
        FROM submissions s
        INNER JOIN users u ON s.student_id = u.id
        LEFT JOIN grades g ON g.submission_id = s.id
        WHERE s.assignment_id = @aid
        ORDER BY s.submitted_at
      `);

    res.json({
      assignment: asgRes.recordset[0],
      submissions: result.recordset,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch submissions" });
  }
};

// POST /api/lecturer/grades
const createGrade = async (req, res) => {
  const { submission_id, score, feedback } = req.body;

  if (submission_id === undefined || score === undefined) {
    return res
      .status(400)
      .json({ message: "Submission ID and score are required" });
  }

  try {
    const pool = await ensure();
    // Verify submission belongs to lecturer's assignment
    const subRes = await pool
      .request()
      .input("sid", sql.Int, submission_id)
      .input("lid", sql.Int, req.user.id).query(`SELECT s.id FROM submissions s
              INNER JOIN assignments a ON s.assignment_id = a.id
              WHERE s.id = @sid AND a.lecturer_id = @lid`);

    if (!subRes.recordset[0]) {
      return res
        .status(404)
        .json({ message: "Submission not found or unauthorized" });
    }

    // Check existing grade
    const existingGrade = await pool
      .request()
      .input("sid", sql.Int, submission_id)
      .query("SELECT id FROM grades WHERE submission_id = @sid");

    if (existingGrade.recordset[0]) {
      return res
        .status(409)
        .json({ message: "Grade already exists. Use PUT to update." });
    }

    const result = await pool
      .request()
      .input("submission_id", sql.Int, submission_id)
      .input("lecturer_id", sql.Int, req.user.id)
      .input("score", sql.Decimal(5, 2), score)
      .input("feedback", sql.NVarChar, feedback || null)
      .query(`INSERT INTO grades (submission_id, lecturer_id, score, feedback)
              OUTPUT INSERTED.id
              VALUES (@submission_id, @lecturer_id, @score, @feedback)`);

    const gradeId = result.recordset[0].id;
    await logAction(
      req.user.id,
      "CREATE_GRADE",
      "grades",
      gradeId,
      { submission_id, score },
      req.ip,
    );
    await logGradeAccess(req.user.id, gradeId, "CREATE", req.ip);

    res.status(201).json({ message: "Grade submitted", id: gradeId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to submit grade" });
  }
};

// PUT /api/lecturer/grades/:id
const updateGrade = async (req, res) => {
  const { score, feedback } = req.body;

  try {
    const pool = await ensure();
    const result = await pool
      .request()
      .input("score", sql.Decimal(5, 2), score)
      .input("feedback", sql.NVarChar, feedback || null)
      .input("id", sql.Int, req.params.id)
      .input("lid", sql.Int, req.user.id)
      .query(`UPDATE grades SET score=@score, feedback=@feedback, updated_at=GETDATE()
              OUTPUT INSERTED.id
              WHERE id=@id AND lecturer_id=@lid`);

    if (result.rowsAffected[0] === 0) {
      return res
        .status(404)
        .json({ message: "Grade not found or unauthorized" });
    }

    await logAction(
      req.user.id,
      "UPDATE_GRADE",
      "grades",
      req.params.id,
      { score },
      req.ip,
    );
    await logGradeAccess(
      req.user.id,
      parseInt(req.params.id),
      "UPDATE",
      req.ip,
    );
    res.json({ message: "Grade updated" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to update grade" });
  }
};

// GET /api/lecturer/submissions/detail/:submissionId
const getSubmissionDetail = async (req, res) => {
  try {
    const pool = await ensure();
    const result = await pool
      .request()
      .input("sid", sql.Int, req.params.submissionId)
      .input("lid", sql.Int, req.user.id).query(`
        SELECT s.id AS submission_id, s.student_id, u.name AS student_name, u.email AS student_email,
               s.submitted_at, s.resubmitted_at, s.original_name, s.file_size, s.file_path, s.is_late,
               a.id AS assignment_id, a.title AS assignment_title, a.course_code, a.course_name,
               g.id AS grade_id, g.score, g.feedback
        FROM submissions s
        INNER JOIN assignments a ON s.assignment_id = a.id
        INNER JOIN users u ON u.id = s.student_id
        LEFT JOIN grades g ON g.submission_id = s.id
        WHERE s.id = @sid AND a.lecturer_id = @lid
      `);

    if (!result.recordset[0]) {
      return res
        .status(404)
        .json({ message: "Submission not found or unauthorized" });
    }

    const row = result.recordset[0];
    const submission = {
      submission_id: row.submission_id,
      student_id: row.student_id,
      student_name: row.student_name,
      student_email: row.student_email,
      submitted_at: row.submitted_at,
      resubmitted_at: row.resubmitted_at,
      original_name: row.original_name,
      file_size: row.file_size,
      file_path: row.file_path,
      is_late: row.is_late,
      assignment_title: row.assignment_title,
      course_code: row.course_code,
      course_name: row.course_name,
    };

    const grade = row.grade_id
      ? {
          id: row.grade_id,
          score: row.score,
          feedback: row.feedback,
        }
      : null;

    res.json({ submission, grade });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch submission details" });
  }
};

// GET /api/lecturer/exams/:id/submissions
const getExamSubmissions = async (req, res) => {
  try {
    const pool = await ensure();
    const exam = await verifyExamOwner(pool, req.params.id, req.user.id);

    if (!exam) {
      return res
        .status(404)
        .json({ message: "Exam not found or unauthorized" });
    }

    const result = await pool.request().input("exam_id", sql.Int, req.params.id)
      .query(`
        SELECT es.id, es.student_id, u.name AS student_name, u.email AS student_email,
               es.submitted_at, es.score, es.feedback,
               SUM(ISNULL(ea.points_awarded, 0)) AS computed_score,
               COUNT(ea.id) AS answer_count
        FROM exam_submissions es
        INNER JOIN users u ON es.student_id = u.id
        LEFT JOIN exam_answers ea ON ea.submission_id = es.id
        WHERE es.exam_id = @exam_id
        GROUP BY es.id, es.student_id, u.name, u.email, es.submitted_at, es.score, es.feedback
        ORDER BY es.submitted_at DESC
      `);

    res.json({ exam, submissions: result.recordset });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch exam submissions" });
  }
};

// GET /api/lecturer/exams/:examId/submissions/:submissionId
const getExamSubmission = async (req, res) => {
  try {
    const pool = await ensure();
    const exam = await verifyExamOwner(pool, req.params.examId, req.user.id);

    if (!exam) {
      return res
        .status(404)
        .json({ message: "Exam not found or unauthorized" });
    }

    const submissionRes = await pool
      .request()
      .input("submission_id", sql.Int, req.params.submissionId)
      .input("exam_id", sql.Int, req.params.examId).query(`
        SELECT es.id, es.student_id, u.name AS student_name, u.email AS student_email,
               es.submitted_at, es.score, es.feedback
        FROM exam_submissions es
        INNER JOIN users u ON es.student_id = u.id
        WHERE es.id = @submission_id AND es.exam_id = @exam_id
      `);

    if (!submissionRes.recordset[0]) {
      return res
        .status(404)
        .json({ message: "Submission not found or unauthorized" });
    }

    const answersRes = await pool
      .request()
      .input("submission_id", sql.Int, req.params.submissionId).query(`
        SELECT ea.id, ea.question_id, ea.answer_text, ea.is_correct, ea.points_awarded,
               q.prompt, q.question_type, q.options_json, q.correct_answer, q.points
        FROM exam_answers ea
        INNER JOIN exam_questions q ON q.id = ea.question_id
        WHERE ea.submission_id = @submission_id
        ORDER BY q.id
      `);

    const answers = answersRes.recordset.map((a) => ({
      ...a,
      options: parseOptions(a.options_json),
    }));

    res.json({ submission: submissionRes.recordset[0], answers });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch exam submission" });
  }
};

// PUT /api/lecturer/exams/:examId/submissions/:submissionId
const gradeExamSubmission = async (req, res) => {
  const { score, feedback, answers = [] } = req.body;

  try {
    const pool = await ensure();
    const exam = await verifyExamOwner(pool, req.params.examId, req.user.id);
    if (!exam) {
      return res
        .status(404)
        .json({ message: "Exam not found or unauthorized" });
    }

    const submissionRes = await pool
      .request()
      .input("submission_id", sql.Int, req.params.submissionId)
      .input("exam_id", sql.Int, req.params.examId).query(`
        SELECT id FROM exam_submissions
        WHERE id = @submission_id AND exam_id = @exam_id
      `);

    if (!submissionRes.recordset[0]) {
      return res
        .status(404)
        .json({ message: "Submission not found or unauthorized" });
    }

    for (const answer of answers) {
      const points =
        answer.points_awarded !== undefined && answer.points_awarded !== null
          ? answer.points_awarded
          : null;
      const isCorrect =
        answer.is_correct !== undefined && answer.is_correct !== null
          ? answer.is_correct
            ? 1
            : 0
          : null;

      await pool
        .request()
        .input("submission_id", sql.Int, req.params.submissionId)
        .input("question_id", sql.Int, answer.question_id)
        .input("points_awarded", sql.Decimal(5, 2), points)
        .input("is_correct", sql.Bit, isCorrect).query(`
          UPDATE exam_answers
          SET points_awarded = @points_awarded, is_correct = @is_correct
          WHERE submission_id = @submission_id AND question_id = @question_id
        `);
    }

    const scoreRes = await pool
      .request()
      .input("submission_id", sql.Int, req.params.submissionId)
      .query(
        `SELECT COALESCE(SUM(points_awarded), 0) AS total FROM exam_answers WHERE submission_id = @submission_id`,
      );

    const calculatedScore =
      score !== undefined && score !== null
        ? score
        : scoreRes.recordset[0].total;

    await pool
      .request()
      .input("score", sql.Decimal(5, 2), calculatedScore)
      .input("feedback", sql.NVarChar, feedback || null)
      .input("id", sql.Int, req.params.submissionId)
      .query(
        `UPDATE exam_submissions SET score=@score, feedback=@feedback WHERE id=@id`,
      );

    await logAction(
      req.user.id,
      "GRADE_EXAM_SUBMISSION",
      "exam_submissions",
      req.params.submissionId,
      { score: calculatedScore },
      req.ip,
    );
    res.json({ message: "Exam submission graded", score: calculatedScore });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to grade exam submission" });
  }
};

// GET /api/lecturer/exams
const getExams = async (req, res) => {
  try {
    const pool = await ensure();
    const result = await pool.request().input("lid", sql.Int, req.user.id)
      .query(`
        SELECT e.id, e.title, e.description, e.deadline, e.created_at,
               c.id AS class_id, c.name AS class_name, c.course_code,
               COUNT(DISTINCT q.id) AS question_count,
               COUNT(DISTINCT es.id) AS submission_count
        FROM exams e
        INNER JOIN classes c ON c.id = e.class_id
        LEFT JOIN exam_questions q ON q.exam_id = e.id
        LEFT JOIN exam_submissions es ON es.exam_id = e.id
        WHERE e.lecturer_id = @lid
        GROUP BY e.id, e.title, e.description, e.deadline, e.created_at, c.id, c.name, c.course_code
        ORDER BY e.deadline ASC, e.created_at DESC
      `);
    res.json(result.recordset);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch exams" });
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

const normalizeQuestionPayload = (body) => {
  const questionType = body.question_type;
  const options =
    questionType === "mcq"
      ? (body.options || []).map((o) => String(o).trim()).filter(Boolean)
      : [];

  return {
    questionType,
    prompt: body.prompt,
    options,
    correctAnswer: body.correct_answer || null,
    points: body.points || 1,
  };
};

const verifyExamOwner = async (pool, examId, lecturerId) => {
  const result = await pool
    .request()
    .input("id", sql.Int, examId)
    .input("lid", sql.Int, lecturerId).query(`
      SELECT e.id, e.title, e.description, e.deadline, e.created_at,
             c.id AS class_id, c.name AS class_name, c.course_code
      FROM exams e
      INNER JOIN classes c ON c.id = e.class_id
      WHERE e.id = @id AND e.lecturer_id = @lid
    `);
  return result.recordset[0];
};

// GET /api/lecturer/exams/:id
const getExam = async (req, res) => {
  try {
    const pool = await ensure();
    const exam = await verifyExamOwner(pool, req.params.id, req.user.id);

    if (!exam) {
      return res
        .status(404)
        .json({ message: "Exam not found or unauthorized" });
    }

    const questionsRes = await pool
      .request()
      .input("exam_id", sql.Int, req.params.id).query(`
        SELECT id, exam_id, question_type, prompt, options_json, correct_answer, points, created_at
        FROM exam_questions
        WHERE exam_id = @exam_id
        ORDER BY id
      `);

    const questions = questionsRes.recordset.map((q) => ({
      ...q,
      options: parseOptions(q.options_json),
    }));

    res.json({ exam, questions });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch exam" });
  }
};

// PUT /api/lecturer/exams/:id
const updateExam = async (req, res) => {
  const { deadline } = req.body;
  if (!deadline) {
    return res.status(400).json({ message: "Deadline is required" });
  }

  try {
    const pool = await ensure();
    const exam = await verifyExamOwner(pool, req.params.id, req.user.id);
    if (!exam) {
      return res
        .status(404)
        .json({ message: "Exam not found or unauthorized" });
    }

    await pool
      .request()
      .input("id", sql.Int, req.params.id)
      .input("deadline", sql.DateTime, new Date(deadline))
      .query(`UPDATE exams SET deadline = @deadline WHERE id = @id`);

    await logAction(
      req.user.id,
      "UPDATE_EXAM",
      "exams",
      req.params.id,
      { deadline },
      req.ip,
    );

    res.json({ message: "Exam deadline updated" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to update exam" });
  }
};

// POST /api/lecturer/exams
const createExam = async (req, res) => {
  const { class_id, title, description, deadline, questions = [] } = req.body;
  if (!class_id || !title || !deadline) {
    return res
      .status(400)
      .json({ message: "Class, exam title and deadline are required" });
  }

  try {
    const pool = await ensure();
    const classRes = await pool
      .request()
      .input("class_id", sql.Int, class_id)
      .input("lid", sql.Int, req.user.id)
      .query(
        "SELECT id FROM classes WHERE id = @class_id AND lecturer_id = @lid",
      );

    if (!classRes.recordset[0]) {
      return res
        .status(404)
        .json({ message: "Class not found or unauthorized" });
    }

    const examRes = await pool
      .request()
      .input("class_id", sql.Int, class_id)
      .input("lecturer_id", sql.Int, req.user.id)
      .input("title", sql.NVarChar, title)
      .input("description", sql.NVarChar, description || null)
      .input("deadline", sql.DateTime, new Date(deadline))
      .query(`INSERT INTO exams (class_id, lecturer_id, title, description, deadline)
              OUTPUT INSERTED.id
              VALUES (@class_id, @lecturer_id, @title, @description, @deadline)`);

    const examId = examRes.recordset[0].id;
    const validTypes = new Set(["mcq", "essay", "short_answer"]);

    for (const q of questions) {
      if (!q.prompt || !validTypes.has(q.question_type)) continue;
      const options =
        q.question_type === "mcq"
          ? (q.options || []).map((o) => String(o).trim()).filter(Boolean)
          : [];

      await pool
        .request()
        .input("exam_id", sql.Int, examId)
        .input("question_type", sql.NVarChar, q.question_type)
        .input("prompt", sql.NVarChar, q.prompt)
        .input(
          "options_json",
          sql.NVarChar,
          options.length ? JSON.stringify(options) : null,
        )
        .input("correct_answer", sql.NVarChar, q.correct_answer || null)
        .input("points", sql.Int, q.points || 1)
        .query(`INSERT INTO exam_questions (exam_id, question_type, prompt, options_json, correct_answer, points)
                VALUES (@exam_id, @question_type, @prompt, @options_json, @correct_answer, @points)`);
    }

    await logAction(
      req.user.id,
      "CREATE_EXAM",
      "exams",
      examId,
      { title, class_id },
      req.ip,
    );
    res.status(201).json({ message: "Exam created", id: examId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to create exam" });
  }
};

// POST /api/lecturer/exams/:id/questions
const addExamQuestion = async (req, res) => {
  const validTypes = new Set(["mcq", "essay", "short_answer"]);
  const { questionType, prompt, options, correctAnswer, points } =
    normalizeQuestionPayload(req.body);

  if (!prompt || !validTypes.has(questionType)) {
    return res
      .status(400)
      .json({ message: "Question type and prompt are required" });
  }

  try {
    const pool = await ensure();
    const exam = await verifyExamOwner(pool, req.params.id, req.user.id);
    if (!exam)
      return res
        .status(404)
        .json({ message: "Exam not found or unauthorized" });

    const result = await pool
      .request()
      .input("exam_id", sql.Int, req.params.id)
      .input("question_type", sql.NVarChar, questionType)
      .input("prompt", sql.NVarChar, prompt)
      .input(
        "options_json",
        sql.NVarChar,
        options.length ? JSON.stringify(options) : null,
      )
      .input("correct_answer", sql.NVarChar, correctAnswer)
      .input("points", sql.Int, points)
      .query(`INSERT INTO exam_questions (exam_id, question_type, prompt, options_json, correct_answer, points)
              OUTPUT INSERTED.id
              VALUES (@exam_id, @question_type, @prompt, @options_json, @correct_answer, @points)`);

    await logAction(
      req.user.id,
      "ADD_EXAM_QUESTION",
      "exam_questions",
      result.recordset[0].id,
      { exam_id: req.params.id },
      req.ip,
    );
    res
      .status(201)
      .json({ message: "Question added", id: result.recordset[0].id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to add question" });
  }
};

// PUT /api/lecturer/exams/:id/questions/:questionId
const updateExamQuestion = async (req, res) => {
  const validTypes = new Set(["mcq", "essay", "short_answer"]);
  const { questionType, prompt, options, correctAnswer, points } =
    normalizeQuestionPayload(req.body);

  if (!prompt || !validTypes.has(questionType)) {
    return res
      .status(400)
      .json({ message: "Question type and prompt are required" });
  }

  try {
    const pool = await ensure();
    const exam = await verifyExamOwner(pool, req.params.id, req.user.id);
    if (!exam)
      return res
        .status(404)
        .json({ message: "Exam not found or unauthorized" });

    const result = await pool
      .request()
      .input("id", sql.Int, req.params.questionId)
      .input("exam_id", sql.Int, req.params.id)
      .input("question_type", sql.NVarChar, questionType)
      .input("prompt", sql.NVarChar, prompt)
      .input(
        "options_json",
        sql.NVarChar,
        options.length ? JSON.stringify(options) : null,
      )
      .input("correct_answer", sql.NVarChar, correctAnswer)
      .input("points", sql.Int, points).query(`UPDATE exam_questions
              SET question_type=@question_type, prompt=@prompt, options_json=@options_json,
                  correct_answer=@correct_answer, points=@points
              WHERE id=@id AND exam_id=@exam_id`);

    if (result.rowsAffected[0] === 0) {
      return res.status(404).json({ message: "Question not found" });
    }

    await logAction(
      req.user.id,
      "UPDATE_EXAM_QUESTION",
      "exam_questions",
      req.params.questionId,
      { exam_id: req.params.id },
      req.ip,
    );
    res.json({ message: "Question updated" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to update question" });
  }
};

// DELETE /api/lecturer/exams/:id/questions/:questionId
const deleteExamQuestion = async (req, res) => {
  try {
    const pool = await ensure();
    const exam = await verifyExamOwner(pool, req.params.id, req.user.id);
    if (!exam)
      return res
        .status(404)
        .json({ message: "Exam not found or unauthorized" });

    const result = await pool
      .request()
      .input("id", sql.Int, req.params.questionId)
      .input("exam_id", sql.Int, req.params.id)
      .query(
        "DELETE FROM exam_questions WHERE id = @id AND exam_id = @exam_id",
      );

    if (result.rowsAffected[0] === 0) {
      return res.status(404).json({ message: "Question not found" });
    }

    await logAction(
      req.user.id,
      "DELETE_EXAM_QUESTION",
      "exam_questions",
      req.params.questionId,
      { exam_id: req.params.id },
      req.ip,
    );
    res.json({ message: "Question removed" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to remove question" });
  }
};

module.exports = {
  getClasses,
  getClass,
  createClass,
  addStudentToClass,
  removeStudentFromClass,
  getCourses,
  createAssignment,
  updateAssignment,
  deleteAssignment,
  getSubmissions,
  createGrade,
  updateGrade,
  getSubmissionDetail,
  getExamSubmissions,
  getExamSubmission,
  gradeExamSubmission,
  getExams,
  getExam,
  createExam,
  updateExam,
  addExamQuestion,
  updateExamQuestion,
  deleteExamQuestion,
};
