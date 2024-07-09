const express = require("express");
const router = express.Router();
const {
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
} = require("../controllers/doctorController");
const { authMiddleware } = require("../middlewares/authMiddleware");

router.post("/login", doctorLogin);
router.post("/onboard", onboardDoctor);
router.post("/add-patient", authMiddleware, addPatients);
router.get("/patients", authMiddleware, getPatients);
router.post("/set-reminder", authMiddleware, setReminders);
router.get("/get-reminder", authMiddleware, getReminders);
router.post("/save-fcm-token", authMiddleware, saveFCMToken);
router.post("/remove-patient", authMiddleware, removePatient);
router.post("/update-patient", authMiddleware, patientUpdate);
router.post("/logout", authMiddleware, logOutUser);


module.exports = router;
