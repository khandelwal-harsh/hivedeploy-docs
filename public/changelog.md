
Notable changes to the Hivedeploy platform. Subscribe to the [RSS feed](/changelog.xml) for updates.

---

## 2026-05-13 — GCP WIF integration

**Added**
- GCP cloud accounts now connect via [Workload Identity Federation](/concepts/security-wif) instead of service-account impersonation
- Required APIs documented in [Connect GCP](/connect-clouds/gcp) (`sts.googleapis.com`, `iamcredentials.googleapis.com`, `cloudresourcemanager.googleapis.com`)
- Org ID banner with copy button on the GCP connect form
- OIDC issuer endpoints at `/.well-known/openid-configuration` and `/.well-known/jwks.json`
- API-not-enabled detection in the probe — error message now tells you the exact `gcloud services enable` command to run

**Fixed**
- Probe error messages now include the underlying GCP response body for faster diagnosis
- `owner_id` in probe path now correctly uses the org_id (was a hardcoded literal that prevented the WIF binding from matching)

**Breaking**
- Legacy SA-impersonation flow removed (no customers were on it at flip-over time)

---

## 2026-05-12 — Public signup + access strategy

**Added**
- `SIGNUP_MODE` env var with three modes: `open`, `invite_only`, `waitlist`
- `/signup` page adapts UI based on the active mode
- `/verify-email` page for email confirmation
- `/admin/waitlist` page for admins to approve waitlisted users
- Cloudflare Turnstile captcha on signup
- Velocity-breach detection that auto-logs CRITICAL when signup floods exceed threshold

**Security**
- Pre-merge correctness gate covering 49 unit + 14 adversarial + 300 property-fuzz tests across the signup/auth/admin domains
- All velocity breaches surfaced to operator inbox for manual response (auto-flip-to-invite-only deferred to a later release)

---

## 2026-05-08 — Notifications page redesign

**Changed**
- New `/notifications` page UI: mono micro-labels for metadata, sans-serif for titles, time buckets (Today / Yesterday / Earlier this week / Earlier)
- Pill-chip filter bar with unread count badge
- Empty / error / loading state precedence
- Wrapped in shared `AppTopbar` + new `MarkAllReadButton` in the actions slot
- Conditional render of "Clear filters" CTA only when filters are actually applied (no no-op buttons)

**Fixed**
- Focus-visible ring restored on filter chips (a11y regression from the shadcn migration)
- Retry path uses a nonce to avoid leaking cancel tokens across retries
- Mono font now scoped to labels/timestamps only — titles render in the platform's body sans, matching the rest of the app

**Internal**
- Bell dropdown UI is unchanged in this release; only the dedicated `/notifications` page was redesigned

---

## 2026-04-30 — Plan picker on post-verification

**Added**
- Post-verification redirect to `/onboarding/choose-plan`
- Plans visible: Free, Starter, Pro (per [Billing](/guides/billing))
- Stripe Checkout integration for paid plans
- Free-plan detection derived from price, not SKU id (more robust to catalog renames)
- Onboarding wire payloads now strictly typed (dropped `http<any>`)
- Subscribe button is full-width on mobile

**Internal**
- Mock-Stripe harness for local-dev signup flow testing

---

## 2026-04-29 — Billing limits + overage markup

**Added**
- Per-plan credit budgets with soft limits + hard caps
- Real-time credit consumption tracking per org
- `BILLING_OVERAGE_MARKUP_DEFAULT` env var (default 1.40 multiplier)
- Stripe metered-usage reporting wired to deployment + agent-time consumption

**Operations**
- `PAYMENT_PROVIDER=none` bypass for self-hosted operators not using Stripe

---

## 2026-04-28 — Source persistence + Connection + Logs tabs

**Added**
- Connection details persisted across deployment sessions (no more re-entering the same params)
- Connection tab on deployment detail page
- Logs tab streaming live Terraform output (and historical logs after apply completes)
- Source code import for coding agents (Python, Node.js, frontend) — scope-limited to coding deployment agents, not infrastructure agents

---

## 2026-04-25 — Frontend agent: per-framework deployment

**Added**
- Per-framework specialist memory for the frontend agent — Next.js, React SPA, Vue, Angular, Astro, SvelteKit each have their own deployment template
- Cloudflare Pages, Vercel, AWS Amplify, GCP/Azure Static Sites, S3+CloudFront targets all wired

---

## 2026-04-15 — Specialist agents wave 1

**Added** specialist agents for:

- **Language backends:** Python, Java, Node.js, Go, Rust, .NET, PHP, Ruby
- **Databases:** Postgres, MySQL, MongoDB, ClickHouse
- **Caching & Search:** Redis, Elasticsearch
- **Vector & AI:** Qdrant, vLLM (beta — frontend mock only, backend specialist arriving in wave 2)
- **GitOps:** ArgoCD (beta)

Each agent owns the full lifecycle (deploy + monitor + scale + tune) rather than being a one-shot deploy bot. See [Use the agents](/use-the-agents/postgres) for per-agent how-to's.

---

## 2026-04-08 — Multi-cloud foundation

**Added**
- Cloud account abstraction supports AWS (cross-account IAM role + external ID), GCP (service-account impersonation, later replaced by WIF), and Azure (App registration + service principal)
- Provider-agnostic data model — adding a new cloud is a single adapter implementation
- Per-account connection probe + verification flow

---

## 2026-04-01 — Initial preview release

The Hivedeploy orchestrator's first preview build. Domain-expert agents, gated deployment flow, multi-cloud foundation.
