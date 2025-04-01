const ContactAssignGroups = require("../../models/ContactAssignGroup");
const Group = require("../../models/Group");
const UserContact = require("../../models/UserContact");
const UserModel = require("../../models/UserModel");

const getAllUsers = async (req, res) => {
    try {

        if (!req.user || !req.user._id) {
            return res.status(400).json({ message: 'User ID is missing or unauthorized' });
        }
        const { page = 1, name = '', email = '', role = '', status = '', sortBy = 'name', sortOrder = 'asc' } = req.query;

        const limitNum = 25;
        const pageNum = parseInt(page, 10);
        const skip = (pageNum - 1) * limitNum;

        const filter = {};

        // Apply filters based on query parameters
        if (name) filter.name = { $regex: name, $options: 'i' };
        if (email) filter.email = { $regex: email, $options: 'i' };
        if (role) filter.role = { $regex: role, $options: 'i' };
        if (status) filter.status = { $regex: status, $options: 'i' };

        // Sorting logic
        const sort = {};
        sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

        // Fetch users from the database with pagination, filters, and sorting
        const users = await UserModel.find(filter).select('-password')
            .skip(skip)
            .limit(limitNum)
            .sort(sort);

        // Get the total number of users that match the filter criteria
        const totalUsers = await UserModel.countDocuments(filter);

        // Calculate total pages for pagination
        const totalPages = Math.ceil(totalUsers / limitNum);

        res.status(200).json({
            users,
            pagination: {
                currentPage: pageNum,
                totalPages,
                totalUsers,
                limit: limitNum,
            },
        });
    } catch (error) {
        console.error("Error fetching users:", error);
        res.status(500).json({ message: "Server error" });
    }
};


// All Contact 

const getAllUserContacts = async (req, res) => {
    try {
       
        // Check if the user is authorized
        if (!req.user || !req.user._id) {
            return res.status(400).json({ message: 'User ID is missing or unauthorized' });
        }

        const { page = 1, name = '', email = '', mobile = '', status = '', category = '', sortBy = 'name', sortOrder = 'asc' } = req.query;

        const limitNum = 25;
        const pageNum = parseInt(page, 10);
        const skip = (pageNum - 1) * limitNum;

        const filter = {};

        // Apply filters based on query parameters
        if (name) filter.name = { $regex: name, $options: 'i' };
        if (category) filter.category = { $regex: category, $options: 'i' };
        if (email) filter.email = { $regex: email, $options: 'i' };
        if (mobile) filter.mobile = { $regex: mobile, $options: 'i' };
        if (status) filter.status = { $regex: status, $options: 'i' };

        // Sorting logic
        const sort = {};
        sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

        // Fetch user contacts from the database with pagination, filters, and sorting
        const userContacts = await UserContact.find(filter)
            .skip(skip)
            .limit(limitNum)
            .sort(sort);

        // Get the total number of user contacts that match the filter criteria
        const totalUserContacts = await UserContact.countDocuments(filter);

        // Calculate total pages for pagination
        const totalPages = Math.ceil(totalUserContacts / limitNum);
        console.log()
        res.status(200).json({
            userContacts,
            pagination: {
                currentPage: pageNum,
                totalPages,
                totalUsers: totalUserContacts,
                limit: limitNum,
            },
        });
    } catch (error) {
        console.error("Error fetching user contacts:", error);
        res.status(500).json({ message: "Server error" });
    }
};

// Status of User
const updateuserstatusflag = async (req, res) => {
    const { id } = req.params;
    const user_id = req.user._id; 
    const { status } = req.body;  
   
    try {
        const userStatus = await UserModel.findOne({ _id: id});

        if (!userStatus) {
            return res.status(404).json({
                status: 'error',
                message: "Contact not found"
            });
        }

        userStatus.status = status;
        await userStatus.save();

        res.status(200).json({
            status: 'success',
            message: "User status updated successfully"
        });

    } catch (error) {
        console.error("Error updating user:", error.message);
        
        res.status(500).json({
            status: 'error',
            message: "Server error",
            error: process.env.NODE_ENV === 'dev' ? error.message : 'An unexpected error occurred'
        });
    }
};


const updateContactStatusFlag = async (req, res) => {
    console.log("Contact fetched by user11: " + req.user._id);
    const { id } = req.params;
    const user_id = req.user._id; 
    const { status } = req.body;  
   
    try {
        const userStatus = await UserContact.findOne({ _id: id});

        if (!userStatus) {
            return res.status(404).json({
                status: 'error',
                message: "Contact not found"
            });
        }

        userStatus.status = status;
        await userStatus.save();

        res.status(200).json({
            status: 'success',
            message: "Contact status updated successfully"
        });

    } catch (error) {
        console.error("Error updating user:", error.message);
        
        res.status(500).json({
            status: 'error',
            message: "Server error",
            error: process.env.NODE_ENV === 'dev' ? error.message : 'An unexpected error occurred'
        });
    }
};


// Total Counts

const getTotalContacts = async (req, res) => {
    try {
        // Count the total number of contacts for the user
        const totalContacts = await UserContact.countDocuments();

        res.status(200).json({
            totalContacts,
        });
    } catch (error) {
        console.error("Error fetching total contacts:", error);
        res.status(500).json({ message: "Server error" });
    }
};

// Get Total Contacts Favorite By User

const getTotalFavoriteContacts = async (req, res) => {
    //console.log("Contact fetched by user: " + req.user._id);
    try {
        // Count the total number of favorite contacts for the user
        const totalFavoriteContacts = await UserContact.countDocuments({ isFavorite: 'YES' });

        res.status(200).json({
            totalFavoriteContacts,
        });
    } catch (error) {
        console.error("Error fetching total favorite contacts:", error);
        res.status(500).json({ message: "Server error" });
    }
};


const getToatlGroupos = async (req, res) => {
    console.log("Contact fetched by user: " + req.user._id);
    try {
        // Count the total number of favorite contacts for the user
        const totalGroupsCounts = await Group.countDocuments();

        res.status(200).json({
            totalGroupsCounts,
        });
    } catch (error) {
        console.error("Error fetching total groups:", error);
        res.status(500).json({ message: "Server error" });
    }
};
  
module.exports = { getAllUsers , getAllUserContacts , updateuserstatusflag , updateContactStatusFlag, getTotalContacts , getTotalFavoriteContacts , getToatlGroupos};
