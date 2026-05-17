import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../../utils/api';
import Layout from '../../components/Layout';

// Assignment list view
export const AssignmentList = () => {
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/student/assignments').then(r => setAssignments(r.data)).finally(() => setLoading(false));
  }, []);

  const now = new Date();

  if (loading) return <Layout><div className="flex justify-center py-20"><div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" /></div></Layout>;

  return (
    <Layout>
      <h1 className="page-title mb-6">Assignments</h1>

      {assignments.length === 0 ? (
        <div className="card p-12 text-center text-slate-400">No assignments available.</div>
      ) : (
        <div className="space-y-3">
          {assignments.map(a => {
            const deadline = new Date(a.deadline);
            const isOverdue = deadline < now;
            const diff = Math.ceil((deadline - now) / (1000 * 60 * 60 * 24));

            return (
              <div key={a.id} className="card p-5 flex items-center justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-slate-200 truncate">{a.title}</h3>
                    {a.submission_id && (
                      a.score !== null
                        ? <span className="badge-green">Graded: {a.score}</span>
                        : <span className="badge-blue">Submitted</span>
                    )}
                    {!a.submission_id && isOverdue && <span className="badge-red">Overdue</span>}
                  </div>
                  <p className="text-xs text-slate-500">{a.course_code} · {a.course_name} · by {a.lecturer_name}</p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Deadline: {deadline.toLocaleDateString()} {deadline.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    {!isOverdue && <span className="ml-2 text-amber-400">({diff}d remaining)</span>}
                  </p>
                </div>
                <Link to={`/student/submit-assignment/${a.id}`} className="btn-primary text-sm shrink-0">
                  {a.submission_id ? 'View / Resubmit' : 'Submit'}
                </Link>
              </div>
            );
          })}
        </div>
      )}
    </Layout>
  );
};

// Single assignment submit view
const SubmitAssignment = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [assignment, setAssignment] = useState(null);
  const [file, setFile] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [dragging, setDragging] = useState(false);

  useEffect(() => {
    api.get(`/student/assignments/${id}`)
      .then(r => setAssignment(r.data))
      .catch(() => setError('Assignment not found'))
      .finally(() => setLoading(false));
  }, [id]);

  const handleFile = (f) => {
    if (!f) return;
    const allowed = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/zip', 'application/x-zip-compressed'];
    const ext = f.name.split('.').pop().toLowerCase();
    if (!['pdf','docx','zip'].includes(ext)) return setError('Only PDF, DOCX, and ZIP files allowed');
    if (f.size > 10 * 1024 * 1024) return setError('File must be under 10MB');
    setError('');
    setFile(f);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) return setError('Please select a file');
    setSubmitting(true);
    setError('');
    const formData = new FormData();
    formData.append('file', file);
    try {
      const { data } = await api.post(`/student/submit-assignment/${id}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setSuccess(data.message);
      setTimeout(() => navigate('/student/submission-history'), 2000);
    } catch (err) {
      setError(err.response?.data?.message || 'Submission failed');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <Layout><div className="flex justify-center py-20"><div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" /></div></Layout>;

  if (!assignment) return <Layout><div className="alert-error">{error}</div></Layout>;

  const deadline = new Date(assignment.deadline);
  const isOverdue = deadline < new Date();

  return (
    <Layout>
      <Link to="/student/submit-assignment" className="text-indigo-400 hover:text-indigo-300 text-sm mb-6 inline-flex items-center gap-1">← Back to assignments</Link>

      <div className="grid grid-cols-3 gap-6">
        {/* Assignment info */}
        <div className="col-span-1">
          <div className="card p-6 sticky top-8">
            <h2 className="font-display font-bold text-slate-100 mb-4">{assignment.title}</h2>
            <div className="space-y-3 text-sm">
              <div><p className="text-slate-500 text-xs">Course</p><p className="text-slate-300">{assignment.course_code} · {assignment.course_name}</p></div>
              <div><p className="text-slate-500 text-xs">Lecturer</p><p className="text-slate-300">{assignment.lecturer_name}</p></div>
              <div><p className="text-slate-500 text-xs">Deadline</p><p className={isOverdue ? 'text-red-400' : 'text-slate-300'}>{deadline.toLocaleString()}</p></div>
              <div><p className="text-slate-500 text-xs">Max Score</p><p className="text-slate-300">{assignment.max_score} pts</p></div>
              {isOverdue && <div className="badge-red w-fit">Deadline passed</div>}
              {assignment.submission_id && <div className="badge-blue w-fit">Already submitted</div>}
            </div>
            {assignment.description && (
              <div className="mt-4 pt-4 border-t border-slate-800/50">
                <p className="text-xs text-slate-500 mb-1">Description</p>
                <p className="text-sm text-slate-400">{assignment.description}</p>
              </div>
            )}
          </div>
        </div>

        {/* Upload */}
        <div className="col-span-2">
          <div className="card p-6">
            <h2 className="font-display font-semibold text-slate-200 mb-6">
              {assignment.submission_id ? 'Resubmit Assignment' : 'Submit Assignment'}
            </h2>

            {error   && <div className="alert-error mb-5">{error}</div>}
            {success && <div className="alert-success mb-5">{success}</div>}

            {isOverdue && !assignment.submission_id ? (
              <div className="alert-error">The deadline has passed. Submissions are no longer accepted.</div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Drop zone */}
                <div
                  className={`border-2 border-dashed rounded-xl p-10 text-center transition-all cursor-pointer
                    ${dragging ? 'border-indigo-500 bg-indigo-500/5' : 'border-slate-700 hover:border-slate-600'}
                    ${file ? 'border-emerald-500/50 bg-emerald-500/5' : ''}`}
                  onDragOver={e => { e.preventDefault(); setDragging(true); }}
                  onDragLeave={() => setDragging(false)}
                  onDrop={e => { e.preventDefault(); setDragging(false); handleFile(e.dataTransfer.files[0]); }}
                  onClick={() => document.getElementById('fileInput').click()}
                >
                  <input id="fileInput" type="file" className="hidden" accept=".pdf,.docx,.zip"
                    onChange={e => handleFile(e.target.files[0])} />

                  {file ? (
                    <div className="space-y-1">
                      <div className="text-3xl">📄</div>
                      <p className="font-medium text-slate-200">{file.name}</p>
                      <p className="text-xs text-slate-500">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                      <button type="button" className="text-xs text-red-400 hover:text-red-300 mt-2"
                        onClick={e => { e.stopPropagation(); setFile(null); }}>Remove file</button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="text-4xl">📤</div>
                      <p className="text-slate-400">Drag & drop your file here, or <span className="text-indigo-400">browse</span></p>
                      <p className="text-xs text-slate-500">PDF, DOCX, ZIP · Max 10MB</p>
                    </div>
                  )}
                </div>

                <button type="submit" disabled={submitting || !file} className="btn-primary w-full py-3">
                  {submitting ? 'Uploading…' : assignment.submission_id ? 'Resubmit Assignment' : 'Submit Assignment'}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default SubmitAssignment;
