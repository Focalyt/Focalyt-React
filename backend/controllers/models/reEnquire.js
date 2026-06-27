const { Schema, model } = require('mongoose');
const { ObjectId } = Schema.Types;
const reEnquireSchema = new Schema({
    course: {
        type: ObjectId,
        ref: "courses",
    },
    appliedCourse:{
        type: ObjectId,
        ref: "AppliedCourses",
    },
    candidate:{
        type: ObjectId,
        ref: "CandidateProfile",
    },
    counselorName: {
        type: ObjectId,
        ref: "User",
    },
    reEnquireDate: {
        type: Date,
    },
    source: {
        type: String,
        trim: true,
    },
}, { timestamps: true });

module.exports = model('ReEnquire', reEnquireSchema);