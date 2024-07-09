const bcrypt = require("bcrypt");
const Admin = require("../models/admin");
const Doctor = require("../models/doctor");
const { loginSchema, inviteSchema } = require("../utils/validators");
const createToken = require("../utils/createToken");
const sendEmail = require("../services/emailService");
const saltRounds = 10;

const hashPassword = async (password) => {
  const salt = await bcrypt.genSalt(saltRounds);
  return await bcrypt.hash(password, salt);
};

const adminRegister = async (req, res) => {
  try {
    const { email, password } = req.body;
    const hashedPassword = await hashPassword(password);
    const existingDoctor = await Admin.findOne({ email });
    if (existingDoctor) {
      return res
        .status(400)
        .send({ message: "Doctor already exists", success: true });
    }

    const newUser = new Admin({
      email,
      password: hashedPassword,
    });
    await newUser.save();
    return res
      .status(201)
      .send({ message: "Doctor registered successfully", newUser });
  } catch (error) {
    console.error("Error in adminRegister:", error);
    return res.status(500).send({ error: "Internal Server Error" });
  }
};

const adminLogin = async (req, res) => {
  try {
    const { error } = loginSchema.validate(req.body);
    if (error)
      return res.status(400).send({ message: error.details[0].message });

    const { email, password } = req.body;
    const user = await Admin.findOne({ email }).select("+password");
    console.log("user", user);
    if (user && (await bcrypt.compare(password, user.password))) {
      const token = createToken({ email, role: "admin" });
      res.cookie("token", token);
      res.send({ message: "Admin signed in", user });
    } else {
      res.status(401).send({ message: "Invalid email or password" });
    }
  } catch (error) {
    res.status(500).send({ message: "Internal Server Error" });
  }
};

const inviteDoctor = async (req, res) => {
  try {
    const { email } = req.body;
    const { error } = inviteSchema.validate(req.body);
    if (error)
      return res.status(400).send({ message: error.details[0].message });
    const existingDoctor = await Doctor.findOne({ email });
    if (existingDoctor) {
      return res.send({ message: "Doctor Already exist", success: false });
    } else {
      const token = createToken({ email, role: "doctor" });
      const inviteLink = `http://localhost:3000/onboard?token=${token}`;
      await sendEmail(
        "Medistan",
        email,
        "Doctor Invitation",
        `Please onboard using this link: ${inviteLink}`
      );
      return res.send({ message: "Invitation sent", success: true });
    }
  } catch (error) {
    console.log(error);
    return res.status(500).send({ message: "Internal Server Error" });
  }
};

const getAllDoctors = async (req, res) => {
  try {
    const doctors = await Doctor.find({ role: "doctor" }).select("-password");
    return res.send({ message: "Doctors retrieved successfully", doctors });
  } catch (error) {
    console.error("Error in getAllDoctors:", error);
    return res.status(500).send({ message: "Internal Server Error" });
  }
};
module.exports = {
  adminLogin,
  inviteDoctor,
  adminRegister,
  getAllDoctors,
};
