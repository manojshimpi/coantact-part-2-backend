const UserContact = require("../models/UserContact");
const axios = require('axios');  // Assuming you're using axios for HTTP requests
const { google } = require('googleapis');
const addContact = async (req, res) => {
    try {
        const { name, email, mobile, category , phoneNumber, countryName, countryCode, dialCode } = req.body;
        console.log("Adding contact:", req.body);
        if (!name || !email || !phoneNumber) {
            return res.status(400).json({ status: '400', message: "Name, email, and mobile are required" });
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({ status: '400', message: "Invalid email format" });
        }

       

        const duplicateContact = await UserContact.findOne({
            $or: [
                { email: email, user: req.user._id },
                { mobile: mobile, user: req.user._id },
                { name: name, user: req.user._id }
            ]
        });

        if (duplicateContact) {
            return res.status(400).json({ status: '400', message: "A contact with the same email, mobile, or name already exists." });
        }

        const newContact = new UserContact({
            name,
            email,
            mobile,
            category,
            mobile: phoneNumber,
            countryName,
            countryCode,
            dialCode,
            user: req.user._id
        });

        await newContact.save();

        res.status(201).json({status: '201', message: "Contact added successfully" });

    } catch (error) {
        console.error("Error adding contact:", error);
        res.status(500).json({ message: "Server error" });
    }
};


// const getContactsByUser = async (req, res) => {
//     try {
//         const { page = 1, name = '', email = '', mobile = '', category = '', status = '' , sortBy = 'name', sortOrder = 'asc' } = req.query;

//         const limitNum = 25;
//         const pageNum = parseInt(page, 10);
//         const skip = (pageNum - 1) * limitNum;

//         const filter = {};
//         if (name) filter.name = { $regex: name, $options: 'i' };
//         if (email) filter.email = { $regex: email, $options: 'i' };
//         if (category) filter.category = { $regex: category, $options: 'i' };
//         if(status) filter.status = { $regex: status, $options: 'i' };
//         if (mobile) filter.mobile = { $regex: mobile, $options: 'i' };

//         const sort = {};
//         sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

//         const contacts = await UserContact.find({ user: req.user._id, ...filter })
//             .skip(skip)
//             .limit(limitNum)
//             .sort(sort);

//         const totalContacts = await UserContact.countDocuments({ user: req.user._id, ...filter });

//         const totalPages = Math.ceil(totalContacts / limitNum);

//         res.status(200).json({
//             contacts,
//             pagination: {
//                 currentPage: pageNum,
//                 totalPages,
//                 totalContacts,
//                 limit: limitNum,
//             },
//         });
//     } catch (error) {
//         console.error("Error fetching contacts:", error);
//         res.status(500).json({ message: "Server error" });
//     }
// };

// ADD Conatct BY USER FROM GOOGLE
const oauth2ContactClient = new google.auth.OAuth2(
    process.env.CLIENT_ID_CONTACT,  // User's Client ID
    process.env.CLIENT_SECRET_CONTACT,  // User's Client Secret
    process.env.REDIRECT_URI_CONTACT
  );

  const SCOPES = ['https://www.googleapis.com/auth/contacts.readonly'];

  const retryRequest = async (fn, retries = 3, delay = 1000) => {
    try {
        return await fn();
    } catch (error) {
        if (retries <= 0) throw error;
        console.log(`Retrying request... Attempts left: ${retries}`);
        await new Promise(resolve => setTimeout(resolve, delay));
        return retryRequest(fn, retries - 1, delay * 2); // Exponential backoff
    }
};

// OAuth2 authentication endpoint
const authGoogle = (req, res) => {
    //console.log("Authenticating with Google... " + req.user._id);
    // Generate the authorization URL for Google OAuth2
    const authUrl = oauth2ContactClient.generateAuthUrl({
        access_type: 'offline',
        scope: SCOPES,
    });
    res.redirect(authUrl);
};

