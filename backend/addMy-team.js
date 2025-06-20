const mongoose = require('mongoose');
const User = require('./controllers/models/users');
require('dotenv').config();

async function addMyTeam() {
  try {
    await mongoose.connect(process.env.MIPIE_MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("✅ Connected to database");

    const users = await User.find({});
    
    for (const user of users) {
      const reportingManagers = user.reporting_managers || [];

      for (const managerId of reportingManagers) {
        const managerUser = await User.findById(managerId);

        if (managerUser) {
          const alreadyAdded = managerUser.my_team.includes(user._id);
          if (!alreadyAdded) {
            managerUser.my_team.push(user._id);
            await managerUser.save();

            console.log(`👥 User '${user.name}' (ID: ${user._id}) added to manager '${managerUser.name}' (ID: ${managerUser._id})`);
          } else {
            console.log(`🔁 User '${user.name}' (ID: ${user._id}) is already in '${managerUser.name}' (ID: ${managerUser._id})'s my_team`);
          }
        } else {
          console.log(`⚠️ Manager with ID ${managerId} not found for user '${user.name}' (ID: ${user._id})`);
        }
      }
    }

    console.log("🎯 All my_team updates completed.");
  } catch (error) {
    console.error("❌ Migration Error:", error);
  } finally {
    await mongoose.disconnect();
    console.log("🔌 Disconnected from database");
  }
}

addMyTeam();
