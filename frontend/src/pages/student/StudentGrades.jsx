import { useState, useEffect } from 'react';
import api from '../../utils/api';
import Layout from '../../components/Layout';

const StudentGrades = () => {
  const [grades, setGrades] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/student/grades').then(r => setGrades(r.data)).finally(() => setLoading(false));
  }, []);

  const graded = grades.filter(g => g.score !== null && g.score !== undefined);
  const avg = graded.length
    ? (graded.reduce((s, g) => s + Number(g.score), 0) / graded.length).toFixed(1)
    : null;

  if (loading) return <Layout><div className="flex justify-center py-20"><div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" /></div></Layout>;

  return (
    <Layout>
      <div className="flex items-start justify-between mb-6">
        <h1 className="page-title">My Grades</h1>
        {avg && (
          <div className="card px-5 py-3 text-right">
            <p className="text-xs text-slate-500">Average Score</p>
            <p className="text-3xl font-bold font-display text-emerald-400">{avg}</p>
          </div>
        )}
      </div>

      {grades.length === 0 ? (
        <div className="card p-12 text-center text-slate-400">No grades available yet.</div>
      ) : (
        <div className="space-y-4">
          {grades.map(g => {
            const pct = g.score !== null && g.score !== undefined
              ? Math.round((g.score / g.max_score) * 100)
              : 0;
            const color = pct >= 80 ? 'emerald' : pct >= 60 ? 'amber' : 'red';
            return (
              <div key={`${g.record_type}-${g.grade_id}`} className="card p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="font-semibold text-slate-200">{g.title}</h3>
                    <p className="text-xs text-slate-500 mt-0.5">{g.record_type === 'exam' ? 'Exam' : 'Assignment'} · {g.course_code} · {g.course_name}</p>
                    <p className="text-xs text-slate-600 mt-1">Graded {new Date(g.graded_at).toLocaleDateString()}</p>
                  </div>
                  <div className="text-right">
                    <span className={`text-4xl font-black font-display text-${color}-400`}>{g.score !== null && g.score !== undefined ? g.score : '—'}</span>
                    <span className="text-slate-500 text-sm"> / {g.max_score}</span>
                    <p className="text-xs text-slate-500 mt-1">{g.score !== null && g.score !== undefined ? `${pct}%` : 'Pending'}</p>
                  </div>
                </div>

                <div className="w-full bg-slate-800 rounded-full h-1.5 mb-3">
                  <div className={`bg-${color}-500 h-1.5 rounded-full transition-all`} style={{ width: `${pct}%` }} />
                </div>

                {g.feedback && (
                  <div className="bg-slate-800/40 rounded-xl p-4 mt-2">
                    <p className="text-xs text-slate-500 mb-1">Feedback</p>
                    <p className="text-sm text-slate-300">{g.feedback}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </Layout>
  );
};

export default StudentGrades;
