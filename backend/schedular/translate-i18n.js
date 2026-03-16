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

if (!fs.existsSync(enPath)) {
  console.error(
    `en.json not found at ${enPath}. Adjust path in translate-i18n.js if your structure is different.`
  );
  process.exit(1);
}

const en = JSON.parse(fs.readFileSync(enPath, "utf8"));

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

  const hiPath = path.resolve(
    __dirname,
    "../../frontend/src/i18n/hi.json"
  );
  const paPath = path.resolve(
    __dirname,
    "../../frontend/src/i18n/pa.json"
  );

  console.log("Translating to Hindi...");
  await translateJson("Hindi", hiPath);

  console.log("Translating to Punjabi...");
  await translateJson("Punjabi", paPath);

  console.log("Translation complete.", paPath);
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

