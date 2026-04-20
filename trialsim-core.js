// ═══════════════════════════════════════════════════════════════════════
// DETERMINISTIC RNG + DISTRIBUTIONS
// Mulberry32: fast, small, good enough for Monte Carlo. Seeded so the same
// config produces the same output across re-renders (no jitter).
// ═══════════════════════════════════════════════════════════════════════
function mulberry32(seed) {
  let t = seed >>> 0;
  return function() {
    t = (t + 0x6D2B79F5) >>> 0;
    let r = t;
    r = Math.imul(r ^ (r >>> 15), r | 1);
    r ^= r + Math.imul(r ^ (r >>> 7), r | 61);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}
// djb2 hash over a stable JSON-ish string — derives a deterministic seed from config.
function hashSeed(obj) {
  const s = typeof obj === 'string' ? obj : JSON.stringify(obj);
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) | 0;
  return h >>> 0;
}
// Box-Muller: one standard normal draw from a rng().
function randn(rng) {
  let u = 0, v = 0;
  while (u === 0) u = rng();
  while (v === 0) v = rng();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}
// Lognormal multiplier: exp(sigma * Z). E[X] ≈ exp(σ²/2), we don't bias-correct —
// sigma is a user-facing knob, not a strict measurement.
function lognorm(rng, sigma) { return Math.exp(sigma * randn(rng)); }
// Poisson sampler: Knuth for small lambda, normal approx for large.
function poisson(rng, lambda) {
  if (lambda <= 0) return 0;
  if (lambda < 30) {
    const L = Math.exp(-lambda);
    let k = 0, p = 1;
    do { k++; p *= rng(); } while (p > L);
    return k - 1;
  }
  const v = Math.max(0, Math.round(lambda + Math.sqrt(lambda) * randn(rng)));
  return v;
}

// ═══════════════════════════════════════════════════════════════════════
// DATA & TEMPLATES
// ═══════════════════════════════════════════════════════════════════════
const ALL_SOURCES = [
  { id: 'site_db', name: 'Site Database', category: 'clinical', volume: 15, rampUpWeeks: 2, costPerPatient: 200 },
  { id: 'physician_ref', name: 'Physician Referral', category: 'clinical', volume: 8, rampUpWeeks: 4, costPerPatient: 350 },
  { id: 'ehr_screening', name: 'EHR/EMR Screening', category: 'clinical', volume: 20, rampUpWeeks: 3, costPerPatient: 150 },
  { id: 'digital_ads', name: 'Digital Advertising', category: 'digital', volume: 25, rampUpWeeks: 2, costPerPatient: 500 },
  { id: 'patient_advocacy', name: 'Patient Advocacy', category: 'digital', volume: 5, rampUpWeeks: 6, costPerPatient: 100 },
  { id: 'trial_listings', name: 'Trial Listing Sites', category: 'digital', volume: 10, rampUpWeeks: 1, costPerPatient: 300 },
  { id: 'agentic_outreach', name: 'Agentic Outreach', category: 'agentic', volume: 30, rampUpWeeks: 1, costPerPatient: 80 },
  { id: 'ai_prescreen', name: 'AI Pre-screening', category: 'agentic', volume: 15, rampUpWeeks: 2, costPerPatient: 60 },
  { id: 'auto_reengage', name: 'Auto Re-engagement', category: 'agentic', volume: 10, rampUpWeeks: 3, costPerPatient: 40 },
];
const CAT_COLORS = { clinical: '#3e73a8', digital: '#6e5494', agentic: '#2e7370' };
const CAT_LABELS = { clinical: 'Clinical', digital: 'Digital', agentic: 'Agentic / AI' };

const TEMPLATES = {
  phase1: { name: 'Phase 1', desc: 'First-in-human, N=30, 6 sites', targetN: 30, numSites: 6,
    sources: ['site_db', 'physician_ref', 'ehr_screening'],
    stages: [
      { id: 's1', name: 'Identified', conversionRate: 60, throughputPerWeek: 50, avgDurationDays: 3, dropoutRate: 2 },
      { id: 's2', name: 'Pre-screened', conversionRate: 50, throughputPerWeek: 30, avgDurationDays: 7, dropoutRate: 3 },
      { id: 's3', name: 'Consented', conversionRate: 80, throughputPerWeek: 20, avgDurationDays: 5, dropoutRate: 1 },
      { id: 's4', name: 'Screened', conversionRate: 25, throughputPerWeek: 15, avgDurationDays: 14, dropoutRate: 2 },
      { id: 'terminal', name: 'Dosed', conversionRate: 100, throughputPerWeek: 999, avgDurationDays: 0, dropoutRate: 0 },
    ] },
  phase23: { name: 'Phase 2/3', desc: 'Pivotal trial, N=300, 40 sites', targetN: 300, numSites: 40,
    sources: ['site_db', 'physician_ref', 'ehr_screening', 'digital_ads', 'patient_advocacy', 'trial_listings'],
    stages: [
      { id: 's1', name: 'Identified', conversionRate: 50, throughputPerWeek: 200, avgDurationDays: 3, dropoutRate: 2 },
      { id: 's2', name: 'Pre-screened', conversionRate: 70, throughputPerWeek: 120, avgDurationDays: 7, dropoutRate: 3 },
      { id: 's3', name: 'Consented', conversionRate: 80, throughputPerWeek: 100, avgDurationDays: 5, dropoutRate: 2 },
      { id: 's4', name: 'Screened', conversionRate: 60, throughputPerWeek: 80, avgDurationDays: 14, dropoutRate: 3 },
      { id: 'terminal', name: 'Randomized', conversionRate: 100, throughputPerWeek: 999, avgDurationDays: 0, dropoutRate: 0 },
    ] },
  rare: { name: 'Rare Disease', desc: 'Small population, N=80, 25 sites', targetN: 80, numSites: 25,
    sources: ['patient_advocacy', 'physician_ref', 'agentic_outreach', 'ai_prescreen'],
    stages: [
      { id: 's1', name: 'Identified', conversionRate: 40, throughputPerWeek: 30, avgDurationDays: 5, dropoutRate: 1 },
      { id: 's2', name: 'Genetic Screen', conversionRate: 35, throughputPerWeek: 20, avgDurationDays: 21, dropoutRate: 5 },
      { id: 's3', name: 'Consented', conversionRate: 90, throughputPerWeek: 15, avgDurationDays: 7, dropoutRate: 2 },
      { id: 's4', name: 'Screened', conversionRate: 70, throughputPerWeek: 12, avgDurationDays: 14, dropoutRate: 3 },
      { id: 'terminal', name: 'Enrolled', conversionRate: 100, throughputPerWeek: 999, avgDurationDays: 0, dropoutRate: 0 },
    ] },
  decentralized: { name: 'Decentralized / Hybrid', desc: 'Remote-first, N=500, 60 sites', targetN: 500, numSites: 60,
    sources: ['digital_ads', 'trial_listings', 'agentic_outreach', 'ai_prescreen', 'auto_reengage', 'site_db'],
    stages: [
      { id: 's1', name: 'Identified', conversionRate: 55, throughputPerWeek: 300, avgDurationDays: 2, dropoutRate: 3 },
      { id: 's2', name: 'Digital Pre-screen', conversionRate: 65, throughputPerWeek: 200, avgDurationDays: 3, dropoutRate: 4 },
      { id: 's3', name: 'eConsent', conversionRate: 75, throughputPerWeek: 180, avgDurationDays: 2, dropoutRate: 2 },
      { id: 's4', name: 'Remote Screen', conversionRate: 55, throughputPerWeek: 120, avgDurationDays: 10, dropoutRate: 3 },
      { id: 'terminal', name: 'Randomized', conversionRate: 100, throughputPerWeek: 999, avgDurationDays: 0, dropoutRate: 0 },
    ] },
  // Blank — no sources, minimal funnel. Gives a clean slate for users who
  // want to paste their own feasibility data rather than start from the
  // pre-populated defaults. Terminal stage must stay for the sim to run.
  blank: { name: 'Blank — start from scratch', desc: 'No sources, minimal funnel. Add your own.', targetN: 100, numSites: 0,
    sources: [],
    stages: [
      { id: 's1', name: 'Identified', conversionRate: 50, throughputPerWeek: 100, avgDurationDays: 3, dropoutRate: 2 },
      { id: 'terminal', name: 'Enrolled', conversionRate: 100, throughputPerWeek: 999, avgDurationDays: 0, dropoutRate: 0 },
    ] },
};

