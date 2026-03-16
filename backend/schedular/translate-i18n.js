const fs = require("fs");
const path = require("path");
const Anthropic = require("@anthropic-ai/sdk");

// Load ANTHROPIC_API_KEY from backend/.env
require("dotenv").config({
  path: path.resolve(__dirname, "../.env"),
});

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// Frontend i18n JSON paths (relative to backend/schedular)
const enPath = path.resolve(__dirname, "../../frontend/src/i18n/en.json");
const frontendSrcPath = path.resolve(__dirname, "../../frontend/src");

if (!fs.existsSync(enPath)) {
  console.error(
    `en.json not found at ${enPath}. Adjust path in translate-i18n.js if your structure is different.`
  );
  process.exit(1);
}

function safeReadJson(filePath) {
  try {
    if (!fs.existsSync(filePath)) return {};
    const raw = fs.readFileSync(filePath, "utf8");
    if (!raw || !raw.trim()) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" && !Array.isArray(parsed)
      ? parsed
      : {};
  } catch (_e) {
    return {};
  }
}

function listFilesRecursive(rootDir, exts, ignoreDirs = new Set()) {
  const out = [];
  const stack = [rootDir];
  while (stack.length) {
    const current = stack.pop();
    let entries = [];
    try {
      entries = fs.readdirSync(current, { withFileTypes: true });
    } catch (_e) {
      continue;
    }
    for (const ent of entries) {
      const full = path.join(current, ent.name);
      if (ent.isDirectory()) {
        if (ignoreDirs.has(ent.name)) continue;
        stack.push(full);
      } else if (ent.isFile()) {
        const ext = path.extname(ent.name).toLowerCase();
        if (exts.has(ext)) out.push(full);
      }
    }
  }
  return out;
}

