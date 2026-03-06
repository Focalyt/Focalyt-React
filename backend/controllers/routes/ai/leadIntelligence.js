const express = require("express");
const Anthropic = require("@anthropic-ai/sdk");

const router = express.Router();


// Helper: get Anthropic client or return null if not configured
function getAnthropicClient() {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey || !apiKey.startsWith("sk-ant-")) {
    return null;
  }
  return new Anthropic({ apiKey });
}

function getModel() {
  if (process.env.ANTHROPIC_MODEL) {
    return process.env.ANTHROPIC_MODEL.split(",").map((m) => m.trim())[0];
  }
  return "claude-3-haiku-20240307";
}

router.post("/lead-summary", async (req, res) => {
  try {
    const anthropic = getAnthropicClient();
    if (!anthropic) {
      return res.status(500).json({
        success: false,
        message: "ANTHROPIC_API_KEY is not configured on server",
      });
    }

    const { leadId, leadProfile = {}, notes = [], messages = [] } = req.body || {};

    const systemPrompt = `
You are an AI assistant helping counsellors working in a student admissions CRM.
Given a student lead profile, notes and conversations, you must extract a clean JSON object with:
- A 3–5 line "summary"
- "goal" (student's main objective)
- "interestArea" (field / course / country of interest)
- "budgetRange" (short description, like "₹50k–80k per year" or "Not specified")
- "urgency" (e.g., "Wants to join this month", "Exploring for next year")
- "concerns" (array of short bullet-style strings: fees, parents, marks, location, etc.)

Reply with ONLY valid JSON. No extra text. Keep it counsellor-friendly.
`;

    const userPrompt = `
Lead profile (structured):
${JSON.stringify(leadProfile, null, 2)}

Recent notes (free text):
${(notes || []).join("\n\n")}

Recent messages:
${(messages || [])
  .map(
    (m) =>
      `[${m.timestamp || ""}] ${m.from || "unknown"} via ${
        m.channel || "crm"
      }: ${m.text || ""}`
  )
  .join("\n")}

Return JSON with exactly this shape:
{
  "summary": string,
  "goal": string,
  "interestArea": string,
  "budgetRange": string,
  "urgency": string,
  "concerns": string[]
}
`;

    const message = await anthropic.messages.create({
      model: getModel(),
      max_tokens: 400,
      temperature: 0.2,
      system: systemPrompt,
      messages: [{ role: "user", content: userPrompt }],
    });

    const raw = message?.content?.[0]?.text || "";

    let parsed;
    try {
      // Extract just the JSON object from the response
      let jsonStr = raw;
      const firstBrace = raw.indexOf("{");
      const lastBrace = raw.lastIndexOf("}");
      if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
        jsonStr = raw.slice(firstBrace, lastBrace + 1);
      }
      parsed = JSON.parse(jsonStr);
    } catch (e) {
      console.warn("[AI lead-summary] Failed to parse JSON:", e.message);
      return res.status(500).json({
        success: false,
        message: "Failed to parse AI response",
        raw,
      });
    }

    const data = {
      leadId,
      summary: String(parsed.summary || "").trim(),
      goal: String(parsed.goal || "").trim(),
      interestArea: String(parsed.interestArea || "").trim(),
      budgetRange: String(parsed.budgetRange || "").trim(),
      urgency: String(parsed.urgency || "").trim(),
      concerns: Array.isArray(parsed.concerns)
        ? parsed.concerns.map((c) => String(c).trim()).filter(Boolean)
        : [],
    };

    return res.status(200).json({
      success: true,
      data,
    });
  } catch (err) {
    console.error("[AI lead-summary] Error:", err.message);
    return res.status(500).json({
      success: false,
      message: "Something went wrong while generating AI lead summary",
    });
  }
});

