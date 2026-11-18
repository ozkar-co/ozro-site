import { readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { layout, parseFlow, render, STYLE } from '@linemap/core';

STYLE.linePitch = 17;

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, '..');
const dataPath = resolve(root, 'assets/world/transport.json');
const outputPath = resolve(root, 'assets/world/transport-map.svg');

const positions = {
  einbroch: [360, 100],
  yuno: [550, 200],
  lighthalzen: [930, 100],
  hugel: [1120, 200],
  rachel: [1120, 300],
  aldebaran: [360, 300],
  geffen: [550, 300],
  prontera: [740, 500],
  payon: [930, 300],
  cmd_fild07: [360, 800],
  izlude: [1120, 800],
  alberta: [930, 900],
  morocc: [360, 700],
  comodo: [550, 800],
  umbala: [550, 900],
};

const vias = {};
const hiddenSegments = new Set(['izlude-yuno']);

const lines = [
  ['K', 'Kafra', '#2f7d5b'],
  ['KO', 'Kafra unidireccional', '#b3651f'],
  ['AD', 'Airship doméstico', '#2f6fae'],
  ['AI', 'Airship internacional', '#7b5fb0'],
];

function dotQuote(value) {
  return `"${String(value).replaceAll('\\', '\\\\').replaceAll('"', '\\"')}"`;
}

function buildDot(graph) {
  const out = ['digraph transport {'];

  out.push('  subgraph lines {');
  for (const [id, label, color] of lines) {
    out.push(`    ${id} [label=${dotQuote(label)}, color=${dotQuote(color)}]`);
  }
  out.push('  }');
  out.push('  node [width=0.6, height=0.6]');

  for (const node of graph.nodes) {
    const point = positions[node.id];
    if (!point) continue;
    out.push(
      `  ${node.id} [label="", pos=${dotQuote(`${point[0]},${point[1]}`)}]`,
    );
  }

  for (const line of graph.lines) {
    if (line.type === 'kafra' && line.from && line.to) {
      if (hiddenSegments.has(`${line.from}-${line.to}`)) continue;
      const id = line.bidirectional === false ? 'KO' : 'K';
      const via = vias[`${line.from}-${line.to}`];
      const viaAttr = via ? `, via=${dotQuote(`${via[0]},${via[1]}`)}` : '';
      out.push(`  ${line.from} -> ${line.to} [lines=${id}${viaAttr}]`);
      continue;
    }

    if (line.type === 'airship' && line.stops) {
      const id = line.group === 'airship-domestic' ? 'AD' : 'AI';
      const stops = line.stops.map((stop) => stop.station);
      for (let index = 0; index < stops.length - 1; index += 1) {
        const from = stops[index];
        const to = stops[index + 1];
        if (hiddenSegments.has(`${from}-${to}`)) continue;
        const via = vias[`${from}-${to}`];
        const viaAttr = via ? `, via=${dotQuote(`${via[0]},${via[1]}`)}` : '';
        out.push(`  ${from} -> ${to} [lines=${id}${viaAttr}]`);
      }
      if (line.loop && stops.length > 1) {
        out.push(`  ${stops[stops.length - 1]} -> ${stops[0]} [lines=${id}]`);
      }
    }
  }

  out.push('}');
  return out.join('\n');
}

const GRID_X = [360, 455, 550, 645, 740, 835, 930, 1025, 1120];
const GRID_Y = [100, 200, 300, 400, 500, 600, 700, 800, 900];
const GRID_COLS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I'];
const H_LANES = [1, 2, 1, 3, 3, 2, 3, 3, 1];
const V_LANES = [3, 1, 1, 2, 2, 2, 3, 2, 3];
const LANE_NAMES = ['u', 'v', 'w'];
const LANE_PITCH = 18;

function laneOffsets(count) {
  if (count === 1) return [0];
  if (count === 2) return [-LANE_PITCH / 2, LANE_PITCH / 2];
  return [-LANE_PITCH, 0, LANE_PITCH];
}

