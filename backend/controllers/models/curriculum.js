const { Schema, model } = require('mongoose');

const curriculumSchema = new Schema({
    courseId: {
        type: Schema.Types.ObjectId,
        ref: 'courses',
        required: true
    },
    batchId: {
        type: Schema.Types.ObjectId,
        ref: 'Batch',
        required: true
    },
    courseName: {
        type: String,
        trim: true
    },
    batchName: {
        type: String,
        trim: true
    },
    chapters: [{
        chapterNumber: {
            type: Number,
            required: true
        },
        chapterTitle: {
            type: String,
            required: true,
            trim: true
        },
        description: {
            type: String,
            trim: true
        },
        duration: {
            type: String,
            trim: true
        },
        objectives: {
            type: String,
            trim: true
        },
        topics: [{
            topicNumber: {
                type: String,
                required: true,
                trim: true
            },
            topicTitle: {
                type: String,
                required: true,
                trim: true
            },
            description: {
                type: String,
                trim: true
            },
            duration: {
                type: String,
                trim: true
            },
            resources: {
                type: String,
                trim: true
            },
            subTopics: [{
                subTopicNumber: {
                    type: String,
                    required: true,
                    trim: true
                },
                subTopicTitle: {
                    type: String,
                    required: true,
                    trim: true
                },
                description: {
                    type: String,
                    trim: true
                },
                duration: {
                    type: String,
                    trim: true
                },
                content: {
                    type: String,
                    trim: true
                },
                media: {
                    videos: [{
                        name: String,
                        url: String,
                        size: Number,
                        uploadedAt: { type: Date, default: Date.now }
                    }],
                    images: [{
                        name: String,
                        url: String,
                        size: Number,
                        uploadedAt: { type: Date, default: Date.now }
                    }],
                    pdfs: [{
                        name: String,
                        url: String,
                        size: Number,
                        uploadedAt: { type: Date, default: Date.now }
                    }]
                }
            }],
            media: {
                videos: [{
                    name: String,
                    url: String,
                    size: Number,
                    uploadedAt: { type: Date, default: Date.now }
                }],
                images: [{
                    name: String,
                    url: String,
                    size: Number,
                    uploadedAt: { type: Date, default: Date.now }
                }],
                pdfs: [{
                    name: String,
                    url: String,
                    size: Number,
                    uploadedAt: { type: Date, default: Date.now }
                }]
            }
        }]
    }],
    createdBy: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    isActive: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});


curriculumSchema.index({ courseId: 1, batchId: 1 }, { unique: true });

module.exports = model('Curriculum', curriculumSchema);