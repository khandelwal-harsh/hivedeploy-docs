# hivedeploy-docs

Customer-facing documentation site for [Hivedeploy](https://hivedeploy.in).
Served at [docs.hivedeploy.in](https://docs.hivedeploy.in).

## Stack

Next.js 14 (Pages Router) · Nextra 3 · TypeScript · pnpm 9 · Node 20 · Vercel · Cloudflare DNS

## Local development

```bash
pnpm install
pnpm dev          # http://localhost:3000
```

## Scripts

| Command | Description |
|---|---|
| `pnpm dev` | Start Next.js dev server with hot reload |
| `pnpm build` | Build for production (includes prebuild + postbuild steps) |
| `pnpm start` | Serve production build locally |
| `pnpm lint` | ESLint |
| `pnpm typecheck` | TypeScript check |
| `pnpm test` | Vitest run |
| `pnpm test:watch` | Vitest watch mode |
| `pnpm css-drift` | Compare local globals.css against frontend repo |

## Adding a new page

1. Create `pages/<section>/<slug>.mdx` with frontmatter:
   ```mdx
   ---
   title: My page title
   description: One-line description (160 chars max, used for SEO)
   diataxis: how-to
   ---

   # My page title

   Body content here.
   ```
   Valid `diataxis` values: `tutorial` · `how-to` · `reference` · `explanation`. See the [Diátaxis framework](https://diataxis.fr/) for what each type means.
2. Add entry to `pages/<section>/_meta.json` to control sidebar order.
3. PR opens — Vercel posts a preview URL on the PR.

## Deploy

Auto-deployed by Vercel on push to `main`. For the one-time setup
(Vercel project, Cloudflare DNS, environment variables, GitHub secrets),
see [`docs/DEPLOY.md`](docs/DEPLOY.md).

## License

MIT
