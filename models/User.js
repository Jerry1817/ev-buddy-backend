const bcrypt=require('bcrypt')
const mongoose=require('mongoose')

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },

    email: {
      type: String,
      required: true,
      unique: true,
      // lowercase: true,
    },

    password: {
      type: String,
      required: true,
      // minlength: 6,
    },
    phone:{
      type:Number,
      unique:true,
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
    // required: true,
    default: "Point",
  },
  coordinates: {
    type: [Number], // [longitude, latitude]
    // required: true,
  },
},

    isHostActive: {
      type: Boolean,
      default: false,
    },
     evStation: {
      name: String,
      address: String,
      availableChargers: Number,
      chargingPricePerUnit:Number,
      power:Number,
      connectorType:String,
      description:String,
    },
    chargingPricePerUnit: Number,
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
module .exports=mongoose.model("User", userSchema);

