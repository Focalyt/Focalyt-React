const { Schema, model } = require("mongoose");
const { ObjectId } = Schema.Types;

const classRecordingSchema = new Schema(
	{
		// References
		classId: {
			type: ObjectId,
			ref: "LiveClass",
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
		trainerId: {
			type: ObjectId,
			ref: "User",
			required: true
		},
		
		// Recording Information
		recordingId: {
			type: String,
			required: true,
			unique: true
		},
		title: {
			type: String,
			trim: true
		},
		description: {
			type: String,
			trim: true
		},
		
		// File Information
		filePath: {
			type: String // Local file path
		},
		fileUrl: {
			type: String // Public URL (S3/CDN)
		},
		fileSize: {
			type: Number // in bytes
		},
		duration: {
			type: Number // in seconds
		},
		format: {
			type: String, // mp4, webm, etc.
			default: 'mp4'
		},
		resolution: {
			type: String, // 720p, 1080p, etc.
		},
		
		// Storage
		storageType: {
			type: String,
			enum: ['local', 's3', 'azure', 'gcp'],
			default: 'local'
		},
		bucketName: {
			type: String // If using cloud storage
		},
		storageKey: {
			type: String // Storage key/path
		},
		
		// Recording Status
		status: {
			type: String,
			enum: ['recording', 'processing', 'completed', 'failed', 'deleted'],
			default: 'recording'
		},
		startedAt: {
			type: Date,
			required: true
		},
		stoppedAt: {
			type: Date
		},
		
		// Processing
		processingProgress: {
			type: Number, // 0-100
			default: 0
		},
		processingError: {
			type: String
		},
		
		// Access Control
		isPublic: {
			type: Boolean,
			default: false
		},
		allowedBatches: [{
			type: ObjectId,
			ref: "Batch"
		}],
		allowedUsers: [{
			type: ObjectId,
			ref: "User"
		}],
		
		// Statistics
		views: {
			type: Number,
			default: 0
		},
		downloads: {
			type: Number,
			default: 0
		},
		
		// Thumbnail
		thumbnailUrl: {
			type: String
		},
		
		// Metadata
		metadata: {
			type: Schema.Types.Mixed // For additional info
		},
		
		// Deletion
		isDeleted: {
			type: Boolean,
			default: false
		},
		deletedAt: {
			type: Date
		},
		
		// Timestamps
		createdBy: {
			type: ObjectId,
			ref: "User"
		}
	},
	{ timestamps: true }
);

// Indexes
classRecordingSchema.index({ classId: 1 });
classRecordingSchema.index({ batchId: 1 });
classRecordingSchema.index({ courseId: 1 });
classRecordingSchema.index({ trainerId: 1 });
classRecordingSchema.index({ status: 1 });
classRecordingSchema.index({ recordingId: 1 }, { unique: true });

module.exports = model("ClassRecording", classRecordingSchema);
