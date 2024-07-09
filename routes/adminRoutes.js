const express = require("express");
const router = express.Router();
const { adminLogin, adminRegister ,inviteDoctor,getAllDoctors} = require("../controllers/adminController");
const {authMiddleware} = require('../middlewares/authMiddleware');

router.post("/signup", adminRegister);
router.post("/login", adminLogin);
router.post('/invite', authMiddleware, inviteDoctor);
router.get("/doctors", authMiddleware, getAllDoctors);

module.exports = router;
