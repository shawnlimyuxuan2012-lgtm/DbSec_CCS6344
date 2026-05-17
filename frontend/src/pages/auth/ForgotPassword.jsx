import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import api from '../../utils/api';

export const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [msg, setMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await api.post('/auth/forgot-password', { email });
      setMsg(data.message);
    } catch (err) {
      setMsg('Request submitted. Check your inbox if the email exists.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-md animate-fade-in">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 mb-6">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-bold font-display text-lg">A</div>
          </Link>
          <h1 className="text-2xl font-bold text-slate-100">Reset your password</h1>
          <p className="text-slate-400 text-sm mt-1">We'll send a reset link to your email</p>
        </div>
        <div className="card p-8">
          {msg && <div className="alert-success mb-5">{msg}</div>}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="label">Email address</label>
              <input type="email" className="input" placeholder="you@example.com"
                value={email} onChange={e => setEmail(e.target.value)} required />
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full py-3">
              {loading ? 'Sending…' : 'Send Reset Link'}
            </button>
          </form>
          <p className="text-center text-sm text-slate-500 mt-5">
            <Link to="/login" className="text-indigo-400 hover:text-indigo-300">Back to sign in</Link>
          </p>
          <div className="mt-4 p-3 bg-slate-800/40 rounded-lg text-xs text-slate-500 font-mono">
            💡 Dev mode: reset token logged to server console
          </div>
        </div>
      </div>
    </div>
  );
};

export const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';
  const [form, setForm] = useState({ password: '', confirm: '' });
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (form.password !== form.confirm) return setError('Passwords do not match');
    setLoading(true);
    try {
      const { data } = await api.post('/auth/reset-password', { token, password: form.password });
      setMsg(data.message);
    } catch (err) {
      setError(err.response?.data?.message || 'Reset failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-md animate-fade-in">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-slate-100">Set new password</h1>
        </div>
        <div className="card p-8">
          {error && <div className="alert-error mb-5">{error}</div>}
          {msg   && <div className="alert-success mb-5">{msg} <Link to="/login" className="font-medium underline">Sign in</Link></div>}
          {!msg && (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="label">New password</label>
                <input type="password" className="input" placeholder="Min. 8 characters"
                  value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} required minLength={8} />
              </div>
              <div>
                <label className="label">Confirm password</label>
                <input type="password" className="input" placeholder="Repeat password"
                  value={form.confirm} onChange={e => setForm({ ...form, confirm: e.target.value })} required />
              </div>
              <button type="submit" disabled={loading} className="btn-primary w-full py-3">
                {loading ? 'Resetting…' : 'Reset Password'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
