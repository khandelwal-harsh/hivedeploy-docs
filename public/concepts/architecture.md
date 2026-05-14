
import { Callout } from '../../components/Callout'

This page is for technically-curious users who want to understand
the system before adopting it. Not required for normal use. If
you're just trying to deploy something, start with the
[Quickstart](/quickstart).

## The 30-second version

```
[ You (browser) ]
        │  HTTPS
        ▼
[ Frontend ]  ─── Next.js app at app.hivedeploy.in
        │  fetch /api/...
        ▼
[ Backend API ]  ─── FastAPI at backend.hivedeploy.in
   │       │      │       │
   │       │      │       └──► Postgres   (durable state — users, orgs, deployments, audit, billing)
   │       │      └──────────► Redis      (sessions, caching, Celery broker, credentials cache)
   │       └─────────────────► MongoDB    (specialist memory — agent knowledge files)
   │
   └──► LLM provider  (the model doing the reasoning per agent turn)
                │
   ┌────────────┘
   ▼
[ Celery Worker ]  ─── async jobs: deployments, audits, notifications, key rotation
        │
        ▼
[ Your cloud ]  ─── AWS / GCP / Azure
                    (orchestrator mints short-lived JWT → impersonates your SA
                     → runs terraform apply → resources land in YOUR account)
```

## The four state stores

### Postgres — durable transactional state

What lives here:

- `users`, `orgs`, `org_members`, `org_invites` — auth & team
- `cloud_accounts` — your cloud connection configs (no secrets;
  just the federated trust pointers)
- `deployments`, `deployment_runs` — every deployment session ever
  created
- `sessions`, `messages` — chat history per deployment
- `audit_events` — every state-changing action with full attribution
- `notifications` — feed of in-app notifications
- `plans`, `org_subscriptions`, `webhook_events` — billing

PII-aware: emails live only in `users`; everything else joins to
fetch them. No duplicated email storage.

### Redis — ephemeral high-frequency state

- Celery task broker + result backend
- Session caching for `/api/auth/me`-style hot paths
- Cloud credentials cache: short-lived federated tokens cached per
  `(org_id, cloud_account_id)` until ~55 min in (each token is 1h-lived;
  60s safety margin)
- Rate limits, sliding windows

Everything in Redis is ephemeral; we can rebuild it from Postgres if
needed.

### MongoDB — specialist memory

Each agent specialist has knowledge files — Terraform patterns, IAC
hard rules, hardening checklists, cross-references. Stored in Mongo
as JSON documents per specialist. Updated as specialists evolve;
queryable by the agent runtime when constructing prompts.

### Your cloud — runtime resources

Anything the orchestrator deploys for you lives in **your cloud
account**, not ours. Postgres instances, K8s clusters, S3 buckets —
they're all in your `hivedeploy-496013` (or whatever your project
is named).

The orchestrator's only persistent state about your deployed
resources is a reference (`google_sql_database_instance.postgres_main`
in deployment N) — not the resource itself.

## Request flow: "Deploy a Postgres"

When you type a chat message in a Postgres deployment session,
roughly this happens:

```
1. Frontend posts {session_id, message_text} to backend /api/sessions/{id}/messages
2. Backend validates: auth check, plan-limit credits check
3. Backend persists the user message in Postgres (sessions table)
4. Backend constructs the LLM prompt:
   - Postgres specialist's system prompt (multi-thousand lines)
   - Relevant memory files from MongoDB (per current gate, per cloud)
   - Session history (recent messages)
   - User's message
5. Backend calls the LLM provider
6. Streamed tokens come back; backend pipes them via SSE to frontend
7. When complete: backend persists the assistant message
8. If the assistant produced a tool call (e.g., "run gate 5 plan"):
   - Backend enqueues a Celery task
   - Celery worker picks up the task, runs terraform plan
     server-side using cached WIF creds from Redis
   - Plan output streams back to the session via SSE
9. Frontend updates UI in real time
```

Per-message latency is dominated by LLM streaming
(typically 5–20s for a substantial response).

## Per-org isolation throughout

Every backend write includes the `org_id` of the calling user.
Postgres tables have `org_id` columns; queries always filter on
`org_id`. Cross-org access requires explicit `platform_admin` role
(only used by support staff with audit trail).

Audit events record `org_id`, `actor`, `target`. If your org never
interacted with a cloud account, no audit event mentioning it will
ever exist in your audit log — clean separation.

## The agent runtime

Specialist agents aren't separate processes — they're prompt
configurations evaluated by the same LLM call. The
"specialist" abstraction is encoded as:

- A unique `agent_id` (`postgres`, `kafka`, etc.)
- A `system_prompt.py` file per specialist (~2K-10K lines)
- A `memory/` directory per specialist (cloud-specific patterns,
  hard rules, IaC templates)
- A `tools/` set the specialist can call (run plan, run apply, query
  audit, etc.)

At chat time, the backend assembles the specialist's system prompt
plus the memory relevant to the current gate, the session history,
and the user's latest message, then issues a single LLM call.

Adding a new specialist = adding a new directory in
`app/domains/agents/specialists/[agent_id]/`. No new service to
deploy; the same backend handles all 140 specialists.

## Cloud federation flow

When the orchestrator needs to act on your cloud (e.g., during Gate
6 `terraform apply`):

