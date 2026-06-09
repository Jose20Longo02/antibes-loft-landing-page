#!/usr/bin/env node
/**
 * Extracts a vertical poster frame from the property film.
 * Run: npm run generate:video-poster
 */
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const sharp = require('sharp');

const ROOT = path.join(__dirname, '..');
const VIDEO = path.join(ROOT, 'public/videos/villa-antibes-compressed.mp4');
const OUT_DIR = path.join(ROOT, 'public/images/film');
const POSTER_JPG = path.join(OUT_DIR, 'poster.jpg');
const POSTER_WEBP = path.join(OUT_DIR, 'poster.webp');

function getFfmpegPath() {
  try {
    return require('@ffmpeg-installer/ffmpeg').path;
  } catch {
    return null;
  }
}

function extractFrame(ffmpeg, input, output) {
  execFileSync(ffmpeg, [
    '-y',
    '-ss',
    '1',
    '-i',
    input,
    '-vframes',
    '1',
    '-q:v',
    '2',
    output,
  ], { stdio: 'pipe' });
}

async function optimizePoster(input, jpgOut, webpOut) {
  const image = sharp(input).rotate();
  const meta = await image.metadata();
  const cropWidth = Math.min(meta.width, Math.round(meta.height * (9 / 16)));
  const left = Math.max(0, Math.round((meta.width - cropWidth) / 2));

  function buildPipeline() {
    return sharp(input)
      .rotate()
      .extract({ left, top: 0, width: cropWidth, height: meta.height })
      .resize({ width: 720, height: 1280, fit: 'cover' });
  }

  await buildPipeline().jpeg({ quality: 85, mozjpeg: true }).toFile(jpgOut);
  await buildPipeline().webp({ quality: 82 }).toFile(webpOut);
}

async function main() {
  if (!fs.existsSync(VIDEO)) {
    console.error(`Video not found: ${VIDEO}`);
    process.exit(1);
  }

  const ffmpeg = getFfmpegPath();
  if (!ffmpeg) {
    console.error('ffmpeg not available. Install @ffmpeg-installer/ffmpeg.');
    process.exit(1);
  }

  fs.mkdirSync(OUT_DIR, { recursive: true });

  const tempFrame = path.join(OUT_DIR, '_frame-temp.jpg');
  extractFrame(ffmpeg, VIDEO, tempFrame);
  await optimizePoster(tempFrame, POSTER_JPG, POSTER_WEBP);
  fs.unlinkSync(tempFrame);

  const jpgSize = fs.statSync(POSTER_JPG).size;
  const webpSize = fs.statSync(POSTER_WEBP).size;
  console.log(`Poster saved: ${POSTER_JPG} (${Math.round(jpgSize / 1024)} KB)`);
  console.log(`Poster saved: ${POSTER_WEBP} (${Math.round(webpSize / 1024)} KB)`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
