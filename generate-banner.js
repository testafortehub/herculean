const fs   = require('fs');
const path = require('path');

const FONT_DIR = 'C:/Users/robva/AppData/Roaming/Claude/local-agent-mode-sessions/skills-plugin/1856c1c3-44d0-4156-b03e-8bb0a680b8f1/ce4bde00-c80f-4d38-afa2-218d5a27c6ed/skills/canvas-design/canvas-fonts';

const titleFont = fs.readFileSync(path.join(FONT_DIR, 'BigShoulders-Bold.ttf')).toString('base64');
const monoFont  = fs.readFileSync(path.join(FONT_DIR, 'GeistMono-Regular.ttf')).toString('base64');
const lightFont = fs.readFileSync(path.join(FONT_DIR, 'Jura-Light.ttf')).toString('base64');

const W = 1920, H = 1080;
const PANEL_TOP = 160, PANEL_BOT = H - 160;
const COLS = 10, COL_W = W / COLS;
const PANEL_H = PANEL_BOT - PANEL_TOP;
const GRID = 60;

// ── Grid lines ────────────────────────────────────────────────────────────────
let gridLines = '';
for (let x = 0; x <= W; x += GRID)
  gridLines += `<line x1="${x}" y1="0" x2="${x}" y2="${H}" stroke="rgba(201,162,39,0.055)" stroke-width="0.5"/>`;
for (let y = 0; y <= H; y += GRID)
  gridLines += `<line x1="0" y1="${y}" x2="${W}" y2="${y}" stroke="rgba(201,162,39,0.055)" stroke-width="0.5"/>`;

// ── Grid dots ─────────────────────────────────────────────────────────────────
let gridDots = '';
for (let x = 0; x <= W; x += GRID)
  for (let y = 0; y <= H; y += GRID)
    gridDots += `<circle cx="${x}" cy="${y}" r="1.2" fill="rgba(201,162,39,0.12)"/>`;

// ── 10 AI column panels ───────────────────────────────────────────────────────
let panels = '';
for (let i = 0; i < COLS; i++) {
  const x      = i * COL_W;
  const innerX = x + 12;
  const innerW = COL_W - 24;
  const alpha  = i % 2 === 0 ? 0.025 : 0.012;

  panels += `<rect x="${innerX}" y="${PANEL_TOP}" width="${innerW}" height="${PANEL_H}" fill="rgba(201,162,39,${alpha})"/>`;

  const lineAlpha = i === 0 ? 0.55 : 0.18;
  const lineW     = i === 0 ? 1.5  : 0.75;
  panels += `<line x1="${innerX}" y1="${PANEL_TOP}" x2="${innerX}" y2="${PANEL_BOT}" stroke="rgba(201,162,39,${lineAlpha})" stroke-width="${lineW}"/>`;

  // Simulated text lines — deterministic widths
  const lineCount   = 7 + (i % 3);
  const lineStartY  = PANEL_TOP + 28;
  const lineSpacing = 22;
  const widths = [0.88, 0.62, 0.75, 0.50, 0.82, 0.68, 0.55, 0.78, 0.60, 0.90];
  for (let l = 0; l < lineCount; l++) {
    const lw    = innerW * widths[(i + l) % widths.length];
    const la    = 0.06 + (l % 3 === 0 ? 0.04 : 0);
    const ly    = lineStartY + l * lineSpacing;
    panels += `<rect x="${innerX + 8}" y="${ly}" width="${lw}" height="2.5" fill="rgba(201,162,39,${la})"/>`;
  }

  // AI label
  const label = `AI.${String(i + 1).padStart(2, '0')}`;
  panels += `<text x="${innerX + innerW / 2}" y="${PANEL_BOT - 8}" text-anchor="middle" font-family="GeistMono" font-size="11" fill="rgba(201,162,39,0.22)">${label}</text>`;
}

// Right border
panels += `<line x1="${W - 12}" y1="${PANEL_TOP}" x2="${W - 12}" y2="${PANEL_BOT}" stroke="rgba(201,162,39,0.18)" stroke-width="0.75"/>`;

// ── Corner marks ──────────────────────────────────────────────────────────────
const corners = [[40,40],[W-40,40],[40,H-40],[W-40,H-40]];
let cornerMarks = '';
const ARM = 16;
corners.forEach(([cx, cy]) => {
  const sx = cx < W/2 ? 1 : -1, sy = cy < H/2 ? 1 : -1;
  cornerMarks += `<line x1="${cx}" y1="${cy}" x2="${cx + sx*ARM}" y2="${cy}" stroke="rgba(201,162,39,0.3)" stroke-width="1"/>`;
  cornerMarks += `<line x1="${cx}" y1="${cy}" x2="${cx}" y2="${cy + sy*ARM}" stroke="rgba(201,162,39,0.3)" stroke-width="1"/>`;
  cornerMarks += `<circle cx="${cx}" cy="${cy}" r="2" fill="rgba(201,162,39,0.4)"/>`;
});

// ── Diamond accent ────────────────────────────────────────────────────────────
const dX = W/2, dY = H * 0.575;
const diamond = `<rect x="${dX-4}" y="${dY-4}" width="8" height="8" fill="rgba(232,197,71,0.85)" transform="rotate(45,${dX},${dY})"/>`;

