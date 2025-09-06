const beautifyUnique = require('mongoose-beautiful-unique-validation');
const { Schema, model } = require('mongoose');

const sourceSchema = new Schema({
    name: {
        type: String, required: true, trim: true,
      },
      mobile: {
        type: Number,
      },
  status: {
    type: Boolean,
    default: true,
  },
  
}, { timestamps: true });



module.exports = model('Source', sourceSchema);
