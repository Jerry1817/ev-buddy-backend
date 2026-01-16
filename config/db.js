const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    await mongoose.connect("mongodb+srv://xdeveloper:Obn7QIWs0pky6xcH@cluster0.bsugwkf.mongodb.net");
    console.log("MongoDB Connected Successfully");
  } catch (err) {
    console.error("MongoDB connection error ❌");
    console.error(err.message);
    process.exit(1);
  }
};

module.exports = connectDB;
