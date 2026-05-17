import { useState } from 'react';
import api from '../../utils/api';
import Layout from '../../components/Layout';

const DataRetention = () => {
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
                  onChange={e => setDays(parseInt(e.target.value, 10))} />
              </div>
              <div className="flex items-start gap-2 bg-red-500/10 border border-red-500/20 rounded-xl p-4">
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
              { category: 'User accounts', period: 'Duration of enrollment + 3 years', color: 'blue' },
              { category: 'Submissions & files', period: 'Duration of enrollment + 3 years', color: 'blue' },
              { category: 'Grade records', period: 'Duration of enrollment + 5 years', color: 'purple' },
              { category: 'Audit logs', period: '1 year (configurable)', color: 'amber' },
              { category: 'Password reset tokens', period: '1 hour (auto-expired)', color: 'green' },
              { category: 'Deletion requests', period: 'Processed within 30 days', color: 'red' },
            ].map(r => (
              <div key={r.category} className="flex items-center justify-between py-2.5 border-b border-slate-800/50 last:border-0">
                <span className="text-sm text-slate-400">{r.category}</span>
                <span className={`text-sm font-semibold text-${r.color}-400`}>{r.period}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default DataRetention;
