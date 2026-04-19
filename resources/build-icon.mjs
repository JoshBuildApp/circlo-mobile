#!/usr/bin/env node
// Rasterize resources/icon.svg to the PNGs @capacitor/assets expects.
// Produces:
//   resources/icon.png                — 1024×1024 square (full bg + mark)
//   resources/icon-foreground.png     — 432×432 center mark for Android adaptive
//   resources/icon-background.png     — 432×432 solid orange for Android adaptive
//   resources/splash.png              — 2732×2732 centered mark on orange
//   resources/splash-dark.png         — 2732×2732 centered mark on navy (dark mode)

import sharp from "sharp";
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ICON_SVG = readFileSync(join(__dirname, "icon.svg"));

const BRAND_ORANGE = "#FF6B2C";
const BRAND_NAVY = "#1A1A2E";

async function render(svgBuffer, size, outPath) {
  await sharp(svgBuffer, { density: 512 })
    .resize(size, size)
    .png({ compressionLevel: 9 })
    .toFile(join(__dirname, outPath));
  console.log(`→ ${outPath} (${size}×${size})`);
}

async function renderMarkOnly(svgBuffer, size, bgHex, outPath) {
  // Re-read SVG and strip the background rect so we can place the mark on
  // any background we choose (adaptive foreground, splash variants).
  const withoutBg = svgBuffer
    .toString()
    .replace(/<rect[^/]*\/>\s*/, "");
  await sharp(Buffer.from(withoutBg), { density: 512 })
    .flatten({ background: bgHex })
    .resize(size, size)
    .png({ compressionLevel: 9 })
    .toFile(join(__dirname, outPath));
  console.log(`→ ${outPath} (${size}×${size}, bg ${bgHex})`);
}

async function renderMarkTransparent(svgBuffer, size, outPath) {
  const withoutBg = svgBuffer
    .toString()
    .replace(/<rect[^/]*\/>\s*/, "");
  await sharp(Buffer.from(withoutBg), { density: 512 })
    .resize(size, size)
    .png({ compressionLevel: 9 })
    .toFile(join(__dirname, outPath));
  console.log(`→ ${outPath} (${size}×${size}, transparent)`);
}

async function renderSolidColor(size, hex, outPath) {
  await sharp({
    create: {
      width: size,
      height: size,
      channels: 4,
      background: hex,
    },
  })
    .png({ compressionLevel: 9 })
    .toFile(join(__dirname, outPath));
  console.log(`→ ${outPath} (${size}×${size}, solid ${hex})`);
}

async function main() {
  // Main iOS/Android icon — 1024×1024 with bg baked in.
  await render(ICON_SVG, 1024, "icon.png");

  // Android adaptive icon: foreground is the mark alone, background is solid.
  // Adaptive icons are drawn at 108dp but render into a 432×432 safe box.
  await renderMarkTransparent(ICON_SVG, 432, "icon-foreground.png");
  await renderSolidColor(432, BRAND_ORANGE, "icon-background.png");

  // Splash: centered mark on brand bg. Light splash = orange, dark = navy.
  await renderMarkOnly(ICON_SVG, 2732, BRAND_ORANGE, "splash.png");
  await renderMarkOnly(ICON_SVG, 2732, BRAND_NAVY, "splash-dark.png");
}

main().catch((err) => {
  console.error("[build-icon] failed:", err);
  process.exit(1);
});
