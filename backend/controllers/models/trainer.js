const mongoose = require('mongoose')
const { Schema, model } = require('mongoose');

const trainerSchema = new Schema({

name:{
    type : String,
    required:true,
    trim: true
},
mobile:{
type: Number
},
email:{
    type: String,
	lowercase: true,
	trim: true,
},
password:{
    type: String
}

})


module.exports = model('Trainer' , trainerSchema)