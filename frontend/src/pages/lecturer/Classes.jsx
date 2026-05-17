import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import api from '../../utils/api';
import Layout from '../../components/Layout';

const LecturerClasses = () => {
  const [classes, setClasses] = useState([]);
  const [classForm, setClassForm] = useState({ name: '', course_code: '' });
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const load = async () => {
    const { data } = await api.get('/lecturer/classes');
    setClasses(data);
    setLoading(false);
  };

  useEffect(() => {
    load().catch(() => {
      setError('Failed to load classes');
      setLoading(false);
    });
  }, []);

  const createClass = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    try {
      const { data } = await api.post('/lecturer/classes', classForm);
      setClassForm({ name: '', course_code: '' });
      setMessage(`Class created. Join code: ${data.class.join_code}`);
      await load();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create class');
    }
  };

  if (loading) {
    return <Layout><div className="flex justify-center py-20"><div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" /></div></Layout>;
  }

  return (
    <Layout>
      <div className="mb-6">
        <h1 className="page-title">Classes</h1>
        <p className="text-slate-400 mt-1">Create classes and open a class to manage students.</p>
      </div>

      {error && <div className="alert-error mb-4">{error}</div>}
      {message && <div className="alert-success mb-4">{message}</div>}

      <form onSubmit={createClass} className="card p-5 space-y-4 mb-8 max-w-2xl">
        <h2 className="font-display font-semibold text-slate-100">Create Class</h2>
        <div className="grid grid-cols-2 gap-4">
          <input className="input" placeholder="Class name" value={classForm.name} onChange={e => setClassForm({ ...classForm, name: e.target.value })} required />
          <input className="input" placeholder="Course code" value={classForm.course_code} onChange={e => setClassForm({ ...classForm, course_code: e.target.value })} required />
        </div>
        <button className="btn-primary" type="submit">Generate Code</button>
      </form>

      <div className="card overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-800/50">
              {['Class', 'Join Code', 'Students', 'Assignments', 'Exams', 'Actions'].map(h => (
                <th key={h} className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {classes.length === 0 ? (
              <tr><td className="px-6 py-12 text-center text-slate-500" colSpan="6">No classes yet.</td></tr>
            ) : classes.map(c => (
              <tr key={c.id} className="table-row">
                <td className="px-6 py-4">
                  <p className="font-medium text-slate-200">{c.course_code}</p>
                  <p className="text-xs text-slate-500">{c.name}</p>
                </td>
                <td className="px-6 py-4"><span className="badge-blue">{c.join_code}</span></td>
                <td className="px-6 py-4 text-sm text-slate-400">{c.student_count}</td>
                <td className="px-6 py-4 text-sm text-slate-400">{c.assignment_count}</td>
                <td className="px-6 py-4 text-sm text-slate-400">{c.exam_count}</td>
                <td className="px-6 py-4">
                  <Link to={`/lecturer/classes/${c.id}`} className="text-xs btn-secondary px-3 py-1.5">View Class</Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Layout>
  );
};

export const LecturerClassView = () => {
  const { id } = useParams();
  const [classInfo, setClassInfo] = useState(null);
  const [students, setStudents] = useState([]);
  const [studentEmail, setStudentEmail] = useState('');
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const load = async () => {
    const { data } = await api.get(`/lecturer/classes/${id}`);
    setClassInfo(data.class);
    setStudents(data.students);
    setLoading(false);
  };

  useEffect(() => {
    load().catch(() => {
      setError('Failed to load class');
      setLoading(false);
    });
  }, [id]);

  const addStudent = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    try {
      await api.post(`/lecturer/classes/${id}/students`, { email: studentEmail });
      setStudentEmail('');
      setMessage('Student added to class');
      await load();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add student');
    }
  };

  const removeStudent = async (studentId) => {
    if (!confirm('Remove this student from the class?')) return;
    setError('');
    setMessage('');
    try {
      await api.delete(`/lecturer/classes/${id}/students/${studentId}`);
      setMessage('Student removed from class');
      await load();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to remove student');
    }
  };

  if (loading) {
    return <Layout><div className="flex justify-center py-20"><div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" /></div></Layout>;
  }

  if (!classInfo) {
    return <Layout><div className="alert-error">{error || 'Class not found'}</div></Layout>;
  }

  return (
    <Layout>
      <Link to="/lecturer/classes" className="text-indigo-400 hover:text-indigo-300 text-sm mb-6 inline-flex items-center gap-1">Back to classes</Link>

      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="page-title">{classInfo.course_code} - {classInfo.name}</h1>
          <p className="text-slate-400 mt-1">Manage students enrolled in this class.</p>
        </div>
        <span className="badge-blue text-sm">{classInfo.join_code}</span>
      </div>

      {error && <div className="alert-error mb-4">{error}</div>}
      {message && <div className="alert-success mb-4">{message}</div>}

      <div className="grid grid-cols-4 gap-4 mb-8">
        <div className="card p-5">
          <p className="text-xs text-slate-500 font-medium uppercase tracking-wider mb-1">Students</p>
          <p className="text-3xl font-bold text-sky-400 font-display">{students.length}</p>
        </div>
        <div className="card p-5">
          <p className="text-xs text-slate-500 font-medium uppercase tracking-wider mb-1">Assignments</p>
          <p className="text-3xl font-bold text-indigo-400 font-display">{classInfo.assignment_count}</p>
        </div>
        <div className="card p-5">
          <p className="text-xs text-slate-500 font-medium uppercase tracking-wider mb-1">Exams</p>
          <p className="text-3xl font-bold text-purple-400 font-display">{classInfo.exam_count}</p>
        </div>
        <div className="card p-5">
          <p className="text-xs text-slate-500 font-medium uppercase tracking-wider mb-1">Join Code</p>
          <p className="text-2xl font-bold text-emerald-400 font-display">{classInfo.join_code}</p>
        </div>
      </div>

      <form onSubmit={addStudent} className="card p-5 mb-8">
        <h2 className="font-display font-semibold text-slate-100 mb-4">Add Student</h2>
        <div className="flex gap-3">
          <input className="input" type="email" placeholder="Student email" value={studentEmail} onChange={e => setStudentEmail(e.target.value)} required />
          <button className="btn-primary shrink-0" type="submit">Add Student</button>
        </div>
      </form>

      <div className="card overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-800/50">
              {['Student', 'Email', 'Joined', 'Actions'].map(h => (
                <th key={h} className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {students.length === 0 ? (
              <tr><td className="px-6 py-12 text-center text-slate-500" colSpan="4">No students in this class yet.</td></tr>
            ) : students.map(student => (
              <tr key={student.id} className="table-row">
                <td className="px-6 py-4 font-medium text-slate-200">{student.name}</td>
                <td className="px-6 py-4 text-sm text-slate-400">{student.email}</td>
                <td className="px-6 py-4 text-sm text-slate-400">{new Date(student.joined_at).toLocaleDateString()}</td>
                <td className="px-6 py-4">
                  <button onClick={() => removeStudent(student.id)} className="text-xs btn-danger px-3 py-1.5">Remove</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Layout>
  );
};

export default LecturerClasses;
