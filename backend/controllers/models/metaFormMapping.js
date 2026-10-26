const mongoose = require('mongoose');

const { Schema } = mongoose;

// One CRM destination for a discovered Meta lead form.
// A form maps to a course or a job, never both, and the applicant record has no project.
// defaultSubstatus is the embedded substatus _id on Status.
const metaFormMappingSchema = new Schema({
  pageId: { type: String, required: true, trim: true },
  formId: { type: String, required: true, trim: true },
  collegeId: { type: Schema.Types.ObjectId, ref: 'College' },
  projectId: { type: Schema.Types.ObjectId, ref: 'Project' },
  courseId: { type: Schema.Types.ObjectId, ref: 'courses' },
  jobId: { type: Schema.Types.ObjectId, ref: 'Vacancy' },
  leadSource: { type: Schema.Types.ObjectId, ref: 'Source', required: true },
  defaultStatus: { type: Schema.Types.ObjectId, ref: 'Status', required: true },
  defaultSubstatus: { type: Schema.Types.ObjectId, required: true },
  isActive: { type: Boolean, default: true },
  createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
  updatedBy: { type: Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true, collection: 'meta_form_mappings' });

metaFormMappingSchema.index({ pageId: 1, formId: 1 }, { unique: true });

module.exports = mongoose.model('MetaFormMapping', metaFormMappingSchema);
