import { useState, useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../utils/api';
import Layout from '../../components/Layout';

import AssignmentTable from './AssignmentTable';

const ExamTable = ({ exams }) => {
  if (exams.length === 0) {
    return (
      <div className="card p-12 text-center">
        <p className="text-slate-400">No exams yet.</p>
      </div>
    );
  }

  return (
    <div className="card overflow-hidden">
      <table className="w-full">
        <thead>
          <tr className="border-b border-slate-800/50">
            {['Exam', 'Class', 'Deadline', 'Submissions', 'Questions', 'Actions'].map(h => (
              <th key={h} className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {exams.map(exam => {
            const deadline = exam.deadline ? new Date(exam.deadline) : null;
            const isPast = deadline && deadline < new Date();
            return (
              <tr key={exam.id} className="table-row">
                <td className="px-6 py-4">
                  <p className="font-medium text-slate-200">{exam.title}</p>
                  <p className="text-xs text-slate-500">{exam.description || 'No description'}</p>
                </td>
                <td className="px-6 py-4 text-sm text-slate-400">{exam.course_code} - {exam.class_name}</td>
                <td className="px-6 py-4 text-sm">
                  {deadline ? (
                    <span className={isPast ? 'text-red-400' : 'text-slate-300'}>{deadline.toLocaleDateString()}</span>
                  ) : (
                    <span className="text-slate-500">No deadline</span>
                  )}
                </td>
                <td className="px-6 py-4"><span className="badge-blue">{exam.submission_count || 0} submitted</span></td>
                <td className="px-6 py-4"><span className="badge-purple">{exam.question_count}</span></td>
                <td className="px-6 py-4">
                  <Link to={`/lecturer/exams/${exam.id}`} className="text-xs btn-secondary px-3 py-1.5">View</Link>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export const LecturerDashboard = () => {
  const { user } = useAuth();
  const [assignments, setAssignments] = useState([]);
  const [classes, setClasses] = useState([]);
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = async () => {
    const [assignmentRes, classRes, examRes] = await Promise.all([
      api.get('/lecturer/courses'),
      api.get('/lecturer/classes'),
      api.get('/lecturer/exams'),
    ]);
    setAssignments(assignmentRes.data);
    setClasses(classRes.data);
    setExams(examRes.data);
    setLoading(false);
  };

  useEffect(() => {
    load().catch(() => {
      setError('Failed to load lecturer dashboard');
      setLoading(false);
    });
  }, []);

  const handleDelete = async (id) => {
    if (!confirm('Delete this assignment?')) return;
    await api.delete(`/lecturer/assignments/${id}`);
    load();
  };

  if (loading) {
    return <Layout><div className="flex justify-center py-20"><div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" /></div></Layout>;
  }

  return (
    <Layout>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="text-slate-400 mt-1">Welcome, {user?.name}</p>
        </div>
        <Link to="/lecturer/classes" className="btn-primary">New Class</Link>
      </div>

      {error && <div className="alert-error mb-4">{error}</div>}

      <div className="grid grid-cols-4 gap-4 mb-8">
        <div className="card p-5">
          <p className="text-xs text-slate-500 font-medium uppercase tracking-wider mb-1">Classes</p>
          <p className="text-3xl font-bold text-sky-400 font-display">{classes.length}</p>
        </div>
        <div className="card p-5">
          <p className="text-xs text-slate-500 font-medium uppercase tracking-wider mb-1">Assignments</p>
          <p className="text-3xl font-bold text-indigo-400 font-display">{assignments.length}</p>
        </div>
        <div className="card p-5">
          <p className="text-xs text-slate-500 font-medium uppercase tracking-wider mb-1">Exams</p>
          <p className="text-3xl font-bold text-purple-400 font-display">{exams.length}</p>
        </div>
        <div className="card p-5">
          <p className="text-xs text-slate-500 font-medium uppercase tracking-wider mb-1">Submissions</p>
          <p className="text-3xl font-bold text-emerald-400 font-display">
            {assignments.reduce((total, a) => total + Number(a.submission_count || 0), 0)
              + exams.reduce((total, exam) => total + Number(exam.submission_count || 0), 0)}
          </p>
        </div>
      </div>

      <div className="flex items-center justify-between mb-4">
        <h2 className="font-display font-semibold text-slate-100">Assignment List</h2>
        <Link to="/lecturer/create-assignment" className="text-xs text-indigo-400 hover:text-indigo-300">Manage assignments</Link>
      </div>
      <AssignmentTable assignments={assignments} onDelete={handleDelete} />
      <div className="flex items-center justify-between mt-8 mb-4">
        <h2 className="font-display font-semibold text-slate-100">Exam List</h2>
        <Link to="/lecturer/exams" className="text-xs text-indigo-400 hover:text-indigo-300">Manage exams</Link>
      </div>
      <ExamTable exams={exams} />
    </Layout>
  );
};