const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
<defs>
  <style>
    @font-face { font-family: 'BigShoulders'; src: url('data:font/truetype;base64,${titleFont}') format('truetype'); font-weight: bold; }
    @font-face { font-family: 'GeistMono';   src: url('data:font/truetype;base64,${monoFont}')  format('truetype'); }
    @font-face { font-family: 'Jura';        src: url('data:font/truetype;base64,${lightFont}') format('truetype'); font-weight: 300; }
  </style>
  <!-- Background gradient -->
  <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1" gradientUnits="objectBoundingBox">
    <stop offset="0"   stop-color="#08080f"/>
    <stop offset="0.5" stop-color="#0a0a14"/>
    <stop offset="1"   stop-color="#050508"/>
  </linearGradient>
  <!-- Gold rule gradient -->
  <linearGradient id="rule" x1="0" y1="0" x2="1" y2="0" gradientUnits="objectBoundingBox">
    <stop offset="0"    stop-color="rgba(201,162,39,0)"/>
    <stop offset="0.15" stop-color="rgba(201,162,39,0.7)"/>
    <stop offset="0.5"  stop-color="#e8c547"/>
    <stop offset="0.85" stop-color="rgba(201,162,39,0.7)"/>
    <stop offset="1"    stop-color="rgba(201,162,39,0)"/>
  </linearGradient>
  <!-- Center overlay -->
  <linearGradient id="overlay" x1="0" y1="0" x2="1" y2="0" gradientUnits="objectBoundingBox">
    <stop offset="0"   stop-color="rgba(5,5,10,0)"/>
    <stop offset="0.1" stop-color="rgba(5,5,10,0.85)"/>
    <stop offset="0.9" stop-color="rgba(5,5,10,0.85)"/>
    <stop offset="1"   stop-color="rgba(5,5,10,0)"/>
  </linearGradient>
  <!-- Title gradient -->
  <linearGradient id="titleGrad" x1="0" y1="0" x2="0" y2="1" gradientUnits="objectBoundingBox">
    <stop offset="0"    stop-color="#e8c547"/>
    <stop offset="0.4"  stop-color="#c9a227"/>
    <stop offset="0.75" stop-color="#a07c10"/>
    <stop offset="1"    stop-color="#c9a227"/>
  </linearGradient>
  <!-- Title glow filter -->
  <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
    <feGaussianBlur stdDeviation="18" result="blur"/>
    <feComposite in="SourceGraphic" in2="blur" operator="over"/>
  </filter>
</defs>

<!-- Background -->
<rect width="${W}" height="${H}" fill="url(#bg)"/>

<!-- Grid -->
${gridLines}
${gridDots}

<!-- Columns -->
${panels}

<!-- Top gold rule -->
<line x1="0" y1="${PANEL_TOP - 1}" x2="${W}" y2="${PANEL_TOP - 1}" stroke="url(#rule)" stroke-width="1.5"/>
<!-- Bottom gold rule -->
<line x1="0" y1="${PANEL_BOT + 1}" x2="${W}" y2="${PANEL_BOT + 1}" stroke="url(#rule)" stroke-width="1.5"/>

<!-- Center overlay -->
<rect x="0" y="${PANEL_TOP}" width="${W}" height="${PANEL_H}" fill="url(#overlay)"/>

<!-- HERCULEAN title glow layer -->
<text x="${W/2}" y="${H * 0.54}" text-anchor="middle"
  font-family="BigShoulders" font-weight="bold" font-size="178"
  fill="rgba(201,162,39,0.18)" filter="url(#glow)">HERCULEAN</text>

<!-- HERCULEAN title -->
<text x="${W/2}" y="${H * 0.54}" text-anchor="middle"
  font-family="BigShoulders" font-weight="bold" font-size="178"
  fill="url(#titleGrad)">HERCULEAN</text>

<!-- Divider line under title -->
<line x1="${W/2 - 260}" y1="${dY}" x2="${W/2 + 260}" y2="${dY}" stroke="rgba(201,162,39,0.5)" stroke-width="0.75"/>

<!-- Diamond -->
${diamond}

<!-- Subheadline -->
<text x="${W/2}" y="${H * 0.635}" text-anchor="middle"
  font-family="Jura" font-weight="300" font-size="22" letter-spacing="8"
  fill="rgba(232,197,71,0.72)">ASK 10 LEADING AI LLMs AT ONCE</text>

<!-- Tagline -->
<text x="${W/2}" y="${H * 0.685}" text-anchor="middle"
  font-family="GeistMono" font-size="12" letter-spacing="4"
  fill="rgba(201,162,39,0.35)">COMPARE · COPY · CONQUER</text>

<!-- Corner marks -->
${cornerMarks}

<!-- Footer left -->
<text x="60" y="${H - 44}" font-family="GeistMono" font-size="11" fill="rgba(201,162,39,0.22)">herculeansearch.com</text>
<!-- Footer right -->
<text x="${W - 60}" y="${H - 44}" text-anchor="end" font-family="GeistMono" font-size="11" fill="rgba(201,162,39,0.22)">v2025 — TEN MODELS</text>

</svg>`;

const out = 'C:/Projects/Herculean/herculean-banner.svg';
fs.writeFileSync(out, svg);
console.log(`Banner written: ${out} (${W}×${H})`);
console.log('Open in Chrome and screenshot at 100% zoom for a 1920×1080 PNG.');
