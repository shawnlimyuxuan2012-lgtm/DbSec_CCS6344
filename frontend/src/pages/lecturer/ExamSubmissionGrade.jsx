import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../../utils/api';
import Layout from '../../components/Layout';

const ExamSubmissionGrade = ({ examIdProp, submissionIdProp, onClose }) => {
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

export default ExamSubmissionGrade;
