# 🚀 Complete Live Class System Setup Guide

## 📋 Overview

This is a production-grade live class system built with:
- **Backend**: Node.js + Express + Socket.IO + mediasoup
- **Frontend**: React + Socket.IO Client + mediasoup-client
- **Database**: MongoDB

## ✅ What's Been Implemented

### Backend (100% Complete)
- ✅ 4 Database models (LiveClass, Attendance, Recording, Chat)
- ✅ mediasoup media server with worker management
- ✅ Complete Socket.IO handlers for real-time communication
- ✅ REST API routes for class management, attendance, recordings, chat
- ✅ Automatic attendance tracking
- ✅ WebRTC signaling integration

### Frontend (In Progress)
- ✅ Socket.IO client service
- ✅ mediasoup client wrapper service
- ✅ StartLiveClass component (Trainer)
- ⏳ LiveClassRoom component (Main room - TODO)
- ⏳ VideoGrid component (TODO)
- ⏳ ChatPanel component (TODO)
- ⏳ Student components (TODO)

---

## 🔧 Installation Steps

### Backend Setup

#### Step 1: Install mediasoup
```bash
cd backend
npm install mediasoup@3.11.20 --save
```

#### Step 2: Update `backend/mmt.js`

Add these lines **after Socket.IO initialization** (around line 95):

```javascript
// Initialize mediasoup server
const mediaSoupServer = require('./services/mediasoup/server');
mediaSoupServer.initialize().then(() => {
  console.log('✅ mediasoup server initialized');
}).catch(err => {
  console.error('❌ Error initializing mediasoup:', err);
  process.exit(1);
});

// Initialize live class socket handlers
const initializeLiveClassSocket = require('./socket/liveClassSocket');
initializeLiveClassSocket(io);
```

#### Step 3: Add Environment Variables

Add to `backend/.env`:
```env
MEDIASOUP_LISTEN_IP=0.0.0.0
MEDIASOUP_ANNOUNCED_IP=YOUR_PUBLIC_IP_ADDRESS  # Important for production!
```

#### Step 4: Start Backend Server
```bash
cd backend
npm run dev
```

You should see:
```
✅ mediasoup server initialized
✅ mediasoup worker 1/4 created (PID: xxxxx)
✅ Live Class Socket handlers initialized
```

---

### Frontend Setup

#### Step 1: Install mediasoup-client
```bash
cd frontend
npm install mediasoup-client@3.6.82 --save
```

#### Step 2: Verify Environment Variables

Ensure `frontend/.env` has:
```env
REACT_APP_MIPIE_BACKEND_URL=http://localhost:5000
```

#### Step 3: Add Routes (Optional)

In your `frontend/src/App.js` or router file, add:

```javascript
import StartLiveClass from './Pages/App/Trainer/LiveClass/StartLiveClass';

// In your routes:
<Route path="/trainer/live-class" element={<StartLiveClass />} />
<Route path="/trainer/live-class/room" element={<LiveClassRoom />} />
```

#### Step 4: Start Frontend
```bash
cd frontend
npm start
```

---

## 📁 File Structure Summary

```
Focalyt/
├── backend/
│   ├── controllers/
│   │   ├── models/
│   │   │   ├── liveClass.js ✅
│   │   │   ├── classAttendance.js ✅
│   │   │   ├── classRecording.js ✅
│   │   │   └── classChatMessage.js ✅
│   │   └── routes/
│   │       └── liveClass/ ✅
│   │           ├── index.js
│   │           ├── classManagement.js
│   │           ├── attendance.js
│   │           ├── recording.js
│   │           └── chat.js
│   ├── services/
│   │   └── mediasoup/
│   │       └── server.js ✅
│   ├── socket/
│   │   └── liveClassSocket.js ✅
│   └── mmt.js (needs update)
│
└── frontend/
    └── src/
        ├── services/
        │   ├── socket/
        │   │   └── liveClassSocket.js ✅
        │   └── webrtc/
        │       └── mediasoupClient.js ✅
        └── Pages/
            └── App/
                └── Trainer/
                    └── LiveClass/
                        ├── StartLiveClass.jsx ✅
                        └── LiveClassRoom.jsx (TODO)
```

---

## 🧪 Testing the System

### 1. Test Backend API

```bash
# Create a live class
curl -X POST http://localhost:5000/api/live-class/create \
  -H "Content-Type: application/json" \
  -H "x-auth: YOUR_TOKEN" \
  -d '{
    "title": "Test Class",
    "batchId": "BATCH_ID",
    "courseId": "COURSE_ID",
    "scheduledDate": "2024-01-20T10:00:00Z",
    "scheduledDuration": 60
  }'
```

### 2. Test Socket Connection

Open browser console and check:
- Socket.IO connection established
- mediasoup device initialized
- Room creation successful

