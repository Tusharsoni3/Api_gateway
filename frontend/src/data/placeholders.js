export const placeholderKeys = [
  {
    key: 'ak_demo_key_001',
    name: 'Production API',
    url: 'https://api.example.com/v1',
    isActive: true,
    createdAT: '2026-05-12T10:30:00Z',
    rateLimit: 1000,
  },
  {
    key: 'ak_demo_key_002',
    name: 'Staging API',
    url: 'https://staging.example.com/v1',
    isActive: true,
    createdAT: '2026-05-18T14:20:00Z',
    rateLimit: 500,
  },
  {
    key: 'ak_demo_key_003',
    name: 'Legacy Service',
    url: 'https://legacy.example.com',
    isActive: false,
    createdAT: '2026-04-02T08:15:00Z',
    rateLimit: 100,
  },
];

export const placeholderDashboardStats = {
  totalKeys: 3,
  totalRequestsToday: 12847,
  blockedRequestsToday: 142,
  avgResponseTime: 124,
};

export const placeholderAnalyticsStats = {
  totalRequests: 45230,
  blocked: 892,
  successRate: 98.0,
  avgResponseTime: 118,
};

export const placeholderChartData = [
  { time: '00:00', requests: 320 },
  { time: '04:00', requests: 180 },
  { time: '08:00', requests: 1240 },
  { time: '10:00', requests: 2100 },
  { time: '12:00', requests: 1850 },
  { time: '14:00', requests: 2340 },
  { time: '16:00', requests: 1980 },
  { time: '18:00', requests: 1560 },
  { time: '20:00', requests: 920 },
  { time: '22:00', requests: 540 },
];

export const placeholderLogs = [
  { id: '1', route: '/api/users', method: 'GET', status: 200, responseTime: 45, isBlocked: false, createdAt: '2026-06-08T14:32:10Z' },
  { id: '2', route: '/api/orders', method: 'POST', status: 200, responseTime: 128, isBlocked: false, createdAt: '2026-06-08T14:31:55Z' },
  { id: '3', route: '/api/products/42', method: 'DELETE', status: 200, responseTime: 67, isBlocked: false, createdAt: '2026-06-08T14:31:40Z' },
  { id: '4', route: '/api/search', method: 'GET', status: 429, responseTime: 12, isBlocked: true, createdAt: '2026-06-08T14:31:22Z' },
  { id: '5', route: '/api/webhook', method: 'POST', status: 500, responseTime: 2340, isBlocked: false, createdAt: '2026-06-08T14:30:58Z' },
  { id: '6', route: '/api/health', method: 'GET', status: 200, responseTime: 8, isBlocked: false, createdAt: '2026-06-08T14:30:30Z' },
  { id: '7', route: '/api/auth/refresh', method: 'POST', status: 200, responseTime: 95, isBlocked: false, createdAt: '2026-06-08T14:29:15Z' },
  { id: '8', route: '/api/data/export', method: 'GET', status: 429, responseTime: 5, isBlocked: true, createdAt: '2026-06-08T14:28:42Z' },
];

export const placeholderKeyDetail = {
  name: 'Production API',
  url: 'https://api.example.com/v1',
  isActive: true,
  createdAt: '2026-05-12T10:30:00Z',
  rateLimit: 1000,
  used: 742,
  remaining: 258,
  resetsIn: '42 min',
  requests: {
    total: 12847,
    blocked: 142,
    avgResponseTime: 124,
    recentLogs: placeholderLogs.slice(0, 5),
  },
};
