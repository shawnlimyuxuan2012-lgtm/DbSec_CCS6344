import { useState } from 'react';
import api from '../../utils/api';
import Layout from '../../components/Layout';

const BreachNotification = () => {
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

export default BreachNotification;
