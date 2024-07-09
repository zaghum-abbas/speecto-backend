require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const adminRoutes = require("./routes/adminRoutes");
const doctorRoutes = require("./routes/doctorRoutes");
const cron = require("node-cron");
const sendNotification = require("./services/notificationService");

const app = express();

mongoose.connect(process.env.MONGODB_URI);

app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  })
);
cron.schedule("* * * * *", () => {
  sendNotification()
});
app.use(express.json());
app.use(cookieParser());

app.use("/admin", adminRoutes);
app.use("/doctor", doctorRoutes);

// setInterval(sendReminderNotifications, 60000);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
