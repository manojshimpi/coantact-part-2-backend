
const jwt = require("jsonwebtoken");

const sendToken = (user) => {
    const token = jwt.sign({ _id: user._id }, process.env.JWT_SECRET, { expiresIn: "5h" });
    return token;
   /* res.status(statusCode).json({
      success: true,
      token,
      message,
    });*/
  };


  module.exports = { sendToken };