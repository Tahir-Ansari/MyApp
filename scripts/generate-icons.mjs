// Generates the PWA icon set in public/icons from inline SVG artwork.
// One-off tool: run `node scripts/generate-icons.mjs` after changing the artwork.
// Uses sharp, which Next.js installs for image optimization.
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const outDir = path.join(process.cwd(), "public", "icons");

// Same mark as the sidebar logo (docs/design-system.md §5): lucide "Container" in accent-strong
// on an accent-soft tile with an accent-border outline, on the app background.
const BG = "#080b08";
const TILE = "#0b170e"; // accent-soft (rgb(34 197 94 / 0.1)) composited over BG
const BORDER = "#1d4a2b"; // accent-border (rgb(74 222 128 / 0.28)) composited over TILE
const GREEN = "#4ade80"; // accent-strong

// lucide-react 1.60 `container` icon, 24×24 grid, stroke-width 2.
const CONTAINER_PATHS = [
  "M22 7.7c0-.6-.4-1.2-.8-1.5l-6.3-3.9a1.72 1.72 0 0 0-1.7 0l-10.3 6c-.5.2-.9.8-.9 1.4v6.6c0 .5.4 1.2.8 1.5l6.3 3.9a1.72 1.72 0 0 0 1.7 0l10.3-6c.5-.3.9-1 .9-1.5Z",
  "M10 21.9V14L2.1 9.1",
  "m10 14 11.9-6.9",
  "M14 19.8v-8.1",
  "M18 17.5V9.4",
];

/** Glyph centred in the 512 canvas, `size` px wide. */
function glyph(size) {
  const s = size / 24;
  const o = (512 - size) / 2;
  return `<g transform="translate(${o} ${o}) scale(${s})" fill="none" stroke="${GREEN}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${CONTAINER_PATHS.map((d) => `<path d="${d}"/>`).join("")}</g>`;
}

// "any" purpose: rounded tile with transparent corners, like the sidebar logo square.
const anySvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><rect x="8" y="8" width="496" height="496" rx="112" fill="${TILE}" stroke="${BORDER}" stroke-width="16"/>${glyph(300)}</svg>`;
// "maskable" purpose: full-bleed background; glyph kept well inside the central 80% safe zone.
const maskableSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><rect width="512" height="512" fill="${BG}"/><rect x="96" y="96" width="320" height="320" rx="72" fill="${TILE}" stroke="${BORDER}" stroke-width="10"/>${glyph(200)}</svg>`;

const outputs = [
  ["icon-192.png", anySvg, 192],
  ["icon-512.png", anySvg, 512],
  ["maskable-192.png", maskableSvg, 192],
  ["maskable-512.png", maskableSvg, 512],
  ["apple-touch-icon.png", maskableSvg, 180],
  ["favicon-32.png", anySvg, 32],
];

await mkdir(outDir, { recursive: true });
for (const [name, svg, size] of outputs) {
  await sharp(Buffer.from(svg)).resize(size, size).png().toFile(path.join(outDir, name));
}
await writeFile(path.join(outDir, "icon.svg"), anySvg);
console.log(`Wrote ${outputs.length + 1} icons to ${path.relative(process.cwd(), outDir)}`);
