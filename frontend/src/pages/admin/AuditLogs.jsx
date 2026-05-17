import { useState, useEffect } from 'react';
import api from '../../utils/api';
import Layout from '../../components/Layout';

const AuditLogs = () => {
  const [logs, setLogs] = useState([]);
  const [type, setType] = useState('general');
  const [loading, setLoading] = useState(true);

  const load = (t) => {
    setLoading(true);
    const queryType = t === 'grade' ? 'grade' : t === 'sqlserver' ? 'sqlserver' : '';
    api.get(`/admin/audit-logs${queryType ? `?type=${queryType}` : ''}`)
      .then(r => setLogs(r.data))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(type); }, [type]);

  return (
    <Layout>
      <h1 className="page-title mb-6">Audit Logs</h1>

      <div className="flex gap-2 mb-5">
        {['general', 'grade', 'sqlserver'].map(t => (
          <button key={t} onClick={() => setType(t)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all capitalize
              ${type === t ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-slate-200'}`}>
            {t === 'grade' ? 'Grade Access Logs' : t === 'sqlserver' ? 'SQL Server Audit' : 'General Audit Logs'}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" /></div>
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-800/50">
                {type === 'grade'
                  ? ['User', 'Action', 'Grade ID', 'Score', 'IP', 'Time'].map(h => (
                      <th key={h} className="px-5 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">{h}</th>
                    ))
                  : type === 'sqlserver'
                  ? ['User', 'Action', 'Object', 'Database', 'IP', 'Time'].map(h => (
                      <th key={h} className="px-5 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">{h}</th>
                    ))
                  : ['User', 'Action', 'Entity', 'Entity ID', 'IP', 'Time'].map(h => (
                      <th key={h} className="px-5 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">{h}</th>
                    ))
                }
              </tr>
            </thead>
            <tbody>
              {logs.map(log => (
                <tr key={log.id} className="table-row">
                  <td className="px-5 py-3">
                    <p className="text-slate-300">{log.user_name || '—'}</p>
                    <p className="text-xs text-slate-500 font-mono">{log.user_email || ''}</p>
                  </td>
                  <td className="px-5 py-3">
                    <span className={`badge font-mono text-xs ${
                      log.action?.includes('DELETE') ? 'badge-red'
                      : log.action?.includes('CREATE') ? 'badge-green'
                      : log.action?.includes('UPDATE') ? 'badge-amber'
                      : 'badge-blue'
                    }`}>{log.action}</span>
                  </td>
                  {type === 'grade' ? (
                    <>
                      <td className="px-5 py-3 text-slate-400 font-mono">#{log.grade_id || '—'}</td>
                      <td className="px-5 py-3 text-emerald-400 font-bold font-mono">{log.score ?? '—'}</td>
                    </>
                  ) : type === 'sqlserver' ? (
                    <>
                      <td className="px-5 py-3 text-slate-400">
                        <div>{log.entity || '—'}</div>
                        {log.statement && <div className="text-xs text-slate-500 font-mono mt-1 truncate">{log.statement}</div>}
                      </td>
                      <td className="px-5 py-3 text-slate-400 font-mono">{log.database_name || '—'}</td>
                    </>
                  ) : (
                    <>
                      <td className="px-5 py-3 text-slate-400 capitalize">{log.entity || '—'}</td>
                      <td className="px-5 py-3 text-slate-400 font-mono">#{log.entity_id || '—'}</td>
                    </>
                  )}
                  <td className="px-5 py-3 text-slate-500 font-mono text-xs">{log.ip_address || '—'}</td>
                  <td className="px-5 py-3 text-slate-500 text-xs">{new Date(log.created_at).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {logs.length === 0 && (
            <div className="text-center py-10 text-slate-500 text-sm">No logs found.</div>
          )}
        </div>
      )}
    </Layout>
  );
};

export default AuditLogs;
