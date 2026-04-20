# Trialsim Changelog

## v0.4.3 — 2026-04-20

Reset / zero / blank primitives + a deterministic site generator + toolbar and typography polish. Also closes the iframe-clickjacking gap at the server layer.

### New — scoped data controls
- **"Blank" preset in each view's template dropdown.** Study, Multi-Site, and Single-Site each get a "Blank — start from scratch" option that replaces the current view's pre-populated sample data with an empty skeleton (preserves terminal-stage markers so the sim still runs). Use case: user wants to paste their own feasibility data without deleting entity-by-entity.
- **"Zero out this view…" action in the ⋯ menu.** Keeps the user's current row/stage structure but clears every name and zeroes every numeric field. Pushes to the undo stack so ⌘Z restores exactly. Per-view, scoped to activeTab.
- **"Clear all saved data…" action in the ⋯ menu.** Full local-data wipe — current autosave, saved Scenario Library, dismissed welcome banners, mobile-gate opt-out. Confirm lists exactly what's being cleared with counts. Complements the existing "Reset to defaults" which only touched the current scenario's autosave.

### Correctness
- **`generateSites` is now seeded deterministically by scenario key.** Previously used unseeded `Math.random()`, so Small/Medium/Large site rates, screen-fail %, dropout %, and cost were re-rolled on every page load — a feasibility lead could show a client "11 weeks to target" and see "12 weeks" after a refresh, with zero user input between. Same scenario → same sites, forever.
- Home page "See How It Works" CTA did nothing. `.home` is its own scroll container (`overflow-y: auto`), so `Element.scrollIntoView` walked the wrong scroll root and left the page stuck. Switched to explicit `container.scrollTo` with offsetTop.
- Bottom-of-page "Launch Simulator" CTA was rendering as a browser-default grey button. `.hero-cta` CSS was scoped to `.home-hero .hero-cta` only; the duplicate CTA in `.home-cta-section` matched no rule. Unscoped the selector.

