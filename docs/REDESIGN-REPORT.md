# docs.hivedeploy.in v2 redesign: hand-over report

Nextra 3.3.1 on the Next 14 pages router, restyled dark-only to match www.hivedeploy.in. The MDX corpus is untouched. `tests/mdx-untouched.test.ts` checks it against a SHA-256 manifest of the base commit, and it runs only as `pnpm test:redesign-guard`: **run it before merging feat/docs-v2; delete it after the merge** (see "Final fix wave").

## Test counts (final run, feat/docs-v2, after the final fix wave)

| check | result |
|---|---|
| `pnpm test` (vitest) | 15 files, 87 tests passed (the content guard is no longer in it) |
| `pnpm test:redesign-guard` | 1 file, 3 tests passed |
| `pnpm typecheck` | clean |
| `pnpm lint` | 0 errors, warnings only (`import/no-anonymous-default-export` on the `_meta.ts` files) |
| `pnpm e2e` (Playwright, production server on :3320) | 349 passed, 111 skipped, the same on five full runs in a row. The skips are phone-project runs of tests that set their own viewport, linked-worktree timestamp skips and viewport-specific skips. At Task 14 the suite was 250 passed, 108 skipped. |

## Lighthouse (details in `docs/PERF.md`)

Desktop medians, three runs each, as perf / a11y / CLS:

| page | perf | a11y | CLS |
|---|---|---|---|
| `/` | 100 | 100 | 0 |
| `/connect-clouds/aws` | 100 | 100 | 0 |
| `/changelog` | 100 | 100 | 0 |
| `/reference/api-reference` | 100 | 100 | 0.057 |

- `/` was 98 for accessibility at Task 14; the missing main landmark was the only failing audit.
- The API reference is new to the table. Its CLS predates this wave: it was 0.084 at 3a8f571. It is the page foot moving when Scalar mounts.
- Budgets (perf >= 90, a11y >= 95, CLS < 0.1) are all met.
- Mobile medians (for information): perf 97 on all three pages, a11y 100 on all three, CLS 0.

## Eye check

Viewport captures at 1440 × 900 and 390 × 844 are in `.redesign-evidence/eye/` (gitignored, outside `test-results/`, which every e2e run clears). Each page has its top plus three or four scroll stops; these are real-size viewports, not downscaled full pages. The set covers:
- the six pages, plus `/reference/env-vars`;
- the open palette and the open phone drawer;
- the API reference with the endpoint fixture served (`api-fixture-*`).

I compared them by eye with DC00, DC1, DC3, DC4, PD01 and PD02 (DC2 is not the target). One line per visible difference:

- Home (DC00): the board's hero title sits on one line; at 1440 the built title wraps to two lines, so the hero is taller and everything below sits lower. Section structure, labels (right-aligned on sections 1, 2, 5), cards, the lit Quickstart card, Reference/Explanation side by side, the Troubleshooting list and the three contributor columns match.
- Home: the board's numbered annotation badges, its caption strip and the colour-dots widget are board furniture, not part of the site (the colour dots also show in the board's home but not in the build).
- Article (DC1, built from `/connect-clouds/aws`): sidebar, title with Diataxis badge, Last updated, callouts, numbered steps, code blocks, tables, See also, feedback widget, pagination cards and the right-hand "On this page" rail match in structure and order. The board's annotation badges and caption strip are not built. Since the final fix wave the title sits 18 px under the breadcrumb (top 116 at 1440), as DC1 draws it; before, it sat 24 px lower on every article.
- API reference (not a board; DC2 is not the target): the intro, "How to try endpoints" and the Note callout keep the 720 px measure, and Scalar runs the full width below them. With a spec that has endpoints, Scalar's endpoint list and code cards stick below the 56 px header, not behind it (`api-fixture-1440-45.png`). At 390 Scalar's own menu bar sticks there (`api-fixture-390-45.png`).
- Palette (DC3): 640 px glass palette over a blurred page, a key hint footer, grouped results with a highlighted active row. Difference: the build has a 2 px amber underline under the input; the board shows none. The board query ("external ID") shows several groups. The capture uses the same query, but only the "Connect a cloud" group fits in its first five rows, so the group headings below it were not compared visually.
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

## Final fix wave (2026-11-12)

The whole-branch review came back "With fixes". This wave covers all of it: Important I1–I3 and Minors M1, M2, M4–M8 and M10–M14. M3 and M9 are owner calls, listed below. Each fix has a test that failed before it.

