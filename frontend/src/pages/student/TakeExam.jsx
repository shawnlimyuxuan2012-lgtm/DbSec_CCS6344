import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../../utils/api';
import Layout from '../../components/Layout';

const TakeExam = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [exam, setExam] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [result, setResult] = useState(null);

  useEffect(() => {
    api.get(`/student/exams/${id}`)
      .then(r => {
        const data = r.data;
        setExam(data.exam);
        setQuestions(data.questions);

        // If already submitted, populate answers
        if (data.exam.submission_id) {
          setSubmitted(true);
          const initial = {};
          data.answers?.forEach(a => {
            initial[a.question_id] = a.answer_text;
          });
          setAnswers(initial);
          setResult({ score: data.exam.score });
        }
      })
      .catch(() => setError('Unable to load exam'))
      .finally(() => setLoading(false));
  }, [id]);

  const handleAnswerChange = (questionId, value) => {
    setAnswers(prev => ({ ...prev, [questionId]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!confirm('Are you sure you want to submit your exam? This action cannot be undone.')) return;

    setSubmitting(true);
    setError('');
    try {
      const res = await api.post(`/student/exams/${id}/submit`, { answers });
      setSubmitted(true);
      setResult({ score: res.data.score, message: res.data.message });
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit exam');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <Layout><div className="flex justify-center py-20"><div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" /></div></Layout>;
  }

  if (error && !exam) {
    return <Layout><div className="alert-error">{error}</div></Layout>;
  }

  if (!exam) {
    return <Layout><div className="alert-error">Exam not found</div></Layout>;
  }

  // Check deadline
  const isPastDeadline = exam.deadline && new Date() > new Date(exam.deadline);
  const canTake = !submitted && !isPastDeadline;

  return (
    <Layout>
      <div className="mb-6">
        <Link to="/student/exams" className="text-sm text-indigo-400 hover:text-indigo-300">← Back to exams</Link>
        <h1 className="page-title mt-3">{exam.title}</h1>
        <p className="text-slate-400 text-sm mt-1">{exam.course_code} · {exam.class_name}</p>
      </div>

      {isPastDeadline && !submitted && (
        <div className="alert-error mb-6">This exam deadline has passed. You can no longer submit.</div>
      )}

      {submitted && (
        <div className="card p-6 mb-6 border-emerald-500/30">
          <div className="flex items-center gap-3">
            <span className="text-2xl">✅</span>
            <div>
              <p className="text-emerald-400 font-semibold text-lg">Exam Submitted</p>
              <p className="text-slate-400 text-sm">{result?.message || 'Your answers have been recorded.'}</p>
              {result?.score !== null && result?.score !== undefined && (
                <p className="text-slate-200 mt-1 font-mono text-lg">Score: <span className="text-emerald-400 font-bold">{result.score}</span></p>
              )}
              {result?.score === null && (
                <p className="text-amber-400 text-sm mt-1">Your exam contains questions that require manual grading. Results will be available once reviewed.</p>
              )}
            </div>
          </div>
        </div>
      )}

      {!submitted && questions.length === 0 && (
        <div className="card p-12 text-center text-slate-500">This exam has no questions.</div>
      )}

      {questions.length > 0 && (
        <form onSubmit={handleSubmit}>
          <div className="space-y-6">
            {questions.map((q, index) => (
              <div key={q.id} className="card p-5">
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div className="flex-1">
                    <p className="text-xs text-indigo-400 font-medium uppercase tracking-wider mb-1">
                      Question {index + 1} · {q.question_type === 'mcq' ? 'Multiple Choice' : q.question_type === 'essay' ? 'Essay' : 'Short Answer'}
                      {!submitted && <span className="text-slate-500 ml-2">({q.points} pts)</span>}
                    </p>
                    <p className="text-slate-200 whitespace-pre-wrap">{q.prompt}</p>
                  </div>
                  {submitted && <span className="text-xs text-slate-500">{q.points} pts</span>}
                </div>

                {q.question_type === 'mcq' ? (
                  <div className="space-y-2 mt-3">
                    {q.options?.map((option, oi) => (
                      <label
                        key={oi}
                        className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-colors
                          ${submitted
                            ? answers[q.id] === option
                              ? 'border-indigo-500/40 bg-indigo-500/10'
                              : 'border-slate-800/60 opacity-70'
                            : 'border-slate-800/60 hover:border-slate-700/60 hover:bg-slate-900/50'
                          }`}
                      >
                        <input
                          type="radio"
                          name={`q-${q.id}`}
                          value={option}
                          checked={answers[q.id] === option}
                          onChange={e => handleAnswerChange(q.id, e.target.value)}
                          disabled={submitted}
                          className="accent-indigo-500"
                        />
                        <span className={`text-sm ${submitted && answers[q.id] === option ? 'text-indigo-300' : 'text-slate-300'}`}>
                          {option}
                        </span>
                      </label>
                    ))}
                  </div>
                ) : (
                  <div className="mt-3">
                    {submitted ? (
                      <div className="p-3 rounded-xl bg-slate-900/50 border border-slate-800/60">
                        <p className="text-sm text-slate-400 mb-1">Your answer:</p>
                        <p className="text-sm text-slate-200 whitespace-pre-wrap">{answers[q.id] || <span className="italic text-slate-500">No answer</span>}</p>
                      </div>
                    ) : (
                      q.question_type === 'essay' ? (
                        <textarea
                          className="input h-40 resize-none"
                          placeholder="Write your answer here…"
                          value={answers[q.id] || ''}
                          onChange={e => handleAnswerChange(q.id, e.target.value)}
                          disabled={submitted}
                        />
                      ) : (
                        <input
                          type="text"
                          className="input"
                          placeholder="Your answer"
                          value={answers[q.id] || ''}
                          onChange={e => handleAnswerChange(q.id, e.target.value)}
                          disabled={submitted}
                        />
                      )
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>

          {canTake && (
            <div className="flex gap-3 mt-8">
              <button
                type="submit"
                disabled={submitting}
                className="btn-primary px-8 py-3 text-base"
              >
                {submitting ? 'Submitting…' : 'Submit Exam'}
              </button>
              <button
                type="button"
                onClick={() => navigate('/student/exams')}
                className="btn-secondary px-6 py-3"
              >
                Cancel
              </button>
            </div>
          )}

          {submitted && (
            <div className="mt-8 text-center">
              <Link to="/student/exams" className="btn-secondary inline-flex px-6 py-3">Return to exam list</Link>
            </div>
          )}
        </form>
      )}
    </Layout>
  );
};

export default TakeExam;