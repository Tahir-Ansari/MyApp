// Generates the PWA icon set in public/icons from inline SVG artwork.
// One-off tool: run `node scripts/generate-icons.mjs` after changing the artwork.
// Uses sharp, which Next.js installs for image optimization.
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const outDir = path.join(process.cwd(), "public", "icons");

// Artwork drawn on a 512 grid. `inset` shrinks the glyph so maskable icons keep it inside the 80% safe zone.
function glyph(inset) {
  const s = (512 - inset * 2) / 512;
  return `
  <g transform="translate(${inset} ${inset}) scale(${s})">
    <path d="M256 70 L417 163 L417 349 L256 442 L95 349 L95 163 Z" fill="none" stroke="#8b9cff" stroke-width="22" stroke-linejoin="round" opacity="0.9"/>
    <rect x="166" y="196" width="180" height="44" rx="10" fill="#6d7dff"/>
    <rect x="166" y="252" width="180" height="44" rx="10" fill="#8b6dff"/>
    <rect x="166" y="308" width="180" height="44" rx="10" fill="#34d399"/>
    <g fill="#0b1020" opacity="0.35">
      <rect x="196" y="206" width="8" height="24" rx="3"/><rect x="226" y="206" width="8" height="24" rx="3"/><rect x="256" y="206" width="8" height="24" rx="3"/><rect x="286" y="206" width="8" height="24" rx="3"/>
      <rect x="196" y="262" width="8" height="24" rx="3"/><rect x="226" y="262" width="8" height="24" rx="3"/><rect x="256" y="262" width="8" height="24" rx="3"/><rect x="286" y="262" width="8" height="24" rx="3"/>
      <rect x="196" y="318" width="8" height="24" rx="3"/><rect x="226" y="318" width="8" height="24" rx="3"/><rect x="256" y="318" width="8" height="24" rx="3"/><rect x="286" y="318" width="8" height="24" rx="3"/>
    </g>
  </g>`;
}

const defs = `<defs><linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#151b38"/><stop offset="1" stop-color="#0b1020"/></linearGradient></defs>`;

// "any" purpose: rounded tile with transparent corners.
const anySvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">${defs}<rect width="512" height="512" rx="112" fill="url(#bg)"/>${glyph(28)}</svg>`;
// "maskable" purpose: full-bleed background, glyph within the central safe zone.
const maskableSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">${defs}<rect width="512" height="512" fill="url(#bg)"/>${glyph(92)}</svg>`;

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
