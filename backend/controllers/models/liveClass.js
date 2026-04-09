const { Schema, model } = require("mongoose");
const { ObjectId } = Schema.Types;

const liveClassSchema = new Schema(
	{
		// Class Information
		title: {
			type: String,
			required: true,
			trim: true
		},
		description: {
			type: String,
			trim: true
		},
		
		// References
		batchId: {
			type: ObjectId,
			ref: "Batch",
			required: true
		},
		courseId: {
			type: ObjectId,
			ref: "courses",
			required: true
		},
		centerId: {
			type: ObjectId,
			ref: "Center"
		},
		trainerId: {
			type: ObjectId,
			ref: "User",
			required: true
		},
		
		// Class Schedule
		scheduledDate: {
			type: Date,
			required: true
		},
		scheduledDuration: {
			type: Number, // in minutes
			default: 60
		},
		
		// Class Status
		status: {
			type: String,
			enum: ['scheduled', 'live', 'ended', 'cancelled'],
			default: 'scheduled'
		},
		
		// Class Timing
		startedAt: {
			type: Date
		},
		endedAt: {
			type: Date
		},
		actualDuration: {
			type: Number // in minutes
		},
		
		// mediasoup Room
		roomId: {
			type: String,
			unique: true,
			sparse: true
		},
		
		// Participants Count
		maxParticipants: {
			type: Number,
			default: 100
		},
		currentParticipants: {
			type: Number,
			default: 0
		},
		
		// Settings
		allowStudentVideo: {
			type: Boolean,
			default: false
		},
		allowStudentAudio: {
			type: Boolean,
			default: true
		},
		allowScreenShare: {
			type: Boolean,
			default: true
		},
		recordingEnabled: {
			type: Boolean,
			default: false
		},
		chatEnabled: {
			type: Boolean,
			default: true
		},
		
		// Recording
		isRecording: {
			type: Boolean,
			default: false
		},
		recordingId: {
			type: String
		},
		
		// Metadata
		meetingLink: {
			type: String
		},
		joinToken: {
			type: String // For access control
		},
		joinTokenExpiry: {
			type: Date
		},
		
		// Notes
		notes: {
			type: String
		},
		
		// Deletion
		isDeleted: {
			type: Boolean,
			default: false
		},
		
		// Timestamps
		createdBy: {
			type: ObjectId,
			ref: "User"
		},
		updatedBy: {
			type: ObjectId,
			ref: "User"
		}
	},
	{ timestamps: true }
);

// Indexes for performance
liveClassSchema.index({ batchId: 1 });
liveClassSchema.index({ courseId: 1 });
liveClassSchema.index({ trainerId: 1 });
liveClassSchema.index({ status: 1 });
liveClassSchema.index({ scheduledDate: 1 });
liveClassSchema.index({ roomId: 1 }, { unique: true, sparse: true });

module.exports = model("LiveClass", liveClassSchema);
