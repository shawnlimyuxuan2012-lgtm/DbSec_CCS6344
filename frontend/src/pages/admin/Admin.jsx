import { useState, useEffect } from 'react';
import api from '../../utils/api';
import Layout from '../../components/Layout';

// ─── Admin Dashboard ────────────────────────────────────────────────────────
export const AdminDashboard = () => {
  const [users, setUsers] = useState([]);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([api.get('/admin/users'), api.get('/admin/audit-logs?limit=5')])
      .then(([u, l]) => { setUsers(u.data); setLogs(l.data); })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <Layout>
      <div className="flex justify-center py-20">
        <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    </Layout>
  );

  const counts = {
    total:    users.length,
    students: users.filter(u => u.role === 'student').length,
    lecturers:users.filter(u => u.role === 'lecturer').length,
    admins:   users.filter(u => u.role === 'admin').length,
    deleted:  users.filter(u => u.is_deleted).length,
    pending:  users.filter(u => u.delete_requested_at && !u.is_deleted).length,
  };

  return (
    <Layout>
      <h1 className="page-title mb-2">Admin Dashboard</h1>
      <p className="text-slate-400 mb-8">Platform overview and management</p>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        {[
          { label: 'Total Users',      value: counts.total,    color: 'indigo' },
          { label: 'Students',         value: counts.students, color: 'blue'   },
          { label: 'Lecturers',        value: counts.lecturers,color: 'emerald'},
          { label: 'Admins',           value: counts.admins,   color: 'amber'  },
          { label: 'Deactivated',      value: counts.deleted,  color: 'red'    },
          { label: 'Pending Deletion', value: counts.pending,  color: 'orange' },
        ].map(({ label, value, color }) => (
          <div key={label} className="card p-5">
            <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">{label}</p>
            <p className={`text-3xl font-black font-display text-${color}-400`}>{value}</p>
          </div>
        ))}
      </div>

      {/* Quick links */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        {[
          { href: '/admin/manage-users',       icon: '👥', title: 'Manage Users',       desc: 'Create, edit, deactivate accounts' },
          { href: '/admin/audit-logs',         icon: '🗒️', title: 'Audit Logs',         desc: 'View all system and grade access logs' },
          { href: '/admin/breach-notification',icon: '🚨', title: 'Breach Notification', desc: 'Send PDPA breach alerts to users' },
          { href: '/admin/data-retention',     icon: '🗑️', title: 'Data Retention',     desc: 'Purge old records per PDPA policy' },
        ].map(({ href, icon, title, desc }) => (
          <a key={href} href={href} className="card p-5 hover:border-indigo-500/30 transition-all group">
            <div className="text-2xl mb-2">{icon}</div>
            <h3 className="font-display font-semibold text-slate-200 group-hover:text-indigo-300 transition-colors">{title}</h3>
            <p className="text-sm text-slate-500 mt-1">{desc}</p>
          </a>
        ))}
      </div>

      {/* Recent logs */}
      <div className="card overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-800/50 flex justify-between items-center">
          <h2 className="font-display font-semibold text-slate-200">Recent Activity</h2>
          <a href="/admin/audit-logs" className="text-xs text-indigo-400 hover:text-indigo-300">View all →</a>
        </div>
        <div className="divide-y divide-slate-800/30">
          {logs.length === 0 && (
            <p className="px-6 py-8 text-center text-slate-500 text-sm">No recent activity.</p>
          )}
          {logs.map(l => (
            <div key={l.id} className="px-6 py-3 flex items-center justify-between">
              <div>
                <span className="badge-blue mr-2 font-mono">{l.action}</span>
                <span className="text-sm text-slate-400">{l.user_name || 'System'}</span>
                {l.entity && <span className="text-slate-600 text-xs ml-2">· {l.entity}</span>}
              </div>
              <span className="text-xs text-slate-600">{new Date(l.created_at).toLocaleString()}</span>
            </div>
          ))}
        </div>
      </div>
    </Layout>
  );
};

