const Group = require('../models/Group'); // Import Group model

const createGroup = async (req, res) => {
    try {
        const { groupName:name } = req.body;

        // Check if the name is provided
        if (!name) {
            return res.status(400).json({ status: '400', message: "Group name is required" });
        }

        // Check for duplicate group name (you can customize this check based on your requirements)
        const duplicateGroup = await Group.findOne({
            name: name,
            user: req.user._id // Assuming each group is associated with a user
        });

        if (duplicateGroup) {
            return res.status(400).json({ status: '400', message: "A group with the same name already exists." });
        }

        // Create new group
        const newGroup = new Group({
            name,
            user: req.user._id  // Associate the group with the logged-in user
        });

        await newGroup.save();

        res.status(201).json({ status: '201', message: "Group added successfully" });

    } catch (error) {
        console.error("Error adding group:", error);
        res.status(500).json({ message: "Server error" });
    }
};




const getGroupsByUser = async (req, res) => {
    //console.log("Group fetched by use11: " + req.user._id);
    try {
        // Extract query parameters
        const { page = 1, name = '', status = '', sortBy = 'name', sortOrder = 'asc', onlyActive = false  } = req.query;

        const limitNum = 25; // Limit for pagination
        const pageNum = parseInt(page, 10); // Current page number
        const skip = (pageNum - 1) * limitNum; // Skip calculation for pagination

        // Filter object
        const filter = {};

         // If onlyActive is true, filter by active status
         if (onlyActive === 'true') {
            filter.status = 'Active'; 
        }


        // Apply filters based on query parameters
        if (name) filter.name = { $regex: name, $options: 'i' }; // Case-insensitive search for group name
        if (status) filter.status = { $regex: status, $options: 'i' }; // Case-insensitive search for status

        // Sort configuration
        const sort = {};
        sort[sortBy] = sortOrder === 'asc' ? 1 : -1; // Sort based on provided `sortBy` and `sortOrder`

        // Query groups from the database
        const groups = await Group.find({ user: req.user._id, ...filter })
            .skip(skip)
            .limit(limitNum)
            .sort(sort);

        // Get the total number of groups that match the filters
        const totalGroups = await Group.countDocuments({ user: req.user._id, ...filter });

        // Calculate total number of pages for pagination
        const totalPages = Math.ceil(totalGroups / limitNum);

        // Return response with groups and pagination details
        res.status(200).json({
            groups,
            pagination: {
                currentPage: pageNum,
                totalPages,
                totalGroups,
                limit: limitNum,
            },
        });
    } catch (error) {
        console.error("Error fetching groups:", error);
        res.status(500).json({ message: "Server error" });
    }
};

const updategroupstatusflag = async (req, res) => {
    const { id } = req.params;
    const user_id = req.user._id; 
    const { status } = req.body;  

    try {
        const group = await Group.findOne({ _id: id, user: user_id });

        if (!group) {
            return res.status(404).json({
                status: 'error',
                message: "Contact not found"
            });
        }

        group.status = status;
        await group.save();

        res.status(200).json({
            status: 'success',
            message: "Group status updated successfully"
        });

    } catch (error) {
        console.error("Error updating contact:", error.message);
        
        res.status(500).json({
            status: 'error',
            message: "Server error",
            error: process.env.NODE_ENV === 'development' ? error.message : 'An unexpected error occurred'
        });
    }
};

const getGroupById = async (req, res) => {
    console.log("Group fetched by user11: " + req.user._id);
    const { id } = req.params;
    const user_id = req.user._id
    try {
        const contact = await Group.findOne({ _id:id, user:user_id }).select("-createdAt");

        if (!contact) {
            return res.status(404).json({  status: '404', message: "Group not found" });
        }
        res.status(200).json(contact);
    } catch (error) {
        console.error("Error fetching Group:", error);
        res.status(500).json({ status: '500', message: "Server error" });
    }
};

const updateGroup = async (req, res) => {
   
    const { id } = req.params;
    const user_id = req.user._id;
    const { name} = req.body;

    try {
        if (!name) {
            return res.status(400).json({ status: '400', message: "Name is required" });
        }
       
        const duplicategroup = await Group.findOne({
            name: name,
            user: user_id,
            _id: { $ne: id }
        });

        if (duplicategroup) {
            return res.status(400).json({ status: '400', message: "A group with the same name already exists." });
        }

        const group = await Group.findOne({ _id: id, user: user_id });

        group.name = name;
        await group.save();

        res.status(200).json({ status: '200', message: "Group updated successfully" });

    } catch (error) {
        console.error("Error updating group:", error);
        res.status(500).json({ message: "Server error" });
    }
};

const deletegroup = async (req, res) => {
    const { id } = req.params;
    try {
        const group = await Group.findByIdAndDelete(id);
        if (!group) {
            return res.status(404).json({ message: "Group not found" });
        }
        res.status(200).json({ message: "Group deleted successfully" });
    } catch (error) {
        console.error("Error deleting group:", error);
        res.status(500).json({ message: "Server error" });
    }
};

const getToatlGroupos = async (req, res) => {
    try {
        // Count the total number of favorite contacts for the user
        const totalGroupsCounts = await Group.countDocuments({ 
            user: req.user._id
        });

        res.status(200).json({
            totalGroupsCounts,
        });
    } catch (error) {
        console.error("Error fetching total groups:", error);
        res.status(500).json({ message: "Server error" });
    }
};

module.exports = { createGroup , getGroupsByUser , getGroupById , updateGroup , deletegroup , updategroupstatusflag , getToatlGroupos};

