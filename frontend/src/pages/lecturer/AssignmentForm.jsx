import { useEffect, useState } from 'react';
import api, { localDatetimeToISO } from '../../utils/api';

const AssignmentForm = ({ initial = {}, onSubmit, loading, title }) => {
  const [classes, setClasses] = useState([]);
  const [form, setForm] = useState({
    title: '',
    description: '',
    course_code: '',
    course_name: '',
    class_id: '',
    deadline: '',
    max_score: 100,
    ...initial,
  });

  useEffect(() => {
    api.get('/lecturer/classes').then(r => setClasses(r.data)).catch(console.error);
  }, []);

  useEffect(() => {
    setForm(current => ({ ...current, ...initial }));
  }, [initial]);

  const applyClass = (classId) => {
    const selected = classes.find(c => String(c.id) === String(classId));
    setForm({
      ...form,
      class_id: classId,
      course_code: selected?.course_code || form.course_code,
      course_name: selected?.name || form.course_name,
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({
      ...form,
      deadline: localDatetimeToISO(form.deadline),
      class_id: form.class_id || null,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="grid grid-cols-2 gap-5">
        <div className="col-span-2">
          <label className="label">Assignment Title *</label>
          <input type="text" className="input" placeholder="e.g. Assignment 1: Database Design" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} required />
        </div>
        <div className="col-span-2">
          <label className="label">Class</label>
          <select className="input" value={form.class_id || ''} onChange={e => applyClass(e.target.value)}>
            <option value="">Open assignment, no class</option>
            {classes.map(c => <option key={c.id} value={c.id}>{c.course_code} - {c.name}</option>)}
          </select>
        </div>
        <div>
          <label className="label">Course Code *</label>
          <input type="text" className="input" value={form.course_code} onChange={e => setForm({ ...form, course_code: e.target.value })} required />
        </div>
        <div>
          <label className="label">Course Name *</label>
          <input type="text" className="input" value={form.course_name} onChange={e => setForm({ ...form, course_name: e.target.value })} required />
        </div>
        <div>
          <label className="label">Deadline *</label>
          <input type="datetime-local" className="input" value={form.deadline} onChange={e => setForm({ ...form, deadline: e.target.value })} required />
        </div>
        <div>
          <label className="label">Maximum Score</label>
          <input type="number" className="input" min={1} max={1000} value={form.max_score} onChange={e => setForm({ ...form, max_score: parseInt(e.target.value, 10) || 100 })} />
        </div>
        <div className="col-span-2">
          <label className="label">Description</label>
          <textarea className="input h-32 resize-none" placeholder="Assignment instructions..." value={form.description || ''} onChange={e => setForm({ ...form, description: e.target.value })} />
        </div>
      </div>
      <button type="submit" disabled={loading} className="btn-primary px-8 py-3">
        {loading ? 'Saving...' : title}
      </button>
    </form>
  );
};

export default AssignmentForm;
