import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../utils/api';
import Layout from '../../components/Layout';

export const AdminDashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({ total: 0, students: 0, lecturers: 0, admins: 0, pending: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/admin/users').then(r => {
      const users = r.data;
      setStats({
        total:     users.filter(u => !u.is_deleted).length,
        students:  users.filter(u => u.role === 'student' && !u.is_deleted).length,
        lecturers: users.filter(u => u.role === 'lecturer' && !u.is_deleted).length,
        admins:    users.filter(u => u.role === 'admin' && !u.is_deleted).length,
        pending:   users.filter(u => u.delete_requested_at).length,
      });
    }).finally(() => setLoading(false));
  }, []);

  if (loading) return <Layout><div className="flex justify-center py-20"><div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" /></div></Layout>;

  return (
    <Layout>
      <div className="mb-8">
        <h1 className="page-title">Admin Dashboard</h1>
        <p className="text-slate-400 mt-1">System overview · {user?.email}</p>
      </div>

      <div className="grid grid-cols-5 gap-4 mb-8">
        {[
          { label: 'Total Users',   value: stats.total,     color: 'indigo' },
          { label: 'Students',      value: stats.students,  color: 'blue' },
          { label: 'Lecturers',     value: stats.lecturers, color: 'emerald' },
          { label: 'Admins',        value: stats.admins,    color: 'purple' },
          { label: 'Deletion Req.', value: stats.pending,   color: 'red' },
        ].map(s => (
          <div key={s.label} className="card p-5 text-center">
            <p className="text-xs text-slate-500 font-medium uppercase tracking-wider mb-1">{s.label}</p>
            <p className={`text-3xl font-bold font-display text-${s.color}-400`}>{s.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-6">
        {[
          { title: 'Manage Users',     desc: 'Create, edit, or deactivate user accounts.',           link: '/admin/manage-users',        icon: '👥' },
          { title: 'Audit Logs',       desc: 'View all system and grade access audit logs.',          link: '/admin/audit-logs',          icon: '🗒️' },
          { title: 'Breach Notify',    desc: 'Send PDPA breach notification emails.',                 link: '/admin/breach-notification', icon: '🚨' },
          { title: 'Data Retention',   desc: 'Purge old records per PDPA retention policy.',         link: '/admin/data-retention',      icon: '🗑️' },
        ].map(c => (
          <a key={c.title} href={c.link} className="card p-6 hover:border-indigo-500/30 transition-all group">
            <div className="text-2xl mb-3">{c.icon}</div>
            <h3 className="font-display font-semibold text-slate-200 group-hover:text-indigo-300 transition-colors mb-1">{c.title}</h3>
            <p className="text-sm text-slate-500">{c.desc}</p>
          </a>
        ))}
      </div>
    </Layout>
  );
};

export const ManageUsers = () => {
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

      {/* Filter tabs */}
      <div className="flex gap-2 mb-5 flex-wrap">
        {['all','active','student','lecturer','admin','pending','deleted'].map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all capitalize
              ${filter === f ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-slate-200'}`}>
            {f}
          </button>
        ))}
      </div>

      {/* Modal form */}
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