// ─── Therapeutic Area Presets ─────────────────────────────────────────
// Realistic multipliers/overrides derived from published literature benchmarks.
// Applied on top of the base trial phase template.
const TA_PRESETS = {
  none: { name: 'Generic (no TA adjustment)', desc: 'Use unadjusted template defaults' },
  oncology: {
    name: 'Oncology',
    desc: 'High screen failure, slow ramp, strict eligibility',
    sourceVolumeMult: 0.7,        // harder to find patients
    conversionMult: 0.75,          // tighter eligibility -> lower conversion
    screenFailBoost: 15,           // add 15% to screen failure expectations
    dropoutMult: 0.9,              // oncology patients tend to stay enrolled
    costMult: 1.4,                 // oncology trials run expensive
  },
  vaccines: {
    name: 'Vaccine / Prevention',
    desc: 'High volume, fast screening, loose eligibility',
    sourceVolumeMult: 2.2,
    conversionMult: 1.25,
    screenFailBoost: -15,
    dropoutMult: 1.1,
    costMult: 0.6,
  },
  cns: {
    name: 'CNS / Psychiatry',
    desc: 'High dropout, moderate eligibility, placebo challenges',
    sourceVolumeMult: 0.9,
    conversionMult: 0.95,
    screenFailBoost: 5,
    dropoutMult: 1.6,              // CNS dropout is notoriously high
    costMult: 1.1,
  },
  cardiovascular: {
    name: 'Cardiovascular',
    desc: 'Common disease, moderate eligibility, long follow-up',
    sourceVolumeMult: 1.3,
    conversionMult: 1.05,
    screenFailBoost: -5,
    dropoutMult: 1.05,
    costMult: 0.9,
  },
  metabolic: {
    name: 'Metabolic / Diabetes',
    desc: 'Large eligible population, moderate conversion',
    sourceVolumeMult: 1.5,
    conversionMult: 1.0,
    screenFailBoost: 0,
    dropoutMult: 1.1,
    costMult: 0.85,
  },
  infectious: {
    name: 'Infectious Disease',
    desc: 'Event-driven, moderate volume',
    sourceVolumeMult: 1.1,
    conversionMult: 1.1,
    screenFailBoost: -10,
    dropoutMult: 0.95,
    costMult: 0.8,
  },
  autoimmune: {
    name: 'Autoimmune / Immunology',
    desc: 'Complex eligibility, moderate patient pools',
    sourceVolumeMult: 0.8,
    conversionMult: 0.85,
    screenFailBoost: 10,
    dropoutMult: 1.1,
    costMult: 1.2,
  },
  rare: {
    name: 'Rare / Orphan Disease',
    desc: 'Tiny populations, advocacy-driven, fast approvals',
    sourceVolumeMult: 0.3,
    conversionMult: 1.2,           // motivated patients convert well
    screenFailBoost: -5,
    dropoutMult: 0.7,
    costMult: 1.8,
  },
  pediatric: {
    name: 'Pediatric',
    desc: 'Parental consent required, slower recruitment',
    sourceVolumeMult: 0.6,
    conversionMult: 0.9,
    screenFailBoost: 5,
    dropoutMult: 0.9,
    costMult: 1.3,
  },
};

// Apply a TA preset to the current sources and stages.
//
// Each source/stage stashes its pre-TA values (baseVolume, baseCost,
// baseConversion, baseDropout) on first apply. Switching TAs recomputes
// from those stashed values instead of stacking on the previous TA —
// e.g. Oncology→Vaccines now yields baseline×2.2 (correct) rather than
// baseline×0.7×2.2 (wrong). Clearing the preset (taKey='none') restores
// the stashed baseline and drops the stash fields.
function applyTAPreset(taKey, sources, stages) {
  const ta = TA_PRESETS[taKey];

  // Step 1: reset each item to its pre-TA baseline (if one was stashed).
  const baseSources = sources.map(s => {
    if (s.baseVolume == null && s.baseCost == null) return s;
    const { baseVolume, baseCost, ...rest } = s;
    return {
      ...rest,
      volume: baseVolume != null ? baseVolume : rest.volume,
      costPerPatient: baseCost != null ? baseCost : rest.costPerPatient,
    };
  });
  const baseStages = stages.map(s => {
    if (s.id === 'terminal') return s;
    if (s.baseConversion == null && s.baseDropout == null && s.clippedConv == null) return s;
    const { baseConversion, baseDropout, clippedConv, ...rest } = s;
    return {
      ...rest,
      conversionRate: baseConversion != null ? baseConversion : rest.conversionRate,
      dropoutRate: baseDropout != null ? baseDropout : rest.dropoutRate,
    };
  });

  // Step 2: if clearing, return the reset baseline.
  if (!ta || taKey === 'none') return { sources: baseSources, stages: baseStages };

  // Step 3: apply TA multipliers to the baseline and stash the pre-TA values.
  const newSources = baseSources.map(s => ({
    ...s,
    baseVolume: s.volume,
    baseCost: s.costPerPatient,
    volume: Math.max(1, Math.round(s.volume * (ta.sourceVolumeMult || 1))),
    costPerPatient: Math.round((s.costPerPatient || 0) * (ta.costMult || 1)),
  }));
  const newStages = baseStages.map(s => {
    if (s.id === 'terminal') return s;
    const uncappedConv = Math.round(s.conversionRate * (ta.conversionMult || 1) - (ta.screenFailBoost || 0) * 0.25);
    const cappedConv = Math.min(100, Math.max(5, uncappedConv));
    const out = {
      ...s,
      baseConversion: s.conversionRate,
      baseDropout: s.dropoutRate,
      conversionRate: cappedConv,
      dropoutRate: Math.min(30, Math.max(0, Math.round((s.dropoutRate || 0) * (ta.dropoutMult || 1)))),
    };
    if (uncappedConv > 100) out.clippedConv = uncappedConv;
    return out;
  });
  return { sources: newSources, stages: newStages };
}

