# 🚀 Live Class System - Setup Instructions

## 📦 Step 1: Install Dependencies

```bash
cd backend
npm install mediasoup@3.11.20 --save
```

## ⚙️ Step 2: Update Main Server File (mmt.js)

Add these lines to initialize mediasoup and live class socket handlers:

```javascript
// After Socket.IO initialization in mmt.js

// Initialize mediasoup server
const mediaSoupServer = require('./services/mediasoup/server');
mediaSoupServer.initialize().then(() => {
  console.log('✅ mediasoup server initialized');
}).catch(err => {
  console.error('❌ Error initializing mediasoup:', err);
});

// Initialize live class socket handlers
const initializeLiveClassSocket = require('./socket/liveClassSocket');
initializeLiveClassSocket(io);
```

## 🔗 Step 3: Add Routes to Main Router

In `backend/controllers/routes/index.js`, add:

```javascript
const liveClassRoutes = require('./liveClass');

// Add this line with other routes
router.use('/api/live-class', liveClassRoutes);
```

## 🌐 Step 4: Environment Variables

Add to `backend/.env`:

```env
# mediasoup Configuration
MEDIASOUP_LISTEN_IP=0.0.0.0
MEDIASOUP_ANNOUNCED_IP=YOUR_PUBLIC_IP_ADDRESS  # Your server's public IP

# TURN/STUN Server (Optional but recommended for NAT traversal)
TURN_SERVER_URL=turn:turn.example.com:3478
TURN_USERNAME=turn_user
TURN_PASSWORD=turn_pass
```

## 📝 Step 5: Update Models Index

The models are already added to `backend/controllers/models/index.js`.

## ✅ Step 6: Test the Setup

1. Start the backend server:
```bash
npm run dev
```

2. Check logs for:
   - ✅ mediasoup workers initialized
   - ✅ Live Class Socket handlers initialized
   - ✅ Routes loaded

## 🔧 Troubleshooting

### Issue: mediasoup worker creation fails
- **Solution**: Ensure you have sufficient system resources (CPU, RAM)
- Check if ports 40000-49999 are available

### Issue: Cannot connect to TURN server
- **Solution**: Install and configure Coturn server
- Or use a public TURN service like Twilio

### Issue: Socket connection fails
- **Solution**: 
  - Check CORS settings in Socket.IO config
  - Verify JWT token authentication
  - Check network/firewall settings

## 📚 Next Steps

1. ✅ Backend setup complete
2. ⏳ Create React components (see frontend implementation)
3. ⏳ Test with trainer and student clients
4. ⏳ Configure recording (optional)
5. ⏳ Setup TURN server for production (recommended)
