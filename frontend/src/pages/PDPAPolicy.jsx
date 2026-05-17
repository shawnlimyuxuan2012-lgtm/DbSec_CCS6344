import { Link } from 'react-router-dom';

const PDPAPolicy = () => (
  <div className="min-h-screen px-8 py-12 max-w-3xl mx-auto">
    <Link to="/" className="text-indigo-400 hover:text-indigo-300 text-sm mb-8 inline-flex items-center gap-1">
      ← Back to home
    </Link>

    <h1 className="text-4xl font-black text-slate-100 mb-2">Privacy Policy</h1>
    <p className="text-slate-400 text-sm mb-8">Personal Data Protection Act (PDPA) Compliance · Last updated: January 2025</p>

    <div className="space-y-8 text-slate-300 leading-relaxed">
      {[
        {
          title: '1. Data Controller',
          content: 'AssessHub ("we", "our", or "us") is the data controller responsible for your personal data collected through this assessment platform.',
        },
        {
          title: '2. Data We Collect',
          content: 'We collect: Full name, Email address, Password (stored as a bcrypt hash — never in plaintext), Assignment submissions and files, Grade records, IP addresses for security logging, Consent timestamps.',
        },
        {
          title: '3. Purpose of Collection',
          content: 'Your data is used solely for: Managing your student account and academic records, Processing assignment submissions and grades, Communicating platform updates and security alerts, Complying with legal and regulatory obligations.',
        },
        {
          title: '4. Your Rights Under PDPA',
          content: 'You have the right to: Access a copy of your personal data (available via "Download My Data"), Request correction of inaccurate data, Request deletion of your account and data (subject to legal retention requirements), Withdraw consent at any time (which will result in account deactivation), Lodge a complaint with the relevant data protection authority.',
        },
        {
          title: '5. Data Retention',
          content: 'We retain personal data for the duration of your academic enrollment plus 3 years, as required by educational regulations. Audit logs are retained for 1 year. You may request early deletion, which will be processed within 30 days.',
        },
        {
          title: '6. Data Security',
          content: 'We implement: bcrypt password hashing (cost factor 12), JWT-based authentication with expiry, Role-based access control, Comprehensive audit logging, File upload restrictions and validation.',
        },
        {
          title: '7. Data Breach Notification',
          content: 'In the event of a data breach affecting your personal data, we will notify you within 72 hours of becoming aware of the breach, as required by applicable law.',
        },
        {
          title: '8. Contact Us',
          content: 'For data protection inquiries: privacy@assesshub.edu · Data Protection Officer: dpo@assesshub.edu',
        },
      ].map(({ title, content }) => (
        <section key={title} className="card p-6">
          <h2 className="font-display font-semibold text-slate-100 mb-3">{title}</h2>
          <p className="text-sm text-slate-400">{content}</p>
        </section>
      ))}
    </div>
  </div>
);

export default PDPAPolicy;
