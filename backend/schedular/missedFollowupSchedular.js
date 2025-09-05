const cron = require("node-cron");
const b2cFollowup = require("../controllers/models/b2cFollowup");

function missedFollowupSchedular() {
    cron.schedule("* * * * *", async () => {
        try {
          console.log("[Cron] Checking missed followups...");
      
          const result = await b2cFollowup.updateMany(
            { 
              status: "pending", 
              followupDate: { $lt: new Date() }  // followup time already passed
            },
            { 
              $set: { status: "missed", statusUpdatedAt: new Date() } 
            }
          );
      
          if (result.modifiedCount > 0) {
            console.log(`[Cron] Marked ${result.modifiedCount} followups as missed`);
          }
        } catch (err) {
          console.error("[Cron] Error updating missed followups:", err);
        }
      }, { timezone: "Asia/Kolkata" });
}

module.exports = missedFollowupSchedular;