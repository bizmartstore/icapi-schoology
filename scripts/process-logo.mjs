/**
 * Removes edge-connected near-black background from icapi-logo.png and generates PWA icons.
 */
import sharp from "sharp";
import { readFileSync, writeFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const publicDir = join(__dirname, "..", "public");
const backupPath = join(publicDir, "icapi-logo-original.png");
const outPath = join(publicDir, "icapi-logo.png");

const BLACK_THRESHOLD = 48;

function isBackgroundPixel(r, g, b) {
  return r <= BLACK_THRESHOLD && g <= BLACK_THRESHOLD && b <= BLACK_THRESHOLD;
}

function removeEdgeBlackBackground(data, width, height, channels) {
  const visited = new Uint8Array(width * height);
  const queue = [];

  const pushIfBg = (x, y) => {
    if (x < 0 || y < 0 || x >= width || y >= height) return;
    const idx = y * width + x;
    if (visited[idx]) return;
    const i = idx * channels;
    if (!isBackgroundPixel(data[i], data[i + 1], data[i + 2])) return;
    visited[idx] = 1;
    queue.push(idx);
  };

  for (let x = 0; x < width; x++) {
    pushIfBg(x, 0);
    pushIfBg(x, height - 1);
  }
  for (let y = 0; y < height; y++) {
    pushIfBg(0, y);
    pushIfBg(width - 1, y);
  }

  while (queue.length > 0) {
    const idx = queue.pop();
    const i = idx * channels;
    data[i + 3] = 0;

    const x = idx % width;
    const y = (idx - x) / width;
    pushIfBg(x - 1, y);
    pushIfBg(x + 1, y);
    pushIfBg(x, y - 1);
    pushIfBg(x, y + 1);
  }
}

async function removeBlackBackground(inputPath, outputPath) {
  const { data, info } = await sharp(inputPath)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const { width, height, channels } = info;
  removeEdgeBlackBackground(data, width, height, channels);

  await sharp(data, { raw: { width, height, channels } })
    .trim()
    .png()
    .toFile(outputPath);
}

async function writePwaIcons(transparentPath) {
  const sizes = [192, 512];
  for (const size of sizes) {
    await sharp(transparentPath)
      .resize(size, size, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .png()
      .toFile(join(publicDir, `icapi-icon-${size}.png`));
  }

  const maskableSize = 512;
  const logoSize = Math.round(maskableSize * 0.62);
  const logo = await sharp(transparentPath)
    .resize(logoSize, logoSize, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .toBuffer();

  await sharp({
    create: {
      width: maskableSize,
      height: maskableSize,
      channels: 4,
      background: { r: 26, g: 39, b: 68, alpha: 1 },
    },
  })
    .composite([{ input: logo, gravity: "center" }])
    .png()
    .toFile(join(publicDir, "icapi-icon-maskable-512.png"));

  await sharp(join(publicDir, "icapi-icon-maskable-512.png"))
    .resize(192, 192)
    .png()
    .toFile(join(publicDir, "icapi-icon-maskable-192.png"));
}

const main = async () => {
  try {
    readFileSync(backupPath);
  } catch {
    writeFileSync(backupPath, readFileSync(outPath));
  }

  await removeBlackBackground(backupPath, outPath);
  await writePwaIcons(outPath);
  console.log("Logo processed: transparent background + PWA icons created.");
};

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
