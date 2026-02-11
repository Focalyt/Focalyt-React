/**
 * Generate a short share-friendly description for a course using Anthropic API.
 * Used for OG/Twitter card meta so shared links show a nice title + description.
 */

const Anthropic = require("@anthropic-ai/sdk");

const SHARE_DESC_MAX_LENGTH = 200;
const API_TIMEOUT_MS = 2500;

/**
 * @param {object} course - Course document (plain object or mongoose doc)
 * @returns {Promise<string|null>} - Short description or null on failure
 */
async function getCourseShareDescription(course) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey || !apiKey.startsWith("sk-ant-")) {
    return null;
  }

  const name = course?.name || "Course";
  const desc = (course?.description || "").trim().slice(0, 500);
  const duration = course?.duration || "";
  const mode = course?.trainingMode || "";
  const type = course?.courseType === "coursejob" ? "Course + Jobs" : "Course";

  const prompt = `You are writing a single short sentence for a social share card (Open Graph / WhatsApp / Twitter preview). It must be under ${SHARE_DESC_MAX_LENGTH} characters, engaging and clear. No quotes or bullet points.

Course name: ${name}
${duration ? `Duration: ${duration}` : ""}
${mode ? `Mode: ${mode}` : ""}
Type: ${type}
${desc ? `Full description (use only to make the sentence better): ${desc}` : ""}

Reply with ONLY the one-sentence description, nothing else.`;

  try {
    const anthropic = new Anthropic({ apiKey });
    const model = process.env.ANTHROPIC_MODEL
      ? process.env.ANTHROPIC_MODEL.split(",").map((m) => m.trim())[0]
      : "claude-3-haiku-20240307";

    const apiCall = anthropic.messages.create({
      model: model,
      max_tokens: 150,
      messages: [{ role: "user", content: prompt }],
    });

    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error("Timeout")), API_TIMEOUT_MS)
    );

    const message = await Promise.race([apiCall, timeoutPromise]);
    const text =
      message?.content?.[0]?.text?.trim().slice(0, SHARE_DESC_MAX_LENGTH) || null;
    return text || null;
  } catch (err) {
    console.warn("[courseShareMeta] Anthropic failed:", err?.message || err);
    return null;
  }
}

module.exports = { getCourseShareDescription };
