import { useState, useEffect } from 'react';
import api from '../../utils/api';
import Layout from '../../components/Layout';

const ManageUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editUser, setEditUser] = useState(null);
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'student' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [saving, setSaving] = useState(false);
  const [filter, setFilter] = useState('all');

  const load = () => {
    setLoading(true);
    api.get('/admin/users').then(r => setUsers(r.data)).finally(() => setLoading(false));
  };

  useEffect(load, []);

  const openCreate = () => {
    setEditUser(null);
    setForm({ name: '', email: '', password: '', role: 'student' });
    setError(''); setSuccess('');
    setShowForm(true);
  };

  const openEdit = (u) => {
    setEditUser(u);
    setForm({ name: u.name, email: u.email, password: '', role: u.role, is_deleted: u.is_deleted });
    setError(''); setSuccess('');
    setShowForm(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true); setError('');
    try {
      if (editUser) {
        await api.put(`/admin/users/${editUser.id}`, form);
        setSuccess('User updated successfully.');
      } else {
        await api.post('/admin/users', form);
        setSuccess('User created successfully.');
      }
      load();
      setTimeout(() => { setShowForm(false); setSuccess(''); }, 1500);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save user');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Deactivate this user?')) return;
    await api.delete(`/admin/users/${id}`);
    load();
  };

  const filtered = users.filter(u => {
    if (filter === 'all') return true;
    if (filter === 'active') return !u.is_deleted;
    if (filter === 'deleted') return u.is_deleted;
    if (filter === 'pending') return u.delete_requested_at;
    return u.role === filter;
  });

  if (loading) return <Layout><div className="flex justify-center py-20"><div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" /></div></Layout>;

  return (
    <Layout>
      <div className="flex items-center justify-between mb-6">
        <h1 className="page-title">Manage Users</h1>
        <button onClick={openCreate} className="btn-primary">+ Add User</button>
      </div>

      <div className="flex gap-2 mb-5 flex-wrap">
        {['all','active','student','lecturer','admin','pending','deleted'].map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all capitalize
              ${filter === f ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-slate-200'}`}>
            {f}
          </button>
        ))}
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="card p-6 w-full max-w-md animate-fade-in">
            <h2 className="font-display font-semibold text-slate-200 mb-5">
              {editUser ? 'Edit User' : 'Create User'}
            </h2>
            {error   && <div className="alert-error mb-4">{error}</div>}
            {success && <div className="alert-success mb-4">{success}</div>}
            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="label">Full Name *</label>
                <input type="text" className="input" value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })} required />
              </div>
              <div>
                <label className="label">Email *</label>
                <input type="email" className="input" value={form.email}
                  onChange={e => setForm({ ...form, email: e.target.value })} required />
              </div>
              {!editUser && (
                <div>
                  <label className="label">Password *</label>
                  <input type="password" className="input" placeholder="Min. 8 characters"
                    value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} required minLength={8} />
                </div>
              )}
              <div>
                <label className="label">Role *</label>
                <select className="input" value={form.role} onChange={e => setForm({ ...form, role: e.target.value })}>
                  <option value="student">Student</option>
                  <option value="lecturer">Lecturer</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              {editUser && (
                <div className="flex items-center gap-2">
                  <input type="checkbox" id="is_del" className="accent-red-500"
                    checked={!!form.is_deleted} onChange={e => setForm({ ...form, is_deleted: e.target.checked })} />
                  <label htmlFor="is_del" className="text-sm text-slate-400">Deactivated</label>
                </div>
              )}
              <div className="flex gap-3 pt-2">
                <button type="submit" disabled={saving} className="btn-primary flex-1">
                  {saving ? 'Saving…' : editUser ? 'Save Changes' : 'Create User'}
                </button>
                <button type="button" onClick={() => setShowForm(false)} className="btn-secondary">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="card overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-800/50">
              {['Name', 'Email', 'Role', 'Status', 'Joined', 'Actions'].map(h => (
                <th key={h} className="px-5 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map(u => (
              <tr key={u.id} className={`table-row ${u.is_deleted ? 'opacity-50' : ''}`}>
                <td className="px-5 py-4 font-medium text-slate-200">{u.name}</td>
                <td className="px-5 py-4 text-sm text-slate-400 font-mono">{u.email}</td>
                <td className="px-5 py-4">
                  <span className={u.role === 'admin' ? 'badge-amber' : u.role === 'lecturer' ? 'badge-green' : 'badge-blue'}>
                    {u.role}
                  </span>
                </td>
                <td className="px-5 py-4">
                  {u.is_deleted ? <span className="badge-red">Deactivated</span>
                    : u.delete_requested_at ? <span className="badge-amber">Deletion Pending</span>
                    : <span className="badge-green">Active</span>}
                </td>
                <td className="px-5 py-4 text-xs text-slate-500">{new Date(u.created_at).toLocaleDateString()}</td>
                <td className="px-5 py-4">
                  <div className="flex gap-2">
                    <button onClick={() => openEdit(u)} className="text-xs btn-secondary px-3 py-1.5">Edit</button>
                    {!u.is_deleted && (
                      <button onClick={() => handleDelete(u.id)} className="text-xs btn-danger px-3 py-1.5">Deactivate</button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div className="text-center py-10 text-slate-500 text-sm">No users found.</div>
        )}
      </div>
    </Layout>
  );
};

export default ManageUsers;
