import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../utils/api';
import Layout from '../../components/Layout';

const StatCard = ({ label, value, accent = 'text-indigo-400' }) => (
  <div className="card p-5">
    <p className="text-xs text-slate-500 font-medium uppercase tracking-wider mb-1">{label}</p>
    <p className={`text-3xl font-bold ${accent} font-display`}>{value}</p>
  </div>
);

const StudentDashboard = () => {
  const { user } = useAuth();
  const [assignments, setAssignments] = useState([]);
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([api.get('/student/assignments'), api.get('/student/classes')])
      .then(([asgRes, classRes]) => {
        setAssignments(asgRes.data);
        setClasses(classRes.data);
      })
      .catch(() => setError('Failed to load dashboard'))
      .finally(() => setLoading(false));
  }, []);

  const now = new Date();
  const upcoming = assignments.filter(a => new Date(a.deadline) > now && !a.submission_id);
  const submitted = assignments.filter(a => a.submission_id);
  const graded = assignments.filter(a => a.score !== null && a.score !== undefined);
  const avg = graded.length
    ? (graded.reduce((s, a) => s + Number(a.score), 0) / graded.length).toFixed(1)
    : '-';

  if (loading) {
    return <Layout><div className="flex justify-center py-20"><div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" /></div></Layout>;
  }

  return (
    <Layout>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="page-title">Good day, {user?.name?.split(' ')[0]}</h1>
          <p className="text-slate-400 mt-1">Here is your academic overview</p>
        </div>
        <Link to="/student/classes" className="btn-primary">Join Class</Link>
      </div>

      {error && <div className="alert-error mb-4">{error}</div>}

      <div className="grid grid-cols-4 gap-4 mb-8">
        <StatCard label="Classes" value={classes.length} accent="text-sky-400" />
        <StatCard label="Pending" value={upcoming.length} accent="text-amber-400" />
        <StatCard label="Submitted" value={submitted.length} accent="text-indigo-400" />
        <StatCard label="Avg Score" value={avg} accent="text-emerald-400" />
      </div>

      <div className="card overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-800/50 flex items-center justify-between">
          <h2 className="font-display font-semibold text-slate-200">Upcoming Assignments</h2>
          <Link to="/student/submit-assignment" className="text-xs text-indigo-400 hover:text-indigo-300">View all</Link>
        </div>

        {upcoming.length === 0 ? (
          <div className="px-6 py-12 text-center text-slate-500 text-sm">No pending assignments.</div>
        ) : (
          <div className="divide-y divide-slate-800/50">
            {upcoming.slice(0, 5).map(a => {
              const deadline = new Date(a.deadline);
              const diff = Math.ceil((deadline - now) / (1000 * 60 * 60 * 24));
              const urgent = diff <= 3;
              return (
                <div key={a.id} className="px-6 py-4 flex items-center justify-between hover:bg-slate-800/20 transition-colors">
                  <div>
                    <p className="font-medium text-slate-200">{a.title}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{a.course_code} - {a.class_name || a.course_name}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={urgent ? 'badge-red' : 'badge-amber'}>{diff <= 0 ? 'Overdue' : `${diff}d left`}</span>
                    <Link to={`/student/submit-assignment/${a.id}`} className="btn-primary text-xs px-3 py-1.5">Submit</Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {graded.length > 0 && (
        <div className="card overflow-hidden mt-6">
          <div className="px-6 py-4 border-b border-slate-800/50">
            <h2 className="font-display font-semibold text-slate-200">Recent Grades</h2>
          </div>
          <div className="divide-y divide-slate-800/50">
            {graded.slice(0, 3).map(a => (
              <div key={a.id} className="px-6 py-4 flex items-center justify-between">
                <div>
                  <p className="font-medium text-slate-200">{a.title}</p>
                  <p className="text-xs text-slate-500">{a.course_code}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-bold font-display text-emerald-400">{a.score}</span>
                  <span className="text-slate-500 text-sm">/ {a.max_score}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </Layout>
  );
};

export default StudentDashboard;
