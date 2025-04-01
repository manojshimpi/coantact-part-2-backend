const mongoose = require("mongoose");

const GroupSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    status: {
        type: String,
        enum: ["Active", "Inactive"],
        default: "Active"
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",  // Reference to the "User" model
        required: true
    }
});

const Group = mongoose.model("Group", GroupSchema);
module.exports = Group;
