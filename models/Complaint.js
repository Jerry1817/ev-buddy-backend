const mongoose = require("mongoose");

const complaintSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    category: {
      type: String,
      required: true,
       enum: [
    "CHARGING",
    "PAYMENT",
    "HOSTBEHAVIOR",
    "STATION",
    "OTHER",
  ],
    },

    subject: {
      type: String,
      required: true,
    },

    description: {
      type: String,
      required: true,
    },

    priority: {
      type: String,
      enum: ["LOW", "MEDIUM", "HIGH"],
      default: "MEDIUM",
    },
    
    images: [
      {
        type: String, // Cloudinary / local path
      },
    ],

    status: {
      type: String,
      enum: ["OPEN", "IN_PROGRESS", "RESOLVED"],
      default: "OPEN",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Complaint", complaintSchema);
