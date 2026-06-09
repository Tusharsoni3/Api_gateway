import { createProxyMiddleware } from 'http-proxy-middleware';
import { redis } from '../config/redis.js';

const LOCAL_HOSTS = new Set(['localhost', '127.0.0.1', '0.0.0.0', '::1']);

function parseTargetUrl(targetUrl) {
  const parsed = new URL(targetUrl);

  if (LOCAL_HOSTS.has(parsed.hostname) && parsed.protocol === 'https:') {
    console.warn(
      `[GateX] Target "${targetUrl}" uses https for a local host — switching to http`
    );
    parsed.protocol = 'http:';
  }

  const basePath = parsed.pathname === '/' ? '' : parsed.pathname.replace(/\/$/, '');

  return {
    target: parsed.origin,
    basePath,
    displayUrl: `${parsed.origin}${basePath}`,
  };
}

const proxy = createProxyMiddleware({
  router: (req) => {
    if (!req.targetURL) return 'http://127.0.0.1';
    return parseTargetUrl(req.targetURL).target;
  },
  changeOrigin: true,
  secure: false,
  pathRewrite: (path, req) => {
    if (!req.targetURL) return path;
    const { basePath } = parseTargetUrl(req.targetURL);
    return `${basePath}${path}`;
  },
  on: {
    proxyRes: async (proxyRes, req) => {
      await redis.rpush('log_queue', JSON.stringify({
        apiKey: req.apikey,
        route: req.path,
        method: req.method,
        status: proxyRes.statusCode,
        responseTime: Date.now() - req.startTime,
        isBlocked: false,
        createdAt: new Date(),
      }));
    },
    error: (err, req, res) => {
      const target = req.targetURL ? parseTargetUrl(req.targetURL).displayUrl : 'unknown';
      console.error(`Proxy error → ${target}:`, err.message);

      if (err.code === 'EPROTO' || err.message.includes('wrong version number')) {
        if (!res.headersSent) {
          res.status(502).json({
            message: 'Target URL protocol mismatch. Use http:// for local services, not https://.',
            success: false,
          });
        }
        return;
      }

      if (!res.headersSent) {
        res.status(502).json({
          message: 'Service unavailable',
          success: false,
        });
      }
    },
  },
});

export const forwardMiddleware = (req, res, next) => {
  if (!req.targetURL) {
    return res.status(404).json({ message: 'Target service not found' });
  }

  return proxy(req, res, next);
};
