const mongoose = require("mongoose");

const adminsSchema = new mongoose.Schema(
  {
    name: { type: String },
    // phone: {
    //   type: String,
    //   required: true,
    //   match: [
    //     /^(\+91[\-\s]?)?[0]?(91)?[6789]\d{9}$/,
    //     "Please fill valid indian phone number",
    //   ],
    //   trim: true,
    // },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      unique: true,
      match: [
        /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
        "Please fill a valid email address",
      ],
    },
    password: { type: String, required: true, min: 8, max: 15 },
    role: {
      type: String,
      required: true,
      lowercase: true,
      enum: ["primary", "secondary", "read-only"],
    },
  },
  { versionKey: false, timestamps: true }
);

module.exports = mongoose.model("Admin", adminsSchema);