function extractI18nKeysFromSource(source) {
  const keys = new Set();

  // t('key') / t("key") / t(`key`)
  const tCall = /\bt\s*\(\s*(['"`])([^'"`\\]+)\1/g;
  // i18n.t('key')
  const i18nTCall = /\bi18n\s*\.\s*t\s*\(\s*(['"`])([^'"`\\]+)\1/g;
  // tr('key') helper
  const trCall = /\btr\s*\(\s*(['"`])([^'"`\\]+)\1/g;

  for (const re of [tCall, i18nTCall, trCall]) {
    let m;
    while ((m = re.exec(source))) {
      const key = (m[2] || "").trim();
      if (key) keys.add(key);
    }
  }

  return keys;
}

function keyToEnglishFallback(key) {
  // Basic "nice enough" default: account_no -> Account No
  const cleaned = String(key)
    .replace(/[.-]+/g, " ")
    .replace(/[_]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (!cleaned) return key;
  return cleaned.replace(/\b([a-z])/g, (c) => c.toUpperCase());
}

function buildEnFromFrontendUsage(existingEn) {
  if (!fs.existsSync(frontendSrcPath)) {
    console.error(`frontend/src not found at ${frontendSrcPath}`);
    process.exit(1);
  }

  const exts = new Set([".js", ".jsx", ".ts", ".tsx"]);
  const ignoreDirs = new Set(["node_modules", "build", "dist", ".git"]);
  const files = listFilesRecursive(frontendSrcPath, exts, ignoreDirs);

  const allKeys = new Set();
  for (const f of files) {
    let src = "";
    try {
      src = fs.readFileSync(f, "utf8");
    } catch (_e) {
      continue;
    }
    for (const k of extractI18nKeysFromSource(src)) allKeys.add(k);
  }

  const merged = { ...(existingEn || {}) };
  let added = 0;
  for (const k of Array.from(allKeys).sort()) {
    if (typeof merged[k] === "string" && merged[k].trim() !== "") continue;
    merged[k] = keyToEnglishFallback(k);
    added += 1;
  }

  return { merged, foundKeyCount: allKeys.size, addedCount: added };
}

let en = safeReadJson(enPath);

async function translateText(text, lang) {
  const prompt = `You are translating UI text for a web dashboard. 
Translate the following text to ${lang}. 
Keep placeholders like {{name}} exactly the same.
Return only the translated text, with no quotes or extra explanation.

Text: "${text}"`;

  const res = await anthropic.messages.create({
    model: "claude-3-haiku-20240307",
    max_tokens: 200,
    messages: [{ role: "user", content: prompt }],
  });

  const content =
    res &&
    res.content &&
    res.content[0] &&
    typeof res.content[0].text === "string"
      ? res.content[0].text
      : "";

  return content.trim();
}

async function translateObject(sourceObj, existingTarget, targetLang) {
  const result = { ...existingTarget };

  for (const key of Object.keys(sourceObj)) {
    const value = sourceObj[key];

    if (typeof value === "string") {
      // Skip already translated non-empty values
      if (
        result[key] &&
        typeof result[key] === "string" &&
        result[key].trim() !== ""
      ) {
        continue;
      }

      try {
        const translated = await translateText(value, targetLang);
        result[key] = translated || value;
        console.log(`[${targetLang}] ${key} -> ${result[key]}`);
      } catch (e) {
        console.error(
          `Error translating key "${key}" for ${targetLang}:`,
          e.message || e
        );
        if (!result[key]) {
          result[key] = value;
        }
      }
    } else if (value && typeof value === "object") {
      // Nested object (in case you add sections later)
      result[key] = await translateObject(
        value,
        result[key] && typeof result[key] === "object" ? result[key] : {},
        targetLang
      );
    } else {
      // Numbers / booleans etc.
      result[key] = value;
    }
  }

  return result;
}

async function translateJson(targetLang, outputPath) {
  let existing = {};

  if (fs.existsSync(outputPath)) {
    try {
      existing = JSON.parse(fs.readFileSync(outputPath, "utf8"));
    } catch (e) {
      console.warn(
        `Could not parse existing file at ${outputPath}, starting fresh.`
      );
    }
  }

  const result = await translateObject(en, existing, targetLang);
  fs.writeFileSync(outputPath, JSON.stringify(result, null, 2), "utf8");
}

async function run() {
  if (!process.env.ANTHROPIC_API_KEY) {
    console.error("ANTHROPIC_API_KEY is not set. Check backend/.env.");
    process.exit(1);
  }

  const enKeyCount = Object.keys(en || {}).length;
  console.log("i18n source (en) path:", enPath);
  console.log("i18n source (en) keys:", enKeyCount);

  // Auto-generate en.json from frontend usage if empty, or if explicitly requested.
  const regenEn =
    String(process.env.REGEN_EN || "").trim() === "1" ||
    String(process.env.REGEN_EN || "").trim().toLowerCase() === "true";

  if (regenEn || enKeyCount === 0) {
    console.log("Generating en.json from frontend source usage...");
    const { merged, foundKeyCount, addedCount } = buildEnFromFrontendUsage(en);
    console.log("Found keys in source:", foundKeyCount);
    console.log("Added/filled keys in en.json:", addedCount);
    en = merged;
    fs.writeFileSync(enPath, JSON.stringify(en, null, 2), "utf8");
    console.log("Updated en.json keys:", Object.keys(en).length);
  }

  if (!en || typeof en !== "object" || Array.isArray(en) || Object.keys(en).length === 0) {
    console.error("en.json is empty (0 keys). Nothing to translate.");
    process.exit(1);
  }

  const hiPath = path.resolve(
    __dirname,
    "../../frontend/src/i18n/hi.json"
  );
  const paPath = path.resolve(
    __dirname,
    "../../frontend/src/i18n/pa.json"
  );
  const frPath = path.resolve(
    __dirname,
    "../../frontend/src/i18n/fr.json"
  );

  // console.log("i18n target (hi) path:", hiPath);
  // console.log("i18n target (pa) path:", paPath);
  // console.log("i18n target (fr) path:", frPath);

  // console.log("Translating to Hindi...");
  await translateJson("Hindi", hiPath);

  // console.log("Translating to Punjabi...");
  await translateJson("Punjabi", paPath);

  console.log("Translating to French...");
  await translateJson("French", frPath);

  // console.log("Translation complete.", frPath);
}

if (require.main === module) {
  run().catch((err) => {
    console.error("Unexpected error in translation script:", err);
    process.exit(1);
  });
}

module.exports = {
  runTranslateI18n: run,
};

