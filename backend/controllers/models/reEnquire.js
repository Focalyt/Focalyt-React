const { Schema, model } = require('mongoose');
const { ObjectId } = Schema.Types;
const reEnquireSchema = new Schema({
    name: {
        type: String,
    },
    course: {
        type: ObjectId,
        ref: "courses",
    },
    mobileNo: {
        type: Number,
    },
    counselorName: {
        type: String,
    },
    reEnquireDate: {
        type: Date,
    }
}, { timestamps: true });

module.exports = model('ReEnquire', reEnquireSchema);