const { Schema, model } = require('mongoose');

const dailyDiarySchema = new Schema({
    batch: {
        type: Schema.Types.ObjectId,
        ref: 'batch',
        required: true
    },
    course: {
        type: Schema.Types.ObjectId,
        ref: 'course',
        required: true
    },
    sendTo: {
        type: String,
        enum: ['all', 'individual'],
        default: 'all',
        required: true
    },
    selectedStudents: [{
        type: Schema.Types.ObjectId,
        ref: 'appliedcourse'
    }],
    assignmentDetail: {
        type: String,
        trim: true,
        default: ''
    },
    studyMaterials: [{
        fileName: {
            type: String,
            required: true
        },
        fileType: {
            type: String,
            required: true
        },
        fileUrl: {
            type: String,
            required: true
        },
        fileSize: {
            type: Number
        },
        uploadedAt: {
            type: Date,
            default: Date.now
        }
    }],
    projectVideos: [{
        fileName: {
            type: String,
            required: true
        },
        fileUrl: {
            type: String,
            required: true
        },
        fileSize: {
            type: Number
        },
        uploadedAt: {
            type: Date,
            default: Date.now
        }
    }],
    createdBy: {
        type: Schema.Types.ObjectId,
        ref: 'user',
        required: true
    },
    status: {
        type: String,
        enum: ['draft', 'sent'],
        default: 'sent'
    },
    diaryDate: {
        type: Date,
        default: Date.now
    },
    deliveryStatus: [{
        student: {
            type: Schema.Types.ObjectId,
            ref: 'appliedcourse'
        },
        delivered: {
            type: Boolean,
            default: false
        },
        viewedAt: {
            type: Date
        }
    }]

}, {
    timestamps: true
});

// Indexes for better query performance
dailyDiarySchema.index({ batch: 1, diaryDate: -1 });
dailyDiarySchema.index({ createdBy: 1, createdAt: -1 });
dailyDiarySchema.index({ 'selectedStudents': 1 });

module.exports = model('dailydiary', dailyDiarySchema);