import { readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { layout, parseFlow, render } from '@linemap/core';

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, '..');
const dataPath = resolve(root, 'assets/world/transport.json');
const outputPath = resolve(root, 'assets/world/transport-map.svg');

const positions = {
  einbroch: [260, 100],
  yuno: [560, 140],
  lighthalzen: [840, 80],
  hugel: [1120, 140],
  rachel: [1180, 300],
  aldebaran: [240, 280],
  geffen: [480, 300],
  prontera: [720, 380],
  payon: [980, 340],
  cmd_fild07: [1200, 500],
  izlude: [1080, 660],
  alberta: [760, 820],
  morocc: [520, 620],
  comodo: [680, 680],
  umbala: [880, 860],
};

const vias = {
  'aldebaran-izlude': [200, 700],
  'izlude-geffen': [420, 560],
  'izlude-morocc': [520, 740],
  'morocc-payon': [520, 340],
};

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
  out.push('  node [width=1.8, height=0.4, fontsize=11]');

  for (const node of graph.nodes) {
    const point = positions[node.id];
    if (!point) continue;
    const extra = node.id === 'alberta' ? ', width=0.7, height=1.2, fontsize=9' : '';
    out.push(
      `  ${node.id} [label=${dotQuote(node.name)}, pos=${dotQuote(`${point[0]},${point[1]}`)}${extra}]`,
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
        out.push(`  ${stops[index]} -> ${stops[index + 1]} [lines=${id}]`);
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
