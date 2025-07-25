# Android Login API Documentation

This API provides authentication functionality for Android applications using phone number and OTP verification.

## Base URL
```
/api/android/login
```

## Endpoints

### 1. Send OTP
**POST** `/send-otp`

Sends an OTP to the provided mobile number for authentication.

#### Request Body
```json
{
  "mobile": "9876543210"
}
```

#### Response
**Success (200)**
```json
{
  "success": true,
  "message": "OTP sent successfully to your mobile number"
}
```

**Error (400)**
```json
{
  "success": false,
  "message": "Please provide a valid 10-digit mobile number"
}
```

**Error (404)**
```json
{
  "success": false,
  "message": "User not found. Please contact your administrator."
}
```

**Error (403)**
```json
{
  "success": false,
  "message": "Your account has been disabled. Please contact support."
}
```

### 2. Verify OTP and Login
**POST** `/verify-otp`

Verifies the OTP and logs in the user.

#### Request Body
```json
{
  "mobile": "9876543210",
  "otp": "123456"
}
```

#### Response
**Success (200)**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "_id": "user_id_here",
      "name": "John Doe",
      "role": 2,
      "email": "john@example.com",
      "mobile": 9876543210,
      "collegeName": "Example College",
      "collegeId": "college_id_here",
      "isDefaultAdmin": false,
      "token": "jwt_token_here"
    },
    "token": "jwt_token_here"
  }
}
```

**Error (400)**
```json
{
  "success": false,
  "message": "Mobile number and OTP are required"
}
```

**Error (400)**
```json
{
  "success": false,
  "message": "Invalid OTP. Please try again."
}
```

### 3. Logout
**POST** `/logout`

Logs out the user and invalidates the token.

#### Request Body
```json
{
  "token": "jwt_token_here"
}
```

#### Response
**Success (200)**
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

### 4. Get Profile
**GET** `/profile`

Retrieves the user's profile information.

#### Headers
```
Authorization: Bearer jwt_token_here
```

#### Response
**Success (200)**
```json
{
  "success": true,
  "data": {
    "_id": "user_id_here",
    "name": "John Doe",
    "role": 2,
    "email": "john@example.com",
    "mobile": 9876543210,
    "designation": "Professor",
    "collegeName": "Example College",
    "collegeId": "college_id_here",
    "isDefaultAdmin": false,
    "status": true
  }
}
```

**Error (401)**
```json
{
  "success": false,
  "message": "Authentication token required"
}
```

## Usage Flow

1. **Send OTP**: Call `/send-otp` with the mobile number
2. **Verify OTP**: Call `/verify-otp` with mobile number and OTP received
3. **Store Token**: Save the JWT token from the login response
4. **Use Token**: Include the token in the Authorization header for protected endpoints
5. **Logout**: Call `/logout` when the user wants to sign out

## Error Codes

- **200**: Success
- **400**: Bad Request (invalid input)
- **401**: Unauthorized (missing or invalid token)
- **403**: Forbidden (account disabled)
- **404**: Not Found (user not found)
- **500**: Internal Server Error

## Notes

- Mobile number must be 10 digits
- OTP is sent via MSG91 SMS service
- Test OTP "2025" is accepted for development
- Only users with role 2 (college users) can use this API
- JWT tokens are stored in the user's authTokens array
- Tokens are automatically invalidated on logout

## Security

- All sensitive operations require valid JWT tokens
- Tokens are automatically invalidated on logout
- Mobile number validation ensures proper format
- OTP verification prevents unauthorized access 