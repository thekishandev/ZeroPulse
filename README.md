<div align="center">

# ⚡ ZeroPulse

**The Zerops project, watching itself.**

Live architecture map · AI health advisor · Shareable snapshots

[![Built on Zerops](https://img.shields.io/badge/Built%20on-Zerops-6366f1?style=flat-square&logo=data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCI+PHBhdGggZmlsbD0id2hpdGUiIGQ9Ik0xMiAyTDIgN2wxMCA1IDEwLTVMMTIgMnpNMiAxN2wxMCA1IDEwLTVNMiAxMmwxMCA1IDEwLTUiLz48L3N2Zz4=)](https://zerops.io)
[![Next.js](https://img.shields.io/badge/Next.js-16-black?style=flat-square&logo=nextdotjs)](https://nextjs.org)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-336791?style=flat-square&logo=postgresql&logoColor=white)](https://postgresql.org)
[![Valkey](https://img.shields.io/badge/Cache-Valkey%207-DC382D?style=flat-square)](https://valkey.io)
[![MIT](https://img.shields.io/badge/License-MIT-22d39a?style=flat-square)](LICENSE)

---

*Point ZeroPulse at your Zerops project. Watch it think.*

</div>

---

## What is ZeroPulse?

ZeroPulse connects to your Zerops project via API, renders its **live service topology** as an interactive graph, caches results over the private network, and runs an **AI architecture review** of your `zerops.yaml` — turning the platform's own infrastructure model into a product feature.

Every service in ZeroPulse's own 5-service stack (`frontend`, `db`, `cache`, `worker`, `storage`) also runs on Zerops, wired the exact same way it teaches users to wire theirs.

```
Public traffic
 ├─ frontend  (Next.js SSR · httpSupport: true)
 └─ api       (Route Handlers inside Next.js)
      ↓ private network
 ├─ db        (PostgreSQL 16 · projects, snapshots, reports, shares)
 ├─ cache     (Valkey 7 · 60s TTL · rate-limit friendly)
 └─ worker    (Node.js · cron poller · writes snapshots)
 └─ storage   (Object Storage · diagram exports)
```

---

## Demo scenarios

ZeroPulse ships with three representative datasets so you can explore every feature without a live token:

| Scenario | What the advisor flags |
|---|---|
| **ZeroPulse (this app)** | Everything private where it should be — clean bill of health |
| **Risky starter** | Exposed database, missing httpSupport, failed worker — advisor goes red |
| **Lean MVP** | Three services, correctly wired — a healthy minimal stack |

---

## Features

### Live topology graph
Every Zerops service auto-rendered as a node — public services (blue, top row), private services (purple, bottom row), wired with animated private-network edges. Click any node to inspect its role, ports, memory, CPU, and status.

### AI architecture advisor
Sends the service model + a generated `zerops.yaml` to GPT-4o-mini and returns plain-English suggestions sorted by severity (`error` / `warn` / `ok`), a 0–100 health score, and a one-line summary. Falls back to a deterministic rule-based engine when no API key is set — the demo always works.

### Rate-limit-friendly cache
All Zerops API responses are cached for 60 seconds. The UI labels every request as `live`, `cached`, `demo`, or `demo-fallback` so you always know exactly what you're looking at.

### Generated `zerops.yaml` preview
ZeroPulse derives a deployment config from the live service model and renders it in the dashboard — making the platform format itself a product feature.

### Shareable read-only snapshots
Mint a public `/b/[shareId]` link that shows a frozen topology + advisor report, embeddable in a project README or shared with your team.

### Projects list
All connected Zerops projects in one place — click through to any dashboard instantly.

---

## Stack

| Layer | Technology |
|---|---|
| Frontend + API | Next.js 16 (App Router, SSR, Route Handlers) |
| UI | React 19, Tailwind v4, custom SVG topology graph (zero deps) |
| Database | PostgreSQL 16 via **Drizzle ORM** |
| Cache | Valkey 7 (in-memory TTL in dev; Valkey over private network on Zerops) |
| AI | OpenAI `gpt-4o-mini` via native `fetch` · deterministic rule fallback |
| Zerops integration | `zerops.ts` — live API call, normalizer, `demo-fallback` |
| Deployment | Zerops · `zerops.yaml` · Next.js standalone output |

---

## Pages

| Route | Description |
|---|---|
| `/` | Landing + connect form (live token or demo dataset) |
| `/projects` | All connected Zerops projects |
| `/dashboard/[projectId]` | Topology graph, node inspector, AI advisor, YAML preview, share |
| `/b/[shareId]` | Public read-only topology + advisor snapshot |

## API routes

| Endpoint | Method | Purpose |
|---|---|---|
| `/api/connect` | `POST` | Register a project (token + project ID) |
| `/api/projects` | `GET` | List all projects |
| `/api/services/[projectId]` | `GET` | Read topology (cache → live → demo fallback), persist snapshot |
| `/api/advisor/[projectId]` | `POST` / `GET` | Run or retrieve architecture advisor report |
| `/api/share` | `POST` | Mint a public share link |
| `/api/share/[shareId]` | `GET` | Retrieve public bundle (topology + report) |
| `/api/health` | `GET` | Liveness check + DB connection probe |

---

## Environment variables

| Variable | Default | Required | Purpose |
|---|---|---|---|
| `DATABASE_URL` | — | **Yes** | PostgreSQL connection string |
| `MOCK_MODE` | `true` | No | `false` enables live Zerops API calls |
| `OPENAI_API_KEY` | unset | No | Unlocks GPT-4o-mini advisor; falls back to rule engine |
| `ZEROPS_API_BASE` | `https://api.app-prg1.zerops.io` | No | Zerops REST base URL |

---

## Local development

```bash
# 1. Clone + install
git clone https://github.com/your-username/zeropulse
cd zeropulse
npm install

# 2. Configure environment
cp .env.example .env.local
# Set DATABASE_URL to a local Postgres instance

# 3. Push the schema
npx drizzle-kit push

# 4. Start dev server
npm run dev
# → http://localhost:3000
```

> **No token?** Leave `MOCK_MODE=true` (the default). All three demo scenarios load instantly — the topology graph, cache, AI advisor, and sharing all work identically on representative data.

---

## Deploying on Zerops

The `zerops.yaml` in this repo defines all five services. To deploy:

1. Create a new Zerops project at [app.zerops.io](https://app.zerops.io)
2. Add the five services: `frontend` (Node.js), `db` (PostgreSQL 16), `cache` (Valkey 7), `worker` (Node.js), `storage` (Object Storage)
3. Set these environment variables on the `frontend` service:
   ```
   MOCK_MODE=false
   OPENAI_API_KEY=sk-...      # optional
   ```
   `DATABASE_URL` is injected automatically via `${db_connectionString}`.
4. Push the repo — Zerops runs `npm ci`, `drizzle-kit push`, `npm run build`, then starts the app.

The health check on `/api/health` confirms the DB connection before Zerops routes traffic.

---

## How Zerops is meaningfully used

This is not just "deployed on Zerops." ZeroPulse uses the platform's own infrastructure concepts as product features:

- **Private network** — `db`, `cache`, `worker`, and `storage` have zero public exposure. The Zerops internal address is the only way to reach them.
- **`httpSupport: true`** — explicitly set on `frontend:3000`; Zerops's routing layer depends on this.
- **`${db_connectionString}`** — Zerops variable injection; no hardcoded credentials.
- **`drizzle-kit push`** in the build pipeline — schema is applied atomically before the app starts, not at runtime.
- **`healthCheck`** — Zerops polls `/api/health` to verify the deploy succeeded before switching traffic.
- **Multi-block `zerops.yaml`** — one file, five `setup` blocks, demonstrating deep familiarity with the format.

---

## Project structure

```
src/
├── app/
│   ├── page.tsx                  # Landing page
│   ├── layout.tsx                # Root layout (design system, backdrop)
│   ├── globals.css               # ZeroPulse design system (tokens, animations)
│   ├── projects/page.tsx         # Projects list
│   ├── dashboard/[projectId]/    # Live dashboard (SSR)
│   ├── b/[shareId]/              # Public read-only share page
│   └── api/
│       ├── connect/              # POST — register project
│       ├── projects/             # GET  — list projects
│       ├── services/[projectId]/ # GET  — fetch + cache topology
│       ├── advisor/[projectId]/  # POST/GET — AI advisor
│       ├── share/                # POST/GET — share links
│       └── health/               # GET  — liveness probe
├── components/
│   ├── Dashboard.tsx             # Full dashboard client (stats, graph, inspector, advisor)
│   ├── TopologyGraph.tsx         # Custom SVG topology (no React Flow dep)
│   ├── ServiceNode.tsx           # Individual service node
│   ├── AdvisorPanel.tsx          # Suggestions + health score
│   ├── ConnectForm.tsx           # Connect / demo scenario form
│   ├── RecentProjects.tsx        # Projects list widget
│   ├── Navbar.tsx                # Navigation
│   ├── Logo.tsx                  # Logo + StatusDot
│   ├── TopologyPreview.tsx       # Static preview for landing / share
│   └── icons.tsx                 # SVG icon set
├── db/
│   ├── index.ts                  # Drizzle + pg Pool
│   └── schema.ts                 # projects · snapshots · advisor_reports · shares
└── lib/
    ├── zerops.ts                 # Zerops API client (live, cache, demo, demo-fallback)
    ├── advisor.ts                # Rule-based + OpenAI advisor engines
    ├── cache.ts                  # In-memory TTL cache (60s)
    ├── mockData.ts               # Three representative demo scenarios
    ├── queries.ts                # Drizzle query helpers
    ├── roles.ts                  # Service role classifier (edge/app/database/cache/storage/worker)
    └── types.ts                  # Shared TypeScript types
```

---

## The honesty safeguard

ZeroPulse uses a `MOCK_MODE` flag (default `true`) to ensure the demo never breaks:

- **`MOCK_MODE=true`** — serves representative data, labels it `demo` in the UI. Every feature works identically.
- **`MOCK_MODE=false`** — calls the live Zerops REST API. If the call fails, falls back to `demo-fallback` and labels it clearly. Nothing silently breaks.

This is not hiding a broken API. It is a deliberate, documented "no token? explore first" mode — the same honest approach `ZeroPulse_Plan.md` describes.

---

## Built for

**WeMakeDevs × Zerops Hackathon 2026** — solo submission.

> *See [`SUBMISSION.md`](SUBMISSION.md) for the full judges' brief: Zerops usage explanation, architecture decisions, and AI tools disclosure.*

---

<div align="center">

Made with ⚡ on [Zerops](https://zerops.io) · [zeropsio](https://twitter.com/zeropsio) · [WeMakeDevs](https://twitter.com/WeMakeDevs)

</div>
