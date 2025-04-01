const mongoose = require('mongoose');
const ContactAssignGroups = require('../models/ContactAssignGroup');
const Group = require('../models/Group');
const UserContact = require('../models/UserContact');
const { Console } = require('winston/lib/winston/transports');


// Assign contacts (single or multiple) to a group
//Contacts List To Assign To Group used
const assignContactsToGroup = async (req, res) => {
  const { contactIds, groupId } = req.body;
  const addedBy = req.user._id; // Assuming `req.user` contains the logged-in user's information

  try {
    // Validate group existence
    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({ message: 'Group not found' });
    }

    // Convert single contactId to an array for uniformity
    const contacts = Array.isArray(contactIds) ? contactIds : [contactIds];
    
    // Create a list to hold the assignments
    const assignments = [];
    const existingAssignments = await ContactAssignGroups.find({
      contact_id: { $in: contacts },
      group_id: groupId
    });

    // Create a set of already assigned contacts for faster lookup
    const alreadyAssigned = new Set(existingAssignments.map(assign => assign.contact_id.toString()));

    // Create an array to store contacts that are already assigned to the group
    const duplicateContacts = [];

    for (let contactId of contacts) {
      if (alreadyAssigned.has(contactId.toString())) {
        duplicateContacts.push(contactId);  // Add duplicate contact to the array
        continue;  // Skip if the contact is already assigned to this group
      }

      // Validate contact existence
      const contact = await UserContact.findById(contactId);
      if (!contact) {
        continue;  // Skip if the contact is not found
      }

      // Create a new assignment
      const newAssignment = new ContactAssignGroups({
        contact_id: contactId,
        group_id: groupId,
        added_by: addedBy,  // Add the user who added the contact
      });

      // Save the assignment
      assignments.push(newAssignment.save());
      alreadyAssigned.add(contactId.toString());  // Add the contact to the alreadyAssigned set
    }

    // Wait for all assignments to be saved
    await Promise.all(assignments);

    // If there are duplicate contacts, return an error message
    if (duplicateContacts.length > 0) {
      return res.status(400).json({
        message: 'Some contacts are already assigned to this group.',
        duplicates: duplicateContacts
      });
    }

    return res.status(200).json({ message: 'Contacts assigned to group successfully' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server Error' });
  }
};


// Fetch Conatcts assigned to a group
// Not used as of now
// Controller to fetch the number of contacts added to each group
const getContactAssignmentsGroupWise = async (req, res) => {
  try {
    // Aggregate contact assignments grouped by group_id
    const groupAssignments = await ContactAssignGroups.aggregate([
      {
        $group: {
          _id: '$group_id',
          totalContacts: { $sum: 1 }  // Count total contacts per group
        }
      },
      {
        $lookup: {
          from: 'groups',  // 'groups' is the name of the collection for groups
          localField: '_id',
          foreignField: '_id',
          as: 'groupInfo'
        }
      },
      {
        $unwind: '$groupInfo'
      },
      {
        $project: {
          groupId: '$_id',
          groupName: '$groupInfo.name',  // Assuming 'name' is the name of the group
          totalContacts: 1
        }
      }
    ]);

    // Return the aggregated data of contacts per group
    return res.status(200).json({
      message: 'Group-wise contact assignment data fetched successfully',
      groupAssignments
    });

  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
};


// Done Working 
const getContactAssignmentsUserWise = async (req, res) => {

  try {
    const userId = req.user._id;

    // Extract query parameters for pagination and filtering
    const { page = 1, limit = 25, group_name, sortBy = 'groupName', sortOrder = 'asc' } = req.query;
    const pageNum = parseInt(page, 10);
    const skip = (pageNum - 1) * limit;

    // Determine the sort direction: 1 for ascending, -1 for descending
    const sortDirection = sortOrder === 'desc' ? -1 : 1;

    // Aggregation pipeline for getting user assignments with pagination and filters
    const userAssignments = await ContactAssignGroups.aggregate([
      {
        $match: {
          added_by: new mongoose.Types.ObjectId(userId),
        }
      },
      {
        $lookup: {
          from: "groups",  // Assuming the groups collection is named "groups"
          localField: "group_id",  // Matching the group_id
          foreignField: "_id",
          as: "group"
        }
      },
      { $unwind: "$group" }, // Unwind group array for easy access

      // If group_name is provided, filter by group name
      ...(group_name ? [
        {
          $match: {
            "group.name": { $regex: new RegExp(group_name, 'i') }  // Case-insensitive search for group name
          }
        }
      ] : []),

      // Group by group name
      {
        $group: {
          _id: "$group.name",  // Group by group name
          totalContacts: { $sum: 1 },  // Count number of contacts per group
          groupDetails: { $first: "$group" },  // Get first group details for reference
        }
      },

      // Sorting by group name
      { $sort: { '_id': sortDirection } },  // Sort by the group name (which is now the _id)

      { $skip: skip }, // Skip for pagination
      { $limit: parseInt(limit) }, // Limit for pagination
    ]);

    // Get the total number of assignments for pagination (without limit)
    const totalAssignments = await ContactAssignGroups.countDocuments({ added_by: new mongoose.Types.ObjectId(userId) });

    // Calculate total number of pages for pagination
    const totalPages = Math.ceil(totalAssignments / limit);

    // Update pagination to match the desired response structure
    const pagination = {
      currentPage: pageNum,
      totalPages: totalAssignments > 0 ? totalPages : 1,  // Ensure totalPages is at least 1 if there are assignments
      totalContacts: userAssignments.length, // Set to the actual number of assignments in the response
      limit: parseInt(limit),
    };

    return res.status(200).json({
      message: "User-wise contact assignment data fetched successfully",
      userAssignments,
      pagination,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
};



// Controller to fetch the contacts assigned by a user to a group
// Contact details used
const getAssignedContactsForGroupByUser = async (req, res) => {
  //console.log(" I am getAssignedContactsForGroupByUser");
  const { groupId } = req.params;
  const userId = req.user._id;

  try {
    // Fetch all the assignments for a particular user and group
    const assignments = await ContactAssignGroups.find({
      group_id: groupId,
      added_by: userId
    }).populate('contact_id');  // Populate contact details (optional)

    // If no assignments found, return a message indicating no contacts assigned
    if (assignments.length === 0) {
      return res.status(404).json({ message: 'No contacts assigned to this group by the user' });
    }

    // Map to extract contact details and _id of the assignment itself
    const contacts = assignments.map(assign => ({
      _id: assign._id,  // Return the _id of the assignment
      contact: assign.contact_id  // Return the populated contact details
    })); 

    return res.status(200).json({
      message: 'Assigned contacts fetched successfully',
      contacts
    });

  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
};


// Delete an assigned contact from a group
const deleteAssignedContactForGroupByUser = async (req, res) => {
  console.log(" I am deleteAssignedContactForGroupByUser");

  const { contactassignedid } = req.params;  // The assignment _id passed in the request params
  const userId = req.user._id;

  try {
    // Find the assignment by _id and verify the user is the one who added it
    const assignment = await ContactAssignGroups.findOne({
      _id: contactassignedid,
      added_by: userId
    });

    if (!assignment) {
      return res.status(404).json({ message: 'Assignment not found or not authorized to delete' });
    }

    // Delete the contact assignment
    await ContactAssignGroups.deleteOne({ _id: contactassignedid });

    return res.status(200).json({
      message: 'Remove contact from group successfully'
    });

  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  assignContactsToGroup,
  getContactAssignmentsGroupWise,
  getContactAssignmentsUserWise,
  getAssignedContactsForGroupByUser,
  deleteAssignedContactForGroupByUser
};

