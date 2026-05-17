import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../utils/api';
import Layout from '../../components/Layout';

const StudentExamList = () => {
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/student/exams')
      .then(r => setExams(r.data))
      .catch(() => setError('Failed to load exams'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <Layout><div className="flex justify-center py-20"><div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" /></div></Layout>;
  }

  return (
    <Layout>
      <div className="mb-6">
        <h1 className="page-title">Exams</h1>
        <p className="text-slate-400 mt-1">Take exams assigned to your classes.</p>
      </div>

      {error && <div className="alert-error mb-4">{error}</div>}

      <div className="card overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-800/50">
              {['Exam', 'Class', 'Deadline', 'Questions', 'Status', 'Actions'].map(h => (
                <th key={h} className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {exams.length === 0 ? (
              <tr><td className="px-6 py-12 text-center text-slate-500" colSpan="6">No exams available.</td></tr>
            ) : exams.map(exam => {
              const deadline = exam.deadline ? new Date(exam.deadline) : null;
              const isPast = deadline && deadline < new Date();
              const submitted = Boolean(exam.submission_id);
              return (
                <tr key={exam.id} className="table-row">
                  <td className="px-6 py-4">
                    <p className="font-medium text-slate-200">{exam.title}</p>
                    <p className="text-xs text-slate-500">{exam.description || 'No description'}</p>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-400">{exam.course_code} - {exam.class_name}</td>
                  <td className="px-6 py-4 text-sm">
                    {deadline ? <span className={isPast ? 'text-red-400' : 'text-slate-300'}>{deadline.toLocaleString()}</span> : <span className="text-slate-500">No deadline</span>}
                  </td>
                  <td className="px-6 py-4"><span className="badge-purple">{exam.question_count}</span></td>
                  <td className="px-6 py-4">
                    {submitted ? (
                      <span className="badge-green">{exam.score === null || exam.score === undefined ? 'Submitted' : `Score: ${exam.score}`}</span>
                    ) : isPast ? (
                      <span className="badge-red">Closed</span>
                    ) : (
                      <span className="badge-amber">Pending</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <Link to={`/student/exams/${exam.id}`} className={submitted || isPast ? 'text-xs btn-secondary px-3 py-1.5' : 'text-xs btn-primary px-3 py-1.5'}>
                      {submitted ? 'View' : isPast ? 'View' : 'Take Exam'}
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </Layout>
  );
};

export default StudentExamList;
