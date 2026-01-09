const mongoose = require('mongoose')
const { Schema, model } = require('mongoose');

const uploadCandidatesSchema = new Schema({

name:{
    type : String,
    required:true,
    trim: true
},
fatherName:{
    type: String,
    required: true,
    trim: true
},

course:{
    type: String,
    required: true,
    trim: true
},
session:{
    type: String,
    trim: true
},
year:{
    type: String,
    trim: true
},
college: {
    type: Schema.Types.ObjectId,
    ref: 'College',
    required: true
},
collegeName:{
    type: String,
    required: true,
    trim: true
},
batchId:{
    type: String,
    trim: true
},
contactNumber:{
    type: String,
    trim: true
},
email:{
    type: String,
    trim: true,
    lowercase: true
},
gender:{
    type: String,
    trim: true,
    enum: ['Male', 'Female', 'Other', 'male', 'female', 'other', '']
},
dob:{
    type: Date
},
status:{
    type: String,
    enum: ['active', 'inactive'],
    default: 'inactive',
    trim: true
},
user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    default: null
}


}, { timestamps: true })


module.exports = model('UploadCandidates' , uploadCandidatesSchema)