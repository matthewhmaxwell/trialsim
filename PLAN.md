# Clinical Trial Enrollment Simulator

## Context
Sponsor/CRO teams need to model how different patient source mixes and interventions (like agentic outreach) influence enrollment speed. Existing tools are either static spreadsheets or over-engineered enterprise platforms. This simulator gives them a visual, interactive node-based tool — inspired by manufacturing DES simulators — where they can configure sources, funnel stages, conversion rates, and immediately see enrollment curves and bottleneck analysis.

## Output
**Single self-contained HTML file**: `~/Downloads/clinical_trial_enrollment_simulator.html`
- Opens in any browser, no build step
- Loads React 18, React Flow, Recharts from CDN via ESM/UMD

## Architecture

### Visual Layout (3-panel)
```
┌─────────────────────────────────────────────────────────┐
│  Toolbar: [Template ▾] [Run ▶] [Reset] [Export Config]  │
├────────────┬────────────────────────────────────────────┤
│            │                                            │
│  Source    │         React Flow Canvas                  │
│  Palette   │                                            │
│            │   [Source A] ──→ [Identified] ──→ ...      │
│  - Site DB │   [Source B] ──↗                           │
│  - Referral│                                            │
│  - Digital │   Click any node to configure:             │
│  - Agentic │   conversion %, throughput/week,           │
│  - Custom  │   capacity, dropout %                      │
│            │                                            │
├────────────┴────────────────────────────────────────────┤
│  Output Dashboard (collapsible)                         │
│  [Enrollment S-Curve]  [Bottleneck Heatmap] [Summary]   │
└─────────────────────────────────────────────────────────┘
```

### Node Types

**1. Source Nodes** (left side, colored by category)
Each source has:
- `volume`: patients/week entering the funnel
- `rampUpWeeks`: weeks to reach full volume (models real-world lag)
- `costPerPatient`: optional, for ROI analysis
- `active`: toggle on/off

Pre-configured sources (all editable):
| Source | Default Vol/wk | Category |
|--------|---------------|----------|
| Site Database | 15 | Clinical |
| Physician Referral | 8 | Clinical |
| EHR/EMR Screening | 20 | Clinical |
| Digital Advertising | 25 | Digital |
| Patient Advocacy | 5 | Digital |
| Trial Listing Sites | 10 | Digital |
| Agentic Outreach | 30 | Agentic |
| AI Pre-screening | 15 | Agentic |
| Automated Re-engagement | 10 | Agentic |

**2. Funnel Stage Nodes** (center, sequential)
Each stage has:
- `conversionRate`: % that advance (0-100)
- `throughputPerWeek`: max patients processed/week (capacity constraint)
- `avgDurationDays`: time spent in stage
- `dropoutRate`: % that leave mid-stage (different from failing to convert)

**3. Terminal Node**: "Randomized/Enrolled" — the target

### Templates (4 presets)

**Phase 1** (target N=30, 6 sites)
- Sources: Site DB, Physician Referral, EHR only
- Funnel: Identified → Pre-screened → Consented → Screened → Dosed
- Tight eligibility = low conversion at screening (25%)

**Phase 2/3** (target N=300, 40 sites)
- Sources: Full clinical + digital mix
- Funnel: Identified → Pre-screened → Consented → Screened → Randomized
- Standard conversions (50% → 70% → 80% → 60%)

**Rare Disease** (target N=80, 25 sites)
- Sources: Patient advocacy heavy, agentic outreach, physician referral
- Funnel: Identified → Genetic Screen → Consented → Screened → Enrolled
- Very low initial volume, high conversion once identified

**Decentralized/Hybrid** (target N=500, 60 sites)
- Sources: Heavy digital + agentic, lighter clinical
- Funnel: Identified → Digital Pre-screen → eConsent → Remote Screen → Randomized
- Higher volumes, moderate conversion, faster throughput

### Simulation Engine

**Time-stepped discrete simulation** (weekly ticks):
1. Each source generates patients based on `volume × rampUpFactor(week)`
2. Patients enter first funnel stage
3. Each stage processes min(queue, throughputPerWeek) patients
4. Apply `conversionRate` — passers advance, failers exit
5. Apply `dropoutRate` — random mid-stage attrition
6. Track cumulative enrolled vs target N
7. Run until target hit or maxWeeks (104) reached

**Key outputs**:
- **Enrollment S-curve**: cumulative enrolled over time, with target line and projected completion date
- **Bottleneck heatmap**: per-stage utilization (queue/capacity) over time — red = bottleneck
- **Summary stats**: time to target, enrollment rate, screen failure rate, cost per enrolled (if costs configured), source contribution %

### Node Configuration Panel
Clicking any node opens a side panel with:
- Sliders for numeric params (conversion %, volume, etc.)
- Real-time re-simulation on change (debounced 300ms)
- "Compare" toggle: overlay previous run as dashed line on charts

### Interactions
- **Drag sources** from palette onto canvas to add
- **Click node** to configure
- **Delete node** via right-click or keyboard
- **Add custom source/stage**: "+" buttons
- **Rename** any node by double-clicking its label
- **Export**: download config as JSON (can re-import later)

## Implementation Plan

### Step 1: HTML scaffold + CDN imports
- React 18 + ReactDOM via CDN
- React Flow via CDN (reactflow.dev)
- Recharts via CDN
- Babel standalone for JSX
- Basic CSS grid layout

### Step 2: Data model + templates
- Define node/edge schema
- Build 4 template configs as JSON
- Template selector dropdown

### Step 3: React Flow canvas
- Custom node components (SourceNode, StageNode, TerminalNode)
- Edge rendering with animated flow particles
- Node click → config panel

### Step 4: Configuration panel
- Slider controls for each parameter
- Source palette with drag-to-add
- Add/remove/rename nodes

### Step 5: Simulation engine
- Pure function: `simulate(sources, stages, targetN, maxWeeks) → results`
- Weekly time-step loop
- Returns timeline data + per-stage metrics

### Step 6: Output dashboard
- Recharts: enrollment S-curve (area chart with target line)
- Recharts: bottleneck heatmap (stacked bar or heat grid)
- Summary stats cards
- Auto-rerun on any config change

### Step 7: Polish
- Color coding by source category
- Responsive layout
- Export/import JSON config
- Compare mode (overlay runs)

## Verification
1. Open file in browser — should render without errors
2. Select each of 4 templates — canvas should populate correctly
3. Click "Run" — enrollment curve should appear
4. Modify a conversion rate slider — chart should update in real-time
5. Add/remove a source — simulation should reflect the change
6. Verify bottleneck heatmap highlights the tightest stage
7. Export config → reload → import config → state should restore
