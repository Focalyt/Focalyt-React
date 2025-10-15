const { Schema, model } = require('mongoose');
const { ObjectId } = Schema.Types;

const courseSchema = new Schema({
  sectors: [{ type: ObjectId, ref: "CourseSectors" }],
  center: [{ type: ObjectId, ref: "Center" }],
  
  centerId: { type: ObjectId, ref: 'Center' }, // ✅ Added for simplified reference

  courseLevel: String,
  name: { type: String, trim: true },
  description: { type: String }, // ✅ Added to support short course summary
  duration: String,
  students: { type: Number, default: 0 }, // ✅ Added to track enrollment count
  trainers: [ { type: ObjectId, ref: 'User' } ],
  status: { type: Boolean, default:true}, // ✅ Added to reflect course status
  sequence: {
    type: Number,
    default: 50
  },
  courseFeeType: {
    type: String,
    enum: ['Paid', 'Free'],
    required: true,
  },
  typeOfProject: {
    type: String,
    // enum: ['P&T', 'T&P', "General"],
  },
  vertical: {
    type: Schema.Types.ObjectId,
    ref: 'Vertical',
    required: true,
  },
  projectName: String,
  project: {
      type: Schema.Types.ObjectId,
      ref: 'Project',
      required: true,
    },
  courseType: String,
  youtubeURL: String,
  brochure: String,
  thumbnail: String,
  certifyingAgency: String,
  certifyingAgencyWebsite: String,
  qualification: String,
  age: String,
  experience: String,
  trainingMode: String,
  onlineTrainingTiming: String,
  offlineTrainingTiming: String,
  address: String,
  city: String,
  state: String,
  appLink: String,
  ojt: String,
  registrationCharges: String,
  courseFee: String,
  cutPrice: String,
  examFee: String,
  otherFee: String,
  emiOptionAvailable: String,
  maxEMITenure: String,
  stipendDuringTraining: String,
  lastDateForApply: String,
  requiredDocuments: String,

  docsRequired: [
    {
      Name: { type: String },
      mandatory: { type: Boolean, default: false },
      status: { type: Boolean, default: true }
    }
  ],

  testimonialvideos: [{ type: String }],
  photos: [String],
  audios: [String],
  videos: [String],

  courseFeatures: { type: String, default: "" },
  importantTerms: { type: String, default: "" },
  questionAnswers: [{ Question: String, Answer: String }],
  courseRemark: { type: String },
  courseUrl: { type: String, default: "" },

  isRecommended: { type: Boolean, default: false },
  isDeleted: { type: Boolean, default: false },

  counslername: { type: String, default: "" },
  counslerphonenumber: { type: Number, default: "" },
  counslerwhatsappnumber: { type: Number, default: "" },
  counsleremail: { type: String, default: "" },

  createdBy: { type: ObjectId, ref: 'User' }, // ✅ Replaced old nested structure with simple ObjectId
  approvedBy: { type: ObjectId, ref: 'User' }, // ✅ Newly added field

  createdByType: {
    type: {
      type: String,
      enum: ['admin', 'college'],
      default: 'admin'
    },
    id: { type: ObjectId, ref:'User' }
  },

  college: {
    type: ObjectId,
    ref: 'College',
    default: null
  }

}, { timestamps: true });



module.exports = model('courses', courseSchema);
