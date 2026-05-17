import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../utils/api';
import Layout from '../../components/Layout';
import AssignmentForm from './AssignmentForm';
import AssignmentTable from './AssignmentTable';

const CreateAssignment = () => {
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

      <div className="mt-6">
        <Link to="/lecturer/dashboard" className="btn-secondary">Back to dashboard</Link>
      </div>
    </Layout>
  );
};

export default CreateAssignment;
