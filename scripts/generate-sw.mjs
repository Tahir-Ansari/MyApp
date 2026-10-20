// Generates public/sw.js from sw/sw-template.js after `next build`.
// - Cache version = Next.js BUILD_ID, so every deploy gets fresh caches and old ones are removed on activate.
// - Precache list = every prerendered HTML route + every hashed asset in .next/static + icons/manifest.
import { readFile, writeFile, readdir } from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const nextDir = path.join(root, ".next");

async function listFiles(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = await Promise.all(
    entries.map((e) => (e.isDirectory() ? listFiles(path.join(dir, e.name)) : [path.join(dir, e.name)])),
  );
  return files.flat();
}

function toUrl(base, file) {
  return base + path.relative(base === "/_next/static/" ? path.join(nextDir, "static") : path.join(root, "public"), file).split(path.sep).join("/");
}

const buildId = (await readFile(path.join(nextDir, "BUILD_ID"), "utf8")).trim();
const prerender = JSON.parse(await readFile(path.join(nextDir, "prerender-manifest.json"), "utf8"));

// HTML routes only: skip internal routes and metadata files such as /manifest.webmanifest or /icon.png.
const pages = Object.keys(prerender.routes)
  .filter((route) => !route.startsWith("/_") && !path.posix.basename(route).includes("."))
  .sort();
if (!pages.includes("/offline")) pages.push("/offline");

const staticAssets = (await listFiles(path.join(nextDir, "static")))
  .filter((f) => !f.endsWith(".map"))
  .map((f) => toUrl("/_next/static/", f));
const iconAssets = (await listFiles(path.join(root, "public", "icons"))).map((f) => toUrl("/", f));
const assets = [...staticAssets, ...iconAssets, "/manifest.webmanifest"];

const template = await readFile(path.join(root, "sw", "sw-template.js"), "utf8");
const output = template
  .replace("__BUILD_ID__", buildId)
  .replace("/* __PRECACHE_PAGES__ */ []", JSON.stringify(pages))
  .replace("/* __PRECACHE_ASSETS__ */ []", JSON.stringify(assets));
if (output.includes("__PRECACHE_")) throw new Error("[generate-sw] template placeholders were not replaced");
await writeFile(path.join(root, "public", "sw.js"), output);

const bytes = (await Promise.all(staticAssets.map((u) => readFile(path.join(nextDir, "static", u.slice("/_next/static/".length))))))
  .reduce((n, b) => n + b.length, 0);
console.log(
  `[generate-sw] build ${buildId}: ${pages.length} pages, ${assets.length} assets (${(bytes / 1024).toFixed(0)} KiB of static JS/CSS/fonts) -> public/sw.js`,
);
