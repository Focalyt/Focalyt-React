const express = require('express');
const router = express.Router();
const { AttendanceTracking, User } = require('../../../models');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const moment = require('moment-timezone');

// Utility function for proper date handling with IST timezone
const parseIST = (dateString) => {
  // Parse date and convert to IST
  const date = moment(dateString).tz('Asia/Kolkata');
  // Set to start of day in IST
  date.startOf('day');
  return date.toDate();
};

// Configure multer for photo uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = 'uploads/attendance-photos';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'attendance-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'), false);
    }
  }
});

// Middleware to verify JWT token
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({ 
        success: false, 
        message: 'Access token required' 
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    const user = await User.findById(decoded.userId);
    
    if (!user || user.isDeleted) {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid or expired token' 
      });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('Token verification error:', error);
    return res.status(401).json({ 
      success: false, 
      message: 'Invalid token' 
    });
  }
};

// Get user's attendance for a specific date (with authentication)
router.get('/date/:date', async (req, res) => {
  try {
    const { date } = req.params;
    const { userId } = req.user;

    const targetDate = new Date(date);
    targetDate.setHours(0, 0, 0, 0);

    let attendance = await AttendanceTracking.findOne({
      userId: userId,
      date: targetDate
    });

    if (!attendance) {
      return res.json({
        success: true,
        data: null,
        message: 'No attendance record found for this date'
      });
    }

    res.json({
      success: true,
      data: attendance,
      message: 'Attendance data retrieved successfully'
    });
  } catch (error) {
    console.error('Error getting attendance data:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

// Get user's attendance for a specific date (without authentication - for timeline)
router.get('/timeline/:date', async (req, res) => {
  try {
    const { date } = req.params;
    const { userId } = req.query;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'userId is required'
      });
    }

    console.log('📥 Timeline request for user:', userId, 'date:', date);

    const targetDate = parseIST(date);

    let attendance = await AttendanceTracking.findOne({
      userId: userId,
      date: targetDate
    });

    if (!attendance) {
      return res.json({
        success: true,
        data: null,
        message: 'No attendance record found for this date'
      });
    }

    res.json({
      success: true,
      data: attendance,
      message: 'Attendance data retrieved successfully'
    });
  } catch (error) {
    console.error('Error fetching attendance:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get user's attendance for a date range
router.get('/range', authenticateToken, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const { userId } = req.user;

    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: 'Start date and end date are required'
      });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);

    const attendance = await AttendanceTracking.getAttendanceByDateRange(userId, start, end);

    res.json({
      success: true,
      data: attendance,
      message: 'Attendance data retrieved successfully'
    });
  } catch (error) {
    console.error('Error fetching attendance range:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get user's active attendance (currently punched in)
router.get('/active', authenticateToken, async (req, res) => {
  try {
    const { userId } = req.user;

    const activeAttendance = await AttendanceTracking.getActiveAttendance(userId);

    res.json({
      success: true,
      data: activeAttendance,
      message: activeAttendance ? 'Active attendance found' : 'No active attendance'
    });
  } catch (error) {
    console.error('Error fetching active attendance:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Sync attendance data from Android app
router.post('/sync', async (req, res) => {
  try {
    const { userId } = req.user;
    const { 
      date, 
      entries, 
      deviceInfo,
      isActive 
    } = req.body;

    if (!date || !entries || !Array.isArray(entries)) {
      return res.status(400).json({
        success: false,
        message: 'Date and entries array are required'
      });
    }

    const targetDate = new Date(date);
    targetDate.setHours(0, 0, 0, 0);

    // Find existing attendance record or create new one
    let attendance = await AttendanceTracking.findOne({
      userId: userId,
      date: targetDate
    });

    if (!attendance) {
      attendance = new AttendanceTracking({
        userId: userId,
        date: targetDate,
        entries: entries,
        deviceInfo: deviceInfo || {},
        isActive: isActive || false
      });
    } else {
      // Update existing attendance
      attendance.entries = entries;
      attendance.deviceInfo = deviceInfo || attendance.deviceInfo;
      attendance.isActive = isActive !== undefined ? isActive : attendance.isActive;
      attendance.syncStatus = 'synced';
      attendance.lastSyncAt = new Date();
    }

    await attendance.save();

    // Emit WebSocket event for real-time updates
    if (req.app.locals.websocket) {
      req.app.locals.websocket.broadcastToUser(userId, {
        type: 'attendance_sync',
        data: {
          date: targetDate,
          isActive: attendance.isActive,
          lastActivity: attendance.lastActivity,
          totalDuration: attendance.totalDuration
        },
        timestamp: new Date().toISOString()
      });
    }

    res.json({
      success: true,
      data: attendance,
      message: 'Attendance data synced successfully'
    });
  } catch (error) {
    console.error('Error syncing attendance:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Sync attendance data from Android app (specific endpoint for attendance-tracking)
router.post('/sync-attendance', async (req, res) => {
  try {
    console.log('📥 Received sync-attendance request:', JSON.stringify(req.body, null, 2));
    
    const { 
      userId, 
      collegeId,
      date, 
      entries, 
      deviceInfo,
      totalDuration,
      isActive 
    } = req.body;

    if (!userId || !date || !entries || !Array.isArray(entries)) {
      console.log('❌ Missing required fields:', { userId, date, entries: entries ? 'present' : 'missing' });
      return res.status(400).json({
        success: false,
        message: 'userId, date and entries array are required'
      });
    }

    // Parse date with proper IST timezone handling
    const targetDate = parseIST(date);
    console.log('📅 Parsed date (IST):', targetDate.toISOString());

    // Find existing attendance record or create new one
    let attendance = await AttendanceTracking.findOne({
      userId: userId,
      date: targetDate
    });

    if (!attendance) {
      console.log('📝 Creating new attendance record for user:', userId, 'date:', targetDate);
      attendance = new AttendanceTracking({
        userId: userId,
        collegeId: collegeId || 'default',
        date: targetDate,
        entries: entries,
        deviceInfo: deviceInfo || {},
        totalDuration: totalDuration || 0,
        isActive: isActive || false,
        lastActivity: new Date()
      });
    } else {
      console.log('📝 Updating existing attendance record for user:', userId, 'date:', targetDate);
      // Merge entries instead of replacing them
      const existingEntryIds = new Set(attendance.entries.map(entry => entry.id));
      const newEntries = entries.filter(entry => !existingEntryIds.has(entry.id));
      
      if (newEntries.length > 0) {
        console.log(`📝 Adding ${newEntries.length} new entries to existing record`);
        attendance.entries = [...attendance.entries, ...newEntries];
      } else {
        console.log('📝 No new entries to add, updating existing entries');
        // Update existing entries with latest data
        attendance.entries = entries;
      }
      
      attendance.deviceInfo = deviceInfo || attendance.deviceInfo;
      attendance.totalDuration = totalDuration !== undefined ? totalDuration : attendance.totalDuration;
      attendance.isActive = isActive !== undefined ? isActive : attendance.isActive;
      attendance.lastActivity = new Date();
      attendance.syncStatus = 'synced';
      attendance.lastSyncAt = new Date();
    }

    await attendance.save();
    console.log('✅ Attendance saved successfully');

    // Emit WebSocket event for real-time updates
    if (req.app.locals.websocket) {
      req.app.locals.websocket.broadcastToUser(userId, {
        type: 'attendance_sync',
        data: {
          date: targetDate,
          isActive: attendance.isActive,
          lastActivity: attendance.lastActivity,
          totalDuration: attendance.totalDuration
        },
        timestamp: new Date().toISOString()
      });
      console.log('📡 WebSocket event broadcasted');
    }

    res.json({
      success: true,
      data: attendance,
      message: 'Attendance data synced successfully'
    });
  } catch (error) {
    console.error('❌ Error syncing attendance:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

// Add single entry to attendance
router.post('/entry', authenticateToken, async (req, res) => {
  try {
    const { userId } = req.user;
    const { date, entry } = req.body;

    if (!date || !entry) {
      return res.status(400).json({
        success: false,
        message: 'Date and entry are required'
      });
    }

    const targetDate = new Date(date);
    targetDate.setHours(0, 0, 0, 0);

    let attendance = await AttendanceTracking.findOne({
      userId: userId,
      date: targetDate
    });

    if (!attendance) {
      attendance = new AttendanceTracking({
        userId: userId,
        date: targetDate,
        entries: [entry]
      });
    } else {
      await attendance.addEntry(entry);
    }

    // Emit WebSocket event
    if (req.app.locals.websocket) {
      req.app.locals.websocket.broadcastToUser(userId, {
        type: 'attendance_entry_added',
        data: {
          date: targetDate,
          entry: entry,
          isActive: attendance.isActive
        },
        timestamp: new Date().toISOString()
      });
    }

    res.json({
      success: true,
      data: attendance,
      message: 'Entry added successfully'
    });
  } catch (error) {
    console.error('Error adding entry:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Upload attendance photo
router.post('/photo', authenticateToken, upload.single('photo'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Photo file is required'
      });
    }

    const photoUrl = `/uploads/attendance-photos/${req.file.filename}`;

    res.json({
      success: true,
      data: {
        photoUrl: photoUrl,
        filename: req.file.filename
      },
      message: 'Photo uploaded successfully'
    });
  } catch (error) {
    console.error('Error uploading photo:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get attendance statistics for user
router.get('/stats', authenticateToken, async (req, res) => {
  try {
    const { userId } = req.user;
    const { startDate, endDate } = req.query;

    const start = startDate ? new Date(startDate) : new Date();
    const end = endDate ? new Date(endDate) : new Date();
    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);

    const attendance = await AttendanceTracking.getAttendanceByDateRange(userId, start, end);

    // Calculate statistics
    const stats = {
      totalDays: attendance.length,
      totalDuration: 0,
      totalDistance: 0,
      averageDuration: 0,
      modeBreakdown: {
        driving: 0,
        walking: 0,
        stationary: 0,
        locationOff: 0
      },
      activeDays: 0,
      punchInCount: 0,
      punchOutCount: 0
    };

    attendance.forEach(record => {
      stats.totalDuration += record.totalDuration || 0;
      stats.totalDistance += record.totalDistance || 0;
      
      if (record.modeBreakdown) {
        Object.keys(record.modeBreakdown).forEach(mode => {
          if (stats.modeBreakdown[mode] !== undefined) {
            stats.modeBreakdown[mode] += record.modeBreakdown[mode] || 0;
          }
        });
      }

      if (record.isActive) {
        stats.activeDays++;
      }

      record.entries.forEach(entry => {
        if (entry.type === 'punchIn') stats.punchInCount++;
        if (entry.type === 'punchOut') stats.punchOutCount++;
      });
    });

    if (stats.totalDays > 0) {
      stats.averageDuration = Math.round(stats.totalDuration / stats.totalDays);
    }

    res.json({
      success: true,
      data: stats,
      message: 'Statistics retrieved successfully'
    });
  } catch (error) {
    console.error('Error fetching statistics:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get all users' attendance (for admin/manager)
router.get('/all', authenticateToken, async (req, res) => {
  try {
    const { date, userIds } = req.query;

    // Check if user has permission to view all attendance
    if (req.user.role !== 0 && req.user.role !== 1) {
      return res.status(403).json({
        success: false,
        message: 'Insufficient permissions'
      });
    }

    let query = {};
    
    if (date) {
      const targetDate = new Date(date);
      targetDate.setHours(0, 0, 0, 0);
      query.date = targetDate;
    }

    if (userIds) {
      query.userId = { $in: userIds.split(',') };
    }

    const attendance = await AttendanceTracking.find(query)
      .populate('userId', 'name email mobile')
      .sort({ date: -1, createdAt: -1 });

    res.json({
      success: true,
      data: attendance,
      message: 'All attendance data retrieved successfully'
    });
  } catch (error) {
    console.error('Error fetching all attendance:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Delete attendance record (admin only)
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    // Check if user has admin permissions
    if (req.user.role !== 0) {
      return res.status(403).json({
        success: false,
        message: 'Insufficient permissions'
      });
    }

    const attendance = await AttendanceTracking.findByIdAndDelete(id);

    if (!attendance) {
      return res.status(404).json({
        success: false,
        message: 'Attendance record not found'
      });
    }

    res.json({
      success: true,
      message: 'Attendance record deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting attendance:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

module.exports = router;
