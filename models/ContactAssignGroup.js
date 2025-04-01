const mongoose = require('mongoose');

// Create ContactGroupAssignment Schema
const ContactAssignGroupSchema = new mongoose.Schema({
  contact_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'UserContact',
    required: true
  },
  group_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Group',
    required: true
  },
  assigned_at: {
    type: Date,
    default: Date.now
  },
  // Added field to track who added the contact
  added_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User', // Assuming User model exists
    required: true
  },
  // You can add other fields if necessary
  status: {
    type: String,
    enum: ['active', 'inactive'],
    default: 'active'
  }
});

const ContactAssignGroups = mongoose.model('ContactAssignGroup', ContactAssignGroupSchema);

module.exports = ContactAssignGroups;
