const bcrypt = require("bcrypt");
const Doctor = require("../models/doctor");
const jwt = require("jsonwebtoken");
const {
  onboardSchema,
  loginSchema,
  patientSchema,
} = require("../utils/validators");
const createToken = require("../utils/createToken");
const Patient = require("../models/patient");
const Reminder = require("../models/reminder");
const saltRounds = 10;
const hashPassword = async (password) => {
  const salt = await bcrypt.genSalt(saltRounds);
  return await bcrypt.hash(password, salt);
};

const onboardDoctor = async (req, res) => {
  try {
    const { error } = onboardSchema.validate(req.body);
    if (error)
      return res.status(400).send({ message: error.details[0].message });

    const { password, token } = req.body;
    const { email, role } = jwt.verify(token, process.env.JWT_SECRET);

    if (role !== "doctor") {
      return res.status(400).send({ message: "Invalid token" });
    }
    const hashedPassword = await hashPassword(password);
    const doctor = new Doctor({
      email,
      password: hashedPassword,
      role,
    });
    await doctor.save();

    const message = {
      notification: {
        title: "New Doctor Onboarded",
        body: `Doctor ${email} has been onboarded successfully.`,
      },
    };

    await sendEmail(
      email,
      process.env.ADMIN_EMAIL,
      "New Doctor Onboarded",
      `Doctor ${email} has been onboarded successfully.`
    );

    return res.send({ message: "Doctor onboarded", success: true, doctor });
  } catch (error) {
    console.log("error", error);
    return res.status(500).send({ message: "Internal Server Error" });
  }
};

const doctorLogin = async (req, res) => {
  console.log("req", req.body);
  try {
    const { error } = loginSchema.validate(req.body);
    if (error)
      return res.status(400).send({ message: error.details[0].message });
    const { email, password } = req.body;
    const user = await Doctor.findOne({
      email,
      role: "doctor",
    }).select("+password");

    if (user && (await bcrypt.compare(password, user.password))) {
      const token = createToken({ email, id: user._id, role: "doctor" });
      // res.cookie("token", token);
      return res.send({ message: "Doctor signed in", token, success: true });
    } else {
      res.status(401).send({ message: "Invalid email or password" });
    }
  } catch (error) {
    console.log("error", error);
    return res.status(500).send({ message: "Internal Server Error" });
  }
};

const addPatients = async (req, res) => {
  try {
    const { id: doctorId, role } = req.user;
    const { name, age, prescription, title, description, date } = req.body;
    const { error } = patientSchema.validate(req.body);
    if (error)
      return res.status(400).send({ message: error.details[0].message });
    if (role === "doctor") {
      const newPatient = new Patient({ name, age, prescription, doctorId });
      const savedPatient = await newPatient.save();
      if (!savedPatient) {
        return res.status(500).send({ message: "Failed to add patient" });
      }

      const user = await Doctor.findById(doctorId);

      if (!user.fcmTokens || user.fcmTokens.length === 0) {
        return res
          .status(404)
          .send({ message: "No FCM tokens found for user" });
      }
      const reminder = new Reminder({
        title,
        description,
        date,
        doctorId,
        patientId: savedPatient._id,
      });
      await reminder.save();

      return res.send({ message: "Patient added", success: true });
    } else {
      return res.send({ message: "Login first", success: false });
    }
  } catch (error) {
    console.log(error);
    return res.status(500).send({ message: "Internal Server Error" });
  }
};

const removePatient = async (req, res) => {
  try {
    const { patientId } = req.body;

    const { id: doctorId, role } = req.user;

    if (role === "doctor") {
      const patient = await Patient.findByIdAndDelete({
        _id: patientId,
      });
      if (!patient) {
        return res.status(404).send({
          message:
            "Patient not found or you do not have permission to delete this patient",
          success: false,
        });
      }
      await Reminder.deleteMany({ patientId, doctorId });
      return res.send({
        message: "Patient removed successfully",
        success: true,
      });
    } else {
      return res.send({ message: "Login first", success: false });
    }
  } catch (error) {
    console.error("Error logging out user:", error);
    res.status(500).send({ message: "Error logging out user" });
  }
};

