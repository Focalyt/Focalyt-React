const { Schema, model } = require('mongoose');
const { ObjectId } = Schema.Types;

const chatHistorySchema = new Schema(
  {
    mobile: {
      type: String,
      required: true,
      index: true, // For faster queries
    },
    email: {
      type: String,
      default: '',
    },
    candidateId: {
      type: ObjectId,
      ref: 'Candidate',
      default: null,
    },
    sessionId: {
      type: String,
      required: true,
    },
    messages: [
      {
        role: {
          type: String,
          enum: ['user', 'assistant'],
          required: true,
        },
        content: {
          type: String,
          required: true,
        },
        isQA: {
          type: Boolean,
          default: false,
        },
        jobs: [
          {
            type: ObjectId,
            ref: 'Vacancy',
          },
        ],
        timestamp: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    totalMessages: {
      type: Number,
      default: 0,
    },
    lastMessageAt: {
      type: Date,
      default: Date.now,
    },
    status: {
      type: String,
      enum: ['active', 'completed', 'abandoned'],
      default: 'active',
    },
    metadata: {
      userAgent: String,
      ipAddress: String,
      referrer: String,
    },
  },
  { timestamps: true }
);

// Indexes for better query performance
chatHistorySchema.index({ mobile: 1, createdAt: -1 });
chatHistorySchema.index({ sessionId: 1 });
chatHistorySchema.index({ lastMessageAt: -1 });
chatHistorySchema.index({ candidateId: 1 });

module.exports = model('ChatHistory', chatHistorySchema);

