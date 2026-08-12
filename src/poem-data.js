import { readdirSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const DEFAULT_DATA_DIR = path.join(ROOT, "data", "poems");

function readJsonFile(file) {
  const raw = readFileSync(file, "utf-8");
  try {
    return JSON.parse(raw);
  } catch (error) {
    throw new Error(`JSON 解析失败: ${path.relative(ROOT, file)} — ${error.message}`);
  }
}

function collectJsonFiles(dir, relative = "") {
  const current = path.join(dir, relative);
  const entries = readdirSync(current, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name));
  const files = [];

  for (const entry of entries) {
    const next = path.join(relative, entry.name);
    if (entry.isDirectory()) files.push(...collectJsonFiles(dir, next));
    else if (entry.isFile() && entry.name.endsWith(".json")) files.push(path.join(dir, next));
  }
  return files;
}

function loadPoemRecords(dataDir = DEFAULT_DATA_DIR) {
  const records = collectJsonFiles(dataDir).map((file) => ({
    file,
    relativeFile: path.relative(dataDir, file),
    poem: readJsonFile(file),
  }));

  const published = records
    .filter(({ poem }) => poem.published !== false)
    .sort(({ poem: a }, { poem: b }) => String(a.id).localeCompare(String(b.id)));
  const pending = records
    .filter(({ poem }) => poem.published === false)
    .sort(({ poem: a }, { poem: b }) => String(a.id).localeCompare(String(b.id)));

  return {
    records,
    published,
    pending,
    poems: published.map(({ poem }) => poem),
  };
}

export { loadPoemRecords };
