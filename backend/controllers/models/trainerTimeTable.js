const beautifyUnique = require('mongoose-beautiful-unique-validation');
const { Schema, model } = require('mongoose');

const trainerTimeTableSchema = new Schema({
   
    trainerId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
    },
    collegeId: {
        type: Schema.Types.ObjectId,
        ref: 'College',
    },
    title: {
        type: String,
        trim: true,
    },
    batchId: {
        type: Schema.Types.ObjectId,
        ref: 'Batch',
    },
    batchName: {
        type: String,
        trim: true
    },
    courseId: {
        type: Schema.Types.ObjectId,
        ref: 'Courses',
    },
    courseName: {
        type: String,
        trim: true
    },
    subject: {
        type: String,
        trim: true
    },
    date: {
        type: Date,
    },
    startTime: {
        type: String,
    },
    endTime: {
        type: String,
    },
    duration: {
        type: String,
        trim: true
    },
    description: {
        type: String,
        trim: true
    },
    color: {
        type: String,
        default: '#3498db',
        match: /^#[0-9A-Fa-f]{6}$/
    },
    scheduleType: {
        type: String,
        enum: ['single', 'weekly', 'monthly'],
        default: 'single'
    },
    
    weekTopics: {
        monday: { type: String, trim: true },
        tuesday: { type: String, trim: true },
        wednesday: { type: String, trim: true },
        thursday: { type: String, trim: true },
        friday: { type: String, trim: true },
        saturday: { type: String, trim: true },
        sunday: { type: String, trim: true }
    },
    
    monthTopics: {
        week1: {
            monday: { type: String, trim: true },
            tuesday: { type: String, trim: true },
            wednesday: { type: String, trim: true },
            thursday: { type: String, trim: true },
            friday: { type: String, trim: true },
            saturday: { type: String, trim: true },
            sunday: { type: String, trim: true }
        },
        week2: {
            monday: { type: String, trim: true },
            tuesday: { type: String, trim: true },
            wednesday: { type: String, trim: true },
            thursday: { type: String, trim: true },
            friday: { type: String, trim: true },
            saturday: { type: String, trim: true },
            sunday: { type: String, trim: true }
        },
        week3: {
            monday: { type: String, trim: true },
            tuesday: { type: String, trim: true },
            wednesday: { type: String, trim: true },
            thursday: { type: String, trim: true },
            friday: { type: String, trim: true },
            saturday: { type: String, trim: true },
            sunday: { type: String, trim: true }
        },
        week4: {
            monday: { type: String, trim: true },
            tuesday: { type: String, trim: true },
            wednesday: { type: String, trim: true },
            thursday: { type: String, trim: true },
            friday: { type: String, trim: true },
            saturday: { type: String, trim: true },
            sunday: { type: String, trim: true }
        }
    },
    status: {
        type: String,
        enum: ['scheduled', 'completed', 'cancelled', 'rescheduled'],
        default: 'scheduled'
    },
    attendance: {
        totalStudents: { 
            type: Number, 
            default: 0,
        },
        presentStudents: { 
            type: Number, 
            default: 0,
        },
        absentStudents: { 
            type: Number, 
            default: 0,
        },
        attendancePercentage: { 
            type: Number, 
            default: 0,
        },
        markedAt: {
            type: Date
        },
        markedBy: {
            type: Schema.Types.ObjectId,
            ref: 'User'
        }
    },
    sessionNotes: {
        type: String,
        trim: true,
    },
    isRecurring: {
        type: Boolean,
        default: false,
        index: true
    },
    recurringType: {
        type: String,
        enum: {
            values: ['daily', 'weekly', 'monthly'],
        },
        default: null
    },
    recurringEndDate: {
        type: Date,
        default: null
    },
    hasConflict: {
        type: Boolean,
        default: false
    },
    conflictDetails: {
        type: String,
        trim: true
    },
    createdBy: {
        type: Schema.Types.ObjectId,
        ref: 'User',
    },
    lastModifiedBy: {
        type: Schema.Types.ObjectId,
        ref: 'User'
    },
    isDeleted: {
        type: Boolean,
        default: false
    },
    deletedAt: {
        type: Date,
        default: null
    },
    completedAt: {
        type: Date,
        default: null
    },
    cancelledAt: {
        type: Date,
        default: null
    },
    cancellationReason: {
        type: String,
        trim: true,
    }
    
}, { 
    timestamps: true,
});

module.exports = model('TrainerTimeTable', trainerTimeTableSchema);