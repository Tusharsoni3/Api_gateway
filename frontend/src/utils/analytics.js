import { getKeyOverview } from '../api/analytics';

export function computeStatsFromAnalytics(analytics) {
  const totalRequests = analytics.reduce((sum, a) => sum + (a.totalRequests || 0), 0);
  const blocked = analytics.reduce((sum, a) => sum + (a.blockedRequests || 0), 0);
  const avgTimes = analytics.filter((a) => a.avgResponseTime != null);
  const avgResponseTime = avgTimes.length
    ? Math.round(avgTimes.reduce((sum, a) => sum + Number(a.avgResponseTime), 0) / avgTimes.length)
    : 0;
  const successRate = totalRequests > 0
    ? Number(((totalRequests - blocked) / totalRequests * 100).toFixed(1))
    : 0;

  return { totalRequests, blocked, avgResponseTime, successRate };
}

export function computeStatsFromOverview(overview) {
  const totalRequests = overview?.requests?.total || 0;
  const blocked = overview?.requests?.blocked || 0;
  const avgResponseTime = Math.round(overview?.requests?.avgResponseTime || 0);
  const successRate = totalRequests > 0
    ? Number(((totalRequests - blocked) / totalRequests * 100).toFixed(1))
    : 0;

  return { totalRequests, blocked, avgResponseTime, successRate };
}

export function buildChartFromLogs(logs) {
  if (!logs.length) {
    return [
      { time: '00:00', requests: 0 },
      { time: '04:00', requests: 0 },
      { time: '08:00', requests: 0 },
      { time: '12:00', requests: 0 },
      { time: '16:00', requests: 0 },
      { time: '20:00', requests: 0 },
    ];
  }

  const buckets = {};
  logs.forEach((log) => {
    const hour = new Date(log.createdAt).getHours();
    const label = `${String(hour).padStart(2, '0')}:00`;
    buckets[label] = (buckets[label] || 0) + 1;
  });

  return Object.entries(buckets)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([time, requests]) => ({ time, requests }));
}

export async function fetchAllRecentLogs(analytics) {
  const results = await Promise.allSettled(
    analytics
      .filter((a) => a.key)
      .map((a) => getKeyOverview(a.key))
  );

  const logs = results
    .filter((r) => r.status === 'fulfilled')
    .flatMap((r) => r.value?.overview?.requests?.recentLogs || [])
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 20);

  return logs;
}

export async function fetchKeyAnalytics(apikey) {
  const res = await getKeyOverview(apikey);
  const overview = res?.overview;
  const logs = overview?.requests?.recentLogs || [];

  return {
    stats: computeStatsFromOverview(overview),
    logs,
    chartData: buildChartFromLogs(logs),
  };
}
