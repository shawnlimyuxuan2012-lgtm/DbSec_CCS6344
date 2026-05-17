import { Link } from 'react-router-dom';

const features = [
  { icon: '🔒', title: 'PDPA Compliant', desc: 'Full data privacy controls, consent management, and right to deletion.' },
  { icon: '📋', title: 'Assignment Management', desc: 'Create, submit, and grade assignments with file uploads up to 10MB.' },
  { icon: '🎯', title: 'Grade Tracking', desc: 'Real-time grade viewing with detailed feedback from lecturers.' },
  { icon: '🗒️', title: 'Audit Logging', desc: 'Every action is logged for security and compliance transparency.' },
];

const Landing = () => (
  <div className="min-h-screen flex flex-col">
    {/* Nav */}
    <nav className="flex items-center justify-between px-8 py-5 border-b border-indigo-500/10">
      <div className="flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-bold font-display">A</div>
        <span className="font-display font-bold text-xl text-slate-100">AssessHub</span>
      </div>
      <div className="flex items-center gap-3">
        <Link to="/pdpa-policy" className="text-sm text-slate-400 hover:text-slate-200 transition-colors px-3 py-2">Privacy Policy</Link>
        <Link to="/login" className="btn-secondary text-sm px-4 py-2">Log In</Link>
        <Link to="/register" className="btn-primary text-sm px-4 py-2">Register</Link>
      </div>
    </nav>

    {/* Hero */}
    <section className="flex-1 flex flex-col items-center justify-center text-center px-4 py-24">
      <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-medium mb-8">
        <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
        PDPA-Compliant Assessment Platform
      </div>

      <h1 className="text-6xl font-black text-slate-100 mb-6 max-w-3xl leading-none tracking-tight" style={{fontFamily:'Syne'}}>
        Academic assessments, <span className="text-indigo-400">done right.</span>
      </h1>

      <p className="text-lg text-slate-400 max-w-xl mb-10 leading-relaxed">
        A secure platform for students, lecturers, and administrators. Submit assignments, track grades, and stay PDPA compliant — all in one place.
      </p>

      <div className="flex items-center gap-4">
        <Link to="/register" className="btn-primary text-base px-8 py-3">Get Started</Link>
        <Link to="/login" className="btn-secondary text-base px-8 py-3">Sign In</Link>
      </div>

      {/* Demo credentials */}
      <div className="mt-12 card px-6 py-4 text-left max-w-md w-full">
        <p className="text-xs text-slate-500 font-mono mb-3 uppercase tracking-wider">Demo Accounts (password: password123)</p>
        <div className="space-y-1.5 font-mono text-sm">
          <div className="flex justify-between"><span className="badge-amber">admin</span><span className="text-slate-400">admin@assessment.com</span></div>
          <div className="flex justify-between"><span className="badge-green">lecturer</span><span className="text-slate-400">lecturer@assessment.com</span></div>
          <div className="flex justify-between"><span className="badge-blue">student</span><span className="text-slate-400">student@assessment.com</span></div>
        </div>
      </div>
    </section>

    {/* Features */}
    <section className="px-8 py-16 border-t border-slate-800/50">
      <div className="max-w-4xl mx-auto grid grid-cols-2 gap-6">
        {features.map(({ icon, title, desc }) => (
          <div key={title} className="card p-6">
            <div className="text-2xl mb-3">{icon}</div>
            <h3 className="font-display font-semibold text-slate-200 mb-2">{title}</h3>
            <p className="text-sm text-slate-400 leading-relaxed">{desc}</p>
          </div>
        ))}
      </div>
    </section>

    <footer className="text-center py-6 text-xs text-slate-600 border-t border-slate-800/50">
      © 2025 AssessHub · <Link to="/pdpa-policy" className="hover:text-slate-400">PDPA Policy</Link>
    </footer>
  </div>
);

export default Landing;
