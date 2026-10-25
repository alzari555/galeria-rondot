import fs from "node:fs";
import path from "node:path";

const catalogPath = "src/data/artworks.json";
if (fs.existsSync(catalogPath)) {
  const content = fs.readFileSync(catalogPath, "utf8");
  const updated = content.replaceAll('"./artworks/', '"/artworks/');
  fs.writeFileSync(catalogPath, updated, "utf8");
}

const dir = "src/data/artworks";
if (fs.existsSync(dir)) {
  const files = fs.readdirSync(dir).filter((f) => f.endsWith(".json"));
  for (const f of files) {
    const filePath = path.join(dir, f);
    const content = fs.readFileSync(filePath, "utf8");
    const updated = content.replaceAll('"./artworks/', '"/artworks/');
    fs.writeFileSync(filePath, updated, "utf8");
  }
  console.log(`Updated ${files.length} artwork JSON files to use /artworks/`);
}
