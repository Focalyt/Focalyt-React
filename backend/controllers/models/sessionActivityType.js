const { Schema, model } = require('mongoose');
const { ObjectId } = Schema.Types;

const activityTypeItemSchema = new Schema(
  {
    id: { type: String, trim: true, required: true },
    name: { type: String, trim: true, required: true },
    color: { type: String, trim: true, default: '#2563eb' },
  },
  { _id: false }
);

const sessionActivityTypeSchema = new Schema(
  {
    college: { type: ObjectId, ref: 'College', required: true, unique: true, index: true },
    types: { type: [activityTypeItemSchema], default: [] },
    updatedBy: { type: ObjectId, ref: 'User', default: null },
  },
  { timestamps: true }
);

module.exports = model('SessionActivityType', sessionActivityTypeSchema);
