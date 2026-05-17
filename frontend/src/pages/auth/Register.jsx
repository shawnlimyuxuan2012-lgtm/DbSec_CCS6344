import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../../utils/api';

const Register = () => {
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '', pdpa_consent: false });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (form.password !== form.confirm) return setError('Passwords do not match');
    if (!form.pdpa_consent) return setError('You must accept the PDPA consent to register');
    setLoading(true);
    try {
      await api.post('/auth/register', {
        name: form.name, email: form.email,
        password: form.password, pdpa_consent: true,
      });
      setSuccess('Registration successful! Redirecting to login…');
      setTimeout(() => navigate('/login'), 2000);
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md animate-fade-in">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 mb-6">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-bold font-display text-lg">A</div>
            <span className="font-display font-bold text-2xl text-slate-100">AssessHub</span>
          </Link>
          <h1 className="text-2xl font-bold text-slate-100">Create your account</h1>
          <p className="text-slate-400 text-sm mt-1">Register as a student</p>
        </div>

        <div className="card p-8">
          {error   && <div className="alert-error mb-5">{error}</div>}
          {success && <div className="alert-success mb-5">{success}</div>}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="label">Full name</label>
              <input type="text" className="input" placeholder="John Smith"
                value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
            </div>
            <div>
              <label className="label">Email address</label>
              <input type="email" className="input" placeholder="you@example.com"
                value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required />
            </div>
            <div>
              <label className="label">Password</label>
              <input type="password" className="input" placeholder="Min. 8 characters"
                value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} required minLength={8} />
            </div>
            <div>
              <label className="label">Confirm password</label>
              <input type="password" className="input" placeholder="Repeat password"
                value={form.confirm} onChange={e => setForm({ ...form, confirm: e.target.value })} required />
            </div>

            {/* PDPA Consent */}
            <div className="bg-slate-800/40 border border-indigo-500/20 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <input
                  type="checkbox" id="pdpa" className="mt-0.5 accent-indigo-500 w-4 h-4 shrink-0 cursor-pointer"
                  checked={form.pdpa_consent}
                  onChange={e => setForm({ ...form, pdpa_consent: e.target.checked })}
                />
                <label htmlFor="pdpa" className="text-xs text-slate-300 leading-relaxed cursor-pointer">
                  I consent to the collection and processing of my personal data in accordance with the{' '}
                  <Link to="/pdpa-policy" target="_blank" className="text-indigo-400 hover:underline font-medium">
                    Personal Data Protection Act (PDPA) Policy
                  </Link>
                  . I understand I may request access to, correction of, or deletion of my data at any time.
                  {' '}<span className="text-red-400 font-medium">*Required</span>
                </label>
              </div>
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full py-3">
              {loading ? 'Creating account…' : 'Create Account'}
            </button>
          </form>

          <p className="text-center text-sm text-slate-500 mt-5">
            Already have an account?{' '}
            <Link to="/login" className="text-indigo-400 hover:text-indigo-300">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
