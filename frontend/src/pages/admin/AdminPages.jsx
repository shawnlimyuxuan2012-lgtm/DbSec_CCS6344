import { useState, useEffect } from 'react';
import api from '../../utils/api';
import Layout from '../../components/Layout';

export const AuditLogs = () => {
  const [logs, setLogs] = useState([]);
  const [type, setType] = useState('general');
  const [loading, setLoading] = useState(true);

  const load = (t) => {
    setLoading(true);
    const queryType = t === 'grade' ? 'grade' : t === 'sqlserver' ? 'sqlserver' : '';
    api.get(`/admin/audit-logs${queryType ? `?type=${queryType}` : ''}`)
      .then(r => setLogs(r.data))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(type); }, [type]);

  return (
    <Layout>
      <h1 className="page-title mb-6">Audit Logs</h1>

      <div className="flex gap-2 mb-5">
        {['general', 'grade', 'sqlserver'].map(t => (
          <button key={t} onClick={() => setType(t)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all capitalize
              ${type === t ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-slate-200'}`}>
            {t === 'grade' ? 'Grade Access Logs' : t === 'sqlserver' ? 'SQL Server Audit' : 'General Audit Logs'}
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
                {type === 'grade'
                  ? ['User', 'Action', 'Grade ID', 'Score', 'IP', 'Time'].map(h => (
                      <th key={h} className="px-5 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">{h}</th>
                    ))
                  : type === 'sqlserver'
                  ? ['User', 'Action', 'Object', 'Database', 'IP', 'Time'].map(h => (
                      <th key={h} className="px-5 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">{h}</th>
                    ))
                  : ['User', 'Action', 'Entity', 'Entity ID', 'IP', 'Time'].map(h => (
                      <th key={h} className="px-5 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">{h}</th>
                    ))
                }
              </tr>
            </thead>
            <tbody>
              {logs.map(log => (
                <tr key={log.id} className="table-row">
                  <td className="px-5 py-3">
                    <p className="text-slate-300">{log.user_name || '—'}</p>
                    <p className="text-xs text-slate-500 font-mono">{log.user_email || ''}</p>
                  </td>
                  <td className="px-5 py-3">
                    <span className={`badge font-mono text-xs ${
                      log.action?.includes('DELETE') ? 'badge-red'
                      : log.action?.includes('CREATE') ? 'badge-green'
                      : log.action?.includes('UPDATE') ? 'badge-amber'
                      : 'badge-blue'
                    }`}>{log.action}</span>
                  </td>
                  {type === 'grade' ? (
                    <>
                      <td className="px-5 py-3 text-slate-400 font-mono">#{log.grade_id || '—'}</td>
                      <td className="px-5 py-3 text-emerald-400 font-bold font-mono">{log.score ?? '—'}</td>
                    </>
                  ) : type === 'sqlserver' ? (
                    <>
                      <td className="px-5 py-3 text-slate-400">
                        <div>{log.entity || '—'}</div>
                        {log.statement && <div className="text-xs text-slate-500 font-mono mt-1 truncate">{log.statement}</div>}
                      </td>
                      <td className="px-5 py-3 text-slate-400 font-mono">{log.database_name || '—'}</td>
                    </>
                  ) : (
                    <>
                      <td className="px-5 py-3 text-slate-400 capitalize">{log.entity || '—'}</td>
                      <td className="px-5 py-3 text-slate-400 font-mono">#{log.entity_id || '—'}</td>
                    </>
                  )}
                  <td className="px-5 py-3 text-slate-500 font-mono text-xs">{log.ip_address || '—'}</td>
                  <td className="px-5 py-3 text-slate-500 text-xs">{new Date(log.created_at).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {logs.length === 0 && (
            <div className="text-center py-10 text-slate-500 text-sm">No logs found.</div>
          )}
        </div>
      )}
    </Layout>
  );
};

export const BreachNotification = () => {
  const [form, setForm] = useState({ subject: '', message: '', affected_users: 'all' });
  const [result, setResult] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); setResult('');
    if (!form.subject || !form.message) return setError('Subject and message are required');
    setLoading(true);
    try {
      const { data } = await api.post('/admin/breach-notify', form);
      setResult(`✅ ${data.message}${data.recipients ? ` (${data.recipients} recipients)` : ''}`);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send notification');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <h1 className="page-title mb-2">Breach Notification</h1>
      <p className="text-slate-400 text-sm mb-6">Send PDPA data breach notifications to affected users (simulated via console log in dev mode).</p>

      <div className="grid grid-cols-2 gap-6">
        <div className="card p-6">
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
                placeholder="Dear user, we are writing to inform you of a security incident that may have affected your personal data..."
                value={form.message} onChange={e => setForm({ ...form, message: e.target.value })} required />
            </div>
            <div>
              <label className="label">Affected Users</label>
              <select className="input" value={form.affected_users}
                onChange={e => setForm({ ...form, affected_users: e.target.value })}>
                <option value="all">All Active Users</option>
                <option value="students">Students Only</option>
                <option value="lecturers">Lecturers Only</option>
              </select>
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full py-3">
              {loading ? 'Sending…' : '🚨 Send Breach Notification'}
            </button>
          </form>
        </div>

        <div className="card p-6">
          <h2 className="font-display font-semibold text-slate-200 mb-4">PDPA Breach Requirements</h2>
          <div className="space-y-4 text-sm text-slate-400">
            {[
              { icon: '⏱️', title: '72-Hour Rule', desc: 'Notify the PDPC within 72 hours of becoming aware of a breach likely to cause significant harm.' },
              { icon: '📧', title: 'User Notification', desc: 'Notify affected individuals without undue delay when the breach is likely to result in significant harm.' },
              { icon: '📋', title: 'Required Content', desc: 'Include: nature of breach, categories of data, approximate number affected, likely consequences, measures taken.' },
              { icon: '🗒️', title: 'Documentation', desc: 'Maintain records of all breaches, even those not reported to the PDPC.' },
            ].map(item => (
              <div key={item.title} className="flex gap-3">
                <span className="text-xl shrink-0">{item.icon}</span>
                <div>
                  <p className="text-slate-200 font-medium mb-0.5">{item.title}</p>
                  <p>{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export const DataRetention = () => {
  const [days, setDays] = useState(365);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [confirm, setConfirm] = useState(false);

  const handlePurge = async () => {
    if (!confirm) return setError('Please check the confirmation box first');
    setError('');
    setLoading(true);
    try {
      const { data } = await api.delete('/admin/purge-records', { data: { days } });
      setResult(data);
      setConfirm(false);
    } catch (err) {
      setError(err.response?.data?.message || 'Purge failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <h1 className="page-title mb-2">Data Retention & Purge</h1>
      <p className="text-slate-400 text-sm mb-6">Manage data lifecycle in compliance with PDPA retention obligations.</p>

      <div className="grid grid-cols-2 gap-6">
        <div>
          <div className="card p-6 mb-4">
            <h2 className="font-display font-semibold text-slate-200 mb-4">Purge Old Records</h2>
            <p className="text-sm text-slate-400 mb-5">
              Delete audit logs older than the specified number of days, and permanently remove
              accounts that have been soft-deleted and where deletion was requested more than 30 days ago.
            </p>

            {error  && <div className="alert-error mb-4">{error}</div>}
            {result && (
              <div className="alert-success mb-4">
                Purge complete: {result.logsDeleted} audit log(s) and {result.usersDeleted} user(s) removed.
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="label">Delete audit logs older than (days)</label>
                <input type="number" className="input" min={30} max={3650} value={days}
                  onChange={e => setDays(parseInt(e.target.value))} />
              </div>
              <div className="flex items-start gap-3 bg-red-500/10 border border-red-500/20 rounded-xl p-4">
                <input type="checkbox" id="confirmPurge" className="mt-0.5 accent-red-500 shrink-0 w-4 h-4"
                  checked={confirm} onChange={e => setConfirm(e.target.checked)} />
                <label htmlFor="confirmPurge" className="text-xs text-red-300 leading-relaxed cursor-pointer">
                  I understand this action is <strong>irreversible</strong>. Records will be permanently deleted.
                </label>
              </div>
              <button onClick={handlePurge} disabled={loading} className="btn-danger w-full py-3">
                {loading ? 'Purging…' : '🗑️ Run Data Purge'}
              </button>
            </div>
          </div>
        </div>

        <div className="card p-6">
          <h2 className="font-display font-semibold text-slate-200 mb-4">Retention Policy Summary</h2>
          <div className="space-y-3">
            {[
              { category: 'User accounts',      period: 'Duration of enrollment + 3 years',  color: 'blue' },
              { category: 'Submissions & files', period: 'Duration of enrollment + 3 years',  color: 'blue' },
              { category: 'Grade records',       period: 'Duration of enrollment + 5 years',  color: 'purple' },
              { category: 'Audit logs',          period: '1 year (configurable)',              color: 'amber' },
              { category: 'Password reset tokens', period: '1 hour (auto-expired)',           color: 'green' },
              { category: 'Deletion requests',   period: 'Processed within 30 days',          color: 'red' },
            ].map(r => (
              <div key={r.category} className="flex items-center justify-between py-2.5 border-b border-slate-800/50 last:border-0">
                <span className="text-sm text-slate-400">{r.category}</span>
                <span className={`badge-${r.color} text-xs`}>{r.period}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Layout>
  );
};
