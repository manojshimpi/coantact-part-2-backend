const express = require("express");
const isAuthenticated = require("../middleware/verifytoken");
const { assignContactsToGroup, getContactAssignmentsGroupWise, getContactAssignmentsUserWise, getAssignedContactsForGroupByUser, deleteAssignedContactForGroupByUser } = require("../controllers/contactGroupAssignController");
const contactAssignGroupRouter = express.Router();

contactAssignGroupRouter.post("/assignContactsingleToGroup", isAuthenticated, assignContactsToGroup);
//contactAssignGroupRouter.post("/assignMultipleconatctsToGroup", isAuthenticated, assignMultipleContacts);


//contactAssignGroupRouter.get('/group-wise', isAuthenticated, getContactAssignmentsGroupWise);

// Fetch user-wise contact assignments used for Groups List component
contactAssignGroupRouter.get('/UserwiseAssignedContact', isAuthenticated, getContactAssignmentsUserWise);

// Fetch assigned contacts for a specific group and user
contactAssignGroupRouter.get('/:groupId', isAuthenticated , getAssignedContactsForGroupByUser);

// Delete assigned contact for a specific group and user
contactAssignGroupRouter.delete('/:contactassignedid', isAuthenticated , deleteAssignedContactForGroupByUser); // http://localhost:5000/assigncontactgroup/67e00b57f956e293281c013e

module.exports = contactAssignGroupRouter;