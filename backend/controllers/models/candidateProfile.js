const { Schema, model } = require("mongoose");
const { sign } = require("jsonwebtoken");

const { ObjectId } = Schema.Types;
const { jwtSecret } = require("../../config");
const { boolean } = require("joi");



const candidateProfileSchema = new Schema(
  {
    personalInfo: {
      name: { type: String, trim: true },
      mobile: {
        type: Number,
        lowercase: true,
        trim: true,
        unique: true,
        //unique: "Mobile number already exists!",
      },
      email: {
        type: String,
        lowercase: true,
        trim: true,
      },
      profilevideo: { type: String },
      sex: { type: String },
      dob: { type: Date },
      whatsapp: { type: Number },
      resume: { type: String },
      linkedInUrl: { type: String },
      facebookUrl: { type: String },
      twitterUrl: { type: String },
      professionalTitle: { type: String },
      professionalSummary: { type: String },
      location: {
        type: {
          type: String,
          enum: ["Point"],
          default: "Point"
        },
        coordinates: {
          type: [Number],
          default: [0, 0]
        },
        latitude: { type: String },
        longitude: { type: String },
        city: { type: String },
        state: { type: String },
        fullAddress: { type: String }
      },
      image: { type: String },
      jobLocationPreferences: [
        {
          state: { type: ObjectId, ref: "State" },
          city: { type: ObjectId, ref: "City" },
        },
      ],
      skills: [
        {
          skillName: { type: String },
          skillPercent: { type: Number }
        }
      ],
      certifications: [{
        certificateName: { type: String },
        orgName: { type: String },
        year: { type: String }
      }],
      languages: [{
        lname: { type: String },
        level: { type: Number }
      }],
      projects: [{
        projectName: { type: String },
        proyear: { type: Number },
        proDescription: { type: String }
      }],
      interest: [{
        type: String
      }],
      declaration: {
        isChecked: { type: Boolean, default: false },
        text: { type: String, default: "I hereby declare that all the information provided above is true to the best of my knowledge." }
      }
    },

    hiringStatus: [
      {
        type: new Schema(
          {
            company: { type: ObjectId, ref: "Company" },
            status: { type: String },
            job: { type: ObjectId, ref: "Vacancy" },
            isRejected: { type: Boolean },
            eventDate: { type: String },
            concernedPerson: { type: String },
            comment: { type: String },
          },
          { timestamps: true }
        ),
      },
    ],
    appliedJobs: [{ type: ObjectId, ref: "Vacancy" }],
    appliedCourses: [
      {
        courseId: { type: ObjectId, ref: "courses" }, // Changed from type to courseId
        centerId: { type: ObjectId, ref: "Center" }, // Course reference
        docsForCourses: [
          {
            courseId: { type: ObjectId, ref: "courses" }, // Changed from type to courseId
            uploadedDocs: [
              {
                docsId: { type: ObjectId, ref: "courses.docsRequired" },
                fileUrl: String,
                status: { type: String, enum: ["Pending", "Verified", "Rejected"], default: "Pending" }, // Verification Status
                reason: { type: String }, // Rejection ka reason
                verifiedBy: { type: ObjectId, ref: "User" },
                verifiedDate: { type: Date },
                uploadedAt: { type: Date, default: Date.now } // Upload Timestamp
              }
            ]
          }
        ]

      }
    ],

    qualifications: [
      {
        subQualification: { type: ObjectId, ref: "SubQualification" },
        Qualification: { type: ObjectId, ref: "Qualification" },
        QualificationCourse: { type: ObjectId, ref: "QualificationCourse" },
        College: String,
        location: {
          type: {
            type: String,
            enum: ['Point'],
            required: true
          },
          coordinates: {
            type: [Number],
            required: true
          },
          city: String,
          state: String,
          fullAddress: String

        }
        ,
        UniversityName: { type: ObjectId, ref: "University" },
        
        PassingYear: String,
       
      },
    ],
    experiences: [
      {
        Industry_Name: { type: ObjectId, ref: "Industry" },
        SubIndustry_Name: { type: ObjectId, ref: "SubIndustry" },
        Company_Name: String,

        Company_State: { type: String },
        Company_City: { type: String },
        Company_longitude: { type: String },
        Comments: String,
        FromDate: String,
        ToDate: String,
      },
    ],

    availableCredit: {
      type: Number,
    },
    otherUrls: [{}],
    highestQualification: { type: ObjectId, ref: "Qualification" },

    isProfileCompleted: {
      type: Boolean,
      default: false,
    },
    flag: {
      type: Boolean,
    },
    isExperienced: Boolean,

    status: {
      type: Boolean,
      default: true,
    },

    accessToken: [String],
    isDeleted: {
      type: Boolean,
      default: false,
    },
    isImported: {
      type: Boolean,
      default: false,
    },
    creditLeft: {
      type: Number,
    },
    visibility: {
      type: Boolean,
      default: true
    },

    upi: { type: String },
    referredBy: {
      type: ObjectId, ref: "Candidate"
    },
    verified: {
      type: Boolean,
      default: false
    }
  },
  { timestamps: true }
);

candidateProfileSchema.methods = {
  async generateAuthToken() {
    const data = { id: this._id.toHexString() };
    const token = sign(data, jwtSecret).toString();

    if (!this.accessToken || !Array.isArray(this.accessToken))
      this.accessToken = [];

    this.accessToken.push(token);
    await this.save();
    return token;
  },
};

module.exports = model("CandidateProfile", candidateProfileSchema);

