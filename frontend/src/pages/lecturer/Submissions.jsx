import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api from '../../utils/api';
import Layout from '../../components/Layout';

export const SubmissionsView = () => {
  const { assignmentId } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = () => {
    api.get(`/lecturer/submissions/${assignmentId}`)
      .then(r => setData(r.data))
      .finally(() => setLoading(false));
  };
  useEffect(load, [assignmentId]);

  if (loading) return <Layout><div className="flex justify-center py-20"><div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" /></div></Layout>;

  if (!data) return <Layout><div className="alert-error">Assignment not found.</div></Layout>;

  return (
    <Layout>
      <Link to="/lecturer/dashboard" className="text-indigo-400 hover:text-indigo-300 text-sm mb-6 inline-flex items-center gap-1">← Dashboard</Link>
      <h1 className="page-title mb-1">{data.assignment.title}</h1>
      <p className="text-slate-400 text-sm mb-6">{data.submissions.length} submission(s)</p>

      {data.submissions.length === 0 ? (
        <div className="card p-12 text-center text-slate-400">No submissions yet.</div>
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-800/50">
                {['Student', 'File', 'Submitted', 'Status', 'Grade', 'Action'].map(h => (
                  <th key={h} className="px-5 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.submissions.map(s => (
                <tr key={s.id} className="table-row">
                  <td className="px-5 py-4">
                    <p className="font-medium text-slate-200">{s.student_name}</p>
                    <p className="text-xs text-slate-500">{s.student_email}</p>
                  </td>
                  <td className="px-5 py-4 text-sm text-slate-400 font-mono">{s.original_name}</td>
                  <td className="px-5 py-4 text-xs text-slate-400">{new Date(s.submitted_at).toLocaleDateString()}</td>
                  <td className="px-5 py-4">
                    {s.is_late ? <span className="badge-red">Late</span> : <span className="badge-green">On time</span>}
                  </td>
                  <td className="px-5 py-4 font-mono text-sm">
                    {s.score !== null
                      ? <span className="text-emerald-400 font-bold">{s.score}</span>
                      : <span className="text-slate-500">—</span>}
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-2">
                      <Link to={`/lecturer/submissions/${assignmentId}/view/${s.id}`} className="text-xs btn-ghost px-3 py-1.5">View</Link>
                      <Link to={`/lecturer/grade-entry/${s.id}`} className="text-xs btn-secondary px-3 py-1.5">
                        {s.grade_id ? 'Edit Grade' : 'Grade'}
                      </Link>
                    </div>
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

export const SubmissionDetail = () => {
  const { submissionId } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

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
  // derive uploads URL from file_path if present
  const getFileUrl = (filePath) => {
    if (!filePath) return null;
    const parts = filePath.replace(/\\/g, '/').split('/');
    const fname = parts[parts.length - 1];
    return `/uploads/${fname}`;
  };

  const navigate = useNavigate();

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
            <a href={getFileUrl(submission.file_path)} className="btn-primary text-sm" download>
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

export const ExamSubmissionsView = () => {
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

export const ExamSubmissionGrade = ({ examIdProp, submissionIdProp, onClose }) => {
  const params = useParams();
  const examId = examIdProp || params.examId;
  const submissionId = submissionIdProp || params.submissionId;
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [answers, setAnswers] = useState([]);
  const [form, setForm] = useState({ score: '', feedback: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.get(`/lecturer/exams/${examId}/submissions/${submissionId}`)
      .then((response) => {
        setData(response.data);
        setForm({
          score: response.data.submission.score ?? '',
          feedback: response.data.submission.feedback || '',
        });
        setAnswers(response.data.answers.map(answer => ({
          ...answer,
          points_awarded: answer.points_awarded ?? '',
        })));
      })
      .catch(() => setError('Failed to load exam submission'))
      .finally(() => setLoading(false));
  }, [examId, submissionId]);

  const updateAnswer = (questionId, value) => {
    setAnswers(current => current.map(item => item.question_id === questionId ? { ...item, points_awarded: value } : item));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (form.score === '') return setError('Score is required');
    setSaving(true);

    try {
      await api.put(`/lecturer/exams/${examId}/submissions/${submissionId}`, {
        score: parseFloat(form.score),
        feedback: form.feedback,
        answers: answers.map(a => ({
          question_id: a.question_id,
          points_awarded: a.points_awarded === '' ? null : parseFloat(a.points_awarded),
          is_correct: a.is_correct,
        })),
      });
      if (onClose) onClose(); else navigate(-1);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save exam grade');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Layout><div className="flex justify-center py-20"><div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" /></div></Layout>;
  if (error) return <Layout><div className="alert-error">{error}</div></Layout>;
  if (!data || !data.submission) return <Layout><div className="alert-error">Exam submission not found.</div></Layout>;

  return (
    <Layout>
      <button onClick={() => (onClose ? onClose() : navigate(-1))} className="text-indigo-400 hover:text-indigo-300 text-sm mb-6 inline-flex items-center gap-1">← Back to submissions</button>
      <h1 className="page-title mb-6">Grade Exam Submission</h1>
      <div className="card p-6 max-w-3xl space-y-5">
        <div className="rounded-2xl border border-slate-800/60 bg-slate-950/80 p-4 text-sm text-slate-300">
          <p className="text-slate-400 text-xs uppercase tracking-[0.2em] mb-2">Student</p>
          <p className="font-medium">{data.submission.student_name}</p>
          <p className="text-slate-500 text-xs">{data.submission.student_email}</p>
          <p className="text-slate-500 text-xs mt-2">Submitted {new Date(data.submission.submitted_at).toLocaleDateString()}</p>
        </div>

        {data.answers.map(answer => {
          const computedCorrect =
            answer.is_correct === null || answer.is_correct === undefined
              ? String(answer.answer_text || '').trim().toLowerCase() ===
                String(answer.correct_answer || '').trim().toLowerCase()
              : Boolean(answer.is_correct);

          return (
            <div key={answer.question_id} className="card p-5">
              <div className="flex items-center justify-between gap-4 mb-3">
                <div>
                  <p className="font-medium text-slate-200">{answer.prompt}</p>
                  <p className="text-xs text-slate-500">{answer.question_type.replace('_', ' ')}</p>
                </div>
                <span className={`badge-${computedCorrect ? 'green' : 'amber'}`}>
                  {answer.is_correct === null || answer.is_correct === undefined
                    ? computedCorrect
                      ? 'Correct (auto)'
                      : 'Manual review'
                    : computedCorrect
                      ? 'Correct'
                      : 'Incorrect'}
                </span>
              </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <p className="label">Student answer</p>
                <p className="text-sm text-slate-200 whitespace-pre-wrap">{answer.answer_text || 'No answer'}</p>
              </div>
              <div>
                <p className="label">Correct answer</p>
                <p className="text-sm text-slate-200 whitespace-pre-wrap">{answer.correct_answer || 'N/A'}</p>
              </div>
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div>
                <p className="label">Points available</p>
                <p className="text-slate-300">{answer.points}</p>
              </div>
              <div>
                <label className="label">Points awarded</label>
                <input
                  type="number"
                  className="input"
                  min={0}
                  max={answer.points}
                  step={0.5}
                  value={answer.points_awarded}
                  onChange={e => updateAnswer(answer.question_id, e.target.value)}
                />
              </div>
            </div>
          </div>
        );
      })}

        <div className="card p-5">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="label">Total score *</label>
              <input type="number" className="input" min={0} step={0.5} placeholder="Total exam score"
                value={form.score} onChange={e => setForm({ ...form, score: e.target.value })} required />
            </div>
            <div>
              <label className="label">Feedback (optional)</label>
              <textarea className="input h-32 resize-none" placeholder="Write feedback for the student…"
                value={form.feedback} onChange={e => setForm({ ...form, feedback: e.target.value })} />
            </div>
            {error && <div className="alert-error">{error}</div>}
            <div className="flex gap-3">
              <button type="submit" disabled={saving} className="btn-primary">
                {saving ? 'Saving…' : 'Submit Grade'}
              </button>
              <button type="button" onClick={() => navigate(-1)} className="btn-secondary">Cancel</button>
            </div>
          </form>
        </div>
      </div>
    </Layout>
  );
};

export const GradeEntry = () => {
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
        await api.post('/lecturer/grades', { submission_id: parseInt(submissionId), ...form });
      }
      navigate(-1);
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to save grade';
      if (msg.includes('already exists')) {
        // Try update instead — get grade id from a refetch would be needed
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
