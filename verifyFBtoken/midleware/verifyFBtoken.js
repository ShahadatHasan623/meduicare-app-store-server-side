// middlewares/verifyFBtoken.js
const admin = require("../midleware/firebaseAdmin");

const verifyFBtoken = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).send({ message: "unauthorized access" });
  }
  const token = authHeader.split(" ")[1];
  if (!token) {
    return res.status(401).send({ message: "unauthorized access" });
  }

  try {
    const decoded = await admin.auth().verifyIdToken(token);
    req.decoded = decoded;
    next();
  } catch (err) {
    console.error("Token Verification Error:", err);
    return res.status(403).send({ message: "forbidden access" });
  }
};

module.exports = verifyFBtoken;
