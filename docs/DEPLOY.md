# Deploy runbook

How `docs.hivedeploy.in` is wired up. One-time setup; subsequent deploys are automatic on `git push origin main`.

## Prereqs

- Vercel account with team/project access
- Cloudflare account managing `hivedeploy.in`
- GitHub repo `khandelwal-harsh/hivedeploy-docs` exists (public)
- A Slack incoming webhook URL for feedback (channel: `#docs-feedback`)
- The backend's `/openapi.json` reachable at `https://backend.hivedeploy.in/openapi.json` (or a fallback file in the repo at `public/openapi.example.json`)

## Step 1 — Connect the repo to Vercel

1. Vercel dashboard → Add New → Project
2. Import `khandelwal-harsh/hivedeploy-docs`
3. Framework Preset: **Next.js** (auto-detected)
4. Build Command: `pnpm build` (leave default)
5. Output Directory: leave default
6. Install Command: `pnpm install --frozen-lockfile`
7. Click **Deploy**

The first deploy will fail unless you've set environment variables — that's fine; proceed to Step 2.

## Step 2 — Set environment variables in Vercel

Project Settings → Environment Variables. Add these for the **Production** and **Preview** scopes:

| Name | Value | Scope |
|---|---|---|
| `OPENAPI_SOURCE_URL` | `https://backend.hivedeploy.in/openapi.json` | Production + Preview |
| `SLACK_FEEDBACK_WEBHOOK_URL` | (paste your Slack webhook URL) | Production only |

After saving, trigger a redeploy from the Vercel dashboard (Deployments → Redeploy latest).

## Step 3 — Add the custom domain

1. Vercel project → Settings → Domains
2. Add `docs.hivedeploy.in`
3. Vercel shows the CNAME target: `cname.vercel-dns.com`

## Step 4 — Add the CNAME record in Cloudflare

1. Cloudflare → DNS for `hivedeploy.in`
2. Add record:
   - **Type:** `CNAME`
   - **Name:** `docs`
   - **Target:** `cname.vercel-dns.com`
   - **Proxy status:** **DNS only** (gray cloud) — required for Vercel SSL provisioning
3. Wait 1–2 min for DNS propagation
4. Back in Vercel, the domain should show "Valid Configuration"
5. SSL certificate is auto-provisioned by Vercel (Let's Encrypt). After issuance (1–5 min), you can flip Cloudflare proxy back **on** (orange cloud) if you want CDN caching in front of Vercel's edge.

## Step 5 — Enable Vercel Analytics

1. Vercel project → Analytics
2. Click **Enable** (free tier covers ~2,500 events/month — plenty for v1)

## Step 6 — Verify

```bash
curl -I https://docs.hivedeploy.in
# Expected: 200 OK with x-vercel-cache hit
```

Visit `https://docs.hivedeploy.in` in a browser. Walk through the post-launch smoke checklist below.

## Step 7 — Configure GitHub Actions secrets

In `github.com/khandelwal-harsh/hivedeploy-docs` → Settings → Secrets and variables → Actions:

| Secret | Value | Used by |
|---|---|---|
| `FRONTEND_REPO_READ_TOKEN` | Fine-grained PAT with read access to `khandelwal-harsh/frontend-ai-orchestrator` | `css-drift-check.yml` |

If the frontend repo is public, this secret is **not** needed — the default `GITHUB_TOKEN` works.

## Smoke checklist

After the live deploy succeeds:

- [ ] `docs.hivedeploy.in` returns 200
- [ ] All ported pages render in both dark and light mode (toggle via topbar)
- [ ] ⌘K opens search; "GCP", "Postgres", "billing", "WIF", "403" each return at least one result
- [ ] `/reference/api-reference` loads Scalar with the snapshotted spec
- [ ] Click 👍 on a page → check Slack `#docs-feedback` for the message
- [ ] Click 👎 + comment on a page → check Slack
- [ ] `/llms.txt` is reachable (visit in browser, see plain-text Anthropic-format index)
- [ ] `/llms-full.txt` is reachable (full corpus concatenation)
- [ ] `/concepts/gates.md` (per-page markdown export) is reachable
- [ ] `/sitemap.xml` lists all published pages
- [ ] `/robots.txt` allows everything except `/api/`
- [ ] `/changelog.xml` validates as RSS 2.0 (paste into an RSS validator)
- [ ] `/api/og?title=Test&section=concepts` returns a 1200×630 PNG with the Hivedeploy template
- [ ] Vercel Analytics dashboard shows at least one page view

## Rotating the Slack webhook

If you regenerate the webhook URL in Slack:

1. Vercel project → Settings → Environment Variables
2. Edit `SLACK_FEEDBACK_WEBHOOK_URL` with the new URL
3. Redeploy (Vercel dashboard → Deployments → Redeploy latest)

## Rolling back a bad deploy

Vercel keeps every deployment. To revert:

1. Vercel dashboard → Deployments
2. Find a previous good deploy
3. Click "Promote to production"
4. Instant — no rebuild needed

## Marketing site nav update

The `www.hivedeploy.in` marketing site should gain a "Docs" link in its top nav pointing to `https://docs.hivedeploy.in`. That's a separate repo change outside the scope of this runbook — track as a follow-up issue.
