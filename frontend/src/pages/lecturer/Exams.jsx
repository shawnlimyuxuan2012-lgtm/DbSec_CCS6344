import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import api, { localDatetimeToISO, serverDatetimeToLocal } from '../../utils/api';
import Layout from '../../components/Layout';

const makeQuestion = () => ({ question_type: 'mcq', prompt: '', options: ['', '', '', ''], correct_answer: '', points: 1 });

const QuestionForm = ({ value, onChange, onSubmit, submitLabel, loading, showSubmit = true }) => {
  const update = (patch) => onChange({ ...value, ...patch });

  const content = (
    <>
      <div className="grid grid-cols-4 gap-3">
        <select className="input" value={value.question_type} onChange={e => update({ question_type: e.target.value })}>
          <option value="mcq">MCQ</option>
          <option value="essay">Essay Question</option>
          <option value="short_answer">Short Answer</option>
        </select>
        <input className="input" type="number" min="1" placeholder="Points" value={value.points} onChange={e => update({ points: parseInt(e.target.value, 10) || 1 })} />
        <input className="input col-span-2" placeholder="Correct answer / marking guide" value={value.correct_answer || ''} onChange={e => update({ correct_answer: e.target.value })} />
      </div>
      <textarea className="input h-24 resize-none" placeholder="Question prompt" value={value.prompt} onChange={e => update({ prompt: e.target.value })} required />
      {value.question_type === 'mcq' && (
        <div className="grid grid-cols-2 gap-3">
          {(value.options || ['', '', '', '']).map((option, index) => (
            <input
              key={index}
              className="input"
              placeholder={`Option ${index + 1}`}
              value={option}
              onChange={e => {
                const options = [...(value.options || ['', '', '', ''])];
                options[index] = e.target.value;
                update({ options });
              }}
            />
          ))}
        </div>
      )}
      {showSubmit && <button type="submit" disabled={loading} className="btn-primary">{loading ? 'Saving...' : submitLabel}</button>}
    </>
  );

  if (!showSubmit) {
    return <div className="space-y-4">{content}</div>;
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {content}
    </form>
  );
};