// ─── Site Scenario Templates ─────────────────────────────────────────
const SITE_NAMES_POOL = [
  'Memorial Sloan Kettering','MD Anderson Cancer Center','Johns Hopkins Hospital','Mayo Clinic Rochester',
  'Cleveland Clinic','Massachusetts General','Stanford Medical Center','Cedars-Sinai Medical Center',
  'UCSF Medical Center','NYU Langone Health','Duke University Medical','Brigham and Women\'s',
  'Northwestern Memorial','Mount Sinai Hospital','UCLA Medical Center','Emory University Hospital',
  'Vanderbilt University Medical','University of Michigan Health','Penn Medicine','Columbia University Medical',
  'Rush University Medical','Baylor Scott & White','Houston Methodist','University of Chicago Medicine',
  'Oregon Health & Science University','University of Colorado Hospital','Beth Israel Deaconess',
  'University of Pittsburgh Medical','Thomas Jefferson University Hospital','Moffitt Cancer Center',
  'City of Hope','Fox Chase Cancer Center','Roswell Park Cancer Institute','Huntsman Cancer Institute',
  'Winship Cancer Institute','Abramson Cancer Center','Siteman Cancer Center','Kimmel Cancer Center',
  'Lurie Comprehensive Cancer','O\'Neal Comprehensive Cancer','Moores Cancer Center',
  'University of Virginia Health','Froedtert Hospital','Medical University of South Carolina',
  'UC Davis Medical Center','University of Iowa Hospitals','University of Kansas Medical Center',
  'Wake Forest Baptist Medical','Dartmouth-Hitchcock Medical','Henry Ford Health','Intermountain Medical',
  'Scripps Clinic La Jolla','Providence Portland Medical','Swedish Medical Center','Northwell Health',
  'Geisinger Medical Center','Ochsner Medical Center','Baptist Health Jacksonville','Atrium Health Carolinas',
  'AdventHealth Orlando','SSM Health Saint Louis University','Loyola University Medical','Hackensack Meridian',
  'ChristianaCare','MaineHealth','Hartford HealthCare','Spectrum Health Grand Rapids',
  'Mercy Hospital Springfield','Carilion Clinic','Prisma Health','WellSpan York Hospital',
  'MultiCare Health Tacoma','Sentara Norfolk General','BJC HealthCare','Bon Secours Mercy Health',
  'Community Health Network Indianapolis','Tufts Medical Center','George Washington University Hospital',
  'Lenox Hill Hospital','NYP/Weill Cornell Medical','Montefiore Medical Center',
];

function generateSites(count, rateRange, activationSpread) {
  return Array.from({ length: count }, (_, i) => ({
    id: `site_${i}`,
    name: SITE_NAMES_POOL[i % SITE_NAMES_POOL.length] + (i >= SITE_NAMES_POOL.length ? ` (${Math.floor(i / SITE_NAMES_POOL.length) + 1})` : ''),
    enrollmentRate: +(rateRange[0] + Math.random() * (rateRange[1] - rateRange[0])).toFixed(1),
    activationWeek: Math.max(1, Math.round(1 + Math.random() * activationSpread)),
    screenFailRate: Math.round(25 + Math.random() * 25),
    dropoutRate: Math.round(1 + Math.random() * 5),
    costPerPatient: Math.round(1500 + Math.random() * 3500),
    cap: null,
    active: true,
  }));
}

const SITE_SCENARIOS = {
  small: { name: 'Small (Phase 1)', desc: '6 sites, staggered over 4 weeks', generate: () => generateSites(6, [0.5, 2.0], 4) },
  medium: { name: 'Medium (Phase 2/3)', desc: '40 sites, staggered over 8 weeks', generate: () => generateSites(40, [0.5, 4.0], 8) },
  large: { name: 'Large (Global)', desc: '80 sites, staggered over 12 weeks', generate: () => generateSites(80, [0.3, 3.0], 12) },
  // Blank — no sites. For users pasting their own feasibility list via CSV
  // or building up a small portfolio one site at a time.
  blank: { name: 'Blank — no sites', desc: 'Empty portfolio. Import CSV or add sites manually.', generate: () => [] },
};

// ═══════════════════════════════════════════════════════════════════════
// SIMULATION ENGINES
// ═══════════════════════════════════════════════════════════════════════

