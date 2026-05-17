const express = require("express");
const router = express.Router();
const { authenticate, authorize } = require("../middleware/auth");
const {
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
} = require("../controllers/lecturerController");

router.use(authenticate, authorize("lecturer"));

router.get("/classes", getClasses);
router.post("/classes", createClass);
router.get("/classes/:id", getClass);
router.post("/classes/:id/students", addStudentToClass);
router.delete("/classes/:id/students/:studentId", removeStudentFromClass);
router.get("/courses", getCourses);
router.post("/assignments", createAssignment);
router.put("/assignments/:id", updateAssignment);
router.delete("/assignments/:id", deleteAssignment);
router.get("/submissions/:assignmentId", getSubmissions);
router.post("/grades", createGrade);
router.put("/grades/:id", updateGrade);
router.get("/submissions/detail/:submissionId", getSubmissionDetail);
router.get("/exams/:id/submissions", getExamSubmissions);
router.get("/exams/:examId/submissions/:submissionId", getExamSubmission);
router.put("/exams/:examId/submissions/:submissionId", gradeExamSubmission);
router.get("/exams", getExams);
router.post("/exams", createExam);
router.get("/exams/:id", getExam);
router.put("/exams/:id", updateExam);
router.post("/exams/:id/questions", addExamQuestion);
router.put("/exams/:id/questions/:questionId", updateExamQuestion);
router.delete("/exams/:id/questions/:questionId", deleteExamQuestion);

module.exports = router;
