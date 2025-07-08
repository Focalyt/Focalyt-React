# Facebook WhatsApp Business API Integration Setup

This guide explains how to set up Facebook WhatsApp Business API integration for the college portal.

## Overview

The integration allows colleges to:
- Connect their Facebook Business account
- Access WhatsApp Business API
- Send messages to students and candidates
- Manage business accounts and phone numbers

## Prerequisites

1. **Facebook Developer Account**
   - Create a Facebook Developer account at [developers.facebook.com](https://developers.facebook.com)
   - Verify your account with a phone number

2. **Facebook App**
   - Create a new Facebook App
   - Add WhatsApp Business API product
   - Configure app settings

3. **WhatsApp Business Account**
   - Set up a WhatsApp Business Account
   - Verify your business phone number
   - Get approval for messaging

## Backend Setup

### 1. Environment Variables

Add these to your `.env` file:

```env
# Facebook App Configuration
FACEBOOK_APP_ID=your_facebook_app_id
FACEBOOK_APP_SECRET=your_facebook_app_secret

# WhatsApp Business API
WHATSAPP_BUSINESS_API_TOKEN=your_whatsapp_token
WHATSAPP_PHONE_NUMBER_ID=your_phone_number_id
WHATSAPP_BUSINESS_ACCOUNT_ID=your_business_account_id
```

### 2. Database Schema

The College model has been updated with WhatsApp configuration fields:

```javascript
whatsappConfig: {
  accessToken: String,
  businessAccountId: String,
  phoneNumber: String,
  lastConnected: Date,
  lastMessageSent: Date,
  lastBulkMessageSent: Date,
  messageCount: Number,
  isActive: Boolean,
  
  // Facebook Integration
  facebookAccessToken: String,
  facebookUserInfo: {
    id: String,
    name: String,
    email: String,
    picture: {
      data: {
        url: String
      }
    }
  },
  facebookBusinessAccounts: [{
    id: String,
    name: String,
    business_id: String,
    business_name: String,
    phone: String,
    verification_status: String
  }]
}
```

### 3. API Endpoints

#### Save Facebook Token
```
POST /college/whatsapp/save-facebook-token
```

**Request Body:**
```json
{
  "accessToken": "facebook_access_token",
  "userInfo": {
    "id": "user_id",
    "name": "User Name",
    "email": "user@example.com",
    "picture": {
      "data": {
        "url": "profile_picture_url"
      }
    }
  },
  "businessAccounts": [
    {
      "id": "business_account_id",
      "name": "Business Name",
      "business_id": "business_id",
      "business_name": "Business Name",
      "phone": "phone_number",
      "verification_status": "verified"
    }
  ]
}
```

#### Get Facebook Data
```
GET /college/whatsapp/facebook-data
```

#### Clear Facebook Data
```
POST /college/whatsapp/clear-facebook-data
```

#### Get Connection Status
```
GET /college/whatsapp/status
```

## Frontend Setup

### 1. Environment Variables

Add to your `.env` file:

```env
REACT_APP_FACEBOOK_APP_ID=your_facebook_app_id
REACT_APP_MIPIE_BACKEND_URL=http://localhost:3000
```

### 2. Dependencies

Install required packages:

```bash
npm install axios react-toastify
```

### 3. Facebook SDK Integration

The WhatsApp page automatically loads the Facebook SDK and handles:

- Facebook login/logout
- Token management
- Business account retrieval
- User information fetching

### 4. Component Features

The WhatsApp component includes:

- **Facebook Connect Button**: Initiates Facebook login
- **Token Management**: Stores and retrieves access tokens
- **Business Account Selection**: Choose from available WhatsApp Business accounts
- **Connection Testing**: Test API connectivity
- **Real-time Status**: Show connection status
- **WebSocket Integration**: Real-time notifications

## Facebook App Configuration

### 1. Create Facebook App

1. Go to [developers.facebook.com](https://developers.facebook.com)
2. Click "Create App"
3. Select "Business" as app type
4. Fill in app details

### 2. Add WhatsApp Business API

1. In your app dashboard, click "Add Product"
2. Find "WhatsApp Business API" and click "Set Up"
3. Follow the setup wizard

### 3. Configure App Settings

#### Basic Settings
- **App Domains**: Add your domain
- **Privacy Policy URL**: Required for production
- **Terms of Service URL**: Required for production

#### Facebook Login Settings
- **Valid OAuth Redirect URIs**: Add your callback URLs
- **Client OAuth Settings**: Enable required permissions

#### WhatsApp Business API Settings
- **Phone Number ID**: Your WhatsApp Business phone number
- **Access Token**: Generate and store securely
- **Webhook URL**: For receiving messages (optional)

### 4. Required Permissions

Add these permissions to your Facebook app:

```
whatsapp_business_management
business_management
pages_read_engagement
pages_manage_metadata
```

### 5. App Review

For production use, submit your app for review:

1. Complete app review checklist
2. Submit for review
3. Wait for approval (can take several days)

## Usage Flow

### 1. College Login
- College admin logs into the portal
- Navigates to WhatsApp section

### 2. Facebook Connection
- Clicks "Connect with Facebook"
- Authorizes the app
- Token is saved to database

### 3. Business Account Selection
- View available WhatsApp Business accounts
- Select the account to use
- Configure phone number

### 4. Send Messages
- Use the messaging interface
- Send individual or bulk messages
- Track message status

## Security Considerations

### 1. Token Storage
- Access tokens are encrypted in database
- Tokens expire and need refresh
- Implement token refresh mechanism

### 2. API Rate Limits
- Facebook has rate limits
- Implement rate limiting in your app
- Monitor API usage

### 3. Data Privacy
- Follow GDPR guidelines
- Implement data retention policies
- Secure user data

## Troubleshooting

### Common Issues

1. **"App not configured" error**
   - Check Facebook App ID
   - Verify app is in development mode
   - Add your domain to app settings

2. **"Invalid access token" error**
   - Token may have expired
   - Check token permissions
   - Regenerate token if needed

3. **"No business accounts found"**
   - Verify business account setup
   - Check account permissions
   - Ensure WhatsApp Business API is enabled

### Debug Mode

Enable debug mode in development:

```javascript
// In Facebook SDK initialization
window.FB.init({
  appId: FACEBOOK_APP_ID,
  cookie: true,
  xfbml: true,
  version: "v18.0",
  debug: true // Enable debug mode
});
```

## Production Deployment

### 1. Environment Setup
- Use production Facebook App
- Configure production URLs
- Set up SSL certificates

### 2. Monitoring
- Monitor API usage
- Set up error tracking
- Implement logging

### 3. Backup
- Regular database backups
- Token backup strategy
- Disaster recovery plan

## Support

For issues and questions:

1. Check Facebook Developer Documentation
2. Review WhatsApp Business API docs
3. Contact development team
4. Check application logs

## Changelog

### Version 1.0.0
- Initial Facebook integration
- Token management
- Business account selection
- Basic messaging functionality

### Version 1.1.0
- WebSocket integration
- Real-time notifications
- Enhanced error handling
- Improved UI/UX 