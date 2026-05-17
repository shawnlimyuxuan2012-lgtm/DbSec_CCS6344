import { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import api from '../../utils/api';
import Layout from '../../components/Layout';

const ExamSubmissionsView = () => {
  const { examId } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get(`/lecturer/exams/${examId}/submissions`)
      .then(r => setData(r.data))
      .catch(() => setError('Failed to load exam submissions'))
      .finally(() => setLoading(false));
  }, [examId]);

  if (loading) return <Layout><div className="flex justify-center py-20"><div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" /></div></Layout>;
  if (error) return <Layout><div className="alert-error">{error}</div></Layout>;
  if (!data || !data.exam) return <Layout><div className="alert-error">Exam not found.</div></Layout>;

  return (
    <Layout>
      <Link to="/lecturer/exams" className="text-indigo-400 hover:text-indigo-300 text-sm mb-6 inline-flex items-center gap-1">← Exams</Link>
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="page-title">{data.exam.title}</h1>
          <p className="text-slate-400 mt-1">{data.exam.course_code} - {data.exam.class_name}</p>
          <p className="text-sm text-slate-500 mt-1">{data.submissions.length} submission(s)</p>
        </div>
        <Link to={`/lecturer/exams/${examId}`} className="btn-secondary text-sm px-4 py-2">Exam details</Link>
      </div>

      {data.submissions.length === 0 ? (
        <div className="card p-12 text-center text-slate-400">No exam submissions yet.</div>
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-800/50">
                {['Student', 'Submitted', 'Score', 'Status', 'Action'].map(h => (
                  <th key={h} className="px-5 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.submissions.map(sub => (
                <tr key={sub.id} className="table-row">
                  <td className="px-5 py-4">
                    <p className="font-medium text-slate-200">{sub.student_name}</p>
                    <p className="text-xs text-slate-500">{sub.student_email}</p>
                  </td>
                  <td className="px-5 py-4 text-xs text-slate-400">{new Date(sub.submitted_at).toLocaleDateString()}</td>
                  <td className="px-5 py-4 font-mono text-sm">
                    {sub.score !== null && sub.score !== undefined
                      ? <span className="text-emerald-400 font-bold">{sub.score}</span>
                      : <span className="text-slate-500">Pending</span>}
                  </td>
                  <td className="px-5 py-4">
                    {sub.score !== null && sub.score !== undefined
                      ? <span className="badge-green">Graded</span>
                      : <span className="badge-amber">Review</span>}
                  </td>
                  <td className="px-5 py-4">
                    <Link to={`/lecturer/exams/${examId}/submissions/${sub.id}`} className="text-xs btn-secondary px-3 py-1.5">View</Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Layout>
  );
};

export default ExamSubmissionsView;
