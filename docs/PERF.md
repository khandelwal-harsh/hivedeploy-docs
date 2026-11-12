# Performance budget

Measured again on 2026-11-12, after the final fix wave, on feat/docs-v2 at 3c24715. The build was a production `next build` (Next 14.2.5) with `OPENAPI_SOURCE_URL` pointing at `public/openapi.example.json`, served with `next start -p 3320` on a local machine. Lighthouse 13.6.0 (`npx --yes lighthouse@13.6.0`) ran in headless Chrome with the performance and accessibility categories, three runs per page, and the median is recorded.

The raw JSON is in `.redesign-evidence/lighthouse/` (gitignored):
- desktop: `{home,aws,changelog,api-reference}-{1,2,3}.json`;
- mobile: `{home,aws,changelog}-mobile-{1,2,3}.json`.

It moved there from `test-results/`, because every `pnpm e2e` run clears that folder.

Budgets on each page's desktop median: performance >= 90, accessibility >= 95, CLS < 0.1. **All four pages meet every budget.** The API reference is new to the table this wave.

## Desktop (`--preset=desktop`)

Columns: perf, a11y, CLS, LCP, TBT, FCP.

### `/`

| run | perf | a11y | CLS | LCP | TBT | FCP |
|---|---|---|---|---|---|---|
| 1 | 100 | 100 | 0 | 213 ms | 14 ms | 213 ms |
| 2 | 100 | 100 | 0 | 203 ms | 8 ms | 203 ms |
| 3 | 100 | 100 | 0 | 203 ms | 8 ms | 203 ms |
| **median** | **100** | **100** | **0** | 203 ms | 8 ms | 203 ms |

### `/connect-clouds/aws`

| run | perf | a11y | CLS | LCP | TBT | FCP |
|---|---|---|---|---|---|---|
| 1 | 100 | 100 | 0 | 170 ms | 10 ms | 170 ms |
| 2 | 100 | 100 | 0 | 169 ms | 8 ms | 169 ms |
| 3 | 100 | 100 | 0 | 162 ms | 8 ms | 162 ms |
| **median** | **100** | **100** | **0** | 169 ms | 8 ms | 169 ms |

### `/changelog`

| run | perf | a11y | CLS | LCP | TBT | FCP |
|---|---|---|---|---|---|---|
| 1 | 100 | 100 | 0 | 162 ms | 8 ms | 162 ms |
| 2 | 100 | 100 | 0 | 162 ms | 8 ms | 162 ms |
| 3 | 100 | 100 | 0 | 162 ms | 7 ms | 162 ms |
| **median** | **100** | **100** | **0** | 162 ms | 8 ms | 162 ms |

### `/reference/api-reference`

| run | perf | a11y | CLS | LCP | TBT | FCP |
|---|---|---|---|---|---|---|
| 1 | 100 | 100 | 0.057 | 162 ms | 8 ms | 162 ms |
| 2 | 100 | 100 | 0.057 | 162 ms | 8 ms | 162 ms |
| 3 | 100 | 100 | 0.057 | 167 ms | 8 ms | 167 ms |
| **median** | **100** | **100** | **0.057** | 162 ms | 8 ms | 162 ms |

## Mobile (default preset, for information)

| page | runs (perf) | perf | a11y | CLS | LCP | TBT |
|---|---|---|---|---|---|---|
| `/` | 97, 97, 97 | 97 | 100 | 0 | 778 ms | 181 ms |
| `/connect-clouds/aws` | 97, 97, 97 | 97 | 100 | 0 | 642 ms | 182 ms |
| `/changelog` | 97, 97, 97 | 97 | 100 | 0 | 635 ms | 182 ms |

Each mobile run, as perf / a11y / CLS / LCP ms / TBT ms:
- home: 97/100/0/779/181, 97/100/0/777/181, 97/100/0/778/183.
- aws: 97/100/0/646/182, 97/100/0/642/183, 97/100/0/641/182.
- changelog: 97/100/0/634/181, 97/100/0/639/182, 97/100/0/635/182.

## Changes since Task 14

- **Home accessibility is now 100; it was 98.** The one failing audit was `landmark-one-main`: the full-layout home had no `<main>`. The home and the API reference now have one, one level below the article. Mobile home went from 98 to 100 too.
- **The API reference scores 100 / 100.** A HEAD build at 3a8f571, measured the same way, gave perf 98, a11y 99 (`landmark-one-main`) and CLS 0.084. Its CLS of 0.057 is one shift: the page foot (feedback and previous/next) moves down when Scalar mounts into its container, which the server renders empty. The shift predates this wave and is under budget.
- The medians for `/connect-clouds/aws` and `/changelog` are unchanged.

## Notes

- `/connect-clouds/aws` shows `td-has-header` failing in both presets. It has weight 0, so the score stays 100. It is the `aws.mdx` table with an empty `<th>`, an MDX owner call.
- First-load JS shared by all pages, from `next build`: 960 kB (kB as Next prints it; `_app` is Nextra plus Scalar). FlexSearch loads only on the first open of the palette. The marketing site's 150 KiB first-load budget does not apply here: Nextra and Scalar were already about 951 kB before the redesign.
- The "Last updated" line does not shift layout: CLS is 0 on every run of the three article pages.