function gridSvg() {
  const parts = ['<g class="transport-grid" pointer-events="none">'];
  GRID_X.forEach((x, index) => {
    const offsets = laneOffsets(V_LANES[index]);
    offsets.forEach((offset, lane) => {
      const laneX = x + offset;
      const name = `${GRID_COLS[index]}${LANE_NAMES[lane]}`;
      parts.push(`<line x1="${laneX}" y1="65" x2="${laneX}" y2="950" />`);
      parts.push(`<text x="${laneX}" y="52" text-anchor="middle">${name}</text>`);
    });
  });
  GRID_Y.forEach((y, index) => {
    const offsets = laneOffsets(H_LANES[index]);
    offsets.forEach((offset, lane) => {
      const laneY = y + offset;
      const name = `${index + 1}${LANE_NAMES[lane]}`;
      parts.push(`<line x1="330" y1="${laneY}" x2="1160" y2="${laneY}" />`);
      parts.push(`<text x="320" y="${laneY + 4}" text-anchor="end">${name}</text>`);
    });
  });
  parts.push('</g>');
  return parts.join('\n');
}

function vLaneX(column, lane) {
  const index = GRID_COLS.indexOf(column);
  const offsets = laneOffsets(V_LANES[index]);
  return GRID_X[index] + offsets[LANE_NAMES.indexOf(lane)];
}

function hLaneY(row, lane) {
  const index = row - 1;
  const offsets = laneOffsets(H_LANES[index]);
  return GRID_Y[index] + offsets[LANE_NAMES.indexOf(lane)];
}

function roundedPath(points, radius = 12) {
  const parts = [`M ${points[0][0]} ${points[0][1]}`];
  for (let index = 1; index < points.length - 1; index += 1) {
    const [px, py] = points[index - 1];
    const [cx, cy] = points[index];
    const [nx, ny] = points[index + 1];
    const inLength = Math.hypot(cx - px, cy - py) || 1;
    const outLength = Math.hypot(nx - cx, ny - cy) || 1;
    const r = Math.min(radius, inLength / 2, outLength / 2);
    const inX = cx - ((cx - px) / inLength) * r;
    const inY = cy - ((cy - py) / inLength) * r;
    const outX = cx + ((nx - cx) / outLength) * r;
    const outY = cy + ((ny - cy) / outLength) * r;
    parts.push(`L ${inX} ${inY}`);
    parts.push(`Q ${cx} ${cy} ${outX} ${outY}`);
  }
  const [lastX, lastY] = points[points.length - 1];
  parts.push(`L ${lastX} ${lastY}`);
  return parts.join(' ');
}

const AIRSHIP_ROUTES = [
  {
    id: 'AD',
    color: '#2f6fae',
    label: 'Airship doméstico',
    paths: [
      [[360, 100], [930, 100]],
      [[360, 100], [vLaneX('A', 'v'), hLaneY(2, 'u')], [550, hLaneY(2, 'u')], [550, 200]],
      [[550, 200], [550, hLaneY(2, 'u')], [1120, hLaneY(2, 'u')], [1120, 200]],
    ],
  },
  {
    id: 'AI',
    color: '#7b5fb0',
    label: 'Airship internacional',
    paths: [
      [[550, 200], [550, hLaneY(2, 'v')], [vLaneX('H', 'v'), hLaneY(2, 'v')], [vLaneX('H', 'v'), 300], [1120, 300]],
      [[1120, 300], [vLaneX('I', 'w'), 300], [vLaneX('I', 'w'), 800], [1120, 800]],
    ],
  },
];

function airshipSvg() {
  return AIRSHIP_ROUTES.map((line) => {
    const casing = line.paths
      .map((points) => `<path d="${roundedPath(points)}" class="lm-casing" stroke-width="14"/>`)
      .join('');
    const strands = line.paths
      .map(
        (points) =>
          `<path d="${roundedPath(points)}" class="lm-strand" stroke="${line.color}" stroke-width="9" data-line="${line.id}"><title>${line.label}</title></path>`,
      )
      .join('');
    return `<g class="edge custom-airship" data-lines="${line.id}">${casing}${strands}</g>`;
  }).join('\n');
}