const LecturerExams = () => {
  const [classes, setClasses] = useState([]);
  const [exams, setExams] = useState([]);
  const [form, setForm] = useState({ class_id: '', title: '', description: '', deadline: '', questions: [makeQuestion()] });
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const load = async () => {
    const [classRes, examRes] = await Promise.all([
      api.get('/lecturer/classes'),
      api.get('/lecturer/exams'),
    ]);
    setClasses(classRes.data);
    setExams(examRes.data);
    setLoading(false);
  };

  useEffect(() => {
    load().catch(() => {
      setError('Failed to load exams');
      setLoading(false);
    });
  }, []);

  const updateQuestion = (index, patch) => {
    setForm(current => ({
      ...current,
      questions: current.questions.map((q, i) => (i === index ? { ...q, ...patch } : q)),
    }));
  };

  const removeDraftQuestion = (index) => {
    setForm(current => ({
      ...current,
      questions: current.questions.filter((_, i) => i !== index),
    }));
  };

  const createExam = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    try {
      await api.post('/lecturer/exams', { ...form, deadline: localDatetimeToISO(form.deadline) });
      setForm({ class_id: '', title: '', description: '', deadline: '', questions: [makeQuestion()] });
      setMessage('Exam created');
      await load();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create exam');
    }
  };

  if (loading) {
    return <Layout><div className="flex justify-center py-20"><div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" /></div></Layout>;
  }

  return (
    <Layout>
      <div className="mb-6">
        <h1 className="page-title">Exam Questions</h1>
        <p className="text-slate-400 mt-1">Create exams, then open an exam to manage its questions.</p>
      </div>

      {error && <div className="alert-error mb-4">{error}</div>}
      {message && <div className="alert-success mb-4">{message}</div>}

      <div className="card p-5 mb-8">
        <form onSubmit={createExam} className="space-y-4">
          <div className="grid grid-cols-4 gap-4">
            <select className="input" value={form.class_id} onChange={e => setForm({ ...form, class_id: e.target.value })} required>
              <option value="">Choose class</option>
              {classes.map(c => <option key={c.id} value={c.id}>{c.course_code} - {c.name}</option>)}
            </select>
            <input className="input" placeholder="Exam title" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} required />
            <input className="input" placeholder="Description" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
            <input className="input" type="datetime-local" value={form.deadline} onChange={e => setForm({ ...form, deadline: e.target.value })} required />
          </div>

          {form.questions.map((q, index) => (
            <div key={index} className="border border-slate-800 rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="badge-blue">Question {index + 1}</span>
                {form.questions.length > 1 && (
                  <button type="button" className="text-xs btn-danger px-3 py-1.5" onClick={() => removeDraftQuestion(index)}>
                    Remove
                  </button>
                )}
              </div>
              <QuestionForm
                value={q}
                onChange={next => updateQuestion(index, next)}
                submitLabel="Question"
                loading={false}
                showSubmit={false}
              />
            </div>
          ))}

          <div className="flex items-center gap-3">
            <button type="button" className="btn-secondary" onClick={() => setForm({ ...form, questions: [...form.questions, makeQuestion()] })}>
              Add Question
            </button>
            <button type="submit" className="btn-primary">Create Exam</button>
          </div>
        </form>
      </div>

      <div className="card overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-800/50">
              {['Exam', 'Class', 'Deadline', 'Submissions', 'Questions', 'Actions'].map(h => (
                <th key={h} className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {exams.length === 0 ? (
              <tr><td className="px-6 py-12 text-center text-slate-500" colSpan="6">No exams yet.</td></tr>
            ) : exams.map(exam => (
              <tr key={exam.id} className="table-row">
                <td className="px-6 py-4">
                  <p className="font-medium text-slate-200">{exam.title}</p>
                  <p className="text-xs text-slate-500">{exam.description || 'No description'}</p>
                </td>
                <td className="px-6 py-4 text-sm text-slate-400">{exam.course_code} - {exam.class_name}</td>
                <td className="px-6 py-4 text-sm">
                  {exam.deadline ? (
                    <span className={new Date(exam.deadline) < new Date() ? 'text-red-400' : 'text-slate-300'}>
                      {new Date(exam.deadline).toLocaleDateString()}
                    </span>
                  ) : (
                    <span className="text-slate-500">No deadline</span>
                  )}
                </td>
                <td className="px-6 py-4"><span className="badge-blue">{exam.submission_count || 0} submitted</span></td>
                <td className="px-6 py-4"><span className="badge-purple">{exam.question_count}</span></td>
                <td className="px-6 py-4">
                  <Link to={`/lecturer/exams/${exam.id}`} className="text-xs btn-secondary px-3 py-1.5">View</Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Layout>
  );
};

export const LecturerExamView = () => {
  const { id } = useParams();
  const [exam, setExam] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [deadline, setDeadline] = useState('');
  const [activeTab, setActiveTab] = useState('questions');
  const [submissions, setSubmissions] = useState([]);
  const [subsLoading, setSubsLoading] = useState(false);
  const [subsError, setSubsError] = useState('');
  const [newQuestion, setNewQuestion] = useState(makeQuestion());
  const [editingId, setEditingId] = useState(null);
  const [editingQuestion, setEditingQuestion] = useState(makeQuestion());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const load = async () => {
    const { data } = await api.get(`/lecturer/exams/${id}`);
    setExam(data.exam);
    setDeadline(serverDatetimeToLocal(data.exam.deadline));
    setQuestions(data.questions.map(q => ({ ...q, options: q.options?.length ? q.options : ['', '', '', ''] })));
    setLoading(false);
  };

  useEffect(() => {
    load().catch(() => {
      setError('Failed to load exam');
      setLoading(false);
    });
  }, [id]);

  useEffect(() => {
    if (activeTab === 'submissions') {
      loadSubmissions();
    }
  }, [activeTab]);

  const addQuestion = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setMessage('');
    try {
      await api.post(`/lecturer/exams/${id}/questions`, newQuestion);
      setNewQuestion(makeQuestion());
      setMessage('Question added');
      setActiveTab('questions');
      await load();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add question');
    } finally {
      setSaving(false);
    }
  };

  const startEdit = (question) => {
    setEditingId(question.id);
    setEditingQuestion({ ...question, options: question.options?.length ? question.options : ['', '', '', ''] });
    setActiveTab('edit');
  };

  const updateQuestion = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setMessage('');
    try {
      await api.put(`/lecturer/exams/${id}/questions/${editingId}`, editingQuestion);
      setEditingId(null);
      setMessage('Question updated');
      setActiveTab('questions');
      await load();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update question');
    } finally {
      setSaving(false);
    }
  };

  const loadSubmissions = async () => {
    setSubsLoading(true);
    setSubsError('');
    try {
      const res = await api.get(`/lecturer/exams/${id}/submissions`);
      // API returns { exam, submissions }
      setSubmissions(res.data.submissions || []);
    } catch (err) {
      setSubsError(err.response?.data?.message || 'Failed to load submissions');
    } finally {
      setSubsLoading(false);
    }
  };

  const removeQuestion = async (questionId) => {
    if (!confirm('Remove this question?')) return;
    setError('');
    setMessage('');
    try {
      await api.delete(`/lecturer/exams/${id}/questions/${questionId}`);
      setMessage('Question removed');
      await load();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to remove question');
    }
  };

  const saveDeadline = async () => {
    if (!deadline) {
      setError('Please select a deadline');
      return;
    }
    setSaving(true);
    setError('');
    setMessage('');
    try {
      await api.put(`/lecturer/exams/${id}`, { deadline: localDatetimeToISO(deadline) });
      setMessage('Exam deadline updated');
      await load();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update deadline');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <Layout><div className="flex justify-center py-20"><div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" /></div></Layout>;
  }

  if (!exam) {
    return <Layout><div className="alert-error">{error || 'Exam not found'}</div></Layout>;
  }

  return (
    <Layout>
      <Link to="/lecturer/exams" className="text-indigo-400 hover:text-indigo-300 text-sm mb-2 inline-flex items-center gap-1">← Back to exams</Link>

      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between mb-6">
        <div>
          <h1 className="page-title">{exam.title}</h1>
          <p className="text-slate-400 mt-1">{exam.course_code} - {exam.class_name}</p>
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <div className="space-y-1">
              <label className="label">Due Date</label>
              <input
                type="datetime-local"
                className="input"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
              />
            </div>
            <button
              type="button"
              onClick={saveDeadline}
              disabled={saving}
              className="btn-secondary h-12 mt-auto"
            >
              {saving ? 'Saving…' : 'Save due date'}
            </button>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="badge-purple text-sm">{questions.length} questions</span>
        </div>
      </div>

      {error && <div className="alert-error mb-4">{error}</div>}
      {message && <div className="alert-success mb-4">{message}</div>}

      <div className="flex gap-2 mb-5 items-center">
          <button className={activeTab === 'questions' ? 'btn-primary' : 'btn-secondary'} onClick={() => setActiveTab('questions')}>Questions</button>
          <button className={activeTab === 'add' ? 'btn-primary' : 'btn-secondary'} onClick={() => setActiveTab('add')}>Add Question</button>
          <button className={activeTab === 'submissions' ? 'btn-primary' : 'btn-secondary'} onClick={() => setActiveTab('submissions')}>Submissions</button>
          {editingId && <button className={activeTab === 'edit' ? 'btn-primary' : 'btn-secondary'} onClick={() => setActiveTab('edit')}>Edit Question</button>}
      </div>

      {activeTab === 'questions' && (
        <div className="space-y-4">
          {questions.length === 0 ? (
            <div className="card p-12 text-center text-slate-500">No questions yet.</div>
          ) : questions.map((q, index) => (
            <div key={q.id} className="card p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="badge-blue">Q{index + 1}</span>
                    <span className="badge-purple">{q.question_type.replace('_', ' ')}</span>
                    <span className="badge-amber">{q.points} pts</span>
                  </div>
                  <p className="text-slate-200 font-medium whitespace-pre-wrap">{q.prompt}</p>
                  {q.question_type === 'mcq' && (
                    <div className="grid grid-cols-2 gap-2 mt-3">
                      {q.options.map((option, optionIndex) => (
                        <div key={optionIndex} className="text-sm text-slate-400 bg-slate-800/50 rounded-xl px-3 py-2">{option || `Option ${optionIndex + 1}`}</div>
                      ))}
                    </div>
                  )}

                  {q.correct_answer && <p className="text-xs text-slate-500 mt-3">Guide: {q.correct_answer}</p>}
                </div>
                <div className="flex gap-2 shrink-0">
                  <button className="text-xs btn-secondary px-3 py-1.5" onClick={() => startEdit(q)}>Edit</button>
                  <button className="text-xs btn-danger px-3 py-1.5" onClick={() => removeQuestion(q.id)}>Remove</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'submissions' && (
        <div className="card overflow-hidden">
          {subsLoading ? (
            <div className="flex justify-center py-12"><div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" /></div>
          ) : subsError ? (
            <div className="alert-error">{subsError}</div>
          ) : submissions.length === 0 ? (
            <div className="card p-12 text-center text-slate-400">No submissions yet.</div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-800/50">
                  {['Student', 'Submitted', 'Score', 'Status', 'Action'].map(h => (
                    <th key={h} className="px-5 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {submissions.map(sub => (
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
                      <Link to={`/lecturer/exams/${id}/submissions/${sub.id}`} className="text-xs btn-secondary px-3 py-1.5">View</Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {activeTab === 'add' && (
        <div className="card p-5">
          <h2 className="font-display font-semibold text-slate-100 mb-4">Add Question</h2>
          <QuestionForm value={newQuestion} onChange={setNewQuestion} onSubmit={addQuestion} submitLabel="Add Question" loading={saving} />
        </div>
      )}

      {activeTab === 'edit' && editingId && (
        <div className="card p-5">
          <h2 className="font-display font-semibold text-slate-100 mb-4">Edit Question</h2>
          <QuestionForm value={editingQuestion} onChange={setEditingQuestion} onSubmit={updateQuestion} submitLabel="Save Question" loading={saving} />
        </div>
      )}
    </Layout>
  );
};

export default LecturerExams;
