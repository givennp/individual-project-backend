const jwt = require("jsonwebtoken");

const JWT_SECRET = process.env.JWT_SECRET_KEY;

const generateToken = (payload) => {
  const token = jwt.sign(payload, JWT_SECRET, {
    expiresIn: "2d",
  });

  return token;
};

const verifyToken = (token) => {
  const isVerified = jwt.verify(token, JWT_SECRET);

  return isVerified;
};

module.exports = {
  generateToken,
  verifyToken,
};
