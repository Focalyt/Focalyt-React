const { google } = require('googleapis')
const axios = require('axios')
const path = require('path')
const {sheetId} = require('../../../config')

const SCOPES = ['https://www.googleapis.com/auth/spreadsheets'];
// Use absolute path relative to backend folder, not current working directory
const serviceAccountKeyFile = path.join(__dirname, '../../../focalyt-new-key.json');
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
  getAuthToken,
  getGoogleAuthToken,
  createGoogleCalendarEvent,
  getAllGoogleCalendarEvents,
  validateAndRefreshGoogleToken
  
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
  
  
    const updateUser = await User.findByIdAndUpdate(user._id,updatedData,{new: true});
  
    const userData = updateUser.googleAuthToken;
    return userData;
  } catch (error) {
    console.error('Error refreshing Google access token:', error);
    throw error;
  }
}




async function getAllGoogleCalendarEvents(data, options = {}) {
  

    let {user, maxResults = 100, startDate, endDate } = data;

    let timeMin = startDate ? new Date(startDate) : new Date().toISOString();
    let timeMax = endDate ? new Date(endDate) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

console.log(timeMin, timeMax,'timeMin, timeMax');

  if (!user || !user.googleAuthToken) {
    return { error: 'User or Google Auth Token is missing' };
  }

  let accessToken = user.googleAuthToken.accessToken;
  let expiresAt = user.googleAuthToken.expiresAt;
  const refreshToken = user.googleAuthToken.refreshToken;


  // Fix expiry date format - ensure it's a proper timestamp
  let expiryTimestamp;
  if (typeof expiresAt === 'string') {
    const match = expiresAt.match(/(\d{13})/);
    if (match) {
      expiryTimestamp = parseInt(match[1]);
    } else {
      expiryTimestamp = 0;
    }
  } else if (typeof expiresAt === 'number') {
    expiryTimestamp = expiresAt;
  } else {
    console.log('Unknown expiry format, treating as expired');
    expiryTimestamp = 0;
  }

 

  // Check if token is expired and refresh if needed (with 5 minute buffer)
  const bufferTime = 5 * 60 * 1000;
  if (expiryTimestamp < (Date.now() + bufferTime)) {
    try {
      const newTokenData = await getNewGoogleAccessToken({ refreshToken, user });
      if (newTokenData && newTokenData.accessToken) {
        accessToken = newTokenData.accessToken;
        expiresAt = newTokenData.expiresAt;
        console.log('Token refreshed successfully');
      } else {
        console.error('Token refresh returned invalid data:', newTokenData);
        return { error: 'Failed to refresh access token - invalid response' };
      }
    } catch (error) {
      console.error('Error refreshing token:', error);
      return { error: 'Failed to refresh access token: ' + error.message };
    }
  }

  if (!accessToken) {
    return { error: 'Access token is required' };
  }

  // Validate environment variables
  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
    console.error('Missing Google OAuth environment variables');
    return { error: 'Google OAuth configuration missing' };
  }

  // Create OAuth2 client and set credentials
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );

  const credentials = {
    access_token: accessToken,
    refresh_token: refreshToken,
  };

  if (expiryTimestamp && expiryTimestamp > 0) {
    credentials.expiry_date = expiryTimestamp;
  }

  

  oauth2Client.setCredentials(credentials);

  const calendar = google.calendar({
    version: 'v3',
    auth: oauth2Client
  });

  try {
    // Test authentication first
    try {
      const calendarList = await calendar.calendarList.list({ maxResults: 1 });
      console.log('Authentication test passed');
    } catch (authError) {
      console.error('Authentication test failed:', authError.message);
      return { error: 'Authentication failed during test: ' + authError.message };
    }

    let allEvents = [];
    let nextPageToken = null;
    let totalFetched = 0;
    const maxEventsPerRequest = 2500; // Google Calendar API max
    const absoluteMax = options.maxEvents || 10000; // Prevent infinite loops

    // Set time range with flexible date filtering options
    const now = new Date();
    timeMin = timeMin || now.toISOString();
    timeMax = timeMax || now.toISOString();

    // Default fallback if no dates set
    if (!timeMin || !timeMax) {
      const oneYearAgo = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
      const oneYearFromNow = new Date(now.getFullYear() + 1, now.getMonth(), now.getDate());
      timeMin = timeMin || oneYearAgo.toISOString();
      timeMax = timeMax || oneYearFromNow.toISOString();
    }

    const eventOptions = {
      calendarId: options.calendarId || 'primary',
      timeMin: timeMin,
      timeMax: timeMax,
      maxResults: Math.min(maxEventsPerRequest, absoluteMax),
      singleEvents: true, // Expand recurring events
      orderBy: 'startTime',
      showDeleted: false,
      showHiddenInvitations: false,
    };


    do {
      if (nextPageToken) {
        eventOptions.pageToken = nextPageToken;
      }

      const eventsResponse = await calendar.events.list(eventOptions);
      const events = eventsResponse.data.items || [];
      
      allEvents = allEvents.concat(events);
      nextPageToken = eventsResponse.data.nextPageToken;
      totalFetched += events.length;


      // Safety check to prevent infinite loops
      if (totalFetched >= absoluteMax) {
        console.log(`Reached maximum limit of ${absoluteMax} events`);
        break;
      }

    } while (nextPageToken);



    return { 
      success: true, 
      events: allEvents,
      totalCount: allEvents.length,
      timeRange: {
        from: eventOptions.timeMin,
        to: eventOptions.timeMax
      }
    };

  } catch (error) {
    console.error('Error getting all events:', error);
    
    if (error.response) {
      console.error('Error response:', {
        status: error.response.status,
        statusText: error.response.statusText,
        data: error.response.data
      });
    }
    
    // Handle specific error cases with retry logic
    if (error.code === 401 || error.status === 401) {
      console.log('Got 401, attempting token refresh...');
      try {
        const newTokenData = await getNewGoogleAccessToken({ refreshToken, user });
        if (newTokenData && newTokenData.accessToken) {
          console.log('Re-attempting with refreshed token...');
          oauth2Client.setCredentials({
            access_token: newTokenData.accessToken,
            refresh_token: refreshToken,
            expiry_date: newTokenData.expiresAt
          });
          
          // Retry the request
          return await getAllGoogleCalendarEvents(user, options);
        }
      } catch (retryError) {
        console.error('Retry after token refresh failed:', retryError);
      }
      
      return { error: 'Authentication failed. Please re-authenticate with Google.' };
    } else if (error.code === 403 || error.status === 403) {
      return { error: 'Permission denied. Check calendar access permissions.' };
    } else if (error.code === 400 || error.status === 400) {
      return { error: 'Invalid request parameters: ' + (error.message || 'Unknown validation error') };
    }
    
    return { error: `Error getting events: ${error.message}` };
  }
}

