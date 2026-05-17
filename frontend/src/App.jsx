import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';

// Public pages
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import { ForgotPassword, ResetPassword } from './pages/auth/ForgotPassword';
import PDPAPolicy from './pages/PDPAPolicy';

// Student pages
import StudentDashboard from './pages/student/Dashboard';
import StudentClasses from './pages/student/Classes';
import StudentExamList from './pages/student/StudentExamList';
import TakeExam from './pages/student/TakeExam';
import AssignmentList from './pages/student/AssignmentList';
import SubmitAssignment from './pages/student/SubmitAssignment';
import SubmissionHistory from './pages/student/SubmissionHistory';
import StudentGrades from './pages/student/StudentGrades';
import StudentProfile from './pages/student/Profile';

// Lecturer pages
import { LecturerDashboard } from './pages/lecturer/Dashboard';
import LecturerClasses, { LecturerClassView } from './pages/lecturer/Classes';
import LecturerExams from './pages/lecturer/Exams';
import LecturerExamView from './pages/lecturer/LecturerExamView';
import CreateAssignment from './pages/lecturer/CreateAssignment';
import EditAssignment from './pages/lecturer/EditAssignment';
import { SubmissionsView } from './pages/lecturer/Submissions';
import SubmissionDetail from './pages/lecturer/SubmissionDetail';
import GradeEntry from './pages/lecturer/GradeEntry';
import ExamSubmissionsView from './pages/lecturer/ExamSubmissionsView';
import ExamSubmissionGrade from './pages/lecturer/ExamSubmissionGrade';

// Admin pages
import { AdminDashboard, ManageUsers } from './pages/admin/Dashboard';
import AuditLogs from './pages/admin/AuditLogs';
import BreachNotification from './pages/admin/BreachNotification';
import DataRetention from './pages/admin/DataRetention';

const HomeRedirect = () => {
  const { user } = useAuth();
  if (user) return <Navigate to={`/${user.role}/dashboard`} replace />;
  return <Navigate to="/login" replace />;
};

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<HomeRedirect />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/pdpa-policy" element={<PDPAPolicy />} />

          <Route element={<ProtectedRoute roles={['student']} />}>
            <Route path="/student/dashboard" element={<StudentDashboard />} />
            <Route path="/student/classes" element={<StudentClasses />} />
            <Route path="/student/exams" element={<StudentExamList />} />
            <Route path="/student/exams/:id" element={<TakeExam />} />
            <Route path="/student/submit-assignment" element={<AssignmentList />} />
            <Route path="/student/submit-assignment/:id" element={<SubmitAssignment />} />
            <Route path="/student/submission-history" element={<SubmissionHistory />} />
            <Route path="/student/grade-view" element={<StudentGrades />} />
            <Route path="/student/profile" element={<StudentProfile />} />
            <Route path="/student/pdpa-request" element={<StudentProfile />} />
          </Route>

          <Route element={<ProtectedRoute roles={['lecturer']} />}>
            <Route path="/lecturer/dashboard" element={<LecturerDashboard />} />
            <Route path="/lecturer/classes" element={<LecturerClasses />} />
            <Route path="/lecturer/classes/:id" element={<LecturerClassView />} />
            <Route path="/lecturer/exams" element={<LecturerExams />} />
            <Route path="/lecturer/exams/:id" element={<LecturerExamView />} />
            <Route path="/lecturer/create-assignment" element={<CreateAssignment />} />
            <Route path="/lecturer/edit-assignment/:id" element={<EditAssignment />} />
            <Route path="/lecturer/submissions/:assignmentId" element={<SubmissionsView />} />
            <Route path="/lecturer/submissions/:assignmentId/view/:submissionId" element={<SubmissionDetail />} />
            <Route path="/lecturer/grade-entry/:submissionId" element={<GradeEntry />} />
            <Route path="/lecturer/exams/:examId/submissions" element={<ExamSubmissionsView />} />
            <Route path="/lecturer/exams/:examId/submissions/:submissionId" element={<ExamSubmissionGrade />} />
          </Route>

          <Route element={<ProtectedRoute roles={['admin']} />}>
            <Route path="/admin/dashboard" element={<AdminDashboard />} />
            <Route path="/admin/manage-users" element={<ManageUsers />} />
            <Route path="/admin/audit-logs" element={<AuditLogs />} />
            <Route path="/admin/breach-notification" element={<BreachNotification />} />
            <Route path="/admin/data-retention" element={<DataRetention />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
