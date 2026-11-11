# docs.hivedeploy.in v2 redesign: hand-over report

Nextra 3.3.1 on the Next 14 pages router, restyled dark-only to match www.hivedeploy.in. The MDX corpus is untouched (a SHA-256 manifest of the base commit is checked in `tests/mdx-untouched.test.ts`).

## Test counts (final run, feat/docs-v2)

| check | result |
|---|---|
| `pnpm test` (vitest) | 16 files, 85 tests passed |
| `pnpm typecheck` | clean |
| `pnpm lint` | 0 errors, warnings only (`import/no-anonymous-default-export` on the `_meta.ts` files) |
| `pnpm e2e` (Playwright, production server on :3320) | 250 passed, 108 skipped (phone-project skips for tests that set their own viewport, linked-worktree timestamp skips, viewport-specific skips) |

## Lighthouse (details in `docs/PERF.md`)

Desktop medians, three runs each: `/` perf 100 / a11y 98 / CLS 0; `/connect-clouds/aws` 100 / 100 / 0; `/changelog` 100 / 100 / 0. Budgets (perf >= 90, a11y >= 95, CLS < 0.1) all met with no fix needed. Mobile medians (information): perf 97 on all three, a11y 98 / 100 / 100, CLS 0.

## Eye check

Full-page screenshots at 1440 and 390 of the six pages, the open palette and the open phone drawer are in `test-results/eye/` (gitignored). Compared by eye with DC00, DC1, DC3, DC4, PD01, PD02 (DC2 is not the target). Full-page captures of long pages are downscaled when viewed, so fine detail (hairlines, 1 px offsets) was judged from the e2e measurements, not from these views. One line per visible difference:

- Home (DC00): the board's hero title sits on one line; at 1440 the built title wraps to two lines, so the hero is taller and everything below sits lower. Section structure, labels (right-aligned on sections 1, 2, 5), cards, the lit Quickstart card, Reference/Explanation side by side, the Troubleshooting list and the three contributor columns match.
- Home: the board's numbered annotation badges, its caption strip and the colour-dots widget are board furniture, not part of the site (the colour dots also show in the board's home but not in the build).
- Article (DC1, built from `/connect-clouds/aws`): sidebar, title with Diataxis badge, Last updated, callouts, numbered steps, code blocks, tables, See also, feedback widget, pagination cards and the right-hand "On this page" rail match in structure and order. The board's annotation badges and caption strip are not built.
- Palette (DC3): 640 px glass palette over a blurred page, a key hint footer, grouped results with a highlighted active row. Difference: the build has a 2 px amber underline under the input; the board shows none. The board query ("external ID") shows several groups; the e2e screenshot query ("gate") has one group visible in the first 5 rows, so group headings beyond "Concepts" were not compared visually.
- Changelog (DC4): the board shows a centred column with no sidebar and no "On this page" rail, and a note "the newest six of 16 entries; the rest follow in the same form". The build shows all 16 entries inside the standard docs shell (sidebar, right rail, feedback widget, Previous/Next). Date column, dot, mono labels (Added/Changed/Fixed) and entry rhythm match.
- Phone article (PD01): header with mark, Docs tag, search, Get started and menu; "On this page" collapsed list above the article; single column; code blocks and tables scroll inside themselves. Matches; Sign in is absent, as drawn.
- Phone drawer (PD02): left panel at about 86 % width with a dimmed strip of the article at the right, search field first, then Welcome, Quickstart (active) and the grouped sections. Differences: the panel starts under the header and the header's menu button turns into the close control, where the board draws the close button inside the panel's own header row (departure T12); the active page's own headings (What you'll build ... Cleaning up) are listed under Quickstart in the build, the board does not show them; the board has no header search/Get started beside the panel, the build keeps them in the header.

## Departures from the canvas

