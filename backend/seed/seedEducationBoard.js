const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const {
    
    env,
    mongodbUri,
    
    
} = require("../config");
const EducationBoard = require('../controllers/models/educationBoard'); // adjust path if needed

const data = JSON.parse(
  fs.readFileSync(path.join(__dirname, 'educationBoards.json'), 'utf-8')
);

mongoose.connect(mongodbUri, {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

const seed = async () => {
  try {
    await EducationBoard.deleteMany({});
    await EducationBoard.insertMany(data);
    console.log('✅ Education Boards seeded successfully!');
  } catch (err) {
    console.error('❌ Error seeding education boards:', err);
  } finally {
    mongoose.disconnect();
  }
};

seed();
