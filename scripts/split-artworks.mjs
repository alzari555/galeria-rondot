import fs from "node:fs";
import path from "node:path";

const catalog = JSON.parse(fs.readFileSync("src/data/artworks.json", "utf8"));
const items = Array.isArray(catalog) ? catalog : catalog.items;
fs.mkdirSync("src/data/artworks", { recursive: true });

for (const item of items) {
  const safeTitle = item.title
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  const filename = `${item.catalogCode}-${safeTitle}.json`;
  fs.writeFileSync(path.join("src/data/artworks", filename), JSON.stringify(item, null, 2), "utf8");
}
console.log(`Created ${items.length} individual artwork files in src/data/artworks/`);
