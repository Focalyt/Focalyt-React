import axios from "axios";

function getFromCookieOrSession(key) {
  const cookieMatch = document.cookie.match(new RegExp('(^| )' + key + '=([^;]+)'));
  if (cookieMatch) return cookieMatch[2];

  return sessionStorage.getItem(key) || undefined;
}

export const trackMetaConversion = async ({ eventName,  sourceUrl, value,currency}) => {
  const fbp = getFromCookieOrSession('_fbp');
  const fbc = getFromCookieOrSession('_fbc');
  try {
    await axios.post(`${process.env.REACT_APP_MIPIE_BACKEND_URL}/meta/track-conversion`, {
      eventName,
      eventSourceUrl: sourceUrl || window.location.href,
      value,currency,fbp,fbc
    },
    {
      headers: {
        'x-auth': localStorage.getItem('token')
      }
    });
    
    console.log(`${eventName} event tracked successfully`);
  } catch (err) {
    console.error("Meta Conversion Error:", err.response?.data || err.message);
  }
};