const getPatients = async (req, res) => {
  try {
    const { id, role } = req.user;
    if (role === "doctor") {
      const patient = await Patient.find({ doctorId: id });
      if (!patient) {
        return res.send({ message: "Patient not found", success: false });
      }
      const reminder = await Reminder.find({ doctorId: id });
      return res.send({ message: "Patient", success: true, patient, reminder });
    } else {
      return res.send({ message: "Login first", success: false });
    }
  } catch (error) {
    console.log(error);
    return res.status(500).send({ message: "Internal Server Error" });
  }
};

const patientUpdate = async (req, res) => {
  try {
    const doctorId = req.user.id;
    const { _id, name, age, prescription, title, description, date } = req.body;
    const patients = await Patient.findOneAndUpdate(
      { _id },
      { $set: { name, age, prescription } },
      { new: true }
    );

    const user = await Doctor.findById(doctorId);

    if (!user) {
      return res.status(404).send({ message: "Doctor not found" });
    }

    if (!user.fcmTokens || user.fcmTokens.length === 0) {
      return res.status(404).send({ message: "No FCM tokens found for user" });
    }

    const reminder = await Reminder.findOneAndUpdate(
      { doctorId },
      { $set: { title, description, date, isNotificationSent: false } },
      { new: true }
    );

    return res.send({
      message: "record update successfully",
      success: true,
    });
  } catch (error) {
    console.error("Error logging out user:", error);
    res.status(500).send({ message: "Error logging out user" });
  }
};

const saveFCMToken = async (req, res) => {
  try {
    const { token } = req.body;
    const userId = req.user.id;
    const user = await Doctor.findById(userId);

    if (!user) {
      return res.status(404).send({ message: "User not found" });
    }
    if (!user.fcmTokens.includes(token)) {
      user.fcmTokens.push(token);
    }
    await user.save();

    return res.status(200).send({ message: "Token saved successfully" });
  } catch (error) {
    console.error("Error saving token:", error);
    return res.status(500).send({ message: "Error saving token" });
  }
};

const setReminders = async (req, res) => {
  try {
    const doctorId = req.user.id;
    const user = await Doctor.findById(doctorId);

    if (!user) {
      return res.status(404).send({ message: "Doctor not found" });
    }

    if (!user.fcmTokens || user.fcmTokens.length === 0) {
      return res.status(404).send({ message: "No FCM tokens found for user" });
    }

    const { title, description, date, patientId } = req.body;

    const reminder = new Reminder({
      title,
      description,
      date,
      doctorId,
      patientId,
    });

    await reminder.save();

    const message = {
      title: "Patient",
      body: `Title: ${title}, Description: ${description}, Date: ${date}`,
    };

    const tokens = user.fcmTokens;

    return res.send({
      message: "Reminder set successfully",
      success: true,
      reminder,
    });
  } catch (error) {
    console.error("Error setting reminder:", error);
    return res.status(500).send({ message: "Internal Server Error" });
  }
};

const getReminders = async (req, res) => {
  try {
    const doctorId = req.user.id;
    const reminders = await Reminder.find({ doctorId });
    return res
      .status(200)
      .send({ message: "get Reminders", success: true, reminders });
  } catch (error) {
    console.error("Error setting reminder:", error);
    return res.status(500).send({ message: "Internal Server Error" });
  }
};

const logOutUser = async (req, res) => {
  try {
    const { fcmToken } = req.body;
    const userId = req.user.id;
    const user = await Doctor.findById(userId);
    if (!user) {
      return res.status(404).send("User not found");
    }
    user.fcmTokens = user.fcmTokens.filter((token) => token !== fcmToken);
    await user.save();
    res
      .status(200)
      .send({ message: "Logout successful and FCM token removed" });
  } catch (error) {
    console.error("Error logging out user:", error);
    res.status(500).send({ message: "Error logging out user" });
  }
};

module.exports = {
  doctorLogin,
  onboardDoctor,
  addPatients,
  getPatients,
  setReminders,
  saveFCMToken,
  logOutUser,
  removePatient,
  patientUpdate,
  getReminders,
  // sendReminderNotifications,
};
