# WebSocket WhatsApp Integration Setup Guide

## Overview
This guide explains how to set up and use the WebSocket-based WhatsApp Business API integration for real-time messaging in the Focalyt platform.

## Features
- ✅ Real-time WebSocket connection for instant messaging
- ✅ WhatsApp Business API integration
- ✅ Message history tracking
- ✅ Bulk messaging support
- ✅ Template message support
- ✅ Real-time notifications
- ✅ Automatic reconnection
- ✅ Message status tracking

## Prerequisites
1. Node.js 14+ installed
2. MongoDB database
3. Facebook Developer Account
4. WhatsApp Business API access
5. Valid SSL certificate (for production)

## Installation

### 1. Install Dependencies
```bash
cd backend
npm install ws
```

### 2. Environment Variables
Add these to your `.env` file:
```env
# WebSocket Configuration
WS_PORT=3001

# WhatsApp Business API
WHATSAPP_ACCESS_TOKEN=your_whatsapp_access_token
WHATSAPP_BUSINESS_ACCOUNT_ID=your_business_account_id
WHATSAPP_PHONE_NUMBER=your_whatsapp_phone_number

# Facebook App Configuration
FACEBOOK_APP_ID=your_facebook_app_id
FACEBOOK_APP_SECRET=your_facebook_app_secret
```

## Setup Instructions

