# GateX — Self-Hosted API Gateway

A production-grade API Gateway platform built from scratch. Developers register their backend services, get an API key, and all traffic flows through GateX — which handles authentication, rate limiting, request forwarding, async logging, and real-time analytics automatically.

Inspired by [Kong](https://konghq.com) and [AWS API Gateway](https://aws.amazon.com/api-gateway/).

![Node.js](https://img.shields.io/badge/Node.js-18+-green?style=flat-square)
![Express](https://img.shields.io/badge/Express-5-black?style=flat-square)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Neon-blue?style=flat-square)
![Redis](https://img.shields.io/badge/Redis-Cloud-red?style=flat-square)
![License](https://img.shields.io/badge/license-MIT-green?style=flat-square)

---

## What it does

A developer registers their backend URL on GateX and gets an API key. Instead of calling their server directly, their clients call GateX with the API key in the header. GateX validates the key, enforces rate limits, forwards the request, logs it asynchronously, and returns the response — all in milliseconds.

```
Client App
    ↓
GateX (auth → rate limit → forward → log)
    ↓
Developer's Backend Server
    ↓
Response back to Client
```

---

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                        GateX                            │
│                                                         │
│  ┌──────────┐    ┌──────────┐    ┌──────────────────┐  │
│  │  Auth    │    │  Rate    │    │  Reverse Proxy   │  │
│  │Middleware│───▶│ Limiter  │───▶│  (http-proxy-    │  │
│  │          │    │  Redis   │    │   middleware)    │  │
│  │ API Key  │    │ Sliding  │    │                  │  │
│  │  Check   │    │ Window   │    │  Forwards to     │  │
│  └──────────┘    └──────────┘    │  Target URL      │  │
│       │                │         └──────────────────┘  │
│       ▼                ▼                  │             │
│  ┌─────────────────────────────────────┐  │             │
│  │           Redis Queue               │◀─┘             │
│  │     (async log buffer)              │                │
│  └─────────────────────────────────────┘                │
│                    │                                    │
│                    ▼ (every 10 seconds)                 │
│  ┌─────────────────────────────────────┐                │
│  │         Log Worker                  │                │
│  │    Bulk insert to PostgreSQL        │                │
│  └─────────────────────────────────────┘                │
└─────────────────────────────────────────────────────────┘
         │                          │
         ▼                          ▼
   ┌──────────┐              ┌──────────────┐
   │  Neon DB │              │ Redis Cloud  │
   │(PostgreSQL)             │ Rate Limits  │
   │  Logs    │              │ API Key Cache│
   │  Keys    │              └──────────────┘
   └──────────┘
```

---

## Tech Stack

| Layer | Technology | Purpose |
|---|---|---|
| Runtime | Node.js 18+ | Server runtime |
| Framework | Express 5 | HTTP server |
| Database | PostgreSQL (Neon) | Persistent storage |
| ORM | Drizzle ORM | Type-safe DB queries |
| Cache | Redis (Redis Cloud) | Rate limiting + key caching |
| Redis Client | ioredis | Redis connection |
| Proxy | http-proxy-middleware | Request forwarding |
| Auth | JWT + cookies | Developer authentication |
| Frontend | React + Tailwind CSS | Analytics dashboard |
| Charts | Recharts | Request volume graphs |

---

## Key Features

### Authentication
- Developer signup and login with JWT stored in HTTP-only cookies
- API key generation using `crypto.randomBytes(32)`
- Keys cached in Redis for sub-millisecond validation on every request

### Rate Limiting — Sliding Window Algorithm
Uses Redis sorted sets to implement a true sliding window (not fixed window). Avoids the boundary exploit where a client can double their effective rate limit by sending requests at minute boundaries.

```
Every request:
  1. Remove entries older than 60 seconds from sorted set
  2. Count remaining entries
  3. If count >= limit → 429 Too Many Requests
  4. If count < limit → add entry, allow request
```

### Request Forwarding
Reverse proxy using `http-proxy-middleware`. Dynamic target URL resolved per request from Redis cache. Supports all HTTP methods and passes headers through transparently.

### Async Logging Pipeline
Direct PostgreSQL writes on every request would add 20-50ms latency. Instead:

```
Request completes
      ↓
Push log to Redis list (< 1ms)
      ↓
Background worker runs every 10s
      ↓
Bulk insert all queued logs to PostgreSQL
```

Result: zero logging overhead on request latency.

### Analytics Dashboard
- Total requests, blocked requests, success rate, avg response time
- Per API key analytics and recent request logs
- Built with React, Recharts, and Tailwind CSS

---

## Project Structure

```
apigateway/
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   ├── env.js          # dotenv loader (must import first)
│   │   │   └── redis.js        # ioredis connection
│   │   ├── db/
│   │   │   ├── index.js        # Drizzle + pg pool setup
│   │   │   └── schema.js       # Table definitions
│   │   ├── middleware/
│   │   │   ├── auth.middleware.js      # JWT verification
│   │   │   ├── proxy.middleware.js     # API key validation + Redis cache
│   │   │   ├── ratelimit.middleware.js # Sliding window rate limiter
│   │   │   └── forward.middleware.js   # Reverse proxy
│   │   ├── controllers/
│   │   │   ├── auth.controller.js
│   │   │   ├── apikey.controller.js
│   │   │   └── analytics.controller.js
│   │   ├── routes/
│   │   │   ├── auth.routes.js
│   │   │   ├── api.routes.js
│   │   │   └── analytics.route.js
│   │   ├── workers/
│   │   │   └── logWorker.js    # Background log processor
│   │   └── app.js
│   └── package.json
└── frontend/
    ├── src/
    │   ├── components/
    │   ├── pages/
    │   ├── api/
    │   └── utils/
    └── package.json
```

---

## API Reference

### Auth

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/auth/signup` | Register a new developer account |
| POST | `/api/auth/login` | Login and receive JWT cookie |
| POST | `/api/auth/logout` | Clear session |

### API Keys

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/keys` | Get all keys for logged in developer |
| POST | `/api/keys/generate` | Generate a new API key |
| DELETE | `/api/keys/:apikey` | Delete a key |
| PATCH | `/api/keys/:apikey/toggle` | Toggle active/inactive |

### Gateway

| Method | Endpoint | Description |
|---|---|---|
| ANY | `/api/proxy/*` | Forward request to registered backend |

**Required header:**
```
x-api-key: ak_your_api_key_here
```

### Analytics

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/analytics/user` | Analytics across all keys |
| GET | `/api/analytics/overview/:apikey` | Analytics for a specific key |

---

## Getting Started

### Prerequisites
- Node.js 18+
- A [Neon DB](https://neon.tech) account (free)
- A [Redis Cloud](https://redis.io/cloud) account (free)

### Setup

```bash
# Clone the repo
git clone https://github.com/tusharsoni3/apigateway.git
cd apigateway

# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

### Environment Variables

Create `backend/.env`:

```env
PORT=3000
DATABASE_URL=postgresql://user:password@host/dbname
REDIS_URL=redis://default:password@host:port
JWT_SECRET=your_jwt_secret_here
```

### Run Database Migrations

```bash
cd backend
npx drizzle-kit push
```

### Start Development

```bash
# Terminal 1 — Backend
cd backend
npm run dev

# Terminal 2 — Frontend
cd frontend
npm run dev
```

Backend runs on `http://localhost:3000`
Frontend runs on `http://localhost:5173`

---

## How to Use

1. Sign up at `http://localhost:5173`
2. Click **Generate New Key** and enter your backend URL
3. Copy the API key shown (only shown once)
4. In your app, replace direct backend calls:

```javascript
// Before
fetch("http://your-backend.com/api/users")

// After
fetch("http://localhost:3000/api/proxy/api/users", {
  headers: { "x-api-key": "ak_your_key_here" }
})
```

5. View traffic analytics on the dashboard

---

## Technical Decisions

**Why Redis sorted sets for rate limiting?**
Fixed window counters have a known exploit — clients can send 2x the rate limit by timing requests at window boundaries. Sorted sets allow true sliding window by storing individual request timestamps and querying only the last 60 seconds.

**Why async logging via Redis queue?**
Synchronous PostgreSQL writes on every request add 20-50ms overhead. At 1000 req/s that becomes a serious bottleneck. A Redis list as a queue decouples logging from request handling — the worker bulk-inserts every 10 seconds with near-zero impact on latency.

**Why cache API keys in Redis?**
Every proxied request needs to validate the API key. Hitting PostgreSQL every time would add a DB round-trip to each request. Redis keeps frequently used keys in memory for sub-millisecond lookups with a 1-hour TTL.

---

## License

MIT
