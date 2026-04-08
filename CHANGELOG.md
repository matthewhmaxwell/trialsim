# TrialSim Changelog

## V1 Save Point (2026-04-08)

### Three-View Architecture
- **Study View**: Aggregate source mix -> funnel pipeline -> enrollment curve
  - 4 trial templates (Phase 1, Phase 2/3, Rare Disease, Decentralized)
  - 9 pre-configured patient sources (Clinical, Digital, Agentic/AI)
  - Configurable funnel stages with conversion, throughput, duration, dropout
  - Snapshot/compare mode with dashed baseline overlay
  - Source contribution bars, stage utilization heatmap
- **Multi-Site View**: Per-site table with enrollment modeling
  - 3 site scenarios (Small/Medium/Large) with 80 real hospital names
  - Editable inline table, CSV import, sortable columns
  - Site contribution waterfall chart (top 25)
  - Drill-in arrow to Single Site View with bidirectional sync
- **Single Site View**: Detailed individual site modeling
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
- Animated week-by-week playback with speed control (0.25x-5x)
- Particle flow animation through pipeline during simulation
- Milestone callouts at 25/50/75/100% enrollment
- Animated stat counters (easeOutCubic)
- Playback progress bar

### UX Polish (14 issues fixed)
- AnimCounter initializes correctly (no animation from 0 on load)
- Unicode em-dash renders properly in all dropdowns
- Confirmation dialog on template/scenario switch (prevents accidental data loss)
- Gantt milestones auto-cascade within tracks
- Category selector for custom sources (Clinical/Digital/Agentic)
- Add/remove funnel stages in Single Site View
- Editable referral source names
- Gantt edit state clears on template switch
- Prompt dialog for naming custom sources and stages
- Coordinator FTEs affect simulation capacity (~8 patients per coordinator)

### Tech
- Single self-contained HTML file (~1500 lines)
- React 18 + Recharts + Babel from CDN
- Zero build step, opens in any browser
- JSON export/import for full config persistence

---

## V2 (in progress)

### UX Improvements
- Section labels: "Recruitment Sources" vs "Enrollment Funnel"
- Tab subtitles explaining each view's purpose
- Rename "Simulate" to "Play" with icon
- Gantt edit hint ("Click any bar to edit")
- Contextual welcome text for first-time users
- Benchmark context on stats (industry average ranges)
- Save reminder when config is modified
- Info tooltips on key parameters
- Edit affordance indicators (pencil icons, dotted underlines)
- Template cards landing state for first visit
