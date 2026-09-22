const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const inputDir = path.join(__dirname, '..', 'public', 'assets', 'kolkata-ui');
const outputDir = path.join(inputDir, 'transparent');

if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

async function processTransparencyWithDefringe(filename) {
  const inputPath = path.join(inputDir, filename);
  const outputPath = path.join(outputDir, filename);

  const { data, info } = await sharp(inputPath)
    .raw()
    .toBuffer({ resolveWithObject: true });

  const w = info.width;
  const h = info.height;
  const visited = new Uint8Array(w * h);
  const queue = [];

  // Seed borders
  for (let x = 0; x < w; x++) {
    queue.push(x, 0);
    queue.push(x, h - 1);
  }
  for (let y = 0; y < h; y++) {
    queue.push(0, y);
    queue.push(w - 1, y);
  }

  function isWhite(x, y) {
    const idx = (y * w + x) * 3;
    const r = data[idx], g = data[idx + 1], b = data[idx + 2];
    return r >= 225 && g >= 225 && b >= 225;
  }

  let head = 0;
  while (head < queue.length) {
    const x = queue[head++];
    const y = queue[head++];
    const idx = y * w + x;
    if (visited[idx]) continue;
    if (!isWhite(x, y)) continue;
    visited[idx] = 1;

    if (x > 0 && !visited[idx - 1]) queue.push(x - 1, y);
    if (x < w - 1 && !visited[idx + 1]) queue.push(x + 1, y);
    if (y > 0 && !visited[idx - w]) queue.push(x, y - 1);
    if (y < h - 1 && !visited[idx + w]) queue.push(x, y + 1);
  }

  const out = Buffer.alloc(w * h * 4);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const sIdx = (y * w + x) * 3;
      const dIdx = (y * w + x) * 4;
      const idx = y * w + x;

      const r = data[sIdx];
      const g = data[sIdx + 1];
      const b = data[sIdx + 2];

      if (visited[idx]) {
        out[dIdx] = 0;
        out[dIdx + 1] = 0;
        out[dIdx + 2] = 0;
        out[dIdx + 3] = 0;
      } else {
        // Border pixel check (adjacent to transparent background)
        let isBorder = false;
        if (x > 0 && visited[idx - 1]) isBorder = true;
        else if (x < w - 1 && visited[idx + 1]) isBorder = true;
        else if (y > 0 && visited[idx - w]) isBorder = true;
        else if (y < h - 1 && visited[idx + w]) isBorder = true;

        if (isBorder && r > 185 && g > 185 && b > 185) {
          const avg = (r + g + b) / 3;
          const alpha = Math.max(0, Math.min(255, Math.round((255 - avg) * 3.8)));
          // Color decontamination: darken white bleed on edge
          out[dIdx] = Math.round(r * 0.7);
          out[dIdx + 1] = Math.round(g * 0.7);
          out[dIdx + 2] = Math.round(b * 0.7);
          out[dIdx + 3] = alpha;
        } else {
          out[dIdx] = r;
          out[dIdx + 1] = g;
          out[dIdx + 2] = b;
          out[dIdx + 3] = 255;
        }
      }
    }
  }

  await sharp(out, { raw: { width: w, height: h, channels: 4 } })
    .png({ compressionLevel: 7 })
    .toFile(outputPath);

  console.log(`[DEFRINGED] ${filename}`);
}

async function run() {
  const files = fs.readdirSync(inputDir).filter(f => f.startsWith('Z')).sort();
  console.log(`Defringing and processing ${files.length} layers...`);
  for (const f of files) {
    await processTransparencyWithDefringe(f);
  }
  console.log('All layers cleanly defringed and saved.');
}

run().catch(console.error);