const KAFRA_ROUTES = [
  { from: 'aldebaran', to: 'geffen', paths: [[[360, 300], [550, 300]]] },
  {
    from: 'aldebaran',
    to: 'yuno',
    paths: [[[360, 300], [360, hLaneY(2, 'v')], [550, hLaneY(2, 'v')], [550, 200]]],
  },
  {
    from: 'aldebaran',
    to: 'izlude',
    paths: [[[360, 300], [360, hLaneY(4, 'v')], [vLaneX('B', 'u'), hLaneY(4, 'v')], [vLaneX('B', 'u'), hLaneY(6, 'v')], [vLaneX('I', 'u'), hLaneY(6, 'v')], [vLaneX('I', 'u'), 800], [1120, 800]]],
  },
  {
    from: 'morocc',
    to: 'prontera',
    paths: [[[360, 700], [vLaneX('A', 'u'), 700], [vLaneX('A', 'u'), hLaneY(5, 'v')], [740, hLaneY(5, 'v')], [740, 500]]],
  },
  {
    from: 'morocc',
    to: 'comodo',
    paths: [[[360, 700], [360, hLaneY(7, 'w')], [550, hLaneY(7, 'w')], [550, 800]]],
  },
  { from: 'morocc', to: 'cmd_fild07', paths: [[[360, 700], [360, 800]]] },
  { from: 'cmd_fild07', to: 'comodo', paths: [[[360, 800], [550, 800]]] },
  { from: 'comodo', to: 'umbala', paths: [[[550, 800], [550, 900]]] },
];

const CUSTOM_KAFRA_PAIRS = new Set(
  KAFRA_ROUTES.map((route) => [route.from, route.to].sort().join('|')),
);

function kafraSvg() {
  const casing = KAFRA_ROUTES.flatMap((route) =>
    route.paths.map((points) => `<path d="${roundedPath(points)}" class="lm-casing" stroke-width="14"/>`),
  ).join('');
  const strands = KAFRA_ROUTES.flatMap((route) =>
    route.paths.map(
      (points) =>
        `<path d="${roundedPath(points)}" class="lm-strand" stroke="#2f7d5b" stroke-width="9" data-line="K"><title>Kafra</title></path>`,
    ),
  ).join('');
  return `<g class="edge custom-kafra" data-lines="K">${casing}${strands}</g>`;
}

function decorate(svg) {
  let next = svg;

  next = next.replace(
    /<rect ([^>]*class="lm-shape"[^>]*)>/g,
    (match, attrs) => {
      const width = attrs.match(/width="([\d.]+)"/)?.[1];
      if (!width) return match;
      const round = attrs.replace(/rx="[^"]*"/, `rx="${Number(width) / 2}"`);
      return `<rect ${round}>`;
    },
  );

  next = next.replace('>LINES</text>', '>LÍNEAS</text>');

  next = next.replace(/<g class="lm-marks"[^>]*>[\s\S]*?<\/g>/g, '');
  next = next.replace(/<g class="edge"[^>]*data-lines="(?:AD|AI)"[^>]*>[\s\S]*?<\/g>/g, '');
  next = next.replace(/<g class="edge"([^>]*)>[\s\S]*?<\/g>/g, (match, attrs) => {
    const from = attrs.match(/data-from="([^"]+)"/)?.[1];
    const to = attrs.match(/data-to="([^"]+)"/)?.[1];
    if (from && to && CUSTOM_KAFRA_PAIRS.has([from, to].sort().join('|'))) return '';
    return match;
  });

  const firstEdge = next.indexOf('<g class="edge"');
  if (firstEdge >= 0) {
    next = `${next.slice(0, firstEdge)}${gridSvg()}\n${next.slice(firstEdge)}`;
  } else {
    next = next.replace('</svg>', `${gridSvg()}\n</svg>`);
  }

  const firstNode = next.indexOf('<g class="node"');
  if (firstNode >= 0) {
    next = `${next.slice(0, firstNode)}${kafraSvg()}\n${airshipSvg()}\n${next.slice(firstNode)}`;
  }

  next = next.replace(
    '</svg>',
    `<style>
      polygon { display: none; }
      .node .lm-shape { fill: #ffffff; stroke: #374151; stroke-width: 2; }
      .node .lm-sheen { display: none; }
      .node .lm-label { font-weight: 700; }
      .edge[data-lines="KO"] .lm-casing,
      .edge[data-lines="KO"] .lm-strand { stroke-dasharray: 10 8; }
      .legend-row[data-line="KO"] line { stroke-dasharray: 10 8; }
      .transport-grid line {
        stroke: #94a3b8;
        stroke-width: 1;
        stroke-dasharray: 5 7;
        opacity: 0.55;
      }
      .transport-grid text {
        fill: #64748b;
        font-size: 12px;
        font-weight: 600;
      }
    </style>
</svg>`,
  );

  return next;
}

const graph = JSON.parse(await readFile(dataPath, 'utf8'));
const dot = buildDot(graph);
const model = layout(parseFlow(dot));
const svg = decorate(render(model, { theme: 'minimal' }));
await writeFile(outputPath, svg);
console.log(`wrote ${outputPath}`);
