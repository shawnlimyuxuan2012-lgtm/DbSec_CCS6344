import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../utils/api';
import Layout from '../../components/Layout';

const AdminDashboard = () => {
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

export default AdminDashboard;