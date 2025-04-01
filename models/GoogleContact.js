const mongoose = require('mongoose');

// Define the Contact schema
const contactSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  emails: {
    type: [String],  // Array of strings for emails
    default: [],
  },
  mobile: {
    type: [String],  // Array of strings for phone numbers
    default: [],
  },
}, { timestamps: true });  // Timestamps for createdAt and updatedAt

// Create and export the Contact model
const GoogleContact = mongoose.model('GoogleContact', contactSchema);

module.exports = GoogleContact;