// OAuth2 callback endpoint
const oauth2Callbacks = async (req, res) => {
    //console.log("Authenticating with Google111... " + req.user._id);
    const code = req.query.code;
    console.log("Callback with code: " + code);
    
    try {
        // Get tokens
        const user_id = '67e3b65388c672a7ee2a313f';
        const { tokens } = await oauth2ContactClient.getToken(code);
        oauth2ContactClient.setCredentials(tokens);

        // Get Google Contacts API service
        const people = google.people({ version: 'v1', auth: oauth2ContactClient });

        let contacts = [];
        let nextPageToken = null;

        // Function to get contacts from the Google People API
        const getContacts = async () => {
            return people.people.connections.list({
                resourceName: 'people/me',
                personFields: 'names,emailAddresses,phoneNumbers',
                pageSize: 100,  // Adjust the page size if needed
                pageToken: nextPageToken,  // Pass the nextPageToken for pagination
            });
        };

        // Loop to get all contacts (handling pagination)
        do {
            const response = await retryRequest(getContacts);  // Retry if the request fails
            contacts = contacts.concat(response.data.connections || []);
            nextPageToken = response.data.nextPageToken;
        } while (nextPageToken);  // Continue until no more pages are available

        // Process and store contacts in MongoDB
        for (const contact of contacts) {
            const name = contact.names ? contact.names[0].displayName : 'N/A';
            const emails = contact.emailAddresses ? contact.emailAddresses.map(email => email.value) : [];
            const mobile = contact.phoneNumbers ? contact.phoneNumbers.map(phone => phone.value) : [];

            // Debugging: Log contact data before processing
            console.log('Processing contact:', { name, emails, mobile });

            // Check if the contact already exists (by email or phone number)
            let existingContact = null;

            // Check by email first (if email exists)
            if (emails.length > 0) {
                existingContact = await UserContact.findOne({ emails: { $in: emails } });
            }

            // If no contact is found by email, check by phone number
            if (!existingContact && mobile.length > 0) {
                existingContact = await UserContact.findOne({ mobile: { $in: mobile } });
            }

            // If contact already exists, skip saving
            if (existingContact) {
                console.log(`Skipping duplicate contact: ${name}`);
                continue;  // Skip this iteration and don't save the duplicate contact
            }

            // Check that the name, emails, and mobile are not empty before saving
            
                // Create and save the contact if it's not a duplicate and values are not empty
                const newContact = new UserContact({
                    name,
                    email: emails[0], // Storing only the first email
                    mobile: mobile[0], // Storing only the first phone number
                    countryName: 'India',  // Default value set to India
                    countryCode: 'IN',     // Default country code for India
                    dialCode: '+91',       // Default dial code for India
                    category: 'Personal',   // Default category
                    user: '67e3b65388c672a7ee2a313f',    // Assuming you have a user object attached to the request
                });

                try {
                    // Attempt to save the new contact
                    await newContact.save();
                    console.log(`Saved new contact: ${name}`);
                } catch (error) {
                    console.error('Error saving contact:', error);
                }
            
        }

        res.send('All contacts have been processed and saved to MongoDB!');
    } catch (error) {
        console.error('Error processing contacts:', error);
        res.status(500).send('Error retrieving or saving contacts');
    }
};


const getContactsByUser = async (req, res) => {
    
    try {
        const { page = 1, name = '', email = '', mobile = '', category = '', status = '', sortBy = 'name', sortOrder = 'asc', isFavorite = '' } = req.query;

        const limitNum = 25;
        const pageNum = parseInt(page, 10);
        const skip = (pageNum - 1) * limitNum;

        const filter = {};
        
        if (isFavorite === 'YES') {
            filter.isFavorite = 'YES'; 
        } else if (isFavorite === 'NO') {
            filter.isFavorite = 'NO'; 
        }

        
        if (name) filter.name = { $regex: name, $options: 'i' };
        if (email) filter.email = { $regex: email, $options: 'i' };
        if (category) filter.category = { $regex: category, $options: 'i' };
        if (status) filter.status = { $regex: status, $options: 'i' };
        if (mobile) filter.mobile = { $regex: mobile, $options: 'i' };

        const sort = {};
        sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

        const contacts = await UserContact.find({ user: req.user._id, ...filter })
            .skip(skip)
            .limit(limitNum)
            .sort(sort);

        const totalContacts = await UserContact.countDocuments({ user: req.user._id, ...filter });

        const totalPages = Math.ceil(totalContacts / limitNum);

       
        if (isFavorite === 'YES' && totalContacts === 0) {
            return res.status(200).json({
                message: 'No favorite contacts available.',
                contacts: [],
                pagination: {
                    currentPage: pageNum,
                    totalPages,
                    totalContacts,
                    limit: limitNum,
                },
            });
        }

        res.status(200).json({
            contacts,
            pagination: {
                currentPage: pageNum,
                totalPages,
                totalContacts,
                limit: limitNum,
            },
        });
    } catch (error) {
        console.error("Error fetching contacts:", error);
        res.status(500).json({ message: "Server error" });
    }
};



const getcontactsByGroup = async (req, res) => {
    try {
        const { page = 1, name = '', email = '', mobile = '', category = '', status = 'active', sortBy = 'name', sortOrder = 'asc' } = req.query;

        const limitNum = 25;
        const pageNum = parseInt(page, 10);
        const skip = (pageNum - 1) * limitNum;

        const filter = { status: 'Active' };  // Only show active contacts
        
        if (name) filter.name = { $regex: name, $options: 'i' };
        if (email) filter.email = { $regex: email, $options: 'i' };
        if (category) filter.category = { $regex: category, $options: 'i' };
        if (mobile) filter.mobile = { $regex: mobile, $options: 'i' };

        const sort = {};
        sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

        const contacts = await UserContact.find({ user: req.user._id, ...filter })
            .skip(skip)
            .limit(limitNum)
            .sort(sort);

        const totalContacts = await UserContact.countDocuments({ user: req.user._id, ...filter });

        const totalPages = Math.ceil(totalContacts / limitNum);

        res.status(200).json({
            contacts,
            pagination: {
                currentPage: pageNum,
                totalPages,
                totalContacts,
                limit: limitNum,
            },
        });
    } catch (error) {
        console.error("Error fetching contacts:", error);
        res.status(500).json({ message: "Server error" });
    }
};




