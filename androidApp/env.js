// Fallback resolver for Metro so `import { API_URL } from '@env'` works.
// Values are injected from `.env` by react-native-dotenv at build time; this
// file is only used when Metro can't resolve the virtual module.
module.exports = {
  API_URL: process.env.API_URL,
  WEB_APP_URL: process.env.WEB_APP_URL,
  GOOGLE_OAUTH_CLIENT_ID: process.env.GOOGLE_OAUTH_CLIENT_ID,
  GOOGLE_OAUTH_REDIRECT_URI: process.env.GOOGLE_OAUTH_REDIRECT_URI,
};

