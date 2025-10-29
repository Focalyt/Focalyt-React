const { Schema, model, Types } = require('mongoose');

const assignmentSubmissionSchema = new Schema(
  {
    assignment: {
      type: Types.ObjectId,
      ref: 'AssignmentQuestions',
      required: true,
      index: true
    },
    
    candidate: {
      type: Types.ObjectId,
      ref: 'CandidateProfile',
      required: true,
      index: true
    },

    answers: [{
      questionId: { type: String, required: true },
      selectedOption: { type: Number }, 
      isCorrect: { type: Boolean },
      marksObtained: { type: Number, default: 0 }
    }],

    score: { type: Number, required: true, default: 0 },
    totalMarks: { type: Number, required: true },
    percentage: { type: Number, required: true },
    pass: { type: Boolean, required: true },

   
    correctCount: { type: Number, default: 0 },
    wrongCount: { type: Number, default: 0 },
    attemptedCount: { type: Number, default: 0 },
    unattemptedCount: { type: Number, default: 0 },
    marksFromCorrect: { type: Number, default: 0 },
    negativeDeducted: { type: Number, default: 0 },

    timeStarted: { type: Date },
    timeSubmitted: { type: Date },
    timeTakenSeconds: { type: Number }, 
  },
  { timestamps: true, versionKey: false }
);


assignmentSubmissionSchema.index({ candidate: 1, assignment: 1 });
assignmentSubmissionSchema.index({ assignment: 1, createdAt: -1 });
assignmentSubmissionSchema.index({ candidate: 1, createdAt: -1 });

module.exports = model('AssignmentSubmission', assignmentSubmissionSchema);

