import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../../utils/api';
import Layout from '../../components/Layout';

const SubmissionDetail = () => {
  const { submissionId } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    api.get(`/lecturer/submissions/detail/${submissionId}`)
      .then(r => setData(r.data))
      .catch(() => setError('Failed to load submission'))
      .finally(() => setLoading(false));
  }, [submissionId]);

  if (loading) return <Layout><div className="flex justify-center py-20"><div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" /></div></Layout>;
  if (error) return <Layout><div className="alert-error">{error}</div></Layout>;
  if (!data || !data.submission) return <Layout><div className="alert-error">Submission not found.</div></Layout>;

  const { submission } = data;
  const getFileUrl = (filePath) => {
    if (!filePath) return null;
    const parts = filePath.replace(/\\/g, '/').split('/');
    const fname = parts[parts.length - 1];
    return `/uploads/${fname}`;
  };

  return (
    <Layout>
      <button onClick={() => navigate(-1)} className="text-indigo-400 hover:text-indigo-300 text-sm mb-6 inline-flex items-center gap-1">← Back</button>
      <h1 className="page-title mb-4">Submission Detail</h1>
      <div className="card p-6 max-w-3xl">
        <div className="mb-4 text-sm text-slate-300">
          <p><strong>Student:</strong> {submission.student_name} &lt;{submission.student_email}&gt;</p>
          <p><strong>Assignment:</strong> {submission.assignment_title}</p>
          <p><strong>Submitted:</strong> {new Date(submission.submitted_at).toLocaleString()}</p>
        </div>
        <div className="border-t border-slate-800/60 pt-4">
          <p className="label">File</p>
          <p className="text-sm text-slate-200 font-mono mb-2">{submission.original_name}</p>
          {submission.file_path ? (
            <a href={getFileUrl(submission.file_path)} className="btn-primary text-sm" download={submission.original_name}>
              Download file
            </a>
          ) : (
            <p className="text-slate-500">No file available</p>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default SubmissionDetail;
