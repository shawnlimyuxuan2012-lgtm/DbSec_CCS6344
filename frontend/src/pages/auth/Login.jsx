import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const Login = () => {
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const user = await login(form.email, form.password);
      navigate(`/${user.role}/dashboard`);
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-md animate-fade-in">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 mb-6">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-bold font-display text-lg">A</div>
            <span className="font-display font-bold text-2xl text-slate-100">AssessHub</span>
          </Link>
          <h1 className="text-2xl font-bold text-slate-100">Welcome back</h1>
          <p className="text-slate-400 text-sm mt-1">Sign in to your account</p>
        </div>

        <div className="card p-8">
          {error && <div className="alert-error mb-5">{error}</div>}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="label">Email address</label>
              <input
                type="email" className="input" placeholder="you@example.com"
                value={form.email} onChange={e => setForm({ ...form, email: e.target.value })}
                required autoFocus
              />
            </div>
            <div>
              <label className="label">Password</label>
              <input
                type="password" className="input" placeholder="••••••••"
                value={form.password} onChange={e => setForm({ ...form, password: e.target.value })}
                required
              />
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full py-3">
              {loading ? 'Signing in…' : 'Sign In'}
            </button>
          </form>

          <div className="mt-6 rounded-2xl border border-slate-800/60 bg-slate-950/80 p-4 text-sm text-slate-300">
            <p className="text-slate-400 text-xs uppercase tracking-[0.2em] mb-2">Test accounts</p>
            <p className="font-medium">Password for all accounts: <span className="text-indigo-300">MmuPass2026!</span></p>
            <div className="mt-3 space-y-2">
              <div className="flex justify-between"><span className="font-semibold">Admin</span><span className="text-slate-400">admin@mmu.edu.my</span></div>
              <div className="flex justify-between"><span className="font-semibold">Lecturer</span><span className="text-slate-400">lecturer@mmu.edu.my</span></div>
              <div className="flex justify-between"><span className="font-semibold">Student</span><span className="text-slate-400">student@mmu.edu.my</span></div>
            </div>
          </div>

          <div className="mt-5 flex flex-col items-center gap-3 text-sm">
            <Link to="/forgot-password" className="text-indigo-400 hover:text-indigo-300 transition-colors">
              Forgot your password?
            </Link>
            <span className="text-slate-500">
              No account?{' '}
              <Link to="/register" className="text-indigo-400 hover:text-indigo-300">Register here</Link>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
