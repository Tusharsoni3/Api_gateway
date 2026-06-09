import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Key, Activity, ShieldOff, Clock, Plus, Trash2, ToggleLeft, ToggleRight, Eye } from 'lucide-react';
import Cookies from 'js-cookie';
import Layout from '../components/Layout';
import StatCard from '../components/StatCard';
import Badge from '../components/Badge';
import GenerateKeyModal from '../components/GenerateKeyModal';
import { getKeys, generateKey, deleteKey, toggleKeyStatus } from '../api/keys';
import { getUserAnalytics } from '../api/analytics';
import { computeStatsFromAnalytics } from '../utils/analytics';

const emptyStats = {
  totalKeys: 0,
  totalRequestsToday: 0,
  blockedRequestsToday: 0,
  avgResponseTime: 0,
};

function formatDate(dateStr) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function SkeletonRow() {
  return (
    <tr className="border-b border-gatex-border/50">
      {[1,2,3,4,5].map(i => (
        <td key={i} className="px-6 py-4">
          <div className="h-4 rounded bg-gatex-border animate-pulse" style={{ width: `${60 + i * 10}%` }} />
        </td>
      ))}
    </tr>
  );
}

export default function Dashboard() {
  const navigate = useNavigate();
  const userName = Cookies.get('userName') || Cookies.get('userEmail')?.split('@')[0] || 'Developer';

  const [keys, setKeys] = useState([]);
  const [stats, setStats] = useState(emptyStats);
  const [modalOpen, setModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [actionLoading, setActionLoading] = useState(null);
  const [error, setError] = useState('');
  const [toast, setToast] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  };

  const fetchData = async () => {
    setLoading(true);
    setError('');
    try {
      const [keysData, analyticsData] = await Promise.all([
        getKeys(),
        getUserAnalytics(),
      ]);

      const fetchedKeys = keysData?.keys || [];
      setKeys(fetchedKeys);

      const analytics = analyticsData?.analytics || [];
      const computed = computeStatsFromAnalytics(analytics);

      setStats({
        totalKeys: fetchedKeys.length,
        totalRequestsToday: computed.totalRequests,
        blockedRequestsToday: computed.blocked,
        avgResponseTime: computed.avgResponseTime,
      });
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load dashboard data');
      setKeys([]);
      setStats(emptyStats);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerate = async (data) => {
    setGenerating(true);
    try {
      const result = await generateKey(data);
      await fetchData();
      showToast('API key generated successfully');
      return result;
    } finally {
      setGenerating(false);
    }
  };

  const handleDelete = async (apikey) => {
    if (!confirm('Are you sure you want to delete this API key? This cannot be undone.')) return;
    setActionLoading(apikey);
    setError('');
    try {
      await deleteKey(apikey);
      setKeys((prev) => prev.filter((k) => k.key !== apikey));
      setStats((prev) => ({ ...prev, totalKeys: prev.totalKeys - 1 }));
      showToast('API key deleted');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete API key');
    } finally {
      setActionLoading(null);
    }
  };

  const handleToggle = async (apikey, currentStatus) => {
    setActionLoading(apikey);
    setError('');
    try {
      const res = await toggleKeyStatus(apikey);
      setKeys((prev) =>
        prev.map((k) =>
          k.key === apikey ? { ...k, isActive: res.isActive } : k
        )
      );
      showToast(`Key ${res.isActive ? 'activated' : 'deactivated'}`);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to toggle API key status');
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <Layout
      title={`Welcome back, ${userName}`}
      subtitle="Here's an overview of your API gateway activity."
    >
      {/* Toast notification */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 rounded-lg border-2 border-gatex-green/40 bg-gatex-card px-4 py-3 text-sm font-semibold text-gatex-green shadow-[2px_2px_0px_0px_rgba(0,0,0,0.5)] animate-fade-in">
          ✓ {toast}
        </div>
      )}

      {error && (
        <div className="mb-4 rounded-lg border border-red-500/50 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          {error}
        </div>
      )}

      {/* Stat cards with colored borders */}
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={Key}       value={stats.totalKeys}                          label="Total API Keys"          color="text-gatex-green" borderColor="border-gatex-green" />
        <StatCard icon={Activity}  value={stats.totalRequestsToday.toLocaleString()} label="Total Requests Today"    color="text-blue-400"    borderColor="border-blue-400" />
        <StatCard icon={ShieldOff} value={stats.blockedRequestsToday.toLocaleString()} label="Blocked Requests"     color="text-red-400"     borderColor="border-red-400" />
        <StatCard icon={Clock}     value={`${stats.avgResponseTime}ms`}              label="Avg Response Time"       color="text-orange-400"  borderColor="border-orange-400" />
      </div>

      {/* API Keys table */}
      <div className="rounded-lg border-2 border-gatex-border bg-gatex-card shadow-[2px_2px_0px_0px_rgba(0,0,0,0.4)]">
        <div className="flex flex-col gap-3 border-b-2 border-gatex-border px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-bold text-white">API Keys</h2>
            <p className="text-xs text-slate-500 mt-0.5">{keys.length} key{keys.length !== 1 ? 's' : ''} registered</p>
          </div>
          <button
            onClick={() => setModalOpen(true)}
            className="inline-flex items-center gap-2 rounded-lg border-2 border-black bg-gatex-green px-4 py-2 text-sm font-bold text-white shadow-[2px_2px_0px_0px_rgba(0,0,0,0.5)] transition-all hover:bg-gatex-green-hover hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,0.5)] hover:translate-x-[1px] hover:translate-y-[1px]"
          >
            <Plus size={16} />
            Generate New Key
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b-2 border-gatex-border text-xs uppercase tracking-wider text-slate-500 bg-gatex-bg/30">
                <th className="px-6 py-3 font-semibold">Name</th>
                <th className="px-6 py-3 font-semibold">Target URL</th>
                <th className="px-6 py-3 font-semibold">Status</th>
                <th className="px-6 py-3 font-semibold">Created</th>
                <th className="px-6 py-3 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <>
                  <SkeletonRow />
                  <SkeletonRow />
                  <SkeletonRow />
                </>
              ) : keys.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-16 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl border-2 border-gatex-border bg-gatex-bg text-slate-600">
                        <Key size={22} />
                      </div>
                      <p className="font-semibold text-slate-400">No API keys yet</p>
                      <p className="text-sm text-slate-600">Generate your first key to start routing traffic through GateX.</p>
                      <button
                        onClick={() => setModalOpen(true)}
                        className="mt-1 inline-flex items-center gap-2 rounded-lg border-2 border-black bg-gatex-green px-4 py-2 text-sm font-bold text-white shadow-[2px_2px_0px_0px_rgba(0,0,0,0.5)] hover:bg-gatex-green-hover"
                      >
                        <Plus size={14} />
                        Generate your first key
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                keys.map((key, i) => (
                  <tr
                    key={key.key}
                    className={`border-b border-gatex-border/50 transition-colors hover:bg-gatex-bg/60 ${i % 2 === 0 ? '' : 'bg-gatex-bg/20'}`}
                  >
                    <td className="px-6 py-4">
                      <button
                        onClick={() => navigate(`/api-keys/${key.key}`)}
                        className="font-semibold text-gatex-green hover:underline underline-offset-2 flex items-center gap-1.5"
                      >
                        {key.name}
                        <Eye size={13} className="opacity-50" />
                      </button>
                    </td>
                    <td className="max-w-[200px] truncate px-6 py-4 font-mono text-xs text-slate-400">{key.url}</td>
                    <td className="px-6 py-4">
                      <Badge variant={key.isActive ? 'active' : 'inactive'}>
                        {key.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-slate-400 text-xs">
                      {formatDate(key.createdAT || key.createdAt)}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleToggle(key.key, key.isActive)}
                          disabled={actionLoading === key.key}
                          title={key.isActive ? 'Deactivate key' : 'Activate key'}
                          className={`rounded-md border p-1.5 transition-colors disabled:opacity-50 ${
                            key.isActive
                              ? 'border-gatex-green/30 text-gatex-green hover:bg-gatex-green/10'
                              : 'border-gatex-border text-slate-500 hover:border-gatex-green hover:text-gatex-green'
                          }`}
                        >
                          {key.isActive ? <ToggleRight size={16} /> : <ToggleLeft size={16} />}
                        </button>
                        <button
                          onClick={() => handleDelete(key.key)}
                          disabled={actionLoading === key.key}
                          title="Delete key"
                          className="rounded-md border border-gatex-border p-1.5 text-slate-500 transition-colors hover:border-red-500/50 hover:bg-red-500/10 hover:text-red-400 disabled:opacity-50"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <GenerateKeyModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSubmit={handleGenerate}
        loading={generating}
      />
    </Layout>
  );
}
