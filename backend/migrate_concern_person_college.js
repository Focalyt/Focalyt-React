const mongoose = require('mongoose');
const dotenv = require("dotenv");
dotenv.config();

const College = require('./controllers/models/college'); // model ka path adjust karein

async function migrateConcernPerson() {
  try {
    await mongoose.connect(process.env.MIPIE_MONGODB_URI);
    console.log("Connected to database");

    const colleges = await College.find({});
    console.log(`Total colleges found: ${colleges.length}`);

    let updatedCount = 0;
    let skippedCount = 0;

    for (const college of colleges) {
      // Print karo college _id aur _concernPerson ka pehla element aur uska type
      const firstConcern = college._concernPerson && college._concernPerson.length > 0 ? college._concernPerson[0] : undefined;
      console.log(`College ${college._id} _concernPerson first element:`, firstConcern, typeof firstConcern);

      // Migration check
      let changed = false;

      if (Array.isArray(college._concernPerson) && college._concernPerson.length > 0) {
        // Agar pehla element ObjectId (ya bson ObjectID) hai, to migrate karo
        if (firstConcern && (firstConcern._bsontype === 'ObjectID' || firstConcern instanceof mongoose.Types.ObjectId)) {
          const length = college._concernPerson.length;
          college._concernPerson = college._concernPerson.map((objId, idx) => ({
            id: objId,
            defaultAdmin: length === 1 ? true : (idx === 0)
          }));
          changed = true;
          console.log(`Migrating college _id: ${college._id}, _concernPerson converted.`);
        } else {
          console.log(`Skipping college _id: ${college._id}, already migrated or _concernPerson not ObjectId.`);
          skippedCount++;
        }
      } else {
        console.log(`Skipping college _id: ${college._id}, _concernPerson empty or not array.`);
        skippedCount++;
      }

      if (changed) {
        await college.save();
        updatedCount++;
        console.log(`Saved migrated college: ${college._id}`);
      }
    }

    console.log(`Migration completed. Total updated: ${updatedCount}, Total skipped: ${skippedCount}`);
    await mongoose.disconnect();
    console.log("Disconnected from database");
  } catch (err) {
    console.error('Migration error:', err);
    await mongoose.disconnect();
    console.log("Disconnected from database after error");
  }
}

migrateConcernPerson();
