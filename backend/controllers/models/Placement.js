const mongoose = require('mongoose');
const { ObjectId } = mongoose.Schema.Types;

// 
const PlacementSchema = new mongoose.Schema({
  companyName: {
    type: String,
    required: true,
    trim: true
  },
  employerName: {
    type: String,
    trim: true
  },
  contactNumber: {
    type: String,
    trim: true,
    validate: {
      validator: function(v) {
        if (!v || v.trim() === '') return true; 
        return /^[6-9]\d{9}$/.test(v.replace(/\D/g, ''));
      },
      message: 'Please enter a valid 10-digit contact number'
    }
  },
  dateOfJoining: {
    type: Date,
    required: true
  },
  location: {
    type: String,
    required: true,
    trim: true
  },
  college: {
    type: ObjectId,
    ref: 'College',
    required: true
  },
  appliedCourse: {
    type: ObjectId,
    ref: 'AppliedCourses'
  },
  uploadCandidate: {
    type: ObjectId,
    ref: 'UploadCandidates'
  },
  addedBy: {
    type: ObjectId,
    ref: 'User'
  },
  status: {
    type: ObjectId,
    ref: 'placementStatus'
  },
  subStatus: {
    type: ObjectId
  },
  remark: {
    type: String,
    trim: true
  },
  logs: [
    {
      user: {
        type: ObjectId,
        ref: "User"
      },
      timestamp: {
        type: Date,
        default: Date.now
      },
      action: {
        type: String,
        required: true
      },
      remarks: {
        type: String
      }
    }
  ],
  updatedBy: {
    type: ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Placement', PlacementSchema);
