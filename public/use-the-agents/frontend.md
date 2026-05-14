
import { Callout } from '../../components/Callout'

> The frontend agent owns the full deploy lifecycle of web frontends: static site generation, SPA hosting on S3 + CloudFront, SSR on ECS Fargate, Dockerfile generation, cache policies, and CloudFront invalidations — across Next.js, React, Angular, Vue/Nuxt, SvelteKit, and common static site generators.

## What it deploys

| Framework / mode | Infra target | Notes |
|---|---|---|
| **Next.js SSR** | Fargate + ALB + CloudFront | Requires `output: 'standalone'` in `next.config.js` |
| **Next.js static export** | S3 + CloudFront | `output: 'export'` mode; no server needed |
| **React SPA (Vite / CRA / Parcel)** | S3 + CloudFront | SPA fallback: 404/403 → `/index.html` |
| **Angular CSR** | S3 + CloudFront | Uploads `dist/<app>/browser/` (not the parent `dist/`) |
| **Angular Universal SSR** | Fargate + ALB + CloudFront | Needs `@angular/ssr` + Express adapter |
| **Nuxt 3 SSR** | Fargate + ALB + CloudFront | Nitro server, `.output/` bundle |
| **Nuxt 3 static** | S3 + CloudFront | `nuxt generate`, uploads `.output/public/` |
| **SvelteKit SSR** | Fargate + ALB + CloudFront | Requires `@sveltejs/adapter-node` |
| **SvelteKit static** | S3 + CloudFront | `@sveltejs/adapter-static` |
| **Hugo / Jekyll / Astro / Docusaurus / MkDocs / Gatsby / Eleventy** | S3 + CloudFront | Static output; CloudFront Function for clean URLs |

Static deployments include:
- S3 bucket with versioning enabled, public access blocked
- CloudFront distribution with OAC (Origin Access Control)
- CloudFront Function for URL rewriting (clean URLs, SPA fallback)
- Cache policies: `/_assets/*` or `/assets/*` immutable (1 year), `index.html` no-cache
- ACM certificate for custom domain (if provided)

> **Note:** No Docker image is needed for pure static deployments. For SSR modes (Next.js, Nuxt 3 SSR, SvelteKit SSR), the agent generates a multi-stage Dockerfile and deploys to Fargate.

## Quickstart

A minimal happy-path for a Next.js SSR app on AWS:

1. **Start the agent:** "Deploy our Next.js app to production on AWS."
2. **Gate 1 — framework detection:** Agent detects `next.config.js` and identifies SSR mode (no `output: 'export'`). Confirm.
3. **Gate 2 — name and region:** Reply `web-app` and `us-east-1`.
4. **Gate 3 — cloud target:** Pick your connected AWS account.
5. **Gate 4 — sizing:** Agent proposes 0.5 vCPU / 1 GB for the Next.js standalone server, 2 min tasks. Adjust if needed.
6. **Gate 5 — review:** Agent renders the plan (ECR repo, CodeBuild, Fargate service, ALB, CloudFront with S3 for static assets). Admin approves if enabled.
7. **Gate 6 — deploy:** `terraform apply` runs (~10 minutes). CodeBuild triggers a `next build` → Docker image push → ECS service update.

After deploy the agent outputs:
- CloudFront distribution URL (e.g. `https://d1abc123.cloudfront.net`)
- Custom domain instructions if an ACM certificate ARN was provided
- CodeBuild project name for future releases

## Configuration options

| Option | Default | Description |
|---|---|---|
| `framework` | Auto-detected | `nextjs`, `react`, `angular`, `nuxt`, `svelte`, `hugo`, `jekyll`, `astro`, `gatsby`, `docusaurus` |
| `mode` | Auto-detected | `ssr` or `static` |
| `node_version` | `20` | Node.js version in generated Dockerfile |
| `custom_domain` | `""` | Apex or subdomain for the CloudFront distribution |
| `acm_certificate_arn` | `""` | ACM certificate ARN (must be in `us-east-1` for CloudFront) |
| `cpu` | `512` (0.5 vCPU) | Fargate task CPU (SSR only) |
| `memory` | `1024` (1 GB) | Fargate task memory (SSR only) |

### Framework-specific gotchas