### 3. Test WebRTC

- Request camera/mic permissions
- Verify local video stream
- Test producer creation
- Test consumer connection

---

## 🔌 API Endpoints

### Class Management
- `POST /api/live-class/create` - Create new class
- `GET /api/live-class/:classId` - Get class details
- `PUT /api/live-class/:classId` - Update class
- `DELETE /api/live-class/:classId` - Delete class
- `GET /api/live-class/batch/:batchId` - Get classes for batch

### Attendance
- `GET /api/live-class/:classId/attendance` - Get attendance list
- `GET /api/live-class/:classId/attendance/:userId` - Get user attendance
- `POST /api/live-class/:classId/attendance/manual` - Manual attendance
- `GET /api/live-class/:classId/attendance/export` - Export CSV

### Recording
- `GET /api/live-class/:classId/recordings` - Get all recordings
- `GET /api/live-class/recording/:recordingId` - Get recording details
- `DELETE /api/live-class/recording/:recordingId` - Delete recording

### Chat
- `GET /api/live-class/:classId/chat` - Get chat history

---

## 🔌 Socket Events

### Client → Server
- `live-class:create-room` - Create room (Trainer)
- `live-class:join-room` - Join room
- `live-class:leave-room` - Leave room
- `live-class:create-transport` - Create WebRTC transport
- `live-class:connect-transport` - Connect transport
- `live-class:produce` - Publish media stream
- `live-class:consume` - Subscribe to media stream
- `live-class:chat-message` - Send chat message

### Server → Client
- `live-class:room-created` - Room created
- `live-class:user-joined` - User joined
- `live-class:user-left` - User left
- `live-class:new-producer` - New stream available
- `live-class:chat-message` - New chat message
- `live-class:ended` - Class ended

See `LIVE_CLASS_SYSTEM_IMPLEMENTATION.md` for complete event list.

---

## ⚠️ Important Notes

### 1. Network Configuration
- For production, set `MEDIASOUP_ANNOUNCED_IP` to your server's public IP
- Configure firewall to allow WebRTC ports (40000-49999)
- Consider setting up TURN server for NAT traversal

### 2. Security
- All socket connections should use JWT authentication
- Verify user enrollment before allowing room join
- Implement rate limiting for socket events

### 3. Scalability
- mediasoup workers auto-scale based on CPU cores
- One worker per CPU core (max 4)
- For horizontal scaling, use load balancer

### 4. Recording
- Recording metadata is stored in database
- Actual video recording needs FFmpeg setup
- See `backend/services/recording/` for implementation

---

## 🐛 Troubleshooting

### Issue: mediasoup workers fail to start
**Solution**: Check CPU cores and system resources. Ensure ports 40000-49999 are available.

### Issue: WebRTC connection fails
**Solution**: 
- Verify `MEDIASOUP_ANNOUNCED_IP` is set correctly
- Check firewall settings
- Consider TURN server for NAT traversal

### Issue: Socket connection fails
**Solution**:
- Check CORS settings in Socket.IO config
- Verify backend URL in frontend .env
- Check JWT token validity

### Issue: No audio/video
**Solution**:
- Check browser permissions for camera/mic
- Verify getUserMedia is working
- Check mediasoup device initialization

---

## 📚 Documentation Files

1. **LIVE_CLASS_SYSTEM_IMPLEMENTATION.md** - Complete implementation guide
2. **SETUP_LIVE_CLASS.md** - Backend setup instructions
3. **FRONTEND_SETUP.md** - Frontend setup instructions
4. **IMPLEMENTATION_SUMMARY.md** - Implementation summary
5. **This file** - Complete setup guide

---

## ✅ Checklist

### Backend
- [ ] Install mediasoup
- [ ] Update mmt.js with mediasoup initialization
- [ ] Add environment variables
- [ ] Test server startup
- [ ] Test Socket.IO connection
- [ ] Test API endpoints

### Frontend
- [ ] Install mediasoup-client
- [ ] Verify environment variables
- [ ] Test socket connection
- [ ] Test room creation
- [ ] Test WebRTC streaming
- [ ] Test chat functionality

### Production
- [ ] Setup TURN server
- [ ] Configure firewall
- [ ] Setup SSL/TLS
- [ ] Configure load balancer (if needed)
- [ ] Setup recording storage (S3/Azure/GCP)

---

## 🎯 Next Steps

1. ✅ Backend setup complete
2. ⏳ Complete LiveClassRoom component
3. ⏳ Add VideoGrid component
4. ⏳ Add ChatPanel component
5. ⏳ Create Student components
6. ⏳ Add recording functionality
7. ⏳ Setup TURN server
8. ⏳ Production deployment

---

**Status**: Backend complete ✅ | Frontend services complete ✅ | Components in progress ⏳

For detailed information, see individual documentation files.
