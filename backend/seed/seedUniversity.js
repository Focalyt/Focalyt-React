const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const {
    
    env,
    mongodbUri,
    
    
} = require("../config");
const University = require('../controllers/models/universities'); // adjust path if needed

const data = JSON.parse(
  fs.readFileSync(path.join(__dirname, 'universities.json'), 'utf-8')
);

mongoose.connect(mongodbUri, {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

const seed = async () => {
  try {
    await University.deleteMany({});
    await University.insertMany(data);
    console.log('✅ University seeded successfully!');
  } catch (err) {
    console.error('❌ Error seeding university:', err);
  } finally {
    mongoose.disconnect();
  }
};

seed();
