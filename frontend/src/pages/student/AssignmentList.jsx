import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../utils/api';
import Layout from '../../components/Layout';

const AssignmentList = () => {
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/student/assignments')
      .then(r => setAssignments(r.data))
      .catch(() => setError('Unable to load assignments'))
      .finally(() => setLoading(false));
  }, []);

  const now = new Date();

  if (loading) {
    return <Layout><div className="flex justify-center py-20"><div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" /></div></Layout>;
  }

  return (
    <Layout>
      <h1 className="page-title mb-6">Assignments</h1>
      {error && <div className="alert-error mb-4">{error}</div>}
      {assignments.length === 0 ? (
        <div className="card p-12 text-center text-slate-400">No assignments available.</div>
      ) : (
        <div className="space-y-3">
          {assignments.map(a => {
            const deadline = new Date(a.deadline);
            const isOverdue = deadline < now;
            const diff = Math.ceil((deadline - now) / (1000 * 60 * 60 * 24));
            return (
              <div key={a.id} className="card p-5 flex items-center justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-slate-200 truncate">{a.title}</h3>
                    {a.submission_id ? (
                      a.score !== null ? <span className="badge-green">Graded: {a.score}</span>
                        : <span className="badge-blue">Submitted</span>
                    ) : isOverdue ? (
                      <span className="badge-red">Overdue</span>
                    ) : null}
                  </div>
                  <p className="text-xs text-slate-500">{a.course_code} · {a.course_name} · by {a.lecturer_name}</p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Deadline: {deadline.toLocaleDateString()} {deadline.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    {!isOverdue && <span className="ml-2 text-amber-400">({diff}d remaining)</span>}
                  </p>
                </div>
                <Link to={`/student/submit-assignment/${a.id}`} className="btn-primary text-sm shrink-0">
                  {a.submission_id ? 'View / Resubmit' : 'Submit'}
                </Link>
              </div>
            );
          })}
        </div>
      )}
    </Layout>
  );
};

export default AssignmentList;
