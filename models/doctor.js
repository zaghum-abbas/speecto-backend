const mongoose = require("mongoose");

const doctorSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true, select: false },
  role: { type: String, default: 'doctor' },
  fcmTokens: [String]
});

module.exports = mongoose.model("Doctor", doctorSchema);