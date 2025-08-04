const { google } = require('googleapis')
const axios = require('axios')
const {sheetId} = require('../../../config')

const SCOPES = ['https://www.googleapis.com/auth/spreadsheets'];
const serviceAccountKeyFile = "./focalyt-new-key.json";
const tabName = 'candidates';
const futureTechnologyLabstabName = 'FutureTechnology Lab';
const updateSpreadSheetRequestCallName = 'Request Callback Leads'
const carrertabName ='Carrer Page';
const labValues ='Lab Page';
const {User} = require('../../../controllers/models')

module.exports = {
  updateSpreadSheetValues,
  updateSpreadSheetLabLeadsValues,
  updateSpreadSheetCarrerValues,
  updateSpreadSheetRequestCallValues,
  getGoogleAuthToken,
  createGoogleCalendarEvent,
  
}

async function getAuthToken() {
  const auth = new google.auth.GoogleAuth({
    keyFile: serviceAccountKeyFile,
    scopes: SCOPES
  });
  const authToken = await auth.getClient();

  const sheets = google.sheets({
    version: 'v4',
    auth: authToken,
  });
  return sheets;
}

async function updateSpreadSheetValues(data) {
  const googleSheetClient = await getAuthToken();
  googleSheetClient.spreadsheets.values.append({
    spreadsheetId:sheetId,
    range: `${tabName}`,
    valueInputOption: 'USER_ENTERED',
    insertDataOption: 'INSERT_ROWS',
    resource: {
      "majorDimension": "ROWS",
      "values": [data]
    },
  });
}
async function updateSpreadSheetLabLeadsValues(data) {
  const googleSheetClient = await getAuthToken();
  googleSheetClient.spreadsheets.values.append({
    spreadsheetId:sheetId,
    range: `${futureTechnologyLabstabName}`,
    valueInputOption: 'USER_ENTERED',
    insertDataOption: 'INSERT_ROWS',
    resource: {
      "majorDimension": "ROWS",
      "values": [data]
    },
  });
}

async function updateSpreadSheetRequestCallValues(data) {
  const googleSheetClient = await getAuthToken();
  googleSheetClient.spreadsheets.values.append({
    spreadsheetId:sheetId,
    range: `${updateSpreadSheetRequestCallName}`,
    valueInputOption: 'USER_ENTERED',
    insertDataOption: 'INSERT_ROWS',
    resource: {
      "majorDimension": "ROWS",
      "values": [data]
    },
  });
}
async function updateSpreadSheetCarrerValues(data) {
  const googleSheetClient = await getAuthToken();
  googleSheetClient.spreadsheets.values.append({
    spreadsheetId:sheetId,
    range: `${carrertabName}`,
    valueInputOption: 'USER_ENTERED',
    insertDataOption: 'INSERT_ROWS',
    resource: {
      "majorDimension": "ROWS",
      "values": [data]
    },
  });
}
async function updateSpreadSheetLabValues(data) {
  const googleSheetClient = await getAuthToken();
  googleSheetClient.spreadsheets.values.append({
    spreadsheetId:sheetId,
    range: `${labValues}`,
    valueInputOption: 'USER_ENTERED',
    insertDataOption: 'INSERT_ROWS',
    resource: {
      "majorDimension": "ROWS",
      "values": [data]
    },
  });
}



async function getGoogleAuthToken(data) {
  const { code, redirectUri, user } = data;

  if(!code || !redirectUri){
    return {
      error: 'Authorization code and redirect URI are required'
    };
  }

  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  console.log(clientId, clientSecret, 'clientId, clientSecret');

  if(!clientId || !clientSecret){
    return {
      error: 'Client ID and client secret are required'
    };
  }

  console.log(data, 'data');
  console.log('Received authorization code:', code.substring(0, 20) + '...');

  try {
    const tokenResponse = await axios.post('https://oauth2.googleapis.com/token', {
      client_id: clientId,
      client_secret: clientSecret,
      code: code,
      grant_type: 'authorization_code',
      redirect_uri: redirectUri
    });
    // Note: No Content-Type header - axios will send as JSON and set appropriate header

    const tokens = tokenResponse.data;

    const updatedData = {
      'googleAuthToken.accessToken': tokens.access_token,
      'googleAuthToken.expiresAt': new Date(Date.now() + tokens.expires_in * 1000),
      'googleAuthToken.tokenType': tokens.token_type,
      'googleAuthToken.lastUpdated': new Date(),
      'googleAuthToken.idToken': tokens.id_token,
      'googleAuthToken.refreshToken': tokens.refresh_token,
      'googleAuthToken.scopes': tokens.scope
    }
  
    console.log(updatedData,'updatedData');
  
    const updateUser = await User.findByIdAndUpdate(user._id,updatedData,{new: true});
  
    const userData = updateUser.googleAuthToken;

    return userData;
  } catch (error) {
    console.error('Error exchanging authorization code:', error);
    
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
    
    throw error;
  }
}


