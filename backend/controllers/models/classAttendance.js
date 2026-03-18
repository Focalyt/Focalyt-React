const { Schema, model } = require("mongoose");
const { ObjectId } = Schema.Types;

const classAttendanceSchema = new Schema(
	{
		// References
		classId: {
			type: ObjectId,
			ref: "LiveClass",
			required: true
		},
		userId: {
			type: ObjectId,
			ref: "User",
			required: true
		},
		batchId: {
			type: ObjectId,
			ref: "Batch"
		},
		courseId: {
			type: ObjectId,
			ref: "courses"
		},
		
		// Attendance Status
		status: {
			type: String,
			enum: ['present', 'late', 'left_early', 'absent', 'partial'],
			default: 'present'
		},
		
		// Timing
		joinTime: {
			type: Date,
			required: true
		},
		leaveTime: {
			type: Date
		},
		duration: {
			type: Number // in minutes
		},
		
		// Validation
		minimumRequiredDuration: {
			type: Number, // in minutes (e.g., 50% of class duration)
			default: 30
		},
		isValidAttendance: {
			type: Boolean,
			default: true
		},
		
		// Device & Network Info
		ipAddress: {
			type: String
		},
		userAgent: {
			type: String
		},
		deviceInfo: {
			os: String,
			browser: String,
			deviceType: String // mobile, desktop, tablet
		},
		
		// Network Quality (for analysis)
		networkQuality: {
			type: String,
			enum: ['excellent', 'good', 'fair', 'poor'],
		},
		
		// Notes
		notes: {
			type: String
		},
		
		// Manual overrides
		markedBy: {
			type: ObjectId,
			ref: "User"
		},
		markReason: {
			type: String
		}
	},
	{ timestamps: true }
);

// Compound index for unique attendance per user per class
classAttendanceSchema.index({ classId: 1, userId: 1 }, { unique: true });
classAttendanceSchema.index({ batchId: 1 });
classAttendanceSchema.index({ courseId: 1 });
classAttendanceSchema.index({ status: 1 });
classAttendanceSchema.index({ joinTime: 1 });

module.exports = model("ClassAttendance", classAttendanceSchema);
