const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    await mongoose.connect("mongodb://127.0.0.1:27017/evbuddy");
    console.log("MongoDB Connected Successfully");
  } catch (err) {
    console.error("MongoDB connection error ❌");
    console.error(err.message);
    process.exit(1);
  }
};

module.exports = connectDB;
