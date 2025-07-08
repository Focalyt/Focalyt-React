const mongoose = require('mongoose');

const classroomMediaSchema = new mongoose.Schema({
  // Basic Information
  date: {
    type: Date,
    required: [true, 'Date is required'],
    default: Date.now
  },
  description: {
    type: String,
    trim: true,
    maxlength: [1000, 'Description cannot exceed 1000 characters']
  },
  
  // Files Information
  files: [{
    fileUrl: {
      type: String,
      required: [true, 'File URL is required']
    },
    mediaType: {
      type: String,
      required: [true, 'Media type is required'],
      enum: ['image', 'video', 'document', 'audio', 'presentation'],
      default: 'document'
    }
  }],
  

  
  // Batch Information
  batchId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Batch',
    required: [true, 'Batch ID is required']
  },
  
  // Upload Information
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Uploader ID is required']
  },
  
  uploadedAt: {
    type: Date,
    default: Date.now
  },
  
  // Soft Delete
  isDeleted: {
    type: Boolean,
    default: false
  },
  
  deletedAt: {
    type: Date,
    default: null
  },
  
  deletedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  }
}, {
  timestamps: true, // Adds createdAt and updatedAt
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for better query performance
classroomMediaSchema.index({ batchId: 1, date: -1 });
classroomMediaSchema.index({ uploadedBy: 1, uploadedAt: -1 });
classroomMediaSchema.index({ date: -1 });
classroomMediaSchema.index({ isDeleted: 1 });

// Virtual for total file size
classroomMediaSchema.virtual('totalFileSize').get(function() {
  if (!this.files || this.files.length === 0) return 0;
  return this.files.reduce((total, file) => total + file.fileSize, 0);
});

// Virtual for formatted total file size
classroomMediaSchema.virtual('formattedTotalFileSize').get(function() {
  const totalSize = this.totalFileSize;
  if (totalSize < 1024) return totalSize + ' B';
  if (totalSize < 1024 * 1024) return (totalSize / 1024).toFixed(1) + ' KB';
  if (totalSize < 1024 * 1024 * 1024) return (totalSize / (1024 * 1024)).toFixed(1) + ' MB';
  return (totalSize / (1024 * 1024 * 1024)).toFixed(1) + ' GB';
});

// Virtual for file count
classroomMediaSchema.virtual('fileCount').get(function() {
  return this.files ? this.files.length : 0;
});

// Pre-save middleware to ensure files array exists
classroomMediaSchema.pre('save', function(next) {
  if (!this.files) {
    this.files = [];
  }
  next();
});

// Static method to get media by batch
classroomMediaSchema.statics.getByBatch = function(batchId, options = {}) {
  const query = {
    batchId,
    isDeleted: false
  };
  
  if (options.date) {
    query.date = options.date;
  }
  
  return this.find(query)
    .populate('uploadedBy', 'name email')
    .populate('batchId', 'name')
    .sort({ date: -1 });
};

// Static method to get media statistics
classroomMediaSchema.statics.getStatistics = function(batchId) {
  return this.aggregate([
    {
      $match: {
        batchId: new mongoose.Types.ObjectId(batchId),
        isDeleted: false
      }
    },
    {
      $group: {
        _id: null,
        totalEntries: { $sum: 1 },
        totalFiles: { $sum: { $size: '$files' } },
        totalSize: { $sum: { $reduce: { input: '$files', initialValue: 0, in: { $add: ['$$value', '$$this.fileSize'] } } } }
      }
    }
  ]);
};

// Instance method to add file
classroomMediaSchema.methods.addFile = function(fileData) {
  this.files.push(fileData);
  return this.save();
};

// Instance method to remove file
classroomMediaSchema.methods.removeFile = function(fileIndex) {
  if (fileIndex >= 0 && fileIndex < this.files.length) {
    this.files.splice(fileIndex, 1);
    return this.save();
  }
  return Promise.reject(new Error('Invalid file index'));
};

// Instance method for soft delete
classroomMediaSchema.methods.softDelete = function(userId) {
  this.isDeleted = true;
  this.deletedAt = new Date();
  this.deletedBy = userId;
  return this.save();
};

module.exports = mongoose.model('ClassroomMedia', classroomMediaSchema); 
module.exports = mongoose.model('ClassroomMedia', classroomMediaSchema); 