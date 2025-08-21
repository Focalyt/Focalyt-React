const { Schema, model } = require("mongoose");
const { ObjectId } = Schema.Types;

// Attendance tracking schema for college concern persons
const attendanceTrackingSchema = new Schema(
  {
    userId: {
      type: ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    collegeId: {
      type: String,
      default: 'default',
      index: true
    },
    date: {
      type: Date,
      required: true,
      index: true
    },
    entries: [{
      id: {
        type: String,
        required: true
      },
      type: {
        type: String,
        enum: ['punchIn', 'punchOut', 'location', 'locationOff'],
        required: true
      },
      fromTime: {
        type: String, // ISO string
        required: true
      },
      toTime: {
        type: String, // ISO string
        required: true
      },
      location: {
        latitude: Number,
        longitude: Number,
        timestamp: String,
        accuracy: Number,
        speed: Number,
        heading: Number,
        address: {
          street: String,
          city: String,
          state: String,
          country: String,
          postalCode: String,
          formattedAddress: String,
          placeName: String
        }
      },
      fromBattery: Number, // 0-1 battery level at start
      toBattery: Number, // 0-1 battery level at end
      fromCharging: Boolean, // charging status at start
      toCharging: Boolean, // charging status at end
      address: String, // Formatted address string
      photo: String, // Base64 or URL
      mode: {
        type: String,
        enum: ['driving', 'walking', 'stationary', 'locationOff', 'locationOn'],
        default: 'stationary'
      }
    }],
    deviceInfo: {
      platform: String, // 'ios' or 'android'
      version: String,
      model: String
    },
    totalDuration: {
      type: Number, // in minutes
      default: 0
    },
    isActive: {
      type: Boolean,
      default: false
    },
    lastActivity: {
      type: Date,
      default: Date.now
    },
    syncStatus: {
      type: String,
      enum: ['pending', 'synced', 'failed'],
      default: 'pending'
    },
    syncAttempts: {
      type: Number,
      default: 0
    },
    lastSyncTime: Date,
    createdAt: {
      type: Date,
      default: Date.now
    },
    updatedAt: {
      type: Date,
      default: Date.now
    }
  },
  {
    timestamps: true
  }
);

// Indexes for better query performance
attendanceTrackingSchema.index({ userId: 1, date: 1 });
attendanceTrackingSchema.index({ collegeId: 1, date: 1 });
attendanceTrackingSchema.index({ isActive: 1 });
attendanceTrackingSchema.index({ syncStatus: 1 });

// Virtual for total working hours
attendanceTrackingSchema.virtual('totalWorkingHours').get(function() {
  if (!this.entries || this.entries.length === 0) return 0;
  
  let totalMinutes = 0;
  this.entries.forEach(entry => {
    const fromTime = new Date(entry.fromTime);
    const toTime = new Date(entry.toTime);
    const diffMs = toTime.getTime() - fromTime.getTime();
    totalMinutes += Math.floor(diffMs / (1000 * 60));
  });
  
  return (totalMinutes / 60).toFixed(2); // Return hours with 2 decimal places
});

// Method to add new entry
attendanceTrackingSchema.methods.addEntry = function(entry) {
  this.entries.push(entry);
  this.lastActivity = new Date();
  this.updatedAt = new Date();
  
  // Update total duration
  this.calculateTotalDuration();
  
  return this.save();
};

// Method to update last entry
attendanceTrackingSchema.methods.updateLastEntry = function(updates) {
  if (this.entries.length > 0) {
    const lastEntry = this.entries[this.entries.length - 1];
    Object.assign(lastEntry, updates);
    this.lastActivity = new Date();
    this.updatedAt = new Date();
    
    // Update total duration
    this.calculateTotalDuration();
    
    return this.save();
  }
  return Promise.resolve(this);
};

// Method to calculate total duration
attendanceTrackingSchema.methods.calculateTotalDuration = function() {
  let totalMinutes = 0;
  
  this.entries.forEach(entry => {
    const fromTime = new Date(entry.fromTime);
    const toTime = new Date(entry.toTime);
    const diffMs = toTime.getTime() - fromTime.getTime();
    totalMinutes += Math.floor(diffMs / (1000 * 60));
  });
  
  this.totalDuration = totalMinutes;
  return totalMinutes;
};

// Method to get current status
attendanceTrackingSchema.methods.getCurrentStatus = function() {
  if (!this.entries || this.entries.length === 0) {
    return {
      isActive: false,
      currentMode: 'stationary',
      lastActivity: null,
      currentDuration: 0
    };
  }
  
  const lastEntry = this.entries[this.entries.length - 1];
  const isActive = lastEntry.type === 'punchIn' || lastEntry.type === 'location';
  
  let currentDuration = 0;
  if (isActive) {
    const fromTime = new Date(lastEntry.fromTime);
    const now = new Date();
    const diffMs = now.getTime() - fromTime.getTime();
    currentDuration = Math.floor(diffMs / (1000 * 60));
  }
  
  return {
    isActive,
    currentMode: lastEntry.mode || 'stationary',
    lastActivity: lastEntry.toTime,
    currentDuration
  };
};

// Static method to find or create attendance record
attendanceTrackingSchema.statics.findOrCreateRecord = async function(userId, collegeId, date) {
  let record = await this.findOne({ userId, date });
  
  if (!record) {
    record = new this({
      userId,
      collegeId,
      date,
      entries: [],
      isActive: false
    });
    await record.save();
  }
  
  return record;
};

// Static method to get attendance summary
attendanceTrackingSchema.statics.getAttendanceSummary = async function(userId, startDate, endDate) {
  const records = await this.find({
    userId,
    date: { $gte: startDate, $lte: endDate }
  }).sort({ date: 1 });
  
  const summary = {
    totalDays: records.length,
    totalHours: 0,
    averageHoursPerDay: 0,
    activeDays: 0,
    records: records.map(record => ({
      date: record.date,
      totalHours: parseFloat(record.totalWorkingHours),
      isActive: record.isActive,
      entriesCount: record.entries.length
    }))
  };
  
  records.forEach(record => {
    summary.totalHours += parseFloat(record.totalWorkingHours);
    if (record.isActive) summary.activeDays++;
  });
  
  summary.averageHoursPerDay = summary.totalDays > 0 ? (summary.totalHours / summary.totalDays).toFixed(2) : 0;
  
  return summary;
};

// Static method to get active attendance
attendanceTrackingSchema.statics.getActiveAttendance = async function(userId) {
  return await this.findOne({
    userId: userId,
    isActive: true
  }).sort({ lastActivity: -1 });
};

// Static method to get attendance by date range
attendanceTrackingSchema.statics.getAttendanceByDateRange = async function(userId, startDate, endDate) {
  return await this.find({
    userId: userId,
    date: { $gte: startDate, $lte: endDate }
  }).sort({ date: 1 });
};

module.exports = model('AttendanceTracking', attendanceTrackingSchema);