- **API reference.** The page is the Scalar widget restyled through its CSS variables. DC2's drawn endpoint layout was not built (Task 11).
- **Phone drawer.** It starts under the header, and the header's menu button is the close control (Task 12). Nextra's menu is a top sheet; it is styled as PD02's left panel as far as CSS reaches.
- **No slide on the drawer** (D12): it appears and disappears without animation.
- **Home section labels.** The labels on sections 1, 2 and 5 were restored to the board (right-aligned on the heading row) after a detour that had put them under the heading (Task 10). Reference and Explanation keep their labels under the headings, as the board shows.
- **One level-1 heading on the API page.** The page keeps two `h1` tags but has one level-1 heading in the accessibility tree (D21). The one-h1 test excludes it from the tag count and asserts the AX tree instead.
- **Sign in is not shown on phones**, as drawn (shown from 768 up).
- **Axe exclusions** (`tests/e2e/a11y.spec.ts`), every one:
  - `footer .wordmark`: the large outlined "HIVEDEPLOY" drawn as decoration (aria-hidden, nothing focusable).
  - `.scalar-app` on the API reference page: third-party widget. Run inside it separately, axe found 0 WCAG violations and 2 incomplete items (`aria-valid-attr-value`, `th-has-data-cells`).
  - Axe runs use the tags wcag2a, wcag2aa, wcag21a, wcag21aa, wcag22aa. Best-practice rules are not in the gate; one is known: `aws.mdx` has a table with an empty `<th>` (`empty-table-header`, not WCAG).

## Owner calls

- The home is titled "AI Orchestrator — Documentation" and its last three sections read like a contributor README. Kept word for word.
- "Hivedeploy" in the MDX and in page titles; "HiveDeploy" in the chrome and on www.
- The API reference is empty in production: the served `openapi.json` is a placeholder because the build cannot reach `backend.hivedeploy.in/openapi.json`.
- Changelog RSS item links point at `#YYYY-MM-DD`; no heading has that id.
- `llms.txt` ignores the sidebar order (its script looks for `_meta.json`; the repo has `_meta.ts`).
- Two feedback mechanisms on every page: the "Was this page helpful?" widget and the GitHub issue link.
- The Quickstart sends readers to `app.hivedeploy.in/signup` while www offers only the private-beta waitlist.
- Sign in opens `app.hivedeploy.in/login`; www's own Sign in still points at its waitlist.
- The GitHub icon is gone from the header (the canvas has none); "Edit this page" still links the repo.
- The light theme and the theme switch are removed. A reader who chose light now gets dark.
- The css-drift check and its weekly workflow are deleted; the repo secret `FRONTEND_REPO_READ_TOKEN` can be removed.
- `pr-checks.yml` builds on Node 20 while `package.json` pins Node 24; it does not run `pnpm e2e`. Left as it is.
- The docs palette takes ⌘K on the API reference page; Scalar's own search still opens from its field.

### Added by the controller

- The RSS script skips the 3 "→" range headings, so it produces 13 items for 16 entries (D5).
- "Last updated" needs full git history. A shallow clone shows nothing, or the clone date.
- The docs' first-load shared JS is about 955 kB (Nextra + Scalar); `next build` printed 960 kB on this run. It was about 951 kB before the redesign. FlexSearch loads only on first open.
- A ⌘K pressed before hydration is dropped. This was accepted in Task 12.
- Two broken links inside MDX, left unedited: `gcp-project-setup.mdx:201` → `/connect-clouds/gcp#enable-apis` (no such id), and `reading-audit-logs.mdx:129,225` → `/cloud-403` (should be `/troubleshooting/cloud-403`).
- `aws.mdx` has a table with an empty `<th>` (axe best-practice `empty-table-header`, not WCAG).
- Inside the Scalar widget, axe found 0 WCAG violations and 2 incomplete items (`aria-valid-attr-value`, `th-has-data-cells`).
- Commit c02e560 fails typecheck on its own; 82e3edd fixes it.
