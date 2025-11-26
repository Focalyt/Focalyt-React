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
    batch: {
      type: ObjectId,
      ref: "Batch",
    },
    batchAssignedBy: {
      type: ObjectId,
      ref: "User",
    },
    batchAssignedAt: {
      type: Date,
    },
    isBatchAssigned: {
      type: Boolean,
      default: false,
    },
    isZeroPeriodAssigned: {
      type: Boolean,
      default: false,
    },
    zeroPeriodAssignedBy: {
      type: ObjectId,
      ref: "User",
    },
    zeroPeriodAssignedAt: {
      type: Date,
    },
    isBatchFreeze: {
      type: Boolean,
      default: false,
    },
    batchFreezeBy: {
      type: ObjectId,
      ref: "User",
    },
    batchFreezeAt: {
      type: Date,
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
    registeredByModel: {
      type: String,
      enum: ["User", "Source"] // yahan dono models ka naam dena hai
    },
    registeredBy: {
      type: ObjectId,
      refPath: "registeredByModel"
    },
    // Current Status
    courseStatus: {
      type: Number,
      enum: [0, 1], // e.g. 0: Due, 1: Assigned, etc.
      default: 0,
    },

    isPhysicalCounselling: { type: Boolean, default: false },
    kycStage: { type: Boolean, default: false },
    kyc: { type: Boolean, default: false },

    kycDoneAt: { type: Date },
    kycDoneBy: { type: ObjectId, ref: "User" },
    
    admissionDone: { type: Boolean, default: false },
    admissionDate: { type: Date },
    dropout: { type: Boolean, default: false },
    dropoutDate: { type: Date },
    dropoutReason: { type: String },
    dropoutBy: { type: ObjectId, ref: "User" },
    movetoplacementstatus: { type: Boolean, default: false },
    
    // Attendance Tracking
    attendance: {
      zeroPeriod: {
        totalSessions: { type: Number, default: 0 },
        attendedSessions: { type: Number, default: 0 },
        attendancePercentage: { type: Number, default: 0 },
        sessions: [{
          date: { type: Date, required: true },
          status: { 
            type: String, 
            enum: ['Present', 'Absent'], 
            default: 'Absent' 
          },
          markedBy: { type: ObjectId, ref: "User" },
          markedAt: { type: Date, default: Date.now },
          remarks: { type: String }
        }]
      },
      regularPeriod: {
        totalSessions: { type: Number, default: 0 },
        attendedSessions: { type: Number, default: 0 },
        attendancePercentage: { type: Number, default: 0 },
        sessions: [{
          date: { type: Date, required: true },
          status: { 
            type: String, 
            enum: ['Present', 'Absent'], 
            default: 'Absent' 
          },
          markedBy: { type: ObjectId, ref: "User" },
          markedAt: { type: Date, default: Date.now },
          remarks: { type: String }
        }]
      }
    },
    
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
    counsellor: {
      type: ObjectId,
      ref: "User",
    },
    leadAssignment: [{
      _counsellor: {
        type: ObjectId,
        ref: "User",
      },
      counsellorName: {
        type: String
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
        docsId: { type: ObjectId, ref: "Courses.docsRequired" },
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
// Lead Assignment Method - Fixed version
appliedCoursesSchema.methods.assignCounselor = async function() {
  try {
    const LeadAssignmentRule = mongoose.model('LeadAssignmentRule');
    const AppliedCourses = mongoose.model('AppliedCourses');
    const Course = mongoose.model('courses');
    const College = mongoose.model('College');
    const User = mongoose.model('User');
    
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
      // FIXED: Use correct field name '_counsellor' instead of 'counselorId'
      const lastAssignment = await AppliedCourses.findOne({
        'leadAssignment._counsellor': counselorId
      }).sort({ createdAt: -1 });

      console.log(lastAssignment, 'lastAssignment', counselorId, 'counselorId');

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
      const counselorDetails = await User.findById(selectedCounselor);
      const counselorName = counselorDetails ? counselorDetails.name : 'Unknown';

      // FIXED: Use correct field name '_counsellor' instead of 'counselorId'
      // Add new assignment to leadAssignment array
      this.leadAssignment.push({
        _counsellor: new mongoose.Types.ObjectId(selectedCounselor), // Changed from counselorId to _counsellor
        counsellorName: counselorName,
        assignDate: new Date(),
        assignedBy: this.registeredBy
      });

      this.counsellor = new mongoose.Types.ObjectId(selectedCounselor);

      this.courseStatus = 1; // Assigned

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
    if (this.registeredBy && !this.registeredByModel) {
      const User = mongoose.model("User");
      const Source = mongoose.model("Source");
  
      if (await User.exists({ _id: this.registeredBy })) {
        this.registeredByModel = "User";
      } else if (await Source.exists({ _id: this.registeredBy })) {
        this.registeredByModel = "Source";
      }
    }


    const B2cFollowup = mongoose.model('B2cFollowup');
    const existingfollowup = await B2cFollowup.findOne({ appliedCourseId: this._id, status: 'planned' });
    if (existingfollowup) {
      this.status = 'done';
      this.updatedAt = new Date();
      this.updatedBy = this.registeredBy;
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

// Attendance Tracking Methods
appliedCoursesSchema.methods.markAttendance = async function(date, status, period = 'regularPeriod', markedBy = null, remarks = '') {
  try {
    const Batch = mongoose.model('Batch');
    
    // Validate period
    if (!['zeroPeriod', 'regularPeriod'].includes(period)) {
      throw new Error('Invalid period. Must be "zeroPeriod" or "regularPeriod"');
    }
    
    // Validate status
    if (!['Present', 'Absent'].includes(status)) {
      throw new Error('Invalid status. Must be "Present" or "Absent"');
    }
    
    // Check if batch is assigned
    if (!this.batch) {
      throw new Error('No batch assigned to this course application');
    }
    
    // Get batch details to validate date ranges
    const batch = await Batch.findById(this.batch);
    if (!batch) {
      throw new Error('Batch not found');
    }
    
    const attendanceDate = new Date(date);
    
    // Validate date based on period
    if (period === 'zeroPeriod') {
      if (attendanceDate < batch.zeroPeriodStartDate || attendanceDate > batch.zeroPeriodEndDate) {
        throw new Error('Date is outside zero period range');
      }
    } else {
      // For regular period, allow dates after zero period ends
      if (attendanceDate < batch.zeroPeriodEndDate) {
        throw new Error('Date must be after zero period ends');
      }
      // Optional: You can also add an upper limit if needed
      // if (attendanceDate > batch.endDate) {
      //   throw new Error('Date is after batch end date');
      // }
    }
    
    // Check if attendance for this date already exists
    const existingSessionIndex = this.attendance[period].sessions.findIndex(
      session => session.date.toDateString() === attendanceDate.toDateString()
    );
    
    if (existingSessionIndex !== -1) {
      // Update existing session
      this.attendance[period].sessions[existingSessionIndex] = {
        date: attendanceDate,
        status: status,
        markedBy: markedBy || this.registeredBy,
        markedAt: new Date(),
        remarks: remarks
      };
    } else {
      // Add new session
      this.attendance[period].sessions.push({
        date: attendanceDate,
        status: status,
        markedBy: markedBy || this.registeredBy,
        markedAt: new Date(),
        remarks: remarks
      });
    }
    
    // Recalculate attendance statistics
    this.calculateAttendanceStats(period);
    
    await this.save();
    return this;
  } catch (error) {
    console.error('Error marking attendance:', error);
    throw error;
  }
};

appliedCoursesSchema.methods.calculateAttendanceStats = function(period = null) {
  try {
    const periods = period ? [period] : ['zeroPeriod', 'regularPeriod'];
    
    periods.forEach(p => {
      const sessions = this.attendance[p].sessions;
      const totalSessions = sessions.length;
      const attendedSessions = sessions.filter(session => 
        ['Present'].includes(session.status)
      ).length;
      
      this.attendance[p].totalSessions = totalSessions;
      this.attendance[p].attendedSessions = attendedSessions;
      this.attendance[p].attendancePercentage = totalSessions > 0 
        ? Math.round((attendedSessions / totalSessions) * 100) 
        : 0;
    });
  } catch (error) {
    console.error('Error calculating attendance stats:', error);
    throw error;
  }
};

appliedCoursesSchema.methods.getAttendanceReport = function(startDate = null, endDate = null, period = null) {
  try {
    const periods = period ? [period] : ['zeroPeriod', 'regularPeriod'];
    const report = {};
    
    periods.forEach(p => {
      let sessions = this.attendance[p].sessions;
      
      // Filter by date range if provided
      if (startDate && endDate) {
        const start = new Date(startDate);
        const end = new Date(endDate);
        sessions = sessions.filter(session => 
          session.date >= start && session.date <= end
        );
      }
      
      const totalSessions = sessions.length;
      const presentSessions = sessions.filter(s => s.status === 'Present').length;
      const absentSessions = sessions.filter(s => s.status === 'Absent').length;
      
      report[p] = {
        totalSessions,
        presentSessions,
        absentSessions,
        attendancePercentage: totalSessions > 0 
          ? Math.round((presentSessions / totalSessions) * 100) 
          : 0,
        sessions: sessions.sort((a, b) => new Date(a.date) - new Date(b.date))
      };
    });
    
    return report;
  } catch (error) {
    console.error('Error generating attendance report:', error);
    throw error;
  }
};

appliedCoursesSchema.methods.bulkMarkAttendance = async function(attendanceData) {
  try {
    // attendanceData should be an array of objects with: date, status, period, remarks
    for (const record of attendanceData) {
      await this.markAttendance(
        record.date, 
        record.status, 
        record.period || 'regularPeriod',
        record.markedBy,
        record.remarks
      );
    }
    
    return this;
  } catch (error) {
    console.error('Error in bulk marking attendance:', error);
    throw error;
  }
};

module.exports = model("AppliedCourses", appliedCoursesSchema);
