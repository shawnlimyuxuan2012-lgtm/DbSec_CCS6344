const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const { upload, handleUploadError } = require('../middleware/upload');
const {
  getClasses, joinClass,
  getExams, getExam, submitExam,
  getAssignments, getAssignment, submitAssignment,
  resubmitAssignment, getSubmissions, getGrades,
  downloadData, requestDeletion,
} = require('../controllers/studentController');

router.use(authenticate, authorize('student'));

router.get('/classes', getClasses);
router.post('/classes/join', joinClass);
router.get('/exams', getExams);
router.get('/exams/:id', getExam);
router.post('/exams/:id/submit', submitExam);
router.get('/assignments', getAssignments);
router.get('/assignments/:id', getAssignment);
router.post('/submit-assignment/:id', upload.single('file'), handleUploadError, submitAssignment);
router.put('/resubmit-assignment/:id', upload.single('file'), handleUploadError, resubmitAssignment);
router.get('/submissions', getSubmissions);
router.get('/grades', getGrades);
router.get('/download-data', downloadData);
router.delete('/delete-account', requestDeletion);

module.exports = router;
