const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    googleId: { 
        type: String, 
        unique: true, 
        required: false // No longer required for Google users
    },
    name: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true,
        unique: true, 
    },
    image: {
        type: String
    },
    password: {
        type: String,
        validate: {
            validator: function(value) {
                // Password is required only if there is no googleId
                if (!this.googleId) {
                    return value && value.length >= 6; // Must be at least 6 characters
                }
                return true; // No validation needed if googleId is present
            },
            message: 'Password must be at least 6 characters long'
        }
    },
    type: {
        type: String,
        enum: ['USER', 'ADMIN'],
        default: 'USER'
    },
    phone_number: {
        type: String,
        required: function() { return !this.googleId; }, // Required only if googleId is not present
    },
    country_name: {
        type: String,
        required: function() { return !this.googleId; }, // Required only if googleId is not present
    },
    country_code: {
        type: String,
        required: function() { return !this.googleId; }, // Required only if googleId is not present
    },
    dial_code: {
        type: String,
        required: function() { return !this.googleId; }, // Required only if googleId is not present
    },
    about: {
        type: String,
        required: function() { return !this.googleId; }, // Required only if googleId is not present
    },
    profile_image : {
        type: String
    },
    emailNotifications: {
        type: Boolean,
        default: false, // Default value set to false
    },
    birthdayNotifications: {
        type: Boolean,
        default: false, // Default value set to false
    },
    profileUpdateNotifications: {
        type: Boolean,
        default: false, // Default value set to false
    },
    status: {
        type: String,
        enum: ['Active', 'Inactive'], // Enum for status
        default: 'Active' // Default status set to 'Active'
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});
UserSchema.index({ email: 1 });  // This ensures an index is created on the 'email' field in ascending order

const UserModel = mongoose.model('User', UserSchema);
module.exports = UserModel;
