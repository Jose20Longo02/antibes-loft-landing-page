#!/usr/bin/env node
/**
 * Generates web-ready display + lightbox assets from full-res sources.
 * Run: npm run optimize:images
 */
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const ROOT = path.join(__dirname, '..');
const SOURCE_DIR = path.join(ROOT, 'public/images/gallery/full-res');
const DISPLAY_DIR = path.join(ROOT, 'public/images/gallery/display');
const LIGHTBOX_DIR = path.join(ROOT, 'public/images/gallery/lightbox');

const DISPLAY_WIDTH = 1400;
const DISPLAY_MOBILE_WIDTH = 960;
const LIGHTBOX_WIDTH = 2400;

function listJpegs(dir) {
  return fs
    .readdirSync(dir)
    .filter((name) => /\.jpe?g$/i.test(name))
    .sort();
}

async function writeVariant(inputPath, outputPath, { width, quality, format }) {
  let pipeline = sharp(inputPath).rotate().resize({
    width,
    withoutEnlargement: true,
    fit: 'inside',
  });

  if (format === 'webp') {
    pipeline = pipeline.webp({ quality, effort: 4 });
  } else {
    pipeline = pipeline.jpeg({ quality, mozjpeg: true });
  }

  await pipeline.toFile(outputPath);
  const { size } = fs.statSync(outputPath);
  return size;
}

function formatKb(bytes) {
  return `${(bytes / 1024).toFixed(0)} KB`;
}

async function processFile(file) {
  const inputPath = path.join(SOURCE_DIR, file);
  const base = file.replace(/\.jpe?g$/i, '');

  const outputs = [
    {
      dir: DISPLAY_DIR,
      name: `${base}-960.webp`,
      width: DISPLAY_MOBILE_WIDTH,
      quality: 78,
      format: 'webp',
    },
    {
      dir: DISPLAY_DIR,
      name: `${base}-960.jpg`,
      width: DISPLAY_MOBILE_WIDTH,
      quality: 82,
      format: 'jpeg',
    },
    {
      dir: DISPLAY_DIR,
      name: `${base}.webp`,
      width: DISPLAY_WIDTH,
      quality: 80,
      format: 'webp',
    },
    {
      dir: DISPLAY_DIR,
      name: file,
      width: DISPLAY_WIDTH,
      quality: 82,
      format: 'jpeg',
    },
    {
      dir: LIGHTBOX_DIR,
      name: `${base}.webp`,
      width: LIGHTBOX_WIDTH,
      quality: 82,
      format: 'webp',
    },
    {
      dir: LIGHTBOX_DIR,
      name: file,
      width: LIGHTBOX_WIDTH,
      quality: 85,
      format: 'jpeg',
    },
  ];

  const sizes = [];
  for (const spec of outputs) {
    const outPath = path.join(spec.dir, spec.name);
    const bytes = await writeVariant(inputPath, outPath, spec);
    sizes.push({ name: spec.name, bytes });
  }

  return sizes;
}

async function main() {
  if (!fs.existsSync(SOURCE_DIR)) {
    console.error(`Source folder not found: ${SOURCE_DIR}`);
    process.exit(1);
  }

  for (const dir of [DISPLAY_DIR, LIGHTBOX_DIR]) {
    fs.mkdirSync(dir, { recursive: true });
  }

  const files = listJpegs(SOURCE_DIR);
  if (!files.length) {
    console.error('No JPEG files found in full-res folder.');
    process.exit(1);
  }

  console.log(`Optimizing ${files.length} images…\n`);

  let totalBytes = 0;
  for (const file of files) {
    const sizes = await processFile(file);
    const fileTotal = sizes.reduce((sum, item) => sum + item.bytes, 0);
    totalBytes += fileTotal;
    console.log(file);
    sizes.forEach(({ name, bytes }) => {
      console.log(`  ${name}: ${formatKb(bytes)}`);
    });
  }

  console.log(`\nDone. Generated assets total: ${formatKb(totalBytes)}`);
  console.log(`Display: ${DISPLAY_DIR}`);
  console.log(`Lightbox: ${LIGHTBOX_DIR}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