| Framework | Critical requirement |
|---|---|
| Next.js SSR | Must set `output: 'standalone'` in `next.config.js`. Without it, Docker image is ~1 GB and deps may not resolve. Start command is `node server.js` (not `next start`). |
| Angular | Upload `dist/<app>/browser/`, not the parent `dist/<app>/`. Check `angular.json → outputPath` — Angular CLI 17+ adds the nested `browser/` folder. |
| Nuxt 3 static | Upload `.output/public/` (not `.output/`). |
| SvelteKit SSR | Must configure `@sveltejs/adapter-node` in `svelte.config.js`. After build, run `npm prune --production` before copying to the Docker runner stage. |

## Common patterns

### Deploying a React SPA

Tell the agent: "Deploy our Vite + React app to S3 and CloudFront."

The agent detects `vite.config.ts`, runs `vite build`, uploads `dist/` to S3, and configures CloudFront with:
- SPA fallback: 404 and 403 error responses → `/index.html` (HTTP 200). This lets React Router handle unknown paths.
- Cache policy: `dist/assets/*` immutable (1 year), `dist/index.html` no-cache.

### Deploying a static site generator

Tell the agent: "Deploy our Docusaurus docs site."

The agent detects `docusaurus.config.js`, runs `docusaurus build`, uploads `build/` to S3, and adds a CloudFront Function for clean-URL rewriting (`/foo` → `/foo/index.html`). No SPA fallback is needed — Docusaurus emits real HTML per path.

### Custom domain + HTTPS

Tell the agent: "Add the custom domain `app.example.com` to our CloudFront distribution."

The agent:
1. Requests the ACM certificate ARN (must already exist in `us-east-1`)
2. Updates the CloudFront distribution's `aliases` and `viewer_certificate`
3. Outputs the CloudFront domain name for you to CNAME in your DNS

### Triggering a new release

Tell the agent: "Deploy the latest `main` branch to production."

The agent triggers CodeBuild with the new branch, waits for the image push (SSR) or asset upload (static), then invalidates the CloudFront cache (`/*`).

### Rolling back

Tell the agent: "Roll back the frontend to the previous release."

For static sites: the agent restores the previous S3 object version and invalidates CloudFront. For SSR: the agent updates the ECS service to the previous image tag.

## Operational tasks

The agent monitors and handles:

| Signal | Action |
|---|---|
| CloudFront 5xx rate spike | Checks Fargate task health (SSR) or S3 object availability (static); proposes fix |
| Fargate P95 response > 1s | Checks for memory pressure; proposes task size increase |
| CloudFront cache hit ratio < 50% | Reviews cache policy configuration; suggests Cache-Control header fixes |
| Build failure in CodeBuild | Surfaces last 100 lines of build logs; identifies missing `next.config.js` settings or broken dependencies |

## Troubleshooting

| Symptom | Likely cause | Fix |
|---|---|---|
| Blank page on SPA deploy | SPA fallback not configured on CloudFront | Add 404/403 → `/index.html` error response; agent can patch the distribution |
| 403 from CloudFront on unknown paths | Missing CloudFront Function for clean URLs (static generators) | Agent adds the URL-rewriting Function |
| Next.js image is 1+ GB | `output: 'standalone'` not set in `next.config.js` | Add `output: 'standalone'`; rebuild |
| Next.js pod crashes at start | Using `next start` instead of `node server.js` in standalone mode | Fix the Docker `CMD`; agent regenerates the Dockerfile |
| Angular deploy shows old version | Uploaded `dist/<app>/` instead of `dist/<app>/browser/` | Re-run deploy; agent targets the correct `browser/` subdirectory |
| CloudFront still serves stale content after deploy | Cache not invalidated | Tell the agent "invalidate CloudFront cache"; it runs `create_invalidation` with `/*` |
| ACM certificate validation pending | CNAME record not added to DNS | Add the validation CNAME from the ACM console to your DNS provider |
| `NEXT_TELEMETRY_DISABLED` not set | Telemetry calls slow CI builds | Agent sets `NEXT_TELEMETRY_DISABLED=1` in both builder and runner stages |

## See also

- [Concepts: Agents](/concepts/agents)
- [Concepts: Gates](/concepts/gates)
- [Reference: Agents list](/reference/agents-list)
