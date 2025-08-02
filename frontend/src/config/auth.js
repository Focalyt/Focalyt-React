// Authentication Configuration
export const AUTH_CONFIG = {
  // Google OAuth Configuration
  GOOGLE_CLIENT_ID: process.env.REACT_APP_GOOGLE_CLIENT_ID || '449914901350-ibgtfl0tbog7vb91u7d5s9cmo92ba1kg.apps.googleusercontent.com',
  
  // Backend URL
  BACKEND_URL: process.env.REACT_APP_MIPIE_BACKEND_URL || 'http://localhost:3000',
  
  // Google OAuth Scopes
  GOOGLE_SCOPES: [
    'openid',
    'profile', 
    'email',
    'https://www.googleapis.com/auth/calendar'
  ].join(' '),
  
  // Google OAuth Configuration
  GOOGLE_CONFIG: {
    client_id: process.env.REACT_APP_GOOGLE_CLIENT_ID || '449914901350-ibgtfl0tbog7vb91u7d5s9cmo92ba1kg.apps.googleusercontent.com',
    auto_select: false,
    cancel_on_tap_outside: true,
    prompt_parent_id: 'google-signin-container'
  }
};

export default AUTH_CONFIG; 