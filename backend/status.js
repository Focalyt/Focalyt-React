import mongoose from 'mongoose';
import Status from './controllers/models/status.js';

import dotenv from 'dotenv';
dotenv.config();

await mongoose.connect(process.env.MIPIE_MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true });
console.log("Connected to database");  

const defaultStatusId = new mongoose.Types.ObjectId('64ab1234abcd5678ef901234');
const defaultSubstatusId = new mongoose.Types.ObjectId('64ab1234abcd5678ef901235');

const defaultStatusData = {
  _id: defaultStatusId,
  title: 'Untouch Leads',
  description: 'Default status for Untouch Leads',
  milestone: '',
  index: 0,
  substatuses: [
    {
      _id: defaultSubstatusId,
      title: 'Untouch Leads',
      description: 'Default substatus for Untouch Leads',
      hasRemarks: false,
      hasFollowup: false,
      hasAttachment: false,
    },
  ],
};

async function seed() {
  try {
    const existing = await Status.findById(defaultStatusId);
    if (existing) {
      console.log('Default status already exists.');
      process.exit(0);
    }

    const status = new Status(defaultStatusData);
    await status.save();

    console.log('Default status with fixed ObjectId inserted successfully!');
    process.exit(0);
  } catch (err) {
    console.error('Error seeding default status:', err);
    process.exit(1);
  }
}


seed();  // seed function ko yahin call kar rahe hain

// Agar aap is file ko kisi aur module se import karna chahte ho toh export bhi kar sakte ho