// Study-level simulation (unchanged)
function simulate(sources, stages, targetN, maxWeeks = 104) {
  const timeline = [], stageUtilization = stages.map(() => []);
  let totalEnrolled = 0;
  const sourceContrib = {};
  sources.forEach(s => { if (s.active !== false) sourceContrib[s.id] = 0; });
  if (stages.length === 0) return { timeline: [], stageUtilization: [], sourcePercents: {}, totalEnrolled: 0, weeksToTarget: null, avgEnrollPerWeek: 0, screenFailRate: 0, costPerEnrolled: 0, totalCost: 0 };
  // Dwell time model: each stage has a delay buffer (ring of weekly slots)
  // Patients enter slot 0, shift right each week. Only patients who've dwelled long enough are eligible for processing.
  const stageDelayBuffers = stages.map(stage => {
    const dwellWeeks = Math.max(1, Math.ceil((stage.avgDurationDays || 1) / 7));
    return { slots: new Array(dwellWeeks).fill(0), ready: 0 };
  });
  for (let week = 0; week < maxWeeks && totalEnrolled < targetN; week++) {
    let weeklyInflow = 0;
    sources.forEach(s => {
      if (s.active === false) return;
      const vol = Math.round(s.volume * Math.min(1, (week + 1) / (s.rampUpWeeks || 1)));
      weeklyInflow += vol;
      sourceContrib[s.id] = (sourceContrib[s.id] || 0) + vol;
    });
    // Add new patients to first stage's delay buffer entry slot
    stageDelayBuffers[0].slots[0] += weeklyInflow;
    for (let i = 0; i < stages.length; i++) {
      const stage = stages[i];
      const buf = stageDelayBuffers[i];
      // Advance the delay buffer: patients in last slot become ready
      buf.ready += buf.slots[buf.slots.length - 1];
      // Shift all slots right (aging patients through dwell time)
      for (let k = buf.slots.length - 1; k > 0; k--) buf.slots[k] = buf.slots[k - 1];
      buf.slots[0] = 0; // clear entry slot for next week's arrivals
      // Process ready patients (capped by throughput)
      const processed = Math.min(buf.ready, stage.throughputPerWeek);
      const totalInStage = buf.ready + buf.slots.reduce((a, b) => a + b, 0);
      stageUtilization[i].push(Math.min(stage.throughputPerWeek > 0 ? totalInStage / stage.throughputPerWeek : 0, 2));
      const advanced = Math.round(processed * (1 - (stage.dropoutRate || 0) / 100) * (stage.conversionRate / 100));
      buf.ready -= processed;
      if (i < stages.length - 1) {
        stageDelayBuffers[i + 1].slots[0] += advanced;
      } else {
        totalEnrolled += Math.min(advanced, targetN - totalEnrolled);
      }
    }
    const totalQueued = stageDelayBuffers.map(b => b.ready + b.slots.reduce((a, v) => a + v, 0));
    timeline.push({ week: week + 1, enrolled: totalEnrolled, weeklyInflow, queues: totalQueued });
  }
  const totalSrc = Object.values(sourceContrib).reduce((a, b) => a + b, 0) || 1;
  const sourcePercents = {}; Object.entries(sourceContrib).forEach(([id, v]) => { sourcePercents[id] = Math.round((v / totalSrc) * 100); });
  const totalIdentified = timeline.reduce((a, t) => a + t.weeklyInflow, 0);
  let totalCost = 0; sources.forEach(s => { if (s.active !== false) totalCost += (sourceContrib[s.id] || 0) * (s.costPerPatient || 0); });
  return {
    timeline, stageUtilization, sourcePercents, totalEnrolled,
    weeksToTarget: totalEnrolled >= targetN ? timeline.length : null,
    avgEnrollPerWeek: timeline.length > 0 ? (totalEnrolled / timeline.length).toFixed(1) : 0,
    screenFailRate: totalIdentified > 0 ? Math.round((1 - totalEnrolled / totalIdentified) * 100) : 0,
    costPerEnrolled: totalEnrolled > 0 ? Math.round(totalCost / totalEnrolled) : 0,
    totalCost,
  };
}

// Site-level simulation
// Per-site ramp-up: linear from 0 → full rate over `rampWeeks` after activation (default 4).
// Optional stochasticity: pass { rng, noise: true } to sample weekly enrollments as Poisson(λ=rate).
// Baseline (no rng) is deterministic — UI default remains smooth; MC path adds noise.
function simulateSites(sites, targetN, maxWeeks = 104, opts = {}) {
  if (!sites.length || !targetN) return { timeline: [], perSiteTotal: {}, totalEnrolled: 0, weeksToTarget: null, avgEnrollPerWeek: 0, screenFailRate: 0, activeSiteCount: 0 };
  const { rng = null, noise = false } = opts;
  const timeline = [];
  let totalEnrolled = 0;
  const perSiteTotal = {};
  sites.forEach(s => { perSiteTotal[s.id] = 0; });

  for (let week = 0; week < maxWeeks && totalEnrolled < targetN; week++) {
    let weeklyNew = 0;
    const perSiteWeek = {};
    sites.forEach(s => {
      if (!s.active || (week + 1) < s.activationWeek) return;
      if (s.cap && perSiteTotal[s.id] >= s.cap) return;
      // Ramp-up: sites don't hit steady state on day 1. Linear ramp over rampWeeks (default 4).
      const rampWeeks = Math.max(0, s.rampWeeks == null ? 4 : s.rampWeeks);
      const weeksSinceActivation = (week + 1) - s.activationWeek;
      const rampFactor = rampWeeks > 0 ? Math.min(1, (weeksSinceActivation + 1) / rampWeeks) : 1;
      const rate = s.enrollmentRate * rampFactor;
      const screened = noise && rng ? poisson(rng, rate) : rate;
      const passScreen = screened * (1 - (s.screenFailRate || 0) / 100);
      const enrolled = passScreen * (1 - (s.dropoutRate || 0) / 100);
      let actual = Math.min(enrolled, targetN - totalEnrolled);
      if (s.cap) actual = Math.min(actual, s.cap - perSiteTotal[s.id]);
      actual = Math.max(0, +actual.toFixed(2));
      perSiteTotal[s.id] += actual;
      weeklyNew += actual;
      perSiteWeek[s.id] = actual;
    });
    totalEnrolled += weeklyNew;
    timeline.push({ week: week + 1, enrolled: Math.round(totalEnrolled), weeklyNew: +weeklyNew.toFixed(1), perSiteWeek });
  }

  const activeSites = sites.filter(s => s.active);
  const avgSF = activeSites.length > 0 ? Math.round(activeSites.reduce((a, s) => a + s.screenFailRate, 0) / activeSites.length) : 0;
  // Cost: sum each site's enrolled * costPerPatient
  let totalCost = 0;
  activeSites.forEach(s => { totalCost += (perSiteTotal[s.id] || 0) * (s.costPerPatient || 0); });
  const costPerEnrolled = totalEnrolled > 0 ? Math.round(totalCost / totalEnrolled) : 0;

  return {
    timeline,
    perSiteTotal,
    totalEnrolled: Math.round(totalEnrolled),
    weeksToTarget: totalEnrolled >= targetN ? timeline.length : null,
    avgEnrollPerWeek: timeline.length > 0 ? (totalEnrolled / timeline.length).toFixed(1) : 0,
    screenFailRate: avgSF,
    activeSiteCount: activeSites.length,
    costPerEnrolled,
    totalCost: Math.round(totalCost),
  };
}