async function createGoogleCalendarEvent(data) {
  const { user, event } = data;

  if (!user || !user.googleAuthToken) {
    return { error: 'User or Google Auth Token is missing' };
  }

  let accessToken = user.googleAuthToken.accessToken;
  let expiresAt = user.googleAuthToken.expiresAt;
  const refreshToken = user.googleAuthToken.refreshToken;

  console.log('Token Debug Info:');
  console.log('- Access Token:', accessToken ? `${accessToken.substring(0, 20)}...` : 'MISSING');
  console.log('- Expires At:', expiresAt, '(Type:', typeof expiresAt, ')');
  console.log('- Refresh Token:', refreshToken ? `${refreshToken.substring(0, 20)}...` : 'MISSING');
  console.log('- Current Time:', Date.now());

  // Fix expiry date format - ensure it's a proper timestamp
  let expiryTimestamp;
  if (typeof expiresAt === 'string') {
    // If it's a string, try to parse it or extract timestamp
    const match = expiresAt.match(/(\d{13})/); // Look for 13-digit timestamp
    if (match) {
      expiryTimestamp = parseInt(match[1]);
    } else {
      expiryTimestamp = 0; // Force refresh
    }
  } else if (typeof expiresAt === 'number') {
    expiryTimestamp = expiresAt;
  } else {
    console.log('Unknown expiry format, treating as expired');
    expiryTimestamp = 0; // Force refresh
  }

  console.log('- Parsed Expiry Timestamp:', expiryTimestamp);
  console.log('- Is Expired:', expiryTimestamp < Date.now());

  // Check if token is expired and refresh if needed (with 5 minute buffer)
  const bufferTime = 5 * 60 * 1000; // 5 minutes in milliseconds
  if (expiryTimestamp < (Date.now() + bufferTime)) {
    try {
      const newTokenData = await getNewGoogleAccessToken({ refreshToken, user });
      if (newTokenData && newTokenData.accessToken) {
        accessToken = newTokenData.accessToken;
        expiresAt = newTokenData.expiresAt;
        console.log('Token refreshed successfully');
      } else {
        console.error('Token refresh returned invalid data:', newTokenData);
        return { error: 'Failed to refresh access token - invalid response' };
      }
    } catch (error) {
      console.error('Error refreshing token:', error);
      return { error: 'Failed to refresh access token: ' + error.message };
    }
  }

  if (!accessToken || !event) {
    return { error: 'Access token and event are required' };
  }

  // Validate environment variables
  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
    console.error('Missing Google OAuth environment variables');
    return { error: 'Google OAuth configuration missing' };
  }

  // Create OAuth2 client and set credentials
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );

  // Set the credentials with proper format
  const credentials = {
    access_token: accessToken,
    refresh_token: refreshToken,
  };

  // Add expiry_date if we have a valid timestamp
  if (expiryTimestamp && expiryTimestamp > 0) {
    credentials.expiry_date = expiryTimestamp;
  }

  console.log('Setting credentials:', {
    access_token: accessToken ? `${accessToken.substring(0, 20)}...` : 'MISSING',
    refresh_token: refreshToken ? `${refreshToken.substring(0, 20)}...` : 'MISSING',
    expiry_date: credentials.expiry_date
  });

  oauth2Client.setCredentials(credentials);

  // Create calendar instance with OAuth2 client
  const calendar = google.calendar({ 
    version: 'v3', 
    auth: oauth2Client
  });

  try {
    console.log('Creating calendar event with data:', JSON.stringify(event, null, 2));
    
    // Test authentication first with a simple request
    try {
      const calendarList = await calendar.calendarList.list({
        maxResults: 1
      });
      console.log('Authentication test passed');
    } catch (authError) {
      console.error('Authentication test failed:', authError.message);
      return { error: 'Authentication failed during test: ' + authError.message };
    }
    
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
    
    // Detailed error logging
    if (error.response) {
      console.error('Error response:', {
        status: error.response.status,
        statusText: error.response.statusText,
        data: error.response.data,
        headers: error.response.headers
      });
    }
    
    // Handle specific error cases
    if (error.code === 401 || error.status === 401) {
      // Try to refresh token one more time
      console.log('Got 401, attempting token refresh...');
      try {
        const newTokenData = await getNewGoogleAccessToken({ refreshToken, user });
        if (newTokenData && newTokenData.accessToken) {
          console.log('Re-attempting with refreshed token...');
          oauth2Client.setCredentials({
            access_token: newTokenData.accessToken,
            refresh_token: refreshToken,
            expiry_date: newTokenData.expiresAt
          });
          
          const retryEvent = await calendar.events.insert({
            calendarId: 'primary',
            resource: event,
          });
          
          return { 
            success: true, 
            event: retryEvent.data 
          };
        }
      } catch (retryError) {
        console.error('Retry after token refresh failed:', retryError);
      }
      
      return { error: 'Authentication failed. Please re-authenticate with Google.' };
    } else if (error.code === 403 || error.status === 403) {
      return { error: 'Permission denied. Check calendar access permissions.' };
    } else if (error.code === 400 || error.status === 400) {
      return { error: 'Invalid event data provided: ' + (error.message || 'Unknown validation error') };
    }
    
    return { error: `Error creating the event: ${error.message}` };
  }
}

// Helper function to validate and refresh Google tokens
async function validateAndRefreshGoogleToken(user) {
  if (!user.googleAuthToken) {
    throw new Error('No Google auth token found');
  }

  const { accessToken, refreshToken, expiresAt } = user.googleAuthToken;
  
  // Parse expiry timestamp
  let expiryTimestamp = 0;
  if (typeof expiresAt === 'string') {
    const match = expiresAt.match(/(\d{13})/);
    if (match) {
      expiryTimestamp = parseInt(match[1]);
    }
  } else if (typeof expiresAt === 'number') {
    expiryTimestamp = expiresAt;
  }

  // Check if token needs refresh (with 5 minute buffer)
  const bufferTime = 5 * 60 * 1000;
  if (expiryTimestamp < (Date.now() + bufferTime)) {
    console.log('Refreshing expired token...');
    const newTokenData = await getNewGoogleAccessToken({ refreshToken, user });
    return newTokenData;
  }

  return { accessToken, refreshToken, expiresAt: expiryTimestamp };
}

