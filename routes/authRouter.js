const express = require("express");
const { googleLogin, userinfo, registerUser, registerNormalUser, loginUserNormal, updateUserProfile, updateUserNotificationSettings, updatePasswordNewPassword } = require("../controllers/authControllers");
const isAuthenticated = require("../middleware/verifytoken");
const UserModel = require("../models/UserModel");
const upload = require("../utils/multer");
const { auth } = require("googleapis/build/src/apis/abusiveexperiencereport");

const authRouter = express.Router();

authRouter.get("/test", (req, res) => {
    res.json({ message: "Hello World1" });
});

authRouter.post("/google", googleLogin);

authRouter.post("/normallogin", loginUserNormal);

authRouter.put("/updateprofile", isAuthenticated, upload.single('file'), updateUserProfile);

authRouter.post("/registernormal", registerNormalUser);

authRouter.get("/user", isAuthenticated, userinfo);

authRouter.put("/emailnotification", isAuthenticated ,updateUserNotificationSettings);

authRouter.put("/updatenewpassword", isAuthenticated ,updatePasswordNewPassword);

authRouter.put('/fileuplaod', isAuthenticated, upload.single('file'), async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ message: 'No file uploaded' });
    }

    const fileUrl = `/uploads/${req.file.filename}`;

    try {
        await UserModel.findByIdAndUpdate(req.user._id, { profile_image: fileUrl });
        res.status(200).json({ message: 'File uploaded successfully', fileUrl });
    } catch (error) {
        res.status(500).json({ message: 'Failed to update profile image', error });
    }
});

module.exports = authRouter;
