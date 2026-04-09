const { Schema, model } = require("mongoose");
const { ObjectId } = Schema.Types;

const classChatMessageSchema = new Schema(
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
		userName: {
			type: String,
			required: true
		},
		userRole: {
			type: String,
			enum: ['trainer', 'student', 'admin'],
			required: true
		},
		
		// Message Content
		message: {
			type: String,
			required: true,
			trim: true,
			maxlength: 1000
		},
		messageType: {
			type: String,
			enum: ['text', 'file', 'link', 'system'],
			default: 'text'
		},
		
		// Attachments (if any)
		attachment: {
			fileName: String,
			fileUrl: String,
			fileType: String,
			fileSize: Number
		},
		
		// Message Status
		isEdited: {
			type: Boolean,
			default: false
		},
		editedAt: {
			type: Date
		},
		isDeleted: {
			type: Boolean,
			default: false
		},
		deletedAt: {
			type: Date
		},
		
		// Thread/Reply (for future enhancement)
		replyTo: {
			type: ObjectId,
			ref: "ClassChatMessage"
		},
		
		// Reactions (for future enhancement)
		reactions: [{
			userId: {
				type: ObjectId,
				ref: "User"
			},
			emoji: String
		}],
		
		// Timestamps
		sentAt: {
			type: Date,
			default: Date.now
		}
	},
	{ timestamps: true }
);

// Indexes for efficient querying
classChatMessageSchema.index({ classId: 1, sentAt: -1 });
classChatMessageSchema.index({ userId: 1 });
classChatMessageSchema.index({ classId: 1 });

module.exports = model("ClassChatMessage", classChatMessageSchema);
