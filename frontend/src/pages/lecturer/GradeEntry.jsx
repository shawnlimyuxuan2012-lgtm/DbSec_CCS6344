import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../../utils/api';
import Layout from '../../components/Layout';

const GradeEntry = () => {
  const { submissionId } = useParams();
  const navigate = useNavigate();
  const [form, setForm] = useState({ score: '', feedback: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [existing, setExisting] = useState(null);
  const [submissionInfo, setSubmissionInfo] = useState(null);

  useEffect(() => {
    api.get(`/lecturer/submissions/detail/${submissionId}`)
      .then((response) => {
        const { submission, grade } = response.data;
        setSubmissionInfo(submission);
        if (grade) {
          setExisting(grade.id);
          setForm({ score: grade.score, feedback: grade.feedback || '' });
        }
      })
      .catch(() => {});
  }, [submissionId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!form.score) return setError('Score is required');
    setLoading(true);
    try {
      if (existing) {
        await api.put(`/lecturer/grades/${existing}`, form);
      } else {
        await api.post('/lecturer/grades', { submission_id: parseInt(submissionId, 10), ...form });
      }
      navigate(-1);
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to save grade';
      if (msg.includes('already exists')) {
        setError('Grade already exists. Please go back and use "Edit Grade".');
      } else {
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <button onClick={() => navigate(-1)} className="text-indigo-400 hover:text-indigo-300 text-sm mb-6 inline-flex items-center gap-1">← Back to submissions</button>
      <h1 className="page-title mb-6">Grade Entry</h1>
      <div className="card p-6 max-w-md">
        <div className="mb-4 border-b border-slate-800/70 pb-4">
          <p className="text-xs text-slate-500 mb-1 font-mono">Submission ID: #{submissionId}</p>
          {submissionInfo && (
            <div className="space-y-1 text-sm text-slate-300">
              <p><strong>Student:</strong> {submissionInfo.student_name}</p>
              <p><strong>Email:</strong> {submissionInfo.student_email}</p>
              <p><strong>File:</strong> {submissionInfo.original_name}</p>
              <p><strong>Submitted:</strong> {new Date(submissionInfo.submitted_at).toLocaleDateString()}</p>
            </div>
          )}
        </div>
        {error && <div className="alert-error mb-5">{error}</div>}
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="label">Score *</label>
            <input type="number" className="input" min={0} max={1000} step={0.5} placeholder="e.g. 85"
              value={form.score} onChange={e => setForm({ ...form, score: e.target.value })} required />
          </div>
          <div>
            <label className="label">Feedback (optional)</label>
            <textarea className="input h-32 resize-none" placeholder="Write feedback for the student…"
              value={form.feedback} onChange={e => setForm({ ...form, feedback: e.target.value })} />
          </div>
          <div className="flex gap-3">
            <button type="submit" disabled={loading} className="btn-primary">
              {loading ? 'Saving…' : 'Submit Grade'}
            </button>
            <button type="button" onClick={() => navigate(-1)} className="btn-secondary">Cancel</button>
          </div>
        </form>
      </div>
    </Layout>
  );
};

export default GradeEntry;
