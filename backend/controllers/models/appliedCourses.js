const { defaultFormatUtc } = require('moment');
const mongoose = require('mongoose');
const { Schema, model } = require("mongoose");
const { ObjectId } = Schema.Types;

const appliedCoursesSchema = new Schema(
  {
    _candidate: {
      type: ObjectId,
      ref: "CandidateProfile",
    },
    _course: {
      type: ObjectId,
      ref: "courses",
    },
    _center: {
      type: ObjectId,
      ref: "Center",
    },
    _leadStatus: {
      type: ObjectId,
      ref: "Status",
      default: new mongoose.Types.ObjectId('64ab1234abcd5678ef901234')
    },
    _leadSubStatus: {
      type: ObjectId,
      default: new mongoose.Types.ObjectId('64ab1234abcd5678ef901235')
    },
    _initialStatus: {
      type: String,
      enum: ['Hot', 'Warm', 'Cold'],
    },
    registeredBy: {
      type: ObjectId,
      ref: "User",
    },
    // Current Status
    courseStatus: {
      type: Number,
      enum: [0, 1], // e.g. 0: Due, 1: Assigned, etc.
      default: 0,
    },

    kycStage: { type: Boolean, default: false },
    kyc: { type: Boolean, default: false },
    admissionDone: { type: Boolean, default: false },
    dropout: { type: Boolean, default: false },
    // Followup info (optional, alag se track karenge)
    followupDate: {
      type: Date,
    },
    followups: [{
      date: {
        type: Date,
      },
      status: {
        type: String,
        default: 'Planned',
        enum: ['Done', 'Missed', 'Planned']
      },

    }

    ],
    leadAssignment: [{
      counsellorName: {
        type: ObjectId,
        ref: "User",
      },
      assignDate: {
        type: Date,
      },
      assignedBy: {
        type: ObjectId,
        ref: "User",
      },
    }],
    // Detailed activity logs with free text description
    logs: [
      {
        user: {
          type: ObjectId,
          ref: "User",
          required: true,
        },
        timestamp: {
          type: Date,
          default: Date.now,
        },
        action: {
          type: String,
          required: true,
          // Example: "Status changed from Due to Assigned", "Followup set for 10 Oct", "Lead referred to John"
        },
        remarks: {
          type: String,
          // Example: "Status changed from Due to Assigned", "Followup set for 10 Oct", "Lead referred to John"
        }
      }
    ],

    registrationFee: {
      type: String,
      enum: ["Paid", "Unpaid"],
      default: "Unpaid",
    },
    url: {
      type: String,
      default: "",
    },
    remarks: {
      type: String,
      default: "",
    },
    selectedCenter: {
      centerId: { type: ObjectId, ref: "Center" },
    },
    uploadedDocs: [
      {
        docsId: { type: ObjectId, ref: "courses.docsRequired" },
        fileUrl: String,
        status: { type: String, enum: ["Pending", "Verified", "Rejected"], default: "Pending" },
        reason: { type: String },
        verifiedBy: { type: ObjectId, ref: "User" },
        verifiedDate: { type: Date },
        uploadedAt: { type: Date, default: Date.now },
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Lead Assignment Method - अब save नहीं करेगा
appliedCoursesSchema.methods.assignCounselor = async function() {
  try {
    const LeadAssignmentRule = mongoose.model('LeadAssignmentRule');
    const AppliedCourses = mongoose.model('AppliedCourses');
    const Course = mongoose.model('courses');
    const College = mongoose.model('College');
    
    const courseId = this._course;
    const centerId = this._center;
    
    // Step 1: Find applicable assignment rules
    const applicableRules = await LeadAssignmentRule.find({
      status: 'Active',
      $or: [
        // Rule where center is 'any' and course matches
        {
          'center.type': 'any',
          $or: [
            { 'course.type': 'any' },
            { 'course.type': 'includes', 'course.values': courseId }
          ]
        },
        // Rule where center matches and course is 'any'
        {
          'center.type': 'includes',
          'center.values': centerId,
          'course.type': 'any'
        },
        // Rule where both center and course match
        {
          'center.type': 'includes',
          'center.values': centerId,
          'course.type': 'includes',
          'course.values': courseId
        }
      ]
    });

    let allCounselors = [];

    if (applicableRules.length === 0) {
      console.log('No applicable assignment rules found, assigning to default admin');
      
      try {
        // Fetch course and its college to get default admin
        const course = await Course.findById(courseId);
        
        if (course && course.college) {
          const college = await College.findById(course.college);
          
          if (college && college._concernPerson && college._concernPerson.length > 0) {
            // Find the default admin from _concernPerson array
            const defaultAdmin = college._concernPerson.find(person => person.defaultAdmin === true);
            
            if (defaultAdmin && defaultAdmin._id) {
              allCounselors = [defaultAdmin._id.toString()];
              console.log(`Using default admin from college: ${defaultAdmin._id}`);
            } else {
              // If no default admin is set, use the first concern person
              const firstConcernPerson = college._concernPerson[0];
              if (firstConcernPerson && firstConcernPerson._id) {
                allCounselors = [firstConcernPerson._id.toString()];
                console.log(`No default admin set, using first concern person: ${firstConcernPerson._id}`);
              } else {
                console.log('No concern person found in college');
                return null;
              }
            }
          } else {
            console.log('No concern persons found in college');
            return null;
          }
        } else {
          console.log('Course not found or no college associated with course');
          return null;
        }
      } catch (error) {
        console.error('Error finding college default admin:', error);
        return null;
      }
    } else {
      // Step 2: Get all counselors from applicable rules
      applicableRules.forEach(rule => {
        allCounselors = allCounselors.concat(rule.assignedCounselors);
      });

      // Remove duplicates
      allCounselors = [...new Set(allCounselors.map(c => c.toString()))];
    }

    if (allCounselors.length === 0) {
      console.log('No counselors found');
      return null;
    }

    // Step 3: Check each counselor's last assignment for this course-center combination
    const counselorAssignments = [];

    for (let counselorId of allCounselors) {
      // Find last assignment for this counselor with same course and center (sorted by createdAt)
      const lastAssignment = await AppliedCourses.findOne({
        _course: courseId,
        _center: centerId,
        'leadAssignment.counsellorName': counselorId
      }).sort({ createdAt: -1 });

      let lastAssignmentDate = null;
      if (lastAssignment) {
        // Get the createdAt of the last assigned lead for this counselor
        lastAssignmentDate = lastAssignment.createdAt;
      }

      counselorAssignments.push({
        counselorId: counselorId,
        lastAssignmentDate: lastAssignmentDate,
        hasAssignment: !!lastAssignmentDate
      });
    }

    // Step 4: Find counselor to assign
    let selectedCounselor = null;

    // If only one counselor (default admin case), assign directly
    if (allCounselors.length === 1) {
      selectedCounselor = allCounselors[0];
      console.log(`Assigning to single available counselor: ${selectedCounselor}`);
    } else {
      // Multiple counselors - use round robin logic
      const counselorsWithoutAssignment = counselorAssignments.filter(c => !c.hasAssignment);
      
      if (counselorsWithoutAssignment.length > 0) {
        // Assign to first counselor who has no assignment
        selectedCounselor = counselorsWithoutAssignment[0].counselorId;
        console.log(`Assigning to counselor with no previous assignment: ${selectedCounselor}`);
      } else {
        // All counselors have assignments, find who got assigned earliest (longest time ago based on createdAt)
        const sortedByDate = counselorAssignments.sort((a, b) => {
          return new Date(a.lastAssignmentDate) - new Date(b.lastAssignmentDate);
        });
        selectedCounselor = sortedByDate[0].counselorId;
        console.log(`Assigning to counselor with oldest assignment: ${selectedCounselor}, last assigned: ${sortedByDate[0].lastAssignmentDate}`);
      }
    }

    // Step 5: Assign the selected counselor (DON'T SAVE HERE)
    if (selectedCounselor) {
      // Add new assignment to leadAssignment array
      this.leadAssignment.push({
        counsellorName: new mongoose.Types.ObjectId(selectedCounselor),
        assignDate: new Date(),
        assignedBy: this.registeredBy
      });

      this.courseStatus = 1; // Assigned

      // Add log entry with appropriate message
      const logMessage = applicableRules.length === 0 
        ? 'Lead assigned to default admin automatically (no assignment rules found)'
        : 'Lead assigned automatically via assignment rules';

      this.logs.push({
        user: this.registeredBy,
        timestamp: new Date(),
        action: logMessage,
        remarks: logMessage
      });

      // DON'T CALL this.save() HERE - let the main save operation handle it
      console.log(`Lead assigned to counselor: ${selectedCounselor}`);
      return selectedCounselor;
    }

    return null;
  } catch (error) {
    console.error('Error in assignCounselor:', error);
    throw error;
  }
};

// Pre-save hook to auto-assign counselor
appliedCoursesSchema.pre('save', async function(next) {
  try {
    // Only auto-assign if this is a new document and no counselor is assigned
    if (this.isNew && (!this.leadAssignment || this.leadAssignment.length === 0)) {
      await this.assignCounselor();
      // assignCounselor() method will modify the document, main save will handle the actual saving
    }
    next();
  } catch (error) {
    next(error);
  }
});

// Manual assignment method (when you need to save separately)
appliedCoursesSchema.methods.manualAssignCounselor = async function() {
  try {
    const result = await this.assignCounselor();
    if (result) {
      await this.save(); // Only save here for manual assignments
    }
    return result;
  } catch (error) {
    console.error('Error in manual assign counselor:', error);
    throw error;
  }
};

module.exports = model("AppliedCourses", appliedCoursesSchema);
