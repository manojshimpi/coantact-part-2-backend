const mongoose = require("mongoose");

const UserContactSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    /*email: {
        type: String,
        required: true
    },*/
    email:{
        type: String,
        required: false, // Set to false to make it optional
        lowercase: true,
        trim: true
    },
    mobile: {
        type: String,
        required: true
    },
   countryName: {
        type: String,
        required: true
    },
    countryCode: {
        type: String,
        required: true
    },
    dialCode: {
        type: String,
        required: true
    },
    category: {
        type: String,
        required: true
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    status: {
        type: String,
        enum: ["Active", "Inactive"],
        default: "Active"
    },
    isFavorite: {
        type: String,
        enum: ["YES", "NO"],
        default: "NO"
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

const UserContact = mongoose.model("UserContact", UserContactSchema);
module.exports = UserContact;
