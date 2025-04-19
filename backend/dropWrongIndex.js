const mongoose = require("mongoose");
require("dotenv").config();

async function dropIndex() {
  try {
    await mongoose.connect(process.env.MIPIE_MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });

    console.log("✅ Connected to MongoDB");

    const collection = mongoose.connection.db.collection("candidateprofiles");

    const indexes = await collection.indexes();
    const hasWrongIndex = indexes.find(index => index.name === "personalInfo.mobile_1");

    if (hasWrongIndex) {
      await collection.dropIndex("personalInfo.mobile_1");
      console.log("🧹 Dropped wrong index: personalInfo.mobile_1");
    } else {
      console.log("✅ No wrong index found.");
    }

    await mongoose.disconnect();
  } catch (err) {
    console.error("❌ Error:", err.message);
  }
}

dropIndex();
