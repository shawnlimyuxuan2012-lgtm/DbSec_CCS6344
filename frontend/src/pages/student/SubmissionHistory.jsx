import { useState, useEffect } from 'react';
import api from '../../utils/api';
import Layout from '../../components/Layout';

const SubmissionHistory = () => {
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/student/submissions').then(r => setSubmissions(r.data)).finally(() => setLoading(false));
  }, []);

  if (loading) return <Layout><div className="flex justify-center py-20"><div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" /></div></Layout>;

  return (
    <Layout>
      <h1 className="page-title mb-6">My Submissions</h1>

      {submissions.length === 0 ? (
        <div className="card p-12 text-center text-slate-400">No submissions yet.</div>
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-800/50">
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Assignment</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">File</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Submitted</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Grade</th>
              </tr>
            </thead>
            <tbody>
              {submissions.map(s => (
                <tr key={s.id} className="table-row">
                  <td className="px-6 py-4">
                    <p className="font-medium text-slate-200">{s.assignment_title}</p>
                    <p className="text-xs text-slate-500">{s.course_code}</p>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm text-slate-300 font-mono">{s.original_name}</p>
                    <p className="text-xs text-slate-500">{(s.file_size / 1024).toFixed(0)} KB</p>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-400">
                    {new Date(s.submitted_at).toLocaleDateString()}
                    {s.resubmitted_at && <p className="text-xs text-amber-400">Resubmitted {new Date(s.resubmitted_at).toLocaleDateString()}</p>}
                  </td>
                  <td className="px-6 py-4">
                    {s.is_late ? <span className="badge-red">Late</span> : <span className="badge-green">On time</span>}
                  </td>
                  <td className="px-6 py-4">
                    {s.score !== null
                      ? <span className="text-emerald-400 font-bold font-mono">{s.score}</span>
                      : <span className="text-slate-500 text-sm">Pending</span>}
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
export default SubmissionHistory;