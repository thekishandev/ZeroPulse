# ⚡ ZeroPulse — Submission Notes

> **WeMakeDevs × Zerops Hackathon 2026 · Solo submission**

---

## What it does

ZeroPulse is a live architecture map and AI health advisor for Zerops projects.

Point it at a Zerops project, paste a read-only API token, and it:

1. **Renders a live topology graph** — every service auto-detected as a node, color-coded public (blue) vs private (purple), wired with animated private-network edges.
2. **Runs an AI architecture review** — sends the service model + a generated `zerops.yaml` to GPT-4o-mini (falls back to a deterministic rule-based engine when no key is set), then surfaces suggestions by severity (error / warn / ok) with a 0–100 health score.
3. **Caches API responses** — a 60-second TTL cache sits in front of all Zerops API calls; the UI honestly labels whether data is `live`, `cached`, `demo`, or `demo-fallback`.
4. **Generates a `zerops.yaml` preview** — derives the deployment config from the live service model and shows it in the dashboard, making the platform format itself a product feature.
5. **Produces shareable read-only snapshots** — a `/b/[shareId]` page shows a frozen topology + advisor report, embeddable in a project README.

---

## How Zerops is used

ZeroPulse is **hosted on Zerops and talks to the Zerops API** — the same infrastructure concepts it teaches are the ones it runs on.

| Service | Role in ZeroPulse |
|---|---|
| `frontend` (Next.js) | **Public** — serves the UI, SSR dashboard, share pages. `httpSupport: true`. |
| `db` (PostgreSQL 16) | **Private** — stores projects, snapshots, advisor reports, share links. |
| `cache` (Valkey 7) | **Private** — caches Zerops API responses for 60s to stay rate-limit friendly. |
| `worker` (Node.js) | **Private** — cron poller that refreshes project snapshots and publishes updates. |
| `storage` (Object Storage) | **Private** — stores generated architecture diagram exports. |

This is the same 5-service stack that ZeroPulse diagrams for other projects, deployed on Zerops itself.

The `zerops.yaml` in this repo has multiple `setup` blocks — one per service — demonstrating that the file format is understood in depth, not just copy-pasted.

---

## Architecture decisions that are Zerops-specific

- **Private network** — `db`, `cache`, `worker`, and `storage` have no public exposure. Only `frontend` receives public traffic.
- **`httpSupport: true`** — set on the frontend's port 3000; Zerops routes HTTP traffic through this.
- **`${db_connectionString}`** — the DB connection string is injected by Zerops's variable system, not hardcoded.
- **`drizzle-kit push`** — schema is applied at build time in the Zerops build pipeline, not at startup.
- **`healthCheck`** — the frontend exposes `/api/health` which checks the DB connection; Zerops polls it to confirm the deploy succeeded.

---

## The honesty safeguard

`MOCK_MODE` defaults to `true`. In demo mode ZeroPulse serves a representative dataset (three scenarios: *ZeroPulse itself*, *Risky starter*, *Lean MVP*) instead of hitting the live API, and the UI labels the source. All product features — graph, cache, advisor, sharing — work identically on demo data. This is not hiding a broken API; it's a legitimate "no token? explore first" mode.

Set `MOCK_MODE=false` and add a read-only Zerops token to use the live integration.

---

## AI tools used

- **Claude Sonnet 4.6 (Antigravity / ZCP)** — used to scaffold initial code structure, suggest component architecture, and review the Zerops API integration approach.
- All architecture decisions, Zerops-specific wiring, and the demo/fallback strategy were designed and written manually.
- I understand and can explain every file in this codebase.

---

## Local dev

```bash
cp .env.example .env.local
# fill in DATABASE_URL
npm install
npx drizzle-kit push
npm run dev
```

## Zerops deploy

Deploy via the `zerops.yaml` in this repo. Set the following env vars in the Zerops project:

| Variable | Value |
|---|---|
| `MOCK_MODE` | `false` |
| `OPENAI_API_KEY` | your key (optional — falls back to rule engine) |

The `DATABASE_URL` is injected automatically from `${db_connectionString}`.
