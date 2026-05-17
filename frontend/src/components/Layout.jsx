import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const icons = {
  dashboard: '⬡',
  assignments: '📋',
  submissions: '📤',
  grades: '🎯',
  profile: '👤',
  pdpa: '🔒',
  courses: '📚',
  users: '👥',
  audit: '🗒️',
  breach: '🚨',
  retention: '🗑️',
};

const studentLinks = [
  { to: '/student/dashboard', label: 'Dashboard', icon: icons.dashboard },
  { to: '/student/classes', label: 'My Classes', icon: icons.courses },
  { to: '/student/submit-assignment', label: 'Assignments', icon: icons.assignments },
  { to: '/student/exams', label: 'Exams', icon: icons.grades },
  { to: '/student/submission-history', label: 'My Submissions', icon: icons.submissions },
  { to: '/student/grade-view', label: 'My Grades', icon: icons.grades },
  { to: '/student/profile', label: 'Profile & PDPA', icon: icons.profile },
];

const lecturerLinks = [
  { to: '/lecturer/dashboard', label: 'Dashboard', icon: icons.dashboard },
  { to: '/lecturer/classes', label: 'Classes', icon: icons.courses },
  { to: '/lecturer/create-assignment', label: 'Assignments', icon: icons.assignments },
  { to: '/lecturer/exams', label: 'Exams', icon: icons.grades },
];

const adminLinks = [
  { to: '/admin/dashboard', label: 'Dashboard', icon: icons.dashboard },
  { to: '/admin/manage-users', label: 'Manage Users', icon: icons.users },
  { to: '/admin/audit-logs', label: 'Audit Logs', icon: icons.audit },
  { to: '/admin/breach-notification', label: 'Breach Notify', icon: icons.breach },
  { to: '/admin/data-retention', label: 'Data Retention', icon: icons.retention },
];

const roleLinks = { student: studentLinks, lecturer: lecturerLinks, admin: adminLinks };

const roleColor = { student: 'indigo', lecturer: 'emerald', admin: 'amber' };
const roleBadge = {
  student:  'badge-blue',
  lecturer: 'badge-green',
  admin:    'badge-amber',
};

const Layout = ({ children }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const links = roleLinks[user?.role] || [];

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside className="w-64 shrink-0 flex flex-col bg-slate-900/80 border-r border-indigo-500/10 backdrop-blur-xl">
        {/* Logo */}
        <div className="px-6 py-6 border-b border-slate-800/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-bold text-sm font-display">A</div>
            <span className="font-display font-bold text-lg text-slate-100">AssessHub</span>
          </div>
        </div>

        {/* User info */}
        <div className="px-5 py-4 border-b border-slate-800/50">
          <p className="text-sm font-semibold text-slate-200 truncate">{user?.name}</p>
          <p className="text-xs text-slate-500 truncate mt-0.5">{user?.email}</p>
          <span className={`${roleBadge[user?.role]} mt-2 text-xs`}>{user?.role}</span>
        </div>

        {/* Nav links */}
        <nav className="flex-1 px-3 py-4 space-y-1">
          {links.map(({ to, label, icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
            >
              <span className="text-base">{icon}</span>
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>

        {/* Logout */}
        <div className="px-3 py-4 border-t border-slate-800/50">
          <button onClick={handleLogout} className="nav-link w-full text-red-400 hover:text-red-300 hover:bg-red-500/10">
            <span>⇠</span>
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-auto">
        <div className="max-w-6xl mx-auto px-8 py-8 animate-fade-in">
          {children}
        </div>
      </main>
    </div>
  );
};

export default Layout;
