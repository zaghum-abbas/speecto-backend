const admin = require("firebase-admin");
const firebaseConfig = require("./serviceAccountKey");


admin.initializeApp({
  credential: admin.credential.cert(firebaseConfig),
});

module.exports = { admin };
