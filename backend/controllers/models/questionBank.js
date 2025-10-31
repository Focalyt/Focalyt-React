const { Schema, model, Types } = require('mongoose');


const SnapQuestionSchema = new Schema(
  {
    questionRef: { type: Types.ObjectId, ref: 'BankQuestion' },
    course: { type: Types.ObjectId, ref: 'Course' },
    centers: [{ type: Types.ObjectId, ref: 'Center'}],
    question: {
      type: String,
      required: true,
      trim: true,
    },

    options: {
      type: [String],
      required: true,
      validate: {
        validator(arr) {
          return (
            Array.isArray(arr) &&
            arr.length === 4 &&
            arr.every(opt => typeof opt === 'string' && opt.trim().length > 0)
          );
        },
        message: 'Each question must have exactly 4 non-empty options.'
      }
    },

    correctIndex: { type: Number, required: true, min: 0, max: 3 },

    correctAnswer: { type: String, trim: true },

    marks: { type: Number, required: true, min: 0.25 },

    shuffleOptions: { type: Boolean, default: false },
  },
);

const questionAnswerSchema = new Schema(
  {
    title: { type: String, required: true, trim: true},
    durationMins: { type: Number, required: true, min: 1 },
    passPercent: { type: Number, required: true, min: 0, max: 100, default: 33 },
    totalMarks: { type: Number, required: true, min: 1 },

    questions: {
      type: [SnapQuestionSchema],
      required: true,
      validate: {
        validator(arr) {
          return Array.isArray(arr) && arr.length > 0;
        },
        message: 'Assignment must contain at least one question.'
      }
    },

    owner: { type: Types.ObjectId, ref: 'User', required: true, index: true },

    isPublished: { type: Boolean, default: false },
    availableFrom: { type: Date },
    availableTill: { type: Date },

    tags: { type: [String], default: [] }
  },
  { timestamps: true, versionKey: false }
);

questionAnswerSchema.pre('validate', function (next) {
  this.questions = this.questions.map(q => {
    if (q.options && q.correctIndex >= 0 && q.correctIndex < q.options.length) {
      q.correctAnswer = q.options[q.correctIndex]; 
    }
    return q;
  });

  const allocated = (this.questions || []).reduce((sum, q) => sum + (Number(q.marks) || 0), 0);
  if (allocated > this.totalMarks)
    return next(new Error(`Allocated ${allocated} > totalMarks ${this.totalMarks}`));

  next();
});

questionAnswerSchema.index({ title: 'text', isPublished: 1, availableFrom: 1, availableTill: 1 });

module.exports = model('AssignmentQuestions', questionAnswerSchema);
