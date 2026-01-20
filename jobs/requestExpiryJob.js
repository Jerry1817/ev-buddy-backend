const cron = require("node-cron");
const ChargingRequest = require("../models/ChargingRequest");

/**
 * Auto-expire charging requests that haven't been responded to within 10 minutes.
 * Runs every minute to check for stale requests.
 */
const startRequestExpiryJob = () => {
  // Run every minute
  cron.schedule("* * * * *", async () => {
    try {
      const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);

      // Find and update all REQUESTED status requests older than 10 minutes
      const result = await ChargingRequest.updateMany(
        {
          status: "REQUESTED",
          requestedAt: { $lt: tenMinutesAgo },
        },
        {
          $set: { status: "EXPIRED" },
        }
      );

      if (result.modifiedCount > 0) {
        console.log(
          `⏱️ Auto-expired ${result.modifiedCount} stale charging request(s)`
        );
      }
    } catch (error) {
      console.error(" Error in request expiry job:", error);
    }
  });

  console.log(" Request auto-expiry scheduler started (10 min timeout)");
};

module.exports = { startRequestExpiryJob };
