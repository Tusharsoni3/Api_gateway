# GateX — Self-Hosted API Gateway

A production-grade API Gateway platform built from scratch. Developers register their backend services, get an API key, and all traffic flows through GateX — which handles authentication, rate limiting, request forwarding, async logging, and real-time analytics automatically.

Inspired by [Kong](https://konghq.com) and [AWS API Gateway](https://aws.amazon.com/api-gateway/).

![Node.js](https://img.shields.io/badge/Node.js-22-green?style=flat-square)
![Express](https://img.shields.io/badge/Express-5-black?style=flat-square)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-blue?style=flat-square)
![Redis](https://img.shields.io/badge/Redis-7-red?style=flat-square)
![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?style=flat-square&logo=docker&logoColor=white)
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

## Running it with Docker

The whole stack — frontend, backend, Postgres, and Redis — runs as four containers on one Docker network, so no local Node/Postgres/Redis install is required.

```
┌─────────────────────────── Docker network: gatex-net ───────────────────────────┐
│                                                                                    │
│   ┌────────────┐   /api/*   ┌────────────┐        ┌────────────┐  ┌────────────┐ │
│   │  frontend  │──────────▶│  backend   │──────▶│  gateX-db  │  │ gateX-redis│ │
│   │  (nginx)   │            │ (Express)  │        │ (Postgres) │  │  (Redis)   │ │
│   │  :80       │            │  :8080     │        │  :5432     │  │  :6379     │ │
│   └────────────┘            └────────────┘        └────────────┘  └────────────┘ │
└─────────────────────────────┬──────────────────────────────────────────────────┘
                               │ published ports
                     host:80 (frontend)   host:8080 (backend)
```

### Prerequisites
- [Docker](https://docs.docker.com/get-docker/) and Docker Compose (bundled with Docker Desktop)

### 1. Clone the repo

```bash
git clone https://github.com/tusharsoni3/apigateway.git
cd apigateway
```

### 2. Add `docker-compose.yml` and `nginx.conf`

Place `docker-compose.yml` at the project root, and `frontend/nginx.conf` overrides the existing one so the frontend container can reach the backend container over `/api/*` (the frontend calls relative paths, so this proxy rule is required for the two containers to talk to each other).

### 3. Set up `backend/.env`

This file is gitignored, so create it yourself in `backend/`:

```env
PORT=8080
DATABASE_URL=postgres://postgres:GATEXPASSWORD@gateX-db:5432/postgres
REDIS_URL=redis://gateX-redis:6379
JWT_SECRET=replace_with_a_long_random_secret
```

The hostnames `gateX-db` and `gateX-redis` resolve automatically on the Docker network — they don't need to be `localhost`, since Postgres and Redis are running in their own containers, not on your machine.

### 4. Build and start everything

```bash
docker compose up --build -d
```

This starts four containers: `gateX-db` (Postgres 16), `gateX-redis` (Redis 7), `backend` (Express, port 8080), and `frontend` (nginx serving the built React app, port 80).

### 5. Run database migrations

The schema still needs to be pushed to Postgres once the containers are up:

```bash
docker compose exec backend npx drizzle-kit push
```

### 6. Open the app

- Frontend / dashboard: **http://localhost**
- Backend API directly: **http://localhost:8080**

### Useful Docker commands

| Command | Purpose |
|---|---|
| `docker compose up --build -d` | Build and start all containers in the background |
| `docker compose logs -f backend` | Tail backend logs |
| `docker compose exec backend npx drizzle-kit studio` | Open Drizzle Studio against the containerized DB |
| `docker compose down` | Stop and remove containers |
| `docker compose down -v` | Also wipe the Postgres data volume |
| `docker compose restart backend` | Restart just the backend after a code change |

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
   │ gateX-db │              │ gateX-redis  │
   │(PostgreSQL)             │  Rate Limits │
   │  Logs    │              │ API Key Cache│
   │  Keys    │              └──────────────┘
   └──────────┘
```

---

## Tech Stack

| Layer | Technology | Purpose |
|---|---|---|
| Runtime | Node.js 22 (Alpine) | Server runtime, containerized |
| Framework | Express 5 | HTTP server |
| Database | PostgreSQL 16 | Persistent storage, containerized |
| ORM | Drizzle ORM | Type-safe DB queries |
| Cache | Redis 7 | Rate limiting + key caching, containerized |
| Redis Client | ioredis | Redis connection |
| Proxy | http-proxy-middleware | Request forwarding |
| Auth | JWT + cookies | Developer authentication |
| Frontend | React + Tailwind CSS, built and served via nginx | Analytics dashboard |
| Charts | Recharts | Request volume graphs |
| Orchestration | Docker Compose | Runs frontend, backend, DB, and cache as one stack |

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
├── docker-compose.yml          # Wires frontend, backend, Postgres, Redis together
├── backend/
│   ├── Dockerfile
│   ├── .env                    # gitignored — create locally
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
│   │   ├── controller/
│   │   │   ├── auth.controller.js
│   │   │   ├── api.controller.js
│   │   │   └── analytics.controller.js
│   │   ├── routes/
│   │   │   ├── auth.routes.js
│   │   │   ├── api.routes.js
│   │   │   └── analytics.route.js
│   │   ├── workers/
│   │   │   └── logWorkers.js   # Background log processor
│   │   └── app.js
│   └── package.json
├── frontend/
│   ├── Dockerfile
│   ├── nginx.conf              # Serves the built app + proxies /api to backend
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── api/
│   │   └── utils/
│   └── package.json
└── fake-service/                # Local-only dummy backend for testing the proxy
    ├── index.js
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
| POST | `/api/apikey-gen` | Generate a new API key |
| GET | `/api/getAllKeys` | Get all keys for the logged-in developer |
| DELETE | `/api/deleteKey/:apikey` | Delete a key |
| POST | `/api/changeActiveStatus/:apikey` | Toggle a key active/inactive |

### Gateway

| Method | Endpoint | Description |
|---|---|---|
| ANY | `/api/proxy/*` | Forward request to the registered backend |

**Required header:**
```
api-key: ak_your_api_key_here
```

### Analytics

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/analytics/user` | Analytics across all keys |
| GET | `/api/analytics/overview/:apikey` | Analytics for a specific key |

---

## How to Use

1. Sign up at `http://localhost`
2. Click **Generate New Key** and enter your backend URL (e.g. the fake-service below, or your own server)
3. Copy the API key shown (only shown once)
4. In your app, replace direct backend calls:

```javascript
// Before
fetch("http://your-backend.com/api/users")

// After
fetch("http://localhost:8080/api/proxy/api/users", {
  headers: { "api-key": "ak_your_key_here" }
})
```

5. View traffic analytics on the dashboard

### Testing locally with the fake service

`fake-service/` is a minimal Express app for testing the proxy without a real backend. It's not containerized — run it directly on your host:

```bash
cd fake-service
npm install
npm run dev   # listens on http://localhost:4000
```

Register `http://localhost:4000` as a key's target URL. Since your host isn't reachable at `localhost` from inside the backend container, use `http://host.docker.internal:4000` instead on Docker Desktop (Mac/Windows). On Linux, add `extra_hosts: ["host.docker.internal:host-gateway"]` to the `backend` service in `docker-compose.yml`, or point the key at the `gateX-net` container IP directly.

---

## Local Development (without Docker)

If you'd rather run things directly on your machine:

### Prerequisites
- Node.js 18+
- A local or hosted PostgreSQL instance
- A local or hosted Redis instance

### Setup

```bash
cd backend && npm install
cd ../frontend && npm install
```

Point `backend/.env` at `localhost` instead of the container hostnames:

```env
PORT=3000
DATABASE_URL=postgresql://user:password@localhost:5432/dbname
REDIS_URL=redis://localhost:6379
JWT_SECRET=your_jwt_secret_here
```

```bash
# Terminal 1 — Backend
cd backend
npx drizzle-kit push
npm run dev

# Terminal 2 — Frontend
cd frontend
npm run dev
```

Backend runs on `http://localhost:3000`, frontend on `http://localhost:5173` (configure the frontend's dev proxy to point at the backend if you go this route).

---

## Technical Decisions

**Why Redis sorted sets for rate limiting?**
Fixed window counters have a known exploit — clients can send 2x the rate limit by timing requests at window boundaries. Sorted sets allow true sliding window by storing individual request timestamps and querying only the last 60 seconds.

**Why async logging via Redis queue?**
Synchronous PostgreSQL writes on every request add 20-50ms overhead. At 1000 req/s that becomes a serious bottleneck. A Redis list as a queue decouples logging from request handling — the worker bulk-inserts every 10 seconds with near-zero impact on latency.

**Why cache API keys in Redis?**
Every proxied request needs to validate the API key. Hitting PostgreSQL every time would add a DB round-trip to each request. Redis keeps frequently used keys in memory for sub-millisecond lookups with a 1-hour TTL.

**Why nginx in front of the built frontend?**
The frontend Dockerfile is a multi-stage build — Node builds the static React bundle, then nginx serves it. nginx also proxies `/api/*` to the backend container so the browser only ever talks to one origin, avoiding CORS and cookie complications between containers.

---

## Troubleshooting

- **Frontend loads but API calls fail / return the HTML page:** make sure `frontend/nginx.conf` includes the `/api/` proxy block above — without it, nginx's `try_files` fallback serves `index.html` for any unrecognized path, including API calls.
- **Backend can't reach Postgres/Redis:** confirm `backend/.env` uses the container hostnames (`gateX-db`, `gateX-redis`), not `localhost` — `localhost` inside a container refers to the container itself, not the host or sibling containers.
- **Migrations fail on first run:** the DB container needs a few seconds to initialize on first start; retry `docker compose exec backend npx drizzle-kit push` if it fails immediately after `docker compose up`.