import { useState, useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../utils/api';
import Layout from '../../components/Layout';

const AssignmentTable = ({ assignments, onDelete }) => {
  if (assignments.length === 0) {
    return (
      <div className="card p-12 text-center">
        <p className="text-slate-400">No assignments yet.</p>
      </div>
    );
  }

  return (
    <div className="card overflow-hidden">
      <table className="w-full">
        <thead>
          <tr className="border-b border-slate-800/50">
            {['Assignment', 'Class', 'Deadline', 'Submissions', 'Actions'].map(h => (
              <th key={h} className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {assignments.map(a => {
            const deadline = new Date(a.deadline);
            const isPast = deadline < new Date();
            return (
              <tr key={a.id} className="table-row">
                <td className="px-6 py-4">
                  <p className="font-medium text-slate-200">{a.title}</p>
                  <p className="text-xs text-slate-500">{a.course_code} - Max: {a.max_score} pts</p>
                </td>
                <td className="px-6 py-4 text-sm text-slate-400">{a.class_name || 'Open'}</td>
                <td className="px-6 py-4 text-sm">
                  <span className={isPast ? 'text-red-400' : 'text-slate-300'}>{deadline.toLocaleDateString()}</span>
                </td>
                <td className="px-6 py-4 text-sm">
                  <span className="badge-blue">{a.submission_count} submitted</span>
                  {a.graded_count > 0 && <span className="badge-green ml-2">{a.graded_count} graded</span>}
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <Link to={`/lecturer/submissions/${a.id}`} className="text-xs btn-secondary px-3 py-1.5">View</Link>
                    <Link to={`/lecturer/edit-assignment/${a.id}`} className="text-xs btn-secondary px-3 py-1.5">Edit</Link>
                    <button onClick={() => onDelete(a.id)} className="text-xs btn-danger px-3 py-1.5">Delete</button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

const ExamTable = ({ exams }) => {
  if (exams.length === 0) {
    return (
      <div className="card p-12 text-center">
        <p className="text-slate-400">No exams yet.</p>
      </div>
    );
  }

  return (
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
          {exams.map(exam => {
            const deadline = exam.deadline ? new Date(exam.deadline) : null;
            const isPast = deadline && deadline < new Date();
            return (
              <tr key={exam.id} className="table-row">
                <td className="px-6 py-4">
                  <p className="font-medium text-slate-200">{exam.title}</p>
                  <p className="text-xs text-slate-500">{exam.description || 'No description'}</p>
                </td>
                <td className="px-6 py-4 text-sm text-slate-400">{exam.course_code} - {exam.class_name}</td>
                <td className="px-6 py-4 text-sm">
                  {deadline ? (
                    <span className={isPast ? 'text-red-400' : 'text-slate-300'}>{deadline.toLocaleDateString()}</span>
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
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export const LecturerDashboard = () => {
  const { user } = useAuth();
  const [assignments, setAssignments] = useState([]);
  const [classes, setClasses] = useState([]);
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = async () => {
    const [assignmentRes, classRes, examRes] = await Promise.all([
      api.get('/lecturer/courses'),
      api.get('/lecturer/classes'),
      api.get('/lecturer/exams'),
    ]);
    setAssignments(assignmentRes.data);
    setClasses(classRes.data);
    setExams(examRes.data);
    setLoading(false);
  };

  useEffect(() => {
    load().catch(() => {
      setError('Failed to load lecturer dashboard');
      setLoading(false);
    });
  }, []);

  const handleDelete = async (id) => {
    if (!confirm('Delete this assignment?')) return;
    await api.delete(`/lecturer/assignments/${id}`);
    load();
  };

  if (loading) {
    return <Layout><div className="flex justify-center py-20"><div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" /></div></Layout>;
  }

  return (
    <Layout>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="text-slate-400 mt-1">Welcome, {user?.name}</p>
        </div>
        <Link to="/lecturer/classes" className="btn-primary">New Class</Link>
      </div>

      {error && <div className="alert-error mb-4">{error}</div>}

      <div className="grid grid-cols-4 gap-4 mb-8">
        <div className="card p-5">
          <p className="text-xs text-slate-500 font-medium uppercase tracking-wider mb-1">Classes</p>
          <p className="text-3xl font-bold text-sky-400 font-display">{classes.length}</p>
        </div>
        <div className="card p-5">
          <p className="text-xs text-slate-500 font-medium uppercase tracking-wider mb-1">Assignments</p>
          <p className="text-3xl font-bold text-indigo-400 font-display">{assignments.length}</p>
        </div>
        <div className="card p-5">
          <p className="text-xs text-slate-500 font-medium uppercase tracking-wider mb-1">Exams</p>
          <p className="text-3xl font-bold text-purple-400 font-display">{exams.length}</p>
        </div>
        <div className="card p-5">
          <p className="text-xs text-slate-500 font-medium uppercase tracking-wider mb-1">Submissions</p>
          <p className="text-3xl font-bold text-emerald-400 font-display">
            {assignments.reduce((total, a) => total + Number(a.submission_count || 0), 0)
              + exams.reduce((total, exam) => total + Number(exam.submission_count || 0), 0)}
          </p>
        </div>
      </div>

      <div className="flex items-center justify-between mb-4">
        <h2 className="font-display font-semibold text-slate-100">Assignment List</h2>
        <Link to="/lecturer/create-assignment" className="text-xs text-indigo-400 hover:text-indigo-300">Manage assignments</Link>
      </div>
      <AssignmentTable assignments={assignments} onDelete={handleDelete} />

      <div className="flex items-center justify-between mt-8 mb-4">
        <h2 className="font-display font-semibold text-slate-100">Exam List</h2>
        <Link to="/lecturer/exams" className="text-xs text-indigo-400 hover:text-indigo-300">Manage exams</Link>
      </div>
      <ExamTable exams={exams} />
    </Layout>
  );
};

const AssignmentForm = ({ initial = {}, onSubmit, loading, title }) => {
  const [classes, setClasses] = useState([]);
  const [form, setForm] = useState({
    title: '',
    description: '',
    course_code: '',
    course_name: '',
    class_id: '',
    deadline: '',
    max_score: 100,
    ...initial,
  });

  useEffect(() => {
    api.get('/lecturer/classes').then(r => setClasses(r.data)).catch(console.error);
  }, []);

  useEffect(() => {
    setForm(current => ({ ...current, ...initial }));
  }, [initial]);

  const applyClass = (classId) => {
    const selected = classes.find(c => String(c.id) === String(classId));
    setForm({
      ...form,
      class_id: classId,
      course_code: selected?.course_code || form.course_code,
      course_name: selected?.name || form.course_name,
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({ ...form, class_id: form.class_id || null });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="grid grid-cols-2 gap-5">
        <div className="col-span-2">
          <label className="label">Assignment Title *</label>
          <input type="text" className="input" placeholder="e.g. Assignment 1: Database Design" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} required />
        </div>
        <div className="col-span-2">
          <label className="label">Class</label>
          <select className="input" value={form.class_id || ''} onChange={e => applyClass(e.target.value)}>
            <option value="">Open assignment, no class</option>
            {classes.map(c => <option key={c.id} value={c.id}>{c.course_code} - {c.name}</option>)}
          </select>
        </div>
        <div>
          <label className="label">Course Code *</label>
          <input type="text" className="input" value={form.course_code} onChange={e => setForm({ ...form, course_code: e.target.value })} required />
        </div>
        <div>
          <label className="label">Course Name *</label>
          <input type="text" className="input" value={form.course_name} onChange={e => setForm({ ...form, course_name: e.target.value })} required />
        </div>
        <div>
          <label className="label">Deadline *</label>
          <input type="datetime-local" className="input" value={form.deadline} onChange={e => setForm({ ...form, deadline: e.target.value })} required />
        </div>
        <div>
          <label className="label">Maximum Score</label>
          <input type="number" className="input" min={1} max={1000} value={form.max_score} onChange={e => setForm({ ...form, max_score: parseInt(e.target.value, 10) || 100 })} />
        </div>
        <div className="col-span-2">
          <label className="label">Description</label>
          <textarea className="input h-32 resize-none" placeholder="Assignment instructions..." value={form.description || ''} onChange={e => setForm({ ...form, description: e.target.value })} />
        </div>
      </div>
      <button type="submit" disabled={loading} className="btn-primary px-8 py-3">
        {loading ? 'Saving...' : title}
      </button>
    </form>
  );
};

export const CreateAssignment = () => {
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [assignments, setAssignments] = useState([]);
  const [formKey, setFormKey] = useState(0);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const loadAssignments = async () => {
    const { data } = await api.get('/lecturer/courses');
    setAssignments(data);
    setPageLoading(false);
  };

  useEffect(() => {
    loadAssignments().catch(() => {
      setError('Failed to load assignments');
      setPageLoading(false);
    });
  }, []);

  const handleDelete = async (id) => {
    if (!confirm('Delete this assignment?')) return;
    await api.delete(`/lecturer/assignments/${id}`);
    await loadAssignments();
  };

  const handleSubmit = async (form) => {
    setLoading(true);
    setError('');
    setMessage('');
    try {
      await api.post('/lecturer/assignments', form);
      setMessage('Assignment created');
      setFormKey(key => key + 1);
      await loadAssignments();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create assignment');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="mb-6">
        <h1 className="page-title">Assignments</h1>
        <p className="text-slate-400 mt-1">Create assignments and manage existing submissions.</p>
      </div>

      <div className="card p-6 mb-8">
        {error && <div className="alert-error mb-5">{error}</div>}
        {message && <div className="alert-success mb-5">{message}</div>}
        <AssignmentForm key={formKey} onSubmit={handleSubmit} loading={loading} title="Create Assignment" />
      </div>

      <div className="flex items-center justify-between mb-4">
        <h2 className="font-display font-semibold text-slate-100">Assignment List</h2>
        <span className="badge-blue">{assignments.length} total</span>
      </div>

      {pageLoading ? (
        <div className="flex justify-center py-12"><div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" /></div>
      ) : (
        <AssignmentTable assignments={assignments} onDelete={handleDelete} />
      )}
    </Layout>
  );
};

export const EditAssignment = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [initial, setInitial] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/lecturer/courses').then(r => {
      const a = r.data.find(x => x.id === parseInt(id, 10));
      if (a) {
        const d = new Date(a.deadline);
        setInitial({ ...a, class_id: a.class_id || '', deadline: d.toISOString().slice(0, 16) });
      }
    });
  }, [id]);

  const handleSubmit = async (form) => {
    setLoading(true);
    setError('');
    try {
      await api.put(`/lecturer/assignments/${id}`, form);
      navigate('/lecturer/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <Link to="/lecturer/dashboard" className="text-indigo-400 hover:text-indigo-300 text-sm mb-6 inline-flex items-center gap-1">Back</Link>
      <h1 className="page-title mb-6">Edit Assignment</h1>
      <div className="card p-6 max-w-2xl">
        {error && <div className="alert-error mb-5">{error}</div>}
        {initial && <AssignmentForm initial={initial} onSubmit={handleSubmit} loading={loading} title="Save Changes" />}
      </div>
    </Layout>
  );
};
