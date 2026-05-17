import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../utils/api';
import Layout from '../../components/Layout';

const StudentProfile = () => {
  const { user } = useAuth();
  const [pw, setPw] = useState({ current: '', newPw: '', confirm: '' });
  const [pwMsg, setPwMsg] = useState('');
  const [pwError, setPwError] = useState('');
  const [pwLoading, setPwLoading] = useState(false);
  const [deleteMsg, setDeleteMsg] = useState('');
  const [deleteError, setDeleteError] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState('');
  const [downloading, setDownloading] = useState(false);

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setPwError(''); setPwMsg('');
    if (pw.newPw !== pw.confirm) return setPwError('Passwords do not match');
    if (pw.newPw.length < 8) return setPwError('Password must be at least 8 characters');
    setPwLoading(true);
    try {
      // Simulate: re-login then reset (simplified for demo)
      await api.post('/auth/forgot-password', { email: user.email });
      setPwMsg('Password reset email sent to your inbox (check server console in dev mode).');
    } catch (err) {
      setPwError('Failed to initiate password change');
    } finally {
      setPwLoading(false);
    }
  };

  const handleDownload = async () => {
    setDownloading(true);
    try {
      const response = await api.get('/student/download-data', { responseType: 'blob' });
      const url = URL.createObjectURL(new Blob([response.data]));
      const a = document.createElement('a');
      a.href = url;
      a.download = `my-data-${Date.now()}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
    } finally {
      setDownloading(false);
    }
  };

  const handleDelete = async () => {
    if (deleteConfirm !== 'DELETE') return setDeleteError('Type DELETE to confirm');
    setDeleteError('');
    try {
      const { data } = await api.delete('/student/delete-account');
      setDeleteMsg(data.message);
    } catch (err) {
      setDeleteError(err.response?.data?.message || 'Request failed');
    }
  };

  return (
    <Layout>
      <h1 className="page-title mb-6">Profile & PDPA Settings</h1>

      {/* Account Info */}
      <div className="card p-6 mb-6">
        <h2 className="font-display font-semibold text-slate-200 mb-4">Account Information</h2>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div><p className="text-slate-500 text-xs mb-1">Name</p><p className="text-slate-200">{user?.name}</p></div>
          <div><p className="text-slate-500 text-xs mb-1">Email</p><p className="text-slate-200">{user?.email}</p></div>
          <div><p className="text-slate-500 text-xs mb-1">Role</p><p><span className="badge-blue">{user?.role}</span></p></div>
          <div><p className="text-slate-500 text-xs mb-1">PDPA Consent</p><p className="text-emerald-400">✓ Given</p></div>
        </div>
      </div>

      {/* Change Password */}
      <div className="card p-6 mb-6">
        <h2 className="font-display font-semibold text-slate-200 mb-4">Change Password</h2>
        {pwError && <div className="alert-error mb-4">{pwError}</div>}
        {pwMsg   && <div className="alert-success mb-4">{pwMsg}</div>}
        <form onSubmit={handlePasswordChange} className="space-y-4 max-w-sm">
          <div>
            <label className="label">New password</label>
            <input type="password" className="input" placeholder="Min. 8 characters"
              value={pw.newPw} onChange={e => setPw({ ...pw, newPw: e.target.value })} />
          </div>
          <div>
            <label className="label">Confirm new password</label>
            <input type="password" className="input" placeholder="Repeat password"
              value={pw.confirm} onChange={e => setPw({ ...pw, confirm: e.target.value })} />
          </div>
          <button type="submit" disabled={pwLoading} className="btn-primary">
            {pwLoading ? 'Processing…' : 'Request Password Change'}
          </button>
        </form>
      </div>

      {/* Download My Data (PDPA) */}
      <div className="card p-6 mb-6">
        <h2 className="font-display font-semibold text-slate-200 mb-2">Download My Data</h2>
        <p className="text-sm text-slate-400 mb-4">
          Under the PDPA, you have the right to access all personal data we hold about you.
          Download a JSON file containing your account details and submission history.
        </p>
        <button onClick={handleDownload} disabled={downloading} className="btn-secondary">
          {downloading ? 'Preparing…' : '⬇ Download My Data (JSON)'}
        </button>
      </div>

      {/* Request Deletion (PDPA) */}
      <div className="card p-6 border border-red-500/20">
        <h2 className="font-display font-semibold text-red-400 mb-2">Request Account Deletion</h2>
        <p className="text-sm text-slate-400 mb-4">
          Under PDPA, you may request deletion of your account and personal data. Your request will
          be processed within 30 days. Academic records required by law may be retained.
        </p>
        {deleteError && <div className="alert-error mb-4">{deleteError}</div>}
        {deleteMsg   && <div className="alert-success mb-4">{deleteMsg}</div>}
        {!deleteMsg && (
          <div className="space-y-3 max-w-sm">
            <div>
              <label className="label text-slate-500">Type <span className="font-mono text-red-400">DELETE</span> to confirm</label>
              <input type="text" className="input border-red-500/30" placeholder="DELETE"
                value={deleteConfirm} onChange={e => setDeleteConfirm(e.target.value)} />
            </div>
            <button onClick={handleDelete} className="btn-danger">
              Request Account Deletion
            </button>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default StudentProfile;
