import { useState, useEffect } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import { Activity, ShieldOff, CheckCircle, Clock, Filter, RefreshCw } from 'lucide-react';
import Layout from '../components/Layout';
import StatCard from '../components/StatCard';
import Badge from '../components/Badge';
import { getUserAnalytics } from '../api/analytics';
import { getKeys } from '../api/keys';
import { computeStatsFromAnalytics, buildChartFromLogs, fetchAllRecentLogs, fetchKeyAnalytics } from '../utils/analytics';

const emptyStats = { totalRequests: 0, blocked: 0, successRate: 0, avgResponseTime: 0 };

function formatTimestamp(dateStr) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleString('en-US', {
    month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit',
  });
}

function getMethodVariant(method) { return method?.toLowerCase() || 'default'; }

function getStatusVariant(status) {
  const code = String(status);
  if (code === '200' || code === '201') return code;
  if (code === '429') return '429';
  if (code.startsWith('5')) return '500';
  return 'default';
}

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-lg border-2 border-gatex-border bg-gatex-card px-4 py-3 shadow-lg">
        <p className="text-xs text-slate-400 mb-1">{label}</p>
        <p className="text-sm font-bold text-gatex-green">{payload[0].value} requests</p>
      </div>
    );
  }
  return null;
};

export default function Analytics() {
  const [apiKeys, setApiKeys] = useState([]);
  const [selectedKey, setSelectedKey] = useState('all');
  const [stats, setStats] = useState(emptyStats);
  const [chartData, setChartData] = useState([]);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => { loadApiKeys(); }, []);
  useEffect(() => { fetchAnalytics(); }, [selectedKey]);

  const loadApiKeys = async () => {
    try {
      const res = await getKeys();
      setApiKeys(res?.keys || []);
    } catch { setApiKeys([]); }
  };

  const fetchAnalytics = async (isRefresh = false) => {
    isRefresh ? setRefreshing(true) : setLoading(true);
    setError('');
    try {
      if (selectedKey === 'all') {
        const res = await getUserAnalytics();
        const analytics = res?.analytics || [];
        setStats(computeStatsFromAnalytics(analytics));
        const recentLogs = await fetchAllRecentLogs(analytics);
        setLogs(recentLogs);
        setChartData(buildChartFromLogs(recentLogs));
      } else {
        const { stats: keyStats, logs: keyLogs, chartData: keyChart } = await fetchKeyAnalytics(selectedKey);
        setStats(keyStats);
        setLogs(keyLogs);
        setChartData(keyChart);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load analytics');
      setStats(emptyStats);
      setChartData([]);
      setLogs([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const selectedKeyName = selectedKey === 'all'
    ? 'All API Keys'
    : apiKeys.find((k) => k.key === selectedKey)?.name || 'Selected Key';

  return (
    <Layout
      title="Analytics"
      subtitle={selectedKey === 'all'
        ? 'Monitor request volume, success rates, and traffic logs across all keys.'
        : `Viewing analytics for ${selectedKeyName}.`}
    >
      {/* Filter bar */}
      <div className="mb-6 flex flex-col gap-3 rounded-lg border-2 border-gatex-border bg-gatex-card px-5 py-4 shadow-[2px_2px_0px_0px_rgba(0,0,0,0.4)] sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2 text-sm font-medium text-slate-300">
          <Filter size={16} className="text-gatex-green" />
          Filter by API Key
        </div>
        <div className="flex items-center gap-2">
          <select
            value={selectedKey}
            onChange={(e) => setSelectedKey(e.target.value)}
            className="w-full rounded-lg border-2 border-gatex-border bg-gatex-bg px-4 py-2 text-sm font-medium text-white outline-none transition-colors focus:border-gatex-green sm:max-w-xs"
          >
            <option value="all">All API Keys</option>
            {apiKeys.map((key) => (
              <option key={key.key} value={key.key}>{key.name}</option>
            ))}
          </select>
          <button
            onClick={() => fetchAnalytics(true)}
            disabled={refreshing}
            title="Refresh data"
            className="rounded-lg border-2 border-gatex-border bg-gatex-bg p-2 text-slate-400 transition-colors hover:border-gatex-green hover:text-gatex-green disabled:opacity-50"
          >
            <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-red-500/50 bg-red-500/10 px-4 py-3 text-sm text-red-400">{error}</div>
      )}

      {/* Stat cards */}
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={Activity}     value={stats.totalRequests.toLocaleString()} label="Total Requests"    color="text-gatex-green" borderColor="border-gatex-green" />
        <StatCard icon={ShieldOff}    value={stats.blocked.toLocaleString()}        label="Blocked"           color="text-red-400"     borderColor="border-red-400" />
        <StatCard icon={CheckCircle}  value={`${stats.successRate}%`}               label="Success Rate"      color="text-blue-400"    borderColor="border-blue-400" />
        <StatCard icon={Clock}        value={`${stats.avgResponseTime}ms`}           label="Avg Response Time" color="text-orange-400"  borderColor="border-orange-400" />
      </div>

      {/* Chart */}
      <div className="mb-6 rounded-lg border-2 border-gatex-border bg-gatex-card p-6 shadow-[2px_2px_0px_0px_rgba(0,0,0,0.4)]">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-white">
            Requests Over Time
            {selectedKey !== 'all' && (
              <span className="ml-2 text-sm font-normal text-slate-400">— {selectedKeyName}</span>
            )}
          </h2>
          {!loading && chartData.length > 0 && (
            <span className="text-xs text-slate-500">{chartData.length} data points</span>
          )}
        </div>
        {loading ? (
          <div className="flex h-72 items-center justify-center">
            <div className="flex flex-col items-center gap-3">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-gatex-border border-t-gatex-green" />
              <p className="text-sm text-slate-500">Loading chart...</p>
            </div>
          </div>
        ) : chartData.length === 0 ? (
          <div className="flex h-72 items-center justify-center">
            <div className="text-center">
              <p className="font-semibold text-slate-400">No data yet</p>
              <p className="mt-1 text-sm text-slate-600">Send requests through the gateway to see traffic here.</p>
            </div>
          </div>
        ) : (
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2a2d3a" vertical={false} />
                <XAxis dataKey="time" stroke="#475569" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="#475569" fontSize={11} tickLine={false} axisLine={false} allowDecimals={false} />
                <Tooltip content={<CustomTooltip />} />
                <Line
                  type="monotone"
                  dataKey="requests"
                  stroke="#4caf50"
                  strokeWidth={2.5}
                  dot={{ fill: '#4caf50', strokeWidth: 0, r: 4 }}
                  activeDot={{ r: 6, fill: '#4caf50', strokeWidth: 2, stroke: '#1a1d27' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Logs table */}
      <div className="rounded-lg border-2 border-gatex-border bg-gatex-card shadow-[2px_2px_0px_0px_rgba(0,0,0,0.4)]">
        <div className="flex items-center justify-between border-b-2 border-gatex-border px-6 py-4">
          <h2 className="text-lg font-bold text-white">
            Recent Logs
            {selectedKey !== 'all' && (
              <span className="ml-2 text-sm font-normal text-slate-400">— {selectedKeyName}</span>
            )}
          </h2>
          {logs.length > 0 && (
            <span className="rounded-full border border-gatex-border bg-gatex-bg px-2.5 py-0.5 text-xs font-semibold text-slate-400">
              {logs.length} entries
            </span>
          )}
        </div>
        <div className="overflow-x-auto">
          {loading ? (
            <p className="px-6 py-12 text-center text-slate-500">Loading logs...</p>
          ) : (
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b-2 border-gatex-border bg-gatex-bg/30 text-xs uppercase tracking-wider text-slate-500">
                  <th className="px-6 py-3 font-semibold">Route</th>
                  <th className="px-6 py-3 font-semibold">Method</th>
                  <th className="px-6 py-3 font-semibold">Status</th>
                  <th className="px-6 py-3 font-semibold">Response Time</th>
                  <th className="px-6 py-3 font-semibold">Blocked</th>
                  <th className="px-6 py-3 font-semibold">Timestamp</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log, i) => (
                  <tr
                    key={log.id || i}
                    className={`border-b border-gatex-border/40 transition-colors hover:bg-gatex-green/5 ${i % 2 === 0 ? '' : 'bg-gatex-bg/20'}`}
                  >
                    <td className="px-6 py-3.5 font-mono text-xs font-medium text-white">{log.route}</td>
                    <td className="px-6 py-3.5">
                      <Badge variant={getMethodVariant(log.method)}>{log.method}</Badge>
                    </td>
                    <td className="px-6 py-3.5">
                      <Badge variant={getStatusVariant(log.status)}>{log.status}</Badge>
                    </td>
                    <td className="px-6 py-3.5 text-slate-400 text-xs">{log.responseTime}ms</td>
                    <td className="px-6 py-3.5">
                      <Badge variant={log.isBlocked ? 'yes' : 'no'}>{log.isBlocked ? 'Yes' : 'No'}</Badge>
                    </td>
                    <td className="px-6 py-3.5 text-slate-500 text-xs">{formatTimestamp(log.createdAt)}</td>
                  </tr>
                ))}
                {logs.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-6 py-16 text-center">
                      <p className="font-semibold text-slate-400">No request logs yet</p>
                      <p className="mt-1 text-sm text-slate-600">Logs appear here after requests pass through your gateway.</p>
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