async function getNewGoogleAccessToken(data) {
  const { refreshToken, user } = data;

  if(!refreshToken){
    return {
      error: 'Refresh token is required'
    };
  }

  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

  if(!clientId || !clientSecret){
    return {
      error: 'Client ID and client secret are required'
    };
  }

  try {
    const tokenResponse = await axios.post('https://oauth2.googleapis.com/token', {
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type: 'refresh_token'
    });

    const tokens = tokenResponse.data;
    const updatedData = {
      'googleAuthToken.accessToken': tokens.access_token,
      'googleAuthToken.expiresAt': new Date(Date.now() + tokens.expires_in * 1000),
      'googleAuthToken.tokenType': tokens.token_type,
      'googleAuthToken.lastUpdated': new Date(),
      'googleAuthToken.idToken': tokens.id_token,
      'googleAuthToken.scopes': tokens.scope
    }
  
    console.log(updatedData,'updatedData');
  
    const updateUser = await User.findByIdAndUpdate(user._id,updatedData,{new: true});
  
    const userData = updateUser.googleAuthToken;
    return userData;
  } catch (error) {
    console.error('Error refreshing Google access token:', error);
    throw error;
  }
}

async function getGoogleCalendarEvents(data) {
  const { accessToken, timeMin, timeMax, maxResults = 100 } = data;

  if(!accessToken){
    return {
      error: 'Access token is required'
    };
  }

  const calendar = google.calendar({
    version: 'v3',
    auth: accessToken
  });

  const events = await calendar.events.list({
    calendarId: 'primary',
    timeMin: new Date().toISOString(),
    maxResults: 100,
  });

  return events;
}

async function createGoogleCalendarEvent(data) {
  const { user, event } = data;

  if (!user || !user.googleAuthToken) {
    return { error: 'User or Google Auth Token is missing' };
  }

  let accessToken = user.googleAuthToken.accessToken;
  let expiresAt = user.googleAuthToken.expiresAt;
  const refreshToken = user.googleAuthToken.refreshToken;

  // Check if token is expired and refresh if needed
  if (expiresAt < Date.now()) {
    console.log('Token expired, refreshing...');
    try {
      const newTokenData = await getNewGoogleAccessToken({ refreshToken, user });
      accessToken = newTokenData.accessToken;
      expiresAt = newTokenData.expiresAt;
    } catch (error) {
      console.error('Error refreshing token:', error);
      return { error: 'Failed to refresh access token' };
    }
  }

  if (!accessToken || !event) {
    return { error: 'Access token and event are required' };
  }

  // CORRECT: Create OAuth2 client and set credentials
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );

  // Set the access token
  oauth2Client.setCredentials({
    access_token: accessToken,
    refresh_token: refreshToken,
    expiry_date: expiresAt
  });

  // Create calendar instance with OAuth2 client
  const calendar = google.calendar({ 
    version: 'v3', 
    auth: oauth2Client  // Use OAuth2 client, not just the token string
  });

  try {
    console.log('Creating calendar event with data:', JSON.stringify(event, null, 2));
    
    const newEvent = await calendar.events.insert({
      calendarId: 'primary',
      resource: event,
    });

    console.log('Event created successfully:', newEvent.data.id);
    return { 
      success: true, 
      event: newEvent.data 
    };

  } catch (error) {
    console.error('Error creating event:', error);
    
    // Handle specific error cases
    if (error.code === 401) {
      return { error: 'Authentication failed. Please re-authenticate with Google.' };
    } else if (error.code === 403) {
      return { error: 'Permission denied. Check calendar access permissions.' };
    } else if (error.code === 400) {
      return { error: 'Invalid event data provided.' };
    }
    
    return { error: `Error creating the event: ${error.message}` };
  }
}

