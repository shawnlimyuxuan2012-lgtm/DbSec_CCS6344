import { useEffect, useState } from 'react';
import api from '../../utils/api';
import Layout from '../../components/Layout';

const StudentClasses = () => {
  const [classes, setClasses] = useState([]);
  const [joinCode, setJoinCode] = useState('');
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const load = async () => {
    const { data } = await api.get('/student/classes');
    setClasses(data);
    setLoading(false);
  };

  useEffect(() => {
    load().catch(() => {
      setError('Failed to load classes');
      setLoading(false);
    });
  }, []);

  const joinClass = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    try {
      await api.post('/student/classes/join', { join_code: joinCode });
      setJoinCode('');
      setMessage('Class added');
      await load();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to join class');
    }
  };

  if (loading) {
    return <Layout><div className="flex justify-center py-20"><div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" /></div></Layout>;
  }

  return (
    <Layout>
      <div className="mb-6">
        <h1 className="page-title">My Classes</h1>
        <p className="text-slate-400 mt-1">Enter your lecturer's class code to join a class.</p>
      </div>

      {error && <div className="alert-error mb-4">{error}</div>}
      {message && <div className="alert-success mb-4">{message}</div>}

      <form onSubmit={joinClass} className="card p-5 mb-8 max-w-xl">
        <label className="label">Class Code</label>
        <div className="flex gap-3">
          <input
            className="input uppercase"
            placeholder="Enter class code"
            value={joinCode}
            onChange={e => setJoinCode(e.target.value.toUpperCase())}
            required
          />
          <button className="btn-primary shrink-0" type="submit">Join Class</button>
        </div>
      </form>

      <div className="card overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-800/50">
              {['Class', 'Lecturer', 'Assignments', 'Joined'].map(h => (
                <th key={h} className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {classes.length === 0 ? (
              <tr><td className="px-6 py-12 text-center text-slate-500" colSpan="4">No classes yet.</td></tr>
            ) : classes.map(c => (
              <tr key={c.id} className="table-row">
                <td className="px-6 py-4">
                  <p className="font-medium text-slate-200">{c.course_code}</p>
                  <p className="text-xs text-slate-500">{c.name}</p>
                </td>
                <td className="px-6 py-4 text-sm text-slate-400">{c.lecturer_name}</td>
                <td className="px-6 py-4"><span className="badge-blue">{c.assignment_count}</span></td>
                <td className="px-6 py-4 text-sm text-slate-400">{new Date(c.joined_at).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Layout>
  );
};

export default StudentClasses;