router.post("/lead-intel/bulk", async (req, res) => {
  try {
    const anthropic = getAnthropicClient();
    if (!anthropic) {
      return res.status(500).json({
        success: false,
        message: "ANTHROPIC_API_KEY is not configured on server",
      });
    }

    const { leads = [] } = req.body || {};
    if (!Array.isArray(leads) || leads.length === 0) {
      return res.status(400).json({
        success: false,
        message: "leads array is required",
      });
    }

    const cleaned = {};
    // Process only top 5 leads at a time to keep response small & fast
    const limitedLeads = leads.slice(0, 5);

    const systemPrompt = `
You are an AI assistant for a counsellor CRM.
For ONE student lead, you must return VERY COMPACT JSON with:
- "summary": MAX 1 short sentence
- "score": integer 0–100 (higher = more likely to convert soon)
- "priority": "High" | "Medium" | "Low"

IMPORTANT:
- DO NOT add any explanations like "Here is the JSON".
- Reply with ONLY a single JSON object like:
{
  "summary": "...",
  "score": 80,
  "priority": "High"
}`;

    // Call Anthropic for each lead separately so a partial failure doesn't break all
    for (const lead of limitedLeads) {
      try {
        const userPrompt = `
Lead ID: ${lead._id}
Lead profile (JSON):
${JSON.stringify(lead, null, 2)}
`;

        const message = await anthropic.messages.create({
          model: getModel(),
          max_tokens: 200,
          temperature: 0.2,
          system: systemPrompt,
          messages: [{ role: "user", content: userPrompt }],
        });

        const raw = message?.content?.[0]?.text || "";

        let parsed;
        try {
          // Extract JSON block from any surrounding text
          let jsonStr = raw;
          const firstBrace = raw.indexOf("{");
          const lastBrace = raw.lastIndexOf("}");
          if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
            jsonStr = raw.slice(firstBrace, lastBrace + 1);
          }
          parsed = JSON.parse(jsonStr);
        } catch (e) {
          console.warn(
            `[AI lead-intel/bulk] Failed to parse JSON for lead ${lead._id}:`,
            e.message
          );
          continue;
        }

        const score = Math.max(
          0,
          Math.min(100, parseInt(parsed.score, 10) || 0)
        );
        let priority = parsed.priority;
        if (!["High", "Medium", "Low"].includes(priority)) {
          if (score >= 70) priority = "High";
          else if (score >= 40) priority = "Medium";
          else priority = "Low";
        }

        cleaned[lead._id] = {
          summary: String(parsed.summary || "").trim(),
          score,
          priority,
        };
      } catch (err) {
        console.warn(
          `[AI lead-intel/bulk] Error for lead ${lead._id}:`,
          err.message
        );
        // Skip this lead, continue with others
      }
    }

    return res.status(200).json({
      success: true,
      data: cleaned,
    });
  } catch (err) {
    console.error("[AI lead-intel/bulk] Error:", err.message);
    return res.status(500).json({
      success: false,
      message: "Something went wrong while generating AI intelligence for leads",
    });
  }
});

const SUPPORTED_LANGUAGES = {
  en: "English",
  hi: "Hindi",
  ta: "Tamil",
  te: "Telugu",
  bn: "Bengali",
  mr: "Marathi",
  gu: "Gujarati",
  kn: "Kannada",
  ml: "Malayalam",
  pa: "Punjabi",
  ur: "Urdu",
  or: "Odia",
  as: "Assamese",
};

function getLanguageInstruction(code) {
  const names = {
    en: "English",
    hi: "Hindi (हिंदी)",
    ta: "Tamil (தமிழ்)",
    te: "Telugu (తెలుగు)",
    bn: "Bengali (বাংলা)",
    mr: "Marathi (मराठी)",
    gu: "Gujarati (ગુજરાતી)",
    kn: "Kannada (ಕನ್ನಡ)",
    ml: "Malayalam (മലയാളം)",
    pa: "Punjabi (ਪੰਜਾਬੀ)",
    ur: "Urdu (اردو)",
    or: "Odia (ଓଡ଼ିଆ)",
    as: "Assamese (অসমীয়া)",
  };
  const name = names[code] || "English";
  return code === "en"
    ? "Respond in English only."
    : `Respond ONLY in ${name}. Use that language for the entire reply.`;
}

router.get("/counsellor-languages", (req, res) => {
  return res.status(200).json({
    success: true,
    data: Object.entries(SUPPORTED_LANGUAGES).map(([code, name]) => ({ code, name })),
  });
});

router.post("/counsellor-chat", async (req, res) => {
  try {
    const anthropic = getAnthropicClient();
    if (!anthropic) {
      return res.status(500).json({
        success: false,
        message: "ANTHROPIC_API_KEY is not configured on server",
      });
    }

    const { message, language = "en", conversationHistory = [] } = req.body || {};
    const langCode = String(language).toLowerCase().trim() || "en";
    const langInstruction = getLanguageInstruction(langCode);

    if (!message || !String(message).trim()) {
      return res.status(400).json({
        success: false,
        message: "message is required",
      });
    }

    const systemPrompt = `You are a friendly AI student counsellor for an educational institution. You help students and parents with:
- Course information, eligibility, and admissions
- Fees, scholarships, and financial queries
- Application process and documents
- General guidance about programs and careers

Be helpful, concise, and professional. If you don't know something, say so and suggest they contact the college office.

${langInstruction}`;

    const messages = [];
    for (const turn of conversationHistory) {
      if (turn.role === "user" && turn.content) {
        messages.push({ role: "user", content: turn.content });
      }
      if (turn.role === "assistant" && turn.content) {
        messages.push({ role: "assistant", content: turn.content });
      }
    }
    messages.push({ role: "user", content: String(message).trim() });

    const response = await anthropic.messages.create({
      model: getModel(),
      max_tokens: 1024,
      temperature: 0.4,
      system: systemPrompt,
      messages,
    });

    const reply = response?.content?.[0]?.text || "";

    return res.status(200).json({
      success: true,
      data: {
        reply: reply.trim(),
        language: langCode,
      },
    });
  } catch (err) {
    console.error("[AI counsellor-chat] Error:", err.message);
    return res.status(500).json({
      success: false,
      message: "Something went wrong while generating AI counsellor reply",
    });
  }
});

module.exports = router;