- **I1. A quick ⌘K after Esc no longer loses the new palette.** The dialog's `close` event arrives after `dialog.close()`, so a fast reopen used to be shut by the old event. The keyboard-only test failed 5 of 25 runs under load; the palette now ignores a `close` while it is open again. The query is now cleared in the render that closes the palette, so a quick reopen starts empty. A new test closes and reopens with no wait, eight rounds per run. The keyboard-only test and the new test each passed 25 of 25 at 5 workers, and the whole search spec passed 200 of 200 at 10 workers.
- **I2. The home and the API reference have a `<main>` landmark.** It sits one level below the article, so the default layout's `article > main` rules never reach it. The skip link lands inside it on both pages. Lighthouse accessibility is 100 on both.
- **I3. The content guard is opt-in.** `tests/mdx-untouched.test.ts` pins every MDX page and the four build scripts to 95cfb46, so in `pnpm test` (and CI) it would fail every real content edit after the merge. `vitest.config.ts` now excludes it, and `pnpm test:redesign-guard` (`vitest.redesign-guard.config.ts`) runs only it. **Run `pnpm test:redesign-guard` before merging feat/docs-v2. After the merge, delete the script, `vitest.redesign-guard.config.ts`, the test and `tests/fixtures/mdx-manifest.json`.** In a scratch copy with a one-byte MDX change, `pnpm test` passed and `pnpm test:redesign-guard` failed.
- **M1. Article titles are back at DC1's height.** The 24 px page-head padding meant for the API page matched every page.
- **M2. The word guard checks every page.** `tests/e2e/words.spec.ts` runs on all 39 pages, which the sitemap lists exactly, at both widths. Without the chrome, each page's words must equal the MDX source as multisets: nothing dropped, nothing shown twice. They must also stay in order, and no source word may live only in transparent, zero-size or clipped text. In a scratch build, a duplicated card description failed the multiset check and a Maintenance item clipped to 1 px failed the painted check. The old home word test stayed green on the same build.
- **M4. The changelog tests read the MDX.** The entry count, the RSS item count (headings without a range, the script's own rule; D5), the newest date and its first kind label come from the MDX, so the next entry does not break them.
- **M5.** `theme.spec` compares request hosts with `baseURL`'s host, not `127.0.0.1:3320`.
- **M6. Scalar's sticky elements sit below the header.** `--scalar-custom-header-height` is set to the header height, so Scalar's sticky endpoint list and code cards stop below the 56 px header. Scalar 1.25.90 reads the variable into `--scalar-y-offset`. The stub spec has no endpoints, so the test hands Scalar `tests/fixtures/openapi.endpoints.json` through a route. It also passed against a build served with `OPENAPI_SOURCE_URL=file://…/tests/fixtures/openapi.endpoints.json`, used for that run only. That run made no third-party request.
- **M7. Scalar's "Open API Client" button is hidden** (`hideClientButton: true`). The page asks readers to paste a live session token, and the button went to `client.scalar.com`. Re-enabling it is an owner call, below.
- **M8.** Home cards are `next/link` again: home to a doc no longer reloads the page.
- **M10.** The phone drawer marks the open page `aria-current="page"`, as the desktop sidebar does.
- **M11.** The Documentation tab says `aria-current="true"` on doc pages, and `"page"` only on the home it links to. API reference and Changelog say `"page"` on their own page.
- **M12.** On the API reference, the prose above Scalar keeps the 720 px measure, and Scalar keeps the full width (D13).
- **M13.** A table region is a tab stop only while its table is wider than its box, and a resize re-measures it. The region role and name stay.
- **M14. Evidence moved out of `test-results/`.** The eye captures and Lighthouse JSON now live in `.redesign-evidence/`, gitignored, because every e2e run clears `test-results/`. They were regenerated for this wave.

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

### Added in the final fix wave

- **Scalar's "Open API Client" button is off** (`hideClientButton: true` in `components/ScalarReference.tsx`). It sends readers to Scalar's hosted client (`client.scalar.com`, a third-party origin). The page asks them to paste a live session JWT. To re-enable it, set `hideClientButton: false`, ideally with a warning not to paste a live token there.
- **The home's layout is positional (M3).** `styles/components.css` places the blocks of `pages/index.mdx` by their position: five h2 + link-table pairs, a `---`, then three h2 + list pairs. Adding, removing or reordering a section in `index.mdx` needs a matching CSS change. The e2e order test in `tests/e2e/home.spec.ts` catches it, but CI runs no e2e. Two other quiet cases: a step heading written `## Step 7 - …` with a hyphen, or a changelog heading with `-` instead of `—`, renders as a plain h2.
- **Safari before 15.4 has no `<dialog>` (M9).** On those browsers, ⌘K or the search button calls `showModal`, which throws, and React unmounts the page: it goes blank. Next 14 still targets Safari 12 and up. A fallback (check `typeof d.showModal === 'function'`, else set the `open` attribute) is small; it was not in this wave's scope.
- **Delete the redesign guard after the merge.** Remove `pnpm test:redesign-guard`, `vitest.redesign-guard.config.ts`, `tests/mdx-untouched.test.ts` and `tests/fixtures/mdx-manifest.json`. Until then, `pnpm test` and CI do not run them.