### Security
- **`.htaccess` at the server layer for the `trialsim/` directory.** Response headers now set: `X-Frame-Options: DENY`, `Content-Security-Policy: frame-ancestors 'none'`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`. Closes the clickjacking window that the meta-CSP couldn't enforce (browsers ignore `frame-ancestors` from `<meta>`).

### UX / layout
- **Toolbar no longer clips at 1100–1280px viewports.** Topbar now `flex-wraps` with `min-height: 48px` instead of a rigid 48px that hid content off the right edge. Undo / Redo dropped to square icon-only buttons (saved ~120px — ⌘Z is primary). `Library (0)` shows as just `Library` when empty. Decorative `|` separator between Library and Report removed. `<select>` capped at 260px with ellipsis so long template names don't push buttons off-screen.
- **Template card grid switched to `auto-fit minmax(180px, 1fr)`.** 5 templates fit cleanly in one row at standard desktop widths (was fixed 4-column, which left the new "Blank" card orphaned on its own row).
- **Stat tiles + welcome banners — typography refinement.** Stat tile padding 12→14/16px, label 9→10px, value 20→22px with softer kerning; banner title 12→13px, body 11→12px. Reads as header + body instead of inline copy; numbers like `$2,097` and multi-line subs like `6.0 months` breathe.

### A11y (round 2)
- Multi-Site sortable column headers: `tabIndex=0`, `role="columnheader"`, `aria-sort` cycles through `none` / `ascending` / `descending`; Enter/Space triggers sort. Previously mouse-only.
- Topbar "Trialsim" brand wordmark is keyboard-reachable (`role="link"` + `aria-label` + Enter/Space handler). Was mouse-only return-to-home.
- Welcome-banner × buttons get `aria-label="Dismiss welcome banner"`.
- `<input>` focus rings that had `outline: none` with <1.2:1 box-shadow replacements now use a 2px solid accent outline via `:focus-visible`.
- Tab bar reverted from partial `role="tablist"` + broken `aria-controls` (which pointed at a landmark, not a tabpanel, and lacked arrow-key navigation) back to plain `<button>`s with `aria-current="page"`. Simpler, still accessible; revisit when full APG tablist lands.

### UX polish
- **Calibrate button hidden on Single Site.** Aggregate calibration fit a multiplier that was never applied to the site's referrals or funnel — surfaced a lying "Calibrated (1)" green badge with no effect. Restore when the SS chart wires through `actualsData.fitMultiplier`.
- **Report cover gets a "Planning use only" disclaimer.** Scenario PDFs forwarded inside CROs unsupervised; missing this line was the one copy gap with real legal-review risk.
- Share-link toast trimmed, now warns about confidential site names + costs every copy.
- Clip-at-100% badge tooltip rewritten from dev-speak to plain English.
- Removed the dead `Unsaved changes · Export to save` chip (`hasEdited` was stubbed to `false` since v0.4).
- `kbdBtn({disabled})` no longer leaks as invalid HTML on `<div>`.
- Removed the decoupled autosave of `activeTab` considerations — view-specific UX refined via `aggActuals` helper dedupe.

### Known gaps (deferred to v0.5 or Wave B)
- Biostats rigor: median-of-ratios calibration, lognormal bias correction, DOI-level citations, Single-Site calibration wiring, `screenFailBoost × 0.25` coefficient documentation
- Copy/positioning (Wave B legal): H1 subhead, license clarity for CROs, sources acronyms, welcome-banner density, feature-card prioritization
- Full ARIA APG tablist pattern with arrow-key navigation + `role="tabpanel"`
- Per-subdomain SFTP accounts (shared `u37698966` still writes across trialsim/trialearn/trialibre/trialsites)

---

## v0.4.2 — 2026-04-19

Second-pass pre-launch polish from a multidisciplinary re-review. Tightens the WCAG AA surface and kills a silent no-op that was surfacing a misleading "calibrated" indicator.

### Accessibility
- Multi-Site sortable column headers: `tabIndex=0`, `role="columnheader"`, `aria-sort` cycles `none` / `ascending` / `descending`, Enter/Space triggers sort. Previously mouse-only.
- Topbar "Trialsim" wordmark is now keyboard-reachable (`role="link"` + `aria-label` + Enter/Space handler). Was a `cursor: pointer` `<h1>` with no keyboard path to return home.
- `<input>` focus rings: the two `outline: none` rules with <1.2:1 box-shadow replacements now use a 2px solid accent outline via `:focus-visible` (WCAG 1.4.11 / 2.4.7).
- Welcome-banner × buttons all get `aria-label="Dismiss welcome banner"`.
- Home page (marketing view) gets its own skip-to-main-content link and `<main id="trialsim-main">` landmark. v0.4.1's landmarks only covered the in-app views.
- Tab bar reverted from partial `role="tablist"` + `aria-controls="trialsim-main"` (which pointed at a landmark, not a `role="tabpanel"`, and was missing arrow-key navigation) back to plain `<button>`s with `aria-current="page"` on the active tab. Simpler, still accessible, and no broken ARIA relationship. Revisit when full APG tablist with roving tabIndex + arrows lands.

### UX / copy
- **Report cover disclaimer.** "Planning use only. Not a regulatory submission, IND/IDE deliverable, or contractual feasibility commitment. Calibrate against observed local data before any commitment." Scenario PDFs get forwarded inside CROs unsupervised; missing this line was the one copy gap with real legal-review risk.
- **Share-link toast** trimmed. Long form: `Link copied (N chars). May be truncated in chat clients. Contains site names + costs — don't share in public channels.` Short form is one line.
- **Clip-at-100% badge tooltip** rewritten from dev-speak ("effective multiplier is lower than the preset nominal") to plain English: "This TA preset would push conversion to N% at this stage. We've capped it at 100%, so the TA's effective boost here is smaller than its label implies."
- Removed the dead `Unsaved changes · Export to save` chip. `hasEdited` was stubbed to `false` since v0.4; the chip's label was misleading (autosave + Save Scenario are the actual save paths) and was unreachable dead code.

### Correctness
- **Calibrate button hidden on Single Site.** Aggregate calibration on Single was fitting a multiplier that was never applied to the site's referrals or funnel, surfacing a lying "Calibrated (1)" green badge + success toast with no actual effect on the chart or stats. Hide the button until the SS chart wires through `actualsData.fitMultiplier`; tracked for v0.5.
- `kbdBtn(onClick, opts)`: destructure `disabled` out of `opts` so it doesn't leak as an invalid HTML attribute on a `<div>`. Also blocks `onClick`/`onKeyDown` when disabled and surfaces `aria-disabled`.

### Refactor
- `aggActuals` helper in the Study-View result card: 4 repeated `actualsData && actualsData.mode === 'aggregate' && ...` guards collapsed to a single alias scoped to the Study timeline block. Prevents a 5th drift.