// ─── Manage Users ────────────────────────────────────────────────────────────
export const ManageUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editUser, setEditUser] = useState(null);
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'student' });
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);
  const [filter, setFilter] = useState('');

  const load = () => {
    setLoading(true);
    api.get('/admin/users').then(r => setUsers(r.data)).finally(() => setLoading(false));
  };
  useEffect(load, []);

  const openCreate = () => {
    setEditUser(null);
    setForm({ name: '', email: '', password: '', role: 'student' });
    setFormError('');
    setShowForm(true);
  };

  const openEdit = (u) => {
    setEditUser(u);
    setForm({ name: u.name, email: u.email, password: '', role: u.role, is_deleted: u.is_deleted });
    setFormError('');
    setShowForm(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setFormError('');
    setSaving(true);
    try {
      if (editUser) {
        await api.put(`/admin/users/${editUser.id}`, form);
      } else {
        if (!form.password) return setFormError('Password is required');
        await api.post('/admin/users', form);
      }
      setShowForm(false);
      load();
    } catch (err) {
      setFormError(err.response?.data?.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Deactivate this user?')) return;
    await api.delete(`/admin/users/${id}`);
    load();
  };

  const filtered = users.filter(u =>
    u.name.toLowerCase().includes(filter.toLowerCase()) ||
    u.email.toLowerCase().includes(filter.toLowerCase())
  );

  return (
    <Layout>
      <div className="flex items-center justify-between mb-6">
        <h1 className="page-title">Manage Users</h1>
        <button onClick={openCreate} className="btn-primary">+ Add User</button>
      </div>

      {/* Search */}
      <div className="mb-4">
        <input type="text" className="input max-w-xs" placeholder="Search by name or email…"
          value={filter} onChange={e => setFilter(e.target.value)} />
      </div>

      {/* Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="card p-6 w-full max-w-md animate-fade-in">
            <h2 className="font-display font-bold text-slate-100 mb-5">
              {editUser ? 'Edit User' : 'Create User'}
            </h2>
            {formError && <div className="alert-error mb-4">{formError}</div>}
            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="label">Full Name</label>
                <input type="text" className="input" value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })} required />
              </div>
              <div>
                <label className="label">Email</label>
                <input type="email" className="input" value={form.email}
                  onChange={e => setForm({ ...form, email: e.target.value })} required />
              </div>
              {!editUser && (
                <div>
                  <label className="label">Password</label>
                  <input type="password" className="input" placeholder="Min. 8 chars"
                    value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} />
                </div>
              )}
              <div>
                <label className="label">Role</label>
                <select className="input" value={form.role}
                  onChange={e => setForm({ ...form, role: e.target.value })}>
                  <option value="student">Student</option>
                  <option value="lecturer">Lecturer</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              {editUser && (
                <div className="flex items-center gap-2">
                  <input type="checkbox" id="deactivated" className="accent-red-500"
                    checked={form.is_deleted || false}
                    onChange={e => setForm({ ...form, is_deleted: e.target.checked })} />
                  <label htmlFor="deactivated" className="text-sm text-slate-400 cursor-pointer">Deactivated</label>
                </div>
              )}
              <div className="flex gap-3 pt-2">
                <button type="submit" disabled={saving} className="btn-primary flex-1">
                  {saving ? 'Saving…' : 'Save'}
                </button>
                <button type="button" onClick={() => setShowForm(false)} className="btn-secondary flex-1">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-20"><div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" /></div>
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-800/50">
                {['Name', 'Email', 'Role', 'Status', 'PDPA', 'Created', 'Actions'].map(h => (
                  <th key={h} className="px-5 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(u => (
                <tr key={u.id} className={`table-row ${u.is_deleted ? 'opacity-50' : ''}`}>
                  <td className="px-5 py-3 font-medium text-slate-200">{u.name}</td>
                  <td className="px-5 py-3 text-sm text-slate-400">{u.email}</td>
                  <td className="px-5 py-3">
                    <span className={u.role === 'admin' ? 'badge-amber' : u.role === 'lecturer' ? 'badge-green' : 'badge-blue'}>
                      {u.role}
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    {u.is_deleted
                      ? <span className="badge-red">Deactivated</span>
                      : u.delete_requested_at
                      ? <span className="badge-amber">Deletion Requested</span>
                      : <span className="badge-green">Active</span>}
                  </td>
                  <td className="px-5 py-3 text-sm">{u.pdpa_consent ? <span className="text-emerald-400">✓</span> : <span className="text-red-400">✗</span>}</td>
                  <td className="px-5 py-3 text-xs text-slate-500">{new Date(u.created_at).toLocaleDateString()}</td>
                  <td className="px-5 py-3">
                    <div className="flex gap-2">
                      <button onClick={() => openEdit(u)} className="text-xs btn-secondary px-2 py-1">Edit</button>
                      {!u.is_deleted && (
                        <button onClick={() => handleDelete(u.id)} className="text-xs btn-danger px-2 py-1">Deactivate</button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Layout>
  );
};

// ─── Audit Logs ──────────────────────────────────────────────────────────────
export const AuditLogs = () => {
  const [logs, setLogs] = useState([]);
  const [type, setType] = useState('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const param = type === 'grade' ? '?type=grade' : '';
    api.get(`/admin/audit-logs${param}`).then(r => setLogs(r.data)).finally(() => setLoading(false));
  }, [type]);

  return (
    <Layout>
      <h1 className="page-title mb-6">Audit Logs</h1>

      <div className="flex gap-2 mb-5">
        {['all', 'grade'].map(t => (
          <button key={t} onClick={() => setType(t)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all
              ${type === t ? 'bg-indigo-600 text-white' : 'btn-secondary'}`}>
            {t === 'all' ? 'System Logs' : 'Grade Access Logs'}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" /></div>
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-800/50">
                {['#', 'Action', 'User', type === 'grade' ? 'Grade Info' : 'Entity', 'IP', 'Time'].map(h => (
                  <th key={h} className="px-5 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {logs.length === 0 && (
                <tr><td colSpan={6} className="px-6 py-12 text-center text-slate-500">No logs found.</td></tr>
              )}
              {logs.map(l => (
                <tr key={l.id} className="table-row">
                  <td className="px-5 py-3 text-slate-600 font-mono text-xs">{l.id}</td>
                  <td className="px-5 py-3"><span className="badge-blue font-mono text-xs">{l.action}</span></td>
                  <td className="px-5 py-3">
                    <p className="text-slate-300">{l.user_name || '—'}</p>
                    <p className="text-xs text-slate-500">{l.user_email || ''}</p>
                  </td>
                  <td className="px-5 py-3 text-slate-400 text-xs font-mono">
                    {type === 'grade'
                      ? (l.score !== undefined ? `Score: ${l.score}` : '—')
                      : (l.entity ? `${l.entity} #${l.entity_id || ''}` : '—')}
                  </td>
                  <td className="px-5 py-3 text-xs text-slate-500 font-mono">{l.ip_address || '—'}</td>
                  <td className="px-5 py-3 text-xs text-slate-500">{new Date(l.created_at).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Layout>
  );
};

// ─── Breach Notification ─────────────────────────────────────────────────────
export const BreachNotification = () => {
  const [form, setForm] = useState({ subject: '', message: '', affected_users: 'all' });
  const [result, setResult] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!confirm('Send breach notification to affected users?')) return;
    setLoading(true); setError(''); setResult('');
    try {
      const { data } = await api.post('/admin/breach-notify', form);
      setResult(`✓ ${data.message} (${data.recipients} recipients)`);
      setForm({ subject: '', message: '', affected_users: 'all' });
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send notification');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <h1 className="page-title mb-2">Breach Notification</h1>
      <p className="text-slate-400 text-sm mb-8">Send PDPA data breach notifications to affected users. (Emails are simulated — check server console.)</p>

      <div className="card p-6 max-w-xl">
        <div className="bg-amber-500/10 border border-amber-500/20 text-amber-300 px-4 py-3 rounded-xl text-sm mb-6">
          ⚠️ Under PDPA, data breaches must be reported to affected individuals within 72 hours of discovery.
        </div>

        {error  && <div className="alert-error mb-5">{error}</div>}
        {result && <div className="alert-success mb-5">{result}</div>}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="label">Subject *</label>
            <input type="text" className="input" placeholder="Important: Data Breach Notification"
              value={form.subject} onChange={e => setForm({ ...form, subject: e.target.value })} required />
          </div>
          <div>
            <label className="label">Message *</label>
            <textarea className="input h-40 resize-none"
              placeholder="Describe what data was affected, what steps are being taken, and what users should do..."
              value={form.message} onChange={e => setForm({ ...form, message: e.target.value })} required />
          </div>
          <div>
            <label className="label">Affected Users</label>
            <select className="input" value={form.affected_users}
              onChange={e => setForm({ ...form, affected_users: e.target.value })}>
              <option value="all">All Users</option>
              <option value="students">Students Only</option>
              <option value="lecturers">Lecturers Only</option>
            </select>
          </div>
          <button type="submit" disabled={loading} className="btn-primary px-8 py-3 bg-red-600 hover:bg-red-500">
            {loading ? 'Sending…' : '🚨 Send Breach Notification'}
          </button>
        </form>
      </div>
    </Layout>
  );
};

// ─── Data Retention ──────────────────────────────────────────────────────────
export const DataRetention = () => {
  const [days, setDays] = useState(365);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handlePurge = async () => {
    if (!confirm(`This will permanently delete audit logs older than ${days} days and accounts pending deletion for over 30 days. This cannot be undone. Proceed?`)) return;
    setLoading(true); setError(''); setResult(null);
    try {
      const { data } = await api.delete('/admin/purge-records', { data: { days } });
      setResult(data);
    } catch (err) {
      setError(err.response?.data?.message || 'Purge failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <h1 className="page-title mb-2">Data Retention</h1>
      <p className="text-slate-400 text-sm mb-8">Manage PDPA-compliant data retention and purge old records.</p>

      <div className="grid grid-cols-2 gap-6 max-w-2xl">
        <div className="card p-6">
          <h2 className="font-display font-semibold text-slate-200 mb-2">Retention Policy</h2>
          <ul className="text-sm text-slate-400 space-y-2">
            <li>📋 Academic records: <span className="text-slate-300">3 years after enrollment ends</span></li>
            <li>🗒️ Audit logs: <span className="text-slate-300">1 year (365 days)</span></li>
            <li>👤 Deleted accounts: <span className="text-slate-300">Hard-deleted after 30 days</span></li>
            <li>🔑 Reset tokens: <span className="text-slate-300">Expire after 1 hour</span></li>
          </ul>
        </div>

        <div className="card p-6 border border-red-500/20">
          <h2 className="font-display font-semibold text-red-400 mb-4">Purge Old Records</h2>

          {error  && <div className="alert-error mb-4">{error}</div>}
          {result && (
            <div className="alert-success mb-4">
              ✓ Purge complete · {result.logsDeleted} log(s) deleted · {result.usersDeleted} user(s) removed
            </div>
          )}

          <div className="mb-4">
            <label className="label">Purge audit logs older than (days)</label>
            <input type="number" className="input" min={30} max={3650} value={days}
              onChange={e => setDays(parseInt(e.target.value))} />
          </div>

          <p className="text-xs text-slate-500 mb-4">
            This will also permanently remove accounts that were requested for deletion more than 30 days ago.
          </p>

          <button onClick={handlePurge} disabled={loading} className="btn-danger w-full justify-center flex">
            {loading ? 'Purging…' : '🗑️ Run Data Purge'}
          </button>
        </div>
      </div>
    </Layout>
  );
};
