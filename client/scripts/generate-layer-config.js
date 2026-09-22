const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

async function alignAll() {
  const refPath = path.join(__dirname, '..', 'public', 'assets', 'kolkata-ui', 'combined_reference.jpg');
  const refImg = await sharp(refPath).resize(1672, 941).raw().toBuffer({ resolveWithObject: true });
  const rw = refImg.info.width;
  const rh = refImg.info.height;

  const transDir = path.join(__dirname, '..', 'public', 'assets', 'kolkata-ui', 'transparent');
  const files = fs.readdirSync(transDir).filter(f => f.startsWith('Z')).sort();

  const layersConfig = [];
  const compositeInputs = [];

  for (const f of files) {
    const filePath = path.join(transDir, f);
    const { data, info } = await sharp(filePath).raw().toBuffer({ resolveWithObject: true });
    const aw = info.width;
    const ah = info.height;

    // Sample high-opacity, non-white pixels
    const pts = [];
    for (let y = 2; y < ah - 2; y += 2) {
      for (let x = 2; x < aw - 2; x += 2) {
        const idx = (y * aw + x) * 4;
        const a = data[idx + 3];
        if (a > 200) {
          const r = data[idx], g = data[idx + 1], b = data[idx + 2];
          // Prefer distinct pixels
          if (r < 230 || g < 230 || b < 230) {
            pts.push({ x, y, r, g, b });
          }
        }
      }
    }

    let bestX = 0, bestY = 0;
    if (f === 'Z02_far_skyline_top.png') {
      bestX = 0;
      bestY = 0;
    } else if (pts.length > 0) {
      // Pick up to 120 sample points
      const step = Math.max(1, Math.floor(pts.length / 120));
      const sample = [];
      for (let i = 0; i < pts.length && sample.length < 120; i += step) {
        sample.push(pts[i]);
      }

      let minDiff = Infinity;
      // Step 4 coarse search
      for (let sy = 0; sy <= rh - ah; sy += 4) {
        for (let sx = 0; sx <= rw - aw; sx += 4) {
          let diff = 0;
          for (let i = 0; i < sample.length; i++) {
            const pt = sample[i];
            const rIdx = ((sy + pt.y) * rw + (sx + pt.x)) * 3;
            diff += Math.abs(refImg.data[rIdx] - pt.r) +
                    Math.abs(refImg.data[rIdx + 1] - pt.g) +
                    Math.abs(refImg.data[rIdx + 2] - pt.b);
            if (diff > minDiff) break;
          }
          if (diff < minDiff) {
            minDiff = diff;
            bestX = sx;
            bestY = sy;
          }
        }
      }

      // Step 1 fine search around bestX, bestY
      let fineX = bestX, fineY = bestY, fineMin = minDiff;
      for (let sy = Math.max(0, bestY - 5); sy <= Math.min(rh - ah, bestY + 5); sy++) {
        for (let sx = Math.max(0, bestX - 5); sx <= Math.min(rw - aw, bestX + 5); sx++) {
          let diff = 0;
          for (let i = 0; i < sample.length; i++) {
            const pt = sample[i];
            const rIdx = ((sy + pt.y) * rw + (sx + pt.x)) * 3;
            diff += Math.abs(refImg.data[rIdx] - pt.r) +
                    Math.abs(refImg.data[rIdx + 1] - pt.g) +
                    Math.abs(refImg.data[rIdx + 2] - pt.b);
            if (diff > fineMin) break;
          }
          if (diff < fineMin) {
            fineMin = diff;
            fineX = sx;
            fineY = sy;
          }
        }
      }
      bestX = fineX;
      bestY = fineY;
    }

    const zMatch = f.match(/^Z(\d+)/);
    const zIndex = zMatch ? parseInt(zMatch[1], 10) : 1;

    // Parallax depth factor based on Z
    // Z02-Z03: 0.15 - 0.25 (distant)
    // Z04-Z07: 0.35 - 0.5 (midground)
    // Z08-Z10: 0.7 - 0.9 (mid-foreground)
    // Z11-Z13: 1.1 - 1.4 (foreground)
    let parallax = 0.5;
    if (zIndex <= 3) parallax = 0.2;
    else if (zIndex <= 7) parallax = 0.45;
    else if (zIndex <= 10) parallax = 0.85;
    else parallax = 1.25;

    const layer = {
      id: f.replace('.png', ''),
      filename: f,
      src: `/assets/kolkata-ui/transparent/${f}`,
      zIndex: zIndex * 2, // e.g. Z02 -> z-4, Z13 -> z-26
      rawZ: zIndex,
      x: bestX,
      y: bestY,
      width: aw,
      height: ah,
      leftPct: parseFloat(((bestX / rw) * 100).toFixed(4)),
      topPct: parseFloat(((bestY / rh) * 100).toFixed(4)),
      widthPct: parseFloat(((aw / rw) * 100).toFixed(4)),
      heightPct: parseFloat(((ah / rh) * 100).toFixed(4)),
      parallax,
    };

    layersConfig.push(layer);
    compositeInputs.push({
      input: filePath,
      left: bestX,
      top: bestY,
    });

    console.log(`${f.padEnd(35)} -> x:${bestX}, y:${bestY}, w:${aw}, h:${ah}`);
  }

  // Composite all over extreme-background.png for verification
  const bgPath = path.join(__dirname, '..', 'public', 'assets', 'kolkata-ui', 'extreme-background.png');
  await sharp(bgPath)
    .composite(compositeInputs)
    .jpeg({ quality: 90 })
    .toFile(path.join(__dirname, '..', 'public', 'assets', 'kolkata-ui', 'composite_aligned_test.jpg'));

  console.log('[VERIFICATION] composite_aligned_test.jpg created successfully.');

  // Write TypeScript config file
  const tsContent = `// Auto-generated Kolkata UI Layer Configuration
export interface KolkataLayer {
  id: string;
  filename: string;
  src: string;
  zIndex: number;
  rawZ: number;
  x: number;
  y: number;
  width: number;
  height: number;
  leftPct: number;
  topPct: number;
  widthPct: number;
  heightPct: number;
  parallax: number;
}

export const CANVAS_WIDTH = 1672;
export const CANVAS_HEIGHT = 941;
export const CANVAS_ASPECT = 1672 / 941;

export const KOLKATA_LAYERS: KolkataLayer[] = ${JSON.stringify(layersConfig, null, 2)};
`;

  fs.writeFileSync(path.join(__dirname, '..', 'lib', 'kolkata-layers-config.ts'), tsContent);
  console.log('[CONFIG] client/lib/kolkata-layers-config.ts generated.');
}

alignAll().catch(console.error);
