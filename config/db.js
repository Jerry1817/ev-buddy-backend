const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    await mongoose.connect("mongodb+srv://xdeveloper:Obn7QIWs0pky6xcH@cluster0.bsugwkf.mongodb.net", {
      // Connection pool settings
      maxPoolSize: 10,
      minPoolSize: 2,
      // Timeouts to handle network issues
      serverSelectionTimeoutMS: 30000, // 30 seconds to find a server
      socketTimeoutMS: 45000, // 45 seconds for socket operations
      // Heartbeat to detect connection issues early
      heartbeatFrequencyMS: 10000, // Check connection every 10 seconds
    });
    console.log("MongoDB Connected Successfully");
    
    // Handle connection events
    mongoose.connection.on("disconnected", () => {
      console.warn(" MongoDB disconnected. Attempting to reconnect...");
    });

    mongoose.connection.on("reconnected", () => {
      console.log(" MongoDB reconnected successfully");
    });

    mongoose.connection.on("error", (err) => {
      console.error(" MongoDB connection error:", err.message);
    });

  } catch (err) {
    console.error("MongoDB connection error ");
    console.error(err.message);
    process.exit(1);
  }
};

module.exports = connectDB;
