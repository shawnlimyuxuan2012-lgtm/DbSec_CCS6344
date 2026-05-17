import { Link } from 'react-router-dom';

const AssignmentTable = ({ assignments, onDelete }) => {
  if (assignments.length === 0) {
    return (
      <div className="card p-12 text-center">
        <p className="text-slate-400">No assignments yet.</p>
      </div>
    );
  }

  return (
    <div className="card overflow-hidden">
      <table className="w-full">
        <thead>
          <tr className="border-b border-slate-800/50">
            {['Assignment', 'Class', 'Deadline', 'Submissions', 'Actions'].map(h => (
              <th key={h} className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {assignments.map(a => {
            const deadline = new Date(a.deadline);
            const isPast = deadline < new Date();
            return (
              <tr key={a.id} className="table-row">
                <td className="px-6 py-4">
                  <p className="font-medium text-slate-200">{a.title}</p>
                  <p className="text-xs text-slate-500">{a.course_code} - Max: {a.max_score} pts</p>
                </td>
                <td className="px-6 py-4 text-sm text-slate-400">{a.class_name || 'Open'}</td>
                <td className="px-6 py-4 text-sm">
                  <span className={isPast ? 'text-red-400' : 'text-slate-300'}>{deadline.toLocaleDateString()}</span>
                </td>
                <td className="px-6 py-4 text-sm">
                  <span className="badge-blue">{a.submission_count} submitted</span>
                  {a.graded_count > 0 && <span className="badge-green ml-2">{a.graded_count} graded</span>}
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <Link to={`/lecturer/submissions/${a.id}`} className="text-xs btn-secondary px-3 py-1.5">View</Link>
                    <Link to={`/lecturer/edit-assignment/${a.id}`} className="text-xs btn-secondary px-3 py-1.5">Edit</Link>
                    <button onClick={() => onDelete(a.id)} className="text-xs btn-danger px-3 py-1.5">Delete</button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default AssignmentTable;
