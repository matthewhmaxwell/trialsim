# Trialsim

**Interactive clinical trial enrollment simulator**

Model how different recruitment strategies, site configurations, and protocol designs affect your enrollment timeline. Built by the [American Institute for Medical Research](https://aimronline.org).

**[Launch Trialsim](https://trialsim.aimronline.org)**

---

## What is Trialsim?

Trialsim is a browser-based enrollment simulator for clinical trials. It helps sponsors, CROs, and research teams answer questions like:

- "If we use these recruitment sources with these conversion rates, when do we hit our enrollment target?"
- "Given these 40 sites with these rates, when do we finish?"
- "What happens to our timeline if we add agentic AI outreach?"
- "How does this site's 6-week IRB compare to a research site with a 2-week IRB?"

No login. No install. No backend. Just open `index.html` in a browser.

## Features

### Three Simulation Views

| View | Purpose | Use When |
|------|---------|----------|
| **Study View** | Model recruitment source mix and patient funnel | Early planning: "What sources should we use?" |
| **Multi-Site View** | Model enrollment across a site portfolio | Execution planning: "Given these sites, when do we finish?" |
| **Single Site View** | Model one site's startup timeline and patient pipeline | Site-level detail: "When does this site get to FPI?" |

### Study View
- 4 trial templates (Phase 1, Phase 2/3, Rare Disease, Decentralized/Hybrid)
- 9 patient source types across Clinical, Digital, and Agentic AI categories
- Configurable funnel stages with conversion rate, throughput capacity, dropout rate
- Snapshot/compare mode to overlay baseline vs modified scenarios
- Source contribution analysis and stage utilization heatmap

### Multi-Site View
- Editable site table with 80+ real hospital/research center names
- CSV import for your own feasibility lists
- Per-site enrollment rate, activation week, screen failure rate, dropout, and capacity cap
- Site contribution waterfall chart (top 25 performers)
- Drill-in arrow on each row to open Single Site View with bidirectional sync

### Single Site View
- Gantt startup timeline with 3 parallel tracks (Regulatory, Legal, Operational)
- 9 configurable milestones with auto-cascade within tracks
- First Patient In (FPI) auto-computed from critical path
- Referral source pipeline with editable names and volumes
- Patient funnel with add/remove stages and inline slider editing
- Capacity modeling (max concurrent patients, coordinator FTEs)
- 3 site type templates (Academic Medical Center, Community Hospital, Dedicated Research Site)
- Bidirectional sync back to Multi-Site table on drill-in

### Simulation Engine
- Real-time recalculation on every parameter change
- Animated week-by-week playback with speed control (0.25x to 5x)
- Particle flow animation through the pipeline during simulation
- Milestone callouts at 25%, 50%, 75%, and 100% enrollment
- Animated stat counters with easeOutCubic easing

### Uncertainty & Calibration
- **Monte Carlo fan on by default** — 200 seeded iterations, P10 / P50 / P90 bands on every view
- Seeded PRNG (mulberry32) — same config produces the same fan, no jitter on re-render
- Per-site **ramp-up + Poisson noise** in Multi-Site view
- **Calibrate from actuals** — paste real enrollment data (aggregate, per-site, or per-source) and rescale the forecast
- **Inline citations** — every default number (TA multipliers, screen-fail rates, coordinator capacity) is sourced (Tufts CSDD, CTTI, IQVIA, etc.)

### Scenarios & Reporting
- **Scenario library** persisted in localStorage — save, rename, load, duplicate
- **One-click PDF report** — branded cover page, stats, chart, tables, and a full assumptions appendix
- **Undo / redo** — Cmd-Z undoes template switches, TA applies, calibrations, loads
- JSON export/import for full configuration
- CSV import for site lists
- Shareable URL (config encoded in hash)

### Data Management
- Confirmation dialogs on destructive actions (with undo reminder)
- Mobile gate — redirects narrow-screen visitors rather than pretending the desktop layout works

## Quick Start

### Option 1: Use the hosted version
Visit **[trialsim.aimronline.org](https://trialsim.aimronline.org)**

### Option 2: Run locally
```bash
# Clone the repo
git clone https://github.com/matthewhmaxwell/trialsim.git
cd trialsim

# Open in your browser (no build step needed)
open index.html
# or
python3 -m http.server 8080
# then visit http://localhost:8080
```

That's it. No `npm install`, no build tools, no dependencies to manage.

### Running the test suite
```bash
python3 -m http.server 8080
# Then visit http://localhost:8080/tests.html
```
Runs 25 pure-function tests against the simulation engines in the browser.

## How It Works

1. **Pick a template** - Choose Phase 1, Phase 2/3, Rare Disease, or Decentralized. Pre-loads appropriate sources, funnel stages, and targets.
2. **Customize parameters** - Add/remove sources, adjust conversion rates, change target N. Click any card to edit.
3. **See results instantly** - Enrollment timeline, rate, screen failure, and cost update in real-time.
4. **Compare scenarios** - Snapshot your baseline, make changes, and see the difference overlaid on the enrollment curve.

## Technical Details

- **Single HTML file** (~1,700 lines) - entire app in one file, no build step
- **React 18** + **Recharts** loaded from CDN via UMD
- **Babel standalone** for JSX compilation in-browser
- **Zero backend** - all computation runs client-side
- **No cookies, no tracking, no data sent anywhere**

## CSV Import Format

For Multi-Site View, import a CSV with these columns (flexible matching - partial names work):

| Column | Description | Example |
|--------|-------------|---------|
| `name` or `site` | Site name | Memorial Sloan Kettering |
| `rate` or `enroll` | Patients per week | 2.5 |
| `activation` or `start` | Activation week | 4 |
| `screen` or `fail` | Screen failure % | 35 |
| `drop` | Dropout % | 3 |
| `cap` | Max patients (optional) | 20 |

## Key Concepts

| Term | Definition |
|------|-----------|
| **Conversion Rate** | % of patients who pass a stage and advance |
| **Throughput** | Max patients a stage can process per week |
| **Dropout Rate** | % who leave voluntarily mid-stage |
| **Screen Failure** | Overall % of identified patients who never reach enrollment |
| **Ramp-up** | Weeks for a source to reach full volume |
| **FPI** | First Patient In - week when a site enrolls its first patient |
| **Activation Week** | Week a site comes online and starts enrolling |
| **Max Concurrent** | Max patients a site can manage simultaneously |

## Where Trialsim fits

Feasibility teams have three options when modeling enrollment:

| Tool | Strengths | Tradeoffs |
|------|-----------|-----------|
| **Spreadsheets (Excel)** | Everyone has them. Free. Full control. | No uncertainty modeling. No per-site portfolio view. Copy-paste bugs. Not interactive. |
| **Trialsim** (this tool) | Zero setup. Three linked views (study → portfolio → site). Monte Carlo on by default. Sourced assumptions. Branded PDF reports. Per-site calibration from actuals. Open source. | Browser-only. No auth / multi-user. Client-side compute only. Not a statistical analysis plan tool. |
| **Enterprise platforms** (Cytel East, IQVIA CTMS, Medidata AcornAI) | Rigorous statistics, validated defaults, enterprise integrations, support contracts. | Long procurement cycles. Six-figure licenses. Over-engineered for early-phase feasibility and first-cut planning. |

**Honest positioning:** Trialsim is for **first-cut feasibility planning** — the stage where you are asking "roughly, with this mix, when do we finish?" and need something better than a spreadsheet but lighter than Cytel.

For signed-off, regulator-facing enrollment forecasts, keep using your enterprise platform and biostatistics team. Trialsim is a sketching tool, not a replacement.

**What Trialsim will not do** (by design):
- Stratification, blinding, or randomization simulation
- Any statistical analysis beyond Poisson/lognormal uncertainty
- SDTM / ADaM / CDISC integration
- Regulatory submission artifacts

**What Trialsim will do that the alternatives do not:**
- Move from study-level → portfolio-level → site-level planning in the same tool, with bidirectional sync
- Show uncertainty (P10/P50/P90) by default, not as an afterthought
- Surface the source of every default number inline
- Run entirely in a browser with no login

## Sister Projects

- **[Trialibre](https://trialibre.aimronline.org)** - Open-source clinical trial matching
- **[Trialearn](https://trialearn.aimronline.org)** - Clinical research training

## License

MIT License. See [LICENSE](LICENSE) for details.

## About

Developed by the [American Institute for Medical Research](https://aimronline.org) (AIMR), a non-profit organization dedicated to making clinical research tools accessible.
