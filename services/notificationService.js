const { admin } = require("../config/firebase");
const Reminder = require("../models/reminder");

const sendNotification = async () => {
  try {
    const reminders = await Reminder.find({
      isNotificationSent: false,
      date: { $lte: new Date() },
    }).populate("doctorId");

    for (let reminder of reminders) {
      if (reminder.doctorId && reminder.doctorId.fcmTokens) {
        const notification = {
          title: reminder.title,
          body: reminder.description,
        };

        for (let token of reminder.doctorId.fcmTokens) {
          try {
            await admin.messaging().send({
              token: token,
              notification: {
                title: notification.title,
                body: notification.body,
              },
            });
            console.log("FCM message sent");
          } catch (error) {
            console.error("Error sending message:", error);
          }
        }
        reminder.isNotificationSent = true;
        await reminder.save();
      }
    }
  } catch (error) {
    console.error("Error sending message:", error);
    if (error.code === "messaging/registration-token-not-registered") {
      await handleInvalidToken(token);
    }
    throw error;
  }
};
const handleInvalidToken = async (token) => {
  try {
    await doctor.updateMany(
      { fcmTokens: token },
      { $pull: { fcmTokens: token } }
    );
    console.log(`Invalid token ${token} removed from database`);
  } catch (error) {
    console.error(`Failed to remove invalid token ${token}:`, error);
  }
};

module.exports = sendNotification;

module.exports = sendNotification;