```text
1. Worker requests creds for (org_id, cloud_account_id)
2. Redis cache: hit (use cached token) | miss (mint new)
3. On miss:
   a. Mint a short-lived JWT signed by orchestrator's RSA key
      Claims: iss, sub, aud=<your-WIF-provider>, org_id=<you>, ...
   b. POST sts.googleapis.com/v1/token → federated access token
   c. POST iamcredentials.googleapis.com:generateAccessToken
      against your SA → your-SA-as-bearer access token
   d. Cache the resulting token in Redis (TTL = expires - 60s)
4. Worker runs `terraform apply` using the token as
   GOOGLE_APPLICATION_CREDENTIALS (via process env)
5. Resources land in your cloud
6. Token expires in ~1h; next deploy re-mints
```

See [Security model](/concepts/security-wif) for the why-and-how of this
federation.

## Deployment / hosting topology

The orchestrator's own deployment looks like:

| Service | Where | Why |
|---|---|---|
| `backend.hivedeploy.in` | Self-hosted on a VM | FastAPI + uvicorn |
| `app.hivedeploy.in` | Cloudflare / Vercel | Next.js frontend, static |
| Postgres | Self-hosted Docker / managed | Production data |
| Redis | Self-hosted Docker / managed | Cache + Celery broker |
| MongoDB | Self-hosted Docker / managed | Agent memory |
| Celery worker | Same VM as backend | Async tasks |
| Celery beat | Same VM, singleton | Scheduled jobs |

We **dogfood our own platform** for our own deployments where
possible. The agents that deploy customer Postgres also deployed our
production Postgres.

## Frontend architecture

Next.js 14 app router. Key directories:

```
frontend-ai-orchestrator/
├── app/                          ← routes (App Router)
│   ├── (authenticated)/          ← auth-required pages
│   │   ├── agents/               ← agents catalog
│   │   ├── cloud-accounts/       ← cloud connection UI
│   │   ├── deployments/          ← deployment list + detail
│   │   ├── sessions/             ← chat sessions
│   │   ├── notifications/        ← notification feed
│   │   └── settings/             ← org settings, billing
│   ├── login/                    ← public auth pages
│   ├── signup/
│   └── onboarding/choose-plan/   ← post-verification plan picker
├── features/                     ← per-domain logic
│   ├── agents/
│   ├── clouds/
│   ├── deployments/
│   ├── sessions/
│   └── ...
├── lib/                          ← shared utilities
└── components/ui/                ← shadcn-based primitives
```

Per-domain logic in `features/` uses the **Repository pattern**:
`HttpXxxRepository` for real backend, `MockXxxRepository` for
local-dev-without-backend.

State management: TanStack Query for server state, React state for
UI-only state. No global store.

## Backend architecture

FastAPI + SQLAlchemy 2 async + asyncpg + Pydantic v2. Key
directories:

```
backend-ai-orchestrator/
├── app/
│   ├── main.py                   ← FastAPI app, lifespan, middleware
│   ├── config.py                 ← pydantic-settings (env vars)
│   ├── db.py                     ← SQLAlchemy engine + base ORM
│   ├── bootstrap.py              ← service singletons (Postgres, Redis, MongoDB pools)
│   ├── domains/                  ← per-domain modules
│   │   ├── agents/specialists/   ← one directory per specialist (140+)
│   │   ├── auth/                 ← signup, login, verification
│   │   ├── audit/                ← audit_emit, audit event store
│   │   ├── billing/              ← Stripe (now: payment-provider-agnostic)
│   │   ├── clouds/               ← cloud accounts, providers, credentials
│   │   ├── deployments/          ← deployment sessions, gates, runs
│   │   ├── notifications/        ← notification feed + delivery
│   │   └── orgs/                 ← org management, members, invites
│   ├── security/
│   │   ├── auth.py               ← JWT auth (HS256) for API access
│   │   ├── encryption.py         ← envelope encryption for secrets at rest
│   │   └── oidc_issuer/          ← OIDC issuer for cloud WIF (RS256)
│   └── worker/celery_app.py      ← Celery config + beat schedule
└── tests/                        ← pytest (unit + integration + property tests)
```

**Per-domain layering** (each `app/domains/X/`):

- `entities.py` — Pydantic models (the canonical data shapes)
- `repository.py` — Protocol for data access (interface)
- `sql_repository.py` — Postgres implementation
- `in_memory_repository.py` — test implementation
- `store.py` / `service.py` — business logic above the repo
- `routes.py` — FastAPI router

Each domain is independently testable; the Protocol/repository
boundary lets tests swap in fakes.

## Async patterns

- All IO is `async def` (asyncpg, aiohttp/httpx, Redis aioredis,
  Motor for MongoDB)
- Celery tasks use `asyncio.run()` to bridge to async code; every
  task calls `reset_engine()` first (per-task asyncpg pool reset
  pattern needed because Celery is prefork)
- LLM streaming uses Server-Sent Events for frontend delivery

## See also

- [Concepts — Agents](/concepts/agents) — the agent system in user terms
- [Concepts — Gates](/concepts/gates) — the deployment flow
- [Concepts — Security](/concepts/security-wif) — the cloud federation
  trust model
- [Reference — API](/reference/api) — programmatic surface