### Meta
- `.gitignore` HANDOFF.md so the handoff-scratch doc stops nagging `git status`.
- Comment on `feedback.js` explaining why it's intentionally NOT SRI-pinned: same-origin first-party script, coupling cost outweighs the non-existent security gain (per-subdomain SFTP accounts are the correct hardening here).

### Known gaps (deferred to v0.5 or Wave B)
- Full ARIA APG tablist pattern (arrow keys, roving tabIndex, `role="tabpanel"`)
- Response-header CSP (frame-ancestors, HSTS, X-Frame-Options) — needs IONOS config
- Biostats rigor: median-of-ratios calibration, lognormal bias correction, DOI-level citations, Single-Site aggregate calibration wiring, `screenFailBoost × 0.25` coefficient documentation
- Copy/positioning (Wave B legal): H1 subhead, license clarity for CROs, sources acronyms, welcome-banner density

---

## v0.4.1 — 2026-04-19

Pre-launch hardening pass. Accessibility, security, correctness, and polish from a multidisciplinary review (QA, biostats, a11y, security, copy, code review, ops).

### Accessibility — WCAG 2.1 AA
- `--text3` bumped from `#8c857e` (3.5:1) to `#6a645e` (5.27:1) for AA normal text. Darkens stat sublabels, source volumes, benchmark captions, footer copy globally.
- `--orange` bumped from `#b07d20` (3.6:1) to `#8a6019` (5.03:1) so the warning-amber text — clipped-at-100% badge, agentic source markers, "Above typical" labels — meets AA.
- Toast wrapped in `role="status" aria-live="polite" aria-atomic="true"` so screen readers announce undo/redo/save/calibration/share messages.
- Skip-to-main-content link (visible only on keyboard focus), `<main id="trialsim-main">` landmark, `role="tablist"` on the tab bar with per-tab `aria-selected` and `aria-controls`.
- All three enrollment charts (Study, Multi-Site, Single-Site) wrapped in `role="img"` with a dynamic `aria-label` that summarises week-to-target and Monte Carlo P10/P50/P90. Blind users now get the numerical answer the chart encodes.
- Speed slider and Week scrubber have `id` / `htmlFor` pairs plus dynamic `aria-label` reflecting current value.
- Config primitives that look like buttons but couldn't be semantic `<button>`s — source-card, stage-card, template-card, view-card, ref-card, mf-stage, save-reminder — now have `role="button"`, `tabIndex=0`, Enter/Space handling, `aria-pressed` state, and a `:focus-visible` outline.
- `prefers-reduced-motion` media query disables the particle flows, milestone pop-ins, and CSS transitions for users who opt out. Keeps 0.01ms duration so state still settles.
- `?` pill in tab bar re-opens the dismissed welcome banner for the current view (previously the banner was unrecoverable once dismissed).

### Security
- All 6 CDN scripts pinned to exact versions (`react@18.3.1`, `react-dom@18.3.1`, `@babel/standalone@7.26.4`, `prop-types@15.8.1`, `recharts@2.12.7`, `html2canvas@1.4.1`) with SHA-384 SRI hashes and `crossorigin="anonymous"`. A compromised unpkg/cdnjs tarball can no longer substitute a malicious payload.
- Content-Security-Policy meta tag with per-source allowlists for script/style/font/img/connect, plus `frame-ancestors 'none'` and `base-uri 'self'`. `'unsafe-inline'` on scripts is still required while Babel Standalone runtime-transforms JSX; revisit when we precompile.
- `feedback-api.php` (aimr root): strip CR/LF from `$email`, `$fb_type`, `$source`, `$user_agent` before they're interpolated into mail headers. Closes an email-header injection vector that `FILTER_SANITIZE_EMAIL` left open.

### Correctness
- **Fixed ErrorBoundary crash** on tab navigation after per-site or per-source calibration. Study View's "+ Actuals" chip and the overlaid `<Area>` both dereferenced `actualsData.values`, which is only defined in aggregate mode. All accesses now gated on `mode === 'aggregate'`.
- `hasPlayed` resets on template switch, site-scenario switch, and scenario load so the Play button no longer claims "Replay" on a config the user never played.
- Direct edits to a stage's conversion rate now strip the cached `clippedConv` value, so the "⚠ clipped at 100%" badge disappears when the user drags the slider away from the TA-induced clip.
- Single-Site Calibrate toolbar now counts aggregate calibration (`actualsData` presence) toward "Calibrated (N)" — previously always 0.

