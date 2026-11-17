import { execFileSync } from 'node:child_process';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, '..');
const sourcePath = resolve(root, 'assets/world/transport-map.svg');
const outputDir = resolve(root, 'assets/world/transport-layers');

const raw = await readFile(sourcePath, 'utf8');
const source = raw.replace(/<g class="lm-marks"[^>]*>[\s\S]*?<\/g>/g, '');
const rootOpen = source.match(/<svg[^>]*>/)?.[0];
const styles = [...source.matchAll(/<style>[\s\S]*?<\/style>/g)].map((match) => match[0]).join('\n');
const defs = [...source.matchAll(/<defs>[\s\S]*?<\/defs>/g)].map((match) => match[0]).join('\n');

if (!rootOpen) throw new Error('No se encontró el SVG base');

const edges = [...source.matchAll(/<g class="edge"[^>]*data-lines="([^"]+)"[^>]*>[\s\S]*?<\/g>/g)]
  .map((match) => ({ lines: match[1], svg: match[0] }));
const nodes = [...source.matchAll(/<g class="node"[\s\S]*?<\/g>/g)].map((match) => match[0]);

const layers = [
  ['kafra', 'K'],
  ['kafra-unidireccional', 'KO'],
  ['airship-domestico', 'AD'],
  ['airship-internacional', 'AI'],
];

function wrap(content) {
  return `${rootOpen}\n${styles}\n${defs}\n${content}\n</svg>\n`;
}

await mkdir(outputDir, { recursive: true });

const written = [];

for (const [file, line] of layers) {
  const content = edges
    .filter((edge) => edge.lines.split(/\s+/).includes(line))
    .map((edge) => edge.svg)
    .join('\n');
  const path = resolve(outputDir, `${file}.svg`);
  await writeFile(path, wrap(content));
  written.push(path);
}

const nodesPath = resolve(outputDir, 'nodos.svg');
await writeFile(nodesPath, wrap(nodes.join('\n')));
written.push(nodesPath);

let png = true;
try {
  execFileSync('ffmpeg', ['-version'], { stdio: 'ignore' });
} catch {
  png = false;
}

if (png) {
  for (const svgPath of written) {
    const pngPath = svgPath.replace(/\.svg$/, '.png');
    execFileSync(
      'ffmpeg',
      ['-y', '-i', svgPath, '-frames:v', '1', '-pix_fmt', 'rgba', pngPath],
      { stdio: 'ignore' },
    );
  }
}

console.log(`wrote ${outputDir}${png ? ' (SVG + PNG)' : ' (SVG; ffmpeg no disponible)'}`);
