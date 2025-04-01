const { google } = require("googleapis");

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;

if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
    console.error("❌ Missing Google OAuth credentials in .env file");
    process.exit(1);
}

exports.oauth2Client = new google.auth.OAuth2(
    GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET,
    "postmessage" // ✅ Ensure this matches frontend configuration
);
