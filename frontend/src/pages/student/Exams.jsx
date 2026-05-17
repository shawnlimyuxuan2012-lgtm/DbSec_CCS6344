import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import api from '../../utils/api';
import Layout from '../../components/Layout';

export const StudentExamList = () => {
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/student/exams')
      .then(r => setExams(r.data))
      .catch(() => setError('Failed to load exams'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <Layout><div className="flex justify-center py-20"><div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" /></div></Layout>;
  }

  return (
    <Layout>
      <div className="mb-6">
        <h1 className="page-title">Exams</h1>
        <p className="text-slate-400 mt-1">Take exams assigned to your classes.</p>
      </div>

      {error && <div className="alert-error mb-4">{error}</div>}

      <div className="card overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-800/50">
              {['Exam', 'Class', 'Deadline', 'Questions', 'Status', 'Actions'].map(h => (
                <th key={h} className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {exams.length === 0 ? (
              <tr><td className="px-6 py-12 text-center text-slate-500" colSpan="6">No exams available.</td></tr>
            ) : exams.map(exam => {
              const deadline = exam.deadline ? new Date(exam.deadline) : null;
              const isPast = deadline && deadline < new Date();
              const submitted = Boolean(exam.submission_id);
              return (
                <tr key={exam.id} className="table-row">
                  <td className="px-6 py-4">
                    <p className="font-medium text-slate-200">{exam.title}</p>
                    <p className="text-xs text-slate-500">{exam.description || 'No description'}</p>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-400">{exam.course_code} - {exam.class_name}</td>
                  <td className="px-6 py-4 text-sm">
                    {deadline ? <span className={isPast ? 'text-red-400' : 'text-slate-300'}>{deadline.toLocaleString()}</span> : <span className="text-slate-500">No deadline</span>}
                  </td>
                  <td className="px-6 py-4"><span className="badge-purple">{exam.question_count}</span></td>
                  <td className="px-6 py-4">
                    {submitted ? (
                      <span className="badge-green">{exam.score === null || exam.score === undefined ? 'Submitted' : `Score: ${exam.score}`}</span>
                    ) : isPast ? (
                      <span className="badge-red">Closed</span>
                    ) : (
                      <span className="badge-amber">Pending</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <Link to={`/student/exams/${exam.id}`} className={submitted || isPast ? 'text-xs btn-secondary px-3 py-1.5' : 'text-xs btn-primary px-3 py-1.5'}>
                      {submitted ? 'View' : isPast ? 'View' : 'Take Exam'}
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </Layout>
  );
};

export const TakeExam = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [exam, setExam] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    api.get(`/student/exams/${id}`)
      .then(r => {
        setExam(r.data.exam);
        setQuestions(r.data.questions);
        setAnswers(r.data.answers?.reduce((acc, answer) => ({ ...acc, [answer.question_id]: answer.answer_text }), {}));
      })
      .catch(() => setError('Exam not found'))
      .finally(() => setLoading(false));
  }, [id]);

  const updateAnswer = (questionId, value) => {
    setAnswers(current => ({ ...current, [questionId]: value }));
  };

  const submit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    setSuccess('');
    try {
      const { data } = await api.post(`/student/exams/${id}/submit`, { answers });
      setSuccess(data.message);
      setTimeout(() => navigate('/student/exams'), 1200);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit exam');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <Layout><div className="flex justify-center py-20"><div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" /></div></Layout>;
  }

  if (!exam) {
    return <Layout><div className="alert-error">{error || 'Exam not found'}</div></Layout>;
  }

  const deadline = exam.deadline ? new Date(exam.deadline) : null;
  const isPast = deadline && deadline < new Date();
  const submitted = Boolean(exam.submission_id);

  return (
    <Layout>
      <Link to="/student/exams" className="text-indigo-400 hover:text-indigo-300 text-sm mb-6 inline-flex items-center gap-1">Back to exams</Link>

      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="page-title">{exam.title}</h1>
          <p className="text-slate-400 mt-1">{exam.course_code} - {exam.class_name}</p>
          {deadline && <p className={isPast ? 'text-sm text-red-400 mt-1' : 'text-sm text-slate-500 mt-1'}>Deadline: {deadline.toLocaleString()}</p>}
        </div>
        {submitted && <span className="badge-green">Submitted</span>}
      </div>

      {error && <div className="alert-error mb-4">{error}</div>}
      {success && <div className="alert-success mb-4">{success}</div>}

      {submitted ? (
        <div className="space-y-4">
          <div className="card p-6">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="font-semibold text-slate-200">Submission summary</h2>
                <p className="text-sm text-slate-400 mt-1">You already submitted this exam.</p>
              </div>
              <span className="badge-green text-sm">Submitted</span>
            </div>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div>
                <p className="text-xs text-slate-500">Score</p>
                <p className="text-xl font-bold text-slate-100">{exam.score !== null && exam.score !== undefined ? exam.score : 'Pending review'}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Feedback</p>
                <p className="text-sm text-slate-300">{exam.feedback || 'No feedback yet'}</p>
              </div>
            </div>
          </div>

          {questions.length > 0 && (
            <div className="space-y-4">
              {questions.map((q, index) => {
                const answerText = answers[q.id] || 'No answer provided';
                return (
                  <div key={q.id} className="card p-5">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="badge-blue">Q{index + 1}</span>
                      <span className="badge-purple">{q.question_type.replace('_', ' ')}</span>
                      <span className="badge-amber">{q.points} pts</span>
                    </div>
                    <p className="text-slate-200 font-medium mb-3 whitespace-pre-wrap">{q.prompt}</p>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="bg-slate-900/80 rounded-xl p-4">
                        <p className="text-xs uppercase tracking-[0.2em] text-slate-500 mb-2">Your answer</p>
                        <p className="text-sm text-slate-200 whitespace-pre-wrap">{answerText}</p>
                      </div>
                      <div className="bg-slate-900/80 rounded-xl p-4">
                        <p className="text-xs uppercase tracking-[0.2em] text-slate-500 mb-2">Correct answer</p>
                        <p className="text-sm text-slate-200 whitespace-pre-wrap">{q.correct_answer || 'Manual grading'}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : isPast ? (
        <div className="alert-error">This exam is closed.</div>
      ) : (
        <form onSubmit={submit} className="space-y-4">
          {questions.map((q, index) => (
            <div key={q.id} className="card p-5">
              <div className="flex items-center gap-2 mb-3">
                <span className="badge-blue">Q{index + 1}</span>
                <span className="badge-purple">{q.question_type.replace('_', ' ')}</span>
                <span className="badge-amber">{q.points} pts</span>
              </div>
              <p className="text-slate-200 font-medium whitespace-pre-wrap mb-4">{q.prompt}</p>

              {q.question_type === 'mcq' ? (
                <div className="space-y-2">
                  {q.options.map((option, optionIndex) => (
                    <label key={optionIndex} className="flex items-center gap-3 rounded-xl border border-slate-800 px-4 py-3 hover:bg-slate-800/40 cursor-pointer">
                      <input
                        type="radio"
                        name={`question-${q.id}`}
                        value={option}
                        checked={answers[q.id] === option}
                        onChange={e => updateAnswer(q.id, e.target.value)}
                        required
                      />
                      <span className="text-sm text-slate-300">{option}</span>
                    </label>
                  ))}
                </div>
              ) : (
                <textarea
                  className="input h-32 resize-none"
                  placeholder="Type your answer"
                  value={answers[q.id] || ''}
                  onChange={e => updateAnswer(q.id, e.target.value)}
                  required
                />
              )}
            </div>
          ))}

          <button type="submit" disabled={submitting || questions.length === 0} className="btn-primary px-8 py-3">
            {submitting ? 'Submitting...' : 'Submit Exam'}
          </button>
        </form>
      )}
    </Layout>
  );
};

export default StudentExamList;