### 1. Facebook App Setup
1. Go to [Facebook Developers](https://developers.facebook.com/)
2. Create a new app or use existing one
3. Add WhatsApp Business API product
4. Configure permissions:
   - `whatsapp_business_management`
   - `business_management`
   - `pages_read_engagement`

### 2. WhatsApp Business API Setup
1. In your Facebook app, go to WhatsApp > Getting Started
2. Add your phone number
3. Verify the phone number
4. Get your Business Account ID and Access Token

### 3. Backend Configuration
The WebSocket server is automatically initialized in `mmt.js`:
```javascript
// Initialize WebSocket server
const WebSocketServer = require('./websocket');
const wsServer = new WebSocketServer(server);
global.wsServer = wsServer;
```

### 4. Frontend Configuration
Import and use the WebSocket client:
```javascript
import websocketClient from '../utils/websocket';

// Set token and connect
websocketClient.setToken(token);
websocketClient.connect();
```

## API Endpoints

### WhatsApp Routes (`/college/whatsapp`)

#### 1. Get Connection Status
```http
GET /college/whatsapp/status
```

#### 2. Send Single Message
```http
POST /college/whatsapp/send-message
Content-Type: application/json

{
  "recipientPhone": "+91XXXXXXXXXX",
  "message": "Hello from Focalyt!",
  "messageType": "text"
}
```

#### 3. Send Bulk Messages
```http
POST /college/whatsapp/send-bulk-messages
Content-Type: application/json

{
  "recipients": ["+91XXXXXXXXXX", "+91XXXXXXXXXX"],
  "message": "Bulk message from Focalyt!",
  "messageType": "text"
}
```

#### 4. Send Template Message
```http
POST /college/whatsapp/send-message
Content-Type: application/json

{
  "recipientPhone": "+91XXXXXXXXXX",
  "messageType": "template",
  "templateId": "welcome_template",
  "variables": [
    {"name": "name", "value": "John"},
    {"name": "course", "value": "Web Development"}
  ]
}
```

#### 5. Get Message History
```http
GET /college/whatsapp/message-history?page=1&limit=20
```

#### 6. Get Message Status
```http
GET /college/whatsapp/message-status/:messageId
```

#### 7. Save Configuration
```http
POST /college/whatsapp/save-config
Content-Type: application/json

{
  "accessToken": "your_access_token",
  "businessAccountId": "your_business_account_id",
  "phoneNumber": "your_phone_number"
}
```

## WebSocket Events

### Client to Server Messages

#### 1. Send WhatsApp Message
```javascript
{
  "type": "whatsapp_message",
  "recipientId": "user_id",
  "content": "Hello!",
  "messageType": "text",
  "templateId": null,
  "variables": null
}
```

#### 2. Join Room
```javascript
{
  "type": "join_room",
  "roomId": "college_id"
}
```

#### 3. Leave Room
```javascript
{
  "type": "leave_room",
  "roomId": "college_id"
}
```

#### 4. Ping
```javascript
{
  "type": "ping"
}
```

### Server to Client Messages

#### 1. Welcome Message
```javascript
{
  "type": "welcome",
  "message": "Connected to WhatsApp WebSocket server",
  "userId": "user_id",
  "userType": "college",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

#### 2. WhatsApp Notification
```javascript
{
  "type": "whatsapp_notification",
  "notification": {
    "type": "message_sent",
    "messageId": "msg_id",
    "recipientPhone": "+91XXXXXXXXXX",
    "status": "sent",
    "timestamp": "2024-01-15T10:30:00.000Z"
  },
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

#### 3. Message Status Update
```javascript
{
  "type": "message_status",
  "messageId": "msg_id",
  "status": "delivered",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

#### 4. Bulk Message Completed
```javascript
{
  "type": "whatsapp_notification",
  "notification": {
    "type": "bulk_message_completed",
    "totalRecipients": 10,
    "successCount": 8,
    "failedCount": 2,
    "results": [...],
    "timestamp": "2024-01-15T10:30:00.000Z"
  }
}
```

## Frontend Usage

### 1. Initialize WebSocket Connection
```javascript
import websocketClient from '../utils/websocket';

useEffect(() => {
  const token = localStorage.getItem('token');
  if (token) {
    websocketClient.setToken(token);
    websocketClient.connect();
    
    // Set up event handlers
    websocketClient.onConnection('connected', () => {
      console.log('WebSocket connected');
    });
    
    websocketClient.onMessage('whatsapp_notification', (message) => {
      console.log('WhatsApp notification:', message);
    });
  }
  
  return () => {
    websocketClient.disconnect();
  };
}, []);
```

### 2. Send Message via API
```javascript
const sendMessage = async () => {
  try {
    const response = await axios.post('/college/whatsapp/send-message', {
      recipientPhone: '+91XXXXXXXXXX',
      message: 'Hello from Focalyt!',
      messageType: 'text'
    }, {
      headers: { 'x-auth': token }
    });
    
    if (response.data.status) {
      toast.success('Message sent successfully');
    }
  } catch (error) {
    toast.error('Failed to send message');
  }
};
```

### 3. Listen for Real-time Updates
```javascript
websocketClient.onMessage('whatsapp_notification', (message) => {
  const { notification } = message;
  
  switch (notification.type) {
    case 'message_sent':
      toast.success(`Message sent to ${notification.recipientPhone}`);
      break;
    case 'message_error':
      toast.error(`Failed to send message: ${notification.error}`);
      break;
    case 'bulk_message_completed':
      toast.info(`Bulk message completed: ${notification.successCount} successful`);
      break;
  }
});
```

## Database Schema

### College Model (Updated)
```javascript
whatsappConfig: {
  accessToken: { type: String },
  businessAccountId: { type: String },
  phoneNumber: { type: String },
  lastConnected: { type: Date },
  lastMessageSent: { type: Date },
  lastBulkMessageSent: { type: Date },
  messageCount: { type: Number, default: 0 },
  isActive: { type: Boolean, default: false }
}
```

### WhatsApp Message Model
```javascript
{
  collegeId: ObjectId,
  recipientPhone: String,
  message: String,
  messageType: String, // 'text', 'template', 'media'
  templateId: String,
  variables: Array,
  whatsappMessageId: String,
  status: String, // 'pending', 'sent', 'delivered', 'read', 'failed'
  error: { code: String, message: String },
  sentBy: ObjectId,
  sentAt: Date,
  deliveredAt: Date,
  readAt: Date,
  bulkMessageId: String,
  isBulkMessage: Boolean
}
```

## Security Considerations

### 1. Authentication
- All WebSocket connections require valid JWT token
- Tokens are validated on connection
- Unauthorized connections are immediately closed

### 2. Rate Limiting
- Implement rate limiting for message sending
- Monitor API usage to avoid hitting WhatsApp limits

### 3. Error Handling
- Graceful handling of connection failures
- Automatic reconnection with exponential backoff
- Proper error logging and monitoring

## Monitoring and Debugging

### 1. WebSocket Status
```javascript
// Check connection status
const status = websocketClient.getConnectionStatus();
console.log('WebSocket status:', status);

// Check if connected
const isConnected = websocketClient.isConnected();
console.log('Is connected:', isConnected);
```

### 2. Connected Clients
```http
GET /college/whatsapp/connected-clients
```

### 3. Message History
```http
GET /college/whatsapp/message-history?page=1&limit=50
```

## Troubleshooting

### Common Issues

#### 1. WebSocket Connection Failed
- Check if token is valid
- Verify server is running
- Check firewall settings
- Ensure SSL certificate is valid (for production)

#### 2. WhatsApp API Errors
- Verify access token is valid
- Check business account ID
- Ensure phone number is verified
- Check message format and content

#### 3. Message Not Delivered
- Verify recipient phone number format
- Check if recipient has opted out
- Verify message content meets WhatsApp guidelines
- Check API rate limits

### Debug Commands
```javascript
// Enable debug logging
websocketClient.onConnection('error', (error) => {
  console.error('WebSocket error:', error);
});

// Monitor all messages
websocketClient.onMessage('*', (message) => {
  console.log('All messages:', message);
});
```

## Production Deployment

### 1. SSL Configuration
```javascript
// For production, use WSS (secure WebSocket)
const wsUrl = 'wss://yourdomain.com';
```

### 2. Load Balancer Configuration
- Configure load balancer for WebSocket support
- Use sticky sessions for WebSocket connections
- Set appropriate timeouts

### 3. Monitoring
- Set up logging for WebSocket events
- Monitor connection counts
- Track message delivery rates
- Set up alerts for failures

## Support

For issues and questions:
1. Check the logs for error messages
2. Verify all configuration is correct
3. Test with a simple message first
4. Contact the development team

## Changelog

### v1.0.0
- Initial WebSocket implementation
- WhatsApp Business API integration
- Real-time messaging support
- Message history tracking
- Bulk messaging support 