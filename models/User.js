const bcrypt = require("bcrypt");
const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    profileImage: {
      type: String,
      default: "",
    },

    email: {
      type: String,
      required: true,
      unique: true,
    },

    password: {
      type: String,
      required: true,
      select: false,

      // minlength: 6,
    },
    phone: {
      type: String,
      unique: true,
    },

    roles: {
      type: String,
      enum: ["DRIVER", "HOST"],
      default: "DRIVER",
    },

  location: {
  type: {
    type: String,
    enum: ["Point"],
  },
  coordinates: {
    type: [Number], // [lng, lat]
    validate: {
      validator: function (v) {
        return !v || v.length === 2;
      },
      message: "Location coordinates must be [lng, lat]",
    },
  },
},


    isHostActive: {
      type: Boolean,
      default: false,
    },
    averageRating: {
      type: Number,
      default: 0,
    },

    reviewCount: {
      type: Number,
      default: 0,
    },

    evModel: {
      type: String,
    },
    otp: {
      type: String,
    },
    otpExpires: {
      type: Date,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },

    isBlocked: {
      type: Boolean,
      default: false,
    },

    evStation: {
      name: String,
      address: String,
      availableChargers: Number,
      chargingPricePerUnit: Number,
      power: Number,
      connectorType: String,
      description: String,
    },
  },
  { timestamps: true }
);

userSchema.pre("save", async function () {
  if (!this.isModified("password")) return;
  this.password = await bcrypt.hash(this.password, 10);
});

userSchema.methods.comparePassword = function (password) {
  return bcrypt.compare(password, this.password);
};

userSchema.index({ location: "2dsphere" });
module.exports = mongoose.model("User", userSchema);
