const cron = require("node-cron");
const mongoose = require("mongoose");
const ChargingRequest = require("../models/ChargingRequest");

/**
 * Auto-expire charging requests that haven't been responded to within 10 minutes.
 * Runs every minute to check for stale requests.
 */
const startRequestExpiryJob = () => {
  // Run every minute
  cron.schedule("* * * * *", async () => {
    try {
      // Check if MongoDB is connected before running the query
      if (mongoose.connection.readyState !== 1) {
        console.warn(" Request expiry job skipped - MongoDB not connected (state:", mongoose.connection.readyState, ")");
        return;
      }

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
      // Handle network errors gracefully - don't crash, just log and skip this run
      if (error.name === "MongoNetworkError" || error.code === "ECONNRESET") {
        console.warn(" Request expiry job skipped due to network issue. Will retry next run.");
      } else {
        console.error(" Error in request expiry job:", error.message);
      }
    }
  });

  console.log("⏱️ Request auto-expiry scheduler started (10 min timeout)");
};

module.exports = { startRequestExpiryJob };
