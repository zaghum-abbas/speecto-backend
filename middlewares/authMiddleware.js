const jwt = require("jsonwebtoken");

const authMiddleware = (req, res, next) => {

  const token = req.headers["authorizationh"];
  if (!token) {
    return res.status(401).send({ message: "Unauthorized" });
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    req.user = decoded;
    next();
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return res.status(401).send({ message: "TokenExpired", error });
    }

    return res.status(401).send({ message: "Unauthorized", error });
  }
};

module.exports = {
  authMiddleware,
};
