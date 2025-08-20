const { Schema, model } = require('mongoose');
const { ObjectId } = Schema.Types;

const answerSchema = new Schema({
  question: { type: String, required: true },  
  answer: { type: String, required: true },
  rejectionReason: { type: String, default: null } 
  
});

const preQVSchema = new Schema({
  appliedcourse: { type: ObjectId, ref: 'AppliedCourse', required: true }, 
  responses: [answerSchema], 
  status: { type: Boolean, default: true },   
}, { timestamps: true });

module.exports = model('QuestionAnswer', preQVSchema);
