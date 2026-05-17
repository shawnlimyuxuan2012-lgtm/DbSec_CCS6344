import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../../utils/api';
import Layout from '../../components/Layout';

const GradeView = () => {
  const { id } = useParams();
  const [submission, setSubmission] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get(`/student/submissions/${id}`)
      .then(r => setSubmission(r.data))
      .catch(() => setError('Submission not found'))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return <Layout><div className="flex justify-center py-20"><div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" /></div></Layout>;
  }

  if (error || !submission) {
    return <Layout><div className="alert-error">{error || 'Submission details unavailable'}</div></Layout>;
  }

  return (
    <Layout>
      <Link to="/student/submission-history" className="text-indigo-400 hover:text-indigo-300 text-sm mb-6 inline-flex items-center gap-1">← Back to submission history</Link>

      <div className="card p-6">
        <h1 className="page-title mb-4">Submission Details</h1>
        <div className="grid gap-4 md:grid-cols-2 mb-6">
          <div>
            <p className="text-slate-400 text-sm">Assignment</p>
            <p className="text-slate-200">{submission.assignment_title}</p>
          </div>
          <div>
            <p className="text-slate-400 text-sm">Submitted On</p>
            <p className="text-slate-200">{new Date(submission.submitted_at).toLocaleString()}</p>
          </div>
          <div>
            <p className="text-slate-400 text-sm">Status</p>
            <p className="text-slate-200">{submission.grade !== null ? 'Graded' : 'Pending'}</p>
          </div>
          <div>
            <p className="text-slate-400 text-sm">Score</p>
            <p className="text-slate-200">{submission.grade !== null ? `${submission.grade} / ${submission.max_score}` : 'Not graded yet'}</p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <p className="text-slate-400 text-sm">Feedback</p>
            <p className="text-slate-300 whitespace-pre-line">{submission.feedback || 'No feedback has been provided yet.'}</p>
          </div>

          <div>
            <p className="text-slate-400 text-sm">Submitted File</p>
            <a href={submission.file_path} className="text-indigo-300 hover:text-indigo-200 break-all" target="_blank" rel="noreferrer">{submission.file_path}</a>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default GradeView;
