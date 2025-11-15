const axios = require("axios");

const WHATSAPP_API_URL =
  process.env.WHATSAPP_API_URL || "https://graph.facebook.com/v21.0";
const WHATSAPP_PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_ID;
const WHATSAPP_ACCESS_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN;

function formatPhoneNumber(number) {
  if (!number) return null;

  const trimmed = number.toString().replace(/\D/g, "");
  if (!trimmed) return null;

  // If number already includes country code (e.g., 91...), keep it.
  if (trimmed.length >= 11) {
    return trimmed;
  }

  // Default to India country code if none provided.
  return `91${trimmed}`;
}

async function sendWhatsAppTextMessage(rawNumber, message) {
  try {
    if (!WHATSAPP_ACCESS_TOKEN || !WHATSAPP_PHONE_NUMBER_ID) {
      console.warn(
        "[WhatsApp] Missing credentials. Skipping message dispatch."
      );
      return;
    }

    const to = formatPhoneNumber(rawNumber);
    if (!to) {
      console.warn("[WhatsApp] Invalid recipient number. Skipping message.");
      return;
    }

    const payload = {
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to,
      type: "text",
      text: {
        preview_url: false,
        body: message,
      },
    };

    await axios.post(
      `${WHATSAPP_API_URL}/${WHATSAPP_PHONE_NUMBER_ID}/messages`,
      payload,
      {
        headers: {
          Authorization: `Bearer ${WHATSAPP_ACCESS_TOKEN}`,
          "Content-Type": "application/json",
        },
      }
    );

    console.log(`[WhatsApp] Message queued for ${to}`);
  } catch (error) {
    console.error(
      "[WhatsApp] Failed to send message:",
      error.response?.data || error.message
    );
  }
}

module.exports = {
  sendWhatsAppTextMessage,
};

