const axios = require("axios");
const { oauth2Client } = require("./googleconfig");
const UserModel = require("../models/UserModel");
const jwt = require("jsonwebtoken");
const { sendToken } = require("./sendtoken");

/**
 * ✅ Global function to handle Google Authentication
 * @param {string} code - Authorization code received from frontend
 * @returns {Object} - { success, user, token, error }
 */
const authenticateWithGoogle = async (code) => {
    try {
        if (!code) {
            throw new Error("Authorization code is required");
        }

        // ✅ Exchange code for tokens
        const { tokens } = await oauth2Client.getToken(code);
        oauth2Client.setCredentials(tokens);

        // ✅ Fetch user info from Google
        const userRes = await axios.get(
            `https://www.googleapis.com/oauth2/v1/userinfo?alt=json&access_token=${tokens.access_token}`
        );

        const { id, email, name, picture} = userRes.data; // Extract Google user details

        // ✅ Check if user exists by Google ID
        let user = await UserModel.findOne({ googleId: id });

        if (user) {
            console.log("🟢 Existing User:", user.email);
        } else {
            console.log("🆕 Creating New User:", email);
            user = await UserModel.create({ googleId: id, name, email, image: picture });
        }

        // ✅ Generate JWT token
        /*const token = jwt.sign(
            { _id: user._id, googleId: user.googleId, email },process.env.JWT_SECRET,{ expiresIn: process.env.JWT_TIMEOUT || "12h" }
        );*/

        const token = sendToken(user);
        //console.log("I am Type " + user.type)
        let  objmaster ={
            type: user.type,
            email: user.email
        }
        return { success: true, objmaster, token };
    } catch (error) {
        console.error("❌ Google Authentication Error:", error.message);
        return { success: false, error: error.message };
    }
};


module.exports = { authenticateWithGoogle };