// ─── Single-Site Templates ───────────────────────────────────────────
const SS_TEMPLATES = {
  academic: { name: 'Academic Medical Center', desc: 'Long IRB, complex contracts, high volume',
    identity: { name: 'Academic Medical Center', piName: 'Dr. Smith', coordinatorCount: 3 },
    startup: {
      regulatory: [{ id: 'r1', name: 'IRB Submission', startWeek: 1, durationWeeks: 2 }, { id: 'r2', name: 'IRB Review & Approval', startWeek: 3, durationWeeks: 6 }, { id: 'r3', name: 'Regulatory Close-out', startWeek: 9, durationWeeks: 1 }],
      legal: [{ id: 'l1', name: 'CDA / NDA', startWeek: 1, durationWeeks: 2 }, { id: 'l2', name: 'Site Contract', startWeek: 2, durationWeeks: 5 }, { id: 'l3', name: 'Budget Negotiation', startWeek: 3, durationWeeks: 5 }],
      operational: [{ id: 'o1', name: 'Equipment & Supplies', startWeek: 5, durationWeeks: 3 }, { id: 'o2', name: 'Staff Training', startWeek: 7, durationWeeks: 2 }, { id: 'o3', name: 'Site Initiation Visit', startWeek: 9, durationWeeks: 1 }],
    },
    referrals: [{ id: 'ref1', name: 'Physician Referral', volumePerWeek: 4, costPerPatient: 350 }, { id: 'ref2', name: 'EHR Screening', volumePerWeek: 6, costPerPatient: 150 }, { id: 'ref3', name: 'Self-referral', volumePerWeek: 1, costPerPatient: 50 }],
    funnel: [
      { id: 'f1', name: 'Pre-screened', conversionRate: 55, durationDays: 5, dropoutRate: 2 },
      { id: 'f2', name: 'Consented', conversionRate: 75, durationDays: 7, dropoutRate: 2 },
      { id: 'f3', name: 'Screened', conversionRate: 45, durationDays: 14, dropoutRate: 3 },
      { id: 'ft', name: 'Randomized', conversionRate: 100, durationDays: 0, dropoutRate: 0 },
    ],
    maxConcurrent: 20, targetN: 15,
  },
  community: { name: 'Community Hospital', desc: 'Moderate timelines, mid volume',
    identity: { name: 'Community Hospital', piName: 'Dr. Jones', coordinatorCount: 2 },
    startup: {
      regulatory: [{ id: 'r1', name: 'IRB Submission', startWeek: 1, durationWeeks: 1 }, { id: 'r2', name: 'IRB Review & Approval', startWeek: 2, durationWeeks: 4 }, { id: 'r3', name: 'Regulatory Close-out', startWeek: 6, durationWeeks: 1 }],
      legal: [{ id: 'l1', name: 'CDA / NDA', startWeek: 1, durationWeeks: 1 }, { id: 'l2', name: 'Site Contract', startWeek: 2, durationWeeks: 3 }, { id: 'l3', name: 'Budget Negotiation', startWeek: 2, durationWeeks: 3 }],
      operational: [{ id: 'o1', name: 'Equipment & Supplies', startWeek: 3, durationWeeks: 2 }, { id: 'o2', name: 'Staff Training', startWeek: 5, durationWeeks: 1 }, { id: 'o3', name: 'Site Initiation Visit', startWeek: 6, durationWeeks: 1 }],
    },
    referrals: [{ id: 'ref1', name: 'Physician Referral', volumePerWeek: 3, costPerPatient: 350 }, { id: 'ref2', name: 'EHR Screening', volumePerWeek: 3, costPerPatient: 150 }, { id: 'ref3', name: 'Self-referral', volumePerWeek: 1, costPerPatient: 50 }],
    funnel: [
      { id: 'f1', name: 'Pre-screened', conversionRate: 60, durationDays: 5, dropoutRate: 2 },
      { id: 'f2', name: 'Consented', conversionRate: 80, durationDays: 5, dropoutRate: 1 },
      { id: 'f3', name: 'Screened', conversionRate: 55, durationDays: 10, dropoutRate: 2 },
      { id: 'ft', name: 'Randomized', conversionRate: 100, durationDays: 0, dropoutRate: 0 },
    ],
    maxConcurrent: 12, targetN: 10,
  },
  research: { name: 'Dedicated Research Site', desc: 'Fast startup, high volume, low screen fail',
    identity: { name: 'Dedicated Research Center', piName: 'Dr. Chen', coordinatorCount: 4 },
    startup: {
      regulatory: [{ id: 'r1', name: 'IRB Submission', startWeek: 1, durationWeeks: 1 }, { id: 'r2', name: 'IRB Review & Approval', startWeek: 2, durationWeeks: 2 }, { id: 'r3', name: 'Regulatory Close-out', startWeek: 4, durationWeeks: 1 }],
      legal: [{ id: 'l1', name: 'CDA / NDA', startWeek: 1, durationWeeks: 1 }, { id: 'l2', name: 'Site Contract', startWeek: 1, durationWeeks: 3 }, { id: 'l3', name: 'Budget Negotiation', startWeek: 2, durationWeeks: 2 }],
      operational: [{ id: 'o1', name: 'Equipment & Supplies', startWeek: 2, durationWeeks: 2 }, { id: 'o2', name: 'Staff Training', startWeek: 3, durationWeeks: 1 }, { id: 'o3', name: 'Site Initiation Visit', startWeek: 4, durationWeeks: 1 }],
    },
    referrals: [{ id: 'ref1', name: 'Physician Referral', volumePerWeek: 5, costPerPatient: 300 }, { id: 'ref2', name: 'EHR Screening', volumePerWeek: 8, costPerPatient: 120 }, { id: 'ref3', name: 'Database Mining', volumePerWeek: 4, costPerPatient: 80 }, { id: 'ref4', name: 'Self-referral', volumePerWeek: 2, costPerPatient: 30 }],
    funnel: [
      { id: 'f1', name: 'Pre-screened', conversionRate: 70, durationDays: 3, dropoutRate: 1 },
      { id: 'f2', name: 'Consented', conversionRate: 85, durationDays: 5, dropoutRate: 1 },
      { id: 'f3', name: 'Screened', conversionRate: 65, durationDays: 7, dropoutRate: 2 },
      { id: 'ft', name: 'Randomized', conversionRate: 100, durationDays: 0, dropoutRate: 0 },
    ],
    maxConcurrent: 25, targetN: 20,
  },
  // Blank — empty identity, zero startup / referrals, minimal funnel. Lets
  // users build up a custom single-site config without deleting the academic
  // / community / research presets' pre-populated milestones one by one.
  blank: { name: 'Blank — start from scratch', desc: 'Empty startup, no referrals, minimal funnel.',
    identity: { name: '', piName: '', coordinatorCount: 1 },
    startup: { regulatory: [], legal: [], operational: [] },
    referrals: [],
    funnel: [
      { id: 'f1', name: 'Pre-screened', conversionRate: 60, durationDays: 5, dropoutRate: 2 },
      { id: 'ft', name: 'Randomized', conversionRate: 100, durationDays: 0, dropoutRate: 0 },
    ],
    maxConcurrent: 10, targetN: 10,
  },
};

const TRACK_COLORS = { regulatory: '#3e73a8', legal: '#b07d20', operational: '#2d7a50' };
const TRACK_LABELS = { regulatory: 'Regulatory', legal: 'Legal', operational: 'Operational' };

// ─── Single-Site Simulation ──────────────────────────────────────────
function computeFPI(startup) {
  let maxEnd = 0;
  Object.values(startup).forEach(track => {
    track.forEach(m => { maxEnd = Math.max(maxEnd, m.startWeek + m.durationWeeks); });
  });
  return maxEnd + 1;
}

