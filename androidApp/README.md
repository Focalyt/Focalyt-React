# Focalyt Portal

A React Native app with OTP-based authentication and location tracking features.

## Features

### 🔐 OTP-Based Login System
- **Phone Number Validation**: Validates Indian phone numbers (10 digits starting with 6-9)
- **OTP Generation**: Automatically generates 4-digit OTP codes
- **Resend Functionality**: 30-second cooldown timer for resending OTP
- **Auto-focus OTP Inputs**: Seamless navigation between OTP input fields
- **Session Management**: Persistent login state using AsyncStorage

### 📍 Location Tracking
- Real-time location tracking with Expo Location
- Background location monitoring
- Location permission handling
- Location history and timeline

### 🌐 Connectivity Monitoring
- Internet connectivity status tracking
- Connection type detection (WiFi, Cellular, etc.)
- Connectivity history and statistics

## Getting Started

### Prerequisites
- Node.js (v14 or higher)
- Expo CLI
- React Native development environment

### Installation

1. **Install dependencies:**
   ```bash
   cd FocalytPortal
   npm install
   ```

2. **Start the development server:**
   ```bash
   npm start
   ```

3. **Run on device/simulator:**
   ```bash
   # For Android
   npm run android
   
   # For iOS
   npm run ios
   
   # For web
   npm run web
   ```

## OTP Login Flow

### Testing the OTP System

1. **Enter Phone Number**: 
   - Use any valid Indian phone number (10 digits starting with 6-9)
   - Example: `9876543210`

2. **Send OTP**:
   - Click "Send OTP" button
   - Wait for the 2-second simulation delay
   - Check console logs for the generated OTP

3. **Verify OTP**:
   - Enter the 4-digit OTP shown in console
   - Click "Verify OTP" to login

4. **Resend OTP**:
   - If you need a new OTP, click "Resend OTP"
   - 30-second cooldown timer prevents spam

### Features of the Login System

- **Phone Number Formatting**: Automatically formats as XXX-XXX-XXXX
- **Input Validation**: Ensures valid Indian phone number format
- **Loading States**: Shows loading indicators during API calls
- **Error Handling**: Displays appropriate error messages
- **Session Persistence**: Remembers login state across app restarts
- **Logout Functionality**: Clear session and return to login

## App Structure

```
FocalytPortal/
├── App.tsx                 # Main app with authentication logic
├── components/
│   ├── LoginPage.tsx      # OTP-based login component
│   ├── LocationTrackerExpo.tsx  # Location tracking
│   ├── TimelinePage.tsx   # Location timeline
│   └── ConnectivityTracker.tsx  # Connectivity monitoring
├── assets/                # App icons and images
└── package.json          # Dependencies and scripts
```

## Key Components

### LoginPage.tsx
- Handles phone number input and validation
- Manages OTP generation and verification
- Implements resend functionality with timer
- Provides smooth UX with auto-focus and keyboard handling

### App.tsx
- Manages authentication state
- Handles login/logout flow
- Provides navigation between app sections
- Implements session persistence

## Dependencies

- **React Native**: Core framework
- **Expo**: Development platform and tools
- **AsyncStorage**: Local data persistence
- **Expo Location**: Location services
- **NetInfo**: Network connectivity monitoring

## Development Notes

### OTP Testing
- OTP codes are logged to console for testing
- In production, integrate with SMS service (Twilio, AWS SNS, etc.)
- Implement proper server-side OTP generation and verification

### Security Considerations
- Current implementation is for demo purposes
- Add proper API integration for production
- Implement rate limiting for OTP requests
- Add proper error handling and validation

### Future Enhancements
- Biometric authentication
- Social login integration
- Push notifications
- Offline mode support
- Data encryption

## Troubleshooting

### Common Issues

1. **OTP not working**: Check console logs for generated OTP
2. **Location not working**: Ensure location permissions are granted
3. **Build errors**: Clear cache with `expo start -c`

### Debug Mode
- Enable debug logging in console
- Check AsyncStorage for session data
- Monitor network requests in development

## License

This project is for educational and demonstration purposes. 