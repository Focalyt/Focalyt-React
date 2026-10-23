const mongoose = require('mongoose');

const { Schema } = mongoose;

// One CRM destination for a discovered Meta lead form.
// Project and course names are read from those collections when a response is built.
// defaultSubstatus is the embedded substatus _id on Status, matching AppliedCourses._leadSubStatus.
const metaFormMappingSchema = new Schema({
  pageId: { type: String, required: true, trim: true },
  formId: { type: String, required: true, trim: true },
  projectId: { type: Schema.Types.ObjectId, ref: 'Project', required: true },
  courseId: { type: Schema.Types.ObjectId, ref: 'courses', required: true },
  leadSource: { type: Schema.Types.ObjectId, ref: 'Source', required: true },
  defaultStatus: { type: Schema.Types.ObjectId, ref: 'Status', required: true },
  defaultSubstatus: { type: Schema.Types.ObjectId, required: true },
  isActive: { type: Boolean, default: true },
  createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
  updatedBy: { type: Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true, collection: 'meta_form_mappings' });

metaFormMappingSchema.index({ pageId: 1, formId: 1 }, { unique: true });

module.exports = mongoose.model('MetaFormMapping', metaFormMappingSchema);