function simulateSingleSite(config, maxWeeks = 104) {
  const fpi = computeFPI(config.startup);
  const targetN = config.targetN || 20;
  if (!config.referrals || !config.referrals.length || !config.funnel || !config.funnel.length) return { timeline: [], fpi, totalEnrolled: 0, targetN, weeksToTarget: null, avgEnrollPerWeek: 0, screenFailRate: 0, effectiveRate: 0 };
  const timeline = [];
  let totalEnrolled = 0;
  const totalRefVol = config.referrals.reduce((a, r) => a + r.volumePerWeek, 0);
  // Weighted cost per referral patient
  const weightedCostPerRef = totalRefVol > 0 ? config.referrals.reduce((a, r) => a + r.volumePerWeek * (r.costPerPatient || 0), 0) / totalRefVol : 0;
  // FIFO capacity model: track when each enrolled patient's treatment ends
  const treatmentDuration = config.treatmentDuration || 12;
  const activePatients = []; // array of end-weeks

  for (let week = 0; week < maxWeeks; week++) {
    if (totalEnrolled >= targetN) break;
    const weekNum = week + 1;
    let weeklyEnrolled = 0;
    // Release patients whose treatment has ended
    while (activePatients.length > 0 && activePatients[0] <= weekNum) activePatients.shift();
    if (weekNum >= fpi) {
      let candidates = totalRefVol;
      for (const stage of config.funnel) {
        if (stage.conversionRate >= 100) break;
        candidates = candidates * (stage.conversionRate / 100) * (1 - (stage.dropoutRate || 0) / 100);
      }
      // Coordinator FTEs scale effective capacity: ~8 concurrent patients per coordinator
      const effCapacity = config.coordinatorFTEs ? Math.min(config.maxConcurrent || 999, config.coordinatorFTEs * 8) : (config.maxConcurrent || 999);
      const capacityLeft = Math.max(0, effCapacity - activePatients.length);
      weeklyEnrolled = Math.min(candidates, capacityLeft, targetN - totalEnrolled);
      weeklyEnrolled = Math.max(0, +weeklyEnrolled.toFixed(2));
      totalEnrolled += weeklyEnrolled;
      // Add enrolled patients to FIFO with their treatment end week
      const patientsToAdd = Math.round(weeklyEnrolled);
      for (let p = 0; p < patientsToAdd; p++) activePatients.push(weekNum + treatmentDuration);
    }
    timeline.push({ week: weekNum, enrolled: Math.round(totalEnrolled), weeklyNew: +weeklyEnrolled.toFixed(1), phase: weekNum < fpi ? 'startup' : 'enrollment' });
  }

  const enrollWeeks = timeline.filter(t => t.phase === 'enrollment');
  const overallSF = config.funnel.reduce((acc, s) => s.conversionRate < 100 ? acc * (s.conversionRate / 100) : acc, 1);
  // Cost: total screened patients * weighted cost per referral
  const totalScreened = totalRefVol * enrollWeeks.length;
  const totalCost = Math.round(totalScreened * weightedCostPerRef);
  const costPerEnrolled = totalEnrolled > 0 ? Math.round(totalCost / totalEnrolled) : 0;
  return {
    timeline, fpi, totalEnrolled: Math.round(totalEnrolled), targetN,
    weeksToTarget: totalEnrolled >= targetN ? timeline.length : null,
    avgEnrollPerWeek: enrollWeeks.length > 0 ? (totalEnrolled / enrollWeeks.length).toFixed(1) : 0,
    screenFailRate: Math.round((1 - overallSF) * 100),
    effectiveRate: +(totalRefVol * overallSF).toFixed(1),
    costPerEnrolled, totalCost,
  };
}

// ─── Diagnostic engine: detect issues, suggest fixes ─────────────────
function diagnose({ sources, stages, targetN, result }) {
  const issues = [];
  if (!sources || !stages || !result || !result.timeline) return issues;
  const activeSources = sources.filter(s => s.active !== false);
  // 1. Didn't hit target
  if (!result.weeksToTarget) {
    const deficit = targetN - result.totalEnrolled;
    issues.push({ severity: 'critical', title: `Target not met: ${result.totalEnrolled}/${targetN}`, body: `Enrollment fell ${deficit} patients short after 104 weeks. Consider increasing source volumes, relaxing eligibility (raise conversion rates), or adding new sources.` });
  }
  // 2. Bottlenecks from utilization
  const avgUtilByStage = stages.map((_, i) => { const u = (result.stageUtilization[i] || []).slice(-10); return u.length ? u.reduce((a, b) => a + b, 0) / u.length : 0; });
  stages.forEach((s, i) => {
    if (s.id === 'terminal') return;
    const u = avgUtilByStage[i];
    if (u > 1.2) {
      const suggested = Math.ceil(s.throughputPerWeek * 1.3);
      issues.push({ severity: 'high', title: `Bottleneck at "${s.name}"`, body: `This stage is running at ${Math.round(u * 100)}% capacity (queue exceeds throughput). Raising throughput from ${s.throughputPerWeek}/wk to ${suggested}/wk could accelerate the funnel.` });
    }
  });
  // 3. Low conversion stages
  stages.forEach(s => {
    if (s.id === 'terminal') return;
    if (s.conversionRate < 35) {
      issues.push({ severity: 'medium', title: `Low conversion at "${s.name}"`, body: `Only ${s.conversionRate}% of patients advance past this stage. Review eligibility criteria or add pre-screening to reduce screen failure.` });
    }
  });
  // 4. Overall screen fail too high
  if (result.screenFailRate > 85) {
    issues.push({ severity: 'high', title: `Screen failure rate is very high (${result.screenFailRate}%)`, body: `Most identified patients aren't reaching enrollment. Consider loosening inclusion criteria at the stage with the lowest conversion, or shifting to higher-quality sources.` });
  }
  // 5. Single source dominance
  if (activeSources.length > 1 && result.sourcePercents) {
    const top = Object.entries(result.sourcePercents).sort((a, b) => b[1] - a[1])[0];
    if (top && top[1] > 55) {
      const srcName = (activeSources.find(s => s.id === top[0]) || {}).name || top[0];
      issues.push({ severity: 'medium', title: `Source concentration risk: "${srcName}" = ${top[1]}%`, body: `Over half your patients come from one source. If that channel underperforms, enrollment stalls. Diversify by activating additional source types.` });
    }
  }
  // 6. Cost per enrolled above benchmark
  if (result.costPerEnrolled > 5000) {
    issues.push({ severity: 'medium', title: `Cost per enrolled is high ($${result.costPerEnrolled.toLocaleString()})`, body: `Industry typical is $1,500-$5,000. Look for lower-cost channels (agentic outreach, AI pre-screening), or reduce reliance on expensive sources like digital ads.` });
  }
  // 7. Severe ramp-up delays on primary sources
  const slowRampSources = activeSources.filter(s => s.volume > 15 && s.rampUpWeeks > 5);
  if (slowRampSources.length) {
    const names = slowRampSources.map(s => s.name).join(', ');
    issues.push({ severity: 'low', title: `Slow ramp-up on high-volume sources`, body: `${names} need ${Math.max(...slowRampSources.map(s => s.rampUpWeeks))}+ weeks to reach full volume. Parallel activation or earlier contracting could pull FPI forward.` });
  }
  // 8. All good
  if (!issues.length) issues.push({ severity: 'good', title: 'No issues detected', body: 'Your current configuration looks well-balanced. Try a Monte Carlo run to see the uncertainty ranges.' });
  return issues;
}

