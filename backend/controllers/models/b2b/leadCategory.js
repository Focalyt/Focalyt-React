const mongoose = require('mongoose');
const { ObjectId } = mongoose.Schema;

const documentItemSchema = new mongoose.Schema(
  {
    name: { type: String, trim: true },
    isMandatory: { type: Boolean, default: false }
  },
  { _id: false }
);

const questionItemSchema = new mongoose.Schema(
  {
    question: { type: String, trim: true },
    type: { type: String, enum: ['text', 'number', 'radio', 'date'], default: 'text' },
    required: { type: Boolean, default: true },
    options: [{ type: String, trim: true }]
  },
  { _id: false }
);

const LeadCategorySchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  description: { type: String },
  isActive: { type: Boolean, default: true },
  documents: { type: [documentItemSchema], default: [] },
  questions: { type: [questionItemSchema], default: [] },
  addedBy: { type: ObjectId, ref: 'User' }
}, {
  timestamps: true
});

module.exports = mongoose.model('LeadCategory', LeadCategorySchema); 