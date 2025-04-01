const express = require("express");
const { getAllUsers, getAllUserContacts, updateuserstatusflag, updateContactStatusFlag, getTotalFavoriteContacts, getTotalContacts, getToatlGroupos } = require("../../controllers/admin/adminControllers");
const { auth } = require("googleapis/build/src/apis/abusiveexperiencereport");
const isAuthenticated = require("../../middleware/verifytoken");
const adminRouter = express.Router();

adminRouter.get("/allUserList", isAuthenticated ,getAllUsers);
adminRouter.get("/allUserContacts", isAuthenticated ,getAllUserContacts);
adminRouter.put("/updateuserStatus/:id", isAuthenticated, updateuserstatusflag); // http://localhost:5000/contacts/updatecontactstatus/67d3c588a34c8951eab08b1f
adminRouter.put("/updateContactStatus/:id", isAuthenticated, updateContactStatusFlag); // http://localhost:5000/contacts/updatecontactstatus/67d3c588a34c8951eab08b1f
adminRouter.get("/getFavoriteContact", isAuthenticated, getTotalFavoriteContacts); // http://localhost:5000/contacts/getContactTotalCount
adminRouter.get("/getContactTotalCount", isAuthenticated, getTotalContacts); // http://localhost:5000/contacts/getContactTotalCount
adminRouter.get("/gettotalgroups", isAuthenticated, getToatlGroupos); // http://localhost:5000/contacts/getContactTotalCount


module.exports = adminRouter