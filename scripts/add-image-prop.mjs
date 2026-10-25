import fs from "node:fs";
import path from "node:path";

const updateFile = (filePath) => {
  const data = JSON.parse(fs.readFileSync(filePath, "utf8"));
  if (Array.isArray(data)) {
    for (const item of data) {
      if (item.url && !item.image) item.image = item.url;
      if (item.image && !item.url) item.url = item.image;
    }
  } else if (data.items) {
    for (const item of data.items) {
      if (item.url && !item.image) item.image = item.url;
      if (item.image && !item.url) item.url = item.image;
    }
  } else {
    if (data.url && !data.image) data.image = data.url;
    if (data.image && !data.url) data.url = data.image;
  }
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf8");
};

updateFile("src/data/artworks.json");

const dir = "src/data/artworks";
if (fs.existsSync(dir)) {
  const files = fs.readdirSync(dir).filter((f) => f.endsWith(".json"));
  for (const f of files) {
    updateFile(path.join(dir, f));
  }
  console.log(`Updated ${files.length} artwork JSON files with image property`);
}