### UX
- **▶ Play** on first load (not "Replay" on a config the user never played); flips to "■ Stop" during animation; becomes "▶ Replay" after the first playback session.
- **Calibrate** promoted from a `+ Calibrate` ghost link above the Multi-Site chart to a first-class toolbar button next to Save Scenario — with mode defaulting to sources on Study, sites on Multi-Site, aggregate on Single. Shows "Calibrated (N)" in green once any entity has been calibrated.
- Save Scenario now opens `window.prompt()` with a smart default (context + count) instead of silently saving under a template-auto-generated name.
- Share-link toast always warns the URL contains the full config (site names + costs). The long-URL variant also notes truncation risk for chat clients. `showToast` now takes a duration param.
- **⚠ clipped at 100%** badge surfaces stages where a TA preset's `conversionMult` × baseline would have exceeded 100% but was clamped — previously the effective multiplier was silently lower than the preset nominal.

### SEO / Ops
- `robots.txt` allowing all crawlers with sitemap pointer.
- `sitemap.xml` listing `/` and `/tests.html`.

### Tech
- `applyTAPreset` stashes `clippedConv` (uncapped percentage) on any stage where `conversionRate` was clamped, and strips it cleanly when a non-clipping TA is applied or when the user directly edits the conversion rate.
- Added `kbdBtn()` helper for making styled `<div>`s keyboard-reachable without breaking visual layout (role + tabIndex + Enter/Space handler).

---

## v0.4.0 — 2026-04-16

Credibility, calibration, and reporting.

### New — uncertainty by default
- **P10 / P50 / P90 Monte Carlo fan** on every view's enrollment curve, **on by default** — no "enable uncertainty" checkbox. 200 iterations.
- **Seeded PRNG** (mulberry32) — same config always produces the same fan; results no longer jitter on re-render.
- **Per-site ramp-up** (linear, 4-week default post-activation) + optional Poisson weekly sampling in the Multi-Site Monte Carlo.
- Monte Carlo for all three views (Study, Multi-Site, Single Site) with independent seeds.

### New — sources cited
- Inline `<Cited>` component with hover-popover citations on every default number:
  source volumes (Tufts CSDD, Antidote/Clara), screen-fail (CISCRP 2023), conversion (CDISC), site ramp-up (Tufts CSDD), coordinator capacity (SCRS 2022), startup durations (CTTI 2021, SCRS 2022), TA multipliers (IQVIA, NORD, I-ACT, CEPI/WHO, CNS Summit, ACC, ADA, IDSA, ACR).
- Full `ASSUMPTIONS` table in `trialsim-core.js` — every default is discoverable, auditable, and editable.

### New — calibrate from actuals
- Paste observed enrollment to rescale the forecast:
  - **Aggregate** mode: week-by-week totals, fit a single multiplier.
  - **Per-Site** mode: CSV (`site_name, weeks_active, enrolled`), per-site rate multipliers.
  - **Per-Source** mode: CSV (`source_name, weeks_active, identified`), per-source volume multipliers.
- Substring site-name matching, case-insensitive; unmatched rows reported.
- Calibrated sites show a green dot with the observed rate and multiplier on hover.
- `baseEnrollmentRate` / `baseVolume` stored on first calibration so re-calibration recomputes against the original baseline instead of compounding. `× Clear` reverts to the baseline.

### New — scenario library + reporting
- **Save Scenario** bookmarks the current full state under an auto-name (view + template + index); rename, reload, duplicate, or compare in the **Library** panel.
- Scenarios persist in `localStorage` across reloads. Export the whole library as JSON for backup / transfer.
- **One-click Report** button generates a branded, print-ready HTML page with:
  cover (title, template, TA preset, timestamp), summary stats (deterministic + P10/P50/P90),
  the enrollment chart as SVG, tables for sources / funnel / active sites / startup milestones,
  agentic-caveat warning when applicable, and a full **Assumptions & Sources** appendix.

### New — undo & keyboard
- Undo/Redo stack (20 steps) for destructive actions: template switch, TA apply, scenario load,
  calibration apply, calibration clear, site/SS template switch.
- `⌘Z` / `Ctrl-Z` undo, `⇧⌘Z` / `Shift-Ctrl-Z` redo.

### New — honest mobile fallback
- `MobileGate` component at viewport < 720px: explains why the interactive sim needs desktop,
  surfaces AIMR tools page as an alternative, and offers a "continue anyway" escape hatch
  that persists in localStorage.

