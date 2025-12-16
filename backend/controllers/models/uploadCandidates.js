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
rollNo:{
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
    required: true,
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


}, { timestamps: true })


module.exports = model('UploadCandidates' , uploadCandidatesSchema)