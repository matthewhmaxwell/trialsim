# Trialsim Changelog

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