### New — Open Graph / social preview
- 1200×630 branded preview card (`og-image.png`) for link unfurls in Slack, LinkedIn, Twitter, iMessage, Discord.
- Full OG tag set: title, description, image with dims + alt, site_name, locale.
- `twitter:card` upgraded from `summary` to `summary_large_image`.
- Favicon switched to the shared `aimronline.org` favicon stack (ico + 32px PNG + apple-touch-icon).

### Tech
- **Pure-JS simulation core extracted** to `trialsim-core.js` (680 lines): RNG, distributions,
  templates, TA presets, site scenarios, simulate / simulateSites / simulateSingleSite,
  computeFPI, diagnose, montecarlo / montecarloSites / montecarloSingleSite, ASSUMPTIONS.
- `tests.html` — 25 unit tests against the real core (simulation determinism, ramp-up behavior,
  coordinator capacity caps, FPI critical path, RNG determinism, Poisson mean).
- Single Site view state consolidated into `useReducer` with atomic `MERGE` action on template
  load — eliminates brief inconsistent-render window.
- All `prompt()` dialogs replaced with inline editing or auto-name + rename in Library.
- Topbar overflow menu (⋯) for secondary actions (Share, PNG, Print, Export, Import, Reset) so
  primary actions (Report, Save Scenario, Library, Undo, Redo) always fit at narrower viewports.
- Guide tab refreshed with a "New in v0.4" banner, 8 concept cards, and step-by-step coverage
  of calibration and reports.
- Landing page feature grid re-prioritized to lead with v0.4 features (12 cards total).

### Fixed
- Dwell-time model regression in `simulate()` (patients in delay buffer now correctly age).
- `</script>` inside template literal in Report HTML (broke Babel script block).
- Multi-Site chart: animation disabled (`isAnimationActive={false}`) so fan and line render
  deterministically without Recharts auto-animation jitter.
- Calibration `× Clear` previously removed the badge without reverting the mutated rate — now
  properly reverts to baseline.
- Agentic AI sources marked with ⚠ on source cards, config-drawer, and Report to signal they're
  projections, not benchmarks.

---

## v0.3.0 — 2026-04-09

Major capability expansion (pre-v0.4 baseline).

- Consistent config-panel interactions across all three views
- Standardized cost modeling + snapshot/compare across views
- Pre-launch polish: mobile responsive tweaks, meta tags, favicon, titles, error boundary, Plausible analytics
- 6 functionality bugs fixed in pre-ship audit

## v0.2.x — 2026-04-08

- UX improvements: section labels, tab subtitles, `Play` icon rename, Gantt edit hints, contextual welcome banners, industry-average benchmark context on stats, info tooltips, edit-affordance indicators, template cards landing state

## v0.1.0 — V1 Save Point (2026-04-08)

Initial public release.

### Three-View Architecture
- **Study View**: aggregate source mix → funnel pipeline → enrollment curve
  - 4 trial templates (Phase 1, Phase 2/3, Rare Disease, Decentralized)
  - 9 pre-configured patient sources (Clinical, Digital, Agentic/AI)
  - Configurable funnel stages with conversion, throughput, duration, dropout
  - Snapshot/compare mode with dashed baseline overlay
  - Source contribution bars, stage utilization heatmap
- **Multi-Site View**: per-site table with enrollment modeling
  - 3 site scenarios (Small/Medium/Large) with 80 real hospital names
  - Editable inline table, CSV import, sortable columns
  - Site contribution waterfall chart (top 25)
  - Drill-in arrow to Single Site View with bidirectional sync
- **Single Site View**: detailed individual site modeling
  - Gantt startup timeline with 3 parallel tracks (Regulatory, Legal, Operational)
  - Auto-cascading milestones within tracks
  - Referral source pipeline with editable names and volumes
  - Patient funnel with add/remove stages and inline slider editing
  - Capacity modeling (max concurrent, coordinator FTEs affect throughput)
  - FPI auto-computed from critical path
  - 3 site type templates (Academic, Community, Research)
  - Bidirectional sync back to Multi-Site table on drill-in

### Simulation Features
- Real-time recalculation on any parameter change
- Animated week-by-week playback with speed control (0.25x–5x)
- Particle flow animation through pipeline during simulation
- Milestone callouts at 25/50/75/100% enrollment
- Animated stat counters (easeOutCubic)
- Playback progress bar

### Tech
- Single self-contained HTML file (~1,500 lines)
- React 18 + Recharts + Babel from CDN
- Zero build step, opens in any browser
- JSON export/import for full config persistence
