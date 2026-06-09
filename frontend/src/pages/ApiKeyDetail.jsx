import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Gauge, BarChart2, Clock, Shield } from 'lucide-react';
import Layout from '../components/Layout';
import Badge from '../components/Badge';
import StatCard from '../components/StatCard';
import { getKeyOverview } from '../api/analytics';

function formatDate(dateStr) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatTimestamp(dateStr) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

function getMethodVariant(method) {
  return method?.toLowerCase() || 'default';
}

function getStatusVariant(status) {
  const code = String(status);
  if (code === '200' || code === '201') return code;
  if (code === '429') return '429';
  if (code.startsWith('5')) return '500';
  return 'default';
}

export default function ApiKeyDetail() {
  const { apikey } = useParams();
  const navigate = useNavigate();
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchDetail();
  }, [apikey]);

  const fetchDetail = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await getKeyOverview(apikey);
      if (res?.overview) {
        setDetail(res.overview);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load API key details');
      setDetail(null);
    } finally {
      setLoading(false);
    }
  };

  const usage = detail?.rateLimitUsage;
  const logs = detail?.requests?.recentLogs || [];

  return (
    <Layout>
      <button
        onClick={() => navigate('/dashboard')}
        className="mb-4 inline-flex items-center gap-2 text-sm font-medium text-slate-400 transition-colors hover:text-gatex-green"
      >
        <ArrowLeft size={16} />
        Back to Dashboard
      </button>

      {error && (
        <div className="mb-4 rounded-lg border border-red-500/50 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          {error}
        </div>
      )}

      <div className="mb-6 rounded-lg border-2 border-gatex-border bg-gatex-card p-6 shadow-[2px_2px_0px_0px_rgba(0,0,0,0.4)]">
        {loading ? (
          <p className="text-slate-400">Loading key details...</p>
        ) : detail ? (
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h1 className="text-2xl font-bold text-white">{detail.name}</h1>
              <p className="mt-1 break-all text-sm text-slate-400">{detail.url}</p>
              <p className="mt-2 font-mono text-xs text-slate-500">{apikey}</p>
            </div>
            <div className="flex flex-col items-start gap-2 sm:items-end">
              <Badge variant={detail.isActive ? 'active' : 'inactive'}>
                {detail.isActive ? 'Active' : 'Inactive'}
              </Badge>
              <span className="text-sm text-slate-400">
                Created {formatDate(detail.createdAt)}
              </span>
            </div>
          </div>
        ) : (
          <p className="text-slate-500">API key not found.</p>
        )}
      </div>

      {detail && (
        <>
          <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard icon={Gauge} value={(detail.rateLimit || 0).toLocaleString()} label="Rate Limit" />
            <StatCard icon={BarChart2} value={(usage?.used || 0).toLocaleString()} label="Used" color="text-blue-400" />
            <StatCard icon={Shield} value={(usage?.remaining || 0).toLocaleString()} label="Remaining" color="text-gatex-green" />
            <StatCard icon={Clock} value={usage?.resetsIn || '—'} label="Resets In" color="text-orange-400" />
          </div>

          <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
            <StatCard
              icon={BarChart2}
              value={(detail.requests?.total || 0).toLocaleString()}
              label="Total Requests"
            />
            <StatCard
              icon={Shield}
              value={(detail.requests?.blocked || 0).toLocaleString()}
              label="Blocked Requests"
              color="text-red-400"
            />
            <StatCard
              icon={Clock}
              value={`${Math.round(detail.requests?.avgResponseTime || 0)}ms`}
              label="Avg Response Time"
              color="text-orange-400"
            />
          </div>
        </>
      )}

      <div className="rounded-lg border-2 border-gatex-border bg-gatex-card shadow-[2px_2px_0px_0px_rgba(0,0,0,0.4)]">
        <div className="border-b-2 border-gatex-border px-6 py-4">
          <h2 className="text-lg font-bold text-white">Recent Logs</h2>
        </div>
        <div className="overflow-x-auto">
          {loading ? (
            <p className="px-6 py-12 text-center text-slate-500">Loading logs...</p>
          ) : (
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b-2 border-gatex-border text-xs uppercase tracking-wider text-slate-400">
                  <th className="px-6 py-3 font-semibold">Route</th>
                  <th className="px-6 py-3 font-semibold">Method</th>
                  <th className="px-6 py-3 font-semibold">Status Code</th>
                  <th className="px-6 py-3 font-semibold">Response Time</th>
                  <th className="px-6 py-3 font-semibold">Blocked</th>
                  <th className="px-6 py-3 font-semibold">Timestamp</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log, i) => (
                  <tr
                    key={log.id || i}
                    className="border-b border-gatex-border/50 transition-colors hover:bg-gatex-bg/50"
                  >
                    <td className="px-6 py-4 font-medium text-white">{log.route}</td>
                    <td className="px-6 py-4">
                      <Badge variant={getMethodVariant(log.method)}>{log.method}</Badge>
                    </td>
                    <td className="px-6 py-4">
                      <Badge variant={getStatusVariant(log.status)}>{log.status}</Badge>
                    </td>
                    <td className="px-6 py-4 text-slate-400">{log.responseTime}ms</td>
                    <td className="px-6 py-4">
                      <Badge variant={log.isBlocked ? 'yes' : 'no'}>
                        {log.isBlocked ? 'Yes' : 'No'}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-slate-400">
                      {formatTimestamp(log.createdAt)}
                    </td>
                  </tr>
                ))}
                {logs.length === 0 && !loading && (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                      No logs recorded for this key yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </Layout>
  );
}
