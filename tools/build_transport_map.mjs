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
