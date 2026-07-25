const { Schema, model } = require('mongoose');
const { ObjectId } = Schema.Types;

const materialItemSchema = new Schema(
  {
    id: { type: String, default: '' },
    name: { type: String, trim: true, default: '' },
    description: { type: String, trim: true, default: '' },
    type: { type: String, trim: true, default: '' },
    requirement: { type: String, trim: true, default: '' },
    requirementLabel: { type: String, trim: true, default: '' },
    status: { type: String, trim: true, default: '' },
    fileUrl: { type: String, default: '' },
    uploadedBy: { type: ObjectId, ref: 'User', default: null },
    uploadedAt: { type: Date, default: null },
  },
  { _id: true }
);

const activityItemSchema = new Schema(
  {
    id: { type: String, trim: true, default: '' },
    key: { type: String, trim: true, default: '' },
    name: { type: String, trim: true, default: '' },
    color: { type: String, default: '' },
  },
  { _id: false }
);

const totQuestionSchema = new Schema(
  {
    question: { type: String, trim: true, default: '' },
    options: { type: [String], default: [] },
    correctIndex: { type: Number, default: 0 },
    marks: { type: Number, default: 0 },
  },
  { _id: true }
);

const subSessionItemSchema = new Schema(
  {
    name: { type: String, trim: true, default: '' },
    duration: { type: String, trim: true, default: '' },
  },
  { _id: true }
);

const sessionPlanSchema = new Schema(
  {
    college: { type: ObjectId, ref: 'College', required: true, index: true },
    vertical: { type: ObjectId, ref: 'Vertical', default: null, index: true },
    project: { type: ObjectId, ref: 'Project', default: null, index: true },
    center: { type: ObjectId, ref: 'Center', default: null, index: true },
    course: { type: ObjectId, ref: 'coursescopy', required: true, index: true },
    batch: { type: ObjectId, ref: 'Batch', default: null, index: true },

    verticalName: { type: String, default: '' },
    projectName: { type: String, default: '' },
    centerName: { type: String, default: '' },
    courseName: { type: String, default: '' },
    batchCode: { type: String, default: '' },
    studentCount: { type: Number, default: 0 },

    title: { type: String, trim: true, required: true },
    sessionType: { type: String, trim: true, default: 'student' },
    sessionNumber: { type: String, trim: true, default: '' },
    hours: { type: String, default: '' },
    /** @deprecated legacy single sub-session fields — use subSessionItems */
    subSessions: { type: String, default: '' },
    subSessionName: { type: String, default: '' },
    duration: { type: String, default: '' },
    subSessionItems: { type: [subSessionItemSchema], default: [] },

    unitNumber: { type: String, default: '' },
    unitName: { type: String, default: '' },
    chapterNumber: { type: String, default: '' },
    chapterName: { type: String, default: '' },
    subTopics: { type: String, default: '' },
    topicCovered: { type: String, default: '' },
    trainingMethod: { type: String, default: '' },

    classroomLabResources: { type: String, default: '' },

    standardTlm: { type: [materialItemSchema], default: [] },
    trainerBasedTlm: { type: [materialItemSchema], default: [] },

    notes: { type: String, default: '' },

    sessionDate: { type: Date, default: null },
    dateLabel: { type: String, default: '' },
    startTime: { type: String, default: '' },
    endTime: { type: String, default: '' },

    sessionActivities: { type: [activityItemSchema], default: [] },

    evidenceDocs: { type: [materialItemSchema], default: [] },
    learningMaterials: { type: [materialItemSchema], default: [] },
    preSessionRequirements: { type: [materialItemSchema], default: [] },

    includeTot: { type: Boolean, default: true },
    totUseSameTopics: { type: Boolean, default: true },
    totTopicCovered: { type: String, default: '' },
    totTrainingMethod: { type: String, default: '' },
    totMaterials: { type: [materialItemSchema], default: [] },
    totTrainingProofs: { type: [materialItemSchema], default: [] },
    totCompletionProofs: { type: [materialItemSchema], default: [] },
    requireTotCompletionProofs: { type: Boolean, default: false },
    totStatus: { type: String, trim: true, default: '' },
    totQuestionBank: { type: [totQuestionSchema], default: [] },
    totQuestionBankLastUpdated: { type: Date, default: null },

    workflowStatus: { type: String, trim: true, default: 'Scheduled', index: true },

    createdBy: { type: ObjectId, ref: 'User', required: true, index: true },
    seniorTrainer: { type: ObjectId, ref: 'User', default: null, index: true },
    seniorTrainerName: { type: String, default: '' },
    fieldTrainer: { type: ObjectId, ref: 'User', default: null, index: true },
    fieldTrainerName: { type: String, default: '' },
    totTrainer: { type: ObjectId, ref: 'User', default: null },
    totTrainerName: { type: String, default: '' },

    referredAt: { type: Date, default: null },
    assignedAt: { type: Date, default: null },
    completedAt: { type: Date, default: null },

    isDeleted: { type: Boolean, default: false, index: true },
    status: { type: Boolean, default: true },
  },
  { timestamps: true }
);

sessionPlanSchema.index({ college: 1, course: 1, batch: 1, isDeleted: 1, sessionNumber: 1 });
sessionPlanSchema.index({ college: 1, course: 1, isDeleted: 1, createdAt: -1 });
sessionPlanSchema.index({ seniorTrainer: 1, workflowStatus: 1, isDeleted: 1 });
sessionPlanSchema.index({ fieldTrainer: 1, workflowStatus: 1, isDeleted: 1 });

module.exports = model('SessionPlan', sessionPlanSchema);
