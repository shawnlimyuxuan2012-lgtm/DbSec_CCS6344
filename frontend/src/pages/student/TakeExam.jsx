import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../../utils/api';
import Layout from '../../components/Layout';

const TakeExam = () => {
  const { id } = useParams();
  const [exam, setExam] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get(`/student/exams/${id}`)
      .then(r => setExam(r.data))
      .catch(() => setError('Unable to load exam details'))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return <Layout><div className="flex justify-center py-20"><div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" /></div></Layout>;
  }

  if (error || !exam) {
    return <Layout><div className="alert-error">{error || 'Exam not found'}</div></Layout>;
  }

  return (
    <Layout>
      <div className="mb-6">
        <Link to="/student/exams" className="text-sm text-indigo-400 hover:text-indigo-300">← Back to exams</Link>
        <h1 className="page-title mt-3">{exam.title}</h1>
      </div>

      <div className="card p-6 space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <p className="text-slate-400 text-sm">Course</p>
            <p className="text-slate-200">{exam.course_code} · {exam.class_name}</p>
          </div>
          <div>
            <p className="text-slate-400 text-sm">Deadline</p>
            <p className="text-slate-200">{new Date(exam.deadline).toLocaleString()}</p>
          </div>
          <div>
            <p className="text-slate-400 text-sm">Questions</p>
            <p className="text-slate-200">{exam.question_count}</p>
          </div>
          <div>
            <p className="text-slate-400 text-sm">Total Marks</p>
            <p className="text-slate-200">{exam.total_marks}</p>
          </div>
        </div>

        <div>
          <p className="text-slate-400 text-sm">Instructions</p>
          <p className="text-slate-300 whitespace-pre-line">{exam.instructions || 'Please answer the exam questions honestly and submit before the deadline.'}</p>
        </div>

        <div className="flex flex-wrap gap-3 pt-4">
          <span className="badge-blue">Duration: {exam.duration_minutes} mins</span>
          <span className="badge-amber">Type: {exam.type || 'Online'}</span>
          {exam.submission_id && <span className="badge-green">Already submitted</span>}
        </div>

        <div className="pt-4 border-t border-slate-800/50">
          {exam.submission_id ? (
            <div className="space-y-3 text-slate-400">
              <p>You have already submitted this exam.</p>
              <Link to="/student/exams" className="btn-secondary inline-flex px-4 py-2">Return to exam list</Link>
            </div>
          ) : (
            <div className="space-y-3 text-slate-400">
              <p>This screen is a placeholder for exam attempt logic. In the current implementation, the exam details are shown here and the exam is marked submitted when the backend triggers submission.</p>
              <button type="button" disabled className="btn-primary px-4 py-2 opacity-70">Start Exam (Coming Soon)</button>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default TakeExam;
