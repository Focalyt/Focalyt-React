const cron = require("node-cron");
const b2cFollowup = require("../controllers/models/b2cFollowup");


function missedFollowupSchedular() {
  cron.schedule("* * * * *", async () => {
    try {

      // console.log('checking missed followups')

      const followups = await b2cFollowup.find({
        status: "planned",
        followupDate: { $lt: new Date() }
      });

      
      
      if (followups.length > 0) {
        const ids = followups.map(f => f.createdBy.toString());
        // console.log(ids, 'ids');
      
        const result = await b2cFollowup.updateMany(
          { status: "planned", followupDate: { $lt: new Date() } },
          { $set: { status: "missed", statusUpdatedAt: new Date() } }
        );
      
        // console.log(`[Cron] Marked ${ids.length} followups as missed`);

        console.log(global.userSockets, "global.userSockets");
        // Emit socket for each followup (example)
        ids.forEach(id => {
          const socketIds = global.userSockets[id] || [];
          socketIds.forEach(socketId => {
            global.io.to(socketId).emit("missedFollowup", { followupId: id });
          });
        });
      }
      
    } catch (err) {
      console.error("[Cron] Error updating missed followups:", err);
    }
  }, { timezone: "Asia/Kolkata" });
}

module.exports = missedFollowupSchedular;