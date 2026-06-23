import sharp from "sharp";
import { readdirSync, renameSync, existsSync, statSync } from "fs";
import { join, extname, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const distAssets = join(__dirname, "..", "dist", "assets");

if (!existsSync(distAssets)) {
  console.log("No dist/assets directory found. Run pnpm build first.");
  process.exit(0);
}

const files = readdirSync(distAssets);
const MAX_PNG_SIZE = 100 * 1024; // 100KB — only convert PNGs larger than this

let converted = 0;
let skipped = 0;

for (const file of files) {
  if (!file.endsWith(".png")) continue;

  const filePath = join(distAssets, file);
  const stat = statSync(filePath);

  if (stat.size < MAX_PNG_SIZE) {
    skipped++;
    continue;
  }

  const webpPath = filePath.replace(/\.png$/, ".webp");
  const originalSize = stat.size;

  try {
    await sharp(filePath).webp({ quality: 80, effort: 4 }).toFile(webpPath);
    const webpStat = statSync(webpPath);
    const saved = ((originalSize - webpStat.size) / originalSize * 100).toFixed(1);
    console.log(`  ✓ ${file} (${(originalSize / 1024).toFixed(0)} KB → ${(webpStat.size / 1024).toFixed(0)} KB, ${saved}% savings)`);
    converted++;
  } catch (err) {
    console.error(`  ✗ ${file}: ${err.message}`);
  }
}

const totalSaved = files
  .filter(f => f.endsWith(".webp"))
  .reduce((sum, f) => sum + statSync(join(distAssets, f)).size, 0);

console.log(`\nDone: ${converted} PNGs converted to WebP (${skipped} skipped as small).`);
console.log(`Total WebP size: ${(totalSaved / 1024).toFixed(0)} KB`);
