import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import api from '../../utils/api';
import Layout from '../../components/Layout';
import AssignmentForm from './AssignmentForm';

const EditAssignment = () => {
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
    }).catch(() => setError('Failed to load assignment'));
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
      <Link to="/lecturer/dashboard" className="text-indigo-400 hover:text-indigo-300 text-sm mb-6 inline-flex items-center gap-1">← Back</Link>
      <h1 className="page-title mb-6">Edit Assignment</h1>
      <div className="card p-6 max-w-2xl">
        {error && <div className="alert-error mb-5">{error}</div>}
        {initial ? <AssignmentForm initial={initial} onSubmit={handleSubmit} loading={loading} title="Save Changes" /> : <div className="text-slate-400">Loading assignment...</div>}
      </div>
    </Layout>
  );
};

export default EditAssignment;
