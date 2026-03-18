// Component/googleOAuth.js - Simple Authorization Code Only
import axios from 'axios';

// Backend URL configuration
const backendUrl = process.env.REACT_APP_MIPIE_BACKEND_URL


/**
 * Simple Google OAuth - Returns only authorization code
 */

const GOOGLE_CONFIG = {
  CLIENT_ID: "449914901350-ibgtfl0tbog7vb91u7d5s9cmo92ba1kg.apps.googleusercontent.com",
  DEFAULT_SCOPES: [
    'openid',
    'profile',
    'email',
    'https://www.googleapis.com/auth/calendar'
  ]
};

/**
 * Get Google Authorization Code via Popup
 * @param {Object} options - OAuth options
 * @returns {Promise<string>} Authorization code
 */
const getGoogleAuthCode = async (options = {}) => {
  const {
    scopes = GOOGLE_CONFIG.DEFAULT_SCOPES,
    forceConsent = true
  } = options;

  return new Promise(async (resolve, reject) => {
    try {
      console.log('🪟 Opening Google OAuth popup...');
      
      // Generate authorization URL
      const params = new URLSearchParams({
        client_id: GOOGLE_CONFIG.CLIENT_ID,
        redirect_uri: window.location.origin,
        response_type: 'code',
        scope: Array.isArray(scopes) ? scopes.join(' ') : scopes,
        access_type: 'offline',
        prompt: forceConsent ? 'consent' : 'select_account',
        include_granted_scopes: 'true',
        state: `auth_${Date.now()}`
      });

      const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
      console.log('🔗 Auth URL:', authUrl);
      
      // Open popup
      const popup = window.open(
        authUrl,
        'googleOAuth',
        'width=500,height=600,scrollbars=yes,resizable=yes'
      );

      if (!popup) {
        reject(new Error('Popup blocked! Please allow popups.'));
        return;
      }

      // Monitor popup
      const pollTimer = setInterval(() => {
        try {
          if (popup.closed) {
            clearInterval(pollTimer);
            reject(new Error('Popup closed by user'));
            return;
          }

          let popupUrl;
          try {
            popupUrl = popup.location.href;
          } catch (e) {
            // Still on Google domain, continue polling
            return;
          }

          // Check if redirected back to our domain
          if (popupUrl.includes(window.location.origin)) {
            clearInterval(pollTimer);
            
            const urlParams = new URLSearchParams(popup.location.search);
            const code = urlParams.get('code');
            const error = urlParams.get('error');
            
            popup.close();

            if (error) {
              reject(new Error(`OAuth Error: ${error}`));
            } else if (code) {
              console.log('✅ Authorization code received:', code);
              resolve(code);
            } else {
              reject(new Error('No authorization code received'));
            }
          }

        } catch (error) {
          // Expected cross-origin error
        }
      }, 1000);

      // 5 minute timeout
      setTimeout(() => {
        if (!popup.closed) {
          popup.close();
        }
        clearInterval(pollTimer);
        reject(new Error('OAuth timeout'));
      }, 300000);

    } catch (error) {
      console.error('❌ OAuth failed:', error);
      reject(error);
    }
  });
};

const getGoogleRefreshToken = async (data) => {
  let { code, redirectUri, user, endpoint } = data;
  const storedUser = JSON.parse(sessionStorage.getItem('user') || '{}');
  const resolvedUser = user && Object.keys(user).length > 0 ? user : storedUser;
  const token = JSON.parse(sessionStorage.getItem('token') || 'null');
  const googleAuthEndpoint = endpoint || '/api/getgoogleauth';

  if(!code || !resolvedUser?._id){
    throw new Error('User session not found for Google Calendar connection');
  }

  
  try {
    const response = await axios.post(`${backendUrl}${googleAuthEndpoint}`, {
      code,
      redirectUri : redirectUri || window.location.origin,
      user: resolvedUser
    }, {
      headers: token ? { 'x-auth': token } : {}
    });

    if (!response?.data?.success || !response?.data?.data) {
      throw new Error(response?.data?.error || response?.data?.message || 'Failed to connect Google Calendar');
    }

    return response.data;
  } catch (error) {
    const backendMessage = error?.response?.data?.error || error?.response?.data?.message;
    throw new Error(backendMessage || error.message || 'Failed to connect Google Calendar');
  }
}

// Export functions
export { getGoogleRefreshToken, getGoogleAuthCode };