// ─── Monte Carlo: P10/P50/P90 enrollment fan ───────────────────────
// Adds log-normal noise to source rates and stage conversions, runs N iterations,
// returns per-week percentile bands and completion-week distribution.
function montecarlo(sources, stages, targetN, iterations = 200, varianceSigma = 0.25, maxWeeks = 104) {
  if (!stages.length || !sources.length) return null;
  // Deterministic seed from config — same inputs yield same fan (no jitter on re-render).
  const seed = hashSeed({ sources, stages, targetN, iterations, varianceSigma, maxWeeks });
  const rng = mulberry32(seed);
  const runs = [];
  for (let iter = 0; iter < iterations; iter++) {
    const ps = sources.map(s => ({ ...s, volume: Math.max(0, s.volume * lognorm(rng, varianceSigma)) }));
    const pstg = stages.map(s => ({ ...s,
      conversionRate: Math.min(100, Math.max(0, s.conversionRate * lognorm(rng, varianceSigma))),
      dropoutRate: Math.min(100, Math.max(0, (s.dropoutRate || 0) * lognorm(rng, varianceSigma))),
    }));
    const r = simulate(ps, pstg, targetN, maxWeeks);
    runs.push({ timeline: r.timeline, weeksToTarget: r.weeksToTarget });
  }
  // Collect per-week enrollment distribution
  const bands = [];
  for (let w = 0; w < maxWeeks; w++) {
    const values = runs.map(r => (r.timeline[w] && r.timeline[w].enrolled) || (r.timeline.length > 0 ? r.timeline[r.timeline.length - 1].enrolled : 0));
    values.sort((a, b) => a - b);
    bands.push({
      week: w + 1,
      p10: values[Math.floor(iterations * 0.1)],
      p50: values[Math.floor(iterations * 0.5)],
      p90: values[Math.floor(iterations * 0.9)],
    });
  }
  // Completion week distribution
  const completionWeeks = runs.map(r => r.weeksToTarget || maxWeeks + 1).sort((a, b) => a - b);
  const prob = { p10: completionWeeks[Math.floor(iterations * 0.1)], p50: completionWeeks[Math.floor(iterations * 0.5)], p90: completionWeeks[Math.floor(iterations * 0.9)] };
  const completed = runs.filter(r => r.weeksToTarget).length;
  return { bands, prob, completedPct: Math.round((completed / iterations) * 100), iterations };
}

// ─── Monte Carlo for Multi-Site View ─────────────────────────────────
// Perturbs per-site enrollment rate + screen-fail + ramp length, samples Poisson weekly.
//
// Variance is split between a portfolio-level common factor and per-site
// idiosyncratic noise. Without the common factor, N independent sites average
// out → variance collapses ~1/sqrt(N) → the fan at 40 sites is ≤1 week wide,
// which understates real portfolio risk. In practice, sites share correlated
// shocks: protocol amendments, unblinding, regulatory delays, therapeutic
// class headwinds. commonWeight (0..1) controls how much of varianceSigma is
// shared across sites each iteration; 0.7 reproduces the roughly ±25-35% P10-P90
// band seen in TransCelerate / Tufts portfolio-level studies for Ph 2/3.
function montecarloSites(sites, targetN, iterations = 200, varianceSigma = 0.25, maxWeeks = 104, commonWeight = 0.7) {
  if (!sites.length || !targetN) return null;
  const seed = hashSeed({ sites, targetN, iterations, varianceSigma, maxWeeks, commonWeight, kind: 'sites' });
  const rng = mulberry32(seed);
  // Split total sigma into correlated (shared) and idiosyncratic (per-site)
  // components such that the variance sum matches varianceSigma^2.
  const sharedSigma = varianceSigma * Math.sqrt(commonWeight);
  const idioSigma  = varianceSigma * Math.sqrt(1 - commonWeight);
  const runs = [];
  for (let iter = 0; iter < iterations; iter++) {
    // One portfolio-level shock applied to every site this iteration.
    const portfolioRateShock = lognorm(rng, sharedSigma);
    const portfolioSFShock   = lognorm(rng, sharedSigma * 0.5);
    const portfolioRampShock = lognorm(rng, sharedSigma * 0.5);
    const ps = sites.map(s => ({
      ...s,
      enrollmentRate: Math.max(0, s.enrollmentRate * portfolioRateShock * lognorm(rng, idioSigma)),
      screenFailRate: Math.min(100, Math.max(0, (s.screenFailRate || 0) * portfolioSFShock * lognorm(rng, idioSigma * 0.5))),
      rampWeeks: Math.max(0, (s.rampWeeks == null ? 4 : s.rampWeeks) * portfolioRampShock * lognorm(rng, idioSigma * 0.5)),
    }));
    const r = simulateSites(ps, targetN, maxWeeks, { rng, noise: true });
    runs.push({ timeline: r.timeline, weeksToTarget: r.weeksToTarget });
  }
  const bands = [];
  for (let w = 0; w < maxWeeks; w++) {
    const values = runs.map(r => (r.timeline[w] && r.timeline[w].enrolled) || (r.timeline.length > 0 ? r.timeline[r.timeline.length - 1].enrolled : 0));
    values.sort((a, b) => a - b);
    bands.push({ week: w + 1, p10: values[Math.floor(iterations * 0.1)], p50: values[Math.floor(iterations * 0.5)], p90: values[Math.floor(iterations * 0.9)] });
  }
  const completionWeeks = runs.map(r => r.weeksToTarget || maxWeeks + 1).sort((a, b) => a - b);
  const prob = { p10: completionWeeks[Math.floor(iterations * 0.1)], p50: completionWeeks[Math.floor(iterations * 0.5)], p90: completionWeeks[Math.floor(iterations * 0.9)] };
  const completed = runs.filter(r => r.weeksToTarget).length;
  return { bands, prob, completedPct: Math.round((completed / iterations) * 100), iterations };
}