const updatecontact = async (req, res) => {
    const { id } = req.params;
    const user_id = req.user._id;
    const { name, email, mobile, category , countryName, countryCode, dialCode } = req.body;
    //console.log("Updating contact:", req.body);
    try {
        if (!name || !email || !mobile) {
            return res.status(400).json({ status: '400', message: "Name, email, and mobile are required" });
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({ status: '400', message: "Invalid email format" });
        }

        

        const contact = await UserContact.findOne({ _id: id, user: user_id });
        if (!contact) {
            return res.status(404).json({ status: '404', message: "Contact not found" });
        }

        const duplicateEmail = await UserContact.findOne({
            email: email,
            user: user_id,
            _id: { $ne: id }
        });

       

        if (duplicateEmail) {
            return res.status(400).json({ status: '400', message: "A contact with the same email already exists." });
        }

        const duplicateMobile = await UserContact.findOne({
            mobile: mobile,
            user: user_id,
            _id: { $ne: id }
        });

        if (duplicateMobile) {
            return res.status(400).json({ status: '400', message: "A contact with the same mobile number already exists." });
        }

        const duplicateName = await UserContact.findOne({
            name: name,
            user: user_id,
            _id: { $ne: id }
        });

        if (duplicateName) {
            return res.status(400).json({ status: '400', message: "A contact with the same name already exists." });
        }
        
        contact.name = name;
        contact.email = email;
        contact.mobile = mobile,
        contact.countryName = countryName,
        contact.countryCode = countryCode,
        contact.dialCode = dialCode
        contact.category = category;

        await contact.save();

        res.status(200).json({ status: '200', message: "Contact updated successfully" });

    } catch (error) {
        console.error("Error updating contact:", error);
        res.status(500).json({ message: "Server error" });
    }
};

const isFavorite = async (req, res) => {
    const { id } = req.params;

    try {
        const contact = await UserContact.findById(id);
        
        if (!contact) {
            return res.status(404).json({ message: "Contact not found" });
        }

        contact.isFavorite = contact.isFavorite === 'YES' ? 'NO' : 'YES';

        await contact.save();

        res.status(200).json({ message: "Contact favorite status updated successfully" });

    } catch (error) {
        console.error("Error updating contact:", error);
        res.status(500).json({ message: "Server error" });
    }
};

const deletecontact = async (req, res) => {
    const { id } = req.params;
    try {
        const contact = await UserContact.findByIdAndDelete(id);
        if (!contact) {
            return res.status(404).json({ message: "Contact not found" });
        }
        res.status(200).json({ message: "Contact deleted successfully" });
    } catch (error) {
        console.error("Error deleting contact:", error);
        res.status(500).json({ message: "Server error" });
    }
};

const getContactById = async (req, res) => {
    const { id } = req.params;
    const user_id = req.user._id
    try {
        const contact = await UserContact.findOne({ _id:id, user:user_id }).select("-createdAt");

        if (!contact) {
            return res.status(404).json({  status: '404', message: "Contact not found" });
        }
        res.status(200).json(contact);
    } catch (error) {
        console.error("Error fetching contact:", error);
        res.status(500).json({ status: '500', message: "Server error" });
    }
};

const updatecontactstatusflag = async (req, res) => {
    const { id } = req.params;
    const user_id = req.user._id; 
    const { status } = req.body;  

    try {
        const contact = await UserContact.findOne({ _id: id, user: user_id });

        if (!contact) {
            return res.status(404).json({
                status: 'error',
                message: "Contact not found"
            });
        }

        contact.status = status;
        await contact.save();

        res.status(200).json({
            status: 'success',
            message: "Contact status updated successfully"
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


// Get Toatl Conatcts By User
const getTotalContacts = async (req, res) => {
    try {
        // Count the total number of contacts for the user
        const totalContacts = await UserContact.countDocuments({ user: req.user._id });

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
    try {
        // Count the total number of favorite contacts for the user
        const totalFavoriteContacts = await UserContact.countDocuments({ 
            user: req.user._id, 
            isFavorite: 'YES' 
        });

        res.status(200).json({
            totalFavoriteContacts,
        });
    } catch (error) {
        console.error("Error fetching total favorite contacts:", error);
        res.status(500).json({ message: "Server error" });
    }
};


module.exports = { authGoogle,oauth2Callbacks , addContact, getContactsByUser , updatecontact, deletecontact , getContactById, updatecontactstatusflag,isFavorite , getcontactsByGroup, getTotalContacts ,getTotalFavoriteContacts};
