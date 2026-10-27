// Genera versiones de distintas resoluciones (LOD) de cada obra en public/artworks.
// Salida: public/artworks/lod/<tamaño>/<nombre>.webp
// Es incremental: omite las que ya existen y están al día.
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const srcDir = path.join(root, "public", "artworks");
const outRoot = path.join(srcDir, "lod");
const LEVELS = [256, 512, 1024];
const QUALITY = 72;

const exists = async (p) => !!(await fs.stat(p).catch(() => null));

const files = (await fs.readdir(srcDir)).filter((f) => /\.(webp|png|jpe?g)$/i.test(f));
let made = 0;
let skipped = 0;

for (const level of LEVELS) {
  await fs.mkdir(path.join(outRoot, String(level)), { recursive: true });
}

for (const file of files) {
  const input = path.join(srcDir, file);
  const inStat = await fs.stat(input);
  const base = path.parse(file).name;

  for (const level of LEVELS) {
    const output = path.join(outRoot, String(level), `${base}.webp`);
    const outStat = await fs.stat(output).catch(() => null);
    if (outStat && outStat.mtimeMs >= inStat.mtimeMs) {
      skipped++;
      continue;
    }
    await sharp(input)
      .rotate()
      .resize({ width: level, height: level, fit: "inside", withoutEnlargement: true })
      .webp({ quality: QUALITY })
      .toFile(output);
    made++;
  }
}

console.log(`[lod] ${files.length} obras · ${made} generadas · ${skipped} al día`);
