# 🎨 Frontend Live Class System - Setup Instructions

## 📦 Step 1: Install Dependencies

```bash
cd frontend
npm install mediasoup-client@3.6.82 --save
```

**Note**: `socket.io-client` is already installed ✅

## 📁 Step 2: Created Files Structure

### Services (Already Created)
- ✅ `frontend/src/services/socket/liveClassSocket.js` - Socket.IO client service
- ✅ `frontend/src/services/webrtc/mediasoupClient.js` - mediasoup client wrapper

### Components (To be Created)
- `frontend/src/Pages/App/Trainer/LiveClass/StartLiveClass.jsx` - Create/start class page
- `frontend/src/Pages/App/Trainer/LiveClass/LiveClassRoom.jsx` - Main room component
- `frontend/src/Pages/App/Trainer/LiveClass/components/VideoGrid.jsx` - Video display
- `frontend/src/Pages/App/Trainer/LiveClass/components/ChatPanel.jsx` - Chat interface
- `frontend/src/Pages/App/Trainer/LiveClass/components/Controls.jsx` - Media controls
- `frontend/src/Pages/App/Trainer/LiveClass/components/AttendancePanel.jsx` - Attendance display

## 🔌 Step 3: Environment Variables

Ensure these are set in `frontend/.env`:

```env
REACT_APP_MIPIE_BACKEND_URL=http://localhost:5000
```

## 📝 Step 4: Usage Example

### Initialize in Component:

```javascript
import liveClassSocketService from '../../services/socket/liveClassSocket';
import mediaSoupClientService from '../../services/webrtc/mediasoupClient';

// Get user data from session
const userData = JSON.parse(sessionStorage.getItem("user") || "{}");
const token = JSON.parse(sessionStorage.getItem("token") || "null");

// Connect socket
liveClassSocketService.connect(
  userData._id,
  userData.name,
  'trainer', // or 'student'
  token
);

// Listen to events
liveClassSocketService.onRoomCreated((data) => {
  console.log('Room created:', data);
});

liveClassSocketService.onUserJoined((data) => {
  console.log('User joined:', data);
});
```

## 🎯 Next Steps

1. ✅ Services created
2. ⏳ Create React components (see component files)
3. ⏳ Add routes to App.js
4. ⏳ Test with real WebRTC connections
