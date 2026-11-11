# Performance budget (Task 14)

Measured 2026-11-12 on feat/docs-v2 (HEAD 82e3edd plus the Task 14 edits), production build (`next build`, Next 14.2.5) with `OPENAPI_SOURCE_URL` pointing at `public/openapi.example.json`, served with `next start -p 3320`. Local machine, headless Chrome, Lighthouse 13.6.0 (`npx --yes lighthouse@13.6.0`), categories performance and accessibility. Three runs per page, median recorded. Raw JSON: `test-results/lighthouse/{home,aws,changelog}-{1,2,3}.json` (desktop) and `...-mobile-{1,2,3}.json` (gitignored).

Budgets on each page's desktop median: performance >= 90, accessibility >= 95, CLS < 0.1. **All met on all three pages; nothing needed fixing.**

## Desktop (`--preset=desktop`)

Columns: perf, a11y, CLS, LCP, TBT, FCP.

### `/`

| run | perf | a11y | CLS | LCP | TBT | FCP |
|---|---|---|---|---|---|---|
| 1 | 100 | 98 | 0 | 252 ms | 15 ms | 252 ms |
| 2 | 100 | 98 | 0 | 203 ms | 9 ms | 203 ms |
| 3 | 100 | 98 | 0 | 209 ms | 9 ms | 209 ms |
| **median** | **100** | **98** | **0** | 209 ms | 9 ms | 209 ms |

### `/connect-clouds/aws`

| run | perf | a11y | CLS | LCP | TBT | FCP |
|---|---|---|---|---|---|---|
| 1 | 100 | 100 | 0 | 170 ms | 11 ms | 170 ms |
| 2 | 100 | 100 | 0 | 163 ms | 37 ms | 163 ms |
| 3 | 100 | 100 | 0 | 163 ms | 10 ms | 163 ms |
| **median** | **100** | **100** | **0** | 163 ms | 11 ms | 163 ms |

### `/changelog`

| run | perf | a11y | CLS | LCP | TBT | FCP |
|---|---|---|---|---|---|---|
| 1 | 100 | 100 | 0 | 162 ms | 8 ms | 162 ms |
| 2 | 100 | 100 | 0 | 162 ms | 8 ms | 162 ms |
| 3 | 100 | 100 | 0 | 168 ms | 8 ms | 168 ms |
| **median** | **100** | **100** | **0** | 162 ms | 8 ms | 162 ms |

## Mobile (default preset, for information)

| page | runs (perf) | perf | a11y | CLS | LCP | TBT |
|---|---|---|---|---|---|---|
| `/` | 97, 95, 97 | 97 | 98 | 0 | 778 ms | 184 ms |
| `/connect-clouds/aws` | 96, 97, 98 | 97 | 100 | 0 | 605 ms | 184 ms |
| `/changelog` | 97, 97, 97 | 97 | 100 | 0 | 635 ms | 182 ms |

Mobile runs per page (perf / a11y / CLS / LCP ms / TBT ms): home 97/98/0/776/184, 95/98/0/783/249, 97/98/0/778/183; aws 96/100/0/653/245, 97/100/0/602/184, 98/100/0/605/180; changelog 97/100/0/635/182, 97/100/0/637/184, 97/100/0/602/182.

## Notes

- Home accessibility is 98, not 100; the Lighthouse audits behind it were not triaged because the budget (95) is met and axe (WCAG 2.x A/AA) is clean on all pages in `tests/e2e/a11y.spec.ts`.
- First-load JS shared by all pages, from `next build`: 960 kB (kB as Next prints it; `_app` 822 kB is Nextra plus Scalar). FlexSearch loads only on the first open of the palette. The marketing site's 150 KiB first-load budget does not apply here: Nextra and Scalar were already about 951 kB before the redesign.
- The "Last updated" line does not shift layout (CLS 0 on every run).