// ─── Monte Carlo for Single Site View ────────────────────────────────
// Perturbs referral volumes and funnel conversion rates. Startup duration stays
// deterministic — users tune Gantt bars directly and expect those values to hold.
function montecarloSingleSite(config, iterations = 200, varianceSigma = 0.25, maxWeeks = 104) {
  if (!config || !config.referrals || !config.referrals.length || !config.funnel || !config.funnel.length) return null;
  const seed = hashSeed({ config, iterations, varianceSigma, maxWeeks, kind: 'single' });
  const rng = mulberry32(seed);
  const runs = [];
  for (let iter = 0; iter < iterations; iter++) {
    const pc = {
      ...config,
      referrals: config.referrals.map(r => ({ ...r, volumePerWeek: Math.max(0, r.volumePerWeek * lognorm(rng, varianceSigma)) })),
      funnel: config.funnel.map(f => ({ ...f,
        conversionRate: Math.min(100, Math.max(0, f.conversionRate * lognorm(rng, varianceSigma))),
        dropoutRate: Math.min(100, Math.max(0, (f.dropoutRate || 0) * lognorm(rng, varianceSigma))),
      })),
    };
    const r = simulateSingleSite(pc, maxWeeks);
    runs.push({ timeline: r.timeline, weeksToTarget: r.weeksToTarget });
  }
  const bands = [];
  for (let w = 0; w < maxWeeks; w++) {
    const values = runs.map(r => (r.timeline[w] && r.timeline[w].enrolled) || (r.timeline.length > 0 ? r.timeline[r.timeline.length - 1].enrolled : 0));
    values.sort((a, b) => a - b);
    bands.push({ week: w + 1, p10: values[Math.floor(iterations * 0.1)], p50: values[Math.floor(iterations * 0.5)], p90: values[Math.floor(iterations * 0.9)] });
  }
  const completionWeeks = runs.map(r => r.weeksToTarget || maxWeeks + 1).sort((a, b) => a - b);
  const prob = { p10: completionWeeks[Math.floor(iterations * 0.1)], p50: completionWeeks[Math.floor(iterations * 0.5)], p90: completionWeeks[Math.floor(iterations * 0.9)] };
  const completed = runs.filter(r => r.weeksToTarget).length;
  return { bands, prob, completedPct: Math.round((completed / iterations) * 100), iterations };
}

// ═══════════════════════════════════════════════════════════════════════
// ASSUMPTION CITATIONS
// Every default in the app is sourced here. Surfaced inline in the UI via
// <Cited id="..."> so planners can see and push back on any number.
// ═══════════════════════════════════════════════════════════════════════
const ASSUMPTIONS = {
  'source.vol.clinical':   { text: 'Clinical-source default volumes (8–25/wk) are midpoints of Tufts CSDD 2023 feasibility survey ranges across Ph 2/3 interventional trials.', source: 'Tufts CSDD 2023', kind: 'estimate' },
  'source.vol.digital':    { text: 'Digital-source defaults (5–25/wk) from Antidote/Clara Health 2022 patient recruitment benchmarks for US Ph 2/3.', source: 'Antidote/Clara 2022', kind: 'estimate' },
  'source.vol.agentic':    { text: 'Agentic AI source volumes (10–30/wk) are AIMR projections based on 2025 pilots — these are scenario assumptions, not observed benchmarks.', source: 'AIMR 2025 projection', kind: 'projection' },
  'funnel.screenfail':     { text: 'Screen failure defaults (20–75%) reflect CISCRP Perceptions & Insights 2023 industry median by phase; Oncology/Rare skew higher.', source: 'CISCRP 2023', kind: 'estimate' },
  'funnel.conversion':     { text: 'Conversion rates between funnel stages are fitted to CDISC Protocol Complexity data and vary by indication. Phase 1 screening conversion is tightest (~25%).', source: 'CDISC / Tufts', kind: 'estimate' },
  'site.ramp':             { text: 'Site ramp-up defaults to 4 weeks to reach steady state (SSU → FPI → stable referral). Tufts CSDD: median 3–6 weeks post-SIV.', source: 'Tufts CSDD', kind: 'estimate' },
  'site.cap':              { text: 'Per-coordinator capacity of ~8 concurrent active patients is an industry rule-of-thumb; varies with protocol complexity.', source: 'SCRS 2022 coordinator benchmarks', kind: 'rule-of-thumb' },
  'startup.academic':      { text: 'Academic AMC startup durations (IRB 6 wk, contract 5 wk) from CTTI 2021 site activation benchmarks; critical path typically 10–12 weeks.', source: 'CTTI 2021', kind: 'estimate' },
  'startup.community':     { text: 'Community hospital startup: IRB 3–4 wk (reliance), contract 3 wk; faster than AMC but lower referral volume.', source: 'CTTI 2021', kind: 'estimate' },
  'startup.research':      { text: 'Dedicated research site startup: 2 wk IRB (central), 2 wk contract; fastest activation, highest enrollment rate.', source: 'SCRS 2022', kind: 'estimate' },
  'ta.oncology':           { text: 'Oncology: 30% lower source volume, 25% lower conversion, +15% screen fail vs generic — IQVIA 2023 therapeutic benchmarks.', source: 'IQVIA 2023', kind: 'estimate' },
  'ta.vaccines':           { text: 'Vaccines: 2.2× volume, 1.25× conversion, −15% screen fail — driven by large eligible populations (COVID-era benchmarks).', source: 'CEPI / WHO 2022', kind: 'estimate' },
  'ta.cns':                { text: 'CNS: 1.6× dropout (placebo response, discontinuation). Eligibility moderate; volumes near baseline.', source: 'CNS Summit 2023', kind: 'estimate' },
  'ta.rare':               { text: 'Rare disease: 0.3× volume, 1.2× conversion (motivated patients), advocacy-driven recruitment. 1.8× cost-per-patient.', source: 'NORD 2022', kind: 'estimate' },
  'ta.pediatric':          { text: 'Pediatric: 0.6× volume (parental consent friction), +5% screen fail, 1.3× cost.', source: 'I-ACT 2023', kind: 'estimate' },
  'ta.cardiovascular':     { text: 'Cardiovascular: common disease, moderate eligibility. 1.3× volume, 1.05× conversion vs generic.', source: 'ACC 2022', kind: 'estimate' },
  'ta.metabolic':          { text: 'Metabolic/Diabetes: 1.5× volume (large eligible pool), moderate conversion, 1.1× dropout.', source: 'ADA 2023', kind: 'estimate' },
  'ta.infectious':         { text: 'Infectious disease: event-driven enrollment, 1.1× volume and conversion, lower screen fail.', source: 'IDSA 2022', kind: 'estimate' },
  'ta.autoimmune':         { text: 'Autoimmune: complex eligibility (biomarkers, washout). 0.8× volume, 0.85× conversion, 1.2× cost.', source: 'ACR 2022', kind: 'estimate' },
  'mc.sigma':              { text: 'Monte Carlo default σ=0.25 on a lognormal multiplier yields roughly ±30% 1-σ spread on rates — in line with observed sponsor-to-sponsor variance for similar protocols.', source: 'Tufts CSDD variance analysis', kind: 'estimate' },
  'mc.method':             { text: 'Monte Carlo: 200 iterations, lognormal multiplicative noise on source volumes and stage conversions; Poisson weekly arrivals in Multi-Site view. Seeded PRNG — same config yields the same fan.', source: 'AIMR methodology', kind: 'method' },
  'agentic.caveat':        { text: '⚠ Agentic / AI sources are scenario assumptions, not observed benchmarks. Treat them as "what if this channel performs at X" — calibrate against your own pilots before planning.', source: 'AIMR disclosure', kind: 'disclaimer' },
};
