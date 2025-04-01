const express = require("express");
const { createGroup, getGroupsByUser, getGroupById, updateGroup, deletegroup, updategroupstatusflag, getToatlGroupos } = require("../controllers/groupController");
const isAuthenticated = require("../middleware/verifytoken");
const groupRouter = express.Router();

groupRouter.post("/creategroup", isAuthenticated, createGroup);    //   http://localhost:5000/groups/creategroup
groupRouter.get("/getgroups", isAuthenticated,getGroupsByUser);    //   http://localhost:5000/groups/getgroups
groupRouter.get("/getgroupbyid/:id", isAuthenticated,getGroupById); //  http://localhost:5000/groups/getgroupbyid/67dea341e5105cf79552aa40
groupRouter.put("/updategroup/:id", isAuthenticated, updateGroup);  //  http://localhost:5000/groups/updategroup/67dea341e5105cf79552aa40
groupRouter.delete("/deletegroup/:id", isAuthenticated,deletegroup); // http://localhost:5000/groups/deletegroup/67dea341e5105cf79552aa40
groupRouter.put("/updategroupstatus/:id", isAuthenticated, updategroupstatusflag); // http://localhost:5000/groups/updategroupstatus/67d3c588a34c8951eab08b1f
groupRouter.get("/gettotalgroups", isAuthenticated,getToatlGroupos);



module.exports = groupRouter;